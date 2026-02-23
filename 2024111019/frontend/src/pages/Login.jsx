import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DASHBOARDS = { participant: '/participant/dashboard', organizer: '/organizer/dashboard', admin: '/admin/dashboard' };

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const randInt = () => Math.floor(Math.random() * 10) + 1;

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const [captcha, setCaptcha] = useState({ a: randInt(), b: randInt(), answer: '' });

  const refreshCaptcha = () => setCaptcha({ a: randInt(), b: randInt(), answer: '' });

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setError(''); setLoading(true);
        try {
          const u = await googleLogin(response.credential);
          navigate(DASHBOARDS[u.role] || '/events');
        } catch (err) {
          setError(err.response?.data?.msg || 'Google login failed');
        } finally { setLoading(false); }
      }
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black', size: 'large', width: 360, text: 'continue_with'
      });
    }
  }, []);

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

        <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }} />

        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <button type="button" className="btn btn-google" style={{ width: '100%' }}
            onClick={() => setError('Google login not configured. Set VITE_GOOGLE_CLIENT_ID.')}>
            <GoogleIcon /> Continue with Google
          </button>
        )}

        <div className="divider">or</div>

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
