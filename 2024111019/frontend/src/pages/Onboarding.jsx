import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL, getAuthHeader } from '../context/AuthContext';

const INTEREST_OPTIONS = [
  'Technology', 'Music', 'Art', 'Sports', 'Gaming',
  'Photography', 'Dance', 'Literature', 'Science', 'Business'
];

const Onboarding = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/organizers`).then((r) => setOrganizers(r.data)).catch(() => {});
  }, []);

  const toggleInterest = (i) => {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const toggleOrg = (id) => {
    setSelectedOrgs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    await axios.post(`${API_URL}/api/auth/onboarding`, { interests, following: selectedOrgs }, getAuthHeader());
    await refreshUser();
    navigate('/participant/dashboard');
  };

  const skip = async () => {
    await axios.post(`${API_URL}/api/auth/onboarding`, { interests: [], following: [] }, getAuthHeader());
    await refreshUser();
    navigate('/participant/dashboard');
  };

  return (
    <div className="container">
      <h1>Welcome, {user?.name}!</h1>
      <p>Set up your preferences to get personalized event recommendations.</p>

      <h2>Select Your Interests</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {INTEREST_OPTIONS.map((i) => (
          <button
            key={i}
            type="button"
            className={interests.includes(i) ? 'btn' : 'tab'}
            onClick={() => toggleInterest(i)}
          >
            {i}
          </button>
        ))}
      </div>

      {organizers.length > 0 && (
        <>
          <h2>Follow Clubs / Organizers</h2>
          <div className="grid">
            {organizers.map((o) => (
              <div
                key={o._id}
                className="card"
                style={{ cursor: 'pointer', border: selectedOrgs.includes(o._id) ? '2px solid var(--gold)' : undefined }}
                onClick={() => toggleOrg(o._id)}
              >
                <h3>{o.name}</h3>
                <p>{o.category || 'Club'}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{o.description || ''}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button className="btn" onClick={submit}>Save & Continue</button>
        <button className="tab" onClick={skip}>Skip for now</button>
      </div>
    </div>
  );
};

export default Onboarding;
