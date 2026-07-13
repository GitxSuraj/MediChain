import { Link } from "react-router-dom";

export default function PatientDashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>👋 Welcome to MediChain</h1>

      <p>Your Digital Healthcare Portal</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
          marginTop: "40px",
        }}
      >
        <Link to="/patient/profile">
          <button
            style={{
              width: "100%",
              padding: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ❤️ My Profile
          </button>
        </Link>

        <Link to="/patient/book">
          <button
            style={{
              width: "100%",
              padding: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            📅 Book Appointment
          </button>
        </Link>

        <Link to="/patient/status">
          <button
            style={{
              width: "100%",
              padding: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ⏳ Appointment Status
          </button>
        </Link>

        <Link to="/patient/history">
          <button
            style={{
              width: "100%",
              padding: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            📜 Medical History
          </button>
        </Link>

        <Link to="/patient/hospitals">
          <button
            style={{
              width: "100%",
              padding: "40px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            🏥 Hospitals
          </button>
        </Link>
      </div>
    </div>
  );
}