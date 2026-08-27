<?php

use App\Models\Departement;
use App\Models\Kompetensi;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $semuaDepartemen = Departement::all();

        Kompetensi::all()->each(function (Kompetensi $kompetensi) use ($semuaDepartemen) {
            // Wajib selalu berlaku untuk semua departemen.
            if ($kompetensi->kategori === 'wajib') {
                $kompetensi->departements()->syncWithoutDetaching($semuaDepartemen->pluck('id'));
                return;
            }

            $teks = trim((string) $kompetensi->target_departemen);

            if ($teks === '' || strtolower($teks) === 'semua departemen') {
                $kompetensi->departements()->syncWithoutDetaching($semuaDepartemen->pluck('id'));
                return;
            }

            // Coba cocokkan nama departemen dari teks lama, mis. "Produksi, Logistik"
            $namaNama = array_map('trim', explode(',', $teks));
            $cocok = $semuaDepartemen->filter(
                fn ($d) => in_array($d->nama_departement, $namaNama, true)
            );

            if ($cocok->isNotEmpty()) {
                $kompetensi->departements()->syncWithoutDetaching($cocok->pluck('id'));
            } else {
                // Tidak ketemu cocok sama sekali — aman default ke "semua",
                // daripada kompetensi jadi tidak berlaku ke siapa pun.
                $kompetensi->departements()->syncWithoutDetaching($semuaDepartemen->pluck('id'));
            }
        });
    }

    public function down(): void
    {
        // Migration perbaikan data, sengaja tidak di-reverse.
    }
};
