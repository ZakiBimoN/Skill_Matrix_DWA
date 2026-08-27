"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, BookOpen, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import LevelIcon from "@/components/LevelIcon";
import {
  DashboardAtasanResponse,
  StrukturKategori,
  TrenKompetensiPoint,
  ClusterResponse,
  getDashboardAtasan,
  getStrukturKompetensi,
  getTrenKompetensi,
  getClusters,
} from "@/lib/api";

const KATEGORI_LABEL: Record<string, string> = {
  wajib: "Wajib",
  umum: "Umum",
  khusus: "Khusus",
};

export default function AtasanDashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardAtasanResponse | null>(null);
  const [struktur, setStruktur] = useState<StrukturKategori[]>([]);
  const [tren, setTren] = useState<TrenKompetensiPoint[]>([]);
  const [clusters, setClusters] = useState<ClusterResponse | null>(null);
  const [clusterError, setClusterError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboardAtasan(), getStrukturKompetensi(), getTrenKompetensi()])
      .then(([dash, strukturData, trenData]) => {
        setDashboard(dash);
        setStruktur(strukturData);
        setTren(trenData);
      })
      .catch(() => setError("Gagal memuat data dashboard."))
      .finally(() => setIsLoading(false));

    getClusters()
      .then(setClusters)
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 422) setClusterError("Data karyawan belum cukup untuk clustering.");
        else if (status === 503 || status === 502) setClusterError("ML Service belum aktif.");
        else setClusterError("Gagal memuat hasil clustering.");
      });
  }, []);

  const urutanKompetensiId = useMemo(
    () =>
      struktur.flatMap((kat) =>
        kat.sub_kelompok.flatMap((sk) => sk.items.map((i) => i.id))
      ),
    [struktur]
  );

  const criticalGap = useMemo(() => {
    if (!dashboard) return { nama: "", jumlah: 0 };
    const counter: Record<string, number> = {};
    for (const k of dashboard.daftar_karyawan) {
      for (const komp of k.kompetensis) {
        if (komp.gap > 0) {
          counter[komp.nama_kompetensi] = (counter[komp.nama_kompetensi] ?? 0) + 1;
        }
      }
    }
    let worst = { nama: "", jumlah: 0 };
    for (const [nama, jumlah] of Object.entries(counter)) {
      if (jumlah > worst.jumlah) worst = { nama, jumlah };
    }
    return worst;
  }, [dashboard]);

  const adaDataTren = tren.some((t) => t.rata_rata !== null);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Manager</h1>
            <p className="mt-1 text-sm text-slate-500">
              Pantau perkembangan kompetensi dan kebutuhan training tim Anda.
            </p>
          </div>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Memuat data dashboard...</p>}
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        {dashboard && (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<Users size={18} className="text-blue-700" />}
                label="Total Karyawan"
                value={dashboard.ringkasan.total_karyawan}
                footnote="Data tim yang Anda kelola"
              />
              <SummaryCard
                icon={<BookOpen size={18} className="text-blue-700" />}
                label="Rata-rata Gap per Karyawan"
                value={dashboard.ringkasan.rata_rata_gap}
                footnote="Semakin kecil semakin baik"
                tone={dashboard.ringkasan.rata_rata_gap > 3 ? "warning" : "neutral"}
              />
              <SummaryCard
                icon={<AlertTriangle size={18} className="text-amber-600" />}
                label="Karyawan dengan Gap Kompetensi Wajib"
                value={dashboard.ringkasan.karyawan_gap_wajib}
                footnote="Prioritas tinggi — perlu training segera"
                tone={dashboard.ringkasan.karyawan_gap_wajib > 0 ? "warning" : "neutral"}
              />

              <div className="rounded-xl bg-blue-900 p-5 text-white">
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-200">
                  <Sparkles size={16} />
                  ML Insights (PCA + K-Means)
                </div>
                {clusters ? (
                  (() => {
                    const gapCritical = clusters.summary.find((s) => s.label === "Gap Critical");
                    return (
                      <>
                        <p className="text-lg font-semibold">
                          {gapCritical ? `${gapCritical.member_count} karyawan Gap Critical` : "Semua klaster sehat"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-blue-200">
                          {gapCritical ? (
                            <AlertTriangle size={12} className="shrink-0" />
                          ) : (
                            <CheckCircle2 size={12} className="shrink-0" />
                          )}
                          Silhouette score {clusters.silhouette_score} — lihat detail di menu Reports.
                        </p>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <p className="text-lg font-semibold">{clusterError ?? "Memuat..."}</p>
                    <p className="mt-1 text-xs text-blue-200">
                      {clusterError
                        ? "Coba buka menu Reports untuk detail lebih lanjut."
                        : "Menghitung klaster kompetensi tim..."}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Chart + Skill Gap Analysis */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Grafik Perkembangan Kompetensi
                  </h2>
                  <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500">
                    6 Bulan Terakhir
                  </span>
                </div>

                {adaDataTren ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={tren}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="rata_rata"
                          stroke="#1d4ed8"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#1d4ed8" }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="mt-2 text-xs text-slate-400">
                      Data asli dari riwayat evaluasi tim. Bulan tanpa titik = belum ada evaluasi di periode itu.
                    </p>
                  </>
                ) : (
                  <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center">
                    <p className="text-sm text-slate-500">
                      Belum ada riwayat evaluasi di 6 bulan terakhir.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Grafik akan terisi otomatis begitu evaluasi mulai tercatat dari waktu ke waktu.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Analisis Skill Gap</h2>
                {criticalGap.jumlah > 0 ? (
                  <div className="mb-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-red-700">⚠ CRITICAL GAP</p>
                    <p className="text-xs text-red-700">
                      {criticalGap.jumlah} karyawan pada kompetensi &quot;{criticalGap.nama}&quot; berada di bawah standar.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Tidak ada gap kritis saat ini.</p>
                )}
              </div>
            </div>

            {/* Matrix Kompetensi */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Matrix Kompetensi (Actual vs Required)
                </h2>
                <span className="text-xs italic text-slate-400">
                  Klik cell untuk buka halaman evaluasi karyawan
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      <th
                        rowSpan={3}
                        className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-500"
                      >
                        Informasi Karyawan
                      </th>
                      {struktur.map((kat) => {
                        const total = kat.sub_kelompok.reduce((s, sk) => s + sk.items.length, 0);
                        return (
                          <th
                            key={kat.kategori}
                            colSpan={total}
                            className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-center font-semibold text-slate-600"
                          >
                            {KATEGORI_LABEL[kat.kategori] ?? kat.kategori}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      {struktur.flatMap((kat) =>
                        kat.sub_kelompok.map((sk) => (
                          <th
                            key={`${kat.kategori}-${sk.nama ?? "root"}`}
                            colSpan={sk.items.length}
                            className="border-b border-slate-200 bg-slate-50/60 px-3 py-1.5 text-center font-medium text-slate-500"
                          >
                            {sk.nama ?? ""}
                          </th>
                        ))
                      )}
                    </tr>
                    <tr>
                      {struktur.flatMap((kat) =>
                        kat.sub_kelompok.flatMap((sk) =>
                          sk.items.map((item) => (
                            <th
                              key={item.id}
                              className="border-b border-slate-200 px-3 py-2 text-center font-medium text-slate-500"
                            >
                              {item.nama_kompetensi}
                            </th>
                          ))
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.daftar_karyawan.map((k) => {
                      const kompetensiMap = new Map(k.kompetensis.map((kk) => [kk.kompetensi_id, kk]));

                      return (
                        <tr key={k.id} className="border-b border-slate-100 last:border-0">
                          <td className="sticky left-0 z-10 flex items-center gap-2 border-r border-slate-200 bg-white px-4 py-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                              {k.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{k.name}</p>
                              <p className="text-slate-400">{k.jabatan ?? "-"}</p>
                            </div>
                          </td>

                          {urutanKompetensiId.map((kompId) => {
                            const komp = kompetensiMap.get(kompId);
                            const actual = komp?.actual_level ?? 0;
                            const gap = komp?.gap ?? 0;

                            return (
                              <td
                                key={kompId}
                                onClick={() => router.push(`/karyawan?id=${k.id}`)}
                                className="relative cursor-pointer px-3 py-3 text-center hover:bg-slate-50"
                              >
                                <div className="flex justify-center">
                                  <LevelIcon level={actual} />
                                </div>
                                {gap > 0 && (
                                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {dashboard.daftar_karyawan.length === 0 && (
                      <tr>
                        <td colSpan={urutanKompetensiId.length + 1} className="px-4 py-8 text-center text-slate-400">
                          Belum ada karyawan di bawah Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-5 border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Legend Level:</span>
                {[1, 2, 3, 4].map((lvl) => (
                  <span key={lvl} className="flex items-center gap-1.5">
                    <LevelIcon level={lvl} size={14} />
                    Level {lvl} ({lvl * 25}%)
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Belum Memenuhi
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  footnote,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  footnote: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${tone === "warning" ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{footnote}</p>
    </div>
  );
}
