<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel kompetensi_evaluasi_histories adalah LOG riwayat — satu
     * karyawan boleh punya banyak baris untuk kompetensi yang sama
     * (setiap kali dievaluasi ulang). Constraint unique di tabel ini
     * salah, harusnya cuma ada di tabel `kompetensi_user` (state
     * terkini), bukan di sini.
     */
    public function up(): void
    {
        Schema::table('kompetensi_evaluasi_histories', function (Blueprint $table) {
            $table->dropUnique('uniq_user_kompetensi');
        });
    }

    public function down(): void
    {
        // Sengaja tidak dikembalikan — constraint ini memang salah taruh.
    }
};
