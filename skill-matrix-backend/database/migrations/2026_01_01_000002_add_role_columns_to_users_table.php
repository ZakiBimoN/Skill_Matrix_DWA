<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Hanya 2 role: atasan (juga berperan kelola master data) & karyawan
            $table->enum('role', ['atasan', 'karyawan'])->default('karyawan')->after('email');

            $table->string('nik')->unique()->nullable()->after('role'); // Nomor Induk Pegawai
            $table->string('jabatan')->nullable()->after('nik'); // bukan variabel utama, sekadar info

            $table->foreignId('divisi_id')->nullable()->after('jabatan')
                ->constrained('divisis')->nullOnDelete();

            // Karyawan terhubung ke satu Atasan yang mengevaluasinya.
            // Self-reference ke tabel users, nullable karena Atasan tidak butuh field ini.
            $table->foreignId('atasan_id')->nullable()->after('divisi_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('atasan_id');
            $table->dropConstrainedForeignId('divisi_id');
            $table->dropColumn(['role', 'nik', 'jabatan']);
        });
    }
};
