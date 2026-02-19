import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import BrowseEvents from './pages/participant/BrowseEvents';
import Dashboard from './pages/participant/Dashboard';
import Profile from './pages/participant/Profile';
import EventDetails from './pages/participant/EventDetails';
import ClubsList from './pages/participant/ClubsList';
import OrganizerDetail from './pages/participant/OrganizerDetail';
import OrgDashboard from './pages/organizer/OrgDashboard';
import EventCreate from './pages/organizer/EventCreate';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import OrgEventDetail from './pages/organizer/OrgEventDetail';
import MerchOrders from './pages/organizer/MerchOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import ResetRequests from './pages/admin/ResetRequests';
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/events" element={<BrowseEvents />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/clubs" element={<ClubsList />} />
        <Route path="/clubs/:id" element={<OrganizerDetail />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute roles={['participant']}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
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
          path="/organizer/profile"
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:id"
          element={
            <ProtectedRoute roles={['organizer']}>
              <OrgEventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizer/merch-orders"
          element={
            <ProtectedRoute roles={['organizer']}>
              <MerchOrders />
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
        <Route
          path="/admin/organizers"
          element={
            <ProtectedRoute roles={['admin']}>
              <ManageOrganizers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reset-requests"
          element={
            <ProtectedRoute roles={['admin']}>
              <ResetRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
