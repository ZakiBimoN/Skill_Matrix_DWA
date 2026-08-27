<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kompetensi extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_kompetensi',
        'kategori', 
        'sub_kelompok', 
        'deskripsi',
        'target_departemen',
        'required_level',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'kompetensi_user')
            ->withPivot(['actual_level', 'evaluated_by', 'evaluated_at'])
            ->withTimestamps();
    }

    public function trainings(): HasMany
    {
        return $this->hasMany(Training::class);
    }

    /**
     * Departemen mana saja yang berlaku untuk kompetensi ini. Untuk
     * kategori "wajib", ini otomatis berisi SEMUA departemen (di-attach
     * saat create/update). Untuk "umum"/"khusus", atasan pilih manual.
     */
    public function departements(): BelongsToMany
    {
        return $this->belongsToMany(Departement::class, 'kompetensi_departement')
            ->withTimestamps();
    }
}
