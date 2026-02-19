import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const ResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [results, setResults] = useState({});

  const fetchRequests = async () => {
    const res = await axios.get(`${API_URL}/api/admin/reset-requests`, getAuthHeader());
    setRequests(res.data);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handle = async (id, action) => {
    try {
      const res = await axios.put(`${API_URL}/api/admin/reset-requests/${id}`, { action }, getAuthHeader());
      setResults({ ...results, [id]: res.data });
      fetchRequests();
    } catch (err) {
      setResults({ ...results, [id]: { msg: err.response?.data?.msg || 'Failed' } });
    }
  };

  return (
    <div className="container">
      <h1>Password Reset Requests</h1>
      {requests.length === 0 && <p>No pending reset requests.</p>}
      <div className="grid">
        {requests.map((r) => (
          <div key={r._id} className="card">
            <h3>{r.name}</h3>
            <p>{r.email}</p>
            <p><strong>Reason:</strong> {r.resetRequest?.reason || 'No reason'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-small" onClick={() => handle(r._id, 'approve')}>Approve</button>
              <button className="btn btn-small" style={{ background: '#b91c1c' }} onClick={() => handle(r._id, 'reject')}>Reject</button>
            </div>
            {results[r._id] && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {results[r._id].temporaryPassword
                  ? `New password: ${results[r._id].temporaryPassword}`
                  : results[r._id].msg}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResetRequests;
