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

  const {
    data: records = [],
    isLoading: loading,
    refetch,
  } = useQuery<Record[]>({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await fetch(`${API}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  const filtered =
    filter === "all" ? records : records.filter((r) => r.prediction === filter);

  return (
    <>
      <div className="px-8 pt-8">
        <h1 className="font-display font-extrabold text-3xl text-bauhaus-black tracking-tight">
          PREDICTION HISTORY
        </h1>
        <div className="w-16 h-1 bg-bauhaus-blue mt-2 mb-1" />
        <p className="text-bauhaus-gray text-sm font-body">
          All past scans across patients
        </p>
      </div>

      <div className="px-8 pt-5 pb-10 flex-1">
        <div className="bg-white border-2 border-bauhaus-black">
          <div className="flex items-center gap-3 p-4 border-b-2 border-bauhaus-black flex-wrap">
            <div className="flex bg-bauhaus-surface border-2 border-bauhaus-black">
              {(["all", "malignant", "benign"] as const).map((f) => (
                <button
                  key={f}
                  className={`px-4 py-2 font-body font-bold text-[12px] tracking-wider uppercase transition-all ${
                    filter === f
                      ? "bg-bauhaus-black text-white"
                      : "bg-white text-bauhaus-gray hover:text-bauhaus-black"
                  }`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <a
                href={`${API}/export/csv`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bauhaus-blue text-white font-body font-bold text-[12px] border-2 border-bauhaus-blue hover:bg-bauhaus-black hover:border-bauhaus-black transition-all"
              >
                <Download size={13} /> Export CSV
              </a>
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[12px] hover:bg-bauhaus-yellow transition-all"
                onClick={() => refetch()}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="inline-block w-9 h-9 border-3 border-bauhaus-border border-t-bauhaus-red rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="text-bauhaus-border" size={40} />
              <p className="font-display font-bold text-bauhaus-gray text-[14px] mt-3">
                No records yet
              </p>
              <p className="text-[12px] text-bauhaus-gray font-body mt-1">
                Upload images from the "New Scan" page
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bauhaus-black">
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      #ID
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Filename
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Confidence
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-body font-bold tracking-wider uppercase text-white whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-bauhaus-surface transition-colors border-b border-bauhaus-border"
                    >
                      <td className="px-4 py-3 text-[13px] text-bauhaus-gray font-body">
                        #{r.id}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-bauhaus-black font-body font-medium max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.filename}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 font-body font-bold text-[10px] tracking-wider uppercase border-2 ${
                            r.prediction === "malignant"
                              ? "bg-bauhaus-red text-white border-bauhaus-red"
                              : "bg-bauhaus-blue text-white border-bauhaus-blue"
                          }`}
                        >
                          {r.prediction}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-bauhaus-surface border border-bauhaus-black/10 overflow-hidden">
                            <div
                              className="h-full bg-bauhaus-black transition-all"
                              style={{
                                width: `${r.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-body font-medium text-bauhaus-black">
                            {(r.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 bg-bauhaus-yellow text-bauhaus-black font-body font-bold text-[10px] tracking-wider uppercase border-2 border-bauhaus-black">
                          {r.model_version || "v1.0"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-bauhaus-gray font-body">
                        {r.patient_name ? (
                          `${r.patient_name} (#${r.patient_id})`
                        ) : (
                          <span className="text-bauhaus-border">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-bauhaus-gray font-body whitespace-nowrap">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {r.heatmap_url && (
                            <a
                              href={`${API}${r.heatmap_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[11px] hover:bg-bauhaus-yellow transition-all"
                              title="View heatmap"
                            >
                              🔥
                            </a>
                          )}
                          <a
                            href={`${API}/export/pdf/${r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[11px] hover:bg-bauhaus-yellow transition-all"
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