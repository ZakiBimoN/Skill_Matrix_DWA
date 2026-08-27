<?php

namespace Database\Seeders;

use App\Models\Kompetensi;
use Illuminate\Database\Seeder;

class KompetensiSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // Wajib - Company Profile
            ['nama_kompetensi' => 'Peraturan Perusahaan', 'kategori' => 'wajib', 'sub_kelompok' => 'Company Profile', 'required_level' => 4],
            ['nama_kompetensi' => 'Struktur Organisasi', 'kategori' => 'wajib', 'sub_kelompok' => 'Company Profile', 'required_level' => 4],
            ['nama_kompetensi' => 'Kebijakan Mutu', 'kategori' => 'wajib', 'sub_kelompok' => 'Company Profile', 'required_level' => 4],

            // Wajib - Safety
            ['nama_kompetensi' => 'Kemampuan Menemukan Potensi Bahaya', 'kategori' => 'wajib', 'sub_kelompok' => 'Safety', 'required_level' => 4],
            ['nama_kompetensi' => 'Kemampuan Mengendalikan Potensi Bahaya', 'kategori' => 'wajib', 'sub_kelompok' => 'Safety', 'required_level' => 4],

            // Wajib - 5S
            ['nama_kompetensi' => 'Implementasi 5S di Area Kerja', 'kategori' => 'wajib', 'sub_kelompok' => '5S', 'required_level' => 4],

            // Wajib - Environment
            ['nama_kompetensi' => 'Pengendalian Limbah B3', 'kategori' => 'wajib', 'sub_kelompok' => 'Environment', 'required_level' => 4],
            ['nama_kompetensi' => 'System Management Mutu 16949:2016', 'kategori' => 'wajib', 'sub_kelompok' => 'Environment', 'required_level' => 3],
            ['nama_kompetensi' => 'System Management Lingkungan 14001:2015', 'kategori' => 'wajib', 'sub_kelompok' => 'Environment', 'required_level' => 3],
            ['nama_kompetensi' => 'System Management 45001:2018', 'kategori' => 'wajib', 'sub_kelompok' => 'Environment', 'required_level' => 3],

            // Umum 
            ['nama_kompetensi' => 'Kemampuan Bekerjasama dengan Team & Pihak Lain', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Kemampuan Membuat Rencana Kerja', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Improvement', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Kemampuan Analisa dan Problem Solving', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Kemampuan Komunikasi', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Pengendalian Dokumen & Data Control', 'kategori' => 'umum', 'sub_kelompok' => null, 'required_level' => 3],

            // Khusus 
            ['nama_kompetensi' => 'Pemahaman Bisnis Proses Mapping', 'kategori' => 'khusus', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Pemahaman tentang Semua Procedure', 'kategori' => 'khusus', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Kemampuan Mengumpulkan, Meneliti, dan Membuat Data Statistik', 'kategori' => 'khusus', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Kemampuan Mensosialisasikan dan Distribusikan Dokumen ke Bagian Terkait', 'kategori' => 'khusus', 'sub_kelompok' => null, 'required_level' => 3],
            ['nama_kompetensi' => 'Mampu Melakukan Pengendalian Informasi Terdokumentasi', 'kategori' => 'khusus', 'sub_kelompok' => null, 'required_level' => 3],
        ];

        foreach ($data as $row) {
            Kompetensi::updateOrCreate(
                ['nama_kompetensi' => $row['nama_kompetensi']],
                $row + ['target_departemen' => 'Semua Departemen']
            );
        }
    }
}
