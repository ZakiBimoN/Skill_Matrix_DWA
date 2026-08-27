
interface KompetensiItem {
  nama: string;
  required: number; 
}

interface SubKelompok {
  nama: string | null;
  items: KompetensiItem[];
}

interface KategoriGroup {
  kategori: "Wajib" | "Umum" | "Khusus";
  subKelompok: SubKelompok[];
}

export const KOMPETENSI_GROUPS: KategoriGroup[] = [
  {
    kategori: "Wajib",
    subKelompok: [
      {
        nama: "Company Profile",
        items: [
          { nama: "Peraturan Perusahaan", required: 4 },
          { nama: "Struktur Organisasi", required: 4 },
          { nama: "Kebijakan Mutu", required: 4 },
        ],
      },
      {
        nama: "Safety",
        items: [
          { nama: "Kemampuan Menemukan Potensi Bahaya", required: 4 },
          { nama: "Kemampuan Mengendalikan Potensi Bahaya", required: 4 },
        ],
      },
      {
        nama: "5S",
        items: [{ nama: "Implementasi 5S di Area Kerja", required: 4 }],
      },
      {
        nama: "Environment",
        items: [
          { nama: "Pengendalian Limbah B3", required: 4 },
          { nama: "System Management Mutu 16949:2016", required: 3 },
          { nama: "System Management Lingkungan 14001:2015", required: 3 },
          { nama: "System Management 45001:2018", required: 3 },
        ],
      },
    ],
  },
  {
    kategori: "Umum",
    subKelompok: [
      {
        nama: null,
        items: [
          { nama: "Kemampuan Bekerjasama dengan Team & Pihak Lain", required: 3 },
          { nama: "Kemampuan Membuat Rencana Kerja", required: 3 },
          { nama: "Improvement", required: 3 },
          { nama: "Kemampuan Analisa dan Problem Solving", required: 3 },
          { nama: "Kemampuan Komunikasi", required: 3 },
          { nama: "Pengendalian Dokumen & Data Control", required: 3 },
        ],
      },
    ],
  },
  {
    kategori: "Khusus",
    subKelompok: [
      {
        nama: null,
        items: [
          { nama: "Pemahaman Bisnis Proses Mapping", required: 3 },
          { nama: "Pemahaman tentang Semua Procedure", required: 3 },
          { nama: "Kemampuan Mengumpulkan, Meneliti, dan Membuat Data Statistik", required: 3 },
          { nama: "Kemampuan Mensosialisasikan dan Distribusikan Dokumen ke Bagian Terkait", required: 3 },
          { nama: "Mampu Melakukan Pengendalian Informasi Terdokumentasi", required: 3 },
        ],
      },
    ],
  },
];

export const ALL_KOMPETENSI: KompetensiItem[] = KOMPETENSI_GROUPS.flatMap((g) =>
  g.subKelompok.flatMap((sk) => sk.items)
);

export const ALL_KOMPETENSI_WITH_KATEGORI = KOMPETENSI_GROUPS.flatMap((g) =>
  g.subKelompok.flatMap((sk) =>
    sk.items.map((item) => ({
      ...item,
      kategori: g.kategori,
      subKelompok: sk.nama,
      targetDepartemen: "Semua Departemen", // asumsi default, sesuaikan via CRUD nanti
    }))
  )
);

export interface MockKaryawan {
  id: number;
  nik: string;
  name: string;
  jabatan: string;
  status: "aktif" | "cuti";
  actual: Record<string, number>; // nama_kompetensi -> actual level (0-4)
}

/**
 * Generator level aktual deterministik (bukan Math.random, supaya tidak beda
 * antara render server & client). tierOffset: makin tinggi makin jago.
 */
function generateActual(employeeId: number, tierOffset: number): Record<string, number> {
  const result: Record<string, number> = {};
  ALL_KOMPETENSI.forEach((komp, index) => {
    const penalti = (employeeId + index) % 3 === 0 ? 1 : 0;
    const level = Math.min(4, Math.max(1, komp.required + tierOffset - penalti));
    result[komp.nama] = level;
  });
  return result;
}

const EMPLOYEE_BASE: {
  id: number;
  nik: string;
  name: string;
  jabatan: string;
  status: "aktif" | "cuti";
  tierOffset: number;
}[] = [
  { id: 1, nik: "K-1024", name: "Imelda", jabatan: "Senior Engineer", status: "aktif", tierOffset: 0 },
  { id: 2, nik: "K-1025", name: "John Doe", jabatan: "Junior Specialist", status: "aktif", tierOffset: -2 },
  { id: 3, nik: "K-1029", name: "Siti Aminah", jabatan: "QA Staff", status: "cuti", tierOffset: -1 },
  { id: 4, nik: "K-1033", name: "Budi Santoso", jabatan: "Production Operator", status: "aktif", tierOffset: -1 },
  { id: 5, nik: "K-1041", name: "Rina Wulandari", jabatan: "HR Staff", status: "aktif", tierOffset: 0 },
  { id: 6, nik: "K-1052", name: "Ahmad Fauzi", jabatan: "IT Support", status: "aktif", tierOffset: -1 },
  { id: 7, nik: "K-1067", name: "Dewi Lestari", jabatan: "Finance Staff", status: "aktif", tierOffset: 0 },
];

export const MOCK_KARYAWAN: MockKaryawan[] = EMPLOYEE_BASE.map((e) => ({
  id: e.id,
  nik: e.nik,
  name: e.name,
  jabatan: e.jabatan,
  status: e.status,
  actual: generateActual(e.id, e.tierOffset),
}));

export const TREN_KOMPETENSI = [
  { bulan: "Jan", rataRata: 2.1 },
  { bulan: "Feb", rataRata: 2.3 },
  { bulan: "Mar", rataRata: 2.4 },
  { bulan: "Apr", rataRata: 2.6 },
  { bulan: "Mei", rataRata: 2.7 },
  { bulan: "Jun", rataRata: 2.9 },
];

export function hitungGap(karyawan: MockKaryawan, namaKompetensi: string) {
  const kompetensi = ALL_KOMPETENSI.find((k) => k.nama === namaKompetensi);
  if (!kompetensi) return 0;
  return Math.max(0, kompetensi.required - (karyawan.actual[namaKompetensi] ?? 0));
}

/**
 * Rata-rata required & actual level per kategori (Wajib/Umum/Khusus) untuk
 * satu karyawan — dipakai buat radar chart "Spread Kompetensi".
 */
export function hitungRadarKategori(karyawan: MockKaryawan) {
  return KOMPETENSI_GROUPS.map((group) => {
    const items = group.subKelompok.flatMap((sk) => sk.items);
    const totalRequired = items.reduce((sum, i) => sum + i.required, 0);
    const totalActual = items.reduce(
      (sum, i) => sum + (karyawan.actual[i.nama] ?? 0),
      0
    );
    const count = items.length;

    return {
      kategori: group.kategori,
      required: Number((totalRequired / count).toFixed(1)),
      actual: Number((totalActual / count).toFixed(1)),
    };
  });
}
