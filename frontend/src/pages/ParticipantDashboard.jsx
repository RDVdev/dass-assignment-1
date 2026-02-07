import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ParticipantDashboard() {
  const [tab, setTab] = useState('upcoming');
  const [tickets, setTickets] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ ticketId: '', paymentProofUrl: '' });

  const load = async () => {
    const { data } = await api.get('/tickets/mine', { params: { tab } });
    setTickets(data.tickets || []);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const submitProof = async (e) => {
    e.preventDefault();
    await api.patch('/tickets/payment-proof', paymentForm);
    setPaymentForm({ ticketId: '', paymentProofUrl: '' });
    load();
  };

  return (
    <section>
      <h2>Participant Dashboard</h2>
      <div className="row">
        <button onClick={() => setTab('upcoming')} type="button">Upcoming Events</button>
        <button onClick={() => setTab('history')} type="button">History</button>
      </div>

      <div className="grid">
        {tickets.map((ticket) => (
          <article key={ticket._id} className="card">
            <h3>{ticket.event?.title}</h3>
            <p>Status: {ticket.status}</p>
            <p>Payment: {ticket.paymentStatus}</p>
            <p>Amount: Rs. {ticket.totalAmount}</p>
            <p>QR Token: {ticket.qrCodeToken}</p>
          </article>
        ))}
      </div>

      <form className="card" onSubmit={submitProof}>
        <h3>Upload Payment Proof (URL)</h3>
        <input
          placeholder="Ticket ID"
          value={paymentForm.ticketId}
          onChange={(e) => setPaymentForm({ ...paymentForm, ticketId: e.target.value })}
          required
        />
        <input
          placeholder="Proof URL"
          value={paymentForm.paymentProofUrl}
          onChange={(e) => setPaymentForm({ ...paymentForm, paymentProofUrl: e.target.value })}
          required
        />
        <button type="submit">Submit Proof</button>
      </form>
    </section>
  );
}
