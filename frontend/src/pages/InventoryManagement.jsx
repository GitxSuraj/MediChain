import { useEffect, useMemo, useState } from "react";
import { addMedicine, deleteMedicine, dispenseMedicine, getInventory, updateMedicine } from "../services/api.js";

const blank = { name: "", generic_name: "", quantity: 0, unit: "tablets", expiry_date: "", reorder_threshold: 0, price_per_unit: 0, category: "" };
export default function InventoryManagement({ hospitalId }) {
  const [items, setItems] = useState([]), [form, setForm] = useState(blank), [search, setSearch] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(true), [editing, setEditing] = useState(null);
  const load = async () => { setLoading(true); try { setItems(await getInventory(hospitalId, search)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [hospitalId, search]);
  const low = useMemo(() => items.filter(x => x.quantity <= x.reorder_threshold), [items]);
  const submit = async e => { e.preventDefault(); try { const payload = { ...form, quantity: Number(form.quantity), reorder_threshold: Number(form.reorder_threshold), price_per_unit: Number(form.price_per_unit) }; editing ? await updateMedicine(hospitalId, editing, payload) : await addMedicine(hospitalId, payload); setForm(blank); setEditing(null); load(); } catch (e) { setError(e.message); } };
  const remove = async id => { if (!window.confirm("Delete this medicine?")) return; try { await deleteMedicine(hospitalId, id); load(); } catch (e) { setError(e.message); } };
  const dispense = async id => { const patient_id = window.prompt("Patient ID"); const quantity = Number(window.prompt("Quantity")); if (!patient_id || !quantity) return; try { await dispenseMedicine(hospitalId, id, { patient_id, quantity }); load(); } catch (e) { setError(e.message); } };
  return <section className="page">
    <div className="page-header"><p className="eyebrow">Pharmacy</p><h2>Inventory</h2>{low.length > 0 && <div className="alert error">⚠ {low.length} medicines are low on stock</div>}</div>
    {error && <div className="alert error">{error}</div>}
    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine or generic name" />
    <form className="toolbar" onSubmit={submit}>
      {Object.keys(blank).map(key => <input key={key} required={key !== "quantity" && key !== "reorder_threshold" && key !== "price_per_unit"} type={key.includes("date") ? "date" : ["quantity", "threshold", "price"].some(x => key.includes(x)) ? "number" : "text"} value={form[key]} placeholder={key.replaceAll("_", " ")} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
      <button className="secondary-button">{editing ? "Save medicine" : "Add medicine"}</button>
    </form>
    {loading ? <div className="empty-state">Loading inventory…</div> : <div className="hospital-panel" style={{ overflowX: "auto" }}><table><thead><tr>{["Name", "Generic", "Stock", "Expiry", "Category", "Price", "Actions"].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{items.map(x => <tr key={x.id} style={{ color: x.quantity <= x.reorder_threshold ? "#b42318" : undefined }}><td>{x.name}</td><td>{x.generic_name}</td><td>{x.quantity} {x.unit}</td><td>{x.expiry_date}</td><td>{x.category}</td><td>₹{x.price_per_unit}</td><td><button onClick={() => { setEditing(x.id); setForm({ ...x }); }}>Edit</button> <button onClick={() => dispense(x.id)}>Dispense</button> <button onClick={() => remove(x.id)}>Delete</button></td></tr>)}</tbody></table>{!items.length && <p>No medicines found.</p>}</div>}
  </section>;
}
