import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';
import TeamChat from '../../components/TeamChat';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];
const TYPE_COLOR = { Hackathon: 'var(--teal)', Merchandise: 'var(--amber)', Normal: 'var(--blue)' };
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
  const [comments, setComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [fbData, setFbData] = useState(null);
  const [fbFilter, setFbFilter] = useState(0);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const socketRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/events/${id}`).then(r => {
      setEvent(r.data);
      setComments(r.data.comments || []);
    }).catch(() => navigate('/events'));
    axios.get(`${API_URL}/api/events/${id}/feedback`).then(r => setFbData(r.data)).catch(() => {});
    if (user) {
      axios.get(`${API_URL}/api/teams/mine`, getAuthHeader()).then(r => {
        setTeams(r.data.filter(t => t.event?._id === id || t.event === id));
      }).catch(() => {});
    }
  }, [id]);

  // Real-time comments via socket
  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;
    socket.emit('joinEvent', id);
    socket.on('commentAdded', c => { setComments(prev => [...prev, c]); setNewCommentCount(n => n + 1); });
    socket.on('commentDeleted', cid => setComments(prev => prev.filter(c => (c._id || c.id) !== cid)));
    socket.on('reactionUpdated', data => {
      setComments(prev => prev.map(c => (c._id || c.id) === data.commentId ? { ...c, reactions: data.reactions } : c));
    });
    return () => { socket.emit('leaveEvent', id); socket.disconnect(); };
  }, [id]);

  if (!event) return <p className="center text-muted">Loading...</p>;

  const deadlinePassed = event.regDeadline && new Date() > new Date(event.regDeadline);
  const limitReached = event.limit && event.registrationCount >= event.limit;
  const outOfStock = event.type === 'Merchandise' && event.stock !== undefined && event.stock <= 0;
  const canRegister = !deadlinePassed && !limitReached && !outOfStock && ['Published', 'Ongoing'].includes(event.status);
  const isCompleted = event.status === 'Completed' || event.status === 'Closed';

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
    if (!comment.trim()) return;
    try {
      const body = { text: comment };
      if (replyTo) body.parentComment = replyTo;
      const res = await axios.post(`${API_URL}/api/events/${id}/comments`, body, getAuthHeader());
      const newComment = { ...res.data, user: { name: user?.name || 'You' }, reactions: [] };
      socketRef.current?.emit('newComment', { eventId: id, comment: newComment });
      setComments(prev => [...prev, newComment]);
      setComment('');
      setReplyTo(null);
    } catch { /* */ }
  };

  const handleReaction = async (commentId, emoji = '👍') => {
    try {
      const res = await axios.post(`${API_URL}/api/events/${id}/comments/${commentId}/react`, { emoji }, getAuthHeader());
      setComments(prev => prev.map(c => (c._id || c.id) === commentId ? { ...c, reactions: res.data.reactions } : c));
      socketRef.current?.emit('reactionToggled', { eventId: id, commentId, reactions: res.data.reactions });
    } catch { /* */ }
  };

  const handleFeedback = async () => {
    if (!feedback.rating) return;
    try {
      await axios.post(`${API_URL}/api/events/${id}/feedback`, feedback, getAuthHeader());
      setMessage('✓ Feedback submitted!');
      const r = await axios.get(`${API_URL}/api/events/${id}/feedback`);
      setFbData(r.data);
    } catch (err) { setMessage(err.response?.data?.msg || 'Feedback failed'); }
  };

  const createTeam = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/teams`, { name: teamName, eventId: id }, getAuthHeader());
      setTeams([...teams, res.data]);
      setTeamName('');
      setMessage(`✓ Team created! Code: ${res.data.inviteCode}`);
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  const joinTeam = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/teams/join`, { inviteCode }, getAuthHeader());
      setTeams([...teams, res.data]);
      setInviteCode('');
      setMessage('✓ Joined team!');
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
  };

  const registerTeam = async (teamId) => {
    try {
      await axios.post(`${API_URL}/api/teams/${teamId}/register`, {}, getAuthHeader());
      setMessage('✓ Team registered! Tickets generated for all members.');
    } catch (err) { setMessage(err.response?.data?.msg || 'Failed'); }
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
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const renderReactions = (c, isReply = false) => (
    <div className="reaction-bar">
      {EMOJIS.map(emoji => {
        const count = (c.reactions || []).filter(r => r.emoji === emoji).length;
        const mine = user && (c.reactions || []).some(r => r.emoji === emoji && (r.user === user.id || r.user?._id === user.id));
        return (count > 0 || (user && !isReply)) ? (
          <button key={emoji} onClick={() => user && handleReaction(c._id || c.id, emoji)}
            className={`reaction-btn ${mine ? 'reaction-mine' : ''}`}
            style={{ opacity: count > 0 ? 1 : 0.4 }}>
            {emoji}{count > 0 ? ` ${count}` : ''}
          </button>
        ) : null;
      })}
      {user && !isReply && (
        <button onClick={() => setReplyTo(c._id || c.id)} className="btn-reply">↩ Reply</button>
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

      {/* Hackathon Teams */}
      {user?.role === 'participant' && event.type === 'Hackathon' && (
        <div className="section">
          <h2>Team Registration</h2>
          {teams.length > 0 ? teams.map(team => (
            <div key={team._id} className="card" style={{ marginBottom: '0.8rem' }}>
              <h3>{team.name}</h3>
              <p className="mono" style={{ color: 'var(--accent-light)' }}>Invite Code: {team.inviteCode}</p>
              <p>Members: {team.members?.length || 1} / {team.maxMembers}</p>
              <p>Status: <span style={{ color: team.status === 'Registered' ? 'var(--success)' : team.status === 'Complete' ? 'var(--warning)' : 'var(--text-secondary)' }}>{team.status}</span></p>
              <div className="tag-list">
                {team.members?.map(m => <span key={m._id || m} className="tag">{m.name || m.email || m}</span>)}
              </div>
              {team.leader?._id === user?.id && team.status !== 'Registered' && team.members?.length >= (event.minTeamSize || 2) && (
                <button className="btn" style={{ marginTop: '0.5rem' }} onClick={() => registerTeam(team._id)}>Register Team</button>
              )}
              <TeamChat teamId={team._id} teamName={team.name} />
            </div>
          )) : (
            <p style={{ marginBottom: '1rem' }}>Create a team or join with an invite code.</p>
          )}
          <div className="inline" style={{ gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
            <input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn" onClick={createTeam} disabled={!teamName}>Create Team</button>
          </div>
          <div className="inline" style={{ gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <input placeholder="Invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-outline" onClick={joinTeam} disabled={!inviteCode}>Join Team</button>
          </div>
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
          {newCommentCount > 0 && (
            <span onClick={() => { setNewCommentCount(0); commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="badge badge-live" style={{ cursor: 'pointer' }}>
              {newCommentCount}
            </span>
          )}
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto', marginBottom: '0.8rem' }}>
          {comments.length === 0 && <p style={{ fontSize: '0.9rem' }}>No comments yet. Start the discussion!</p>}

          {comments.filter(c => !c.parentComment).map((c, i) => {
            const replies = comments.filter(r => r.parentComment && (r.parentComment === c._id || r.parentComment === (c._id || c.id)));
            return (
              <div key={c._id || i} style={{ marginBottom: '0.6rem' }}>
                <div className="card" style={{ padding: '0.8rem', borderLeft: event.pinnedComments?.includes(c._id) ? '3px solid var(--accent)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--accent-light)', fontSize: '0.85rem' }}>{c.user?.name || 'User'}</strong>
                    <small className="text-muted">{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</small>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{c.text}</p>
                  {renderReactions(c)}
                </div>

                {/* Threaded replies */}
                {replies.length > 0 && (
                  <div className="reply-thread">
                    {replies.map((r, ri) => (
                      <div key={r._id || ri} className="card" style={{ padding: '0.6rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: 'var(--accent-light)', fontSize: '0.8rem' }}>{r.user?.name || 'User'}</strong>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</small>
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
          <div ref={commentsEndRef} />
        </div>

        {user && (
          <div>
            {replyTo && (
              <div className="inline" style={{ gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                <span>↩ Replying to comment</span>
                <button onClick={() => setReplyTo(null)} className="btn-reply" style={{ color: 'var(--danger)' }}>✕ Cancel</button>
              </div>
            )}
            <div className="inline" style={{ gap: '0.5rem' }}>
              <input value={comment} onChange={e => setComment(e.target.value)}
                placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
                style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button className="btn" onClick={handleComment}>Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback (completed events) */}
      {isCompleted && (
        <div className="section" style={{ marginTop: '1.5rem' }}>
          <h2>Feedback</h2>
          {fbData && (
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Average Rating:</strong> <span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{stars(Math.round(fbData.averageRating))}</span> {fbData.averageRating}/5 ({fbData.total} reviews)</p>

              <div className="inline" style={{ gap: '0.5rem', margin: '0.8rem 0' }}>
                <label className="text-muted" style={{ fontSize: '0.85rem' }}>Filter by rating:</label>
                <select value={fbFilter} onChange={async (e) => {
                  const val = Number(e.target.value);
                  setFbFilter(val);
                  const url = val ? `${API_URL}/api/events/${id}/feedback?rating=${val}` : `${API_URL}/api/events/${id}/feedback`;
                  const r = await axios.get(url);
                  setFbData(r.data);
                }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                  <option value={0}>All Ratings</option>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{stars(n)} ({n})</option>)}
                </select>
                {fbFilter > 0 && <span className="text-muted" style={{ fontSize: '0.8rem' }}>Showing {fbData.filtered || fbData.feedback?.length} of {fbData.total}</span>}
              </div>

              {fbData.feedback?.map((f, i) => (
                <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--warning)' }}>{stars(f.rating)}</span>
                  <p style={{ fontSize: '0.9rem' }}>{f.comment || 'No comment'}</p>
                </div>
              ))}
              {fbData.feedback?.length === 0 && <p className="text-muted">No feedback for this rating.</p>}
            </div>
          )}

          {user?.role === 'participant' && (
            <div>
              <label>Your Rating</label>
              <div className="stars" style={{ marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} className={`star ${feedback.rating >= n ? 'filled' : ''}`}
                    onClick={() => setFeedback({ ...feedback, rating: n })}>★</span>
                ))}
              </div>
              <textarea placeholder="Share your experience (anonymous)..." value={feedback.comment}
                onChange={e => setFeedback({ ...feedback, comment: e.target.value })} rows={2} />
              <button className="btn" style={{ marginTop: '0.5rem' }} onClick={handleFeedback} disabled={!feedback.rating}>
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
