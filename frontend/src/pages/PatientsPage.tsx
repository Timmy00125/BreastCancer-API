import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, ChevronRight, UserCircle } from "lucide-react";
import { API } from "../api";

type Patient = {
  id: number; name: string; age: number;
  medical_history: string | null; scan_count: number; created_at: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", medical_history: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/patients`);
      if (res.ok) setPatients(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.age) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("age", form.age);
    if (form.medical_history) fd.append("medical_history", form.medical_history);
    try {
      await fetch(`${API}/patients`, { method: "POST", body: fd });
      setShowModal(false);
      setForm({ name: "", age: "", medical_history: "" });
      fetchPatients();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this patient and all their scans?")) return;
    await fetch(`${API}/patients/${id}`, { method: "DELETE" });
    fetchPatients();
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Patients</h1>
        <p className="page-subtitle">Manage patient profiles and longitudinal scan history</p>
      </div>

      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Patient
          </button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 80 }}><span className="spinner spinner-lg" /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <UserCircle size={40} style={{ opacity: 0.3 }} />
            <p className="empty-state-title">No patients yet</p>
            <p className="empty-state-sub">Create a patient profile to start tracking scans longitudinally</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add First Patient
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {patients.map(p => (
              <div
                key={p.id}
                className="patient-card"
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div className="patient-avatar">{initials(p.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="patient-name">{p.name}</p>
                  <p className="patient-meta">Age {p.age} · ID #{p.id}</p>
                  {p.medical_history && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.medical_history}
                    </p>
                  )}
                </div>
                <div className="patient-scans">
                  <div className="patient-scans-count">{p.scan_count}</div>
                  <div className="patient-scans-label">Scans</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(p.id, e)} style={{ padding: "6px 8px" }}>
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title"><Plus size={16} />New Patient</p>
            <div className="stack stack-md">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Jane Doe" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input className="form-input" type="number" placeholder="e.g. 45" min="1" max="120" value={form.age} onChange={e => setForm(f => ({...f, age: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea className="form-textarea" placeholder="e.g. Family history of breast cancer, prior biopsies..." value={form.medical_history} onChange={e => setForm(f => ({...f, medical_history: e.target.value}))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name || !form.age || saving}>
                {saving ? <><span className="spinner" />Saving...</> : <><Users size={14} />Create Patient</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
