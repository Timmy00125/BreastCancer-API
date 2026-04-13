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

const PIE_COLORS = ["#1565C0", "#E53935"];

export default function DashboardPage() {
  const { data, isLoading: loading, refetch } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch(`${API}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (loading)
    return (
      <div className="px-8 pt-8 pb-10 flex-1 flex items-center justify-center">
        <span className="inline-block w-9 h-9 border-3 border-bauhaus-border border-t-bauhaus-blue rounded-full animate-spin" />
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
      <div className="px-8 pt-8">
        <h1 className="font-display font-extrabold text-3xl text-bauhaus-black tracking-tight">
          ANALYTICS DASHBOARD
        </h1>
        <div className="w-16 h-1 bg-bauhaus-red mt-2 mb-1" />
        <p className="text-bauhaus-gray text-sm font-body">
          Aggregate system metrics and prediction trends
        </p>
      </div>

      <div className="px-8 pt-5 pb-10 flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-bauhaus-yellow">
            <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-yellow/20 text-bauhaus-black">
              <ScanIcon size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Total Scans
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-black tracking-tight leading-none mt-1">
                {data.total_scans}
              </div>
              <div className="text-[11px] text-bauhaus-gray font-body mt-1">
                All time
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-bauhaus-blue">
            <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-blue/10 text-bauhaus-blue">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Patients
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-black tracking-tight leading-none mt-1">
                {data.total_patients}
              </div>
              <div className="text-[11px] text-bauhaus-gray font-body mt-1">
                Registered
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-bauhaus-red">
            <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-red/10 text-bauhaus-red">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Malignant Rate
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-red tracking-tight leading-none mt-1">
                {malignantRate}%
              </div>
              <div className="text-[11px] text-bauhaus-gray font-body mt-1">
                {data.malignant_count} cases
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-[#34D399]">
            <div className="w-10 h-10 flex items-center justify-center bg-[#34D399]/10 text-[#34D399]">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Avg. Confidence
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-black tracking-tight leading-none mt-1">
                {data.average_confidence.toFixed(1)}%
              </div>
              <div className="text-[11px] text-bauhaus-gray font-body mt-1">
                Model certainty
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border-2 border-bauhaus-black p-6">
            <div className="flex justify-between items-center mb-5">
              <p className="font-display font-bold text-bauhaus-black text-[13px]">
                Monthly Breakdown
              </p>
              <button
                className="inline-flex items-center px-2 py-1 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[11px] hover:bg-bauhaus-yellow transition-all"
                onClick={() => refetch()}
              >
                <RefreshCw size={12} />
              </button>
            </div>
            {data.monthly_breakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity size={30} className="text-bauhaus-border" />
                <p className="font-display font-bold text-bauhaus-gray text-[14px] mt-2">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.monthly_breakdown} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.08)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6B6B63", fontSize: 11 }}
                    axisLine={{ stroke: "#D4D4CF" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6B6B63", fontSize: 11 }}
                    axisLine={{ stroke: "#D4D4CF" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "2px solid #000000",
                      borderRadius: 0,
                      color: "#000000",
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar
                    dataKey="benign"
                    name="Benign"
                    fill="#1565C0"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="malignant"
                    name="Malignant"
                    fill="#E53935"
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border-2 border-bauhaus-black p-6">
            <p className="font-display font-bold text-bauhaus-black text-[13px] mb-5">
              Diagnosis Distribution
            </p>
            {data.total_scans === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity size={30} className="text-bauhaus-border" />
                <p className="font-display font-bold text-bauhaus-gray text-[14px] mt-2">
                  No scans yet
                </p>
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
                      background: "#FFFFFF",
                      border: "2px solid #000000",
                      borderRadius: 0,
                      color: "#000000",
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(v) => (
                      <span className="text-[13px] font-body text-bauhaus-gray">
                        {v}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-bauhaus-blue" />
                  <span className="text-[13px] font-body text-bauhaus-gray">
                    Benign
                  </span>
                </div>
                <span className="text-[13px] font-body font-bold text-bauhaus-blue">
                  {data.benign_count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-bauhaus-red" />
                  <span className="text-[13px] font-body text-bauhaus-gray">
                    Malignant
                  </span>
                </div>
                <span className="text-[13px] font-body font-bold text-bauhaus-red">
                  {data.malignant_count}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-bauhaus-black p-6">
          <p className="font-display font-bold text-bauhaus-black text-[13px]">
            Average Model Confidence
          </p>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex-1">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-[12px] font-body text-bauhaus-gray">
                    Confidence
                  </span>
                  <span className="text-[12px] font-body font-bold text-bauhaus-black">
                    {data.average_confidence.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2.5 bg-bauhaus-surface border border-bauhaus-black/10 overflow-hidden">
                  <div
                    className="h-full bg-bauhaus-black transition-all"
                    style={{ width: `${data.average_confidence}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-extrabold text-[36px] text-bauhaus-red tracking-tighter leading-none">
                {data.average_confidence.toFixed(1)}
                <span className="text-[18px]">%</span>
              </div>
              <div className="text-[11px] text-bauhaus-gray font-body mt-1">
                across {data.total_scans} scans
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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