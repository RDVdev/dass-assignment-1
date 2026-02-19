import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const OrganizerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, getAuthHeader()).then((r) => {
      setProfile(r.data);
      setForm({
        name: r.data.name || '', category: r.data.category || '',
        description: r.data.description || '', contactEmail: r.data.contactEmail || r.data.email,
        contactNumber: r.data.contactNumber || '', website: r.data.website || '',
        discordWebhook: r.data.discordWebhook || ''
      });
    });
  }, []);

  const save = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, form, getAuthHeader());
      setProfile(res.data);
      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Update failed');
    }
  };

  const changePw = async () => {
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, pwForm, getAuthHeader());
      setResetMsg('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setResetMsg(err.response?.data?.msg || 'Failed');
    }
  };

  const requestReset = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/reset-request`, { reason: 'Forgot password' }, getAuthHeader());
      setResetMsg('Reset request sent to admin');
    } catch (err) {
      setResetMsg(err.response?.data?.msg || 'Failed');
    }
  };

  if (!profile) return <p className="center">Loading...</p>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container">
      <h1>Organizer Profile</h1>

      <div className="form">
        <label>Organizer Name</label>
        <input value={form.name} onChange={set('name')} />

        <label>Category</label>
        <input value={form.category} onChange={set('category')} />

        <label>Description</label>
        <textarea value={form.description} onChange={set('description')} />

        <label>Contact Email</label>
        <input value={form.contactEmail} onChange={set('contactEmail')} />

        <label>Contact Number</label>
        <input value={form.contactNumber} onChange={set('contactNumber')} />

        <label>Website</label>
        <input value={form.website} onChange={set('website')} />

        <label>Discord Webhook URL (auto-post new events)</label>
        <input value={form.discordWebhook} onChange={set('discordWebhook')} placeholder="https://discord.com/api/webhooks/..." />

        <p><strong>Login Email (non-editable):</strong> {profile.email}</p>

        <button className="btn" onClick={save}>Save Changes</button>
        {message && <p style={{ color: 'var(--green)' }}>{message}</p>}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Security</h2>
      <div className="form">
        <input type="password" placeholder="Current password" value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        <input type="password" placeholder="New password" value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        <button className="btn" onClick={changePw}>Change Password</button>
        <button className="tab" onClick={requestReset}>Request Admin Reset</button>
        {resetMsg && <p>{resetMsg}</p>}
      </div>
    </div>
  );
};

export default OrganizerProfile;
