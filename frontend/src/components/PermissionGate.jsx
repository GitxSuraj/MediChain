import React from 'react';

export default function PermissionGate({ requires, children }) {
  try {
    const stored = localStorage.getItem('medichain_staff');
    if (!stored) return null;
    const staff = JSON.parse(stored);
    
    if (staff.role === "super_admin") return <>{children}</>;
    
    if (!staff.permissions?.includes(requires)) {
      return null;
    }
    
    return <>{children}</>;
  } catch (e) {
    return null;
  }
}
