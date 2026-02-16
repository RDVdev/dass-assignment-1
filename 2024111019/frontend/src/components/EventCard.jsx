const EventCard = ({ event, onRegister }) => {
  return (
    <div className="card">
      <h3>{event.name}</h3>
      <p>{event.description || 'No description provided.'}</p>
      <p>
        <strong>Type:</strong> {event.type}
      </p>
      <p>
        <strong>Status:</strong> {event.status}
      </p>
      {onRegister && (
        <button className="btn" type="button" onClick={() => onRegister(event._id)}>
          Register
        </button>
      )}
    </div>
  );
};

export default EventCard;
