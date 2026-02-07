import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section>
      <h1>Campus Events and Merch Portal</h1>
      <p>Browse events, register fast, and track tickets by role-based dashboards.</p>
      <div className="row">
        <Link to="/events" className="btn">
          Browse Events
        </Link>
        <Link to="/signup" className="btn btn-secondary">
          Participant Signup
        </Link>
      </div>
    </section>
  );
}
