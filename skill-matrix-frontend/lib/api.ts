import axios from "axios";

// Base URL Laravel backend, contoh: http://localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // wajib: kirim cookie session Sanctum
  withXSRFToken: true, // wajib: axios 1.6+ tidak auto-kirim X-XSRF-TOKEN untuk request cross-origin
  timeout: 20000, // 20 detik — supaya request gagal jelas kalau koneksi macet, bukan menggantung selamanya
  headers: {
    Accept: "application/json",
  },
});

/**
 * Ambil CSRF cookie dari Laravel Sanctum sebelum login.
 * Wajib dipanggil sekali sebelum request login/logout pertama kali.
 */
export async function getCsrfCookie() {
  await api.get("/sanctum/csrf-cookie");
}

export type Role = "atasan" | "karyawan";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  nik: string | null;
  jabatan: string | null;
  departement: { id: number; nama_departement: string } | null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await getCsrfCookie();
  const res = await api.post("/api/login", { email, password });
  return res.data.user;
}

export async function logout(): Promise<void> {
  await api.post("/api/logout");
}

export async function getMe(): Promise<AuthUser> {
  const res = await api.get("/api/me");
  return res.data.user;
}

// ---- Dashboard Atasan ----

export interface KompetensiKaryawan {
  kompetensi_id: number;
  nama_kompetensi: string;
  kategori: "wajib" | "umum" | "khusus";
  sub_kelompok: string | null;
  required_level: number;
  actual_level: number;
  gap: number;
}

export interface KaryawanRingkasan {
  id: number;
  name: string;
  nik: string | null;
  jabatan: string | null;
  departement: string | null;
  total_kompetensi: number;
  jumlah_belum_memenuhi: number;
  status: "ada_gap" | "memenuhi";
  kompetensis: KompetensiKaryawan[];
}

export interface DashboardAtasanResponse {
  ringkasan: {
    total_karyawan: number;
    rata_rata_gap: number;
    karyawan_gap_wajib: number;
    total_kompetensi_belum_memenuhi: number;
  };
  daftar_karyawan: KaryawanRingkasan[];
}

export async function getDashboardAtasan(): Promise<DashboardAtasanResponse> {
  const res = await api.get("/api/dashboard/atasan");
  return res.data;
}

export interface TrenKompetensiPoint {
  bulan: string;
  rata_rata: number | null;
}

export async function getTrenKompetensi(): Promise<TrenKompetensiPoint[]> {
  const res = await api.get("/api/dashboard/tren-kompetensi");
  return res.data.data;
}

// ---- Struktur Kompetensi (buat header matrix Dashboard) ----

export interface StrukturKompetensiItem {
  id: number;
  nama_kompetensi: string;
  required_level: number;
}

export interface StrukturSubKelompok {
  nama: string | null;
  items: StrukturKompetensiItem[];
}

export interface StrukturKategori {
  kategori: "wajib" | "umum" | "khusus";
  sub_kelompok: StrukturSubKelompok[];
}

export async function getStrukturKompetensi(): Promise<StrukturKategori[]> {
  const res = await api.get("/api/kompetensi-struktur");
  return res.data.data;
}

// ---- Master Kompetensi (CRUD) ----

export interface KompetensiItem {
  id: number;
  nama_kompetensi: string;
  kategori: "wajib" | "umum" | "khusus";
  sub_kelompok: string | null;
  deskripsi: string | null;
  required_level: number;
  departements: { id: number; nama_departement: string }[];
  departemen_label: string; // ringkasan nama departemen, dipisah koma, buat tabel
}

