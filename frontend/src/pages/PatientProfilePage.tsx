import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { API } from "../api";

type Scan = {
  id: number; filename: string; prediction: string; confidence: number;
  timestamp: string; heatmap_url: string | null; model_version: string;
};

type Patient = {
  id: number; name: string; age: number;
  medical_history: string | null; created_at: string; scans: Scan[];
};

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/patients/${id}`)
      .then(r => r.json())
      .then(d => { setPatient(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-body"><div className="empty-state" style={{ height: "60vh" }}><span className="spinner spinner-lg" /></div></div>;
  if (!patient) return <div className="page-body"><div className="empty-state"><p>Patient not found</p></div></div>;

  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const malignantCount = patient.scans.filter(s => s.prediction === "malignant").length;
  const benignCount = patient.scans.filter(s => s.prediction === "benign").length;

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/patients")} style={{ marginBottom: 16 }}>
          <ArrowLeft size={13} /> All Patients
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="patient-avatar" style={{ width: 56, height: 56, fontSize: 22, borderRadius: 16 }}>
            {initials}
          </div>
          <div>
            <h1 className="page-title">{patient.name}</h1>
            <p className="page-subtitle">Age {patient.age} · Patient ID #{patient.id} · Registered {new Date(patient.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="page-body stack stack-lg">
        {/* Summary stats */}
        <div className="grid-3">
          <div className="stat-card">
            <div className="stat-icon blue"><Calendar size={18} /></div>
            <div>
              <div className="stat-label">Total Scans</div>
              <div className="stat-value">{patient.scans.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red" style={{ background: "rgba(248,113,113,0.15)", color: "var(--malignant)" }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="stat-label">Malignant</div>
              <div className="stat-value" style={{ color: "var(--malignant)" }}>{malignantCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green" style={{ background: "rgba(52,211,153,0.15)", color: "var(--benign)" }}>
              <TrendingDown size={18} />
            </div>
            <div>
              <div className="stat-label">Benign</div>
              <div className="stat-value" style={{ color: "var(--benign)" }}>{benignCount}</div>
            </div>
          </div>
        </div>

        {/* Medical History */}
        {patient.medical_history && (
          <div className="card">
            <p className="card-title">Medical History</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{patient.medical_history}</p>
          </div>
        )}

        {/* Scan Timeline */}
        <div className="card">
          <p className="card-title" style={{ marginBottom: 20 }}>Scan Timeline</p>
          {patient.scans.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} style={{ opacity: 0.3 }} />
              <p className="empty-state-title">No scans yet</p>
              <p className="empty-state-sub">Upload an image and enter Patient ID #{patient.id} to link it</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {patient.scans.map((scan, i) => (
                <div key={scan.id} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < patient.scans.length - 1 ? "1px solid var(--border)" : "none" }}>
                  {/* Timeline dot */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 4, width: 20, flexShrink: 0 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                      background: scan.prediction === "malignant" ? "var(--malignant)" : "var(--benign)",
                      boxShadow: `0 0 8px ${scan.prediction === "malignant" ? "var(--malignant)" : "var(--benign)"}`,
                    }} />
                    {i < patient.scans.length - 1 && <div style={{ flex: 1, width: 1, background: "var(--border)", minHeight: 24 }} />}
                  </div>

                  {/* Scan info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{scan.filename}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{new Date(scan.timestamp).toLocaleString()}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className={`badge badge-${scan.prediction}`}>{scan.prediction}</span>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{(scan.confidence * 100).toFixed(1)}%</span>
                        <span className="badge badge-version">{scan.model_version}</span>
                        <a href={`${API}/export/pdf/${scan.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          <Download size={11} /> PDF
                        </a>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div style={{ marginTop: 10, maxWidth: 300 }}>
                      <div className="confidence-bar-track">
                        <div className="confidence-bar-fill" style={{ width: `${scan.confidence * 100}%` }} />
                      </div>
                    </div>

                    {/* Heatmap thumbnail */}
                    {scan.heatmap_url && (
                      <a href={`${API}${scan.heatmap_url}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10 }}>
                        <img
                          src={`${API}${scan.heatmap_url}`}
                          alt="Heatmap"
                          style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", transition: "transform 0.2s" }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
