<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kompetensis', function (Blueprint $table) {
            // Required Level sekarang jadi standar tetap milik kompetensinya,
            // bukan lagi per pasangan karyawan-kompetensi.
            $table->unsignedTinyInteger('required_level')->default(1)->after('target_departemen');
        });

        Schema::table('kompetensi_user', function (Blueprint $table) {
            $table->dropColumn('required_level');
        });
    }

    public function down(): void
    {
        Schema::table('kompetensi_user', function (Blueprint $table) {
            $table->unsignedTinyInteger('required_level')->default(1);
        });

        Schema::table('kompetensis', function (Blueprint $table) {
            $table->dropColumn('required_level');
        });
    }
};
