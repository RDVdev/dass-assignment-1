import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function buildGoogleCalendarLink(event) {
  const formatDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatDate(event.startDate)}/${formatDate(event.endDate)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    details: event.description,
    location: event.venue || 'Campus'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/events', { params: { q, type: type || undefined } });
        setEvents(data.events || []);
      } catch {
        setError('Failed to load events');
      }
    };

    load();
  }, [q, type]);

  const canRegister = useMemo(() => user?.role === 'participant', [user]);

  const register = async (eventId) => {
    try {
      await api.post('/tickets/register', { eventId, quantity: 1 });
      alert('Registered successfully');
    } catch (err) {
      alert(err?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <section>
      <h2>Browse Events</h2>
      <div className="row">
        <input placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="normal">Normal</option>
          <option value="merch">Merch</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {events.map((event) => (
          <article key={event._id} className="card">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p>Type: {event.type}</p>
            <p>Price: Rs. {event.price}</p>
            <p>Deadline: {new Date(event.deadline).toLocaleString()}</p>
            <div className="row">
              <a href={buildGoogleCalendarLink(event)} target="_blank" rel="noreferrer" className="btn btn-secondary">
                Add to Calendar
              </a>
              {canRegister && (
                <button onClick={() => register(event._id)} type="button">
                  Register / Buy
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
