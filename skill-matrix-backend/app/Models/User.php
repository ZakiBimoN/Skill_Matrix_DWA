<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'nik',
        'jabatan',
        'departement_id',
        'atasan_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ---- Role helpers ----

    public function isAtasan(): bool
    {
        return $this->role === 'atasan';
    }

    public function isKaryawan(): bool
    {
        return $this->role === 'karyawan';
    }

    // ---- Relationships ----

    public function departement(): BelongsTo
    {
        return $this->belongsTo(Departement::class);
    }

    /**
     * Atasan yang membawahi user ini (hanya relevan jika role = karyawan).
     */
    public function atasan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atasan_id');
    }

    /**
     * Daftar karyawan yang dibawahi user ini (hanya relevan jika role = atasan).
     */
    public function karyawan(): HasMany
    {
        return $this->hasMany(User::class, 'atasan_id');
    }

    /**
     * Kompetensi yang di-assign ke user ini beserta required_level & actual_level (pivot).
     */
    public function kompetensis(): BelongsToMany
    {
        return $this->belongsToMany(Kompetensi::class, 'kompetensi_user')
            ->withPivot(['actual_level', 'evaluated_by', 'evaluated_at'])
            ->withTimestamps();
    }

    /**
     * Training yang pernah diikuti user ini.
     */
    public function trainings(): BelongsToMany
    {
        return $this->belongsToMany(Training::class, 'training_user')
            ->withPivot('tanggal_selesai')
            ->withTimestamps();
    }

    /**
     * Log riwayat evaluasi kompetensi user ini dari waktu ke waktu.
     */
    public function evaluasiHistories(): HasMany
    {
        return $this->hasMany(EvaluasiHistory::class);
    }
}
