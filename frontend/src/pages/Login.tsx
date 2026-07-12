import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("patient");

  const handleLogin = () => {
    console.log("Selected Role:", role);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="logo">
          🏥
          
        </div>

        <h1>MediChain</h1>

        <p className="subtitle">
          Healthcare Management System
        </p>

        <label>Select Your Role</label>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={handleLogin}>
          Login
        </button>

      </div>
    </div>
  );
}