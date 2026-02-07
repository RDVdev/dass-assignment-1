import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          DASS EventHub
        </Link>
        <nav>
          <Link to="/events">Events</Link>
          {!user && <Link to="/login">Login</Link>}
          {!user && <Link to="/signup">Signup</Link>}
          {user?.role === 'participant' && <Link to="/participant">Participant</Link>}
          {user?.role === 'organizer' && <Link to="/organizer">Organizer</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
