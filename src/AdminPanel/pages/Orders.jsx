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

  // logs
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);

  // helper to push a log entry (newest first)
  const pushLog = (text, level = 'INFO') => {
    const ts = new Date().toLocaleString();
    const entry = `[${ts}] [${level}] ${text}`;
    console.log(entry);
    setLogs(prev => [entry, ...prev].slice(0, 500));
  };

  // fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    pushLog('Solicitando órdenes al servidor', 'INFO');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      pushLog(`Órdenes cargadas: ${ (data || []).length }`, 'INFO');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al traer órdenes');
      pushLog('Error al traer órdenes: ' + (err.message || err), 'ERROR');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const closeOrders = async () => {
    if (!window.confirm('¿Desea procesar (aplicar stock y puntos) y eliminar las ordenes con estado "shipped" o "canceled"? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    pushLog('Iniciando cierre de órdenes (procesar stock/puntos y eliminar).', 'INFO');

    try {
      // 1) traer órdenes a procesar
      const { data: ordersToClose, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['shipped', 'canceled']);

      if (fetchErr) throw fetchErr;
      if (!ordersToClose || ordersToClose.length === 0) {
        pushLog('No hay órdenes con estado shipped o canceled.', 'INFO');
        alert('No hay órdenes con estado shipped o canceled.');
        setLoading(false);
        return;
      }

      pushLog(`Órdenes a procesar: ${ordersToClose.length}`, 'INFO');

      // procesar órdenes secuencialmente para minimizar condiciones de carrera simples
      for (const order of ordersToClose) {
        pushLog(`Procesando orden id=${order.id} (status=${order.status})`, 'INFO');
        try {
          // normalizar items (ya puede venir como json)
          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');

          // SOLO para órdenes 'shipped' aplicamos la baja de stock y asignación de puntos
          if (order.status === 'shipped') {
            // 2) bajar stock por cada item
            for (const it of items) {
              try {
                const productId = Number(it.productId);
                const size = (it.size || '').toString().trim();
                const qty = Number(it.qty || 0);
                if (!productId || qty <= 0 || !size) {
                  pushLog(`Ítem inválido en orden ${order.id} -> productId:${it.productId} size:${it.size} qty:${it.qty}`, 'WARN');
                  continue;
                }

                // obtener producto fresco
                const { data: prod, error: prodErr } = await supabase
                  .from('products')
                  .select('id, stockPerSize, hasstock')
                  .eq('id', productId)
                  .single();

                if (prodErr || !prod) {
                  pushLog(`No se encontró producto id=${productId} (orden ${order.id}).`, 'WARN');
                  console.warn(`No se encontró producto id=${productId} (orden ${order.id}):`, prodErr);
                  continue;
                }

                // safe clone y cálculo
                const sp = (prod.stockPerSize && typeof prod.stockPerSize === 'object') ? { ...prod.stockPerSize } : {};
                const prev = Number(sp[size] || 0);
                const next = Math.max(0, prev - qty);
                sp[size] = next;

                const stockTotal = Object.values(sp).reduce((s, v) => s + Number(v || 0), 0);
                const newHasstock = stockTotal > 0;

                const { error: updProdErr } = await supabase
                  .from('products')
                  .update({ stockPerSize: sp, hasstock: newHasstock })
                  .eq('id', productId);

                if (updProdErr) {
                  pushLog(`Error actualizando producto ${productId} (orden ${order.id}): ${updProdErr.message || JSON.stringify(updProdErr)}`, 'ERROR');
                  console.warn(`No se pudo actualizar stock producto ${productId}:`, updProdErr);
                } else {
                  pushLog(`Producto ${productId} talla ${size}: ${prev} → ${next} (orden ${order.id})`, 'INFO');
                }
              } catch (inner) {
                pushLog(`Excepción procesando item en orden ${order.id}: ${inner?.message || inner}`, 'ERROR');
                console.warn('Error procesando item para bajar stock:', inner);
              }
            } // end for items

            // 3) asignar puntos al usuario (si existe clientId)
            try {
              const clientId = order.clientId ?? null; // clientId es bigint (users.userId)
              const orderPoints = Number(order.points ?? Math.floor((Number(order.total) || 0) / 100));

              if (clientId && orderPoints > 0) {
                // obtener usuario por userId (campo userId en users)
                const { data: userRow, error: userErr } = await supabase
                  .from('users')
                  .select('id, userId, points, historypoints')
                  .eq('userId', clientId)
                  .single();

                if (userErr || !userRow) {
                  pushLog(`No se encontró usuario con userId=${clientId} para orden ${order.id}.`, 'WARN');
                  console.warn(`No se encontró usuario con userId=${clientId} para orden ${order.id}:`, userErr);
                } else {
                  const newPoints = (Number(userRow.points) || 0) + orderPoints;
                  const newHistory = (Number(userRow.historypoints) || 0) + orderPoints;

                  const { error: updUserErr } = await supabase
                    .from('users')
                    .update({ points: newPoints, historypoints: newHistory })
                    .eq('userId', clientId);

                  if (updUserErr) {
                    pushLog(`Error actualizando puntos para userId=${clientId}: ${updUserErr.message || JSON.stringify(updUserErr)}`, 'ERROR');
                    console.warn(`No se pudo actualizar puntos usuario userId=${clientId}:`, updUserErr);
                  } else {
                    pushLog(`Asignados ${orderPoints} pts a userId=${clientId} (orden ${order.id}).`, 'INFO');
                    console.log(`Asignados ${orderPoints} pts a userId=${clientId} (orden ${order.id}).`);
                  }
                }
              } else {
                pushLog(`Orden ${order.id} no tiene clientId o puntos a asignar (${orderPoints}).`, 'INFO');
              }
            } catch (uErr) {
              pushLog(`Error asignando puntos (orden ${order.id}): ${uErr?.message || uErr}`, 'ERROR');
              console.warn('Error asignando puntos:', uErr);
            }
          } // end if shipped
        } catch (ordErr) {
          pushLog(`Error procesando orden id=${order.id}: ${ordErr?.message || ordErr}`, 'ERROR');
          console.warn(`Error procesando orden id=${order.id}:`, ordErr);
          // seguir con la siguiente orden
        }
      } // end for ordersToClose

      // 4) eliminar las órdenes procesadas (shipped y canceled)
      const { error: delErr, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .in('status', ['shipped', 'canceled']);

      if (delErr) throw delErr;

      pushLog(`Órdenes eliminadas: ${count || 0}`, 'INFO');
      alert(`Proceso finalizado. Órdenes eliminadas: ${count || 0}`);
      // refrescar
      await fetchOrders();
    } catch (err) {
      console.error('Error en closeOrders:', err);
      pushLog('Error en closeOrders: ' + (err?.message || String(err)), 'ERROR');
      alert('Error al cerrar órdenes: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // derived and filtering
  const withNormalized = useMemo(() => {
    return (orders || []).map(o => {
      const created = o.created_at ? new Date(o.created_at).toLocaleString() : '—';
      // items can be array or JSON string
      let items = o.items;
      try {
        items = Array.isArray(items) ? items : JSON.parse(items || '[]');
      } catch (e) {
        items = [];
      }
      const totalItems = items.reduce((s, it) => s + (Number(it.qty || 0)), 0);
      const totalAmount = Number(o.total ?? 0);
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
    pushLog(`Actualizando estado orden ${id} → ${nextStatus}`, 'INFO');
    try {
      const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
      if (error) throw error;
      pushLog(`Estado orden ${id} actualizado a ${nextStatus}`, 'INFO');
    } catch (err) {
      pushLog(`Error al actualizar estado orden ${id}: ${err?.message || err}`, 'ERROR');
      alert('Error al actualizar estado: ' + (err.message || err));
      setOrders(prevOrders); // revert
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Eliminar orden? Esta acción no se puede deshacer.')) return;
    pushLog(`Eliminando orden ${id} (solicitado por usuario)`, 'INFO');
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
      pushLog(`Orden ${id} eliminada`, 'INFO');
    } catch (err) {
      pushLog(`Error al eliminar orden ${id}: ${err?.message || err}`, 'ERROR');
      alert('Error al eliminar: ' + (err.message || err));
    }
  };

  // log controls
  const clearLogs = () => setLogs([]);
  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.slice().reverse().join('\n'));
      pushLog('Logs copiados al portapapeles', 'INFO');
    } catch (e) {
      pushLog('No se pudo copiar logs: ' + (e?.message || e), 'ERROR');
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
            <button onClick={closeOrders} className="ap-btn-close">Cerrar ordenes</button>
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
                                    <li key={idx}>{it.title || it.productId}  ({it.qty}) → ${Number(it.unitPrice || 0).toFixed(2)} c/u</li>
                                  ))}
                                </ul>
                              ) : <div>Ningún artículo registrado</div>}
                            </div>

                            <div className="detail-right">
                              <div><strong>Dirección</strong></div>
                              <div>{o.address || o.adress || '—'}</div>
                              <div style={{ marginTop: 8 }}><strong>Notas</strong></div>
                              <div style={{ whiteSpace: 'pre-line' }}>{o.notes || o.comment || '—'}</div>
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

        {/* Logs panel */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0 }}>Logs de operaciones</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowLogs(s => !s)} className="ap-btn-clean">{showLogs ? 'Ocultar logs' : 'Mostrar logs'}</button>
              <button onClick={copyLogs} className="ap-btn-refresh">Copiar</button>
              <button onClick={clearLogs} className="ap-btn-clean">Limpiar</button>
            </div>
          </div>

          {showLogs && (
            <div style={{ marginTop: 8, maxHeight: 240, overflow: 'auto', background: '#0f1724', color: '#e6eef6', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
              {logs.length === 0 ? (
                <div style={{ color: '#9aa4ad' }}>Sin actividad registrada</div>
              ) : (
                logs.map((l, i) => <div key={i} style={{ marginBottom: 6, whiteSpace: 'pre-wrap' }}>{l}</div>)
              )}
            </div>
          )}
        </div>

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
