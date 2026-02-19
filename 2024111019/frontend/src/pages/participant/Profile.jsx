import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';

const INTEREST_OPTIONS = [
  'Technology', 'Music', 'Art', 'Sports', 'Gaming',
  'Photography', 'Dance', 'Literature', 'Science', 'Business'
];

const Profile = () => {
  const { refreshUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [organizers, setOrganizers] = useState([]);
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, getAuthHeader()).then((r) => {
      setProfile(r.data);
      setForm({
        firstName: r.data.firstName || '', lastName: r.data.lastName || '',
        contactNumber: r.data.contactNumber || '', collegeName: r.data.collegeName || '',
        interests: r.data.interests || [], following: (r.data.following || []).map((f) => f._id || f)
      });
    });
    axios.get(`${API_URL}/api/auth/organizers`).then((r) => setOrganizers(r.data));
  }, []);

  const save = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, form, getAuthHeader());
      setProfile(res.data);
      await refreshUser();
      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Update failed');
    }
  };

  const changePw = async () => {
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, pwForm, getAuthHeader());
      setPwMsg('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.msg || 'Failed');
    }
  };

  const toggleInterest = (i) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i]
    }));
  };

  const toggleFollow = (id) => {
    setForm((f) => ({
      ...f,
      following: f.following.includes(id) ? f.following.filter((x) => x !== id) : [...f.following, id]
    }));
  };

  if (!profile) return <p className="center">Loading...</p>;

  return (
    <div className="container">
      <h1>My Profile</h1>

      <div className="form">
        <label>First Name</label>
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />

        <label>Last Name</label>
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />

        <label>Contact Number</label>
        <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />

        <label>College / Organization</label>
        <input value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} />

        <p><strong>Email (non-editable):</strong> {profile.email}</p>
        <p><strong>Participant Type (non-editable):</strong> {profile.participantType}</p>

        <label>Interests</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {INTEREST_OPTIONS.map((i) => (
            <button key={i} type="button"
              className={form.interests.includes(i) ? 'btn btn-small' : 'tab btn-small'}
              onClick={() => toggleInterest(i)}>
              {i}
            </button>
          ))}
        </div>

        <label style={{ marginTop: '1rem' }}>Followed Clubs</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {organizers.map((o) => (
            <button key={o._id} type="button"
              className={form.following.includes(o._id) ? 'btn btn-small' : 'tab btn-small'}
              onClick={() => toggleFollow(o._id)}>
              {o.name}
            </button>
          ))}
        </div>

        <button className="btn" onClick={save} style={{ marginTop: '1rem' }}>Save Changes</button>
        {message && <p style={{ color: 'var(--green)' }}>{message}</p>}
      </div>

      <h2 style={{ marginTop: '2rem' }}>Security</h2>
      <div className="form">
        <input type="password" placeholder="Current password" value={pwForm.currentPassword}
          onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        <input type="password" placeholder="New password" value={pwForm.newPassword}
          onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        <button className="btn" onClick={changePw}>Change Password</button>
        {pwMsg && <p>{pwMsg}</p>}
      </div>
    </div>
  );
};

export default Profile;
