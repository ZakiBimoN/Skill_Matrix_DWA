<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kompetensi_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kompetensi_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('required_level'); // 1-4
            $table->unsignedTinyInteger('actual_level')->default(0); // 0 = belum dievaluasi ulang / baru lulus training

            // Siapa & kapan terakhir dievaluasi (selalu Atasan)
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('evaluated_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'kompetensi_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kompetensi_user');
    }
};
