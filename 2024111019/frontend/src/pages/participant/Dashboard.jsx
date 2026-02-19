import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const TABS = ['Upcoming', 'Normal', 'Merchandise', 'Completed', 'Cancelled'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/events/tickets/my-tickets`, getAuthHeader())
      .then((r) => setTickets(r.data));
  }, []);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'Upcoming':
        return tickets.filter((t) => t.status !== 'Cancelled' && t.status !== 'Rejected' &&
          t.event?.status !== 'Completed' && t.event?.status !== 'Closed');
      case 'Normal':
        return tickets.filter((t) => t.type === 'Registration');
      case 'Merchandise':
        return tickets.filter((t) => t.type === 'Merchandise');
      case 'Completed':
        return tickets.filter((t) => t.event?.status === 'Completed' || t.event?.status === 'Closed');
      case 'Cancelled':
        return tickets.filter((t) => t.status === 'Cancelled' || t.status === 'Rejected');
      default:
        return tickets;
    }
  }, [activeTab, tickets]);

  return (
    <div className="container">
      <h1>My Events Dashboard</h1>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p>No events in this category.</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem' }}>Event</th>
            <th>Type</th>
            <th>Organizer</th>
            <th>Status</th>
            <th>Team</th>
            <th>Ticket ID</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ticket) => (
            <tr key={ticket._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '0.5rem' }}>
                <Link to={`/events/${ticket.event?._id}`}>{ticket.event?.name || 'Event'}</Link>
              </td>
              <td>{ticket.type}</td>
              <td>{ticket.event?.organizer?.name || '-'}</td>
              <td>{ticket.status}</td>
              <td>{ticket.team?.name || '-'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{ticket.ticketId || '-'}</td>
              <td>
                {ticket.qrCode && (
                  <img src={ticket.qrCode} alt="QR" style={{ width: 40, height: 40, cursor: 'pointer' }}
                    onClick={() => {
                      const w = window.open();
                      w.document.write(`<img src="${ticket.qrCode}" style="width:300px" /><p>Ticket: ${ticket.ticketId}</p>`);
                    }} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
