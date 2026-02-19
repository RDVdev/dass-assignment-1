import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    axios.get(`${API_URL}/api/admin/organizers`, getAuthHeader())
      .then(r => setOrganizers(r.data)).catch(() => {});
    axios.get(`${API_URL}/api/admin/reset-requests`, getAuthHeader())
      .then(r => setPendingCount(r.data.length)).catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
          <h2>{organizers.length}</h2>
          <p>Total Organizers</p>
          <Link to="/admin/organizers">Manage →</Link>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
          <h2>{organizers.filter(o => !o.disabled).length}</h2>
          <p>Active Organizers</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
          <h2 style={{ color: pendingCount > 0 ? 'var(--coral)' : 'inherit' }}>{pendingCount}</h2>
          <p>Pending Reset Requests</p>
          <Link to="/admin/reset-requests">Review →</Link>
        </div>
      </div>

      <h2>Organizer Overview</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
        </tr></thead>
        <tbody>
          {organizers.map(o => (
            <tr key={o._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '0.5rem' }}>{o.name}</td>
              <td style={{ padding: '0.5rem' }}>{o.email}</td>
              <td style={{ padding: '0.5rem' }}>
                <span style={{ color: o.disabled ? 'var(--coral)' : 'var(--green)' }}>
                  {o.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
