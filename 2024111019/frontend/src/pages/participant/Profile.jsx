import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container">
      <h1>Profile</h1>
      <p>Name: {user?.name}</p>
      <p>Role: {user?.role}</p>
      <p>Email: {user?.email || 'Hidden in token payload response'}</p>
    </div>
  );
};

export default Profile;
