import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const randInt = () => Math.floor(Math.random() * 10) + 1;

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    isIIIT: false, collegeName: '', contactNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ a: randInt(), b: randInt(), answer: '' });

  const refreshCaptcha = () => setCaptcha({ a: randInt(), b: randInt(), answer: '' });

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must include a number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return 'Password must include a special character';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pwErr = validatePassword(form.password);
    if (pwErr) { setError(pwErr); return; }
    if (Number(captcha.answer) !== captcha.a + captcha.b) {
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

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="subtitle">Join Felicity — IIIT Hyderabad's cultural fest</p>

        <form onSubmit={onSubmit} className="form">
          <div className="form-row-2">
            <input type="text" placeholder="First Name" value={form.firstName} onChange={set('firstName')} required />
            <input type="text" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
          <input type="password" placeholder="Password (min 8 chars, A-Z, a-z, 0-9, special)" value={form.password} onChange={set('password')} required minLength={8} />
          <input type="text" placeholder="College / Organization (optional)" value={form.collegeName} onChange={set('collegeName')} />
          <input type="text" placeholder="Contact Number (optional)" value={form.contactNumber} onChange={set('contactNumber')} />

          <label className="inline" style={{ cursor: 'pointer', userSelect: 'none', marginTop: 4 }}>
            <input type="checkbox" checked={form.isIIIT} onChange={set('isIIIT')} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>I am an IIIT Hyderabad student</span>
          </label>

          <div className="captcha-row">
            <span className="captcha-question">{captcha.a} + {captcha.b} = ?</span>
            <input type="number" placeholder="?" value={captcha.answer}
              onChange={e => setCaptcha({ ...captcha, answer: e.target.value })}
              required className="captcha-input" />
            <button type="button" onClick={refreshCaptcha} className="captcha-refresh" title="New CAPTCHA">↻</button>
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
