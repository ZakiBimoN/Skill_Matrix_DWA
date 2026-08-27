# Panduan Instalasi dari Nol — Sistem Skill Matrix
PT. Dasa Windu Agung — Laravel API + Next.js 15

Prasyarat yang harus sudah terinstall di komputer Anda:
- PHP >= 8.2 & Composer
- Node.js >= 18 & npm
- MySQL (via XAMPP, atau MySQL server biasa)

---

## BAGIAN A — BACKEND (Laravel API)

### A1. Buat project Laravel baru
```bash
composer create-project laravel/laravel skill-matrix-backend
cd skill-matrix-backend
```

### A2. Install Sanctum
```bash
composer require laravel/sanctum
```
(Laravel 11+ sudah include konfigurasi dasar Sanctum, tidak perlu `vendor:publish` kecuali mau custom migration Sanctum sendiri — untuk kasus kita, cukup seperti ini.)

### A3. Buat database MySQL
Buka phpMyAdmin (XAMPP) atau terminal MySQL, buat database baru:
```sql
CREATE DATABASE skill_matrix;
```

### A4. Setting `.env`
Edit file `.env` di root project Laravel:
```env
APP_NAME="Skill Matrix"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=skill_matrix
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
FRONTEND_URL=http://localhost:3000
```

### A5. Masukkan file-file kode yang sudah dibuat
Dari folder `skill-matrix/backend` (hasil zip sebelumnya), copy ke project Laravel baru Anda — **timpa file yang sudah ada**:

| File dari zip | Tujuan di project Laravel |
|---|---|
| `database/migrations/*.php` | `database/migrations/` |
| `app/Models/User.php` | `app/Models/User.php` (timpa default) |
| `app/Models/Divisi.php` | `app/Models/Divisi.php` (baru) |
| `app/Models/Kompetensi.php` | `app/Models/Kompetensi.php` (baru) |
| `app/Http/Controllers/Api/AuthController.php` | buat folder `Api` dulu di `app/Http/Controllers/`, lalu taruh di sana |
| `app/Http/Controllers/Api/KaryawanController.php` | sama seperti di atas |
| `app/Http/Controllers/Api/DashboardController.php` | sama seperti di atas |
| `app/Http/Middleware/CheckRole.php` | `app/Http/Middleware/CheckRole.php` (baru) |
| `routes/api.php` | `routes/api.php` (timpa default) |
| `bootstrap/app.php` | `bootstrap/app.php` (timpa default) |

### A6. Setting CORS
Edit `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

### A7. Jalankan migration
```bash
php artisan migrate
```
Kalau berhasil, akan muncul tabel: `users`, `divisis`, `kompetensis`, `kompetensi_user`, `personal_access_tokens`, dll.

### A8. Buat akun Atasan pertama + data dummy (via Tinker)
```bash
php artisan tinker
```
Lalu jalankan satu-satu di dalam tinker:
```php
$divisi = \App\Models\Divisi::create(['nama_divisi' => 'IT', 'kode_divisi' => 'IT']);

$atasan = \App\Models\User::create([
    'name' => 'Budi Atasan',
    'email' => 'atasan@dasawindu.co.id',
    'password' => bcrypt('password123'),
    'role' => 'atasan',
    'divisi_id' => $divisi->id,
]);

$karyawan = \App\Models\User::create([
    'name' => 'Siti Karyawan',
    'email' => 'siti@dasawindu.co.id',
    'password' => bcrypt('password123'),
    'role' => 'karyawan',
    'jabatan' => 'Staff IT',
    'divisi_id' => $divisi->id,
    'atasan_id' => $atasan->id,
]);

$kompetensi = \App\Models\Kompetensi::create([
    'nama_kompetensi' => 'PHP Programming',
    'kategori' => 'wajib',
]);

$karyawan->kompetensis()->attach($kompetensi->id, [
    'required_level' => 3,
    'actual_level' => 2,
    'evaluated_by' => $atasan->id,
    'evaluated_at' => now(),
]);

exit
```

### A9. Jalankan server Laravel
```bash
php artisan serve
```
Backend jalan di `http://localhost:8000`.

---

## BAGIAN B — FRONTEND (Next.js 15)

### B1. Buat project Next.js baru
```bash
npx create-next-app@latest skill-matrix-frontend
```
Saat ditanya, pilih:
- TypeScript → **Yes**
- ESLint → Yes
- Tailwind CSS → **Yes**
- `src/` directory → **No** (biar path `app/`, `lib/`, `context/` cocok dengan kode yang sudah dibuat)
- App Router → **Yes**
- Import alias (`@/*`) → **Yes**, biarkan default

```bash
cd skill-matrix-frontend
```

### B2. Install axios
```bash
npm install axios
```

### B3. Masukkan file-file kode yang sudah dibuat
Dari folder `skill-matrix/frontend` hasil zip:

| File dari zip | Tujuan |
|---|---|
| `lib/api.ts` | buat folder `lib/`, taruh di sana |
| `context/AuthContext.tsx` | buat folder `context/`, taruh di sana |
| `middleware.ts` | taruh di root project (sejajar `package.json`) |
| `app/login/page.tsx` | buat folder `app/login/`, taruh di sana |
| `app/dashboard/atasan/page.tsx` | buat folder `app/dashboard/atasan/`, taruh di sana |
| `app/dashboard/karyawan/page.tsx` | buat folder `app/dashboard/karyawan/`, taruh di sana |

### B4. Setting `.env.local`
Buat file `.env.local` di root project Next.js:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### B5. Bungkus aplikasi dengan `AuthProvider`
Edit `app/layout.tsx` (file default dari `create-next-app`), tambahkan `AuthProvider`:
```tsx
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### B6. Jalankan
```bash
npm run dev
```
Frontend jalan di `http://localhost:3000`.

---

## BAGIAN C — TES ALUR LOGIN

1. Buka `http://localhost:3000/login`
2. Login pakai: `atasan@dasawindu.co.id` / `password123`
3. Harus redirect otomatis ke `/dashboard/atasan`
4. Harus muncul: 1 anak buah (Siti Karyawan), 1 kompetensi belum memenuhi (gap = 1, karena required 3 vs actual 2)
5. Klik baris "Siti Karyawan" → modal detail kompetensi muncul

Kalau ada error CORS di console browser, cek lagi `SANCTUM_STATEFUL_DOMAINS` di `.env` Laravel dan `allowed_origins` di `config/cors.php` — harus persis `localhost:3000` (tanpa `http://` untuk yang pertama).

---

## Troubleshooting umum

| Gejala | Kemungkinan penyebab |
|---|---|
| `419 CSRF token mismatch` saat login | Frontend belum panggil `/sanctum/csrf-cookie` dulu, atau `SESSION_DOMAIN` salah |
| Login sukses tapi `/api/me` return 401 | Cookie tidak terkirim — cek `withCredentials: true` di axios & CORS `supports_credentials` |
| `dashboard/atasan` redirect balik ke login terus | Cookie session Laravel default namanya bukan `laravel_session` kalau `APP_NAME` diubah — cek nama cookie asli di DevTools > Application > Cookies |
| Data anak buah kosong | Field `atasan_id` di tabel `users` untuk karyawan belum diisi |

---

Setelah alur ini jalan lancar di komputer Anda, kabari saya — kita lanjut ke fitur berikutnya (CRUD Kompetensi / Evaluasi Karyawan).
