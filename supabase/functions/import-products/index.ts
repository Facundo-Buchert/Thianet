// index.ts (Edge Function - import-products) - versión robusta
//@ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.34.0';
//@ts-ignore
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

declare const Deno: any;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // incluir headers que el SDK / navegador suele enviar
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, apikey, x-client-info, x-client-version, x-requested-with, accept, origin, referer',
    'Access-Control-Max-Age': '600',
    'Access-Control-Expose-Headers': 'Content-Length,Content-Type',
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const logs: string[] = [];
  try {
    const body = await req.json().catch(() => ({} as Record<string, any>));
    let filePath = String(body?.path || body?.file || '').trim();
    if (!filePath) {
      logs.push('Falta body.path (ruta dentro del bucket)');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SERVICE_ROLE_KEY =
      Deno.env.get('SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE') ||
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      '';
    const BUCKET = Deno.env.get('BUCKET') || Deno.env.get('IMPORT_BUCKET') || 'imports';

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      logs.push('Env missing: SUPABASE_URL or SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    if (filePath.startsWith(`${BUCKET}/`)) filePath = filePath.slice(BUCKET.length + 1);
    logs.push(`Procesando archivo: bucket='${BUCKET}' path='${filePath}'`);

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { global: { fetch } });

    // Intentos de descarga (variantes del nombre)
    async function tryDownloadFromBucket(bucket: string, path: string) {
      const attempts = [
        path,
        encodeURI(path),
        encodeURIComponent(path),
        path.replace(/\s+/g, '_'),
      ];
      for (const p of attempts) {
        logs.push(`Intentando descargar: '${p}'`);
        try {
          const { data, error } = await supabaseAdmin.storage.from(bucket).download(p);
          if (error) {
            logs.push(`download error para '${p}': ${JSON.stringify(error)}`);
            continue;
          }
          if (!data) {
            logs.push(`download OK pero sin data para '${p}'`);
            continue;
          }
          logs.push(`Descarga exitosa: '${p}'`);
          return data;
        } catch (e: any) {
          logs.push(`Excepción descargando '${p}': ${String(e?.message || e)}`);
          continue;
        }
      }

      // fallback: listar para diagnóstico
      try {
        const { data: listData, error: listErr } = await supabaseAdmin.storage.from(bucket).list('', { limit: 500 });
        if (listErr) logs.push('Error listando bucket: ' + JSON.stringify(listErr));
        else {
          const names = (listData || []).map((f: { name: string }) => f.name).slice(0, 200);
          logs.push(`Listado (primeros 200) archivos en '${bucket}': ${JSON.stringify(names)}`);
        }
      } catch (e: any) {
        logs.push('Excepción al listar bucket: ' + String(e?.message || e));
      }

      return null;
    }

    const downloadData = await tryDownloadFromBucket(BUCKET, filePath);
    if (!downloadData) {
      logs.push('Error descargando desde storage: archivo no encontrado o permisos insuficientes');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await downloadData.arrayBuffer();
    logs.push('Archivo descargado. Parseando Excel...');

    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      logs.push('Error: libro sin hojas');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    logs.push(`Filas detectadas: ${rows.length}`);
    if (!rows.length) {
      logs.push('Archivo vacío');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // headers map
    const headerMap = new Map<string,string>();
    Object.keys(rows[0] || {}).forEach(k => headerMap.set(k.toString().trim().toLowerCase(), k));
    const pick = (candidates: string[]) => {
      for (const c of candidates) {
        const key = c.toLowerCase();
        if (headerMap.has(key)) return headerMap.get(key)!;
      }
      return null;
    };

    const colCategoria = pick(['Categoría','categoria','category']);
    const colProducto = pick(['Producto','product','producto','titulo','title']);
    const colDisponible = pick(['Disponible','disponible','stock','cantidad','qty']);
    const colValor = pick(['Valor','excelPrice','precio','price','valor']);

    if (!colCategoria || !colProducto || !colDisponible || !colValor) {
      logs.push('Columnas obligatorias ausentes: Categoria, Producto, Disponible, Valor');
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // helpers
    const extractTitle = (pt: string|null) => pt ? String(pt).split(',')[0].trim() : '';
    const extractSize = (pt: string|null) => {
      if (!pt) return 'UN';
      const s = String(pt);
      let m = s.match(/T\W*[:]\W*([A-Za-z0-9]+)/i);
      if (m && m[1]) return m[1].trim();
      m = s.match(/\bT\.\s*([A-Za-z0-9]+)/i);
      if (m && m[1]) return m[1].trim();
      return 'UN';
    };

    // agrupar filas
    const groups = new Map<string, { title: string; category: string|null; excelPrice: number|null; stockPerSize: Record<string,number> }>();
    for (const r of rows) {
      const rawProducto = String(r[colProducto] ?? '').trim();
      if (!rawProducto) continue;
      const rawDisponible = String(r[colDisponible] ?? '').replace(/\s/g,'');
      const rawCategoria = String(r[colCategoria] ?? '').trim();
      const rawValor = String(r[colValor] ?? '').replace(',','.').trim();

      const title = extractTitle(rawProducto);
      const size = extractSize(rawProducto) || 'UN';
      const qty = Math.max(0, Number(rawDisponible) || 0);
      const excelPrice = rawValor === '' ? null : (Number(rawValor) || null);

      const key = `${title}||${rawCategoria}||${excelPrice ?? ''}`;
      if (!groups.has(key)) groups.set(key, { title, category: rawCategoria || null, excelPrice, stockPerSize: {} });
      const g = groups.get(key)!;
      g.stockPerSize[size] = (Number(g.stockPerSize[size] || 0) || 0) + qty;
    }

    const productsToUpsert: any[] = [];
    for (const [, v] of groups.entries()) {
      const totalStock = Object.values(v.stockPerSize).reduce((s,x) => s + Number(x||0), 0);
      productsToUpsert.push({
        title: v.title,
        category: v.category,
        excelPrice: v.excelPrice,
        stockPerSize: v.stockPerSize,
        hasstock: totalStock > 0,
        isVisible: true,
        img: [],
      });
    }
    logs.push(`Productos únicos: ${productsToUpsert.length}`);

    // reset stocks
    logs.push('Reseteando stock de todos los productos (stockPerSize -> {})');
    {
      const { error: resetErr } = await supabaseAdmin
        .from('products')
        .update({ stockPerSize: {}, hasstock: false })
        .neq('id', 0);
      if (resetErr) {
        logs.push('Error al resetear stocks: ' + resetErr.message);
        return new Response(JSON.stringify({ ok: false, logs }), {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        });
      }
    }
    logs.push('Stocks reseteados.');

    // buscar existentes por title (chunks)
    logs.push('Buscando productos existentes por título...');
    const titles = productsToUpsert.map(p => p.title);
    const CHUNK_TITLES = 50;
    const existingMap = new Map<string, any>();
    for (let i = 0; i < titles.length; i += CHUNK_TITLES) {
      const chunk = titles.slice(i, i + CHUNK_TITLES);
      const { data: dataChunk, error: selErr } = await supabaseAdmin
        .from('products')
        .select('id,title')
        .in('title', chunk);
      if (selErr) {
        logs.push('Error buscando existentes: ' + selErr.message);
        return new Response(JSON.stringify({ ok: false, logs }), {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        });
      }
      (dataChunk || []).forEach((p: any) => existingMap.set(p.title, p));
    }

    // separar inserts vs updates
    const insertsRaw: any[] = [];
    const updates: any[] = [];
    for (const p of productsToUpsert) {
      const existing = existingMap.get(p.title);
      if (existing) updates.push({ id: existing.id, ...p });
      else insertsRaw.push(p);
    }
    logs.push(`A insertar (raw): ${insertsRaw.length}, a actualizar: ${updates.length}`);

    // sanitizar y dedupe inserts
    const insertsByTitle = new Map<string, any>();
    for (const it of insertsRaw) {
      const titleKey = (it.title || '').toString().trim();
      if (!titleKey) continue;
      const { id, ...rest } = it as any;
      insertsByTitle.set(titleKey, rest);
    }
    const inserts = Array.from(insertsByTitle.values());
    logs.push(`A insertar (sanitizados y dedupe): ${inserts.length}`);

    // configuración de batches y retries
    const BATCH = Number(Deno.env.get('IMPORT_BATCH') || 100); // configurable por env
    const MAX_RETRIES = 3;

    // helper: intentar upsert por chunk con retries, y fallback per-item si falla
    async function tryUpsertChunk(table: string, chunk: any[], onConflict: string | string[] | undefined) {
      let attempt = 0;
      const conf = onConflict ? { onConflict } : undefined;
      while (attempt < MAX_RETRIES) {
        attempt++;
        try {
          const q = supabaseAdmin.from(table).upsert(chunk, conf).select();
          const { data, error } = await q;
          if (error) throw error;
          return { ok: true, data };
        } catch (err: any) {
          logs.push(`Upsert chunk error (attempt ${attempt}) - ${err?.message || String(err)}`);
          // backoff
          await sleep(300 * attempt);
        }
      }

      // fallback granular: intentar por item para aislar errores
      logs.push('FALLBACK: intentando upsert uno-a-uno para diagnosticar/fallar por item...');
      for (const item of chunk) {
        try {
          const { data, error } = await supabaseAdmin.from(table).upsert(item, conf).select();
          if (error) {
            // si falla por item, intentamos insert o update como último recurso
            logs.push(`Item upsert failed for item title='${item.title || ''}' id='${item.id || ''}': ${error.message}`);
            // intentar insert (sin id) si no tiene id
            if (!item.id) {
              const { id, ...rest } = item;
              const { data: insD, error: insErr } = await supabaseAdmin.from(table).insert(rest).select();
              if (insErr) logs.push(`Insert fallback failed for title='${item.title || ''}': ${insErr.message}`);
              else logs.push(`Insert fallback OK for title='${item.title || ''}'`);
            } else {
              // si tiene id, intentar update por id
              const { id, ...rest } = item;
              const { error: updErr } = await supabaseAdmin.from(table).update(rest).eq('id', id);
              if (updErr) logs.push(`Update fallback failed id=${id}: ${updErr.message}`);
              else logs.push(`Update fallback OK id=${id}`);
            }
          } else {
            logs.push(`Item upsert OK (one-by-one) title='${item.title || ''}'`);
          }
        } catch (e: any) {
          logs.push(`Excepción item upsert: ${String(e?.message || e)}`);
        }
      }

      return { ok: false };
    }

    // INSERTS (nuevos)
    if (inserts.length) {
      logs.push(`Insertando/Upsert nuevos (batch ${BATCH})...`);
      for (let i = 0; i < inserts.length; i += BATCH) {
        const chunk = inserts.slice(i, i + BATCH);
        // intentar onConflict por title_ci primero (si existe), sino title
        // intentaremos con 'title_ci' y si falla por constraint lo volveremos a intentar con 'title'
        let res = await tryUpsertChunk('products', chunk, 'title_ci');
        if (!res.ok) {
          logs.push('Intentando fallback onConflict: "title"');
          res = await tryUpsertChunk('products', chunk, 'title');
        }
        logs.push(`Chunk inserts procesado: ${Math.min(i + BATCH, inserts.length)} / ${inserts.length}`);
      }
    }

    // UPDATES (existentes) - usamos upsert onConflict:'id' para batch update por PK
    if (updates.length) {
      logs.push(`Actualizando existentes (batch ${BATCH})...`);
      for (let i = 0; i < updates.length; i += BATCH) {
        const chunk = updates.slice(i, i + BATCH);
        // chunk ya contiene id property
        const res = await tryUpsertChunk('products', chunk, 'id');
        if (!res.ok) {
          logs.push(`Error en upsert updates chunk ${Math.floor(i / BATCH) + 1} - se intentaron fallbacks por item.`);
        } else {
          logs.push(`Chunk actualizado (upsert by id): ${Math.floor(i / BATCH) + 1} (${chunk.length})`);
        }
      }
    }

    logs.push('Proceso finalizado correctamente.');
    return new Response(JSON.stringify({ ok: true, logs }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    // Atrapamos todo y retornamos logs completos al cliente para debug
    logs.push('Error general: ' + (err?.message || String(err)));
    try {
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, logs: ['Error generando response final'] }), { status: 500, headers: corsHeaders() });
    }
  }
});
