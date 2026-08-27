<?php

namespace App\Support;

class RekomendasiKompetensi
{
    /**
     * Tabel rekomendasi Target vs Actual, persis sesuai referensi
     * "Master_Rekomendasi" dari perusahaan. Key format: "target-actual".
     */
    private const TABEL = [
        '4-4' => 'Kompetensi telah memenuhi target.',
        '4-3' => 'Pelatihan lanjutan, menjadi trainer, memimpin improvement, reassessment.',
        '4-2' => 'OJT intensif, coaching, pelatihan lanjutan, evaluasi berkala.',
        '4-1' => 'Pelatihan dasar, OJT penuh, pendampingan supervisor.',

        '3-3' => 'Kompetensi telah memenuhi target.',
        '3-2' => 'OJT dan coaching hingga mampu bekerja mandiri.',
        '3-1' => 'Pelatihan dasar dan pendampingan intensif.',

        '2-2' => 'Kompetensi telah memenuhi target.',
        '2-1' => 'Pelatihan dasar dan praktik kerja.',

        '1-1' => 'Kompetensi telah memenuhi target.',
    ];

    /**
     * Ambil teks rekomendasi berdasarkan Required Level (target) & Actual
     * Level karyawan saat ini.
     */
    public static function untuk(int $target, int $actual): string
    {
        if ($actual <= 0) {
            return 'Belum dievaluasi oleh atasan.';
        }

        // Actual sudah sama atau melebihi target -> selalu dianggap memenuhi.
        if ($actual >= $target) {
            return 'Kompetensi telah memenuhi target.';
        }

        $key = "{$target}-{$actual}";

        return self::TABEL[$key] ?? 'Perlu peningkatan kompetensi melalui pelatihan lanjutan.';
    }
}
