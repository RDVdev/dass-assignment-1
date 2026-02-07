import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'normal',
    venue: '',
    capacity: 100,
    deadline: '',
    startDate: '',
    endDate: '',
    price: 0
  });
  const [review, setReview] = useState({ ticketId: '', decision: 'approved' });
  const [qrToken, setQrToken] = useState('');

  const load = async () => {
    const [eventsRes, analyticsRes] = await Promise.all([
      api.get('/events/mine'),
      api.get('/events/organizer/analytics/summary')
    ]);

    setEvents(eventsRes.data.events || []);
    setAnalytics(analyticsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createEvent = async (e) => {
    e.preventDefault();
    await api.post('/events', newEvent);
    setNewEvent({
      title: '',
      description: '',
      type: 'normal',
      venue: '',
      capacity: 100,
      deadline: '',
      startDate: '',
      endDate: '',
      price: 0
    });
    load();
  };

  const publish = async (id) => {
    await api.patch(`/events/${id}/publish`);
    load();
  };

  const reviewPayment = async (e) => {
    e.preventDefault();
    await api.patch('/tickets/payment-review', review);
    setReview({ ticketId: '', decision: 'approved' });
  };

  const checkIn = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/tickets/check-in-qr', { qrCodeToken: qrToken });
    alert(data.message);
    setQrToken('');
    load();
  };

  return (
    <section>
      <h2>Organizer Dashboard</h2>
      {analytics && (
        <div className="card">
          <h3>Analytics</h3>
          <p>Total Events: {analytics.totalEvents}</p>
          <p>Total Registrations: {analytics.totalRegistrations}</p>
          <p>Total Revenue: Rs. {analytics.totalRevenue}</p>
        </div>
      )}

      <form className="card" onSubmit={createEvent}>
        <h3>Create Event</h3>
        <input placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required />
        <textarea placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} required />
        <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
          <option value="normal">Normal</option>
          <option value="merch">Merch</option>
        </select>
        <input placeholder="Venue" value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} />
        <input type="number" placeholder="Capacity" value={newEvent.capacity} onChange={(e) => setNewEvent({ ...newEvent, capacity: Number(e.target.value) })} />
        <input type="number" placeholder="Price" value={newEvent.price} onChange={(e) => setNewEvent({ ...newEvent, price: Number(e.target.value) })} />
        <label>Deadline</label>
        <input type="datetime-local" value={newEvent.deadline} onChange={(e) => setNewEvent({ ...newEvent, deadline: e.target.value })} required />
        <label>Start</label>
        <input type="datetime-local" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} required />
        <label>End</label>
        <input type="datetime-local" value={newEvent.endDate} onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })} required />
        <button type="submit">Create Draft Event</button>
      </form>

      <div className="grid">
        {events.map((event) => (
          <article key={event._id} className="card">
            <h3>{event.title}</h3>
            <p>Status: {event.status}</p>
            <button type="button" onClick={() => publish(event._id)}>
              Publish
            </button>
          </article>
        ))}
      </div>

      <form className="card" onSubmit={reviewPayment}>
        <h3>Payment Proof Verification</h3>
        <input placeholder="Ticket ID" value={review.ticketId} onChange={(e) => setReview({ ...review, ticketId: e.target.value })} required />
        <select value={review.decision} onChange={(e) => setReview({ ...review, decision: e.target.value })}>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
        <button type="submit">Submit Decision</button>
      </form>

      <form className="card" onSubmit={checkIn}>
        <h3>QR Scanner Check-in</h3>
        <input placeholder="Paste QR Token" value={qrToken} onChange={(e) => setQrToken(e.target.value)} required />
        <button type="submit">Check In</button>
      </form>
    </section>
  );
}
