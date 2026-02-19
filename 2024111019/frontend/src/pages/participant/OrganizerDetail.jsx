import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';

const OrganizerDetail = () => {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/organizers/${id}`).then((r) => setOrganizer(r.data));
    axios.get(`${API_URL}/api/events/organizer/${id}`).then((r) => setEvents(r.data));
  }, [id]);

  if (!organizer) return <p className="center">Loading...</p>;

  const now = new Date();
  const upcoming = events.filter((e) => e.status === 'Published' || (e.startDate && new Date(e.startDate) > now));
  const past = events.filter((e) => e.status === 'Completed' || e.status === 'Closed');

  return (
    <div className="container">
      <h1>{organizer.name}</h1>
      <div className="card">
        <p><strong>Category:</strong> {organizer.category || 'General'}</p>
        <p><strong>Description:</strong> {organizer.description || 'N/A'}</p>
        <p><strong>Contact:</strong> {organizer.contactEmail || organizer.email}</p>
        {organizer.website && <p><strong>Website:</strong> <a href={organizer.website}>{organizer.website}</a></p>}
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Upcoming Events</h2>
      <div className="grid">
        {upcoming.map((e) => (
          <Link key={e._id} to={`/events/${e._id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>{e.name}</h3>
            <p>{e.type} | {e.status}</p>
          </Link>
        ))}
        {upcoming.length === 0 && <p>No upcoming events.</p>}
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Past Events</h2>
      <div className="grid">
        {past.map((e) => (
          <Link key={e._id} to={`/events/${e._id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>{e.name}</h3>
            <p>{e.type} | {e.status}</p>
          </Link>
        ))}
        {past.length === 0 && <p>No past events.</p>}
      </div>
    </div>
  );
};

export default OrganizerDetail;
