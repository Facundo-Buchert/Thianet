import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../../utils/supabase';
import './ProductsDetail.css';

const BUCKET_NAME = 'products-img';

export default function ProductsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({});
  const [stockEntries, setStockEntries] = useState([]); // [{size, qty}]
  const [images, setImages] = useState([]); // array de URLs
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Characteristics editing state
  const [newChar, setNewChar] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    // eslint-disable-next-line
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduct(data || null);

      setForm({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        excelPrice: data.excelPrice ?? data.price0 ?? '',
        price0: data.price0 ?? '',
        price1: data.price1 ?? '',
        price2: data.price2 ?? '',
        isTrending: !!data.isTrending,
        isVisible: data.isVisible === undefined ? true : !!data.isVisible,
        characteristics: Array.isArray(data.characteristics) ? data.characteristics.slice() : [],
      });

      const sp = data.stockPerSize && typeof data.stockPerSize === 'object' ? data.stockPerSize : {};
      setStockEntries(Object.entries(sp).map(([size, qty]) => ({ size, qty: Number(qty || 0) })));

      const imgs = Array.isArray(data.img) ? data.img.slice() : (data.img ? [data.img] : []);
      setImages(imgs);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al traer producto');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // STOCK helpers
  const setStockValue = (index, key, value) => {
    setStockEntries(prev => {
      const copy = prev.map(p => ({ ...p }));
      copy[index][key] = key === 'qty' ? Number(value || 0) : value;
      return copy;
    });
  };

  const addStockRow = () => setStockEntries(prev => [...prev, { size: '', qty: 0 }]);
  const removeStockRow = (i) => setStockEntries(prev => prev.filter((_, idx) => idx !== i));

  // FILE input
  const onFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  // Upload image: upload to storage, get public url, append to product.img
  const uploadImage = async () => {
    if (!file) return setError('Seleccioná un archivo primero');
    setError(null);
    setSaving(true);

    try {
      const timestamp = Date.now();
      const cleanName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const path = `products/${id}/${timestamp}-${cleanName}`;

      const { data: upData, error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (upErr) throw upErr;

      const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
      const url = (publicData && (publicData.publicUrl || publicData.public_url)) || '';

      // leer imgs actuales desde BD (para evitar race conditions)
      const { data: prodFresh, error: pErr } = await supabase
        .from('products')
        .select('img')
        .eq('id', id)
        .single();

      if (pErr) throw pErr;

      const currentImgs = Array.isArray(prodFresh?.img) ? prodFresh.img.slice() : (prodFresh?.img ? [prodFresh.img] : []);
      const newImgs = [...currentImgs, url];

      const { error: updErr } = await supabase
        .from('products')
        .update({ img: newImgs })
        .eq('id', id);

      if (updErr) throw updErr;

      setImages(newImgs);
      setFile(null);
      setSuccess('Imagen subida');
      setTimeout(() => setSuccess(null), 1800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error subiendo imagen');
    } finally {
      setSaving(false);
    }
  };

  // Remove image from storage (if possible) and from DB array
  const removeImage = async (url) => {
    if (!window.confirm('Eliminar imagen?')) return;
    setSaving(true);
    setError(null);

    try {
      let path = null;
      try {
        const u = new URL(url);
        const marker = '/object/public/';
        const idx = u.pathname.indexOf(marker);
        if (idx >= 0) {
          const after = u.pathname.slice(idx + marker.length);
          const parts = after.split('/');
          if (parts[0] === BUCKET_NAME) {
            path = parts.slice(1).join('/');
          }
        }
      } catch (e) {
        path = null;
      }

      if (path) {
        const { error: delErr } = await supabase.storage.from(BUCKET_NAME).remove([path]);
        if (delErr) {
          console.warn('No se pudo borrar archivo del storage:', delErr.message);
        }
      }

      const { data: prodFresh, error: pErr } = await supabase
        .from('products')
        .select('img')
        .eq('id', id)
        .single();

      if (pErr) throw pErr;

      const currentImgs = Array.isArray(prodFresh?.img) ? prodFresh.img.slice() : (prodFresh?.img ? [prodFresh.img] : []);
      const newImgs = currentImgs.filter(i => i !== url);

      const { error: updErr } = await supabase
        .from('products')
        .update({ img: newImgs })
        .eq('id', id);

      if (updErr) throw updErr;

      setImages(newImgs);
      setSuccess('Imagen eliminada');
      setTimeout(() => setSuccess(null), 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error eliminando imagen');
    } finally {
      setSaving(false);
    }
  };

  // Characteristics helpers (add / edit / remove)
  const addCharacteristic = () => {
    const v = (newChar || '').toString().trim();
    if (!v) {
      setError('Característica vacía');
      return;
    }
    const existing = form.characteristics || [];
    if (existing.map(x => x.toLowerCase()).includes(v.toLowerCase())) {
      setError('Característica ya existe');
      return;
    }
    const updated = [...existing, v];
    setForm(f => ({ ...f, characteristics: updated }));
    setNewChar('');
    setError(null);
  };

  const startEditCharacteristic = (index) => {
    setEditingIndex(index);
    setEditingValue(form.characteristics?.[index] || '');
    setError(null);
  };

  const saveEditCharacteristic = () => {
    const v = (editingValue || '').toString().trim();
    if (!v) {
      setError('Característica vacía');
      return;
    }
    const existing = form.characteristics || [];
    // check duplicates except same index
    const lower = existing.map(x => x.toLowerCase());
    if (lower.some((x, i) => x === v.toLowerCase() && i !== editingIndex)) {
      setError('Otra característica con el mismo texto ya existe');
      return;
    }
    const updated = existing.map((c, i) => (i === editingIndex ? v : c));
    setForm(f => ({ ...f, characteristics: updated }));
    setEditingIndex(-1);
    setEditingValue('');
    setError(null);
  };

  const cancelEditCharacteristic = () => {
    setEditingIndex(-1);
    setEditingValue('');
    setError(null);
  };

  const removeCharacteristic = (index) => {
    if (!window.confirm('Eliminar característica?')) return;
    const existing = form.characteristics || [];
    const updated = existing.filter((_, i) => i !== index);
    setForm(f => ({ ...f, characteristics: updated }));
  };

  // SAVE product fields (not images)
  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // construir stockPerSize
      const stockObj = {};
      stockEntries.forEach(({ size, qty }) => {
        if (String(size).trim() === '') return;
        stockObj[String(size).trim()] = Number(qty || 0);
      });

      const payload = {
        title: form.title || null,
        description: form.description || null,
        category: form.category || null,
        excelPrice: form.excelPrice !== '' ? Number(form.excelPrice) : null,
        price0: form.price0 !== '' ? Number(form.price0) : null,
        price1: form.price1 !== '' ? Number(form.price1) : null,
        price2: form.price2 !== '' ? Number(form.price2) : null,
        isTrending: !!form.isTrending,
        isVisible: !!form.isVisible,
        stockPerSize: Object.keys(stockObj).length ? stockObj : null,
        characteristics: Array.isArray(form.characteristics) ? form.characteristics : [],
      };

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProduct(data);
      setSuccess('Guardado correctamente');
      setTimeout(() => setSuccess(null), 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error guardando producto');
    } finally {
      setSaving(false);
    }
  };

  // DELETE product
  const onDelete = async () => {
    if (!window.confirm('Eliminar producto definitivamente?')) return;
    setSaving(true);
    setError(null);

    try {
      // opcional: eliminar imágenes del storage
      try {
        const { data: prodFresh } = await supabase.from('products').select('img').eq('id', id).single();
        const currImgs = Array.isArray(prodFresh?.img) ? prodFresh.img : (prodFresh?.img ? [prodFresh.img] : []);
        const paths = currImgs.map(url => {
          try {
            const u = new URL(url);
            const marker = '/object/public/';
            const idx = u.pathname.indexOf(marker);
            if (idx >= 0) {
              const after = u.pathname.slice(idx + marker.length);
              const parts = after.split('/');
              if (parts[0] === BUCKET_NAME) {
                return parts.slice(1).join('/');
              }
            }
            return null;
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        if (paths.length) {
          const { error: remErr } = await supabase.storage.from(BUCKET_NAME).remove(paths);
          if (remErr) console.warn('Error al eliminar imágenes del storage:', remErr.message);
        }
      } catch (e) {
        console.warn('No se pudo limpiar storage al borrar producto', e.message || e);
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      navigate('/admin/productos');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error eliminando producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pd-container"><p>Cargando producto...</p></div>;
  if (!product) return <div className="pd-container"><p>No se encontró el producto.</p></div>;

  return (
    <div className="pd-container">
      <div className="pd-header">
        <div>
          <h2>Editar producto — ID {product.id}</h2>
          <div className="pd-subtitle">{product.title}</div>
        </div>

        <div className="pd-actions">
          <button className="btn danger" onClick={onDelete} disabled={saving}>Eliminar</button>
          <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>

      <div className="pd-grid">
        <div className="pd-col">
          <label>Título</label>
          <input value={form.title} onChange={e => onChange('title', e.target.value)} />

          <label>Categoría</label>
          <input value={form.category} onChange={e => onChange('category', e.target.value)} />

          <label>Descripción</label>
          <textarea value={form.description} onChange={e => onChange('description', e.target.value)} rows={6} />

          <label>Stock por talla</label>
          <div className="stock-rows">
            {stockEntries.map((s, i) => (
              <div key={i} className="stock-row">
                <input placeholder="Talle" value={s.size} onChange={e => setStockValue(i, 'size', e.target.value)} />
                <input type="number" min="0" placeholder="Cantidad" value={s.qty} onChange={e => setStockValue(i, 'qty', e.target.value)} />
                <button className="small" onClick={() => removeStockRow(i)}>Quitar</button>
              </div>
            ))}
            <button className="small add" onClick={addStockRow}>Agregar talle</button>
          </div>
        </div>

        <div className="pd-col">
          <label>Precio Excel</label>
          <input value={form.excelPrice} onChange={e => onChange('excelPrice', e.target.value)} />

          <label>Precio base (price0)</label>
          <input value={form.price0} onChange={e => onChange('price0', e.target.value)} />

          <label>Price1 (4-9)</label>
          <input value={form.price1} onChange={e => onChange('price1', e.target.value)} />

          <label>Price2 (=10)</label>
          <input value={form.price2} onChange={e => onChange('price2', e.target.value)} />

          <label className="checkbox-label">
            <input type="checkbox" checked={form.isTrending} onChange={e => onChange('isTrending', e.target.checked)} />
            <span>Trending</span>
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={form.isVisible} onChange={e => onChange('isVisible', e.target.checked)} />
            <span>Visible</span>
          </label>

          <div className="characteristics-section">
            <label>Características</label>

            <div className="char-list">
              {(form.characteristics || []).length === 0 && <div className="muted">Sin características</div>}

              {(form.characteristics || []).map((c, idx) => (
                <div key={idx} className="char-item">
                  {editingIndex === idx ? (
                    <>
                      <input
                        className="char-edit-input"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEditCharacteristic();
                          if (e.key === 'Escape') cancelEditCharacteristic();
                        }}
                        autoFocus
                      />
                      <div className="char-actions">
                        <button className="btn-ghost small" onClick={saveEditCharacteristic}>Guardar</button>
                        <button className="btn-ghost small" onClick={cancelEditCharacteristic}>Cancelar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="char-chip">{c}</div>
                      <div className="char-actions">
                        <button className="btn-ghost small" onClick={() => startEditCharacteristic(idx)}>Editar</button>
                        <button className="btn-ghost small danger" onClick={() => removeCharacteristic(idx)}>Eliminar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="char-add-row">
              <input
                placeholder="Agregar característica (ej: '100% algodón')"
                value={newChar}
                onChange={e => setNewChar(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCharacteristic(); }}
              />
              <button className="btn" onClick={addCharacteristic}>Añadir</button>
            </div>
          </div>

          <div className="images-section">
            <label>Imágenes</label>
            <div className="thumbnails">
              {images.map((u, idx) => (
                <div className="thumb" key={u + idx}>
                  <img src={u} alt={`img-${idx}`} />
                  <div className="thumb-actions">
                    <button className="small" onClick={() => removeImage(u)} disabled={saving}>Eliminar</button>
                  </div>
                </div>
              ))}
              {images.length === 0 && <div className="muted">Sin imágenes</div>}
            </div>

            <div className="upload-row">
              <input type="file" accept="image/*" onChange={onFileChange} />
              <button className="btn" onClick={uploadImage} disabled={!file || saving}>{saving ? 'Subiendo...' : 'Subir imagen'}</button>
            </div>
          </div>

          {error && <div className="pd-error">{error}</div>}
          {success && <div className="pd-success">{success}</div>}
        </div>
      </div>
    </div>
  );
}
