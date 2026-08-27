<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartementController;
use App\Http\Controllers\Api\KaryawanController;
use App\Http\Controllers\Api\KompetensiController;
use App\Http\Controllers\Api\MlClusterController;
use App\Http\Controllers\Api\ReportsController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Hanya Atasan yang boleh kelola akun karyawan di bawahnya
    Route::middleware('role:atasan')->group(function () {
        Route::get('/karyawan', [KaryawanController::class, 'index']);
        Route::post('/karyawan', [KaryawanController::class, 'store']);
        Route::get('/karyawan/{karyawan}', [KaryawanController::class, 'show']);
        Route::post('/karyawan/{karyawan}/evaluasi', [KaryawanController::class, 'evaluasi']);
        Route::get('/dashboard/atasan', [DashboardController::class, 'atasan']);
        Route::get('/dashboard/tren-kompetensi', [DashboardController::class, 'trenKompetensi']);

        Route::get('/departemen', [DepartementController::class, 'index']);

        Route::get('/kompetensi-struktur', [KompetensiController::class, 'struktur']);
        Route::apiResource('kompetensi', KompetensiController::class);

        Route::get('/reports/skill-gap-departemen', [ReportsController::class, 'skillGapPerDepartemen']);
        Route::get('/reports/detail-kompetensi-gap', [ReportsController::class, 'detailKompetensiGap']);
        Route::get('/reports/clusters', [MlClusterController::class, 'index']);
    });

    // Placeholder untuk modul selanjutnya (Evaluasi, Reports, dst)
    // Route::middleware('role:atasan,karyawan')->group(function () { ... });
});
