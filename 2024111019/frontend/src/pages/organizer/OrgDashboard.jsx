import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const OrgDashboard = () => {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/events/organizer/my-events`, getAuthHeader())
      .then((r) => setEvents(r.data));
    axios.get(`${API_URL}/api/events/organizer/analytics`, getAuthHeader())
      .then((r) => setAnalytics(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Organizer Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/organizer/create-event" className="btn" style={{ textDecoration: 'none', padding: '0.7rem 1.2rem' }}>
          + Create Event
        </Link>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>Overall Analytics (Completed Events)</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div><strong>Events:</strong> {analytics.totalEvents}</div>
            <div><strong>Registrations:</strong> {analytics.totalRegistrations}</div>
            <div><strong>Revenue:</strong> ₹{analytics.totalRevenue}</div>
            <div><strong>Attendance:</strong> {analytics.totalAttended}</div>
          </div>
        </div>
      )}

      {/* Events Carousel */}
      <h2>My Events</h2>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {events.map((e) => (
          <Link key={e._id} to={`/organizer/events/${e._id}`}
            className="card" style={{ minWidth: '250px', textDecoration: 'none', color: 'inherit' }}>
            <h3>{e.name}</h3>
            <p><strong>Type:</strong> {e.type}</p>
            <p><strong>Status:</strong> <span style={{
              color: e.status === 'Published' ? 'var(--green)' : e.status === 'Draft' ? 'var(--text-tertiary)' : 'var(--blue)'
            }}>{e.status}</span></p>
            {e.startDate && <p>{new Date(e.startDate).toLocaleDateString()}</p>}
          </Link>
        ))}
        {events.length === 0 && <p>No events yet. Create your first event!</p>}
      </div>
    </div>
  );
};

export default OrgDashboard;
