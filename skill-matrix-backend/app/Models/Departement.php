<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_departement',
        'kode_departement',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function kompetensis(): BelongsToMany
    {
        return $this->belongsToMany(Kompetensi::class, 'kompetensi_departement')
            ->withTimestamps();
    }
}
