import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API_URL, getAuthHeader } from '../../context/AuthContext';

const ClubsList = () => {
  const { user } = useContext(AuthContext);
  const [organizers, setOrganizers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/organizers`).then((r) => setOrganizers(r.data));
    if (user) {
      axios.get(`${API_URL}/api/auth/me`, getAuthHeader()).then((r) => setFollowing(r.data.following?.map((f) => f._id || f) || []));
    }
  }, []);

  const toggleFollow = async (orgId) => {
    await axios.post(`${API_URL}/api/auth/organizers/${orgId}/follow`, {}, getAuthHeader());
    setFollowing((prev) => prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]);
  };

  return (
    <div className="container">
      <h1>Clubs / Organizers</h1>
      <div className="grid">
        {organizers.map((o) => (
          <div key={o._id} className="card">
            <Link to={`/clubs/${o._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{o.name}</h3>
              <p><strong>Category:</strong> {o.category || 'General'}</p>
              <p>{o.description || ''}</p>
            </Link>
            {user?.role === 'participant' && (
              <button
                className={following.includes(o._id) ? 'btn' : 'tab'}
                onClick={() => toggleFollow(o._id)}
                style={{ marginTop: '0.5rem' }}
              >
                {following.includes(o._id) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        ))}
        {organizers.length === 0 && <p>No clubs/organizers found.</p>}
      </div>
    </div>
  );
};

export default ClubsList;
