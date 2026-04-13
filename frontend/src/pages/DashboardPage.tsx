import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Activity, Users, TrendingUp, RefreshCw } from "lucide-react";
import { API } from "../api";

type Analytics = {
  total_scans: number;
  malignant_count: number;
  benign_count: number;
  average_confidence: number;
  total_patients: number;
  monthly_breakdown: { month: string; benign: number; malignant: number }[];
};

const PIE_COLORS = ["#34d399", "#f87171"];

export default function DashboardPage() {
  const { data, isLoading: loading, refetch } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch(`${API}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });

  if (loading)
    return (
      <div className="page-body">
        <div className="empty-state" style={{ height: "60vh" }}>
          <span className="spinner spinner-lg" />
        </div>
      </div>
    );
  if (!data) return null;

  const pieData = [
    { name: "Benign", value: data.benign_count },
    { name: "Malignant", value: data.malignant_count },
  ];

  const malignantRate =
    data.total_scans > 0
      ? ((data.malignant_count / data.total_scans) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">
          Aggregate system metrics and prediction trends
        </p>
      </div>

      <div className="page-body stack stack-lg">
        {/* Stats row */}
        <div className="grid-4">
          <div className="stat-card">
            <div className="stat-icon pink">
              <ScanIcon size={18} />
            </div>
            <div>
              <div className="stat-label">Total Scans</div>
              <div className="stat-value">{data.total_scans}</div>
              <div className="stat-sub">All time</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon violet">
              <Users size={18} />
            </div>
            <div>
              <div className="stat-label">Patients</div>
              <div className="stat-value">{data.total_patients}</div>
              <div className="stat-sub">Registered</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="stat-label">Malignant Rate</div>
              <div className="stat-value" style={{ color: "var(--malignant)" }}>
                {malignantRate}%
              </div>
              <div className="stat-sub">{data.malignant_count} cases</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal">
              <Activity size={18} />
            </div>
            <div>
              <div className="stat-label">Avg. Confidence</div>
              <div className="stat-value">
                {data.average_confidence.toFixed(1)}%
              </div>
              <div className="stat-sub">Model certainty</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Bar Chart */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <p className="card-title" style={{ marginBottom: 0 }}>
                Monthly Breakdown
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
                <RefreshCw size={12} />
              </button>
            </div>
            {data.monthly_breakdown.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Activity size={30} style={{ opacity: 0.3 }} />
                <p className="empty-state-title">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.monthly_breakdown} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#475569", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#161929",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey="benign"
                    name="Benign"
                    fill="#34d399"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="malignant"
                    name="Malignant"
                    fill="#f87171"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie Chart */}
          <div className="card">
            <p className="card-title" style={{ marginBottom: 20 }}>
              Diagnosis Distribution
            </p>
            {data.total_scans === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Activity size={30} style={{ opacity: 0.3 }} />
                <p className="empty-state-title">No scans yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#161929",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(v) => (
                      <span style={{ color: "#94a3b8", fontSize: 13 }}>
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Summary rows */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--benign)",
                    }}
                  />
                  <span
                    style={{ fontSize: 13, color: "var(--text-secondary)" }}
                  >
                    Benign
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--benign)",
                  }}
                >
                  {data.benign_count}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--malignant)",
                    }}
                  />
                  <span
                    style={{ fontSize: 13, color: "var(--text-secondary)" }}
                  >
                    Malignant
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--malignant)",
                  }}
                >
                  {data.malignant_count}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence gauge-style card */}
        <div className="card">
          <p className="card-title">Average Model Confidence</p>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="confidence-bar-wrap">
                <div className="confidence-bar-header">
                  <span className="confidence-bar-label">Confidence</span>
                  <span className="confidence-bar-value">
                    {data.average_confidence.toFixed(2)}%
                  </span>
                </div>
                <div className="confidence-bar-track" style={{ height: 10 }}>
                  <div
                    className="confidence-bar-fill"
                    style={{ width: `${data.average_confidence}%` }}
                  />
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "var(--accent-pink)",
                  letterSpacing: -2,
                }}
              >
                {data.average_confidence.toFixed(1)}
                <span style={{ fontSize: 18 }}>%</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                across {data.total_scans} scans
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// inline icon shim (lucide Scan isn't always available)
function ScanIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}
