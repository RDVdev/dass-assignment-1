import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';
import TeamChat from '../../components/TeamChat';

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

  // Socket.io for real-time comments
  useEffect(() => {
    const socket = io(API_URL);
    socketRef.current = socket;
    socket.emit('joinEvent', id);
    socket.on('commentAdded', (c) => {
      setComments(prev => [...prev, c]);
      setNewCommentCount(prev => prev + 1);
    });
    socket.on('commentDeleted', (cid) => setComments(prev => prev.filter(c => (c._id || c.id) !== cid)));
    socket.on('reactionUpdated', (data) => {
      setComments(prev => prev.map(c => (c._id || c.id) === data.commentId ? { ...c, reactions: data.reactions } : c));
    });
    return () => { socket.emit('leaveEvent', id); socket.disconnect(); };
  }, [id]);

  if (!event) return <p className="center" style={{ color: 'var(--text-secondary)' }}>Loading...</p>;

  const deadlinePassed = event.regDeadline && new Date() > new Date(event.regDeadline);
  const limitReached = event.limit && event.registrationCount >= event.limit;
  const outOfStock = event.type === 'Merchandise' && event.stock !== undefined && event.stock <= 0;
  const canRegister = !deadlinePassed && !limitReached && !outOfStock &&
    (event.status === 'Published' || event.status === 'Ongoing');
  const isCompleted = event.status === 'Completed' || event.status === 'Closed';

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/events/${id}/register`, { formData }, getAuthHeader());
      setMessage(`✓ Registered! Ticket: ${res.data.ticketId}`);
    } catch (err) { setMessage(err.response?.data?.msg || 'Registration failed'); }
  };

  const handlePurchase = async () => {
    try {
      const fd = new FormData();
      fd.append('variant', merchData.variant);
      fd.append('quantity', merchData.quantity);
      fd.append('size', merchData.size);
      fd.append('color', merchData.color);
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

  const statusColor = { Published: 'var(--success)', Draft: 'var(--text-muted)', Ongoing: 'var(--accent-light)',
    Completed: 'var(--warning)', Closed: 'var(--danger)' };

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span className="tag" style={{ color: event.type === 'Hackathon' ? 'var(--teal)' : event.type === 'Merchandise' ? 'var(--amber)' : 'var(--blue)' }}>{event.type}</span>
        <span className="tag" style={{ color: statusColor[event.status] }}>{event.status}</span>
        {event.status === 'Ongoing' && <span className="badge badge-live">● LIVE</span>}
      </div>
      <h1>{event.name}</h1>
      <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>{event.description || 'No description.'}</p>

      {/* Info Card */}
      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem' }}>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Organizer</span><p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{event.organizer?.name}</p></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Eligibility</span><p style={{ color: 'var(--text-primary)' }}>{event.eligibility || 'All'}</p></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date</span><p style={{ color: 'var(--text-primary)' }}>{event.startDate ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}</p></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Deadline</span><p style={{ color: 'var(--text-primary)' }}>{event.regDeadline ? new Date(event.regDeadline).toLocaleDateString('en-IN') : 'None'}</p></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Price</span><p style={{ color: event.price ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{event.price ? `₹${event.price}` : 'Free'}</p></div>
          <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Spots</span><p style={{ color: 'var(--text-primary)' }}>{event.registrationCount || 0}{event.limit ? ` / ${event.limit}` : ''}</p></div>
          {event.type === 'Merchandise' && <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock</span><p style={{ color: 'var(--text-primary)' }}>{event.stock ?? 'Unlimited'}</p></div>}
        </div>
        {event.tags?.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {event.tags.map(t => <span key={t} className="tag" style={{ fontSize: '0.75rem' }}>{t}</span>)}
          </div>
        )}
      </div>

      {message && <div className={`message ${message.startsWith('✓') ? 'message-success' : 'message-error'}`}>{message}</div>}

      {/* Add to Calendar */}
      {event.startDate && (
        <div className="section" style={{ marginTop: '1rem' }}>
          <h3>📅 Add to Calendar</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button className="btn btn-small btn-outline" onClick={() => {
              window.open(`${API_URL}/api/events/${id}/calendar`, '_blank');
            }}>📥 Download .ics</button>
            <button className="btn btn-small btn-outline" onClick={() => {
              const start = event.startDate ? new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : '';
              const end = event.endDate ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : start;
              const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.name)}&dates=${start}/${end}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent('IIIT Hyderabad')}`;
              window.open(url, '_blank');
            }}>Google Calendar</button>
            <button className="btn btn-small btn-outline" onClick={() => {
              const start = event.startDate ? new Date(event.startDate).toISOString() : '';
              const end = event.endDate ? new Date(event.endDate).toISOString() : start;
              const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.name)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent('IIIT Hyderabad')}`;
              window.open(url, '_blank');
            }}>Outlook</button>
          </div>
        </div>
      )}

      {/* Normal Registration */}
      {user?.role === 'participant' && event.type === 'Normal' && (
        <div className="section">
          <h2>Register</h2>
          {event.formFields?.length > 0 && event.formFields.map((f, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <label>{f.label}{f.required ? ' *' : ''}</label>
              {f.fieldType === 'dropdown' ? (
                <select onChange={e => setFormData({ ...formData, [f.label]: e.target.value })}>
                  <option value="">Select...</option>
                  {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : f.fieldType === 'checkbox' ? (
                <input type="checkbox" onChange={e => setFormData({ ...formData, [f.label]: e.target.checked })} style={{ width: 'auto' }} />
              ) : (
                <input type={f.fieldType || 'text'} placeholder={f.label} onChange={e => setFormData({ ...formData, [f.label]: e.target.value })} />
              )}
            </div>
          ))}
          <button className="btn" onClick={handleRegister} disabled={!canRegister}>
            {!canRegister ? (deadlinePassed ? 'Deadline Passed' : limitReached ? 'Limit Reached' : 'Closed') : 'Register Now'}
          </button>
        </div>
      )}

      {/* Hackathon Team Registration */}
      {user?.role === 'participant' && event.type === 'Hackathon' && (
        <div className="section">
          <h2>🏆 Team Registration</h2>
          {teams.length > 0 ? (
            teams.map(team => (
              <div key={team._id} className="card" style={{ marginBottom: '0.8rem' }}>
                <h3>{team.name}</h3>
                <p style={{ fontFamily: 'monospace', color: 'var(--accent-light)' }}>Invite Code: {team.inviteCode}</p>
                <p>Members: {team.members?.length || 1} / {team.maxMembers}</p>
                <p>Status: <span style={{ color: team.status === 'Registered' ? 'var(--success)' : team.status === 'Complete' ? 'var(--warning)' : 'var(--text-secondary)' }}>{team.status}</span></p>
                {team.members?.map(m => <span key={m._id || m} className="tag" style={{ margin: '0.2rem' }}>{m.name || m.email || m}</span>)}
                {team.leader?._id === user?.id && team.status !== 'Registered' && team.members?.length >= (event.minTeamSize || 2) && (
                  <button className="btn" style={{ marginTop: '0.5rem' }} onClick={() => registerTeam(team._id)}>Register Team</button>
                )}
                {/* Team Chat */}
                <TeamChat teamId={team._id} teamName={team.name} />
              </div>
            ))
          ) : (
            <p style={{ marginBottom: '1rem' }}>Create a team or join with an invite code.</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
            <input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn" onClick={createTeam} disabled={!teamName}>Create Team</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <input placeholder="Invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-outline" onClick={joinTeam} disabled={!inviteCode}>Join Team</button>
          </div>
        </div>
      )}

      {/* Merchandise Purchase with Payment Proof */}
      {user?.role === 'participant' && event.type === 'Merchandise' && (
        <div className="section">
          <h2>🛒 Purchase</h2>
          {event.variants?.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <label>Variant</label>
              <select value={merchData.variant} onChange={e => setMerchData({ ...merchData, variant: e.target.value })}>
                <option value="">Select variant</option>
                {event.variants.map((v, i) => (
                  <option key={i} value={v.name || v}>{v.name || v} {v.size ? `(${v.size})` : ''} {v.color || ''} — Stock: {v.stock}</option>
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
            <input type="file" accept="image/*" onChange={e => setPaymentFile(e.target.files[0])} style={{ padding: '0.5rem' }} />
          </div>
          <button className="btn" onClick={handlePurchase} disabled={!canRegister}>
            {outOfStock ? 'Out of Stock' : 'Place Order (Pending Approval)'}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Your order will be reviewed by the organizer. QR ticket is generated upon approval.
          </p>
        </div>
      )}

      {/* Discussion Forum (Real-time, Threaded, Reactions) */}
      <div className="section" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2>💬 Discussion</h2>
          {newCommentCount > 0 && (
            <span onClick={() => { setNewCommentCount(0); commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', cursor: 'pointer' }}>
              {newCommentCount}
            </span>
          )}
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto', marginBottom: '0.8rem' }}>
          {comments.length === 0 && <p style={{ fontSize: '0.9rem' }}>No comments yet. Start the discussion!</p>}
          {/* Render top-level comments */}
          {comments.filter(c => !c.parentComment).map((c, i) => {
            const replies = comments.filter(r => r.parentComment && (r.parentComment === c._id || r.parentComment === (c._id || c.id)));
            const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];
            return (
              <div key={c._id || i} style={{ marginBottom: '0.6rem' }}>
                <div className="card" style={{ padding: '0.8rem',
                  borderLeft: event.pinnedComments?.includes(c._id) ? '3px solid var(--accent)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--accent-light)', fontSize: '0.85rem' }}>{c.user?.name || 'User'}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</small>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{c.text}</p>
                  {/* Reactions */}
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {EMOJIS.map(emoji => {
                      const count = (c.reactions || []).filter(r => r.emoji === emoji).length;
                      const myReaction = user && (c.reactions || []).some(r => r.emoji === emoji && (r.user === user.id || r.user?._id === user.id));
                      return count > 0 || user ? (
                        <button key={emoji} onClick={() => user && handleReaction(c._id || c.id, emoji)}
                          style={{ background: myReaction ? 'var(--accent-light)' : 'var(--surface-2)', border: 'none',
                            borderRadius: 12, padding: '2px 8px', fontSize: '0.8rem', cursor: user ? 'pointer' : 'default',
                            opacity: count > 0 ? 1 : 0.4, color: 'var(--text-primary)' }}>
                          {emoji}{count > 0 ? ` ${count}` : ''}
                        </button>
                      ) : null;
                    })}
                    {user && <button onClick={() => setReplyTo(c._id || c.id)} style={{ background: 'none', border: 'none',
                      color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '0.3rem' }}>↩ Reply</button>}
                  </div>
                </div>
                {/* Threaded replies */}
                {replies.length > 0 && (
                  <div style={{ marginLeft: '1.5rem', borderLeft: '2px solid var(--border)', paddingLeft: '0.8rem' }}>
                    {replies.map((r, ri) => (
                      <div key={r._id || ri} className="card" style={{ padding: '0.6rem', marginTop: '0.3rem', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: 'var(--accent-light)', fontSize: '0.8rem' }}>{r.user?.name || 'User'}</strong>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</small>
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{r.text}</p>
                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                          {EMOJIS.map(emoji => {
                            const count = (r.reactions || []).filter(rx => rx.emoji === emoji).length;
                            const myReaction = user && (r.reactions || []).some(rx => rx.emoji === emoji && (rx.user === user.id || rx.user?._id === user.id));
                            return count > 0 ? (
                              <button key={emoji} onClick={() => user && handleReaction(r._id || r.id, emoji)}
                                style={{ background: myReaction ? 'var(--accent-light)' : 'var(--surface-2)', border: 'none',
                                  borderRadius: 12, padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                {emoji} {count}
                              </button>
                            ) : null;
                          })}
                        </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                <span>↩ Replying to comment</span>
                <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Cancel</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder={replyTo ? 'Write a reply...' : 'Type a message...'}
                style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button className="btn" onClick={handleComment}>Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Anonymous Feedback (completed events only) */}
      {isCompleted && (
        <div className="section" style={{ marginTop: '1.5rem' }}>
          <h2>⭐ Feedback</h2>
          {fbData && (
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Average Rating:</strong> <span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>{'★'.repeat(Math.round(fbData.averageRating))}{'☆'.repeat(5 - Math.round(fbData.averageRating))}</span> {fbData.averageRating}/5 ({fbData.total} reviews)</p>
              {/* Rating filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.8rem 0' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter by rating:</label>
                <select value={fbFilter} onChange={async (e) => {
                  const val = Number(e.target.value);
                  setFbFilter(val);
                  const url = val ? `${API_URL}/api/events/${id}/feedback?rating=${val}` : `${API_URL}/api/events/${id}/feedback`;
                  const r = await axios.get(url);
                  setFbData(r.data);
                }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                  <option value={0}>All Ratings</option>
                  <option value={5}>★★★★★ (5)</option>
                  <option value={4}>★★★★☆ (4)</option>
                  <option value={3}>★★★☆☆ (3)</option>
                  <option value={2}>★★☆☆☆ (2)</option>
                  <option value={1}>★☆☆☆☆ (1)</option>
                </select>
                {fbFilter > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {fbData.filtered || fbData.feedback?.length} of {fbData.total}</span>}
              </div>
              {fbData.feedback?.map((f, i) => (
                <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--warning)' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  <p style={{ fontSize: '0.9rem' }}>{f.comment || 'No comment'}</p>
                </div>
              ))}
              {fbData.feedback?.length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No feedback for this rating.</p>}
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
