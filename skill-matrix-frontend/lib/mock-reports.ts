// Data dummy untuk halaman Reports (frontend-first).
// Bagian ML (clustering) di sini murni ILUSTRASI — belum ada model
// PCA/K-Means asli di backend. Nanti diganti hasil endpoint ML setelah
// modul Python (FastAPI + scikit-learn) jadi.

export const SKILL_GAP_PER_DEPARTEMEN = [
  { departemen: "IT Development", targetGap: 8, currentStatus: 5 },
  { departemen: "Human Capital", targetGap: 6, currentStatus: 3 },
  { departemen: "Marketing", targetGap: 10, currentStatus: 7 },
  { departemen: "Finance", targetGap: 5, currentStatus: 2 },
  { departemen: "Operations", targetGap: 9, currentStatus: 6 },
];

export type ClusterKey = "top_talent" | "emerging" | "gap_critical";

export const CLUSTER_META: Record<
  ClusterKey,
  { label: string; color: string; badgeClass: string }
> = {
  top_talent: {
    label: "Top Talent",
    color: "#1d4ed8",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  emerging: {
    label: "Emerging",
    color: "#16a34a",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  gap_critical: {
    label: "Gap Critical",
    color: "#dc2626",
    badgeClass: "bg-red-100 text-red-700",
  },
};

// Titik scatter dummy (hasil PCA 2D ilustratif, bukan hitungan asli)
export const CLUSTER_SCATTER_POINTS: {
  x: number;
  y: number;
  cluster: ClusterKey;
}[] = [
  { x: 7.5, y: 6.8, cluster: "top_talent" },
  { x: 8.2, y: 7.5, cluster: "top_talent" },
  { x: 7.8, y: 5.9, cluster: "top_talent" },
  { x: 8.6, y: 6.4, cluster: "top_talent" },
  { x: 5.0, y: 4.2, cluster: "emerging" },
  { x: 5.6, y: 4.8, cluster: "emerging" },
  { x: 4.7, y: 3.6, cluster: "emerging" },
  { x: 5.3, y: 3.9, cluster: "emerging" },
  { x: 4.9, y: 4.6, cluster: "emerging" },
  { x: 2.1, y: 1.8, cluster: "gap_critical" },
  { x: 1.6, y: 1.2, cluster: "gap_critical" },
  { x: 2.4, y: 1.5, cluster: "gap_critical" },
];

export const CLUSTER_SUMMARY: {
  cluster: ClusterKey;
  memberCount: number;
  avgSkillScore: number;
  dominantCategory: string;
  recommendation: string;
}[] = [
  {
    cluster: "top_talent",
    memberCount: 12,
    avgSkillScore: 92.4,
    dominantCategory: "Wajib",
    recommendation: "Mentorship & Leadership Track",
  },
  {
    cluster: "emerging",
    memberCount: 45,
    avgSkillScore: 68.1,
    dominantCategory: "Umum",
    recommendation: "Technical Specialization Training",
  },
  {
    cluster: "gap_critical",
    memberCount: 8,
    avgSkillScore: 35.2,
    dominantCategory: "Khusus",
    recommendation: "Intensive Upskilling Bootcamp",
  },
];

export const ML_INSIGHT_TEXT =
  'Contoh ilustrasi — algoritma clustering (belum aktif) nantinya akan mendeteksi pola seperti peningkatan jumlah karyawan di klaster "Gap Critical" pada departemen tertentu dibanding periode sebelumnya.';
