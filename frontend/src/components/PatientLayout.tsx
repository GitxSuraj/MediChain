import { useState } from 'react';
import Sidebar, { MobileMenuButton } from './Sidebar';
import Navbar from './Navbar';
import './PatientLayout.css';

interface PatientLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function PatientLayout({ title = 'Dashboard', children }: PatientLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="patient-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="patient-layout__main">
        <Navbar
          title={title}
          onMobileMenuClick={() => setMobileOpen(true)}
        />

        <div className="patient-layout__content">
          <div className="patient-layout__page">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}