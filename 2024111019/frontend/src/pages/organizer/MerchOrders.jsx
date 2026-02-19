import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const MerchOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/merch-orders`, getAuthHeader());
      setOrders(res.data);
    } catch { /* */ }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleAction = async (ticketId, action) => {
    try {
      await axios.put(`${API_URL}/api/admin/merch-orders/${ticketId}`, { action }, getAuthHeader());
      setMessage(`Order ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchOrders();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Action failed');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => {
    if (filter === 'pending') return o.status === 'Pending Approval';
    if (filter === 'approved') return o.status === 'Confirmed';
    if (filter === 'rejected') return o.status === 'Rejected';
    return true;
  });

  const statusTag = (status) => {
    if (status === 'Confirmed') return 'tag-success';
    if (status === 'Rejected') return 'tag-danger';
    return 'tag-warning';
  };

  return (
    <div className="container fade-in">
      <h1>Merchandise Orders</h1>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={`tab ${filter === f ? 'tab-active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : f === 'approved' ? 'Approved' : 'Rejected'}
            {f === 'pending' && ` (${orders.filter(o => o.status === 'Pending Approval').length})`}
          </button>
        ))}
      </div>

      {message && <div className={`message ${message.includes('success') ? 'message-success' : 'message-error'}`}>{message}</div>}

      {filtered.length === 0 && <p>No orders found.</p>}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {filtered.map(order => (
          <div key={order._id} className="card card-glow">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`tag ${statusTag(order.status)}`}>{order.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 style={{ marginBottom: '0.3rem' }}>{order.event?.name || 'Event'}</h3>
                <p><strong>Buyer:</strong> {order.user?.name} ({order.user?.email})</p>
                <p><strong>Ticket ID:</strong> <span style={{ fontFamily: 'monospace' }}>{order.ticketId}</span></p>
                {order.formData && (
                  <div style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>
                    {order.formData.variant && <span className="tag" style={{ marginRight: '0.3rem' }}>Variant: {order.formData.variant}</span>}
                    {order.formData.size && <span className="tag" style={{ marginRight: '0.3rem' }}>Size: {order.formData.size}</span>}
                    {order.formData.color && <span className="tag" style={{ marginRight: '0.3rem' }}>Color: {order.formData.color}</span>}
                    <span className="tag">Qty: {order.formData.quantity || 1}</span>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              <div style={{ textAlign: 'center' }}>
                {order.paymentProofUrl ? (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Payment Proof</p>
                    <img src={`${API_URL}${order.paymentProofUrl}`} alt="Payment Proof"
                      style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => window.open(`${API_URL}${order.paymentProofUrl}`, '_blank')} />
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No payment proof</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {order.status === 'Pending Approval' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-success btn-small" onClick={() => handleAction(order._id, 'approve')}>
                  ✓ Approve
                </button>
                <button className="btn btn-danger btn-small" onClick={() => handleAction(order._id, 'reject')}>
                  ✕ Reject
                </button>
              </div>
            )}

            {/* QR Code (shown only if approved) */}
            {order.status === 'Confirmed' && order.qrCode && (
              <div style={{ marginTop: '0.8rem' }}>
                <img src={order.qrCode} alt="QR" style={{ width: 60, height: 60, cursor: 'pointer' }}
                  onClick={() => { const w = window.open(); w.document.write(`<img src="${order.qrCode}" style="width:300px"/><p>Ticket: ${order.ticketId}</p>`); }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MerchOrders;
