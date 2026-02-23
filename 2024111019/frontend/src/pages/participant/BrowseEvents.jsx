import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';

const typeColor = { Normal: 'var(--blue)', Merchandise: 'var(--amber)' };
const typeBg = { Normal: 'rgba(96,165,250,0.12)', Merchandise: 'rgba(245,158,11,0.12)' };
const statusTag = { Published: 'tag-success', Completed: 'tag-blue', Draft: 'tag-warning', Cancelled: 'tag-danger' };

const BrowseEvents = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', eligibility: '', dateFrom: '', dateTo: '', followedOnly: false });

  const fetchEvents = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.type) params.set('type', filters.type);
    if (filters.eligibility) params.set('eligibility', filters.eligibility);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.followedOnly && user) {
      try {
        const me = await axios.get(`${API_URL}/api/auth/me`, getAuthHeader());
        const ids = (me.data.following || []).map(f => f._id || f).join(',');
        if (ids) params.set('followedClubs', ids);
      } catch { /* */ }
    }
    const res = await axios.get(`${API_URL}/api/events?${params.toString()}`);
    setEvents(res.data);
  };

  const fetchTrending = async () => {
    const res = await axios.get(`${API_URL}/api/events?trending=true`);
    setTrending(res.data);
  };

  useEffect(() => { fetchEvents(); fetchTrending(); }, []);
  useEffect(() => { fetchEvents(); }, [search, filters]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="hero">
        <h1>
          Discover <span className="gradient-text">Amazing</span> Events
        </h1>
        <p>Workshops, merch drops, and more — all from IIIT Hyderabad's finest clubs.</p>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        {/* Search */}
        <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
          <input
            type="text"
            placeholder="Search events, clubs, or tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1rem', padding: '14px 20px', borderRadius: 'var(--radius-lg)' }}
          />
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ justifyContent: 'center', marginBottom: 32 }}>
          <select className="pill-select" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All Types</option>
            {['Normal', 'Merchandise'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="pill-select" value={filters.eligibility} onChange={e => setFilters({ ...filters, eligibility: e.target.value })}>
            <option value="">All Eligibility</option>
            <option value="All">Everyone</option>
            <option value="IIIT">IIIT Only</option>
            <option value="Non-IIIT">Non-IIIT Only</option>
          </select>
          <input type="date" className="pill-select" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} title="From" />
          <input type="date" className="pill-select" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} title="To" />
          {user && (
            <label className="pill-checkbox">
              <input type="checkbox" checked={filters.followedOnly}
                onChange={e => setFilters({ ...filters, followedOnly: e.target.checked })} style={{ width: 'auto' }} />
              Following
            </label>
          )}
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div className="section-header">
              <h2>🔥 Trending</h2>
            </div>
            <div className="trending-scroll">
              {trending.map(e => (
                <Link key={e._id} to={`/events/${e._id}`} className="event-card card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="event-card-header">
                    <span className="tag" style={{ color: typeColor[e.type], background: typeBg[e.type], borderColor: 'transparent' }}>
                      {e.type}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: e.price ? 'var(--amber)' : 'var(--green)' }}>
                      {e.price ? `₹${e.price}` : 'Free'}
                    </span>
                  </div>
                  <div className="event-card-body">
                    <h3>{e.name}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{e.organizer?.name}</p>
                    {e.startDate && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-quaternary)', marginTop: 4 }}>{fmt(e.startDate)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div className="section-header">
          <h2>All Events</h2>
        </div>
        <div className="grid stagger">
          {events.map(event => (
            <Link key={event._id} to={`/events/${event._id}`} className="event-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="event-card-header">
                <span className="tag" style={{ color: typeColor[event.type], background: typeBg[event.type], borderColor: 'transparent' }}>
                  {event.type}
                </span>
                <span className={`tag ${statusTag[event.status] || ''}`}>{event.status}</span>
              </div>
              <div className="event-card-body">
                <h3>{event.name}</h3>
                <p style={{ fontSize: '0.8125rem', marginBottom: 8 }}>
                  {event.description?.slice(0, 90) || 'No description'}
                  {event.description?.length > 90 ? '…' : ''}
                </p>
                {event.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {event.tags.slice(0, 3).map(t => (
                      <span key={t} className="tag" style={{ fontSize: '0.6875rem', padding: '1px 8px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="event-card-footer">
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{event.organizer?.name}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: event.price ? 'var(--amber)' : 'var(--green)' }}>
                  {event.price ? `₹${event.price}` : 'Free'}
                </span>
              </div>
            </Link>
          ))}
          {events.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <h3>No events found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseEvents;
