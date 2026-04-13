import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileImage,
  X,
  AlertTriangle,
  Download,
  Zap,
  Archive,
  Users,
} from "lucide-react";
import { API } from "../api";

type PredResult = {
  id: number;
  filename: string;
  prediction: string;
  confidence: number;
  timestamp: string;
  heatmap_url: string | null;
  model_version: string;
  patient_id: number | null;
};

type BatchResult = {
  total: number;
  succeeded: number;
  failed: number;
  results: PredResult[];
  errors: { filename: string; error: string }[];
};

export default function PredictPage() {
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = (f: File) => {
    setFile(f);
    setResult(null);
    setBatchResult(null);
    setError(null);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    if (patientId) fd.append("patient_id", patientId);

    try {
      const endpoint = tab === "single" ? "/predict" : "/predict/batch";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Prediction failed");
      if (tab === "single") setResult(data);
      else setBatchResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Prediction failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setBatchResult(null);
    setError(null);
  };

  const acceptType = tab === "single" ? "image/*" : ".zip,application/zip";

  return (
    <>
      <div className="px-8 pt-8">
        <h1 className="font-display font-extrabold text-3xl text-bauhaus-black tracking-tight">
          NEW SCAN
        </h1>
        <div className="w-16 h-1 bg-bauhaus-red mt-2 mb-1" />
        <p className="text-bauhaus-gray text-sm font-body">
          Upload a mammography or histology image for AI-powered breast cancer
          prediction
        </p>
      </div>

      <div className="px-8 pt-5 pb-10 flex-1">
        <div className="flex gap-3 mb-6 w-fit bg-white border-2 border-bauhaus-black">
          <button
            className={`px-4 py-2 font-body font-bold text-[13px] transition-all ${
              tab === "single"
                ? "bg-bauhaus-black text-white"
                : "bg-white text-bauhaus-gray hover:text-bauhaus-black"
            }`}
            onClick={() => {
              setTab("single");
              clearFile();
            }}
          >
            <FileImage
              size={13}
              style={{ display: "inline", marginRight: 5 }}
            />
            Single Image
          </button>
          <button
            className={`px-4 py-2 font-body font-bold text-[13px] transition-all ${
              tab === "batch"
                ? "bg-bauhaus-black text-white"
                : "bg-white text-bauhaus-gray hover:text-bauhaus-black"
            }`}
            onClick={() => {
              setTab("batch");
              clearFile();
            }}
          >
            <Archive size={13} style={{ display: "inline", marginRight: 5 }} />
            Batch ZIP
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="bg-white border-2 border-bauhaus-black overflow-hidden">
              <div
                className={`flex flex-col items-center justify-center gap-3 p-10 cursor-pointer transition-all ${
                  dragging
                    ? "border-2 border-bauhaus-yellow bg-bauhaus-yellow/5"
                    : "border-2 border-dashed border-bauhaus-black/30"
                }`}
                style={{ margin: 20, marginBottom: file ? 12 : 20 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={acceptType}
                  onChange={(e) =>
                    e.target.files?.[0] && onFile(e.target.files[0])
                  }
                  className="hidden"
                />
                <div
                  className={`w-14 h-14 flex items-center justify-center ${
                    dragging ? "bg-bauhaus-yellow" : "bg-bauhaus-black/5"
                  }`}
                >
                  {tab === "batch" ? (
                    <Archive size={24} className="text-bauhaus-black" />
                  ) : (
                    <Upload size={24} className="text-bauhaus-black" />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-display font-bold text-bauhaus-black text-[15px]">
                    {tab === "single"
                      ? "Drop your image here"
                      : "Drop a ZIP archive here"}
                  </p>
                  <p className="text-[12px] text-bauhaus-gray font-body mt-1">
                    {tab === "single"
                      ? "PNG, JPG, TIFF — max 50MB"
                      : ".zip file containing image files"}
                  </p>
                </div>
              </div>

              {file && (
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-bauhaus-surface border-2 border-bauhaus-black">
                    <FileImage
                      size={16}
                      className="text-bauhaus-red flex-shrink-0"
                    />
                    <span className="text-[13px] text-bauhaus-black font-body font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-bauhaus-gray font-body flex-shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={clearFile}
                      className="bg-transparent border-none cursor-pointer text-bauhaus-gray hover:text-bauhaus-red transition-colors flex"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border-2 border-bauhaus-black p-6">
              <p className="font-display font-bold text-bauhaus-black text-[13px] mb-4 flex items-center gap-2">
                <Users size={15} className="text-bauhaus-blue" />
                Link to Patient
                <span className="ml-auto text-[11px] text-bauhaus-gray font-body font-normal">
                  optional
                </span>
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                  Patient ID
                </label>
                <input
                  className="bg-bauhaus-surface border-2 border-bauhaus-black text-bauhaus-black text-[14px] font-body px-3.5 py-2.5 focus:outline-none focus:border-bauhaus-blue transition-colors w-full"
                  placeholder="e.g. 3"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-bauhaus-red/10 border-2 border-bauhaus-red text-bauhaus-red font-body text-[13px]">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <button
              className="inline-flex items-center gap-2 px-5 py-3 bg-bauhaus-black text-white font-display font-bold text-[14px] tracking-wide border-2 border-bauhaus-black transition-all hover:bg-bauhaus-blue hover:border-bauhaus-blue disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin"
                    />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} /> Run Prediction
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {preview && (
              <div className="bg-white border-2 border-bauhaus-black overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full block max-h-[260px] object-cover"
                />
              </div>
            )}

            {result && (
              <>
                <div
                  className={`border-2 p-5 flex items-center gap-4 ${
                    result.prediction === "malignant"
                      ? "bg-bauhaus-red/10 border-bauhaus-red"
                      : "bg-bauhaus-blue/10 border-bauhaus-blue"
                  }`}
                >
                  <div
                    className={`w-12 h-12 flex items-center justify-center flex-shrink-0 text-[22px] ${
                      result.prediction === "malignant"
                        ? "bg-bauhaus-red/20 text-bauhaus-red"
                        : "bg-bauhaus-blue/20 text-bauhaus-blue"
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {result.prediction === "malignant" ? "⚠" : "✓"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-body font-bold tracking-widest uppercase text-bauhaus-gray">
                      AI Diagnosis
                    </p>
                    <p
                      className={`font-display font-extrabold text-[22px] tracking-tight mt-0.5 ${
                        result.prediction === "malignant"
                          ? "text-bauhaus-red"
                          : "text-bauhaus-blue"
                      }`}
                    >
                      {result.prediction.toUpperCase()}
                    </p>
                  </div>
                  <a
                    href={`${API}/export/pdf/${result.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[12px] hover:bg-bauhaus-yellow hover:border-bauhaus-yellow transition-all"
                  >
                    <Download size={13} /> PDF
                  </a>
                </div>

                <div className="bg-white border-2 border-bauhaus-black p-6">
                  <p className="font-display font-bold text-bauhaus-black text-[13px] mb-3">
                    Confidence Score
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-[12px] font-body text-bauhaus-gray">
                        {result.prediction}
                      </span>
                      <span className="text-[12px] font-body font-bold text-bauhaus-black">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-bauhaus-surface border border-bauhaus-black/10 overflow-hidden">
                      <div
                        className="h-full bg-bauhaus-black transition-all duration-700"
                        style={{
                          width: `${result.confidence * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 bg-bauhaus-yellow text-bauhaus-black font-body font-bold text-[10px] tracking-wider uppercase border-2 border-bauhaus-black">
                      {result.model_version}
                    </span>
                    {result.patient_id && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-bauhaus-blue text-white font-body font-bold text-[10px] tracking-wider uppercase border-2 border-bauhaus-blue">
                        Patient #{result.patient_id}
                      </span>
                    )}
                  </div>
                </div>

                {result.heatmap_url && (
                  <div className="bg-white border-2 border-bauhaus-black p-6">
                    <p className="font-display font-bold text-bauhaus-black text-[13px]">
                      Grad-CAM Heatmap
                    </p>
                    <p className="text-[12px] text-bauhaus-gray font-body mt-1 mb-3">
                      Warmer regions (red/yellow) indicate where the model
                      focused most when making its prediction.
                    </p>
                    <div className="relative border-2 border-bauhaus-black overflow-hidden">
                      <img
                        src={`${API}${result.heatmap_url}`}
                        alt="Grad-CAM Heatmap"
                        className="w-full block"
                      />
                      <span className="absolute bottom-2 left-2 bg-bauhaus-black text-bauhaus-yellow font-body font-bold text-[10px] tracking-wider uppercase px-2 py-1 border border-bauhaus-yellow">
                        Grad-CAM XAI
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {batchResult && (
              <div className="bg-white border-2 border-bauhaus-black p-6">
                <p className="font-display font-bold text-bauhaus-black text-[13px] flex items-center gap-2">
                  <Archive size={15} className="text-bauhaus-blue" />
                  Batch Results
                </p>
                <div className="flex gap-6 mt-4 mb-4">
                  <div className="text-center">
                    <div className="font-display font-extrabold text-2xl text-bauhaus-black">
                      {batchResult.total}
                    </div>
                    <div className="text-[11px] text-bauhaus-gray font-body uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display font-extrabold text-2xl text-bauhaus-blue">
                      {batchResult.succeeded}
                    </div>
                    <div className="text-[11px] text-bauhaus-gray font-body uppercase tracking-wider">
                      OK
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-display font-extrabold text-2xl text-bauhaus-red">
                      {batchResult.failed}
                    </div>
                    <div className="text-[11px] text-bauhaus-gray font-body uppercase tracking-wider">
                      Failed
                    </div>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {batchResult.results.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2 border-b border-bauhaus-border last:border-b-0"
                    >
                      <span className="text-[12px] text-bauhaus-gray font-body overflow-hidden text-ellipsis whitespace-nowrap max-w-[55%]">
                        {r.filename}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 font-body font-bold text-[10px] tracking-wider uppercase border-2 ${
                            r.prediction === "malignant"
                              ? "bg-bauhaus-red text-white border-bauhaus-red"
                              : "bg-bauhaus-blue text-white border-bauhaus-blue"
                          }`}
                        >
                          {r.prediction}
                        </span>
                        <span className="text-[12px] text-bauhaus-gray font-body">
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                        <a
                          href={`${API}/export/pdf/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-1.5 py-0.5 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[11px] hover:bg-bauhaus-yellow transition-all"
                        >
                          <Download size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {batchResult.errors.length > 0 && (
                  <div className="mt-3">
                    {batchResult.errors.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-bauhaus-red/10 border-2 border-bauhaus-red text-bauhaus-red font-body text-[12px] mt-1"
                      >
                        <AlertTriangle size={12} /> {e.filename}: {e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!result && !batchResult && !loading && (
              <div className="bg-white border-2 border-bauhaus-black p-6">
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <FileImage className="text-bauhaus-border" size={40} />
                  <p className="font-display font-bold text-bauhaus-gray text-[14px]">
                    Awaiting scan
                  </p>
                  <p className="text-[12px] text-bauhaus-gray font-body">
                    Upload an image and click "Run Prediction" to see results
                    here
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white border-2 border-bauhaus-black p-6">
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <span
                    className="inline-block w-9 h-9 border-3 border-bauhaus-border border-t-bauhaus-red rounded-full animate-spin"
                  />
                  <p className="font-display font-bold text-bauhaus-black text-[14px]">
                    Analysing image...
                  </p>
                  <p className="text-[12px] text-bauhaus-gray font-body">
                    Generating prediction and Grad-CAM heatmap
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}