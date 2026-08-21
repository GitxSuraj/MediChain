import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PatientLayout from './components/PatientLayout';

// Auth & Entry
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import HospitalLogin from './pages/HospitalLogin.jsx';

// Admin / Hospital dashboards
import AdminDashboard from './pages/AdminDashboard.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';

// Patient pages
import PatientDashboard from './pages/PatientDashboard';
import PatientProfile from './pages/PatientProfile';
import BookAppointment from './pages/BookAppointment';
import AppointmentStatus from './pages/AppointmentStatus';
import PatientHistory from './pages/PatientHistory';
import PatientTransfer from './pages/PatientTransfer';

// Payment
import PaymentPage from './pages/PaymentPage';

// Hospital directory + map
import HospitalDirectory from './pages/HospitalDirectory';
import HospitalMap from './pages/HospitalMap';

// Medicine & orders
import MedicineStore from './pages/MedicineStore';
import MyOrders from './pages/MyOrders';

// Person C features
import MedicineReminders from './pages/MedicineReminders';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Hospital / Admin routes */}
        <Route path="/hospital-login" element={<HospitalLogin />} />
        <Route path="/admin" element={<HospitalPortal />} />
        <Route path="/super-admin" element={<SuperAdminPortal />} />

        {/* Protected patient routes */}
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
          path="/payment"
          element={
            <ProtectedRoute>
              <PatientLayout title="Payment"><PaymentPage /></PatientLayout>
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
          path="/transfer"
          element={
            <ProtectedRoute>
              <PatientLayout title="Hospital Transfer"><PatientTransfer /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicine-store"
          element={
            <ProtectedRoute>
              <PatientLayout title="Medicine Store"><MedicineStore /></PatientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <PatientLayout title="My Orders"><MyOrders /></PatientLayout>
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

// ---------------------------------------------------------------------------
// Hospital portal guards
// ---------------------------------------------------------------------------

function HospitalPortal() {
  const stored = localStorage.getItem('medichain_hospital');
  if (!stored || !localStorage.getItem('medichain_hospital_token')) {
    return <Navigate to="/hospital-login" replace />;
  }
  return <AdminDashboard hospitalId={JSON.parse(stored).id} />;
}

function SuperAdminPortal() {
  const stored = localStorage.getItem('medichain_hospital');
  const staff = localStorage.getItem('medichain_staff');
  if (!stored || !staff || !localStorage.getItem('medichain_hospital_token')) {
    return <Navigate to="/hospital-login" replace />;
  }
  if (JSON.parse(staff).role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }
  return <SuperAdminDashboard hospitalId={JSON.parse(stored).id} />;
}
