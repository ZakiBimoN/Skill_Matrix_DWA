<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rekomendasi_pelatihan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kompetensi_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('required_level');
            $table->unsignedTinyInteger('actual_level');
            $table->text('rekomendasi'); // teks dari tabel Target vs Actual

            // Hasil clustering ML terakhir untuk karyawan ini (Top Talent /
            // Emerging / Gap Critical) — nullable karena bisa saja rekomendasi
            // ini dibuat sebelum clustering pernah dijalankan.
            $table->string('cluster_label')->nullable();

            // Status tindak lanjut — disiapkan untuk fitur penjadwalan
            // training nanti (belum ada UI-nya, tapi kolomnya sudah siap).
            $table->enum('status', ['belum_dijadwalkan', 'dijadwalkan', 'selesai'])
                ->default('belum_dijadwalkan');
            $table->foreignId('training_id')->nullable()
                ->constrained('trainings')->nullOnDelete();

            $table->timestamp('generated_at'); // kapan rekomendasi ini terakhir dihitung ulang
            $table->timestamps();

            // 1 baris aktif per pasangan karyawan+kompetensi — kalau
            // rekomendasi dihitung ulang, baris yang sama di-update, bukan
            // numpuk jadi duplikat.
            $table->unique(['user_id', 'kompetensi_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekomendasi_pelatihan');
    }
};
