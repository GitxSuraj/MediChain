import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PatientLayout from './components/PatientLayout';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import BookAppointment from './pages/BookAppointment';
import AppointmentStatus from './pages/AppointmentStatus';
import PatientHistory from './pages/PatientHistory';
import HospitalDirectory from './pages/HospitalDirectory';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

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

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;