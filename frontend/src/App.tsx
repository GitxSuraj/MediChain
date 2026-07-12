import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import BookAppointment from "./pages/BookAppointment";
import AppointmentStatus from "./pages/AppointmentStatus";
import PatientHistory from "./pages/PatientHistory";
import HospitalDirectory from "./pages/HospitalDirectory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/patient/dashboard"
        element={<PatientDashboard />}
      />

      <Route
        path="/patient/profile"
        element={<PatientProfile />}
      />

      <Route
        path="/patient/book"
        element={<BookAppointment />}
      />

      <Route
        path="/patient/status"
        element={<AppointmentStatus />}
      />

      <Route
        path="/patient/history"
        element={<PatientHistory />}
      />

      <Route
        path="/patient/hospitals"
        element={<HospitalDirectory />}
      />
    </Routes>
  );
}

export default App;