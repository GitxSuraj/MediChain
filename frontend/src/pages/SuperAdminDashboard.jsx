import React, { useEffect, useState } from "react";
import { getStaffList, updateStaffPermissions, createStaffAccount, getHospitals, getHospitalPayments, getFacilities, createFacility } from "../services/api.js";
import "./SuperAdminDashboard.css";

const AVAILABLE_PERMISSIONS = [
  { key: "manage_beds",      label: "Beds",       icon: "🛏" },
  { key: "manage_transfers", label: "Transfers",  icon: "🔁" },
  { key: "view_patients",    label: "Patients",   icon: "👁" },
  { key: "assign_doctors",   label: "Doctors",    icon: "🩺" },
  { key: "manage_inventory", label: "Inventory",  icon: "💊" },
  { key: "manage_billing",   label: "Billing",    icon: "🧾" },
];

const ROLE_COLORS = {
  super_admin:  { bg: "#fef3c7", text: "#92400e", label: "Super Admin" },
  doctor:       { bg: "#dbeafe", text: "#1e40af", label: "Doctor"      },
  nurse:        { bg: "#d1fae5", text: "#065f46", label: "Nurse"       },
  receptionist: { bg: "#ede9fe", text: "#5b21b6", label: "Receptionist"},
};

const STATUS_COLORS = {
  paid:    { bg: "#d1fae5", text: "#065f46" },
  created: { bg: "#fef3c7", text: "#92400e" },
  failed:  { bg: "#fee2e2", text: "#991b1b" },
  refunded:{ bg: "#dbeafe", text: "#1e40af" },
};

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function AvatarCircle({ name, role }) {
  const colors = ["#0f766e","#7c3aed","#0284c7","#dc2626","#d97706","#059669"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className="sad-avatar" style={{ background: colors[idx] }}>
      {initials(name)}
    </div>
  );
}

