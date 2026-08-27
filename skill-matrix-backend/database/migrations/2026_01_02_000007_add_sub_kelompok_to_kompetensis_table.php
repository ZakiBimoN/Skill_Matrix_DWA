<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kompetensis', function (Blueprint $table) {
            // Cuma kategori "Wajib" yang punya sub-kelompok (Company Profile,
            // Safety, 5S, Environment). Nullable karena Umum/Khusus tidak pakai.
            $table->string('sub_kelompok')->nullable()->after('kategori');
        });
    }

    public function down(): void
    {
        Schema::table('kompetensis', function (Blueprint $table) {
            $table->dropColumn('sub_kelompok');
        });
    }
};
