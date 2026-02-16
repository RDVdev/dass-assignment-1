import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const res = await axios.get(`${API_URL}/api/events/tickets/my-tickets`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setTickets(res.data);
    };

    fetchTickets();
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'merch') return tickets.filter((t) => t.type === 'Merchandise');
    if (activeTab === 'history') return tickets.filter((t) => t.event?.status === 'Closed');
    return tickets.filter((t) => t.event?.status !== 'Closed');
  }, [activeTab, tickets]);

  return (
    <div className="container">
      <h1>My Events</h1>
      <div className="tabs">
        {['upcoming', 'history', 'merch'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid">
        {filtered.map((ticket) => (
          <div key={ticket._id} className="card">
            <h3>{ticket.event?.name || 'Event'}</h3>
            <p>Status: {ticket.status}</p>
            {ticket.status === 'Confirmed' && <button className="btn">View QR Code</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
