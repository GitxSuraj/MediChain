import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import './PatientLayout.css';

interface PatientLayoutProps {
  children: ReactNode;
  title: string;
}

export default function PatientLayout({ children, title }: PatientLayoutProps) {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="patient-layout">
      <Sidebar
        onLogout={logout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div className={`patient-layout__main ${collapsed ? 'patient-layout__main--collapsed' : ''}`}>
        <Navbar title={title} />
        <main className="patient-layout__content">{children}</main>
      </div>
    </div>
  );
}