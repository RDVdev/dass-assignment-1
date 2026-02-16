import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import BrowseEvents from './pages/participant/BrowseEvents';
import Dashboard from './pages/participant/Dashboard';
import Profile from './pages/participant/Profile';
import OrgDashboard from './pages/organizer/OrgDashboard';
import EventCreate from './pages/organizer/EventCreate';
import AdminDashboard from './pages/admin/AdminDashboard';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<BrowseEvents />} />

        <Route
          path="/participant/dashboard"
          element={
            <ProtectedRoute roles={['participant']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participant/profile"
          element={
            <ProtectedRoute roles={['participant']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrgDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/create-event"
          element={
            <ProtectedRoute roles={['organizer', 'admin']}>
              <EventCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
