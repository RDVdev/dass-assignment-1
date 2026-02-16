import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EventCreate = () => {
  const [form, setForm] = useState({ name: '', description: '', type: 'Normal', status: 'Draft' });
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post(`${API_URL}/api/events`, form, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setMessage('Event created successfully');
      setForm({ name: '', description: '', type: 'Normal', status: 'Draft' });
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to create event');
    }
  };

  return (
    <div className="container">
      <h1>Create Event</h1>
      <form onSubmit={onSubmit} className="form">
        <input
          type="text"
          placeholder="Event name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="Normal">Normal</option>
          <option value="Merchandise">Merchandise</option>
          <option value="Hackathon">Hackathon</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Closed">Closed</option>
        </select>
        <button className="btn" type="submit">
          Create
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default EventCreate;
