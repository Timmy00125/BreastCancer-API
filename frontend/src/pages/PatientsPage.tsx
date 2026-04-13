import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus, Trash2, ChevronRight, UserCircle } from "lucide-react";
import { API } from "../api";

type Patient = {
  id: number; name: string; age: number;
  medical_history: string | null; scan_count: number; created_at: string;
};

const patientSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  age: z.coerce.number().min(1, "Age must be greater than 0").max(120, "Age must be realistic"),
  medical_history: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientsPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading: loading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await fetch(`${API}/patients`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      medical_history: "",
    }
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("age", data.age.toString());
      if (data.medical_history) fd.append("medical_history", data.medical_history);
      
      const res = await fetch(`${API}/patients`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to create patient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowModal(false);
      reset();
    }
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete patient");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  });

  const onSubmit = (data: PatientFormValues) => {
    createPatientMutation.mutate(data);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this patient and all their scans?")) return;
    deletePatientMutation.mutate(id);
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Patients</h1>
        <p className="page-subtitle">Manage patient profiles and longitudinal scan history</p>
      </div>

      <div className="page-body">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Patient
          </button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 80 }}><span className="spinner spinner-lg" /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <UserCircle size={40} style={{ opacity: 0.3 }} />
            <p className="empty-state-title">No patients yet</p>
            <p className="empty-state-sub">Create a patient profile to start tracking scans longitudinally</p>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add First Patient
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {patients.map(p => (
              <div
                key={p.id}
                className="patient-card"
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div className="patient-avatar">{initials(p.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="patient-name">{p.name}</p>
                  <p className="patient-meta">Age {p.age} · ID #{p.id}</p>
                  {p.medical_history && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.medical_history}
                    </p>
                  )}
                </div>
                <div className="patient-scans">
                  <div className="patient-scans-count">{p.scan_count}</div>
                  <div className="patient-scans-label">Scans</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(p.id, e)} style={{ padding: "6px 8px" }}>
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => { setShowModal(false); reset(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title"><Plus size={16} />New Patient</p>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="stack stack-md">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Jane Doe" {...register("name")} />
                  {errors.name && <span style={{ color: "var(--malignant)", fontSize: 12 }}>{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Age *</label>
                  <input className="form-input" type="number" placeholder="e.g. 45" {...register("age")} />
                  {errors.age && <span style={{ color: "var(--malignant)", fontSize: 12 }}>{errors.age.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Medical History</label>
                  <textarea className="form-textarea" placeholder="e.g. Family history of breast cancer, prior biopsies..." {...register("medical_history")} />
                  {errors.medical_history && <span style={{ color: "var(--malignant)", fontSize: 12 }}>{errors.medical_history.message}</span>}
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); reset(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><span className="spinner" />Saving...</> : <><Users size={14} />Create Patient</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
