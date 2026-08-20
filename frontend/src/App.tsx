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
import PatientTransfer from './pages/PatientTransfer';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import HospitalLogin from './pages/HospitalLogin.jsx';
import Cover from './pages/Cover';
import PaymentPage from './pages/PaymentPage';
import MedicineStore from './pages/MedicineStore';
import MyOrders from './pages/MyOrders';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin / Hospital staff view — bed system + transfer system (no patient auth required) */}
        <Route path="/hospital-login" element={<HospitalLogin />} />
        <Route path="/admin" element={<HospitalPortal />} />
        <Route path="/super-admin" element={<SuperAdminPortal />} />

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
        <Route path="/transfer" element={<ProtectedRoute><PatientLayout title="Hospital Transfer"><PatientTransfer /></PatientLayout></ProtectedRoute>} />
        <Route path="/medicine-store" element={<ProtectedRoute><PatientLayout title="Medicine Store"><MedicineStore /></PatientLayout></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><PatientLayout title="My Orders"><MyOrders /></PatientLayout></ProtectedRoute>} />

        <Route path="/" element={<Cover />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

function HospitalPortal() {
  const stored = localStorage.getItem('medichain_hospital');
  if (!stored || !localStorage.getItem('medichain_hospital_token')) return <Navigate to="/hospital-login" replace />;
  return <AdminDashboard hospitalId={JSON.parse(stored).id} />;
}

function SuperAdminPortal() {
  const stored = localStorage.getItem('medichain_hospital');
  const staff = localStorage.getItem('medichain_staff');
  if (!stored || !staff || !localStorage.getItem('medichain_hospital_token')) return <Navigate to="/hospital-login" replace />;
  if (JSON.parse(staff).role !== 'super_admin') return <Navigate to="/admin" replace />;
  return <SuperAdminDashboard hospitalId={JSON.parse(stored).id} />;
}
