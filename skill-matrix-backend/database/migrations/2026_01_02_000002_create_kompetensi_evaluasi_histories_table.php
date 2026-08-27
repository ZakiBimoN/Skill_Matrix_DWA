<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kompetensi_evaluasi_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kompetensi_id')->constrained()->cascadeOnDelete();

            $table->unsignedTinyInteger('required_level'); // snapshot saat itu
            $table->unsignedTinyInteger('actual_level');   // hasil evaluasi baru

            $table->foreignId('evaluated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('evaluated_at');

            $table->timestamps();

            $table->index(['user_id', 'evaluated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kompetensi_evaluasi_histories');
    }
};
