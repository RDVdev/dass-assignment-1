import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext, API_URL, getAuthHeader } from '../context/AuthContext';

const TeamChat = ({ teamId, teamName }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [expanded, setExpanded] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    // Fetch message history
    axios.get(`${API_URL}/api/chat/${teamId}/messages`, getAuthHeader())
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {});

    // Connect socket
    const socket = io(API_URL);
    socketRef.current = socket;
    socket.emit('joinTeam', { teamId, userId: user?.id, userName: user?.name });

    socket.on('newTeamMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('onlineMembers', (members) => {
      setOnlineMembers(members);
    });

    socket.on('userTyping', ({ userName }) => {
      setTypingUser(userName);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2000);
    });

    socket.on('userStoppedTyping', () => setTypingUser(''));

    return () => {
      socket.emit('leaveTeam', teamId);
      socket.disconnect();
    };
  }, [teamId, expanded]);

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, expanded]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/api/chat/${teamId}/messages`, { text }, getAuthHeader());
      socketRef.current?.emit('teamMessage', { teamId, message: res.data });
      setMessages(prev => [...prev, res.data]);
      setText('');
      socketRef.current?.emit('stopTyping', { teamId });
    } catch { /* */ }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current?.emit('typing', { teamId, userName: user?.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { teamId });
    }, 1500);
  };

  // Detect URLs in text and render as links
  const renderText = (t) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = t.split(urlRegex);
    return parts.map((part, i) => urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>{part}</a>
      : part
    );
  };

  if (!expanded) {
    return (
      <button className="btn btn-outline" onClick={() => setExpanded(true)} style={{ marginTop: '0.5rem' }}>
        💬 Open Team Chat
      </button>
    );
  }

  return (
    <div className="card" style={{ marginTop: '0.8rem', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0.6rem 1rem', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ color: 'var(--accent-light)' }}>💬 {teamName || 'Team Chat'}</strong>
          <span style={{ marginLeft: '0.8rem', fontSize: '0.8rem', color: 'var(--success)' }}>
            🟢 {onlineMembers.length} online
          </span>
        </div>
        <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
      </div>

      {/* Online members */}
      {onlineMembers.length > 0 && (
        <div style={{ padding: '0.3rem 1rem', background: 'var(--surface-1)', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {onlineMembers.map(m => (
            <span key={m.userId} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              🟢 {m.userName}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ height: 300, overflowY: 'auto', padding: '0.8rem' }}>
        {messages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No messages yet. Say hello! 👋</p>}
        {messages.map((msg, i) => {
          const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
          return (
            <div key={msg._id || i} style={{ marginBottom: '0.5rem', textAlign: isMe ? 'right' : 'left' }}>
              <div style={{ display: 'inline-block', maxWidth: '80%', padding: '0.5rem 0.8rem',
                borderRadius: '12px', background: isMe ? 'var(--accent)' : 'var(--surface-2)',
                color: isMe ? '#fff' : 'var(--text-primary)' }}>
                {!isMe && <p style={{ fontSize: '0.7rem', fontWeight: 600, color: isMe ? '#fff' : 'var(--accent-light)', marginBottom: '0.1rem' }}>{msg.sender?.name || 'User'}</p>}
                <p style={{ fontSize: '0.9rem', margin: 0, wordBreak: 'break-word' }}>{renderText(msg.text)}</p>
                <small style={{ fontSize: '0.65rem', opacity: 0.7 }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUser && (
        <div style={{ padding: '0.2rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {typingUser} is typing...
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <input value={text} onChange={handleTyping} placeholder="Type a message..."
          style={{ flex: 1, fontSize: '0.9rem' }}
          onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button className="btn" onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>Send</button>
      </div>
    </div>
  );
};

export default TeamChat;
