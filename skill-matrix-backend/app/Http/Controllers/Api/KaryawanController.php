<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiHistory;
use App\Models\User;
use App\Support\RekomendasiKompetensi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class KaryawanController extends Controller
{
    /**
     * List karyawan yang berada di bawah Atasan yang sedang login.
     * Dipakai untuk tabel "Daftar Karyawan" di halaman Karyawan.
     */
    public function index(Request $request)
    {
        $karyawan = $request->user()
            ->karyawan()
            ->with('departement:id,nama_departement')
            ->get(['id', 'name', 'email', 'nik', 'jabatan', 'departement_id', 'status']);

        $data = $karyawan->map(fn ($k) => [
            'id' => $k->id,
            'nik' => $k->nik,
            'name' => $k->name,
            'jabatan' => $k->jabatan,
            'departement' => $k->departement?->nama_departement,
            'status' => $k->status,
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Detail lengkap satu karyawan: profil + semua kompetensi (required vs
     * actual + gap) + rata-rata per kategori (untuk radar chart).
     * Hanya bisa diakses oleh Atasan langsungnya.
     */
    public function show(Request $request, User $karyawan)
    {
        if ($karyawan->atasan_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke data karyawan ini.'], 403);
        }

        $karyawan->load(['departement:id,nama_departement', 'kompetensis']);

        // Ambil label cluster ML terakhir (kalau sudah pernah dihitung lewat
        // menu Reports) — biar rekomendasi di sini juga "tahu" konteks
        // klaster karyawan ini, bukan cuma murni target vs actual.
        $clusterLabel = \App\Models\RekomendasiPelatihan::where('user_id', $karyawan->id)
            ->whereNotNull('cluster_label')
            ->latest('generated_at')
            ->value('cluster_label');

        $kompetensis = $karyawan->kompetensis->map(function ($k) {
            $actual = $k->pivot->actual_level;
            $gap = max(0, $k->required_level - $actual);

            return [
                'kompetensi_id' => $k->id,
                'nama_kompetensi' => $k->nama_kompetensi,
                'kategori' => $k->kategori,
                'required_level' => $k->required_level,
                'actual_level' => $actual,
                'gap' => $gap,
                'rekomendasi' => RekomendasiKompetensi::untuk($k->required_level, $actual),
            ];
        });

        $totalKompetensi = $kompetensis->count();
        $sesuaiTarget = $kompetensis->where('gap', 0)->count();
        $skillGap = $totalKompetensi - $sesuaiTarget;

        // Rata-rata required & actual per kategori, untuk radar chart "Spread Kompetensi"
        $radar = $kompetensis
            ->groupBy('kategori')
            ->map(function ($items, $kategori) {
                return [
                    'kategori' => $kategori,
                    'required' => round($items->avg('required_level'), 1),
                    'actual' => round($items->avg('actual_level'), 1),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'id' => $karyawan->id,
                'nik' => $karyawan->nik,
                'name' => $karyawan->name,
                'jabatan' => $karyawan->jabatan,
                'departement' => $karyawan->departement?->nama_departement,
                'status' => $karyawan->status,
                'total_kompetensi' => $totalKompetensi,
                'sesuai_target' => $sesuaiTarget,
                'skill_gap' => $skillGap,
                'cluster_label' => $clusterLabel,
                'kompetensis' => $kompetensis->values(),
                'radar' => $radar,
            ],
        ]);
    }

    /**
     * Atasan membuat akun karyawan baru di bawahnya.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'nik' => ['nullable', 'string', 'unique:users,nik'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'departement_id' => ['nullable', 'exists:departements,id'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $karyawan = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'nik' => $validated['nik'] ?? null,
            'jabatan' => $validated['jabatan'] ?? null,
            'departement_id' => $validated['departement_id'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'karyawan',
            'atasan_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $karyawan], 201);
    }

    /**
     * Submit hasil "Evaluasi Skill": update actual_level beberapa kompetensi
     * sekaligus, catat siapa & kapan (pivot + history log).
     *
     * Pakai bulk upsert (2 query total), BUKAN loop query satu-satu per
     * kompetensi — supaya cepat dan tidak gampang macet/timeout kalau
     * koneksi database sedang tidak stabil.
     */
    public function evaluasi(Request $request, User $karyawan)
    {
        if ($karyawan->atasan_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk mengevaluasi karyawan ini.'], 403);
        }

        $validated = $request->validate([
            'evaluasi' => ['required', 'array', 'min:1'],
            'evaluasi.*.kompetensi_id' => ['required', 'exists:kompetensis,id'],
            'evaluasi.*.actual_level' => ['required', 'integer', 'min:1', 'max:4'],
        ]);

        $evaluator = $request->user();
        $now = now();

        $kompetensiIds = collect($validated['evaluasi'])->pluck('kompetensi_id');
        $requiredLevels = \App\Models\Kompetensi::whereIn('id', $kompetensiIds)->pluck('required_level', 'id');

        DB::transaction(function () use ($validated, $karyawan, $evaluator, $now, $requiredLevels) {
            $pivotRows = [];
            $historyRows = [];

            foreach ($validated['evaluasi'] as $item) {
                $pivotRows[] = [
                    'user_id' => $karyawan->id,
                    'kompetensi_id' => $item['kompetensi_id'],
                    'actual_level' => $item['actual_level'],
                    'evaluated_by' => $evaluator->id,
                    'evaluated_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $historyRows[] = [
                    'user_id' => $karyawan->id,
                    'kompetensi_id' => $item['kompetensi_id'],
                    'required_level' => $requiredLevels[$item['kompetensi_id']] ?? 0,
                    'actual_level' => $item['actual_level'],
                    'evaluated_by' => $evaluator->id,
                    'evaluated_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // 1 query: update kalau sudah ada (user_id + kompetensi_id sama),
            // insert kalau belum pernah di-assign.
            DB::table('kompetensi_user')->upsert(
                $pivotRows,
                ['user_id', 'kompetensi_id'],
                ['actual_level', 'evaluated_by', 'evaluated_at', 'updated_at']
            );

            // 1 query: catat semua riwayat evaluasi sekaligus.
            DB::table('kompetensi_evaluasi_histories')->insert($historyRows);
        });

        return response()->json(['message' => 'Evaluasi berhasil disimpan.']);
    }
}
