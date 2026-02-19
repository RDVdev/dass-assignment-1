import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
);

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useContext(AuthContext);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    isIIIT: false, collegeName: '', contactNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);

  // CAPTCHA state
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const refreshCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer('');
  };
  useEffect(() => { refreshCaptcha(); }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setError('');
        setLoading(true);
        try {
          const user = await googleLogin(response.credential);
          navigate(user.onboardingComplete ? '/events' : '/onboarding');
        } catch (err) {
          setError(err.response?.data?.msg || 'Google sign-up failed');
        } finally { setLoading(false); }
      }
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black', size: 'large', width: 360, text: 'signup_with'
      });
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (Number(captchaAnswer) !== captchaA + captchaB) {
      setError('Incorrect CAPTCHA answer. Please try again.');
      refreshCaptcha();
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, name: `${form.firstName} ${form.lastName}`.trim() });
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join Felicity — IIIT Hyderabad's cultural fest</p>

        <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }} />

        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <button type="button" className="btn btn-google" style={{ width: '100%' }}
            onClick={() => setError('Google sign-up not configured.')}>
            <GoogleIcon /> Sign up with Google
          </button>
        )}

        <div className="divider">or</div>

        <form onSubmit={onSubmit} className="form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="text" placeholder="First Name" value={form.firstName} onChange={set('firstName')} required />
            <input type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
          <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} required />
          <input type="text" placeholder="College / Organization (optional)" value={form.collegeName} onChange={set('collegeName')} />
          <input type="text" placeholder="Contact Number (optional)" value={form.contactNumber} onChange={set('contactNumber')} />
          <label className="inline" style={{ cursor: 'pointer', userSelect: 'none', marginTop: 4 }}>
            <input type="checkbox" checked={form.isIIIT} onChange={set('isIIIT')} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>I am an IIIT Hyderabad student</span>
          </label>
          {/* CAPTCHA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', marginTop: 4 }}>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--gold)', letterSpacing: 1, userSelect: 'none' }}>
              {captchaA} + {captchaB} = ?
            </span>
            <input type="number" placeholder="?" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)}
              required style={{ width: 64, textAlign: 'center', padding: '6px 8px', fontSize: '0.9rem' }} />
            <button type="button" onClick={refreshCaptcha} style={{ background: 'rgba(245,197,66,0.1)', border: '1px solid rgba(245,197,66,0.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '4px 10px', color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600 }} title="New CAPTCHA">↻</button>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">← Already have an account?</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