export interface KompetensiListParams {
  search?: string;
  kategori?: string;
  departemen?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export async function getKompetensiList(
  params: KompetensiListParams = {}
): Promise<PaginatedResponse<KompetensiItem>> {
  const res = await api.get("/api/kompetensi", { params });
  return res.data;
}

export interface KompetensiPayload {
  nama_kompetensi: string;
  kategori: "wajib" | "umum" | "khusus";
  sub_kelompok: string | null;
  deskripsi: string | null;
  required_level: number;
  departement_ids: number[]; // diabaikan backend kalau kategori = wajib (otomatis semua)
}

export async function createKompetensi(payload: KompetensiPayload): Promise<KompetensiItem> {
  const res = await api.post("/api/kompetensi", payload);
  return res.data.data;
}

export async function updateKompetensi(
  id: number,
  payload: Partial<KompetensiPayload>
): Promise<KompetensiItem> {
  const res = await api.put(`/api/kompetensi/${id}`, payload);
  return res.data.data;
}

export async function deleteKompetensi(id: number): Promise<void> {
  await api.delete(`/api/kompetensi/${id}`);
}

// ---- Departemen ----

export interface DepartemenItem {
  id: number;
  nama_departement: string;
  kode_departement: string | null;
}

export async function getDepartemenList(): Promise<DepartemenItem[]> {
  const res = await api.get("/api/departemen");
  return res.data.data;
}

// ---- Reports ----

export interface SkillGapDepartemen {
  departemen: string;
  total_karyawan: number;
  rata_rata_gap: number;
  karyawan_gap_wajib: number;
}

export async function getSkillGapPerDepartemen(): Promise<SkillGapDepartemen[]> {
  const res = await api.get("/api/reports/skill-gap-departemen");
  return res.data.data;
}

// ---- Detail Kompetensi Gap (untuk export Excel/PDF) ----

export interface DetailKompetensiGapRow {
  nik: string | null;
  nama: string;
  departemen: string | null;
  jabatan: string | null;
  nama_kompetensi: string;
  kategori: "wajib" | "umum" | "khusus";
  required_level: number;
  actual_level: number;
  gap: number;
  rekomendasi: string;
}

export async function getDetailKompetensiGap(
  jabatan?: string[]
): Promise<DetailKompetensiGapRow[]> {
  const res = await api.get("/api/reports/detail-kompetensi-gap", {
    params: jabatan && jabatan.length > 0 ? { jabatan } : {},
  });
  return res.data.data;
}

// ---- ML Clustering (PCA + K-Means) ----

export interface ClusterKaryawan {
  id: number;
  name: string;
  departemen: string | null;
  cluster: number;
  cluster_label: string;
  pca_x: number;
  pca_y: number;
}

export interface ClusterSummaryItem {
  cluster: number;
  label: string;
  member_count: number;
  avg_skill_score: number;
  dominant_category: string;
  weakest_category: string;
  recommendation: string;
}

export interface ClusterResponse {
  k: number;
  silhouette_score: number | null;
  explained_variance: number[];
  karyawan: ClusterKaryawan[];
  summary: ClusterSummaryItem[];
}

export async function getClusters(): Promise<ClusterResponse> {
  const res = await api.get("/api/reports/clusters");
  return res.data;
}

// ---- Karyawan menu ----

export interface KaryawanListItem {
  id: number;
  nik: string | null;
  name: string;
  jabatan: string | null;
  departement: string | null;
  status: "aktif" | "cuti" | "resign";
}

export interface KaryawanKompetensiDetail {
  kompetensi_id: number;
  nama_kompetensi: string;
  kategori: "wajib" | "umum" | "khusus";
  required_level: number;
  actual_level: number;
  gap: number;
  rekomendasi: string;
}

export interface KaryawanDetail {
  id: number;
  nik: string | null;
  name: string;
  jabatan: string | null;
  departement: string | null;
  status: "aktif" | "cuti" | "resign";
  total_kompetensi: number;
  sesuai_target: number;
  skill_gap: number;
  cluster_label: string | null;
  kompetensis: KaryawanKompetensiDetail[];
  radar: { kategori: string; required: number; actual: number }[];
}

export async function getKaryawanList(): Promise<KaryawanListItem[]> {
  const res = await api.get("/api/karyawan");
  return res.data.data;
}

export async function getKaryawanDetail(id: number): Promise<KaryawanDetail> {
  const res = await api.get(`/api/karyawan/${id}`);
  return res.data.data;
}

export async function submitEvaluasi(
  karyawanId: number,
  evaluasi: { kompetensi_id: number; actual_level: number }[]
): Promise<void> {
  await api.post(`/api/karyawan/${karyawanId}/evaluasi`, { evaluasi });
}
