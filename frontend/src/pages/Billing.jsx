import { useEffect, useMemo, useState } from "react";
import { generateBill, getHospitalAppointmentRequests, updateBillStatus } from "../services/api.js";
import "./Billing.css";

export default function Billing() {
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [bill, setBill] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const hospitalObj = JSON.parse(localStorage.getItem("medichain_hospital") || "{}");

  const loadAppointments = () => {
    setLoading(true);
    getHospitalAppointmentRequests()
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Failed to load appointments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const selectedAppointment = useMemo(
    () => appointments.find((x) => x.id === appointmentId),
    [appointments, appointmentId]
  );

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!appointmentId) return;
    setGenerating(true);
    setError("");

    try {
      // Automatically generate bill including the 500 consultation fee (paid online during booking)
      const generated = await generateBill({
        appointment_id: appointmentId,
        manual_items: [
          {
            description: "Doctor Consultation Fee (Online Booking - Paid)",
            quantity: 1,
            unit_price: 500,
            total: 500,
          },
        ],
        tax_rate: 0,
      });

      setBill(generated);
    } catch (e) {
      setError(e.message || "Could not generate bill for this appointment.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!bill) return;
    try {
      const updated = await updateBillStatus(bill.id, newStatus);
      setBill(updated);
    } catch (e) {
      setError(e.message || "Failed to update bill status.");
    }
  };

  return (
    <section className="billing-page">
      <div className="page-header no-print">
        <p className="eyebrow">Finance & Hospital Operations</p>
        <h2>Patient Billing & Invoices</h2>
        <p className="text-secondary">
          Generate itemized hospital bills automatically pulling dispensed pharmacy medications.
        </p>
      </div>

      {error && <div className="alert error no-print">{error}</div>}

      {/* Bill Generator Panel */}
      <div className="hospital-panel no-print" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", color: "#064e3b" }}>Generate New Invoice</h3>

        <form onSubmit={handleGenerateBill} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label className="field" style={{ width: "100%" }}>
            <span style={{ fontWeight: 700, color: "#374151" }}>Select Patient Appointment:</span>
            <select
              required
              value={appointmentId}
              onChange={(e) => {
                setAppointmentId(e.target.value);
                setBill(null);
                setError("");
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
                marginTop: "4px",
              }}
            >
              <option value="">-- Choose an appointment --</option>
              {appointments.map((appt) => (
                <option value={appt.id} key={appt.id}>
                  {appt.doctorName} · {appt.doctorSpecialty} — {appt.date} at {appt.time} [{appt.status}]
                </option>
              ))}
            </select>
          </label>

          {selectedAppointment && (
            <div
              style={{
                background: "#f0fdfa",
                border: "1px solid #ccfbf1",
                padding: "1rem",
                borderRadius: "8px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "10px",
                fontSize: "0.88rem",
              }}
            >
              <div>
                <span style={{ color: "#64748b" }}>Attending Doctor:</span>
                <strong style={{ display: "block", color: "#0f766e" }}>{selectedAppointment.doctorName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Appointment Date:</span>
                <strong style={{ display: "block" }}>{selectedAppointment.date} ({selectedAppointment.time})</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Status:</span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    background: selectedAppointment.status === "Completed" ? "#dcfce7" : "#fef08a",
                    color: selectedAppointment.status === "Completed" ? "#166534" : "#854d0e",
                  }}
                >
                  {selectedAppointment.status}
                </span>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Consultation Fee:</span>
                <strong style={{ display: "block", color: "#16a34a" }}>₹500 (Prepaid Online ✅)</strong>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!appointmentId || generating}
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
            >
              {generating ? "Calculating & Generating..." : "🧾 Generate Bill"}
            </button>
          </div>
        </form>
      </div>

      {/* Rendered Invoice Card */}
      {bill && (
        <article className="hospital-panel bill-print invoice-card">
          <div className="invoice-header">
            <div>
              <span className="invoice-brand">MEDICHAIN HOSPITAL NETWORK</span>
              <h2 className="invoice-hospital-name">{hospitalObj.name || "Hospital Healthcare Services"}</h2>
              <p className="invoice-hospital-sub">{hospitalObj.city || "Official Facility"} · Inpatient & Pharmacy Billing</p>
            </div>

            <div className="invoice-meta-col">
              <span className="invoice-badge">TAX INVOICE</span>
              <span className="invoice-id">Invoice #{bill.id?.slice(-8).toUpperCase() || bill.id}</span>
              <span className="invoice-date">Date: {new Date(bill.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          </div>

          <div className="invoice-status-row no-print">
            <span style={{ fontWeight: 600, color: "#374151" }}>Payment Status:</span>
            <select
              value={bill.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="invoice-status-select"
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid ✅</option>
            </select>
          </div>

          <table className="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Item Description</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <strong>{item.description}</strong>
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹{Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>₹{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals-wrapper">
            <div className="invoice-totals-table">
              <div className="totals-row">
                <span>Subtotal:</span>
                <span>₹{Number(bill.subtotal).toFixed(2)}</span>
              </div>
              <div className="totals-row">
                <span>Applicable Tax:</span>
                <span>₹{Number(bill.tax).toFixed(2)}</span>
              </div>
              <div className="totals-row totals-row--grand">
                <strong>Total Amount:</strong>
                <strong style={{ color: "#0f766e" }}>₹{Number(bill.total).toFixed(2)}</strong>
              </div>
              {bill.status === "paid" && (
                <div style={{ textAlign: "right", color: "#16a34a", fontWeight: 700, fontSize: "0.85rem", marginTop: "2px" }}>
                  ✅ PAID IN FULL
                </div>
              )}
            </div>
          </div>

          <div className="invoice-footer-actions no-print">
            <button className="btn btn-secondary" onClick={() => setBill(null)}>
              Close
            </button>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              🖨️ Print Official Invoice
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
