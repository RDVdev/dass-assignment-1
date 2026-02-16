import { Link } from 'react-router-dom';

const OrgDashboard = () => {
  return (
    <div className="container">
      <h1>Organizer Dashboard</h1>
      <p>Manage your events, approvals, and participant engagement from here.</p>
      <Link to="/organizer/create-event" className="btn">
        Create Event
      </Link>
    </div>
  );
};

export default OrgDashboard;
