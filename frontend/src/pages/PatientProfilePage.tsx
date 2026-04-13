import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { API } from "../api";

type Scan = {
  id: number;
  filename: string;
  prediction: string;
  confidence: number;
  timestamp: string;
  heatmap_url: string | null;
  model_version: string;
};

type Patient = {
  id: number;
  name: string;
  age: number;
  medical_history: string | null;
  created_at: string;
  scans: Scan[];
};

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/patients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPatient(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="px-8 pt-8 pb-10 flex-1 flex items-center justify-center">
        <span className="inline-block w-9 h-9 border-3 border-bauhaus-border border-t-bauhaus-blue rounded-full animate-spin" />
      </div>
    );
  if (!patient)
    return (
      <div className="px-8 pt-8 pb-10 flex-1 flex items-center justify-center">
        <p className="font-display font-bold text-bauhaus-gray">
          Patient not found
        </p>
      </div>
    );

  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const malignantCount = patient.scans.filter(
    (s) => s.prediction === "malignant"
  ).length;
  const benignCount = patient.scans.filter(
    (s) => s.prediction === "benign"
  ).length;

  return (
    <>
      <div className="px-8 pt-8">
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[12px] hover:bg-bauhaus-yellow transition-all mb-4"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft size={13} /> All Patients
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-bauhaus-blue flex items-center justify-center text-white font-display font-extrabold text-[22px]">
            {initials}
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-bauhaus-black tracking-tight">
              {patient.name}
            </h1>
            <p className="text-bauhaus-gray text-sm font-body mt-0.5">
              Age {patient.age} · Patient ID #{patient.id} · Registered{" "}
              {new Date(patient.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="w-16 h-1 bg-bauhaus-yellow mt-2" />
      </div>

      <div className="px-8 pt-5 pb-10 flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-bauhaus-blue">
            <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-blue/10 text-bauhaus-blue">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Total Scans
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-black tracking-tight leading-none mt-1">
                {patient.scans.length}
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-bauhaus-red">
            <div className="w-10 h-10 flex items-center justify-center bg-bauhaus-red/10 text-bauhaus-red">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Malignant
              </div>
              <div className="font-display font-extrabold text-[28px] text-bauhaus-red tracking-tight leading-none mt-1">
                {malignantCount}
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-bauhaus-black p-5 flex flex-col gap-3 border-t-4 border-t-[#34D399]">
            <div className="w-10 h-10 flex items-center justify-center bg-[#34D399]/10 text-[#34D399]">
              <TrendingDown size={18} />
            </div>
            <div>
              <div className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                Benign
              </div>
              <div className="font-display font-extrabold text-[28px] text-[#34D399] tracking-tight leading-none mt-1">
                {benignCount}
              </div>
            </div>
          </div>
        </div>

        {patient.medical_history && (
          <div className="bg-white border-2 border-bauhaus-black p-6">
            <p className="font-display font-bold text-bauhaus-black text-[13px] mb-2">
              Medical History
            </p>
            <p className="text-[14px] text-bauhaus-gray font-body leading-relaxed">
              {patient.medical_history}
            </p>
          </div>
        )}

        <div className="bg-white border-2 border-bauhaus-black p-6">
          <p className="font-display font-bold text-bauhaus-black text-[13px] mb-5">
            Scan Timeline
          </p>
          {patient.scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar size={36} className="text-bauhaus-border" />
              <p className="font-display font-bold text-bauhaus-gray text-[14px] mt-3">
                No scans yet
              </p>
              <p className="text-[12px] text-bauhaus-gray font-body mt-1">
                Upload an image and enter Patient ID #{patient.id} to link it
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {patient.scans.map((scan, i) => (
                <div
                  key={scan.id}
                  className="flex gap-4 py-4 border-b border-bauhaus-border last:border-b-0"
                >
                  <div className="flex flex-col items-center gap-1 pt-1 w-5 flex-shrink-0">
                    <div
                      className={`w-3 h-3 flex-shrink-0 ${
                        scan.prediction === "malignant"
                          ? "bg-bauhaus-red"
                          : "bg-bauhaus-blue"
                      }`}
                    />
                    {i < patient.scans.length - 1 && (
                      <div className="flex-1 w-px bg-bauhaus-border min-h-[24px]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-body font-semibold text-bauhaus-black text-[14px]">
                          {scan.filename}
                        </p>
                        <p className="text-[12px] text-bauhaus-gray font-body mt-0.5">
                          {new Date(scan.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 font-body font-bold text-[10px] tracking-wider uppercase border-2 ${
                            scan.prediction === "malignant"
                              ? "bg-bauhaus-red text-white border-bauhaus-red"
                              : "bg-bauhaus-blue text-white border-bauhaus-blue"
                          }`}
                        >
                          {scan.prediction}
                        </span>
                        <span className="text-[12px] text-bauhaus-gray font-body font-medium">
                          {(scan.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-bauhaus-yellow text-bauhaus-black font-body font-bold text-[10px] tracking-wider uppercase border-2 border-bauhaus-black">
                          {scan.model_version}
                        </span>
                        <a
                          href={`${API}/export/pdf/${scan.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[11px] hover:bg-bauhaus-yellow transition-all"
                        >
                          <Download size={11} /> PDF
                        </a>
                      </div>
                    </div>

                    <div className="mt-2.5 max-w-[300px]">
                      <div className="h-1.5 bg-bauhaus-surface border border-bauhaus-black/10 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            scan.prediction === "malignant"
                              ? "bg-bauhaus-red"
                              : "bg-bauhaus-blue"
                          }`}
                          style={{ width: `${scan.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    {scan.heatmap_url && (
                      <a
                        href={`${API}${scan.heatmap_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2.5"
                      >
                        <img
                          src={`${API}${scan.heatmap_url}`}
                          alt="Heatmap"
                          className="w-20 h-20 object-cover border-2 border-bauhaus-black transition-transform hover:scale-105"
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