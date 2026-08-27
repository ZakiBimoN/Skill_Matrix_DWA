<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Kompetensi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoKaryawanSeeder extends Seeder
{
    public function run(): void
    {
        $departemenPertama = Departement::firstOrCreate(
            ['kode_departement' => 'PROD'],
            ['nama_departement' => 'Produksi']
        );

        $atasan = User::where('role', 'atasan')->first();

        if (! $atasan) {
            $atasan = User::create([
                'name' => 'Budi Atasan',
                'email' => 'atasan@dasawindu.co.id',
                'password' => Hash::make('password123'),
                'role' => 'atasan',
                'departement_id' => $departemenPertama->id,
            ]);
        }

        $semuaKompetensi = Kompetensi::all();

        if ($semuaKompetensi->isEmpty()) {
            $this->command->error('Belum ada data Kompetensi. Jalankan KompetensiSeeder dulu.');
            return;
        }

        $departemenData = [
            [
                'kode' => 'PROD',
                'nama' => 'Produksi',
                'karyawan' => [
                    ['nik' => 'K-1024', 'name' => 'Imelda', 'jabatan' => 'Senior Engineer', 'tier' => 1],
                    ['nik' => 'K-1025', 'name' => 'John Doe', 'jabatan' => 'Junior Specialist', 'tier' => -2],
                    ['nik' => 'K-1029', 'name' => 'Siti Aminah', 'jabatan' => 'QA Staff', 'tier' => -1, 'status' => 'cuti'],
                    ['nik' => 'K-1033', 'name' => 'Budi Santoso', 'jabatan' => 'Production Operator', 'tier' => -1],
                    ['nik' => 'K-1041', 'name' => 'Rina Wulandari', 'jabatan' => 'HR Staff', 'tier' => 1],
                    ['nik' => 'K-1052', 'name' => 'Ahmad Fauzi', 'jabatan' => 'IT Support', 'tier' => 0],
                    ['nik' => 'K-1067', 'name' => 'Dewi Lestari', 'jabatan' => 'Finance Staff', 'tier' => 1],
                ],
            ],
            [
                'kode' => 'ITDEV',
                'nama' => 'IT Development',
                'karyawan' => [
                    ['nik' => 'K-2001', 'name' => 'Andi Pratama', 'jabatan' => 'Backend Developer', 'tier' => 1],
                    ['nik' => 'K-2002', 'name' => 'Bella Safitri', 'jabatan' => 'Frontend Developer', 'tier' => 0],
                    ['nik' => 'K-2003', 'name' => 'Citra Dewi', 'jabatan' => 'QA Engineer', 'tier' => 0],
                    ['nik' => 'K-2004', 'name' => 'Doni Saputra', 'jabatan' => 'DevOps Engineer', 'tier' => -1],
                    ['nik' => 'K-2005', 'name' => 'Eka Putri', 'jabatan' => 'UI/UX Designer', 'tier' => 0],
                    ['nik' => 'K-2006', 'name' => 'Farhan Hidayat', 'jabatan' => 'Mobile Developer', 'tier' => -2],
                    ['nik' => 'K-2007', 'name' => 'Gita Permata', 'jabatan' => 'Tech Lead', 'tier' => 1],
                ],
            ],
            [
                'kode' => 'HC',
                'nama' => 'Human Capital',
                'karyawan' => [
                    ['nik' => 'K-3001', 'name' => 'Hendra Wijaya', 'jabatan' => 'HR Generalist', 'tier' => 0],
                    ['nik' => 'K-3002', 'name' => 'Indah Permatasari', 'jabatan' => 'Recruiter', 'tier' => 1],
                    ['nik' => 'K-3003', 'name' => 'Joko Susilo', 'jabatan' => 'Training Officer', 'tier' => 0],
                    ['nik' => 'K-3004', 'name' => 'Kartika Sari', 'jabatan' => 'Compensation & Benefit', 'tier' => -1],
                    ['nik' => 'K-3005', 'name' => 'Lina Marlina', 'jabatan' => 'HR Business Partner', 'tier' => 1],
                    ['nik' => 'K-3006', 'name' => 'Made Wijaya', 'jabatan' => 'Payroll Staff', 'tier' => -1],
                    ['nik' => 'K-3007', 'name' => 'Nadia Ramadhani', 'jabatan' => 'HR Staff', 'tier' => 0],
                ],
            ],
            [
                'kode' => 'MKT',
                'nama' => 'Marketing',
                'karyawan' => [
                    ['nik' => 'K-4001', 'name' => 'Oscar Ramadhan', 'jabatan' => 'Digital Marketing', 'tier' => 0],
                    ['nik' => 'K-4002', 'name' => 'Putri Anggraini', 'jabatan' => 'Content Creator', 'tier' => -1],
                    ['nik' => 'K-4003', 'name' => 'Qori Ramadhan', 'jabatan' => 'SEO Specialist', 'tier' => 0],
                    ['nik' => 'K-4004', 'name' => 'Rani Susanti', 'jabatan' => 'Brand Executive', 'tier' => -2],
                    ['nik' => 'K-4005', 'name' => 'Satrio Wibowo', 'jabatan' => 'Marketing Analyst', 'tier' => 1],
                    ['nik' => 'K-4006', 'name' => 'Tania Putri', 'jabatan' => 'Social Media Officer', 'tier' => -1],
                    ['nik' => 'K-4007', 'name' => 'Umar Fauzi', 'jabatan' => 'Marketing Communication', 'tier' => 0],
                ],
            ],
            [
                'kode' => 'FIN',
                'nama' => 'Finance',
                'karyawan' => [
                    ['nik' => 'K-5001', 'name' => 'Vina Kusuma', 'jabatan' => 'Finance Staff', 'tier' => 1],
                    ['nik' => 'K-5002', 'name' => 'Wahyu Nugroho', 'jabatan' => 'Accounting Staff', 'tier' => 0],
                    ['nik' => 'K-5003', 'name' => 'Xena Amelia', 'jabatan' => 'Tax Officer', 'tier' => 0],
                    ['nik' => 'K-5004', 'name' => 'Yusuf Maulana', 'jabatan' => 'Budgeting Analyst', 'tier' => -1],
                    ['nik' => 'K-5005', 'name' => 'Zahra Amelia', 'jabatan' => 'AR/AP Staff', 'tier' => 0],
                    ['nik' => 'K-5006', 'name' => 'Agus Setiawan', 'jabatan' => 'Internal Audit', 'tier' => 1],
                    ['nik' => 'K-5007', 'name' => 'Bunga Lestari', 'jabatan' => 'Finance Supervisor', 'tier' => 1],
                ],
            ],
        ];

        $totalKaryawan = 0;

        foreach ($departemenData as $dept) {
            $departement = Departement::firstOrCreate(
                ['kode_departement' => $dept['kode']],
                ['nama_departement' => $dept['nama']]
            );

            foreach ($dept['karyawan'] as $index => $item) {
                $karyawan = User::updateOrCreate(
                    ['email' => strtolower(str_replace(' ', '.', $item['name'])) . '@dasawindu.co.id'],
                    [
                        'name' => $item['name'],
                        'password' => Hash::make('password123'),
                        'role' => 'karyawan',
                        'nik' => $item['nik'],
                        'jabatan' => $item['jabatan'],
                        'departement_id' => $departement->id,
                        'atasan_id' => $atasan->id,
                        'status' => $item['status'] ?? 'aktif',
                    ]
                );

                // Assign semua kompetensi dengan actual_level bervariasi.
                // Pakai hash dari NIK (bukan index 0-6 yang berulang sama di
                // tiap departemen) supaya variasi antar karyawan lebih nyata
                // — kalau polanya sama persis, banyak karyawan berakhir
                // dengan fitur yang identik dan titiknya numpuk di scatter
                // plot PCA (kelihatan cuma "beberapa" padahal banyak).
                $seed = crc32($item['nik']);

                foreach ($semuaKompetensi as $i => $kompetensi) {
                    $variasi = ($seed + $i * 7) % 5;
                    $penalti = $variasi >= 3 ? 1 : ($variasi === 0 ? -1 : 0);
                    $actual = max(1, min(4, $kompetensi->required_level + $item['tier'] - $penalti));

                    $karyawan->kompetensis()->syncWithoutDetaching([
                        $kompetensi->id => [
                            'actual_level' => $actual,
                            'evaluated_by' => $atasan->id,
                            'evaluated_at' => now(),
                        ],
                    ]);
                }

                $totalKaryawan++;
            }

            $this->command->info("Departemen \"{$dept['nama']}\" — " . count($dept['karyawan']) . ' karyawan berhasil dibuat.');
        }

        $this->command->info("Total {$totalKaryawan} karyawan demo berhasil dibuat/diperbarui di " . count($departemenData) . ' departemen.');
    }
}
