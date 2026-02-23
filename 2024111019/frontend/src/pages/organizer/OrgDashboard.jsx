import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const STATUS_TABS = ['All', 'Ongoing', 'Published', 'Draft', 'Completed', 'Closed'];
const STATUS_COLORS = {
  Draft: 'var(--text-tertiary)',
  Published: 'var(--green)',
  Ongoing: 'var(--gold)',
  Completed: 'var(--blue)',
  Closed: 'var(--coral)',
};

const OrgDashboard = () => {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    axios.get(`${API_URL}/api/events/organizer/my-events`, getAuthHeader())
      .then((r) => setEvents(r.data));
    axios.get(`${API_URL}/api/events/organizer/analytics`, getAuthHeader())
      .then((r) => setAnalytics(r.data))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'All') return events;
    return events.filter((e) => e.status === activeTab);
  }, [events, activeTab]);

  const ongoingCount = useMemo(() => events.filter((e) => e.status === 'Ongoing').length, [events]);

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

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
            {tab === 'Ongoing' && ongoingCount > 0 && (
              <span className="badge badge-live" style={{ marginLeft: 6, fontSize: '0.7rem' }}>
                {ongoingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <h2>{activeTab === 'All' ? 'My Events' : `${activeTab} Events`}</h2>
      <div className="grid" style={{ paddingBottom: '0.5rem' }}>
        {filtered.map((e) => (
          <Link key={e._id} to={`/organizer/events/${e._id}`}
            className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>{e.name}</h3>
            <p><strong>Type:</strong> {e.type}</p>
            <p><strong>Status:</strong> <span style={{
              color: STATUS_COLORS[e.status] || 'var(--blue)'
            }}>{e.status}</span>
            {e.status === 'Ongoing' && <span className="badge badge-live" style={{ marginLeft: 6 }}>● LIVE</span>}
            </p>
            {e.startDate && <p>{new Date(e.startDate).toLocaleDateString()}</p>}
            {e.registrationCount > 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{e.registrationCount} registrations</p>}
          </Link>
        ))}
        {filtered.length === 0 && (
          <p style={{ gridColumn: '1/-1' }}>
            {activeTab === 'All' ? 'No events yet. Create your first event!' : `No ${activeTab.toLowerCase()} events.`}
          </p>
        )}
      </div>
    </div>
  );
};

export default OrgDashboard;
