import type { ReactNode } from 'react';
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

  return (
    <div className="patient-layout">
      <Sidebar onLogout={logout} />
      <div className="patient-layout__main">
        <Navbar title={title} />
        <main className="patient-layout__content">{children}</main>
      </div>
    </div>
  );
}