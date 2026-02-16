import { useEffect, useState } from 'react';
import axios from 'axios';
import EventCard from '../../components/EventCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  const fetchEvents = async () => {
    const res = await axios.get(`${API_URL}/api/events`);
    setEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const register = async (eventId) => {
    try {
      await axios.post(
        `${API_URL}/api/events/${eventId}/register`,
        {},
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      setMessage('Registration successful');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <h1>Browse Events</h1>
      {message && <p>{message}</p>}
      <div className="grid">
        {events.map((event) => (
          <EventCard key={event._id} event={event} onRegister={register} />
        ))}
      </div>
    </div>
  );
};

export default BrowseEvents;
