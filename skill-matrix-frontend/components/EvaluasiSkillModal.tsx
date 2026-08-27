"use client";

import { useMemo, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import LevelIcon from "@/components/LevelIcon";
import { KaryawanDetail, submitEvaluasi } from "@/lib/api";

interface EvaluasiSkillModalProps {
  karyawan: KaryawanDetail;
  onClose: () => void;
  onSuccess: () => void; // dipanggil setelah simpan berhasil, buat refetch detail
}

export default function EvaluasiSkillModal({
  karyawan,
  onClose,
  onSuccess,
}: EvaluasiSkillModalProps) {
  const [draft, setDraft] = useState<Record<number, number>>(
    Object.fromEntries(
      karyawan.kompetensis.map((k) => [k.kompetensi_id, k.actual_level])
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showIncompleteHint, setShowIncompleteHint] = useState(false);

  // Kompetensi yang levelnya masih 0 (belum pernah dipilih) — biasanya
  // kompetensi baru yang otomatis ke-assign tapi belum sempat dievaluasi.
  const belumDiisi = useMemo(
    () => karyawan.kompetensis.filter((k) => !draft[k.kompetensi_id]),
    [karyawan.kompetensis, draft]
  );
  const sudahDiisi = karyawan.kompetensis.length - belumDiisi.length;

  async function handleSubmit() {
    if (belumDiisi.length > 0) {
      setShowIncompleteHint(true);
      setError(
        `Masih ada ${belumDiisi.length} kompetensi yang belum dipilih levelnya (ditandai merah di bawah). Pilih Level 1-4 untuk semuanya dulu.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = Object.entries(draft).map(([kompetensiId, level]) => ({
        kompetensi_id: Number(kompetensiId),
        actual_level: level,
      }));

      await submitEvaluasi(karyawan.id, payload);
      setSubmitted(true);
      onSuccess();
      setTimeout(onClose, 900);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; code?: string };
      if (axiosErr.code === "ECONNABORTED") {
        setError("Koneksi ke server terlalu lama (timeout). Coba lagi.");
      } else {
        setError(axiosErr.response?.data?.message ?? "Gagal menyimpan evaluasi. Coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 size={40} className="mb-3 text-emerald-600" />
            <p className="text-sm font-medium text-slate-800">
              Evaluasi tersimpan
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Actual level {karyawan.name} sudah diperbarui.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Evaluasi Skill
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {karyawan.name} — {karyawan.jabatan}
              </p>
              <span
                className={`text-xs font-medium ${
                  belumDiisi.length > 0 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {sudahDiisi}/{karyawan.kompetensis.length} terisi
              </span>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4">
              {karyawan.kompetensis.map((komp) => {
                const isEmpty = !draft[komp.kompetensi_id];
                const highlightEmpty = isEmpty && showIncompleteHint;

                return (
                  <div
                    key={komp.kompetensi_id}
                    className={`rounded-lg border p-3 ${
                      highlightEmpty
                        ? "border-red-300 bg-red-50/50"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">
                        {komp.nama_kompetensi}
                        {highlightEmpty && (
                          <span className="ml-1.5 text-xs font-normal text-red-500">
                            belum dipilih
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-slate-400">
                        Required: Level {komp.required_level}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              [komp.kompetensi_id]: lvl,
                            }))
                          }
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs ${
                            draft[komp.kompetensi_id] === lvl
                              ? "border-blue-700 bg-blue-50 font-medium text-blue-700"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <LevelIcon level={lvl} size={14} />
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {karyawan.kompetensis.length === 0 && (
                <p className="text-center text-sm text-slate-400">
                  Belum ada kompetensi yang di-assign ke karyawan ini.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || karyawan.kompetensis.length === 0}
                className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Evaluasi"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
