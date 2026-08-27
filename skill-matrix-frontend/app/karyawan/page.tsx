"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, BookOpen, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import LevelIcon from "@/components/LevelIcon";
import RadarKompetensi from "@/components/RadarKompetensi";
import EvaluasiSkillModal from "@/components/EvaluasiSkillModal";
import {
  KaryawanListItem,
  KaryawanDetail,
  getKaryawanList,
  getKaryawanDetail,
} from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700",
  magang: "bg-blue-100 text-blue-700",
  cuti: "bg-slate-100 text-slate-500",
  resign: "bg-red-100 text-red-600",
};

export default function KaryawanPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [departemenFilter, setDepartemenFilter] = useState("Semua Departemen");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showEvaluasi, setShowEvaluasi] = useState(false);

  const [list, setList] = useState<KaryawanListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detail, setDetail] = useState<KaryawanDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    getKaryawanList()
      .then((data) => {
        setList(data);
        const idParam = searchParams.get("id");
        const initialId = idParam ? Number(idParam) : data[0]?.id ?? null;
        setSelectedId(initialId);
      })
      .catch(() => setListError("Gagal memuat daftar karyawan."))
      .finally(() => setIsLoadingList(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDetail = useCallback((id: number) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    getKaryawanDetail(id)
      .then(setDetail)
      .catch(() => setDetailError("Gagal memuat detail karyawan."))
      .finally(() => setIsLoadingDetail(false));
  }, []);

  useEffect(() => {
    if (selectedId !== null) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  const departemenOptions = useMemo(() => {
    const unique = new Set(list.map((k) => k.departement).filter(Boolean) as string[]);
    return ["Semua Departemen", ...Array.from(unique).sort()];
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter((k) => {
      const matchSearch =
        !q ||
        k.name.toLowerCase().includes(q) ||
        (k.nik ?? "").toLowerCase().includes(q);
      const matchDepartemen =
        departemenFilter === "Semua Departemen" || k.departement === departemenFilter;
      return matchSearch && matchDepartemen;
    });
  }, [search, departemenFilter, list]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        rightSlot={
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm focus:border-blue-300 focus:outline-none"
            />
          </div>
        }
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-8 py-8 lg:grid-cols-[320px_1fr]">
        {/* Daftar Karyawan */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Karyawan
            </h2>
          </div>

          <div className="border-b border-slate-100 p-3">
            <select
              value={departemenFilter}
              onChange={(e) => setDepartemenFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-blue-300 focus:outline-none"
            >
              {departemenOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {isLoadingList && (
            <p className="p-4 text-xs text-slate-400">Memuat...</p>
          )}
          {listError && (
            <p className="p-4 text-xs text-red-500">{listError}</p>
          )}

          {!isLoadingList && !listError && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-4 py-2 font-medium">NIK</th>
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => (
                  <tr
                    key={k.id}
                    onClick={() => setSelectedId(k.id)}
                    className={`cursor-pointer border-l-2 ${
                      k.id === selectedId
                        ? "border-blue-700 bg-blue-50"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-500">{k.nik ?? "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {k.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[k.status] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      Tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-400">
            {filtered.length} dari {list.length} Karyawan
          </div>
        </div>

        {/* Detail Karyawan */}
        <div className="space-y-6">
          {isLoadingDetail && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              Memuat detail karyawan...
            </div>
          )}

          {detailError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {detailError}
            </div>
          )}

          {!isLoadingDetail && !detailError && detail && (
            <>
              {/* Profile header */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                    {detail.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {detail.name}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                        {detail.nik ?? "-"}
                      </span>
                      <span>•</span>
                      <span>{detail.jabatan ?? "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Edit Profil
                  </button>
                  <button
                    onClick={() => setShowEvaluasi(true)}
                    className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
                  >
                    Evaluasi Skill
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniCard
                  icon={<BookOpen size={16} className="text-blue-700" />}
                  label="Total Kompetensi"
                  value={detail.total_kompetensi}
                />
                <MiniCard
                  icon={<CheckCircle2 size={16} className="text-emerald-600" />}
                  label="Sesuai Target"
                  value={detail.sesuai_target}
                />
                <MiniCard
                  icon={<AlertTriangle size={16} className="text-red-500" />}
                  label="Skill Gap"
                  value={detail.skill_gap}
                  tone="warning"
                />
              </div>

              {/* Detail Kompetensi + Rekomendasi */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Detail Kompetensi
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <LevelIcon level={4} size={12} outlineOnly /> Required
                      </span>
                      <span className="flex items-center gap-1">
                        <LevelIcon level={4} size={12} /> Actual
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="py-2 font-medium">Nama Kompetensi</th>
                        <th className="py-2 text-center font-medium">REQ</th>
                        <th className="py-2 text-center font-medium">ACT</th>
                        <th className="py-2 text-right font-medium">GAP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.kompetensis.map((komp) => {
                        const diff = komp.actual_level - komp.required_level;

                        return (
                          <tr key={komp.kompetensi_id} className="border-t border-slate-100">
                            <td className="py-3 font-medium text-slate-800">
                              {komp.nama_kompetensi}
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex justify-center">
                                <LevelIcon level={komp.required_level} size={16} outlineOnly />
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex justify-center">
                                <LevelIcon level={komp.actual_level} size={16} />
                              </div>
                            </td>
                            <td
                              className={`py-3 text-right font-semibold ${
                                diff < 0
                                  ? "text-red-600"
                                  : diff > 0
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                          </tr>
                        );
                      })}
                      {detail.kompetensis.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            Belum ada kompetensi yang di-assign.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Panel Rekomendasi — di samping Detail Kompetensi */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Rekomendasi
                    </h3>
                    {detail.cluster_label && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          detail.cluster_label === "Top Talent"
                            ? "bg-blue-100 text-blue-800"
                            : detail.cluster_label === "Emerging"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                        title="Hasil klaster ML terakhir dari menu Reports"
                      >
                        {detail.cluster_label}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const perluTindakan = detail.kompetensis.filter((k) => k.gap > 0);

                    if (detail.kompetensis.length === 0) {
                      return (
                        <p className="text-xs text-slate-400">
                          Belum ada kompetensi yang di-assign.
                        </p>
                      );
                    }

                    if (perluTindakan.length === 0) {
                      return (
                        <p className="text-xs text-emerald-600">
                          Semua kompetensi sudah memenuhi target. Tidak ada
                          tindak lanjut yang diperlukan saat ini.
                        </p>
                      );
                    }

                    return (
                      <ul className="space-y-3">
                        {perluTindakan.map((k) => (
                          <li
                            key={k.kompetensi_id}
                            className="rounded-lg border border-amber-100 bg-amber-50/50 p-3"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <p className="text-xs font-medium text-slate-800">
                                {k.nama_kompetensi}
                              </p>
                              <span className="shrink-0 text-[10px] text-slate-400">
                                L{k.actual_level} → L{k.required_level}
                              </span>
                            </div>
                            <p className="text-xs text-amber-700">{k.rekomendasi}</p>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              </div>

              {/* Spread Kompetensi (radar) */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 lg:max-w-md">
                <h3 className="mb-1 text-sm font-semibold text-slate-900">
                  Spread Kompetensi
                </h3>
                {detail.radar.length > 0 ? (
                  <RadarKompetensi data={detail.radar} />
                ) : (
                  <p className="py-10 text-center text-xs text-slate-400">
                    Belum ada data untuk ditampilkan.
                  </p>
                )}
                <p className="mt-2 text-center text-xs text-slate-400">
                  Visualisasi ini membandingkan rata-rata kompetensi aktual
                  terhadap standar tiap kategori.
                </p>
              </div>

              {/* ML Analysis (placeholder) */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <Sparkles size={16} />
                  Analisis ML: Pola Kompetensi
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-blue-100 bg-white p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Clustering Profile
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      &quot;{detail.skill_gap <= 1 ? "Top Performer" : "Developing"} Group&quot;
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Contoh ilustrasi — akan dihitung dari hasil clustering
                      K-Means setelah modul ML aktif.
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-white p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Rekomendasi Jalur
                    </p>
                    <p className="text-xs text-slate-600">
                      Pola menunjukkan potensi pengembangan pada peran terkait{" "}
                      <span className="font-semibold text-blue-700">
                        {detail.jabatan}
                      </span>{" "}
                      dalam periode berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showEvaluasi && detail && (
        <EvaluasiSkillModal
          karyawan={detail}
          onClose={() => setShowEvaluasi(false)}
          onSuccess={() => fetchDetail(detail.id)}
        />
      )}
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p
        className={`text-xl font-bold ${
          tone === "warning" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
