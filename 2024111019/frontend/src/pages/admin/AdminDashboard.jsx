import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [requests, setRequests] = useState([]);

  const tokenHeader = { headers: { 'x-auth-token': localStorage.getItem('token') } };

  const fetchData = async () => {
    const [orgRes, resetRes] = await Promise.all([
      axios.get(`${API_URL}/api/admin/organizers`, tokenHeader),
      axios.get(`${API_URL}/api/admin/reset-requests`, tokenHeader)
    ]);
    setOrganizers(orgRes.data);
    setRequests(resetRes.data);
  };

  useEffect(() => {
    fetchData().catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <h2>Organizers</h2>
      <div className="grid">
        {organizers.map((o) => (
          <div className="card" key={o._id}>
            <h3>{o.name}</h3>
            <p>{o.email}</p>
          </div>
        ))}
      </div>
      <h2>Pending Reset Requests</h2>
      <div className="grid">
        {requests.map((r) => (
          <div className="card" key={r._id}>
            <h3>{r.name}</h3>
            <p>{r.email}</p>
            <p>{r.resetRequest?.reason || 'No reason provided'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
