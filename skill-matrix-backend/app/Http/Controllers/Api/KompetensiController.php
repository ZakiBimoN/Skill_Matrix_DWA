<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\Kompetensi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KompetensiController extends Controller
{
    public function index(Request $request)
    {
        $query = Kompetensi::with('departements:id,nama_departement');

        if ($request->filled('search')) {
            $query->where('nama_kompetensi', 'like', '%' . $request->string('search') . '%');
        }

        if ($request->filled('kategori') && $request->kategori !== 'semua') {
            $query->where('kategori', $request->string('kategori'));
        }

        if ($request->filled('departemen') && $request->departemen !== 'semua') {
            $query->whereHas('departements', function ($q) use ($request) {
                $q->where('nama_departement', $request->string('departemen'));
            });
        }

        $perPage = (int) $request->input('per_page', 6);
        $paginated = $query->orderBy('nama_kompetensi')->paginate($perPage);

        $paginated->getCollection()->transform(function ($k) {
            $k->departemen_label = $k->departements->isEmpty()
                ? '-'
                : $k->departements->pluck('nama_departement')->join(', ');
            return $k;
        });

        return response()->json($paginated);
    }

    /**
     * Validasi & tentukan daftar departement_id final berdasarkan kategori.
     * Wajib SELALU otomatis semua departemen — departement_ids dari
     * frontend diabaikan untuk kategori ini, apa pun isinya (termasuk
     * array kosong), supaya tidak nyangkut divalidasi "minimal 1".
     */
    private function tentukanDepartementIds(string $kategori, array $departementIdsInput): \Illuminate\Support\Collection
    {
        if ($kategori === 'wajib') {
            return Departement::pluck('id');
        }

        if (empty($departementIdsInput)) {
            throw ValidationException::withMessages([
                'departement_ids' => ['Pilih minimal 1 departemen untuk kategori Umum/Khusus.'],
            ]);
        }

        return collect($departementIdsInput);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kompetensi' => ['required', 'string', 'max:255'],
            'kategori' => ['required', 'in:wajib,umum,khusus'],
            'sub_kelompok' => ['nullable', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'required_level' => ['required', 'integer', 'min:1', 'max:4'],
            // TIDAK ada "min:1" di sini lagi — validasi jumlah minimal
            // ditangani manual di tentukanDepartementIds(), cuma untuk
            // kategori Umum/Khusus. Wajib boleh kirim array kosong.
            'departement_ids' => ['array'],
            'departement_ids.*' => ['exists:departements,id'],
        ]);

        $departementIds = $this->tentukanDepartementIds(
            $validated['kategori'],
            $validated['departement_ids'] ?? []
        );

        $kompetensi = Kompetensi::create([
            'nama_kompetensi' => $validated['nama_kompetensi'],
            'kategori' => $validated['kategori'],
            'sub_kelompok' => $validated['sub_kelompok'] ?? null,
            'deskripsi' => $validated['deskripsi'] ?? null,
            'required_level' => $validated['required_level'],
        ]);

        $kompetensi->departements()->sync($departementIds);
        $kompetensi->load('departements:id,nama_departement');

        $karyawanIds = User::where('role', 'karyawan')
            ->whereIn('departement_id', $departementIds)
            ->pluck('id');

        $now = now();
        $pivotRows = $karyawanIds->map(fn ($userId) => [
            'user_id' => $userId,
            'kompetensi_id' => $kompetensi->id,
            'actual_level' => 0,
            'evaluated_by' => null,
            'evaluated_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        if (! empty($pivotRows)) {
            DB::table('kompetensi_user')->insert($pivotRows);
        }

        return response()->json(['data' => $kompetensi], 201);
    }

    public function show(Kompetensi $kompetensi)
    {
        $kompetensi->load('departements:id,nama_departement');
        return response()->json(['data' => $kompetensi]);
    }

    public function update(Request $request, Kompetensi $kompetensi)
    {
        $validated = $request->validate([
            'nama_kompetensi' => ['sometimes', 'required', 'string', 'max:255'],
            'kategori' => ['sometimes', 'required', 'in:wajib,umum,khusus'],
            'sub_kelompok' => ['nullable', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            'required_level' => ['sometimes', 'required', 'integer', 'min:1', 'max:4'],
            'departement_ids' => ['array'],
            'departement_ids.*' => ['exists:departements,id'],
        ]);

        $kompetensi->update(collect($validated)->except('departement_ids')->toArray());

        $kategoriBaru = $validated['kategori'] ?? $kompetensi->kategori;

        if ($kategoriBaru === 'wajib') {
            $kompetensi->departements()->sync(Departement::pluck('id'));
        } elseif (array_key_exists('departement_ids', $validated)) {
            $departementIds = $this->tentukanDepartementIds($kategoriBaru, $validated['departement_ids']);
            $kompetensi->departements()->sync($departementIds);

            $karyawanIds = User::where('role', 'karyawan')
                ->whereIn('departement_id', $departementIds)
                ->pluck('id');

            $existingUserIds = DB::table('kompetensi_user')
                ->where('kompetensi_id', $kompetensi->id)
                ->pluck('user_id');

            $userIdsBaru = $karyawanIds->diff($existingUserIds);
            $now = now();

            $pivotRows = $userIdsBaru->map(fn ($userId) => [
                'user_id' => $userId,
                'kompetensi_id' => $kompetensi->id,
                'actual_level' => 0,
                'evaluated_by' => null,
                'evaluated_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->toArray();

            if (! empty($pivotRows)) {
                DB::table('kompetensi_user')->insert($pivotRows);
            }
        }

        $kompetensi->load('departements:id,nama_departement');
        return response()->json(['data' => $kompetensi]);
    }

    public function destroy(Kompetensi $kompetensi)
    {
        $kompetensi->delete();
        return response()->json(['message' => 'Kompetensi berhasil dihapus.']);
    }

    public function struktur()
    {
        $semua = Kompetensi::orderBy('id')->get([
            'id', 'nama_kompetensi', 'kategori', 'sub_kelompok', 'required_level',
        ]);

        $struktur = $semua
            ->groupBy('kategori')
            ->map(function ($items, $kategori) {
                $subKelompok = $items
                    ->groupBy(fn ($i) => $i->sub_kelompok ?? '__root__')
                    ->map(function ($subItems, $namaSub) {
                        return [
                            'nama' => $namaSub === '__root__' ? null : $namaSub,
                            'items' => $subItems->map(fn ($i) => [
                                'id' => $i->id,
                                'nama_kompetensi' => $i->nama_kompetensi,
                                'required_level' => $i->required_level,
                            ])->values(),
                        ];
                    })
                    ->values();

                return ['kategori' => $kategori, 'sub_kelompok' => $subKelompok];
            })
            ->values();

        return response()->json(['data' => $struktur]);
    }
}
