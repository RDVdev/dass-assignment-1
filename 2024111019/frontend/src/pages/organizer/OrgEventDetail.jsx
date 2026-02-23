import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { API_URL, getAuthHeader } from '../../context/AuthContext';

const ALL_TABS = ['Overview', 'Participants', 'QR Scanner', 'Comments', 'Merch Orders'];
const TYPE_COLOR = { Hackathon: 'var(--teal)', Merchandise: 'var(--amber)', Normal: 'var(--blue)' };
const STATUS_COLOR = { Published: 'var(--success)', Draft: 'var(--text-muted)', Ongoing: 'var(--accent-light)', Completed: 'var(--warning)', Closed: 'var(--danger)' };
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

const OrgEventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [attendFilter, setAttendFilter] = useState('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [editFields, setEditFields] = useState({});
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('Overview');
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [merchOrders, setMerchOrders] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const set = (field) => (e) => setEditFields({ ...editFields, [field]: e.target.value });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [evRes, stRes] = await Promise.all([
      axios.get(`${API_URL}/api/events/${id}`, getAuthHeader()),
      axios.get(`${API_URL}/api/events/${id}/stats`, getAuthHeader()).catch(() => ({ data: null }))
    ]);
    const ev = evRes.data;
    setEvent(ev);
    setStats(stRes.data);
    setEditFields({
      description: ev.description || '',
      regDeadline: ev.regDeadline ? ev.regDeadline.slice(0, 10) : '',
      limit: ev.limit || '',
      status: ev.status
    });
    if (ev.type === 'Merchandise') {
      axios.get(`${API_URL}/api/admin/merch-orders`, getAuthHeader())
        .then(r => setMerchOrders(r.data.filter(o => o.event?._id === id || o.event === id)))
        .catch(() => {});
    }
    axios.get(`${API_URL}/api/events/${id}/feedback`).then(r => setFeedback(r.data)).catch(() => {});
  };

  const updateEvent = async () => {
    try {
      await axios.put(`${API_URL}/api/events/${id}`, editFields, getAuthHeader());
      setMessage('Event updated!');
      fetchData();
    } catch (err) { setMessage(err.response?.data?.msg || 'Update failed'); }
  };

  const exportCSV = () => window.open(`${API_URL}/api/events/${id}/export?token=${sessionStorage.getItem('token')}`);

  const exportAttendanceCSV = () => {
    if (!stats?.participants) return;
    const rows = stats.participants.map(t =>
      `${t.user?.name},${t.user?.email},${t.status},${t.attended ? 'Yes' : 'No'},${t.attendanceTimestamp ? new Date(t.attendanceTimestamp).toLocaleString() : ''}`
    );
    const blob = new Blob(['Name,Email,Status,Attended,Attendance Time\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${id}.csv`;
    a.click();
  };

  const scanQR = async (ticketId) => {
    let raw = ticketId || qrInput;
    if (!raw.trim()) return;
    try { const p = JSON.parse(raw); if (p.ticketId) raw = p.ticketId; } catch {}
    setQrResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/events/scan-qr`, { ticketId: raw, eventId: id }, getAuthHeader());
      setQrResult({ success: true, msg: res.data.msg, ticket: res.data.ticket });
      setQrInput('');
      fetchData();
    } catch (err) { setQrResult({ success: false, msg: err.response?.data?.msg || 'Scan failed' }); }
  };

  const startCamera = async () => {
    setScanning(true);
    setQrResult(null);
    await new Promise(r => setTimeout(r, 100));
    try {
      const qr = new Html5Qrcode('qr-reader');
      scannerRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => { await qr.stop().catch(() => {}); scannerRef.current = null; setScanning(false); scanQR(text); },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setQrResult({ success: false, msg: 'Camera error: ' + (err?.message || err) });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) { await scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
    setScanning(false);
  };

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);
  useEffect(() => { if (tab !== 'QR Scanner') stopCamera(); }, [tab]);

  const manualAttend = async (ticketDbId) => {
    try { await axios.put(`${API_URL}/api/events/tickets/${ticketDbId}/attend`, {}, getAuthHeader()); setMessage('Attendance marked'); fetchData(); }
    catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };
  const handleMerchAction = async (ticketId, action) => {
    try { await axios.put(`${API_URL}/api/admin/merch-orders/${ticketId}`, { action }, getAuthHeader()); setMessage(`Order ${action}d`); fetchData(); }
    catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };
  const deleteComment = async (cid) => {
    try { await axios.delete(`${API_URL}/api/events/${id}/comments/${cid}`, getAuthHeader()); setMessage('Comment deleted'); fetchData(); }
    catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };
  const pinComment = async (cid) => {
    try { await axios.put(`${API_URL}/api/events/${id}/comments/${cid}/pin`, {}, getAuthHeader()); setMessage('Pin toggled'); fetchData(); }
    catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  if (!event) return <p className="center text-muted">Loading...</p>;

  const filteredParticipants = stats?.participants?.filter(p => {
    if (search && !(p.user?.name?.toLowerCase().includes(search.toLowerCase()) || p.user?.email?.toLowerCase().includes(search.toLowerCase()))) return false;
    if (attendFilter === 'attended' && !p.attended) return false;
    if (attendFilter === 'not-attended' && p.attended) return false;
    if (institutionFilter !== 'all' && p.user?.participantType !== institutionFilter) return false;
    return true;
  }) || [];

  const attendedCount = stats?.participants?.filter(t => t.attended).length || 0;
  const totalCount = stats?.participants?.length || 0;
  const attendPct = totalCount > 0 ? Math.round(attendedCount / totalCount * 100) : 0;
  const visibleTabs = ALL_TABS.filter(t => t !== 'Merch Orders' || event.type === 'Merchandise');
  const isSuccess = (m) => ['updated', 'marked', 'deleted', 'toggled', 'approved'].some(w => m.includes(w));

  return (
    <div className="container fade-in">
      <div className="inline" style={{ marginBottom: '0.3rem', gap: '0.5rem' }}>
        <span className="tag" style={{ color: TYPE_COLOR[event.type] }}>{event.type}</span>
        <span className="tag" style={{ color: STATUS_COLOR[event.status] }}>{event.status}</span>
        {event.status === 'Ongoing' && <span className="badge badge-live">● LIVE</span>}
      </div>
      <h1>{event.name}</h1>

      {message && <div className={`message ${isSuccess(message) ? 'message-success' : 'message-error'}`}>{message}</div>}

      <div className="tabs">
        {visibleTabs.map(t => (
          <button key={t} className={`tab ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <>
          <div className="section">
            <div className="info-grid">
              <div><small className="text-muted">Start</small><p className="info-value">{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}</p></div>
              <div><small className="text-muted">End</small><p className="info-value">{event.endDate ? new Date(event.endDate).toLocaleDateString() : 'TBD'}</p></div>
              <div><small className="text-muted">Eligibility</small><p className="info-value">{event.eligibility || 'All'}</p></div>
              <div><small className="text-muted">Price</small><p className="info-value" style={{ color: event.price ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{event.price ? `₹${event.price}` : 'Free'}</p></div>
            </div>
          </div>

          {stats && (
            <div className="stat-grid">
              <div className="card stat-card"><h2>{stats.totalRegistrations}</h2><p>Registrations</p></div>
              <div className="card stat-card"><h2>{stats.confirmed}</h2><p>Confirmed</p></div>
              <div className="card stat-card"><h2>{stats.attended}</h2><p>Attended</p></div>
              <div className="card stat-card"><h2>₹{stats.revenue}</h2><p>Revenue</p></div>
              {event.type === 'Hackathon' && <>
                <div className="card stat-card"><h2>{stats.teamsTotal || 0}</h2><p>Total Teams</p></div>
                <div className="card stat-card"><h2>{stats.teamsRegistered || 0}</h2><p>Registered Teams</p></div>
              </>}
            </div>
          )}

          {feedback?.total > 0 && (
            <div className="section">
              <h3>Feedback Summary</h3>
              <p><span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{stars(Math.round(feedback.averageRating))}</span> {feedback.averageRating}/5 ({feedback.total} reviews)</p>
            </div>
          )}

          <div className="section">
            <h3>Edit Event</h3>
            <div className="form">
              <label>Description</label>
              <textarea value={editFields.description} onChange={set('description')} />
              {event.status === 'Draft' && <>
                <label>Registration Deadline</label>
                <input type="date" value={editFields.regDeadline} onChange={set('regDeadline')} />
              </>}
              {['Draft', 'Published'].includes(event.status) && <>
                <label>Registration Limit</label>
                <input type="number" value={editFields.limit} onChange={set('limit')} />
              </>}
              <label>Status</label>
              <select value={editFields.status} onChange={set('status')}>
                {['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn" onClick={updateEvent}>Update Event</button>
            </div>
          </div>
        </>
      )}

      {/* Participants */}
      {tab === 'Participants' && (
        <div>
          <div className="stat-grid">
            <div className="card stat-card"><h2>{totalCount}</h2><p>Total</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--success)' }}>{attendedCount}</h2><p>Scanned</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--warning)' }}>{totalCount - attendedCount}</h2><p>Not Scanned</p></div>
            <div className="card stat-card"><h2>{attendPct}%</h2><p>Attendance</p></div>
          </div>

          <div className="filter-bar">
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select value={attendFilter} onChange={e => setAttendFilter(e.target.value)} className="filter-select">
              <option value="all">All Attendance</option>
              <option value="attended">Attended</option>
              <option value="not-attended">Not Attended</option>
            </select>
            <select value={institutionFilter} onChange={e => setInstitutionFilter(e.target.value)} className="filter-select">
              <option value="all">All Institutions</option>
              <option value="IIIT">IIIT</option>
              <option value="Non-IIIT">Non-IIIT</option>
            </select>
            <button className="btn btn-small" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-small btn-outline" onClick={exportAttendanceCSV}>Attendance CSV</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Institution</th><th>Date</th><th>Status</th><th>Team</th><th>Form Data</th><th>Attended</th><th>Action</th></tr></thead>
              <tbody>
                {filteredParticipants.map(t => (
                  <tr key={t._id}>
                    <td>{t.user?.name}</td>
                    <td>{t.user?.email}</td>
                    <td><span className="tag">{t.user?.participantType || '-'}</span></td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td><span className={`tag ${t.status === 'Confirmed' ? 'tag-success' : t.status === 'Rejected' ? 'tag-danger' : 'tag-warning'}`}>{t.status}</span></td>
                    <td>{t.team?.name || '-'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>
                      {t.formData && Object.keys(t.formData).length > 0 ? (
                        Object.entries(t.formData).map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}:</strong>{' '}
                            {typeof v === 'string' && v.startsWith('/uploads/')
                              ? <a href={`${API_URL}${v}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>View File</a>
                              : String(v)}
                          </div>
                        ))
                      ) : '-'}
                    </td>
                    <td>{t.attended ? <span style={{ color: 'var(--success)' }}>✓ {t.attendanceTimestamp ? new Date(t.attendanceTimestamp).toLocaleTimeString() : ''}</span> : '-'}</td>
                    <td>{!t.attended && t.status === 'Confirmed' && <button className="btn btn-small btn-outline" onClick={() => manualAttend(t._id)}>Mark</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {tab === 'QR Scanner' && (
        <div>
          <div className="section">
            <h2>Camera Scanner</h2>
            <p style={{ marginBottom: '1rem' }}>Point your camera at a ticket QR code to auto-scan.</p>
            <div style={{ marginBottom: '1rem' }}>
              {!scanning
                ? <button className="btn" onClick={startCamera}>Open Camera</button>
                : <button className="btn btn-danger" onClick={stopCamera}>Stop Camera</button>}
            </div>
            {scanning && (
              <div className="qr-container"><div id="qr-reader" /></div>
            )}
            {!scanning && <div id="qr-reader" style={{ display: 'none' }} />}
          </div>

          <div className="section">
            <h2>Upload QR Image</h2>
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setQrResult(null);
              try {
                const qr = new Html5Qrcode('qr-file-reader');
                const decoded = await qr.scanFile(file, true);
                qr.clear();
                scanQR(decoded);
              } catch { setQrResult({ success: false, msg: 'Could not decode QR. Try a clearer photo.' }); }
              e.target.value = '';
            }} />
            <div id="qr-file-reader" style={{ display: 'none' }} />
          </div>

          <div className="section">
            <h2>Manual Entry</h2>
            <div className="inline" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
              <input placeholder="Ticket ID (e.g. TKT-A1B2C3D4)" value={qrInput}
                onChange={e => setQrInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && scanQR()}
                className="mono" style={{ flex: 1, fontSize: '1.1rem' }} />
              <button className="btn" onClick={() => scanQR()} disabled={!qrInput.trim()}>Submit</button>
            </div>
          </div>

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

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: '1rem' }}>
            <div className="card stat-card"><h2 style={{ color: 'var(--success)' }}>{attendedCount}</h2><p>Scanned</p></div>
            <div className="card stat-card"><h2 style={{ color: 'var(--warning)' }}>{totalCount - attendedCount}</h2><p>Remaining</p></div>
            <div className="card stat-card"><h2>{totalCount}</h2><p>Total</p></div>
          </div>
        </div>
      )}

      {/* Comments Moderation */}
      {tab === 'Comments' && (
        <div>
          <h2>Discussion Moderation</h2>
          <p style={{ marginBottom: '1rem' }}>Pin important comments, delete inappropriate ones.</p>
          {(!event.comments || event.comments.length === 0) && <p>No comments yet.</p>}
          {(event.comments || []).map(c => (
            <div key={c._id} className="card comment-mod-card" style={{ borderLeft: event.pinnedComments?.includes(c._id) ? '3px solid var(--accent)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  {event.pinnedComments?.includes(c._id) && <span className="tag tag-warning" style={{ marginBottom: '0.3rem', display: 'inline-block' }}>Pinned</span>}
                  <p style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: '0.85rem' }}>{c.user?.name || 'User'}</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{c.text}</p>
                  <small className="text-muted">{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</small>
                </div>
                <div className="inline" style={{ gap: '0.3rem', flexShrink: 0 }}>
                  <button className="btn btn-small btn-outline" onClick={() => pinComment(c._id)}>
                    {event.pinnedComments?.includes(c._id) ? 'Unpin' : 'Pin'}
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => deleteComment(c._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merch Orders */}
      {tab === 'Merch Orders' && event.type === 'Merchandise' && (
        <div>
          <h2>Merchandise Orders</h2>
          {merchOrders.length === 0 && <p>No orders yet.</p>}
          {merchOrders.map(order => (
            <div key={order._id} className="card" style={{ marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div className="inline" style={{ gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <span className={`tag ${order.status === 'Confirmed' ? 'tag-success' : order.status === 'Rejected' ? 'tag-danger' : 'tag-warning'}`}>{order.status}</span>
                    <span className="mono text-muted" style={{ fontSize: '0.85rem' }}>{order.ticketId}</span>
                  </div>
                  <p><strong>{order.user?.name}</strong> ({order.user?.email})</p>
                  {order.formData && (
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {order.formData.variant && `Variant: ${order.formData.variant} `}
                      {order.formData.size && `Size: ${order.formData.size} `}
                      Qty: {order.formData.quantity || 1}
                    </p>
                  )}
                  <small className="text-muted">{new Date(order.createdAt).toLocaleString()}</small>
                </div>
                {order.paymentProofUrl && (
                  <img src={`${API_URL}${order.paymentProofUrl}`} alt="Proof" className="proof-thumb"
                    onClick={() => window.open(`${API_URL}${order.paymentProofUrl}`, '_blank')} />
                )}
              </div>
              {order.status === 'Pending Approval' && (
                <div className="inline" style={{ gap: '0.5rem', marginTop: '0.8rem' }}>
                  <button className="btn btn-small btn-success" onClick={() => handleMerchAction(order._id, 'approve')}>Approve</button>
                  <button className="btn btn-small btn-danger" onClick={() => handleMerchAction(order._id, 'reject')}>Reject</button>
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
