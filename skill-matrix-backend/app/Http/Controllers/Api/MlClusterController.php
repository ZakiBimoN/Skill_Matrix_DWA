<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RekomendasiPelatihan;
use App\Models\User;
use App\Support\RekomendasiKompetensi;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlClusterController extends Controller
{
    /**
     * Ambil data kompetensi seluruh karyawan (lintas departemen), hitung
     * fitur (rata-rata actual, gap, dll), kirim ke service Python untuk
     * di-cluster pakai PCA + K-Means, lalu kembalikan hasilnya.
     */
    public function index(): JsonResponse
    {
        $karyawan = User::where('role', 'karyawan')
            ->with(['kompetensis', 'departement:id,nama_departement'])
            ->get();

        if ($karyawan->count() < 4) {
            return response()->json([
                'message' => 'Minimal 4 karyawan dengan data kompetensi dibutuhkan untuk clustering.',
            ], 422);
        }

        $features = $karyawan->map(function ($k) {
            $kompetensis = $k->kompetensis;

            if ($kompetensis->isEmpty()) {
                return null;
            }

            $avgActual = $kompetensis->avg(fn ($i) => $i->pivot->actual_level);
            $avgGap = $kompetensis->avg(fn ($i) => max(0, $i->required_level - $i->pivot->actual_level));
            $jumlahBelumMemenuhi = $kompetensis->filter(
                fn ($i) => $i->pivot->actual_level < $i->required_level
            )->count();

            $wajib = $kompetensis->where('kategori', 'wajib');
            $umum = $kompetensis->where('kategori', 'umum');
            $khusus = $kompetensis->where('kategori', 'khusus');

            $rasio = fn ($group) => $group->isNotEmpty()
                ? round($group->avg(fn ($i) => $i->pivot->actual_level / $i->required_level), 3)
                : 0;

            return [
                'id' => $k->id,
                'name' => $k->name,
                'departemen' => $k->departement?->nama_departement,
                'avg_actual' => round($avgActual, 2),
                'avg_gap' => round($avgGap, 2),
                'jumlah_belum_memenuhi' => $jumlahBelumMemenuhi,
                'avg_wajib' => $wajib->isNotEmpty() ? round($wajib->avg(fn ($i) => $i->pivot->actual_level), 2) : 0,
                'avg_umum' => $umum->isNotEmpty() ? round($umum->avg(fn ($i) => $i->pivot->actual_level), 2) : 0,
                'avg_khusus' => $khusus->isNotEmpty() ? round($khusus->avg(fn ($i) => $i->pivot->actual_level), 2) : 0,
                'ratio_wajib' => $rasio($wajib),
                'ratio_umum' => $rasio($umum),
                'ratio_khusus' => $rasio($khusus),
            ];
        })->filter()->values();

        if ($features->count() < 4) {
            return response()->json([
                'message' => 'Minimal 4 karyawan dengan data kompetensi lengkap dibutuhkan untuk clustering.',
            ], 422);
        }

        $mlServiceUrl = config('services.ml.url', 'http://127.0.0.1:8001');

        try {
            $response = Http::timeout(15)->post("{$mlServiceUrl}/cluster", [
                'karyawan' => $features,
                'n_clusters' => 3,
            ]);

            if (! $response->successful()) {
                Log::warning('ML service merespons error', ['status' => $response->status(), 'body' => $response->body()]);

                return response()->json([
                    'message' => 'Gagal menghitung clustering. Cek apakah ML service (Python) sedang berjalan.',
                ], 502);
            }

            $hasil = $response->json();

            // Gabungkan nama & departemen karyawan kembali (service Python cuma balikin id)
            $infoMap = $features->keyBy('id');
            $hasil['karyawan'] = collect($hasil['karyawan'])->map(function ($item) use ($infoMap) {
                $item['name'] = $infoMap[$item['id']]['name'] ?? null;
                $item['departemen'] = $infoMap[$item['id']]['departemen'] ?? null;
                return $item;
            })->values();

            // Simpan/perbarui rekomendasi pelatihan, digabung dengan label
            // cluster ML terbaru — supaya rekomendasi tidak cuma dihitung
            // sesaat, tapi tersimpan dan bisa dilacak statusnya nanti.
            $this->simpanRekomendasiPelatihan($karyawan, $hasil['karyawan']);

            return response()->json($hasil);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return response()->json([
                'message' => 'Tidak bisa terhubung ke ML service. Pastikan sudah dijalankan (uvicorn main:app --port 8001).',
            ], 503);
        }
    }

    /**
     * Untuk tiap karyawan yang punya kompetensi belum memenuhi target,
     * simpan/update baris di rekomendasi_pelatihan: teks rekomendasi (dari
     * tabel Target vs Actual) + label cluster ML yang baru saja dihitung.
     */
    private function simpanRekomendasiPelatihan($semuaKaryawan, $hasilCluster): void
    {
        $clusterMap = collect($hasilCluster)->keyBy('id');
        $now = now();
        $rows = [];

        foreach ($semuaKaryawan as $k) {
            $clusterLabel = $clusterMap[$k->id]['cluster_label'] ?? null;

            foreach ($k->kompetensis as $komp) {
                $actual = $komp->pivot->actual_level;

                if ($actual >= $komp->required_level) {
                    continue; // sudah memenuhi, tidak perlu rekomendasi
                }

                $rows[] = [
                    'user_id' => $k->id,
                    'kompetensi_id' => $komp->id,
                    'required_level' => $komp->required_level,
                    'actual_level' => $actual,
                    'rekomendasi' => RekomendasiKompetensi::untuk($komp->required_level, $actual),
                    'cluster_label' => $clusterLabel,
                    'status' => 'belum_dijadwalkan',
                    'generated_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (! empty($rows)) {
            \Illuminate\Support\Facades\DB::table('rekomendasi_pelatihan')->upsert(
                $rows,
                ['user_id', 'kompetensi_id'],
                ['required_level', 'actual_level', 'rekomendasi', 'cluster_label', 'generated_at', 'updated_at']
            );
        }
    }
}
