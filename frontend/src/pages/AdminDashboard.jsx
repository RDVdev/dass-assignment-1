import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AdminDashboard() {
  const [organizers, setOrganizers] = useState([]);
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    email: '',
    password: '',
    clubName: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [resetInfo, setResetInfo] = useState({ organizerId: '', token: '' });

  const load = async () => {
    const { data } = await api.get('/admin/organizers');
    setOrganizers(data.organizers || []);
  };

  useEffect(() => {
    load();
  }, []);

  const createOrganizer = async (e) => {
    e.preventDefault();
    await api.post('/admin/organizers', newOrganizer);
    setNewOrganizer({
      name: '',
      email: '',
      password: '',
      clubName: '',
      contactEmail: '',
      contactPhone: ''
    });
    load();
  };

  const deactivate = async (id) => {
    await api.patch(`/admin/organizers/${id}/deactivate`);
    load();
  };

  const requestReset = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/auth/organizer-password-reset/request', {
      organizerId: resetInfo.organizerId
    });
    setResetInfo({ ...resetInfo, token: data.resetToken });
  };

  return (
    <section>
      <h2>Admin Dashboard</h2>

      <form className="card" onSubmit={createOrganizer}>
        <h3>Add Organizer / Club</h3>
        <input placeholder="Name" value={newOrganizer.name} onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })} required />
        <input placeholder="Email" value={newOrganizer.email} onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={newOrganizer.password} onChange={(e) => setNewOrganizer({ ...newOrganizer, password: e.target.value })} required />
        <input placeholder="Club Name" value={newOrganizer.clubName} onChange={(e) => setNewOrganizer({ ...newOrganizer, clubName: e.target.value })} required />
        <input placeholder="Club Contact Email" value={newOrganizer.contactEmail} onChange={(e) => setNewOrganizer({ ...newOrganizer, contactEmail: e.target.value })} required />
        <input placeholder="Club Contact Phone" value={newOrganizer.contactPhone} onChange={(e) => setNewOrganizer({ ...newOrganizer, contactPhone: e.target.value })} />
        <button type="submit">Create Organizer</button>
      </form>

      <div className="grid">
        {organizers.map((org) => (
          <article className="card" key={org._id}>
            <h3>{org.name}</h3>
            <p>{org.email}</p>
            <p>Club: {org.profile?.clubName}</p>
            <p>Active: {String(org.isActive)}</p>
            <button type="button" onClick={() => deactivate(org._id)}>
              Deactivate
            </button>
          </article>
        ))}
      </div>

      <form className="card" onSubmit={requestReset}>
        <h3>Organizer Password Reset</h3>
        <input placeholder="Organizer ID" value={resetInfo.organizerId} onChange={(e) => setResetInfo({ ...resetInfo, organizerId: e.target.value })} required />
        <button type="submit">Generate Reset Token</button>
        {resetInfo.token && <p>Reset Token: {resetInfo.token}</p>}
      </form>
    </section>
  );
}
