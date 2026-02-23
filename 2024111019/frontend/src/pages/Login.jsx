import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DASHBOARDS = { participant: '/participant/dashboard', organizer: '/organizer/dashboard', admin: '/admin/dashboard' };

const randInt = () => Math.floor(Math.random() * 10) + 1;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ a: randInt(), b: randInt(), answer: '' });

  const refreshCaptcha = () => setCaptcha({ a: randInt(), b: randInt(), answer: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (Number(captcha.answer) !== captcha.a + captcha.b) {
      setError('Incorrect CAPTCHA answer. Please try again.');
      refreshCaptcha();
      return;
    }
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(DASHBOARDS[u.role] || '/events');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your Felicity account</p>

        <form onSubmit={onSubmit} className="form">
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required autoFocus />
          <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />

          <div className="captcha-row">
            <span className="captcha-question">{captcha.a} + {captcha.b} = ?</span>
            <input type="number" placeholder="?" value={captcha.answer}
              onChange={e => setCaptcha({ ...captcha, answer: e.target.value })}
              required className="captcha-input" />
            <button type="button" onClick={refreshCaptcha} className="captcha-refresh" title="New CAPTCHA">↻</button>
          </div>

          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
