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
    } catch (err: any) {
      setError(err.message);
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
      <div className="page-header">
        <h1 className="page-title">New Scan</h1>
        <p className="page-subtitle">
          Upload a mammography or histology image for AI-powered breast cancer
          prediction
        </p>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div
          className="tabs"
          style={{ marginBottom: 20, width: "fit-content" }}
        >
          <button
            className={`tab-btn${tab === "single" ? " active" : ""}`}
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
            className={`tab-btn${tab === "batch" ? " active" : ""}`}
            onClick={() => {
              setTab("batch");
              clearFile();
            }}
          >
            <Archive size={13} style={{ display: "inline", marginRight: 5 }} />
            Batch ZIP
          </button>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Left: Upload */}
          <div className="stack stack-md">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Upload zone */}
              <div
                className={`upload-zone${dragging ? " dragging" : ""}`}
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
                />
                <div className="upload-zone-icon">
                  {tab === "batch" ? (
                    <Archive size={24} />
                  ) : (
                    <Upload size={24} />
                  )}
                </div>
                <div>
                  <p className="upload-zone-title">
                    {tab === "single"
                      ? "Drop your image here"
                      : "Drop a ZIP archive here"}
                  </p>
                  <p className="upload-zone-sub">
                    {tab === "single"
                      ? "PNG, JPG, TIFF — max 50MB"
                      : ".zip file containing image files"}
                  </p>
                </div>
              </div>

              {/* File preview */}
              {file && (
                <div style={{ padding: "0 20px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "var(--bg-base)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <FileImage
                      size={16}
                      style={{ color: "var(--accent-pink)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={clearFile}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        display: "flex",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Patient selector */}
            <div className="card">
              <p className="card-title">
                <Users size={15} />
                Link to Patient{" "}
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontWeight: 400,
                  }}
                >
                  optional
                </span>
              </p>
              <div className="form-group">
                <label className="form-label">Patient ID</label>
                <input
                  className="form-input"
                  placeholder="e.g. 3"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  type="number"
                  min="1"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} /> Run Prediction
                </>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="stack stack-md">
            {/* Image Preview */}
            {preview && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: 260,
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Single result */}
            {result && (
              <>
                <div className={`result-banner ${result.prediction}`}>
                  <div className="result-banner-icon">
                    {result.prediction === "malignant" ? "⚠️" : "✅"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="result-banner-label">AI Diagnosis</p>
                    <p className="result-banner-value">
                      {result.prediction.toUpperCase()}
                    </p>
                  </div>
                  <a
                    href={`${API}/export/pdf/${result.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <Download size={13} /> PDF
                  </a>
                </div>

                <div className="card">
                  <p className="card-title">Confidence Score</p>
                  <div className="confidence-bar-wrap">
                    <div className="confidence-bar-header">
                      <span className="confidence-bar-label">
                        {result.prediction}
                      </span>
                      <span className="confidence-bar-value">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="confidence-bar-track">
                      <div
                        className="confidence-bar-fill"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="badge badge-version">
                      {result.model_version}
                    </span>
                    {result.patient_id && (
                      <span
                        className="badge"
                        style={{
                          background: "rgba(168,85,247,0.1)",
                          color: "var(--accent-violet)",
                          border: "1px solid rgba(168,85,247,0.2)",
                        }}
                      >
                        Patient #{result.patient_id}
                      </span>
                    )}
                  </div>
                </div>

                {result.heatmap_url && (
                  <div className="card">
                    <p className="card-title">Grad-CAM Heatmap</p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginBottom: 12,
                      }}
                    >
                      Warmer regions (red/yellow) indicate where the model
                      focused most when making its prediction.
                    </p>
                    <div className="heatmap-container">
                      <img
                        src={`${API}${result.heatmap_url}`}
                        alt="Grad-CAM Heatmap"
                      />
                      <span className="heatmap-badge">Grad-CAM XAI</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Batch result */}
            {batchResult && (
              <div className="card">
                <p className="card-title">
                  <Archive size={15} />
                  Batch Results
                </p>
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {batchResult.total}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Total
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "var(--benign)",
                      }}
                    >
                      {batchResult.succeeded}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      OK
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "var(--malignant)",
                      }}
                    >
                      {batchResult.failed}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Failed
                    </div>
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {batchResult.results.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "55%",
                        }}
                      >
                        {r.filename}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span className={`badge badge-${r.prediction}`}>
                          {r.prediction}
                        </span>
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                        <a
                          href={`${API}/export/pdf/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "3px 8px" }}
                        >
                          <Download size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                {batchResult.errors.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {batchResult.errors.map((e, i) => (
                      <div
                        key={i}
                        className="alert alert-error"
                        style={{ marginTop: 4, fontSize: 12 }}
                      >
                        <AlertTriangle size={12} /> {e.filename}: {e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!result && !batchResult && !loading && (
              <div className="card">
                <div className="empty-state">
                  <FileImage />
                  <p className="empty-state-title">Awaiting scan</p>
                  <p className="empty-state-sub">
                    Upload an image and click "Run Prediction" to see results
                    here
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="card">
                <div className="empty-state">
                  <span className="spinner spinner-lg animate-pulse" />
                  <p className="empty-state-title">Analysing image...</p>
                  <p className="empty-state-sub">
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
