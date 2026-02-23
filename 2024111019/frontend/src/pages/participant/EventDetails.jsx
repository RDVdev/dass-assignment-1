import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];
const TYPE_COLOR = { Merchandise: 'var(--amber)', Normal: 'var(--blue)' };
const STATUS_COLOR = { Published: 'var(--success)', Draft: 'var(--text-muted)', Ongoing: 'var(--accent-light)', Completed: 'var(--warning)', Closed: 'var(--danger)' };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({});
  const [merchData, setMerchData] = useState({ variant: '', quantity: 1, size: '', color: '' });
  const [paymentFile, setPaymentFile] = useState(null);
  const [message, setMessage] = useState('');
  const [comment, setComment] = useState('');
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // ─── Load event data ───
  useEffect(() => {
    axios.get(`${API_URL}/api/events/${id}`).then(r => {
      setEvent(r.data);
    }).catch(() => navigate('/events'));
  }, [id]);

  // ─── Load forum messages from dedicated endpoint ───
  const loadMessages = () => {
    axios.get(`${API_URL}/api/forum/${id}/messages`, getAuthHeader()).then(r => {
      setMessages(r.data.messages || []);
    }).catch(() => {});
  };

  useEffect(() => {
    if (user) loadMessages();
  }, [id, user]);

  // ─── Socket.IO for real-time forum (modeled after working reference) ───
  useEffect(() => {
    const socket = io(API_URL, {
      forceNew: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Forum] Socket connected:', socket.id);
      socket.emit('joinEventForum', id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Forum] Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.log('[Forum] Socket error:', err.message);
    });

    // Real-time: new message from any user
    socket.on('newMessage', (msg) => {
      console.log('[Forum] New message received:', msg.userName);
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev; // dedup
        return [...prev, msg];
      });
      setNewMsgCount(n => n + 1);
    });

    // Real-time: message deleted by organizer
    socket.on('messageDeleted', (msgId) => {
      setMessages(prev => prev.filter(m => m._id !== msgId));
    });

    // Real-time: reaction toggled
    socket.on('reactionUpdated', (data) => {
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    });

    // Real-time: message pinned/unpinned
    socket.on('messagePinned', (data) => {
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, pinned: data.pinned } : m
      ));
    });

    return () => {
      console.log('[Forum] Cleaning up socket');
      socket.emit('leaveEventForum', id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  if (!event) return <p className="center text-muted">Loading...</p>;

  const deadlinePassed = event.regDeadline && new Date() > new Date(event.regDeadline);
  const limitReached = event.limit && event.registrationCount >= event.limit;
  const outOfStock = event.type === 'Merchandise' && event.stock !== undefined && event.stock <= 0;
  const canRegister = !deadlinePassed && !limitReached && !outOfStock && ['Published', 'Ongoing'].includes(event.status);

  // --- Actions ---
  const handleRegister = async () => {
    // Validate required fields before submitting
    const missing = (event.formFields || []).filter(f => f.required).filter(f => {
      const val = formData[f.label];
      if (val === undefined || val === null || val === '') return true;
      if (f.fieldType === 'checkbox' && val === false) return true;
      return false;
    });
    if (missing.length > 0) {
      setMessage(`Please fill required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    try {
      const hasFiles = event.formFields?.some(f => f.fieldType === 'file') && Object.values(formData).some(v => v instanceof File);
      let res;
      if (hasFiles) {
        const fd = new FormData();
        const jsonFields = {};
        Object.entries(formData).forEach(([key, val]) => {
          if (val instanceof File) {
            fd.append(key, val);
          } else {
            jsonFields[key] = val;
          }
        });
        fd.append('formData', JSON.stringify(jsonFields));
        res = await axios.post(`${API_URL}/api/events/${id}/register`, fd, {
          headers: { 'x-auth-token': sessionStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${API_URL}/api/events/${id}/register`, { formData }, getAuthHeader());
      }
      setMessage(`✓ Registered! Ticket: ${res.data.ticketId}`);
    } catch (err) { setMessage(err.response?.data?.msg || 'Registration failed'); }
  };

  const handlePurchase = async () => {
    try {
      const fd = new FormData();
      Object.entries(merchData).forEach(([k, v]) => fd.append(k, v));
      if (paymentFile) fd.append('paymentProof', paymentFile);
      const res = await axios.post(`${API_URL}/api/events/${id}/merch-order`, fd, {
        headers: { 'x-auth-token': sessionStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`✓ Order placed! Status: ${res.data.status}. Ticket: ${res.data.ticketId}`);
    } catch (err) { setMessage(err.response?.data?.msg || 'Purchase failed'); }
  };

  const handleComment = async () => {
    if (!comment.trim() || sending) return;
    setSending(true);
    try {
      const body = { text: comment.trim() };
      if (replyTo) body.parentMessage = replyTo;
      await axios.post(`${API_URL}/api/forum/${id}/messages`, body, getAuthHeader());
      setComment('');
      setReplyTo(null);
      // Socket 'newMessage' event from server will add it for all clients
    } catch { /* */ }
    setSending(false);
  };

  const handleReaction = async (messageId, emoji = '👍') => {
    try {
      await axios.post(`${API_URL}/api/forum/${id}/messages/${messageId}/react`, { emoji }, getAuthHeader());
      // Socket 'reactionUpdated' event from server will update for all clients
    } catch { /* */ }
  };

  // --- Calendar helpers ---
  const openGoogleCal = () => {
    const start = event.startDate ? new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : '';
    const end = event.endDate ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : start;
    window.open(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.name)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent('IIIT Hyderabad')}`, '_blank');
  };

  const openOutlook = () => {
    const start = event.startDate ? new Date(event.startDate).toISOString() : '';
    const end = event.endDate ? new Date(event.endDate).toISOString() : start;
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent('IIIT Hyderabad')}`, '_blank');
  };

  // --- Render helpers ---
  const renderReactions = (m, isReply = false) => (
    <div className="reaction-bar">
      {EMOJIS.map(emoji => {
        const count = (m.reactions || []).filter(r => r.emoji === emoji).length;
        const mine = user && (m.reactions || []).some(r => r.emoji === emoji && (r.user === user.id || r.user?._id === user.id));
        return (count > 0 || (user && !isReply)) ? (
          <button key={emoji} onClick={() => user && handleReaction(m._id, emoji)}
            className={`reaction-btn ${mine ? 'reaction-mine' : ''}`}
            style={{ opacity: count > 0 ? 1 : 0.4 }}>
            {emoji}{count > 0 ? ` ${count}` : ''}
          </button>
        ) : null;
      })}
      {user && !isReply && (
        <button onClick={() => setReplyTo(m._id)} className="btn-reply">↩ Reply</button>
      )}
    </div>
  );

  return (
    <div className="container fade-in">
      {/* Header tags */}
      <div className="inline" style={{ marginBottom: '0.5rem', gap: '0.6rem' }}>
        <span className="tag" style={{ color: TYPE_COLOR[event.type] }}>{event.type}</span>
        <span className="tag" style={{ color: STATUS_COLOR[event.status] }}>{event.status}</span>
        {event.status === 'Ongoing' && <span className="badge badge-live">● LIVE</span>}
      </div>
      <h1>{event.name}</h1>
      <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>{event.description || 'No description.'}</p>

      {/* Info grid */}
      <div className="section">
        <div className="info-grid">
          <div><small className="text-muted">Organizer</small><p className="info-value">{event.organizer?.name}</p></div>
          <div><small className="text-muted">Eligibility</small><p className="info-value">{event.eligibility || 'All'}</p></div>
          <div><small className="text-muted">Date</small><p className="info-value">{fmtDate(event.startDate)}</p></div>
          <div><small className="text-muted">Deadline</small><p className="info-value">{event.regDeadline ? new Date(event.regDeadline).toLocaleDateString('en-IN') : 'None'}</p></div>
          <div><small className="text-muted">Price</small><p className="info-value" style={{ color: event.price ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{event.price ? `₹${event.price}` : 'Free'}</p></div>
          <div><small className="text-muted">Spots</small><p className="info-value">{event.registrationCount || 0}{event.limit ? ` / ${event.limit}` : ''}</p></div>
          {event.type === 'Merchandise' && <div><small className="text-muted">Stock</small><p className="info-value">{event.stock ?? 'Unlimited'}</p></div>}
        </div>
        {event.tags?.length > 0 && (
          <div className="tag-list" style={{ marginTop: '1rem' }}>
            {event.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
      </div>

      {message && <div className={`message ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>{message}</div>}

      {/* Calendar */}
      {event.startDate && (
        <div className="section" style={{ marginTop: '1rem' }}>
          <h3>Add to Calendar</h3>
          <div className="inline" style={{ gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button className="btn btn-small btn-outline" onClick={() => window.open(`${API_URL}/api/events/${id}/calendar`, '_blank')}>Download .ics</button>
            <button className="btn btn-small btn-outline" onClick={openGoogleCal}>Google Calendar</button>
            <button className="btn btn-small btn-outline" onClick={openOutlook}>Outlook</button>
          </div>
        </div>
      )}

      {/* Normal Registration */}
      {user?.role === 'participant' && event.type === 'Normal' && (
        <div className="section">
          <h2>Register</h2>
          {event.formFields?.map((f, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <label>{f.label}{f.required ? ' *' : ''}</label>
              {f.fieldType === 'dropdown' ? (
                <select required={f.required} onChange={e => setFormData({ ...formData, [f.label]: e.target.value })}>
                  <option value="">Select...</option>
                  {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : f.fieldType === 'checkbox' ? (
                <input type="checkbox" onChange={e => setFormData({ ...formData, [f.label]: e.target.checked })} style={{ width: 'auto' }} />
              ) : f.fieldType === 'file' ? (
                <input type="file" required={f.required} onChange={e => setFormData({ ...formData, [f.label]: e.target.files[0] })} />
              ) : (
                <input type={f.fieldType || 'text'} placeholder={f.label} required={f.required} onChange={e => setFormData({ ...formData, [f.label]: e.target.value })} />
              )}
            </div>
          ))}
          <button className="btn" onClick={handleRegister} disabled={!canRegister}>
            {!canRegister ? (deadlinePassed ? 'Deadline Passed' : limitReached ? 'Limit Reached' : 'Closed') : 'Register Now'}
          </button>
        </div>
      )}

      {/* Merchandise Purchase */}
      {user?.role === 'participant' && event.type === 'Merchandise' && (
        <div className="section">
          <h2>Purchase</h2>
          {event.variants?.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <label>Variant</label>
              <select value={merchData.variant} onChange={e => setMerchData({ ...merchData, variant: e.target.value })}>
                <option value="">Select variant</option>
                {event.variants.map((v, i) => (
                  <option key={i} value={v.name || v}>{v.name || v}{v.size ? ` (${v.size})` : ''} {v.color || ''} — Stock: {v.stock}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Quantity</label>
            <input type="number" min="1" max={event.purchaseLimitPerUser || 1} value={merchData.quantity}
              onChange={e => setMerchData({ ...merchData, quantity: Number(e.target.value) })} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Payment Proof (screenshot/image)</label>
            <input type="file" accept="image/*" onChange={e => setPaymentFile(e.target.files[0])} />
          </div>
          <button className="btn" onClick={handlePurchase} disabled={!canRegister}>
            {outOfStock ? 'Out of Stock' : 'Place Order (Pending Approval)'}
          </button>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Your order will be reviewed by the organizer. QR ticket is generated upon approval.
          </p>
        </div>
      )}

      {/* Discussion */}
      <div className="section" style={{ marginTop: '1.5rem' }}>
        <div className="inline" style={{ gap: '0.5rem' }}>
          <h2>Discussion</h2>
          {newMsgCount > 0 && (
            <span onClick={() => { setNewMsgCount(0); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="badge badge-live" style={{ cursor: 'pointer' }}>
              {newMsgCount}
            </span>
          )}
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto', marginBottom: '0.8rem' }}>
          {messages.length === 0 && <p style={{ fontSize: '0.9rem' }}>No messages yet. Start the discussion!</p>}

          {messages.filter(m => !m.parentMessage).map((m, i) => {
            const replies = messages.filter(r => r.parentMessage && (r.parentMessage === m._id));
            return (
              <div key={m._id || i} style={{ marginBottom: '0.6rem' }}>
                <div className="card" style={{ padding: '0.8rem', borderLeft: m.pinned ? '3px solid var(--accent)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong style={{ color: 'var(--accent-light)', fontSize: '0.85rem' }}>{m.userName || 'User'}</strong>
                      {m.userRole === 'organizer' && <span className="tag" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>Organizer</span>}
                    </div>
                    <small className="text-muted">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</small>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{m.text}</p>
                  {renderReactions(m)}
                </div>

                {/* Threaded replies */}
                {replies.length > 0 && (
                  <div className="reply-thread">
                    {replies.map((r, ri) => (
                      <div key={r._id || ri} className="card" style={{ padding: '0.6rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: 'var(--accent-light)', fontSize: '0.8rem' }}>{r.userName || 'User'}</strong>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</small>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{r.text}</p>
                        {renderReactions(r, true)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {user && (
          <div>
            {replyTo && (
              <div className="inline" style={{ gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                <span>↩ Replying to message</span>
                <button onClick={() => setReplyTo(null)} className="btn-reply" style={{ color: 'var(--danger)' }}>✕ Cancel</button>
              </div>
            )}
            <div className="inline" style={{ gap: '0.5rem' }}>
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
                style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleComment()} disabled={sending} />
              <button className="btn" onClick={handleComment} disabled={sending || !comment.trim()}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
