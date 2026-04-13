import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Clock } from "lucide-react";
import { API } from "../api";

type Record = {
  id: number;
  filename: string;
  prediction: string;
  confidence: number;
  timestamp: string;
  heatmap_url: string | null;
  model_version: string;
  patient_id: number | null;
  patient_name: string | null;
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<"all" | "malignant" | "benign">("all");

  const { data: records = [], isLoading: loading, refetch } = useQuery<Record[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await fetch(`${API}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    }
  });

  const filtered =
    filter === "all" ? records : records.filter((r) => r.prediction === filter);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Prediction History</h1>
        <p className="page-subtitle">All past scans across patients</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div className="tabs">
              {(["all", "malignant", "benign"] as const).map((f) => (
                <button
                  key={f}
                  className={`tab-btn${filter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ml-auto" style={{ display: "flex", gap: 8 }}>
              <a
                href={`${API}/export/csv`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <Download size={13} /> Export CSV
              </a>
              <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="spinner spinner-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Clock />
              <p className="empty-state-title">No records yet</p>
              <p className="empty-state-sub">
                Upload images from the "New Scan" page
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Filename</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Model</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--text-muted)" }}>#{r.id}</td>
                      <td
                        className="td-primary"
                        style={{
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.filename}
                      </td>
                      <td>
                        <span className={`badge badge-${r.prediction}`}>
                          {r.prediction}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            className="confidence-bar-track"
                            style={{ width: 60 }}
                          >
                            <div
                              className="confidence-bar-fill"
                              style={{ width: `${r.confidence * 100}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 12 }}>
                            {(r.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-version">
                          {r.model_version || "v1.0"}
                        </span>
                      </td>
                      <td
                        style={{ color: "var(--text-secondary)", fontSize: 12 }}
                      >
                        {r.patient_name ? (
                          `${r.patient_name} (#${r.patient_id})`
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {r.heatmap_url && (
                            <a
                              href={`${API}${r.heatmap_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                              title="View heatmap"
                            >
                              🔥
                            </a>
                          )}
                          <a
                            href={`${API}/export/pdf/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
