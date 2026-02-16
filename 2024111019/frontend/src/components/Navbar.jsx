import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Felicity EMS
      </Link>

      <div className="nav-links">
        <Link to="/events">Browse Events</Link>
        {user?.role === 'participant' && <Link to="/participant/dashboard">Dashboard</Link>}
        {user?.role === 'organizer' && <Link to="/organizer/dashboard">Organizer</Link>}
        {user?.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
        {user ? (
          <button type="button" onClick={logout} className="btn btn-small">
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
