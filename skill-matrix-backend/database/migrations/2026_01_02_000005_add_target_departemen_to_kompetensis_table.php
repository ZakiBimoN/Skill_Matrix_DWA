<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kompetensis', function (Blueprint $table) {
            // Disimpan sebagai teks bebas dulu (mis. "Produksi, Logistik" atau
            // "Semua Departemen"), sesuai tampilan di halaman Kompetensi.
            // Bisa dinormalisasi jadi relasi many-to-many ke departements nanti
            // kalau perlu filter/laporan per departemen yang lebih ketat.
            $table->string('target_departemen')->nullable()->after('deskripsi');
        });
    }

    public function down(): void
    {
        Schema::table('kompetensis', function (Blueprint $table) {
            $table->dropColumn('target_departemen');
        });
    }
};