export default function SuperAdminDashboard({ hospitalId }) {
  const [activeTab, setActiveTab] = useState("staff");
  const [staffList, setStaffList]   = useState([]);
  const [payments, setPayments]     = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loadingStaff, setLoadingStaff]     = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [error, setError]       = useState("");
  const [toast, setToast]       = useState("");

  // Create staff form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"doctor" });
  const [creating, setCreating] = useState(false);

  // Facility form
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    name: "", city: "", type: "Hospital",
    has_emergency: false, has_icu: false, has_general_practice: false, has_pharmacy: false,
    beds_general: 0, beds_icu: 0, beds_oxygen: 0, beds_emergency: 0
  });
  const [creatingFacility, setCreatingFacility] = useState(false);

  // Hospital info from localStorage
  const storedHospital = (() => {
    try { return JSON.parse(localStorage.getItem("medichain_hospital") || "{}"); } catch { return {}; }
  })();
  const storedStaff = (() => {
    try { return JSON.parse(localStorage.getItem("medichain_staff") || "{}"); } catch { return {}; }
  })();

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { 
    if (activeTab === "payments") loadPayments(); 
    if (activeTab === "facilities") loadFacilities();
  }, [activeTab]);

  async function loadStaff() {
    setLoadingStaff(true);
    setError("");
    try {
      const data = await getStaffList();
      setStaffList(data);
    } catch (err) {
      setError(err.message || "Failed to load staff.");
    } finally {
      setLoadingStaff(false);
    }
  }

  async function loadPayments() {
    setLoadingPayments(true);
    try {
      const { getHospitalPayments } = await import("../services/api.js");
      const data = await getHospitalPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function loadFacilities() {
    setLoadingFacilities(true);
    setError("");
    try {
      const hid = hospitalId || JSON.parse(localStorage.getItem('medichain_hospital') || '{}').id;
      const data = await getFacilities(hid);
      setFacilities(data || []);
    } catch (err) {
      setError(err.message || "Failed to load facilities.");
    } finally {
      setLoadingFacilities(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleTogglePermission(staffId, permKey, checked) {
    const member = staffList.find(s => s._id === staffId);
    if (!member) return;
    let perms = [...(member.permissions || [])];
    if (checked) { if (!perms.includes(permKey)) perms.push(permKey); }
    else { perms = perms.filter(p => p !== permKey); }
    try {
      await updateStaffPermissions(staffId, perms);
      setStaffList(prev => prev.map(s => s._id === staffId ? { ...s, permissions: perms } : s));
      showToast("Permissions saved ✓");
    } catch (err) {
      setError(err.message || "Failed to update permissions.");
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createStaffAccount({ hospital_id: hospitalId || storedHospital.id, ...form, permissions: [] });
      showToast("Staff account created ✓");
      setForm({ name:"", email:"", password:"", role:"doctor" });
      setShowForm(false);
      loadStaff();
    } catch (err) {
      setError(err.message || "Failed to create staff account.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateFacility(e) {
    e.preventDefault();
    setCreatingFacility(true);
    setError("");
    try {
      await createFacility(facilityForm);
      showToast("Facility created ✓");
      setFacilityForm({
        name: "", city: "", type: "Hospital",
        has_emergency: false, has_icu: false, has_general_practice: false, has_pharmacy: false,
        beds_general: 0, beds_icu: 0, beds_oxygen: 0, beds_emergency: 0
      });
      setShowFacilityForm(false);
      loadFacilities();
    } catch (err) {
      setError(err.message || "Failed to create facility.");
    } finally {
      setCreatingFacility(false);
    }
  }

  const handleFacilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFacilityForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const totalRevenue = payments.filter(p => p.status === "paid").reduce((a, p) => a + (p.amount || 0), 0);

  return (
    <div className="sad-root">
      {/* ── Header ── */}
      <div className="sad-header">
        <div className="sad-header__left">
          <div className="sad-header__icon">🏥</div>
          <div>
            <p className="sad-header__eyebrow">MediChain · Super Admin</p>
            <h2 className="sad-header__title">{storedHospital.name || "Hospital Portal"}</h2>
            <p className="sad-header__sub">
              Signed in as <strong>{storedStaff.name || "Admin"}</strong> ·{" "}
              <span className="sad-role-badge" style={{ background: ROLE_COLORS.super_admin.bg, color: ROLE_COLORS.super_admin.text }}>
                Super Admin
              </span>
            </p>
          </div>
        </div>
        <div className="sad-header__actions">
          <a href="/admin" className="sad-btn sad-btn--ghost">← Hospital Dashboard</a>
          <button className="sad-btn sad-btn--danger" onClick={() => {
            ["medichain_hospital_token","medichain_hospital","medichain_staff"].forEach(k => localStorage.removeItem(k));
            window.location.assign("/hospital-login");
          }}>Sign Out</button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="sad-stats">
        <div className="sad-stat-card">
          <span className="sad-stat-card__value">{staffList.length}</span>
          <span className="sad-stat-card__label">Total Staff</span>
        </div>
        <div className="sad-stat-card">
          <span className="sad-stat-card__value">
            {staffList.filter(s => s.role !== "super_admin").length}
          </span>
          <span className="sad-stat-card__label">Active Members</span>
        </div>
        <div className="sad-stat-card">
          <span className="sad-stat-card__value">{payments.filter(p => p.status === "paid").length}</span>
          <span className="sad-stat-card__label">Payments Received</span>
        </div>
        <div className="sad-stat-card sad-stat-card--highlight">
          <span className="sad-stat-card__value">₹{(totalRevenue / 100).toLocaleString("en-IN")}</span>
          <span className="sad-stat-card__label">Total Revenue</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sad-tabs">
        {[
          { key: "staff",    label: "👥 Staff Management" },
          { key: "payments", label: "💳 Payment History"  },
          { key: "facilities", label: "🏥 Facilities"  },
        ].map(tab => (
          <button
            key={tab.key}
            className={`sad-tab${activeTab === tab.key ? " sad-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="sad-alert sad-alert--error">{error} <button onClick={() => setError("")}>✕</button></div>}
      {toast && <div className="sad-alert sad-alert--success">{toast}</div>}

      {/* ══ STAFF TAB ══ */}
      {activeTab === "staff" && (
        <div className="sad-section">
          <div className="sad-section__head">
            <div>
              <h3>Staff Management</h3>
              <p className="sad-section__sub">Grant or revoke feature access per staff member.</p>
            </div>
            <button className="sad-btn sad-btn--primary" onClick={() => setShowForm(v => !v)}>
              {showForm ? "✕ Cancel" : "+ Add Staff"}
            </button>
          </div>

          {/* Create staff form */}
          {showForm && (
            <form className="sad-create-form" onSubmit={handleCreateStaff}>
              <h4>New Staff Account</h4>
              <div className="sad-form-grid">
                <label className="sad-field">
                  <span>Full Name</span>
                  <input required placeholder="Dr. Priya Sharma" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </label>
                <label className="sad-field">
                  <span>Email</span>
                  <input type="email" required placeholder="priya@hospital.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </label>
                <label className="sad-field">
                  <span>Password</span>
                  <input type="password" required minLength={6} placeholder="Min 6 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </label>
                <label className="sad-field">
                  <span>Role</span>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="sad-btn sad-btn--primary" disabled={creating}>
                {creating ? "Creating…" : "Create Staff Account"}
              </button>
            </form>
          )}

          {/* Staff list */}
          {loadingStaff ? (
            <div className="sad-loading">
              {[1,2,3].map(i => <div key={i} className="sad-skeleton" />)}
            </div>
          ) : staffList.length === 0 ? (
            <div className="sad-empty">No staff accounts yet. Add your first team member above.</div>
          ) : (
            <div className="sad-staff-grid">
              {staffList.map(staff => {
                const rc = ROLE_COLORS[staff.role] || ROLE_COLORS.receptionist;
                return (
                  <div key={staff._id} className="sad-staff-card">
                    <div className="sad-staff-card__top">
                      <AvatarCircle name={staff.name} role={staff.role} />
                      <div className="sad-staff-card__info">
                        <strong className="sad-staff-card__name">{staff.name}</strong>
                        <span className="sad-staff-card__email">{staff.email}</span>
                        <span className="sad-role-badge" style={{ background: rc.bg, color: rc.text }}>
                          {rc.label}
                        </span>
                      </div>
                    </div>
                    <div className="sad-perms">
                      <p className="sad-perms__label">Permissions</p>
                      <div className="sad-perms__chips">
                        {AVAILABLE_PERMISSIONS.map(p => {
                          const active = (staff.permissions || []).includes(p.key);
                          return (
                            <button
                              key={p.key}
                              className={`sad-perm-chip${active ? " sad-perm-chip--on" : ""}`}
                              onClick={() => handleTogglePermission(staff._id, p.key, !active)}
                              title={p.key}
                            >
                              {p.icon} {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ PAYMENTS TAB ══ */}
      {activeTab === "payments" && (
        <div className="sad-section">
          <div className="sad-section__head">
            <div>
              <h3>Payment History</h3>
              <p className="sad-section__sub">All appointment payments for your hospital.</p>
            </div>
          </div>

          {loadingPayments ? (
            <div className="sad-loading">{[1,2,3].map(i => <div key={i} className="sad-skeleton" />)}</div>
          ) : payments.length === 0 ? (
            <div className="sad-empty">No payments recorded yet.</div>
          ) : (
            <div className="sad-payments-table-wrap">
              <table className="sad-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Appointment</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const sc = STATUS_COLORS[p.status] || STATUS_COLORS.created;
                    return (
                      <tr key={p._id}>
                        <td><span className="sad-mono">{p.razorpay_order_id?.slice(-12) || "—"}</span></td>
                        <td><span className="sad-mono">{p.appointment_id?.slice(-8) || "—"}</span></td>
                        <td><strong>₹{((p.amount || 0) / 100).toLocaleString("en-IN")}</strong></td>
                        <td>
                          <span className="sad-status-badge" style={{ background: sc.bg, color: sc.text }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="sad-mono sad-muted">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ FACILITIES TAB ══ */}
      {activeTab === "facilities" && (
        <div className="sad-section">
          <div className="sad-section__head">
            <div>
              <h3>Facilities Management</h3>
              <p className="sad-section__sub">Manage hospitals and clinics in the network.</p>
            </div>
            <button className="sad-btn sad-btn--primary" onClick={() => setShowFacilityForm(v => !v)}>
              {showFacilityForm ? "✕ Cancel" : "+ Add Facility"}
            </button>
          </div>

          {/* Create facility form */}
          {showFacilityForm && (
            <form className="sad-create-form" onSubmit={handleCreateFacility}>
              <h4>New Facility</h4>
              <div className="sad-form-grid">
                <label className="sad-field">
                  <span>Name</span>
                  <input name="name" required placeholder="City Hospital" value={facilityForm.name} onChange={handleFacilityChange} />
                </label>
                <label className="sad-field">
                  <span>City</span>
                  <input name="city" required placeholder="Mumbai" value={facilityForm.city} onChange={handleFacilityChange} />
                </label>
                <label className="sad-field">
                  <span>Type</span>
                  <select name="type" value={facilityForm.type} onChange={handleFacilityChange}>
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                  </select>
                </label>
              </div>

              <div className="sad-perms" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <p className="sad-perms__label" style={{ marginBottom: '0.5rem' }}>Available Services</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="has_emergency" checked={facilityForm.has_emergency} onChange={handleFacilityChange} /> Emergency
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="has_icu" checked={facilityForm.has_icu} onChange={handleFacilityChange} /> ICU
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="has_general_practice" checked={facilityForm.has_general_practice} onChange={handleFacilityChange} /> General Practice
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="has_pharmacy" checked={facilityForm.has_pharmacy} onChange={handleFacilityChange} /> Pharmacy
                  </label>
                </div>
              </div>

              {facilityForm.type === 'Hospital' && (
                <div className="sad-perms" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <p className="sad-perms__label" style={{ marginBottom: '0.5rem' }}>Bed Configuration</p>
                  <div className="sad-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <label className="sad-field">
                      <span>General Beds</span>
                      <input type="number" min="0" name="beds_general" value={facilityForm.beds_general} onChange={handleFacilityChange} />
                    </label>
                    <label className="sad-field">
                      <span>ICU Beds</span>
                      <input type="number" min="0" name="beds_icu" value={facilityForm.beds_icu} onChange={handleFacilityChange} />
                    </label>
                    <label className="sad-field">
                      <span>Oxygen Beds</span>
                      <input type="number" min="0" name="beds_oxygen" value={facilityForm.beds_oxygen} onChange={handleFacilityChange} />
                    </label>
                    <label className="sad-field">
                      <span>Emergency Beds</span>
                      <input type="number" min="0" name="beds_emergency" value={facilityForm.beds_emergency} onChange={handleFacilityChange} />
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="sad-btn sad-btn--primary" disabled={creatingFacility}>
                {creatingFacility ? "Creating…" : "Create Facility"}
              </button>
            </form>
          )}

          {/* Facilities list */}
          {loadingFacilities ? (
            <div className="sad-loading">
              {[1,2,3].map(i => <div key={i} className="sad-skeleton" />)}
            </div>
          ) : facilities.length === 0 ? (
            <div className="sad-empty">No facilities found.</div>
          ) : (
            <div className="sad-staff-grid">
              {facilities.map(facility => (
                <div key={facility._id || facility.id} className="sad-staff-card">
                  <div className="sad-staff-card__top">
                    <div className="sad-staff-card__info">
                      <strong className="sad-staff-card__name">{facility.name}</strong>
                      <span className="sad-staff-card__email">{facility.city}</span>
                      <span className="sad-role-badge" style={{ 
                        background: facility.type === 'Hospital' ? '#dbeafe' : '#d1fae5', 
                        color: facility.type === 'Hospital' ? '#1e40af' : '#065f46',
                        display: 'inline-block',
                        marginTop: '0.5rem'
                      }}>
                        {facility.type || "Facility"}
                      </span>
                    </div>
                  </div>
                  {facility.type === 'Hospital' && (
                    <div className="sad-perms" style={{ marginTop: '1rem' }}>
                      <p className="sad-perms__label">Bed Capacity</p>
                      <div style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <span>General: {facility.beds_general || 0}</span>
                        <span>ICU: {facility.beds_icu || 0}</span>
                        <span>Oxygen: {facility.beds_oxygen || 0}</span>
                        <span>Emergency: {facility.beds_emergency || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
