import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../../utils/supabase';

// Admin products page (single-file, includes minimal runtime CSS injection)
// Guardar como: src/AdminPanel/pages/Products.jsx

export default function AdminProducts() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ui state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all'); // all | visible | hidden | out
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    // inject small CSS once
    if (!document.getElementById('admin-products-css')) {
      const css = `
      .ap-container{max-width:1200px;margin:0 auto}
      .ap-header{display:flex;justify-content:space-between;align-items:center;gap:16px}
      .ap-actions{display:flex;gap:8px;align-items:center}
      .ap-table{width:100%;border-collapse:collapse}
      .ap-table th, .ap-table td{padding:12px;border-bottom:1px solid #f3e7e8;text-align:left}
      .ap-badge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:12px}
      .ap-badge.green{background:#ecfff4;color:#006a31;border:1px solid #d7f9e3}
      .ap-badge.red{background:#fff0f0;color:#9b1e1e;border:1px solid #ffdada}
      .ap-thumb{width:64px;height:64px;border-radius:8px;object-fit:cover}
      .ap-controls button{background:transparent;border:0;cursor:pointer;padding:6px;border-radius:8px}
      .ap-search{display:flex;gap:8px;align-items:center}
      .ap-search input{padding:8px 10px;border-radius:8px;border:1px solid #e9e9e9}
      .ap-toolbar select, .ap-toolbar input{padding:8px;border-radius:8px;border:1px solid #e9e9e9}
      .ap-pagination{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:12px}
      @media (max-width:900px){.ap-table th:nth-child(3),.ap-table td:nth-child(3){display:none}}
      `;
      const s = document.createElement('style');
      s.id = 'admin-products-css';
      s.innerHTML = css;
      document.head.appendChild(s);
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id,title,category,price0,price1,price2,img,stockPerSize,isTrending,hasstock,isVisible')
        .order('id', { ascending: false });

      if (error) throw error;
      setAll(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching products');
      setAll([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const categories = useMemo(() => {
    const s = new Set();
    all.forEach(p => { if (p.category) s.add(String(p.category)); });
    return ['all', ...Array.from(s)];
  }, [all]);

  // derive status
  const withStatus = useMemo(() => {
    return (all || []).map(p => {
      // compute stock total
      let stockTotal = 0;
      try {
        const sp = p.stockPerSize || {};
        if (typeof sp === 'object') {
          stockTotal = Object.values(sp).reduce((s, v) => s + Number(v || 0), 0);
        }
      } catch (e) { stockTotal = 0; }

      const visible = p.isVisible === undefined ? true : Boolean(p.isVisible);
      const status = stockTotal === 0 ? 'out' : (visible ? 'visible' : 'hidden');
      return { ...p, stockTotal, computedStatus: status };
    });
  }, [all]);

  // apply filters and search
  const filtered = useMemo(() => {
    let list = [...withStatus];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (String(p.id) || '').includes(q));
    }
    if (category && category !== 'all') list = list.filter(p => String(p.category) === String(category));
    if (status && status !== 'all') list = list.filter(p => p.computedStatus === status);
    return list;
  }, [withStatus, search, category, status]);

  const total = filtered.length;
  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  // actions
  const removeProduct = async (id) => {
    if (!window.confirm('Eliminar producto? Esta acción no puede deshacerse.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setAll(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Error eliminando: ' + (err.message || err));
    }
  };

  const toggleVisibility = async (id, current) => {
    try {
      const { error } = await supabase.from('products').update({ isVisible: !current }).eq('id', id);
      if (error) throw error;
      setAll(prev => prev.map(p => p.id === id ? { ...p, isVisible: !current } : p));
    } catch (err) {
      alert('Error actualizando visibilidad: ' + (err.message || err));
    }
  };

  return (
    <div className="ap-container">
      <div className="ap-header">
        <div>
          <h1 style={{margin:0,fontSize:26}}>Gestión de Productos</h1>
          <p style={{margin:0,color:'#7a5860'}}>Administra catálogo, inventario y visibilidad</p>
        </div>

        <div className="ap-actions">
          <div className="ap-search">
            <input placeholder="Buscar por título o id" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="ap-toolbar">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas' : c}</option>)}
            </select>

            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Todos los Estados</option>
              <option value="visible">Visible</option>
              <option value="hidden">Oculto</option>
              <option value="out">Sin Stock</option>
            </select>

            <button onClick={() => { setSearch(''); setCategory('all'); setStatus('all'); setPage(1); }}>Limpiar</button>

            <button onClick={() => window.location.href = '/admin/product/new'} style={{background:'#ec131e',color:'#fff',padding:'8px 12px',borderRadius:8,border:0}}>Añadir</button>
          </div>
        </div>
      </div>

      <div style={{marginTop:16}}>
        {loading ? <p>Cargando...</p> : error ? <p style={{color:'red'}}>{error}</p> : (
          <div style={{overflowX:'auto'}}>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(p => (
                  <tr key={p.id}>
                    <td>
                      <img className="ap-thumb" src={(p.img && p.img[0]) || (Array.isArray(p.img) ? p.img[0] : p.img) || '/placeholder.jpg'} alt={p.title} />
                    </td>
                    <td>
                      <div style={{display:'flex',flexDirection:'column'}}>
                        <strong>{p.title}</strong>
                        <small style={{color:'#7a5860'}}>ID: {p.id} • {p.category || '—'}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{fontWeight:700}}>${Number(p.price0 ?? p.price ?? 0).toFixed(2)}</div>
                        <small style={{color:'#7a5860'}}>pts</small>
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {p.stockPerSize && typeof p.stockPerSize === 'object' ?
                          Object.entries(p.stockPerSize).map(([k,v]) => (
                            <span key={k} className={`ap-badge ${Number(v) > 0 ? 'green' : 'red'}`}>{k}: {v}</span>
                          )) : <span>—</span>
                        }
                      </div>
                    </td>
                    <td>
                      {p.computedStatus === 'out' ? <span className="ap-badge red">Sin Stock</span> : (p.isVisible === false ? <span className="ap-badge">Oculto</span> : <span className="ap-badge green">Visible</span>)}
                    </td>
                    <td style={{textAlign:'right'}} className="ap-controls">
                      <button title="Editar" onClick={() => window.location.href = `/admin/product/${p.id}/edit`}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button title="Toggle Visibilidad" onClick={() => toggleVisibility(p.id, p.isVisible)}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button title="Eliminar" onClick={() => removeProduct(p.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {pageItems.length === 0 && (
                  <tr><td colSpan={6}><div style={{padding:20,textAlign:'center',color:'#7a5860'}}>No hay resultados.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ap-pagination">
          <div style={{flex:1}}>
            <small>Mostrando {( (page - 1) * PAGE_SIZE) + 1} – {Math.min(page * PAGE_SIZE, total)} de {total}</small>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
            <div style={{alignSelf:'center'}}>Página {page} / {maxPages}</div>
            <button onClick={() => setPage(p => Math.min(maxPages, p + 1))} disabled={page === maxPages}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
