<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;

class DepartementController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Departement::orderBy('nama_departement')->get(['id', 'nama_departement', 'kode_departement']),
        ]);
    }
}
