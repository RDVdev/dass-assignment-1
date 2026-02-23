import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DASHBOARDS = { participant: '/participant/dashboard', organizer: '/organizer/dashboard', admin: '/admin/dashboard' };

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(DASHBOARDS[u.role] || '/events');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
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
