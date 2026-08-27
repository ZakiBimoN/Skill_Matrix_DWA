"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import SkillGapBarChart from "@/components/SkillGapBarChart";
import ClusterScatterChart from "@/components/ClusterScatterChart";
import {
  ClusterResponse,
  SkillGapDepartemen,
  DetailKompetensiGapRow,
  getClusters,
  getSkillGapPerDepartemen,
  getDetailKompetensiGap,
} from "@/lib/api";
import { exportReportExcel, exportReportPdf } from "@/lib/export-report";

const LABEL_COLORS: Record<string, string> = {
  "Top Talent": "#1d4ed8",
  Emerging: "#16a34a",
  "Gap Critical": "#dc2626",
};

const LABEL_BADGE: Record<string, string> = {
  Wajib: "bg-blue-100 text-blue-800",
  Umum: "bg-slate-100 text-slate-600",
  Khusus: "bg-emerald-100 text-emerald-700",
};

export default function ReportsPage() {
  const [skillGap, setSkillGap] = useState<SkillGapDepartemen[]>([]);
  const [isLoadingSkillGap, setIsLoadingSkillGap] = useState(true);
  const [skillGapError, setSkillGapError] = useState<string | null>(null);

  const [clusters, setClusters] = useState<ClusterResponse | null>(null);
  const [isLoadingClusters, setIsLoadingClusters] = useState(true);
  const [clusterError, setClusterError] = useState<string | null>(null);

  const [detailGap, setDetailGap] = useState<DetailKompetensiGapRow[]>([]);

  useEffect(() => {
    getSkillGapPerDepartemen()
      .then(setSkillGap)
      .catch(() => setSkillGapError("Gagal memuat data skill gap per departemen."))
      .finally(() => setIsLoadingSkillGap(false));

    getDetailKompetensiGap().catch(() => []).then((data) => setDetailGap(data ?? []));

    getClusters()
      .then(setClusters)
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 422) {
          setClusterError(
            err.response.data?.message ??
              "Data karyawan belum cukup untuk clustering (minimal 4 orang)."
          );
        } else if (status === 503 || status === 502) {
          setClusterError(
            "ML Service (Python) belum aktif atau tidak terjangkau. Pastikan sudah dijalankan (uvicorn main:app --port 8001)."
          );
        } else {
          setClusterError("Gagal memuat hasil clustering.");
        }
      })
      .finally(() => setIsLoadingClusters(false));
  }, []);

  const hasExportableData = skillGap.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Executive Report</h1>
            <p className="mt-1 text-sm text-slate-500">
              Analisis mendalam kesenjangan kompetensi dan klasterisasi karyawan.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportReportExcel(skillGap, clusters, detailGap)}
              disabled={!hasExportableData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} /> Unduh Excel
            </button>
            <button
              onClick={() => exportReportPdf(skillGap, clusters, detailGap)}
              disabled={!hasExportableData}
              className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileDown size={14} /> Unduh PDF
            </button>
          </div>
        </div>

        {/* Bar chart */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Total Skill Gap per Departemen
          </h2>
          {isLoadingSkillGap && <p className="text-sm text-slate-400">Memuat grafik...</p>}
          {skillGapError && <p className="text-sm text-red-500">{skillGapError}</p>}
          {!isLoadingSkillGap && !skillGapError && <SkillGapBarChart data={skillGap} />}
        </div>

        {/* Cluster scatter + ML insight */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Employee Competency Clusters
              </h2>
              <p className="text-xs text-slate-400">
                PCA (Principal Component Analysis) + K-Means — dihitung dari data evaluasi asli.
              </p>
            </div>

            {isLoadingClusters && <p className="py-10 text-center text-sm text-slate-400">Menghitung clustering...</p>}

            {clusterError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {clusterError}
              </div>
            )}

            {clusters && !clusterError && <ClusterScatterChart data={clusters.karyawan} />}
          </div>

          {/* ML Insight card */}
          <div className="rounded-xl bg-blue-900 p-6 text-white">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} />
              <h3 className="text-base font-semibold">ML Insights</h3>
            </div>

            {clusters && !clusterError ? (
              (() => {
                const terlemah = [...clusters.summary].sort(
                  (a, b) => a.avg_skill_score - b.avg_skill_score
                )[0];
                const terbaik = [...clusters.summary].sort(
                  (a, b) => b.avg_skill_score - a.avg_skill_score
                )[0];

                return (
                  <>
                    <p className="text-xs leading-relaxed text-blue-100">
                      Model membagi {clusters.karyawan.length} karyawan menjadi{" "}
                      {clusters.k} klaster berdasarkan level kompetensi, gap, dan
                      sebaran per kategori.
                      {clusters.silhouette_score !== null && (
                        <>
                          {" "}
                          Silhouette score <strong>{clusters.silhouette_score}</strong>
                          {clusters.silhouette_score >= 0.5
                            ? " — klaster terpisah cukup jelas."
                            : " — klaster masih tumpang tindih, tafsirkan dengan hati-hati."}
                        </>
                      )}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-2 text-xs text-blue-100">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                        <span>
                          <strong>Paling perlu perhatian:</strong> klaster{" "}
                          <strong>{terlemah.label}</strong> ({terlemah.member_count} karyawan)
                          — kekurangan paling menonjol di kompetensi{" "}
                          <strong>{terlemah.weakest_category}</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-blue-100">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>
                          <strong>Sudah kuat:</strong> klaster{" "}
                          <strong>{terbaik.label}</strong> unggul di kompetensi{" "}
                          <strong>{terbaik.dominant_category}</strong> — kandidat baik untuk{" "}
                          {terbaik.recommendation.toLowerCase()}.
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <p className="text-xs leading-relaxed text-blue-100">
                {clusterError ?? "Memuat insight..."}
              </p>
            )}
          </div>
        </div>

        {/* Clustering summary table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Clustering Results Summary</h2>
            <span className="text-xs text-slate-400">
              {clusters ? "Data asli — hasil PCA + K-Means" : "Menunggu data..."}
            </span>
          </div>

          {clusters && !clusterError ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Cluster Name</th>
                  <th className="px-5 py-3 font-medium">Member Count</th>
                  <th className="px-5 py-3 font-medium">Avg. Skill Score</th>
                  <th className="px-5 py-3 font-medium">Dominant Category</th>
                  <th className="px-5 py-3 font-medium">Kategori Terlemah</th>
                  <th className="px-5 py-3 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {clusters.summary.map((row) => {
                  const color = LABEL_COLORS[row.label] ?? "#94a3b8";
                  return (
                    <tr key={row.cluster} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {row.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.member_count} Karyawan</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${row.avg_skill_score}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{row.avg_skill_score}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded px-2 py-1 text-[10px] font-semibold ${
                            LABEL_BADGE[row.dominant_category] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.dominant_category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded px-2 py-1 text-[10px] font-semibold ${
                            LABEL_BADGE[row.weakest_category] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.weakest_category.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.recommendation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-sm text-slate-400">
              {clusterError ?? "Memuat data..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
