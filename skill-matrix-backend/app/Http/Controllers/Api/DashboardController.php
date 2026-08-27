<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvaluasiHistory;

class DashboardController extends Controller
{
    public function atasan(Request $request)
    {
        $atasan = $request->user();

        $karyawan = $atasan->karyawan()
            ->with(['departement:id,nama_departement', 'kompetensis'])
            ->get();

        $daftarKaryawan = $karyawan->map(function ($orang) {
            $kompetensis = $orang->kompetensis->map(function ($k) {
                $gap = max(0, $k->required_level - $k->pivot->actual_level);

                return [
                    'kompetensi_id' => $k->id,
                    'nama_kompetensi' => $k->nama_kompetensi,
                    'kategori' => $k->kategori,
                    'sub_kelompok' => $k->sub_kelompok,
                    'required_level' => $k->required_level,
                    'actual_level' => $k->pivot->actual_level,
                    'gap' => $gap,
                ];
            });

            $jumlahGap = $kompetensis->where('gap', '>', 0)->count();
            $jumlahGapWajib = $kompetensis->where('kategori', 'wajib')->where('gap', '>', 0)->count();

            return [
                'id' => $orang->id,
                'name' => $orang->name,
                'nik' => $orang->nik,
                'jabatan' => $orang->jabatan,
                'departement' => $orang->departement?->nama_departement,
                'total_kompetensi' => $kompetensis->count(),
                'jumlah_belum_memenuhi' => $jumlahGap,
                'jumlah_gap_wajib' => $jumlahGapWajib,
                'status' => $jumlahGap > 0 ? 'ada_gap' : 'memenuhi',
                'kompetensis' => $kompetensis->values(),
            ];
        });

        $totalKaryawan = $karyawan->count();
        $totalGap = $daftarKaryawan->sum('jumlah_belum_memenuhi');

        return response()->json([
            'ringkasan' => [
                'total_karyawan' => $totalKaryawan,
                'rata_rata_gap' => $totalKaryawan > 0 ? round($totalGap / $totalKaryawan, 1) : 0,
                'karyawan_gap_wajib' => $daftarKaryawan->where('jumlah_gap_wajib', '>', 0)->count(),
                'total_kompetensi_belum_memenuhi' => $totalGap,
            ],
            'daftar_karyawan' => $daftarKaryawan->values(),
        ]);
    }

    public function trenKompetensi(Request $request)
    {
        $karyawanIds = $request->user()->karyawan()->pluck('id');
        $namaBulan = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $data = collect(range(5, 0))->map(function ($i) use ($karyawanIds, $namaBulan) {
            $bulan = now()->subMonths($i)->startOfMonth();

            $rataRata = EvaluasiHistory::whereIn('user_id', $karyawanIds)
                ->whereYear('evaluated_at', $bulan->year)
                ->whereMonth('evaluated_at', $bulan->month)
                ->avg('actual_level');

            return [
                'bulan' => $namaBulan[$bulan->month] . ' ' . $bulan->format('y'),
                'rata_rata' => $rataRata !== null ? round($rataRata, 2) : null,
            ];
        });

        return response()->json(['data' => $data->values()]);
    }
}
