// src/AdminPanel/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import supabase from '../../../utils/supabase'
import './Dashboard.css'

export default function Dashboard() {
  const [bannerImage, setBannerImage] = useState(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [log, setLog] = useState([])

  // Home text state
  const [homeText, setHomeText] = useState({ id: null, text1: '', text2: '', text3: '' })
  const [loadingHome, setLoadingHome] = useState(false)
  const [savingHome, setSavingHome] = useState(false)

  // pushLog con timestamp y categoría opcional
  const pushLog = (text, category = 'INFO') => {
    const ts = new Date().toLocaleString()
    setLog(l => [`[${ts}] [${category}] ${text}`, ...l].slice(0, 200))
  }

  // obtener public url actual del banner (si existe)
  const fetchBannerUrl = () => {
    try {
      const { data } = supabase.storage.from('banners').getPublicUrl('home-banner.jpg')
      const publicUrl = (data && (data.publicUrl || data.public_url)) || ''
      if (publicUrl) setBannerPreviewUrl(publicUrl + '?v=' + Date.now())
    } catch (e) {
      pushLog('Error obteniendo publicUrl del banner: ' + (e?.message || e), 'BANNER')
    }
  }

  // Fetch home-text (primer registro)
  const fetchHomeText = async () => {
    setLoadingHome(true)
    try {
      // Traigo la primera fila (si existe)
      const { data, error } = await supabase
        .from('home-text')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116: no rows - some supabase setups return an error code on single() when no rows
        // igualmente lo logueamos
        pushLog('Error cargando home-text: ' + (error.message || JSON.stringify(error)), 'HOMETEXT')
        setHomeText({ id: null, text1: '', text2: '', text3: '' })
      } else if (data) {
        setHomeText({
          id: data.id ?? null,
          text1: data.text1 ?? '',
          text2: data.text2 ?? '',
          text3: data.text3 ?? ''
        })
        pushLog('home-text cargado (id: ' + (data.id ?? 'n/a') + ')', 'HOMETEXT')
      } else {
        // sin filas
        setHomeText({ id: null, text1: '', text2: '', text3: '' })
        pushLog('home-text no tiene filas. Podés crear una.', 'HOMETEXT')
      }
    } catch (e) {
      pushLog('Excepción leyendo home-text: ' + (e?.message || e), 'HOMETEXT')
      setHomeText({ id: null, text1: '', text2: '', text3: '' })
    } finally {
      setLoadingHome(false)
    }
  }

  useEffect(() => {
    fetchBannerUrl()
    fetchHomeText()
  }, [])

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelFile(file)
    pushLog(`Archivo listo: ${file.name}`, 'EXCEL')
  }

  const processExcel = async () => {
    if (!excelFile) {
      pushLog('No hay archivo seleccionado', 'EXCEL')
      return
    }
    setProcessing(true)
    setLog([]) // limpiar log al comenzar (si querés mantenerlo, no lo resetees)
    pushLog('Comenzando proceso de importación', 'EXCEL')

    const ts = Date.now()
    const filename = `${ts}-${excelFile.name.replace(/\s+/g, '_')}`

    try {
      pushLog('Subiendo archivo al bucket "imports"...', 'EXCEL')
      const { data: upData, error: upErr } = await supabase.storage
        .from('imports')
        .upload(filename, excelFile, { cacheControl: '3600', upsert: true })

      if (upErr) {
        pushLog('Error al subir archivo: ' + (upErr.message || JSON.stringify(upErr)), 'EXCEL')
        throw upErr
      }
      pushLog('Archivo subido: ' + JSON.stringify(upData), 'EXCEL')
      const uploadedPath = upData?.path || filename

      // opcional: listar últimos archivos (debug)
      try {
        const { data: list, error: listErr } = await supabase.storage.from('imports').list('', { limit: 50 })
        if (!listErr) pushLog('Listado (últimos): ' + JSON.stringify((list || []).slice(-6).map(f => f.name)), 'EXCEL')
      } catch (e) {
        pushLog('No se pudo listar bucket: ' + (e?.message || e), 'EXCEL')
      }

      // invocar Edge Function
      pushLog('Invocando función import-products...', 'EXCEL')
      const res = await supabase.functions.invoke('import-products', {
        body: JSON.stringify({ path: uploadedPath }),
      })

      // supabase-js puede devolver Response o { data, error }
      let payload = null
      if (res instanceof Response) {
        const text = await res.text().catch(() => '')
        try { payload = JSON.parse(text) } catch { payload = { raw: text } }
      } else if (res?.data) {
        payload = res.data
      } else {
        payload = res
      }

      if (payload?.logs && Array.isArray(payload.logs)) {
        payload.logs.forEach(l => pushLog(l, 'EXCEL'))
      } else {
        pushLog('Respuesta función: ' + JSON.stringify(payload), 'EXCEL')
      }
      pushLog('Importación finalizada', 'EXCEL')
    } catch (err) {
      pushLog('Error proceso Excel: ' + (err?.message || String(err)), 'EXCEL')
    } finally {
      setProcessing(false)
      setExcelFile(null)
    }
  }

  const handleBannerSave = async () => {
    if (!bannerImage) {
      pushLog('No hay imagen seleccionada para banner', 'BANNER')
      return
    }
    setProcessing(true)
    pushLog('Subiendo banner a "banners/home-banner.jpg" (upsert)...', 'BANNER')

    const filePath = 'home-banner.jpg'
    try {
      const { data, error } = await supabase.storage
        .from('banners')
        .upload(filePath, bannerImage, { cacheControl: '3600', upsert: true })

      if (error) {
        pushLog('Error subiendo banner: ' + (error.message || JSON.stringify(error)), 'BANNER')
        alert('Error subiendo banner: ' + (error.message || String(error)))
        return
      }

      pushLog('Upload response: ' + JSON.stringify(data || {}), 'BANNER')

      // obtener public url y forzar cache-bust
      try {
        const { data: pubData, error: pubErr } = supabase.storage.from('banners').getPublicUrl(filePath)
        if (pubErr) {
          pushLog('Error obteniendo publicUrl: ' + (pubErr.message || JSON.stringify(pubErr)), 'BANNER')
        } else {
          const publicUrl = (pubData && (pubData.publicUrl || pubData.public_url)) || ''
          if (publicUrl) {
            // cache-bust para ver el cambio inmediatamente
            const busted = publicUrl + '?v=' + Date.now()
            setBannerPreviewUrl(busted)
            pushLog('Banner público (cache-busted): ' + busted, 'BANNER')
          }
        }
      } catch (e) {
        pushLog('Error generando publicUrl: ' + (e?.message || e), 'BANNER')
      }

      alert('Banner subido correctamente.')
    } catch (err) {
      pushLog('Excepción subiendo banner: ' + (err?.message || String(err)), 'BANNER')
      alert('Error subiendo banner: ' + (err?.message || String(err)))
    } finally {
      setProcessing(false)
      setBannerImage(null)
    }
  }

  // HOMETEXT save
  const saveHomeText = async () => {
    setSavingHome(true)
    pushLog('Guardando home-text...', 'HOMETEXT')
    try {
      const payload = {
        text1: homeText.text1 ?? '',
        text2: homeText.text2 ?? '',
        text3: homeText.text3 ?? ''
      }

      if (homeText.id) {
        const { data, error } = await supabase
          .from('home-text')
          .update(payload)
          .eq('id', homeText.id)
          .select()
          .single()

        if (error) {
          pushLog('Error actualizando home-text: ' + (error.message || JSON.stringify(error)), 'HOMETEXT')
        } else {
          setHomeText({
            id: data.id ?? homeText.id,
            text1: data.text1 ?? '',
            text2: data.text2 ?? '',
            text3: data.text3 ?? ''
          })
          pushLog('home-text actualizado (id: ' + (data.id ?? homeText.id) + ')', 'HOMETEXT')
        }
      } else {
        const { data, error } = await supabase
          .from('home-text')
          .insert([payload])
          .select()
          .single()

        if (error) {
          pushLog('Error insertando home-text: ' + (error.message || JSON.stringify(error)), 'HOMETEXT')
        } else {
          setHomeText({
            id: data.id ?? null,
            text1: data.text1 ?? '',
            text2: data.text2 ?? '',
            text3: data.text3 ?? ''
          })
          pushLog('home-text creado (id: ' + (data.id ?? 'n/a') + ')', 'HOMETEXT')
        }
      }
    } catch (e) {
      pushLog('Excepción guardando home-text: ' + (e?.message || e), 'HOMETEXT')
    } finally {
      setSavingHome(false)
    }
  }

  return (
    <div className="admin-dashboard ap-container">
      <header className="admin-dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Herramientas administrativas</p>
        </div>
        <div className="admin-dashboard-actions">
          <div className="status">
            {processing ? <span className="status-processing">Procesando…</span> : <span className="status-ready">Listo</span>}
          </div>
        </div>
      </header>

      <div className="admin-modules-grid">
        <section className="admin-module">
          <h3>Cargar productos</h3>
          <p className="muted">Subí un archivo Excel para actualizar la tabla de productos (se hace parse en server).</p>

          <label className="file-input">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              disabled={processing}
            />
            <span className="file-input-text">Seleccionar archivo</span>
          </label>

          {excelFile && (
            <div className="admin-module-info">
              Archivo seleccionado: <strong>{excelFile.name}</strong>
            </div>
          )}

          <div className="module-actions">
            <button onClick={processExcel} disabled={!excelFile || processing} className="btn-primary">
              {processing ? 'Procesando...' : 'Procesar archivo'}
            </button>
          </div>
        </section>

        <section className="admin-module">
          <h3>Banner principal</h3>
          <p className="muted">Cambiá la imagen principal de la home. Se guarda como <code>banners/home-banner.jpg</code></p>

          <label className="file-input">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setBannerImage(f || null)
                if (f) {
                  // preview local inmediato
                  const tmp = URL.createObjectURL(f)
                  setBannerPreviewUrl(tmp)
                }
                if (f) pushLog('Imagen lista: ' + f.name, 'BANNER')
              }}
              disabled={processing}
            />
            <span className="file-input-text">Seleccionar imagen</span>
          </label>

          {bannerImage && (
            <div className="admin-module-info">
              Imagen seleccionada: <strong>{bannerImage.name}</strong>
            </div>
          )}

          <div className="banner-preview-row">
            <div className="banner-preview">
              {bannerPreviewUrl ? (
                // img with object-fit
                // append no extra cache for local object URLs (they are unique)
                <img src={bannerPreviewUrl} alt="Vista previa banner" />
              ) : (
                <div className="banner-empty">Sin banner aún</div>
              )}
            </div>
            <div className="module-actions">
              <button onClick={handleBannerSave} disabled={!bannerImage || processing} className="btn-primary">
                {processing ? 'Procesando...' : 'Guardar banner'}
              </button>
            </div>
          </div>
        </section>

        {/* HOMETEXT editor */}
        <section className="admin-module">
          <h3>Textos de la Home</h3>
          <p className="muted">Editá los textos que se muestran en el hero (tabla <code>home-text</code>).</p>

          <div style={{ display: 'grid', gap: 8 }}>
            <label>Texto 1 (titulo parte 1)</label>
            <input
              type="text"
              value={homeText.text1}
              onChange={e => setHomeText(ht => ({ ...ht, text1: e.target.value }))}
              disabled={loadingHome || savingHome}
            />

            <label>Texto 2 (titulo parte 2)</label>
            <input
              type="text"
              value={homeText.text2}
              onChange={e => setHomeText(ht => ({ ...ht, text2: e.target.value }))}
              disabled={loadingHome || savingHome}
            />

            <label>Texto 3 (subtítulo / párrafo)</label>
            <textarea
              rows={3}
              value={homeText.text3}
              onChange={e => setHomeText(ht => ({ ...ht, text3: e.target.value }))}
              disabled={loadingHome || savingHome}
            />

            <div className="module-actions">
              <button onClick={saveHomeText} disabled={savingHome} className="btn-primary">
                {savingHome ? 'Guardando...' : (homeText.id ? 'Actualizar textos' : 'Crear textos')}
              </button>
              <button onClick={fetchHomeText} className="btn-ghost" disabled={loadingHome}>
                {loadingHome ? 'Recargando...' : 'Recargar desde DB'}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-module admin-module-disabled">
          <h3>Próximas herramientas</h3>
          <p className="muted">
            Este espacio queda preparado para:
            <br />– promociones
            <br />– cupones
            <br />– métricas
            <br />– configuraciones generales
          </p>
        </section>
      </div>

      {/* Log card separada */}
      <section className="log-card">
        <div className="log-card-header">
          <h4>Actividad / Log</h4>
          <div className="log-controls">
            <button onClick={() => setLog([])} className="btn-ghost">Limpiar</button>
            <button onClick={() => window.open(bannerPreviewUrl || '#', '_blank')} className="btn-ghost" disabled={!bannerPreviewUrl}>Abrir banner</button>
          </div>
        </div>

        <div className="log-list">
          {log.length === 0 ? (
            <div className="muted">Sin actividad</div>
          ) : (
            log.map((l, i) => <div className="log-item" key={i}>{l}</div>)
          )}
        </div>
      </section>
    </div>
  )
}
