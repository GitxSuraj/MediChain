import { useEffect, useState } from "react";

import AppShell from "./components/AppShell.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";

const routes = {
  "/admin": AdminDashboard,
  "/patient": PatientDashboard,
};

function getCurrentPath() {
  return window.location.pathname === "/" ? "/admin" : window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const handlePopState = () => setPath(getCurrentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const Page = routes[path] || AdminDashboard;

  return (
    <AppShell currentPath={path} onNavigate={navigate}>
      <Page />
    </AppShell>
  );
}
