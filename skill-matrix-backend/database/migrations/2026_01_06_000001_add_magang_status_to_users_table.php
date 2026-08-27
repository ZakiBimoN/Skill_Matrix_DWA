<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL tidak bisa "tambah 1 value ke enum" langsung — harus
        // redefine ulang seluruh daftar enum-nya.
        DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('aktif', 'cuti', 'resign', 'magang') NOT NULL DEFAULT 'aktif'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN status ENUM('aktif', 'cuti', 'resign') NOT NULL DEFAULT 'aktif'");
    }
};
