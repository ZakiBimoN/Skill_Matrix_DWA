<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\User;
use App\Support\RekomendasiKompetensi;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    /**
     * Agregasi skill gap per departemen, lintas seluruh perusahaan (bukan
     * cuma tim 1 atasan) — dipakai untuk grafik "Skill Gap per Departemen"
     * di menu Reports.
     */
    public function skillGapPerDepartemen()
    {
        $departements = Departement::with(['users' => function ($query) {
            $query->where('role', 'karyawan')->with('kompetensis');
        }])->get();

        $data = $departements->map(function ($dept) {
            $totalKaryawan = $dept->users->count();

            $totalGap = 0;
            $karyawanGapWajib = 0;

            foreach ($dept->users as $karyawan) {
                $adaGapWajib = false;

                foreach ($karyawan->kompetensis as $k) {
                    if ($k->pivot->actual_level < $k->required_level) {
                        $totalGap++;

                        if ($k->kategori === 'wajib') {
                            $adaGapWajib = true;
                        }
                    }
                }

                if ($adaGapWajib) {
                    $karyawanGapWajib++;
                }
            }

            return [
                'departemen' => $dept->nama_departement,
                'total_karyawan' => $totalKaryawan,
                'rata_rata_gap' => $totalKaryawan > 0 ? round($totalGap / $totalKaryawan, 1) : 0,
                'karyawan_gap_wajib' => $karyawanGapWajib,
            ];
        })->filter(fn ($row) => $row['total_karyawan'] > 0)->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Detail kompetensi per karyawan yang GAP-nya belum terpenuhi saja
     * (actual < required) — dipakai untuk sheet/tabel tambahan di export
     * Excel & PDF. Termasuk NIK per permintaan perusahaan.
     */
    public function detailKompetensiGap(Request $request)
    {
        $query = User::where('role', 'karyawan')
            ->with(['departement:id,nama_departement', 'kompetensis']);

        if ($request->filled('jabatan')) {
            $jabatanList = (array) $request->input('jabatan');
            $query->whereIn('jabatan', $jabatanList);
        }

        $karyawan = $query->get();

        $rows = collect();

        foreach ($karyawan as $k) {
            foreach ($k->kompetensis as $komp) {
                $actual = $komp->pivot->actual_level;
                $gap = $komp->required_level - $actual;

                if ($gap > 0) {
                    $rows->push([
                        'nik' => $k->nik,
                        'nama' => $k->name,
                        'departemen' => $k->departement?->nama_departement,
                        'jabatan' => $k->jabatan,
                        'nama_kompetensi' => $komp->nama_kompetensi,
                        'kategori' => $komp->kategori,
                        'required_level' => $komp->required_level,
                        'actual_level' => $actual,
                        'gap' => $gap,
                        'rekomendasi' => RekomendasiKompetensi::untuk($komp->required_level, $actual),
                    ]);
                }
            }
        }

        return response()->json(['data' => $rows->values()]);
    }
}
