import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PatientLayout from './components/PatientLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import BookAppointment from './pages/BookAppointment';
import AppointmentStatus from './pages/AppointmentStatus';
import PatientHistory from './pages/PatientHistory';
import HospitalDirectory from './pages/HospitalDirectory';
import HospitalMap from './pages/HospitalMap';
import MedicineReminders from './pages/MedicineReminders';
import AdminDashboard from './pages/AdminDashboard.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin / Hospital staff view — bed system + transfer system (no patient auth required) */}
        <Route path="/admin" element={<AdminDashboard />} />
        {/*
          "/hospital-login" is required by the roadmap's landing page CTA, but this
          codebase has no hospital-staff authentication system — /admin is already
          reached without a login gate. Adapting to the existing architecture rather
          than inventing a new hospital auth system: this route forwards straight to
          the existing unauthenticated hospital dashboard.
        */}
        <Route path="/hospital-login" element={<Navigate to="/admin" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PatientLayout title="Dashboard"><PatientDashboard /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PatientLayout title="My Profile"><PatientProfile /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute>
              <PatientLayout title="Book Appointment"><BookAppointment /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment-status"
          element={
            <ProtectedRoute>
              <PatientLayout title="Appointment Status"><AppointmentStatus /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-history"
          element={
            <ProtectedRoute>
              <PatientLayout title="Medical History"><PatientHistory /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospitals"
          element={
            <ProtectedRoute>
              <PatientLayout title="Hospital Directory"><HospitalDirectory /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital-map"
          element={
            <ProtectedRoute>
              <PatientLayout title="Find a Hospital"><HospitalMap /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicine-reminders"
          element={
            <ProtectedRoute>
              <PatientLayout title="Medicine Reminders"><MedicineReminders /></PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
