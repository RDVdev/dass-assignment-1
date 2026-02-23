import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext, API_URL, getAuthHeader } from '../context/AuthContext';

const linkify = (text) => {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRe).map((part, i) =>
    urlRe.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>{part}</a>
      : part
  );
};

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

    axios.get(`${API_URL}/api/chat/${teamId}/messages`, getAuthHeader())
      .then(r => setMessages(r.data.messages || []))
      .catch(() => {});

    const socket = io(API_URL);
    socketRef.current = socket;
    socket.emit('joinTeam', { teamId, userId: user?.id, userName: user?.name });

    socket.on('newTeamMessage', msg => setMessages(prev => [...prev, msg]));
    socket.on('onlineMembers', setOnlineMembers);
    socket.on('userTyping', ({ userName }) => {
      setTypingUser(userName);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2000);
    });
    socket.on('userStoppedTyping', () => setTypingUser(''));

    return () => { socket.emit('leaveTeam', teamId); socket.disconnect(); };
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
    typingTimeout.current = setTimeout(() => socketRef.current?.emit('stopTyping', { teamId }), 1500);
  };

  if (!expanded) {
    return (
      <button className="btn btn-outline" onClick={() => setExpanded(true)} style={{ marginTop: '0.5rem' }}>
        Open Team Chat
      </button>
    );
  }

  return (
    <div className="card" style={{ marginTop: '0.8rem', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div className="chat-header">
        <div>
          <strong style={{ color: 'var(--accent-light)' }}>{teamName || 'Team Chat'}</strong>
          <span className="chat-online-count">{onlineMembers.length} online</span>
        </div>
        <button onClick={() => setExpanded(false)} className="chat-close-btn">&times;</button>
      </div>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div className="chat-online-bar">
          {onlineMembers.map(m => (
            <span key={m.userId} className="chat-online-member">{m.userName}</span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ height: 300, overflowY: 'auto', padding: '0.8rem' }}>
        {messages.length === 0 && <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.85rem' }}>No messages yet. Say hello!</p>}
        {messages.map((msg, i) => {
          const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
          return (
            <div key={msg._id || i} style={{ marginBottom: '0.5rem', textAlign: isMe ? 'right' : 'left' }}>
              <div className={`chat-bubble ${isMe ? 'chat-bubble-mine' : 'chat-bubble-other'}`}>
                {!isMe && <p className="chat-sender">{msg.sender?.name || 'User'}</p>}
                <p style={{ fontSize: '0.9rem', margin: 0, wordBreak: 'break-word' }}>{linkify(msg.text)}</p>
                <small style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUser && <div className="chat-typing">{typingUser} is typing...</div>}

      {/* Input */}
      <div className="chat-input-bar">
        <input value={text} onChange={handleTyping} placeholder="Type a message..."
          style={{ flex: 1, fontSize: '0.9rem' }}
          onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button className="btn" onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>Send</button>
      </div>
    </div>
  );
};

export default TeamChat;
