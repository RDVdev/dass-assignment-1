import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', category: '', description: '', contactNumber: '' });
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState(null);

  const fetch = async () => {
    const res = await axios.get(`${API_URL}/api/admin/organizers`, getAuthHeader());
    setOrganizers(res.data);
  };

  useEffect(() => { fetch(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/admin/organizers`, form, getAuthHeader());
      setCreated(res.data);
      setMessage(`Organizer created! Login: ${res.data.email} / ${res.data.generatedPassword}`);
      setForm({ name: '', email: '', password: '', category: '', description: '', contactNumber: '' });
      fetch();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed');
    }
  };

  const toggle = async (id) => {
    await axios.put(`${API_URL}/api/admin/organizers/${id}/toggle`, {}, getAuthHeader());
    fetch();
  };

  const remove = async (id) => {
    if (!window.confirm('Permanently delete this organizer?')) return;
    await axios.delete(`${API_URL}/api/admin/organizers/${id}`, getAuthHeader());
    fetch();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container">
      <h1>Manage Clubs / Organizers</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>Add New Club/Organizer</h2>
        <form onSubmit={create} className="form">
          <input placeholder="Organizer Name *" value={form.name} onChange={set('name')} required />
          <input placeholder="Email *" type="email" value={form.email} onChange={set('email')} required />
          <input placeholder="Password (auto-generated if empty)" value={form.password} onChange={set('password')} />
          <input placeholder="Category" value={form.category} onChange={set('category')} />
          <textarea placeholder="Description" value={form.description} onChange={set('description')} />
          <input placeholder="Contact Number" value={form.contactNumber} onChange={set('contactNumber')} />
          <button className="btn" type="submit">Create Organizer</button>
        </form>
        {message && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
            <p>{message}</p>
          </div>
        )}
      </div>

      <h2>All Organizers</h2>
      <div className="grid">
        {organizers.map((o) => (
          <div key={o._id} className="card" style={{ opacity: o.disabled ? 0.5 : 1 }}>
            <h3>{o.name} {o.disabled ? '(Disabled)' : ''}</h3>
            <p>{o.email}</p>
            <p>{o.category || 'No category'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-small" onClick={() => toggle(o._id)}>
                {o.disabled ? 'Enable' : 'Disable'}
              </button>
              <button className="btn btn-small" style={{ background: '#b91c1c' }} onClick={() => remove(o._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageOrganizers;
