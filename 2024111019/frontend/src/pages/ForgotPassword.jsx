import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);            // 1 = enter email, 2 = enter token + new pw
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setMsg(res.data.msg || 'Reset instructions sent.');
      if (res.data.token) setToken(res.data.token);   // dev/demo mode
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send reset request.');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
      setMsg(res.data.msg || 'Password reset successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Reset failed. Token may be expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        {step === 1 && (
          <>
            <h1>Reset Password</h1>
            <p className="subtitle">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={requestReset} className="form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>New Password</h1>
            <p className="subtitle">Enter the reset token and your new password.</p>
            {msg && <div className="message message-success">{msg}</div>}
            <form onSubmit={resetPassword} className="form">
              <label>Reset Token</label>
              <input
                type="text"
                placeholder="Paste your reset token"
                value={token}
                onChange={e => setToken(e.target.value)}
                required
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}
              />
              <label>New Password</label>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✓</div>
            <h1>All Done!</h1>
            <p className="subtitle">Your password has been reset successfully.</p>
            <Link to="/login" className="btn" style={{ marginTop: 16, display: 'inline-flex' }}>
              Back to Login
            </Link>
          </div>
        )}

        {step < 3 && (
          <div className="auth-links" style={{ marginTop: 24 }}>
            <Link to="/login">← Back to Login</Link>
            <Link to="/register">Create Account</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
