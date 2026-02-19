import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} style={active ? { color: 'var(--gold)', background: 'rgba(245,197,66,0.1)' } : {}}>
      {children}
    </Link>
  );
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img
          src="https://felicity.iiit.ac.in/_next/image?url=%2Flogo.png&w=96&q=75"
          alt="Felicity"
          className="brand-logo"
        />
        Felicity
      </Link>

      <div className="nav-links">
        {user?.role === 'participant' && (
          <>
            <NavLink to="/participant/dashboard">Dashboard</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/clubs">Clubs</NavLink>
            <NavLink to="/participant/profile">Profile</NavLink>
          </>
        )}

        {user?.role === 'organizer' && (
          <>
            <NavLink to="/organizer/dashboard">Dashboard</NavLink>
            <NavLink to="/organizer/create-event">Create</NavLink>
            <NavLink to="/organizer/merch-orders">Orders</NavLink>
            <NavLink to="/organizer/profile">Profile</NavLink>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin/dashboard">Dashboard</NavLink>
            <NavLink to="/admin/organizers">Clubs</NavLink>
            <NavLink to="/admin/reset-requests">Resets</NavLink>
          </>
        )}

        {!user && (
          <>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/clubs">Clubs</NavLink>
            <NavLink to="/login">Sign In</NavLink>
            <Link to="/register" className="btn btn-small" style={{ marginLeft: 6 }}>Register</Link>
          </>
        )}

        {user && (
          <button type="button" onClick={logout} className="btn btn-small btn-outline" style={{ marginLeft: 6 }}>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
