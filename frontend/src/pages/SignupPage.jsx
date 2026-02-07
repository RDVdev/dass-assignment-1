import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    rollNumber: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        profile: {
          phone: form.phone,
          rollNumber: form.rollNumber
        }
      });
      navigate('/participant');
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <section>
      <h2>Participant Signup</h2>
      <form className="card" onSubmit={handleSubmit}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
        <button type="submit">Create Account</button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  );
}
