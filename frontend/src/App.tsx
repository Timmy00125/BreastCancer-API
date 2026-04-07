import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Activity, Users, LayoutDashboard, Clock, Upload } from "lucide-react";
import "./index.css";
import PredictPage from "./pages/PredictPage";
import PatientsPage from "./pages/PatientsPage";
import PatientProfilePage from "./pages/PatientProfilePage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🩺</div>
            <span className="logo-text">OncoScan</span>
            <span className="logo-version">AI</span>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-section-label">Diagnostics</span>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Upload size={16} /> New Scan
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Clock size={16} /> History
            </NavLink>

            <span className="nav-section-label" style={{ marginTop: 8 }}>
              Clinical
            </span>
            <NavLink
              to="/patients"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Users size={16} /> Patients
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <LayoutDashboard size={16} /> Analytics
            </NavLink>
          </nav>

          <div
            style={{ padding: "16px", borderTop: "1px solid var(--border)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(232,121,160,0.06)",
                border: "1px solid rgba(232,121,160,0.15)",
              }}
            >
              <Activity size={14} style={{ color: "var(--accent-pink)" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Model:{" "}
                <span style={{ color: "var(--accent-pink)", fontWeight: 600 }}>
                  v1.0
                </span>
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--benign)",
                  display: "block",
                  boxShadow: "0 0 6px var(--benign)",
                }}
              />
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<PredictPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
