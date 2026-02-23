import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const FIELD_TYPES = ['text', 'number', 'dropdown', 'checkbox', 'file'];

const EventCreate = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Normal');
  const [eligibility, setEligibility] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [limit, setLimit] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState('');

  // Merchandise-specific
  const [stock, setStock] = useState('');
  const [purchaseLimitPerUser, setPurchaseLimitPerUser] = useState('');
  const [variants, setVariants] = useState([]);

  // Custom form fields (form builder)
  const [formFields, setFormFields] = useState([]);

  // --- Variant helpers ---
  const addVariant = () => setVariants([...variants, { name: '', size: '', color: '', stock: '' }]);
  const updateVariant = (i, key, val) => {
    const v = [...variants]; v[i][key] = val; setVariants(v);
  };
  const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i));

  // --- Form field helpers ---
  const addField = () => setFormFields([...formFields, { label: '', type: 'text', required: false, options: [] }]);
  const updateField = (i, key, val) => {
    const f = [...formFields]; f[i][key] = val; setFormFields(f);
  };
  const removeField = (i) => setFormFields(formFields.filter((_, idx) => idx !== i));
  const moveField = (i, dir) => {
    const f = [...formFields];
    const j = i + dir;
    if (j < 0 || j >= f.length) return;
    [f[i], f[j]] = [f[j], f[i]];
    setFormFields(f);
  };
  const updateFieldOption = (fi, oi, val) => {
    const f = [...formFields];
    f[fi].options[oi] = val;
    setFormFields(f);
  };
  const addFieldOption = (fi) => {
    const f = [...formFields];
    f[fi].options = [...(f[fi].options || []), ''];
    setFormFields(f);
  };
  const removeFieldOption = (fi, oi) => {
    const f = [...formFields];
    f[fi].options = f[fi].options.filter((_, idx) => idx !== oi);
    setFormFields(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const body = {
      name, description, type, eligibility,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      regDeadline: registrationDeadline || undefined,
      limit: limit ? Number(limit) : undefined,
      price: price ? Number(price) : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      formFields: formFields.filter(f => f.label).map(f => ({ label: f.label, fieldType: f.type, required: f.required, options: f.options })),
      status: 'Draft',
    };
    if (type === 'Merchandise') {
      body.stock = stock ? Number(stock) : undefined;
      body.purchaseLimitPerUser = purchaseLimitPerUser ? Number(purchaseLimitPerUser) : undefined;
      body.variants = variants.filter(v => v.name).map(v => ({ ...v, stock: Number(v.stock) || 0 }));
    }
    try {
      const res = await axios.post(`${API_URL}/api/events`, body, getAuthHeader());
      setMessage('Event created! Redirecting...');
      setTimeout(() => navigate(`/organizer/events/${res.data._id}`), 1000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to create event');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 800, margin: 'auto' }}>
      <h1>Create Event</h1>
      <form onSubmit={onSubmit}>
        {/* Basic Info */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <label>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%' }} />
          <div className="form-row">
            <div className="flex-1">
              <label>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%' }}>
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
              </select>
            </div>
            <div className="flex-1">
              <label>Eligibility</label>
              <select value={eligibility} onChange={e => setEligibility(e.target.value)} style={{ width: '100%' }}>
                <option value="All">All</option>
                <option value="IIIT">IIIT Only</option>
                <option value="Non-IIIT">Non-IIIT Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates & Limits */}
        <div className="form-section">
          <h3>Dates & Limits</h3>
          <div className="form-row">
            <div className="flex-1"><label>Start Date</label><input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%' }} /></div>
            <div className="flex-1"><label>End Date</label><input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%' }} /></div>
          </div>
          <div className="form-row" style={{ marginTop: '0.5rem' }}>
            <div className="flex-1"><label>Registration Deadline</label><input type="datetime-local" value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} style={{ width: '100%' }} /></div>
            <div className="flex-1"><label>Participant Limit</label><input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="No limit" style={{ width: '100%' }} /></div>
          </div>
          <div className="form-row" style={{ marginTop: '0.5rem' }}>
            <div className="flex-1"><label>Price (₹)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 = Free" style={{ width: '100%' }} /></div>
            <div className="flex-1"><label>Tags (comma-separated)</label><input value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, music, sports" style={{ width: '100%' }} /></div>
          </div>
        </div>

        {/* Merchandise section */}
        {type === 'Merchandise' && (
          <div className="form-section">
            <h3>Merchandise Details</h3>
            <div className="form-row">
              <div className="flex-1"><label>Total Stock</label><input type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ width: '100%' }} /></div>
              <div className="flex-1"><label>Purchase Limit Per User</label><input type="number" value={purchaseLimitPerUser} onChange={e => setPurchaseLimitPerUser(e.target.value)} style={{ width: '100%' }} /></div>
            </div>
            <h4 style={{ marginTop: '1rem' }}>Variants</h4>
            {variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input placeholder="Name" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} />
                <input placeholder="Size" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} />
                <input placeholder="Color" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} />
                <input placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} style={{ width: 80 }} />
                <button type="button" onClick={() => removeVariant(i)} style={{ color: 'red' }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}>+ Add Variant</button>
          </div>
        )}

        {/* Form Builder */}
        <div className="form-section">
          <h3>Registration Form Builder</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Add custom fields that participants must fill when registering.</p>
          {formFields.map((f, i) => (
            <div key={i} className="form-field-card">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => moveField(i, 1)} disabled={i === formFields.length - 1}>↓</button>
                <input placeholder="Field label" value={f.label} onChange={e => updateField(i, 'label', e.target.value)} className="field-label-input" />
                <select value={f.type} onChange={e => updateField(i, 'type', e.target.value)} className="field-type-select">
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: '0.8rem' }}>
                  <input type="checkbox" checked={f.required} onChange={e => updateField(i, 'required', e.target.checked)} /> Req
                </label>
                <button type="button" onClick={() => removeField(i)} style={{ color: 'red' }}>✕</button>
              </div>
              {(f.type === 'dropdown' || f.type === 'checkbox') && (
                <div style={{ paddingLeft: '2rem' }}>
                  <small>Options:</small>
                  {(f.options || []).map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', alignItems: 'center' }}>
                      <input value={opt} onChange={e => updateFieldOption(i, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="field-option-input" />
                      <button type="button" onClick={() => removeFieldOption(i, oi)} style={{ color: 'red', fontSize: '0.8rem' }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addFieldOption(i)} style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}>+ Add Option</button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addField} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem' }}>+ Add Field</button>
        </div>

        <button className="btn" type="submit" style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem' }}>
          Create Event (as Draft)
        </button>
      </form>
      {message && <p className={message.includes('created') ? 'message message-success' : 'message message-error'}>{message}</p>}
    </div>
  );
};

export default EventCreate;
