<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kompetensi_departement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kompetensi_id')->constrained()->cascadeOnDelete();
            $table->foreignId('departement_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['kompetensi_id', 'departement_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kompetensi_departement');
    }
};
