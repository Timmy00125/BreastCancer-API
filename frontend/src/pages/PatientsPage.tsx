import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus, Trash2, ChevronRight, UserCircle } from "lucide-react";
import { API } from "../api";

type Patient = {
  id: number;
  name: string;
  age: number;
  medical_history: string | null;
  scan_count: number;
  created_at: string;
};

const patientSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  age: z.coerce
    .number()
    .min(1, "Age must be greater than 0")
    .max(120, "Age must be realistic"),
  medical_history: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientsPage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: patients = [], isLoading: loading } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch(`${API}/patients`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      age: undefined as unknown as number,
      medical_history: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("age", data.age.toString());
      if (data.medical_history)
        fd.append("medical_history", data.medical_history);

      const res = await fetch(`${API}/patients`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to create patient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowModal(false);
      reset();
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete patient");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const onSubmit = (data: PatientFormValues) => {
    createPatientMutation.mutate(data);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this patient and all their scans?")) return;
    deletePatientMutation.mutate(id);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <div className="px-8 pt-8">
        <h1 className="font-display font-extrabold text-3xl text-bauhaus-black tracking-tight">
          PATIENTS
        </h1>
        <div className="w-16 h-1 bg-bauhaus-yellow mt-2 mb-1" />
        <p className="text-bauhaus-gray text-sm font-body">
          Manage patient profiles and longitudinal scan history
        </p>
      </div>

      <div className="px-8 pt-5 pb-10 flex-1">
        <div className="flex justify-end mb-5">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bauhaus-black text-white font-display font-bold text-[13px] tracking-wide border-2 border-bauhaus-black hover:bg-bauhaus-blue hover:border-bauhaus-blue transition-all"
            onClick={() => setShowModal(true)}
          >
            <Plus size={15} /> New Patient
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="inline-block w-9 h-9 border-3 border-bauhaus-border border-t-bauhaus-yellow rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserCircle size={40} className="text-bauhaus-border" />
            <p className="font-display font-bold text-bauhaus-gray text-[14px] mt-3">
              No patients yet
            </p>
            <p className="text-[12px] text-bauhaus-gray font-body mt-1">
              Create a patient profile to start tracking scans
            </p>
            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-bauhaus-black text-white font-display font-bold text-[13px] tracking-wide border-2 border-bauhaus-black hover:bg-bauhaus-blue hover:border-bauhaus-blue transition-all mt-4"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} /> Add First Patient
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
            {patients.map((p) => (
              <div
                key={p.id}
                className="bg-white border-2 border-bauhaus-black flex items-center gap-3.5 p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-0 active:translate-y-0 group"
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                <div className="w-11 h-11 bg-bauhaus-blue flex items-center justify-center text-white font-display font-extrabold text-[16px] flex-shrink-0">
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-bauhaus-black text-[14px]">
                    {p.name}
                  </p>
                  <p className="text-[12px] text-bauhaus-gray font-body mt-0.5">
                    Age {p.age} · ID #{p.id}
                  </p>
                  {p.medical_history && (
                    <p className="text-[11px] text-bauhaus-gray font-body mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                      {p.medical_history}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-display font-extrabold text-xl text-bauhaus-black">
                    {p.scan_count}
                  </div>
                  <div className="text-[10px] text-bauhaus-gray font-body uppercase tracking-wider">
                    Scans
                  </div>
                </div>
                <button
                  className="inline-flex items-center px-1.5 py-1.5 bg-transparent border-2 border-bauhaus-red/30 text-bauhaus-red/60 hover:bg-bauhaus-red hover:text-white hover:border-bauhaus-red transition-all"
                  onClick={(e) => handleDelete(p.id, e)}
                >
                  <Trash2 size={13} />
                </button>
                <ChevronRight
                  size={15}
                  className="text-bauhaus-border group-hover:text-bauhaus-black transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-5"
          style={{ animation: "fadeIn 0.15s" }}
          onClick={() => {
            setShowModal(false);
            reset();
          }}
        >
          <div
            className="bg-white border-2 border-bauhaus-black p-7 w-full max-w-[480px]"
            style={{ animation: "slideUp 0.2s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display font-extrabold text-bauhaus-black text-[17px] mb-5 flex items-center gap-2">
              <Plus size={16} className="text-bauhaus-yellow" />
              New Patient
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                  Full Name *
                </label>
                <input
                  className="bg-bauhaus-surface border-2 border-bauhaus-black text-bauhaus-black text-[14px] font-body px-3.5 py-2.5 focus:outline-none focus:border-bauhaus-blue transition-colors w-full"
                  placeholder="e.g. Jane Doe"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-bauhaus-red text-[12px] font-body">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                  Age *
                </label>
                <input
                  className="bg-bauhaus-surface border-2 border-bauhaus-black text-bauhaus-black text-[14px] font-body px-3.5 py-2.5 focus:outline-none focus:border-bauhaus-blue transition-colors w-full"
                  type="number"
                  placeholder="e.g. 45"
                  {...register("age")}
                />
                {errors.age && (
                  <span className="text-bauhaus-red text-[12px] font-body">
                    {errors.age.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-body font-bold tracking-wider uppercase text-bauhaus-gray">
                  Medical History
                </label>
                <textarea
                  className="bg-bauhaus-surface border-2 border-bauhaus-black text-bauhaus-black text-[14px] font-body px-3.5 py-2.5 focus:outline-none focus:border-bauhaus-blue transition-colors w-full resize-y min-h-[80px]"
                  placeholder="e.g. Family history of breast cancer, prior biopsies..."
                  {...register("medical_history")}
                />
                {errors.medical_history && (
                  <span className="text-bauhaus-red text-[12px] font-body">
                    {errors.medical_history.message}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-transparent border-2 border-bauhaus-black text-bauhaus-black font-body font-bold text-[13px] hover:bg-bauhaus-surface transition-all"
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-bauhaus-black text-white font-body font-bold text-[13px] border-2 border-bauhaus-black hover:bg-bauhaus-blue hover:border-bauhaus-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Users size={14} /> Create Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}