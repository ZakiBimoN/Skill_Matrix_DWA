"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  KompetensiItem,
  KompetensiPayload,
  DepartemenItem,
  createKompetensi,
  updateKompetensi,
  getDepartemenList,
} from "@/lib/api";

interface KompetensiFormModalProps {
  initialData: KompetensiItem | null; // null = mode tambah baru
  onClose: () => void;
  onSuccess: () => void; // refetch list setelah sukses
}

const KATEGORI_OPTIONS: KompetensiItem["kategori"][] = ["wajib", "umum", "khusus"];

export default function KompetensiFormModal({
  initialData,
  onClose,
  onSuccess,
}: KompetensiFormModalProps) {
  const isEdit = initialData !== null;

  const [departemenList, setDepartemenList] = useState<DepartemenItem[]>([]);
  const [isLoadingDepartemen, setIsLoadingDepartemen] = useState(true);

  const [form, setForm] = useState<KompetensiPayload>({
    nama_kompetensi: initialData?.nama_kompetensi ?? "",
    kategori: initialData?.kategori ?? "wajib",
    sub_kelompok: initialData?.sub_kelompok ?? "",
    deskripsi: initialData?.deskripsi ?? "",
    required_level: initialData?.required_level ?? 3,
    departement_ids: initialData?.departements.map((d) => d.id) ?? [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDepartemenList()
      .then(setDepartemenList)
      .finally(() => setIsLoadingDepartemen(false));
  }, []);

  const isWajib = form.kategori === "wajib";

  function toggleDepartemen(id: number) {
    setForm((prev) => ({
      ...prev,
      departement_ids: prev.departement_ids.includes(id)
        ? prev.departement_ids.filter((d) => d !== id)
        : [...prev.departement_ids, id],
    }));
  }

  async function handleSubmit() {
    if (!form.nama_kompetensi.trim()) {
      setError("Nama kompetensi wajib diisi.");
      return;
    }
    if (!isWajib && form.departement_ids.length === 0) {
      setError("Pilih minimal 1 departemen untuk kategori Umum/Khusus.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await updateKompetensi(initialData.id, form);
      } else {
        await createKompetensi(form);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? "Gagal menyimpan kompetensi. Coba lagi.");
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
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {isEdit ? "Edit Kompetensi" : "Tambah Kompetensi Baru"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nama Kompetensi
            </label>
            <input
              value={form.nama_kompetensi}
              onChange={(e) => setForm({ ...form, nama_kompetensi: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Kategori
              </label>
              <select
                value={form.kategori}
                onChange={(e) =>
                  setForm({ ...form, kategori: e.target.value as KompetensiItem["kategori"] })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Required Level
              </label>
              <select
                value={form.required_level}
                onChange={(e) => setForm({ ...form, required_level: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Sub-kelompok <span className="text-slate-400">(opsional, khusus kategori Wajib)</span>
            </label>
            <input
              value={form.sub_kelompok ?? ""}
              onChange={(e) => setForm({ ...form, sub_kelompok: e.target.value || null })}
              placeholder="Contoh: Safety, Environment"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Target Departemen
            </label>

            {isWajib ? (
              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Kategori Wajib otomatis berlaku untuk <strong>semua departemen</strong>.
              </p>
            ) : isLoadingDepartemen ? (
              <p className="text-xs text-slate-400">Memuat daftar departemen...</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {departemenList.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.departement_ids.includes(d.id)}
                      onChange={() => toggleDepartemen(d.id)}
                      className="rounded border-slate-300"
                    />
                    {d.nama_departement}
                  </label>
                ))}
                {departemenList.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-slate-400">Belum ada data departemen.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Deskripsi <span className="text-slate-400">(opsional)</span>
            </label>
            <textarea
              value={form.deskripsi ?? ""}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>
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
            disabled={isSubmitting}
            className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
