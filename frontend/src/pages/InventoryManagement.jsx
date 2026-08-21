import { useEffect, useMemo, useState } from "react";
import { addMedicine, deleteMedicine, dispenseMedicine, getInventory, updateMedicine } from "../services/api.js";
import "./InventoryManagement.css";

const blankForm = {
  name: "",
  generic_name: "",
  sku: "",
  quantity: 0,
  unit: "tablets",
  expiry_date: "",
  reorder_threshold: 10,
  price_per_unit: 0,
  category: "Analgesic",
  description: "",
};

const CATEGORIES = [
  "All",
  "Analgesic",
  "Antibiotic",
  "Antacid",
  "Gastrointestinal",
  "Antihistamine",
  "Respiratory",
  "Cardiovascular",
  "Antidiabetic",
  "Vitamins",
];

export default function InventoryManagement({ hospitalId }) {
  const [items, setItems] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFullTable, setShowFullTable] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(null); // medicine object
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);

  // Dispense Form
  const [dispensePatientId, setDispensePatientId] = useState("");
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispenseApptId, setDispenseApptId] = useState("");
  const [dispensing, setDispensing] = useState(false);

  const load = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const data = await getInventory(hospitalId, search);
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      if (list.length > 0 && !selectedMedId) {
        setSelectedMedId(list[0].id);
      }
    } catch (e) {
      setError(e.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [hospitalId, search]);

  const lowStockItems = useMemo(
    () => items.filter((x) => x.quantity > 0 && x.quantity <= (x.reorder_threshold || 15)),
    [items]
  );
  const outOfStockItems = useMemo(() => items.filter((x) => x.quantity <= 0), [items]);

  const selectedMed = useMemo(
    () => items.find((x) => x.id === selectedMedId),
    [items, selectedMedId]
  );

  const filteredItems = useMemo(() => {
    return items.filter((x) => {
      const matchCat =
        selectedCategory === "All" ||
        (x.category && x.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchCat;
    });
  }, [items, selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        reorder_threshold: Number(form.reorder_threshold),
        price_per_unit: Number(form.price_per_unit),
      };

      if (editingId) {
        await updateMedicine(hospitalId, editingId, payload);
      } else {
        await addMedicine(hospitalId, payload);
      }

      setForm(blankForm);
      setEditingId(null);
      setShowAddModal(false);
      load();
    } catch (e) {
      setError(e.message || "Failed to save medicine.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      generic_name: item.generic_name || "",
      sku: item.sku || "",
      quantity: item.quantity || 0,
      unit: item.unit || "tablets",
      expiry_date: item.expiry_date || "",
      reorder_threshold: item.reorder_threshold || 10,
      price_per_unit: item.price_per_unit || 0,
      category: item.category || "Analgesic",
      description: item.description || "",
    });
    setShowAddModal(true);
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine record?")) return;
    try {
      await deleteMedicine(hospitalId, id);
      if (selectedMedId === id) setSelectedMedId("");
      load();
    } catch (e) {
      setError(e.message || "Failed to delete medicine.");
    }
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    if (!showDispenseModal || !dispensePatientId || dispenseQty <= 0) return;
    setDispensing(true);
    setError("");

    try {
      await dispenseMedicine(hospitalId, showDispenseModal.id, {
        patient_id: dispensePatientId,
        quantity: Number(dispenseQty),
        appointment_id: dispenseApptId || undefined,
      });

      setShowDispenseModal(null);
      setDispensePatientId("");
      setDispenseQty(1);
      setDispenseApptId("");
      load();
    } catch (e) {
      setError(e.message || "Failed to dispense medicine.");
    } finally {
      setDispensing(false);
    }
  };

  return (
    <section className="inventory-section">
      {/* Page Header */}
      <div className="inventory-header">
        <div>
          <p className="eyebrow">Hospital Operations · Pharmacy</p>
          <h2>Medicine & Pharmacy Inventory</h2>
          <p className="text-secondary">Track medication stock, SKUs, reorder thresholds, and patient dispensing.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm(blankForm);
            setShowAddModal(true);
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          + Add New Medicine
        </button>
      </div>

      {/* Metrics Row */}
      <div className="inventory-stats-grid">
        <div className="inv-stat-card card-surface">
          <span className="inv-stat-label">Total Medication SKUs</span>
          <span className="inv-stat-val">{items.length}</span>
        </div>
        <div className="inv-stat-card card-surface">
          <span className="inv-stat-label">In Stock Items</span>
          <span className="inv-stat-val inv-stat-val--ok">
            {items.reduce((sum, i) => sum + (i.quantity > 0 ? i.quantity : 0), 0)}
          </span>
        </div>
        <div className="inv-stat-card card-surface">
          <span className="inv-stat-label">Low Stock Alerts</span>
          <span className="inv-stat-val inv-stat-val--warn">{lowStockItems.length}</span>
        </div>
        <div className="inv-stat-card card-surface">
          <span className="inv-stat-label">Out of Stock</span>
          <span className="inv-stat-val inv-stat-val--danger">{outOfStockItems.length}</span>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {lowStockItems.length > 0 && (
        <div className="alert warning" style={{ background: "#fefce8", border: "1px solid #fef08a", color: "#854d0e" }}>
          ⚠️ <strong>Stock Warning:</strong> {lowStockItems.length} medicine(s) are below their minimum reorder threshold.
        </div>
      )}

      {/* 🔍 Searchable Medicine Selector / Dropdown */}
      <div className="card-surface" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "8px" }}>
          <label style={{ fontWeight: 700, color: "#0f766e", fontSize: "0.95rem" }}>
            🔍 Quick Select Medication:
          </label>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
            onClick={() => setShowFullTable(!showFullTable)}
          >
            {showFullTable ? "✕ Hide Full Catalog Table" : "📋 Show Full Catalog Table (" + items.length + ")"}
          </button>
        </div>

        <select
          value={selectedMedId}
          onChange={(e) => setSelectedMedId(e.target.value)}
          className="store-hospital-select"
          style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
        >
          <option value="">-- Choose a medicine to view or dispense --</option>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.generic_name}) · {m.sku || "NO-SKU"} · [{m.quantity} {m.unit} in stock] - ₹{m.price_per_unit}
            </option>
          ))}
        </select>

        {/* Selected Medicine Spotlight Card */}
        {selectedMed && (
          <div
            style={{
              marginTop: "1.25rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="medicine-category-badge">{selectedMed.category || "General"}</span>
                {selectedMed.sku && <span className="medicine-sku-tag">{selectedMed.sku}</span>}
              </div>
              <h3 style={{ margin: "4px 0 2px 0", color: "#0f172a" }}>{selectedMed.name}</h3>
              <p style={{ margin: 0, color: "#64748b", fontStyle: "italic", fontSize: "0.85rem" }}>
                {selectedMed.generic_name}
              </p>
              {selectedMed.description && (
                <p style={{ margin: "4px 0 0 0", color: "#475569", fontSize: "0.825rem" }}>
                  {selectedMed.description}
                </p>
              )}
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "8px", fontSize: "0.85rem" }}>
                <span>Stock: <strong>{selectedMed.quantity} {selectedMed.unit}</strong></span>
                <span>Price: <strong style={{ color: "#0f766e" }}>₹{Number(selectedMed.price_per_unit).toFixed(2)}</strong></span>
                <span>Expiry: <strong>{selectedMed.expiry_date || "N/A"}</strong></span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowDispenseModal(selectedMed);
                  setDispenseQty(1);
                }}
                disabled={selectedMed.quantity <= 0}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                💊 Dispense
              </button>
              <button className="btn btn-secondary" onClick={() => handleEdit(selectedMed)}>
                ✏️ Edit
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleRemove(selectedMed.id)}
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
              >
                ✕ Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="inv-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="inv-modal-card card-surface" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>{editingId ? "Edit Medication" : "Add New Medication to Inventory"}</h3>
              <button className="inv-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="inv-form-grid">
                <div className="form-group">
                  <label>Brand Name *</label>
                  <input
                    required
                    placeholder="e.g. Paracetamol 650mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Generic Formulation *</label>
                  <input
                    required
                    placeholder="e.g. Acetaminophen"
                    value={form.generic_name}
                    onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>SKU Code</label>
                  <input
                    placeholder="e.g. MED-PCM-650"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Therapeutic Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-select"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Unit Form *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="input-select"
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="strips">Strips</option>
                    <option value="bottles">Bottles / Syrup</option>
                    <option value="vials">Vials / Injection</option>
                    <option value="inhalers">Inhalers</option>
                    <option value="sachets">Sachets</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price_per_unit}
                    onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Reorder Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.reorder_threshold}
                    onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="input-text"
                  />
                </div>

                <div className="form-group">
                  <label>Description / Usage Note</label>
                  <input
                    placeholder="e.g. Fever and pain relief"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-text"
                  />
                </div>
              </div>

              <div className="inv-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {showDispenseModal && (
        <div className="inv-modal-backdrop" onClick={() => setShowDispenseModal(null)}>
          <div className="inv-modal-card card-surface" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Dispense Medication</h3>
              <button className="inv-modal-close" onClick={() => setShowDispenseModal(null)}>✕</button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "1rem" }}>
              <strong>{showDispenseModal.name}</strong> ({showDispenseModal.generic_name})
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                Current Stock: <strong>{showDispenseModal.quantity} {showDispenseModal.unit}</strong> · Price: ₹{showDispenseModal.price_per_unit.toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleDispenseSubmit}>
              <div className="form-group">
                <label>Patient ID (ObjectId) *</label>
                <input
                  required
                  placeholder="Paste or enter Patient ID"
                  value={dispensePatientId}
                  onChange={(e) => setDispensePatientId(e.target.value)}
                  className="input-text"
                />
              </div>

              <div className="form-group">
                <label>Dispense Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={showDispenseModal.quantity}
                  required
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(e.target.value)}
                  className="input-text"
                />
              </div>

              <div className="form-group">
                <label>Appointment ID (Optional)</label>
                <input
                  placeholder="Associated appointment ID if applicable"
                  value={dispenseApptId}
                  onChange={(e) => setDispenseApptId(e.target.value)}
                  className="input-text"
                />
              </div>

              <div className="inv-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDispenseModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={dispensing}>
                  {dispensing ? "Dispensing..." : `Confirm Dispense (${dispenseQty} ${showDispenseModal.unit})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Inventory Table (Togglable) */}
      {showFullTable && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div className="inventory-controls-bar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by brand name, generic formula, or SKU..."
              className="inv-search-input"
            />

            <div className="inv-category-chips">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`inv-cat-chip ${selectedCategory === cat ? "inv-cat-chip--active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading pharmacy inventory catalog...</div>
          ) : (
            <div className="inv-table-wrap card-surface">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Medication & SKU</th>
                    <th>Category</th>
                    <th>Stock Left</th>
                    <th>Unit Price</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLow = item.quantity > 0 && item.quantity <= (item.reorder_threshold || 15);
                    const isOut = item.quantity <= 0;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="inv-med-col">
                            <strong className="inv-med-name">{item.name}</strong>
                            <span className="inv-med-generic">{item.generic_name}</span>
                            {item.sku && <span className="inv-med-sku">{item.sku}</span>}
                          </div>
                        </td>
                        <td>
                          <span className="inv-tag-category">{item.category || "General"}</span>
                        </td>
                        <td>
                          <strong style={{ fontSize: "1rem" }}>{item.quantity}</strong>{" "}
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.unit}</span>
                        </td>
                        <td>
                          <strong style={{ color: "#0f766e" }}>₹{Number(item.price_per_unit).toFixed(2)}</strong>
                        </td>
                        <td className="inv-mono-date">{item.expiry_date || "—"}</td>
                        <td>
                          {isOut ? (
                            <span className="inv-badge inv-badge--out">Out of Stock</span>
                          ) : isLow ? (
                            <span className="inv-badge inv-badge--low">Low Stock</span>
                          ) : (
                            <span className="inv-badge inv-badge--ok">In Stock</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="inv-actions-row">
                            <button
                              className="inv-btn-action inv-btn-action--dispense"
                              onClick={() => {
                                setShowDispenseModal(item);
                                setDispenseQty(1);
                              }}
                              disabled={isOut}
                              title="Dispense to Patient"
                            >
                              Dispense
                            </button>
                            <button
                              className="inv-btn-action"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              className="inv-btn-action inv-btn-action--del"
                              onClick={() => handleRemove(item.id)}
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="empty-state" style={{ padding: "3rem" }}>
                  No medications found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
