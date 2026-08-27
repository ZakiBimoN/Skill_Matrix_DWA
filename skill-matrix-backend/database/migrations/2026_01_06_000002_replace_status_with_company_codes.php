<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ganti status lama:
     * aktif  -> NST
     * cuti   -> NST
     * resign -> NST
     * magang -> MG
     *
     * Kemudian status menggunakan kode perusahaan:
     * SK, ST, NSK, NST, MG
     */
    public function up(): void
    {
        // 1. Tambahkan kolom sementara untuk menampung
        //    status baru.
        DB::statement("
            ALTER TABLE users
            ADD COLUMN status_new ENUM('SK', 'ST', 'NSK', 'NST', 'MG')
            NOT NULL DEFAULT 'NST'
            AFTER status
        ");

        // 2. Mapping status lama ke status baru.
        DB::statement("
            UPDATE users
            SET status_new = CASE
                WHEN status = 'magang' THEN 'MG'
                WHEN status IN ('aktif', 'cuti', 'resign') THEN 'NST'
                ELSE 'NST'
            END
        ");

        // 3. Hapus kolom status lama.
        DB::statement("
            ALTER TABLE users
            DROP COLUMN status
        ");

        // 4. Ganti nama status_new menjadi status.
        DB::statement("
            ALTER TABLE users
            CHANGE COLUMN status_new status
            ENUM('SK', 'ST', 'NSK', 'NST', 'MG')
            NOT NULL DEFAULT 'NST'
        ");
    }

    public function down(): void
    {
        // Kolom sementara untuk mengembalikan status lama.
        DB::statement("
            ALTER TABLE users
            ADD COLUMN status_old
            ENUM('aktif', 'cuti', 'resign', 'magang')
            NOT NULL DEFAULT 'aktif'
            AFTER status
        ");

        // Mapping status baru ke status lama.
        DB::statement("
            UPDATE users
            SET status_old = CASE
                WHEN status = 'MG' THEN 'magang'
                ELSE 'aktif'
            END
        ");

        // Hapus status baru.
        DB::statement("
            ALTER TABLE users
            DROP COLUMN status
        ");

        // Kembalikan nama menjadi status.
        DB::statement("
            ALTER TABLE users
            CHANGE COLUMN status_old status
            ENUM('aktif', 'cuti', 'resign', 'magang')
            NOT NULL DEFAULT 'aktif'
        ");
    }
};