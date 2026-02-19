import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const TABS = ['Overview', 'Participants', 'QR Scanner', 'Comments', 'Merch Orders'];

const OrgEventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [editFields, setEditFields] = useState({});
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('Overview');
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [merchOrders, setMerchOrders] = useState([]);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [evRes, stRes] = await Promise.all([
      axios.get(`${API_URL}/api/events/${id}`, getAuthHeader()),
      axios.get(`${API_URL}/api/events/${id}/stats`, getAuthHeader()).catch(() => ({ data: null }))
    ]);
    setEvent(evRes.data);
    setStats(stRes.data);
    setEditFields({
      description: evRes.data.description || '',
      regDeadline: evRes.data.regDeadline ? evRes.data.regDeadline.slice(0, 10) : '',
      limit: evRes.data.limit || '',
      status: evRes.data.status
    });
    // Fetch merch orders if merchandise event
    if (evRes.data.type === 'Merchandise') {
      axios.get(`${API_URL}/api/admin/merch-orders`, getAuthHeader())
        .then(r => setMerchOrders(r.data.filter(o => o.event?._id === id || o.event === id)))
        .catch(() => {});
    }
    // Fetch feedback
    axios.get(`${API_URL}/api/events/${id}/feedback`).then(r => setFeedback(r.data)).catch(() => {});
  };

  const updateEvent = async () => {
    try {
      await axios.put(`${API_URL}/api/events/${id}`, editFields, getAuthHeader());
      setMessage('Event updated!');
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Update failed'); }
  };

  const exportCSV = () => {
    window.open(`${API_URL}/api/events/${id}/export?token=${sessionStorage.getItem('token')}`);
  };

  const exportAttendanceCSV = () => {
    if (!stats?.participants) return;
    const header = 'Name,Email,Status,Attended,Attendance Time\n';
    const rows = stats.participants.map(t =>
      `${t.user?.name},${t.user?.email},${t.status},${t.attended ? 'Yes' : 'No'},${t.attendanceTimestamp ? new Date(t.attendanceTimestamp).toLocaleString() : ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const scanQR = async (ticketId) => {
    let id_to_scan = ticketId || qrInput;
    if (!id_to_scan.trim()) return;
    // QR codes encode JSON like {"ticketId":"TKT-...","event":"..."}
    // Extract the ticketId if the scanned text is JSON
    try {
      const parsed = JSON.parse(id_to_scan);
      if (parsed.ticketId) id_to_scan = parsed.ticketId;
    } catch { /* not JSON, use as-is (manual entry) */ }
    setQrResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/events/scan-qr`, { ticketId: id_to_scan, eventId: id }, getAuthHeader());
      setQrResult({ success: true, msg: res.data.msg, ticket: res.data.ticket });
      setQrInput('');
      fetchData();
    } catch (err) {
      setQrResult({ success: false, msg: err.response?.data?.msg || 'Scan failed' });
    }
  };

  const startCamera = async () => {
    setScanning(true);
    setQrResult(null);
    // Small delay so the DOM element renders
    await new Promise(r => setTimeout(r, 100));
    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Stop camera after successful scan
          await html5Qr.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          scanQR(decodedText);
        },
        () => {} // ignore scan errors (no QR found yet)
      );
    } catch (err) {
      setScanning(false);
      setQrResult({ success: false, msg: 'Camera error: ' + (err?.message || err) + '. Make sure you allow camera access.' });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup camera on unmount or tab change
  useEffect(() => {
    return () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); };
  }, []);
  useEffect(() => {
    if (tab !== 'QR Scanner') stopCamera();
  }, [tab]);

  const manualAttend = async (ticketDbId) => {
    try {
      await axios.put(`${API_URL}/api/events/tickets/${ticketDbId}/attend`, {}, getAuthHeader());
      setMessage('Attendance marked manually');
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  const handleMerchAction = async (ticketId, action) => {
    try {
      await axios.put(`${API_URL}/api/admin/merch-orders/${ticketId}`, { action }, getAuthHeader());
      setMessage(`Order ${action}d`);
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/events/${id}/comments/${commentId}`, getAuthHeader());
      setMessage('Comment deleted');
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  const pinComment = async (commentId) => {
    try {
      await axios.put(`${API_URL}/api/events/${id}/comments/${commentId}/pin`, {}, getAuthHeader());
      setMessage('Pin toggled');
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  if (!event) return <p className="center" style={{ color: 'var(--text-secondary)' }}>Loading...</p>;

  const filteredParticipants = stats?.participants?.filter(p =>
    !search || p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const attendedCount = stats?.participants?.filter(t => t.attended).length || 0;
  const totalCount = stats?.participants?.length || 0;

  const statusColor = { Published: 'var(--success)', Draft: 'var(--text-muted)', Ongoing: 'var(--accent-light)',
    Completed: 'var(--warning)', Closed: 'var(--danger)' };

  const visibleTabs = TABS.filter(t => {
    if (t === 'Merch Orders') return event.type === 'Merchandise';
    return true;
  });

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span className="tag" style={{ color: event.type === 'Hackathon' ? 'var(--teal)' : event.type === 'Merchandise' ? 'var(--amber)' : 'var(--blue)' }}>{event.type}</span>
        <span className="tag" style={{ color: statusColor[event.status] }}>{event.status}</span>
        {event.status === 'Ongoing' && <span className="badge badge-live">● LIVE</span>}
      </div>
      <h1>{event.name}</h1>

      {message && <div className={`message ${message.includes('updated') || message.includes('marked') || message.includes('deleted') || message.includes('toggled') || message.includes('approved') ? 'message-success' : 'message-error'}`}>{message}</div>}

      {/* Tabs */}
      <div className="tabs">
        {visibleTabs.map(t => (
          <button key={t} className={`tab ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {tab === 'Overview' && (
        <>
          {/* Info */}
          <div className="section">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Start</span><p style={{ color: 'var(--text-primary)' }}>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</p></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>End</span><p style={{ color: 'var(--text-primary)' }}>{event.endDate ? new Date(event.endDate).toLocaleDateString() : 'TBD'}</p></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Eligibility</span><p style={{ color: 'var(--text-primary)' }}>{event.eligibility || 'All'}</p></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Price</span><p style={{ color: event.price ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{event.price ? `₹${event.price}` : 'Free'}</p></div>
            </div>
          </div>

          {/* Analytics */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card stat-card"><h2>{stats.totalRegistrations}</h2><p>Registrations</p></div>
              <div className="card stat-card"><h2>{stats.confirmed}</h2><p>Confirmed</p></div>
              <div className="card stat-card"><h2>{stats.attended}</h2><p>Attended</p></div>
              <div className="card stat-card"><h2>₹{stats.revenue}</h2><p>Revenue</p></div>
            </div>
          )}

          {/* Feedback Summary */}
          {feedback && feedback.total > 0 && (
            <div className="section">
              <h3>Feedback Summary</h3>
              <p><span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{'★'.repeat(Math.round(feedback.averageRating))}{'☆'.repeat(5 - Math.round(feedback.averageRating))}</span> {feedback.averageRating}/5 ({feedback.total} reviews)</p>
            </div>
          )}

          {/* Edit Section */}
          <div className="section">
            <h3>Edit Event</h3>
            <div className="form">
              <label>Description</label>
              <textarea value={editFields.description}
                onChange={e => setEditFields({ ...editFields, description: e.target.value })} />
              {event.status === 'Draft' && (
                <>
                  <label>Registration Deadline</label>
                  <input type="date" value={editFields.regDeadline}
                    onChange={e => setEditFields({ ...editFields, regDeadline: e.target.value })} />
                </>
              )}
              {(event.status === 'Draft' || event.status === 'Published') && (
                <>
                  <label>Registration Limit</label>
                  <input type="number" value={editFields.limit}
                    onChange={e => setEditFields({ ...editFields, limit: e.target.value })} />
                </>
              )}
              <label>Status</label>
              <select value={editFields.status}
                onChange={e => setEditFields({ ...editFields, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
              <button className="btn" onClick={updateEvent}>Update Event</button>
            </div>
          </div>
        </>
      )}

      {/* ========== PARTICIPANTS TAB ========== */}
      {tab === 'Participants' && (
        <div>
          {/* Attendance Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card stat-card"><h2>{totalCount}</h2><p>Total</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--success)' }}>{attendedCount}</h2><p>Scanned</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--warning)' }}>{totalCount - attendedCount}</h2><p>Not Scanned</p></div>
            <div className="card stat-card"><h2>{totalCount > 0 ? Math.round(attendedCount / totalCount * 100) : 0}%</h2><p>Attendance</p></div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input placeholder="Search by name or email..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-small" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-small btn-outline" onClick={exportAttendanceCSV}>Attendance CSV</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Date</th><th>Status</th><th>Team</th><th>Attended</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map(t => (
                  <tr key={t._id}>
                    <td>{t.user?.name}</td>
                    <td>{t.user?.email}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td><span className={`tag ${t.status === 'Confirmed' ? 'tag-success' : t.status === 'Rejected' ? 'tag-danger' : 'tag-warning'}`}>{t.status}</span></td>
                    <td>{t.team?.name || '-'}</td>
                    <td>{t.attended ? <span style={{ color: 'var(--success)' }}>✓ {t.attendanceTimestamp ? new Date(t.attendanceTimestamp).toLocaleTimeString() : ''}</span> : '-'}</td>
                    <td>{!t.attended && t.status === 'Confirmed' && (
                      <button className="btn btn-small btn-outline" onClick={() => manualAttend(t._id)}>Mark</button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== QR SCANNER TAB ========== */}
      {tab === 'QR Scanner' && (
        <div>
          {/* Camera Scanner */}
          <div className="section">
            <h2>📷 Camera Scanner</h2>
            <p style={{ marginBottom: '1rem' }}>Point your camera at a ticket QR code to auto-scan attendance.</p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {!scanning ? (
                <button className="btn" onClick={startCamera}>Open Camera</button>
              ) : (
                <button className="btn btn-danger" onClick={stopCamera}>Stop Camera</button>
              )}
            </div>

            {/* Camera view container */}
            {scanning && (
              <div style={{ maxWidth: 400, margin: '0 auto 1rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: '2px solid var(--gold)' }}>
                <div id="qr-reader" />
              </div>
            )}
            {/* Hidden div needed when not scanning so html5-qrcode doesn't error */}
            {!scanning && <div id="qr-reader" style={{ display: 'none' }} />}
          </div>

          {/* QR Photo Upload */}
          <div className="section">
            <h2>🖼️ Upload QR Code Image</h2>
            <p style={{ marginBottom: '1rem' }}>Upload a screenshot or photo of a QR code to scan.</p>
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setQrResult(null);
              try {
                const html5Qr = new Html5Qrcode('qr-file-reader');
                const decoded = await html5Qr.scanFile(file, true);
                html5Qr.clear();
                scanQR(decoded);
              } catch (err) {
                setQrResult({ success: false, msg: 'Could not decode QR from image. Try a clearer photo.' });
              }
              e.target.value = '';
            }} style={{ padding: '0.5rem' }} />
            <div id="qr-file-reader" style={{ display: 'none' }} />
          </div>

          {/* Manual Input Fallback */}
          <div className="section">
            <h2>⌨️ Manual Entry</h2>
            <p style={{ marginBottom: '1rem' }}>Or type the ticket ID directly.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input placeholder="Enter Ticket ID (e.g. TKT-A1B2C3D4)" value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanQR()}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.1rem' }} />
              <button className="btn" onClick={() => scanQR()} disabled={!qrInput.trim()}>Submit</button>
            </div>
          </div>

          {/* Scan Result */}
          {qrResult && (
            <div className={`message ${qrResult.success ? 'message-success' : 'message-error'}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <p style={{ fontWeight: 600 }}>{qrResult.msg}</p>
              {qrResult.ticket && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <p>Name: {qrResult.ticket.user?.name}</p>
                  <p>Email: {qrResult.ticket.user?.email}</p>
                  <p>Event: {qrResult.ticket.event?.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Live Attendance Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div className="card stat-card"><h2 style={{ color: 'var(--success)' }}>{attendedCount}</h2><p>Scanned</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--warning)' }}>{totalCount - attendedCount}</h2><p>Remaining</p></div>
            <div className="card stat-card"><h2>{totalCount}</h2><p>Total</p></div>
          </div>
        </div>
      )}

      {/* ========== COMMENTS TAB (Moderation) ========== */}
      {tab === 'Comments' && (
        <div>
          <h2>Discussion Moderation</h2>
          <p style={{ marginBottom: '1rem' }}>Manage comments. Pin important ones, delete inappropriate ones.</p>
          {(!event.comments || event.comments.length === 0) && <p>No comments yet.</p>}
          {(event.comments || []).map(c => (
            <div key={c._id} className="card" style={{ marginBottom: '0.5rem', padding: '0.8rem',
              borderLeft: event.pinnedComments?.includes(c._id) ? '3px solid var(--accent)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  {event.pinnedComments?.includes(c._id) && <span className="tag tag-warning" style={{ marginBottom: '0.3rem', display: 'inline-block' }}>📌 Pinned</span>}
                  <p style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: '0.85rem' }}>{c.user?.name || 'User'}</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{c.text}</p>
                  <small style={{ color: 'var(--text-muted)' }}>{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</small>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  <button className="btn btn-small btn-outline" onClick={() => pinComment(c._id)} title="Toggle Pin">
                    {event.pinnedComments?.includes(c._id) ? 'Unpin' : '📌 Pin'}
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => deleteComment(c._id)} title="Delete">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== MERCH ORDERS TAB ========== */}
      {tab === 'Merch Orders' && event.type === 'Merchandise' && (
        <div>
          <h2>Merchandise Orders</h2>
          {merchOrders.length === 0 && <p>No orders yet.</p>}
          {merchOrders.map(order => (
            <div key={order._id} className="card" style={{ marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className={`tag ${order.status === 'Confirmed' ? 'tag-success' : order.status === 'Rejected' ? 'tag-danger' : 'tag-warning'}`}>{order.status}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.ticketId}</span>
                  </div>
                  <p><strong>{order.user?.name}</strong> ({order.user?.email})</p>
                  {order.formData && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {order.formData.variant && `Variant: ${order.formData.variant} `}
                      {order.formData.size && `Size: ${order.formData.size} `}
                      Qty: {order.formData.quantity || 1}
                    </p>
                  )}
                  <small style={{ color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString()}</small>
                </div>
                {order.paymentProofUrl && (
                  <img src={`${API_URL}${order.paymentProofUrl}`} alt="Proof"
                    style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }}
                    onClick={() => window.open(`${API_URL}${order.paymentProofUrl}`, '_blank')} />
                )}
              </div>
              {order.status === 'Pending Approval' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                  <button className="btn btn-small btn-success" onClick={() => handleMerchAction(order._id, 'approve')}>✓ Approve</button>
                  <button className="btn btn-small btn-danger" onClick={() => handleMerchAction(order._id, 'reject')}>✕ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgEventDetail;
