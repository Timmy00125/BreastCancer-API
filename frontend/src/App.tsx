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
      <div className="flex min-h-screen">
        <aside className="w-[260px] bg-bauhaus-black fixed top-0 left-0 h-screen flex flex-col z-50 border-r-3 border-bauhaus-black">
          <div className="px-6 pt-7 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-bauhaus-yellow flex items-center justify-center">
                <Upload size={18} className="text-bauhaus-black" />
              </div>
              <div>
                <span className="font-display font-extrabold text-white text-lg tracking-tight leading-none">
                  ONCO
                </span>
                <span className="font-display font-extrabold text-bauhaus-yellow text-lg tracking-tight leading-none">
                  SCAN
                </span>
              </div>
              <span className="ml-auto text-[10px] font-body font-bold tracking-widest text-bauhaus-yellow border border-bauhaus-yellow/30 px-2 py-0.5">
                AI
              </span>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
            <span className="text-[10px] font-body font-bold tracking-[0.15em] text-white/40 uppercase px-4 pt-2 pb-2">
              Diagnostics
            </span>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 font-body font-semibold text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-white text-bauhaus-black border-l-4 border-bauhaus-yellow"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`
              }
            >
              <Upload size={16} />
              New Scan
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 font-body font-semibold text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-white text-bauhaus-black border-l-4 border-bauhaus-yellow"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`
              }
            >
              <Clock size={16} />
              History
            </NavLink>

            <span className="text-[10px] font-body font-bold tracking-[0.15em] text-white/40 uppercase px-4 pt-4 pb-2">
              Clinical
            </span>
            <NavLink
              to="/patients"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 font-body font-semibold text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-white text-bauhaus-black border-l-4 border-bauhaus-yellow"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`
              }
            >
              <Users size={16} />
              Patients
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 font-body font-semibold text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-white text-bauhaus-black border-l-4 border-bauhaus-yellow"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`
              }
            >
              <LayoutDashboard size={16} />
              Analytics
            </NavLink>
          </nav>

          <div className="px-4 pb-4">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 border border-white/10">
              <Activity size={13} className="text-bauhaus-yellow" />
              <span className="text-[11px] font-body font-semibold text-white/60">
                Model:{" "}
                <span className="text-bauhaus-yellow font-bold">v1.0</span>
              </span>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_6px_#34D399]" />
            </div>
          </div>
        </aside>

        <main className="ml-[260px] flex-1 min-h-screen flex flex-col bg-bauhaus-surface">
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