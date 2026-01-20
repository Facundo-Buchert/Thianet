// src/AdminPanel/pages/Orders.jsx
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../../utils/supabase';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // all | pending | processing | shipped | canceled
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [expanded, setExpanded] = useState(null); // order id open

  // fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al traer órdenes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // derived and filtering
  const withNormalized = useMemo(() => {
    return (orders || []).map(o => {
      const created = o.created_at ? new Date(o.created_at).toLocaleString() : '—';
      // items can be array or JSON string
      let items = [];
      try {
        items = Array.isArray(o.items) ? o.items : (o.items ? JSON.parse(o.items) : []);
      } catch (e) {
        items = [];
      }
      const totalItems = items.reduce((s, it) => s + (Number(it.qty || 0)), 0);
      const totalAmount = Number(o.total ?? o.amount ?? 0);
      return { ...o, created, items, totalItems, totalAmount };
    });
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...withNormalized];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        String(o.id).includes(q) ||
        (o.mail || '').toLowerCase().includes(q) ||
        (o.name || '').toLowerCase().includes(q)
      );
    }
    if (status !== 'all') {
      list = list.filter(o => (o.status || 'pending') === status);
    }
    return list;
  }, [withNormalized, search, status]);

  const total = filtered.length;
  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  // actions
  const changeStatus = async (id, nextStatus) => {
    const prevOrders = orders;
    // optimistic update
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: nextStatus } : o)));
    try {
      const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert('Error al actualizar estado: ' + (err.message || err));
      setOrders(prevOrders); // revert
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Eliminar orden? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + (err.message || err));
    }
  };

  return (
    <div className="orders-page ap-container">
      <div className="ap-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Órdenes</h1>
          <p style={{ margin: 0, color: '#7a5860' }}>Ver y gestionar pedidos recibidos</p>
        </div>

        <div className="ap-actions">
          <div className="ap-search">
            <input
              placeholder="Buscar por ID, email o nombre"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="ap-toolbar">
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processing">En proceso</option>
              <option value="shipped">Enviado</option>
              <option value="canceled">Cancelado</option>
            </select>

            <button onClick={() => { setSearch(''); setStatus('all'); setPage(1); }} className="ap-btn-clean">Limpiar</button>
            <button onClick={fetchOrders} className="ap-btn-refresh">Refrescar</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <p>Cargando órdenes...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ap-table orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className="order-row">
                      <td style={{ width: 80 }}>{o.id}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{o.name || o.mail || '—'}</strong>
                          <small style={{ color: '#7a5860' }}>{o.mail || o.number || '—'}</small>
                        </div>
                      </td>
                      <td>{o.totalItems} item(s)</td>
                      <td>${(Number(o.totalAmount) || 0).toFixed(2)}</td>
                      <td>
                        <span className={`ap-badge ${o.status === 'shipped' ? 'green' : (o.status === 'canceled' ? 'red' : '')}`}>
                          {o.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{o.created}</td>
                      <td style={{ textAlign: 'right' }} className="ap-controls">
                        <button title="Ver detalle" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <select
                          value={o.status || 'pending'}
                          onChange={e => changeStatus(o.id, e.target.value)}
                          style={{ marginLeft: 8 }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">En proceso</option>
                          <option value="shipped">Enviado</option>
                          <option value="canceled">Cancelado</option>
                        </select>
                        <button title="Eliminar" onClick={() => deleteOrder(o.id)} style={{ marginLeft: 8 }}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>

                    {expanded === o.id && (
                      <tr className="order-detail-row">
                        <td colSpan={7}>
                          <div className="order-detail">
                            <div className="detail-left">
                              <strong>Artículos</strong>
                              {o.items && o.items.length ? (
                                <ul>
                                  {o.items.map((it, idx) => (
                                    <li key={idx}>{it.title || it.productId} — qty: {it.qty} — ${Number(it.price || it.price0 || 0).toFixed(2)}</li>
                                  ))}
                                </ul>
                              ) : <div>Ningún artículo registrado</div>}
                            </div>

                            <div className="detail-right">
                              <div><strong>Dirección</strong></div>
                              <div>{o.address || o.adress || '—'}</div>
                              <div style={{ marginTop: 8 }}><strong>Notas</strong></div>
                              <div>{o.notes || o.comment || '—'}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {pageItems.length === 0 && (
                  <tr><td colSpan={7}><div style={{ padding: 20, textAlign: 'center', color: '#7a5860' }}>No hay órdenes.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ap-pagination" style={{ marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <small>Mostrando {( (page - 1) * PAGE_SIZE) + (pageItems.length ? 1 : 0)} – {Math.min(page * PAGE_SIZE, total)} de {total}</small>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
            <div style={{ alignSelf: 'center' }}>Página {page} / {maxPages}</div>
            <button onClick={() => setPage(p => Math.min(maxPages, p + 1))} disabled={page === maxPages}>Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
