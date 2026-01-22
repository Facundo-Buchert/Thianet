import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../../../utils/supabase';
import './Clients.css';

/*
  Funcionalidades principales:
  - Listado paginado de users (desde tabla `users`)
  - Búsqueda por nombre / email / userId
  - Modal de detalle que muestra cart_items, últimos pedidos y metadata
  - Botón "Banear" que intenta invocar la Edge Function "admin-ban-user"
    (la función debe existir en tu proyecto Supabase; si no existe, se muestra
     un mensaje con la instrucción para banear desde el panel).
*/

const PAGE_SIZE = 12;

export default function Clients() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // user object para modal
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null); // orders, cart parsed, etc.
  const [processingId, setProcessingId] = useState(null); // id para acciones en curso
  const [error, setError] = useState(null);

  // traer usuarios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // filtros + paginación
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.mail || '').toLowerCase().includes(q) ||
      String(u.userId || '').includes(q)
    );
  }, [users, search]);

  const total = filtered.length;
  const maxPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  // abrir modal con detalle (trae órdenes y parsea cart_items)
  const openDetail = async (user) => {
    setSelected(user);
    setDetailLoading(true);
    setDetailData(null);

    try {
      // orders recientes
      const { data: recentOrders, error: ordErr } = await supabase
        .from('orders')
        .select('id,created_at,status,total')
        .eq('clientId', user.userId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (ordErr) throw ordErr;

      // count orders
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('clientId', user.userId);

      // parse cart_items (jsonb or text)
      let cart = [];
      try {
        if (!user.cart_items) cart = [];
        else if (typeof user.cart_items === 'string') cart = JSON.parse(user.cart_items);
        else cart = user.cart_items;
      } catch (e) {
        cart = [];
      }

      setDetailData({
        recentOrders: recentOrders || [],
        ordersCount: typeof count === 'number' ? count : (recentOrders?.length || 0),
        cart,
      });
    } catch (err) {
      console.error(err);
      setDetailData({ recentOrders: [], ordersCount: 0, cart: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetailData(null);
  };

  // EXPORT CSV (simple)
  const exportCsv = () => {
    const rows = [
      ['userId','id(uuid)','name','mail','number','location','points','created_at']
    ];
    users.forEach(u => {
      rows.push([
        u.userId ?? '',
        u.id ?? '',
        (u.name ?? '').replaceAll(',', ' '),
        u.mail ?? '',
        u.number ?? '',
        u.location ?? '',
        u.points ?? 0,
        u.created_at ?? ''
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // BAN user -> intenta invocar Edge Function "admin-ban-user"
  // La función debe existir y recibir { auth_id } o { user_id } segun implementes.
  // Si no existe, informamos al admin que lo haga desde Supabase Dashboard.
  const banUser = async (user) => {
    if (!window.confirm(`Banear al usuario ${user.name || user.mail || user.userId}?`)) return;
    setProcessingId(user.id);
    setError(null);

    try {
      // Intento invocar Edge Function (requiere que la hayas creado con role admin en server-side)
      const res = await supabase.functions.invoke('admin-ban-user', {
        body: JSON.stringify({ auth_id: user.id, userId: user.userId })
      });

      // supabase.functions.invoke retorna { data, error } en v2
      if (res?.error) throw res.error;
      // marcar localmente (optimista) — puede que tu function actualice auth.users y también tu tabla users
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned_at: new Date().toISOString() } : u));
      alert('Ban realizado (o pedido enviado). Verifica en Supabase console.');
    } catch (err) {
      console.error(err);
      // si falla por no existir la función, damos instrucción clara
      if (String(err.message || err).toLowerCase().includes('not found') || String(err).includes('Function')) {
        alert('No se encontró la Edge Function "admin-ban-user". Para banear desde la consola Supabase: ve a Authentication → Users → seleccioná el usuario → "Disable user". Si querés, te genero el ejemplo de Edge Function.');
      } else {
        alert('Error al banear: ' + (err.message || err));
      }
    } finally {
      setProcessingId(null);
    }
  };  

  return (
    <div className="clients-page ap-container">
      <div className="ap-header">
        <div>
          <h1 style={{margin:0}}>Clientes</h1>
          <p style={{margin:0,color:'#7a5860'}}>Listado y gestión de usuarios</p>
        </div>

        <div className="ap-actions">
          <input
            className="clients-search"
            placeholder="Buscar por nombre, email o ID"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button onClick={exportCsv} className="ap-btn">Exportar CSV</button>
          <button onClick={fetchUsers} className="ap-btn-secondary">Refrescar</button>
        </div>
      </div>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : error ? (
        <p className="ap-error">{error}</p>
      ) : (
        <>
          <div className="clients-table-wrapper">
            <table className="ap-table clients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Ubicación</th>
                  <th>Puntos</th>
                  <th>Registrado</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(u => (
                  <tr key={u.id}>
                    <td className="mono">{u.userId}</td>
                    <td>{u.name || '—'}</td>
                    <td>{u.mail || '—'}</td>
                    <td>{u.number ?? '—'}</td>
                    <td>{u.location || '—'}</td>
                    <td>{Number(u.points || 0)}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{textAlign:'right'}} className="ap-controls">
                      <button onClick={() => openDetail(u)} title="Ver detalle">Ver</button>
                      {/*<button
                        onClick={() => banUser(u)}
                        disabled={processingId === u.id}
                        title="Banear usuario"
                        className="danger"
                      >
                        {processingId === u.id ? '...' : 'Banear'}
                      </button>*/}
                    </td>
                  </tr>
                ))}

                {pageItems.length === 0 && (
                  <tr><td colSpan={8} className="clients-empty">No se encontraron clientes</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ap-pagination">
            <div style={{flex:1}}>
              <small>Mostrando {( (page - 1) * PAGE_SIZE) + (pageItems.length ? 1 : 0)} – {Math.min(page * PAGE_SIZE, total)} de {total}</small>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Anterior</button>
              <div style={{alignSelf:'center'}}>Página {page} / {maxPages}</div>
              <button onClick={() => setPage(p => Math.min(maxPages, p+1))} disabled={page===maxPages}>Siguiente</button>
            </div>
          </div>
        </>
      )}

      {/* Detalle Modal */}
      {selected && (
        <div className="clients-modal-backdrop" role="dialog" aria-modal="true">
          <div className="clients-modal">
            <header className="clients-modal-header">
              <h3>Detalle: {selected.name || selected.mail || selected.userId}</h3>
              <br></br><br></br>
              <div className="clients-modal-actions">
                <button onClick={() => { navigator.clipboard?.writeText(selected.mail || '') }}>Copiar email</button>
                <button onClick={() => { navigator.clipboard?.writeText(selected.number || '') }}>Copiar numero</button>
                <button onClick={closeDetail} className="close">Cerrar</button>
              </div>
            </header>

            <div className="clients-modal-body">
              {detailLoading ? <p>Cargando...</p> : (
                <>
                  <section>
                    <h4>Datos</h4>
                    <hr></hr><br></br>
                    <div className="detail-row"><strong>userId:</strong> <span className="mono">{selected.userId}</span></div>
                    {/*<div className="detail-row"><strong>UUID:</strong> <span className="mono">{selected.id}</span></div>*/}
                    <div className="detail-row"><strong>Email:</strong> {selected.mail || '—'}</div>
                    <div className="detail-row"><strong>Teléfono:</strong> {selected.number || '—'}</div>
                    <div className="detail-row"><strong>Localidad:</strong> {selected.location || '—'}</div>
                    <div className="detail-row"><strong>Puntos:</strong> {selected.points ?? 0}</div>
                  </section>

                  <section>
                    <br></br>
                    <h4>Carrito</h4>
                    <br></br><hr></hr><br></br>
                    <div className="cart-preview">
                      {(() => {
                        try {
                          const cart = !selected.cart_items ? [] : (typeof selected.cart_items === 'string' ? JSON.parse(selected.cart_items) : selected.cart_items);
                          if (!cart || !cart.length) return <div className="muted">Vacío</div>;
                          return (
                            <ul>
                              {cart.map((it, idx) => <li key={idx}>{it.title || it.productId} — {it.size} — {it.qty} unidades</li>)}
                            </ul>
                          );
                        } catch (e) {
                          return <div className="muted">No se puede parsear cart_items</div>;
                        }
                      })()}
                    </div>
                  </section>

                  <section>
                    <br></br>
                    <h4>Órdenes activas</h4>
                    <br></br><hr></hr><br></br>
                    {detailData?.recentOrders?.length ? (
                      <ul className="orders-list">
                        {detailData.recentOrders.map(o => (
                          <li key={o.id}>
                            <strong>#{o.id}</strong> — {new Date(o.created_at).toLocaleString()} — <span className="mono">${Number(o.total || 0).toFixed(2)}</span> — {o.status}
                          </li>
                        ))}
                      </ul>
                    ) : <div className="muted">Sin órdenes recientes</div>}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
