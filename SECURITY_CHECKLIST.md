# 🛡️ SECURITY CHECKLIST & DEPLOYMENT GUIDE (SiAbsen)

Dokumen ini disusun sebagai panduan keamanan operasional dan daftar verifikasi kepatuhan setelah penyelesaian audit dan perbaikan celah keamanan pada aplikasi SiAbsen.

---

## 1. Rotasi Secret Wajib (Sebelum Deploy ke Production)

File `.env` di lingkungan development menggunakan nilai placeholder. Sebelum melakukan deployment ke server staging/production, **WAJIB** melakukan rotasi dan men-generate secret baru dengan entropi tinggi:

| Nama Variabel | Keterangan & Rekomendasi Panjang | Contoh Perintah Generator |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret penandatangan token autentikasi (minimal 64 karakter acak). **Aplikasi tidak akan start jika nilai ini kosong.** | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `QR_SECRET` | Secret HMAC penandatangan token QR sesi presensi (minimal 32 karakter). | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PASS` | Password user database production. Hindari memakai user `root`. | Gunakan kata sandi acak yang kuat |
| `DB_USER` | Gunakan database user terisolasi dengan privilege seminimal mungkin (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). | - |

---

## 2. Panduan Deployment Aman

### A. Reverse Proxy & Trust Proxy
- Backend telah dilengkapi konfigurasi `TRUST_PROXY`:
  ```env
  TRUST_PROXY=1 # Jika berada di belakang 1 hop reverse proxy (mis. NGINX)
  ```
- **NGINX Reverse Proxy Configuration (Contoh Header Wajib)**:
  ```nginx
  location /api/ {
      proxy_pass http://127.0.0.1:8000/api/;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

### B. HTTPS & TLS Enactment
- Wajib menggunakan HTTPS (mis. Let's Encrypt / Cloudflare SSL) di production.
- Token JWT disimpan di `localStorage` klien; transmisi plaintext (HTTP) berisiko sniffing pada jaringan publik/WiFi.

### C. CORS Restriction
- Jangan pernah menggunakan wildcard `*` di environment production.
- Atur domain frontend secara eksplisit:
  ```env
  CORS_ORIGIN=https://siabsen.fakultas.ac.id
  ```

### D. File Storage & Static Files
- Direktori laporan (`storage/laporan`) **tidak lagi disajikan secara publik via Express static**.
- Seluruh file diunduh secara terkontrol via endpoint `GET /api/laporan/download/:id` yang memvalidasi otentikasi JWT, role check, validasi path traversal (`starts_with`), dan cek kepemilikan dokumen.

---

## 3. Hasil Akhir Tabel Proteksi Route Backend

Tabel ini merangkum seluruh mapping endpoint, middleware proteksi, dan kontrol hak akses di backend SiAbsen:

| Method | Endpoint | Middleware Proteksi | Role yang Diizinkan | Keterangan & Aturan Otorisasi |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | `authLimiter`, `validate` | Publik | Field `role` dihapus dari validator. Dipaksa `role: 'mahasiswa'` dan `is_active: true`. Whitelist field eksplisit. |
| **POST** | `/api/auth/login` | `authLimiter`, `validate` | Publik | Validasi email & hash password bcrypt. |
| **GET** | `/api/auth/me` | `authenticate` | Semua role | Mengambil data profil user yang sedang login. |
| **PUT** | `/api/auth/profile` | `authenticate`, `validate` | Semua role | Hanya field `nama`, `no_hp`, `prodi` yang boleh diubah. Kebal mass-assignment role/is_active. |
| **GET** | `/api/kegiatan` | `authenticate` | Semua role | Daftar kegiatan. Mendukung `saya=true` (Panitia: yang dibuat; Mahasiswa: yang dihadiri). |
| **GET** | `/api/kegiatan/:id` | `authenticate` | Semua role | `qr_token` disensor otomatis kecuali untuk admin atau panitia pemilik kegiatan. |
| **POST** | `/api/kegiatan` | `authenticate`, `checkRole` | `admin`, `panitia` | Pembuatan kegiatan. Divalidasi `tanggal_selesai >= tanggal_mulai`. |
| **PUT** | `/api/kegiatan/:id` | `authenticate`, `checkRole` | `admin`, `panitia` | Update kegiatan. Divalidasi rentang tanggal. |
| **DELETE** | `/api/kegiatan/:id` | `authenticate`, `checkRole` | `admin` | Hapus kegiatan. |
| **GET** | `/api/kegiatan/:kegiatanId/sesi` | `authenticate` | Semua role | `qr_token` disensor kecuali pemilik kegiatan atau admin. |
| **POST** | `/api/kegiatan/:kegiatanId/sesi` | `authenticate`, `checkRole` | `admin`, `panitia` | Pembuatan jadwal sesi kegiatan. |
| **POST** | `/api/sesi/:id/generate-qr` | `authenticate`, `checkRole` | `admin`, `panitia` | Pembuatan token QR baru yang aktif dan rotasi token lama. |
| **PUT** | `/api/sesi/:id/toggle` | `authenticate`, `checkRole` | `admin`, `panitia` | Buka / tutup sesi absensi. |
| **DELETE** | `/api/sesi/:id` | `authenticate`, `checkRole` | `admin`, `panitia` | Hapus sesi. |
| **POST** | `/api/absensi/scan` | `authenticate`, `scanLimiter` | Semua role (Mahasiswa) | Rate limit keyed per User ID. Validasi HMAC signature, TTL, token aktif di DB (tolak token lama), kuota kegiatan via DB transaction, dan indeks unik compound. |
| **POST** | `/api/absensi/manual` | `authenticate`, `checkRole` | `admin`, `panitia` | Input absensi manual oleh panitia. Mencatat audit `verified_by` dan `catatan`. |
| **GET** | `/api/absensi/sesi/:sesiId` | `authenticate`, `checkRole` | `admin`, `panitia`, `dosen` | Dicek kepemilikan: Panitia A dilarang mengakses sesi kegiatan milik panitia B. |
| **GET** | `/api/absensi/riwayat` | `authenticate` | Semua role | Riwayat presensi user login. |
| **POST** | `/api/laporan/generate` | `authenticate`, `checkRole` | `admin`, `panitia`, `dosen` | Generate file Excel/PDF kehadiran. Sanitasi nama file anti path traversal. |
| **GET** | `/api/laporan/download/:id` | `authenticate`, `checkRole` | `admin`, `panitia`, `dosen` | Unduh file via blob header Authorization. Dicek kepemilikan dan validasi path fisik file. |
| **GET** | `/api/laporan` | `authenticate`, `checkRole` | `admin`, `panitia`, `dosen` | Daftar riwayat laporan yang pernah digenerate. |
| **GET** | `/api/users/mahasiswa/search` | `authenticate`, `checkRole` | `admin`, `panitia` | Pencarian mahasiswa untuk absensi manual (field minimal). |
| **GET** | `/api/users` | `authenticate`, `checkRole` | `admin`, `panitia` | Data user (Panitia otomatis dibatasi hanya role mahasiswa). |
| **GET/POST/PUT**| `/api/users/:id` | `authenticate`, `checkRole` | `admin` | Manajemen lengkap user dan aktivasi akun. |
| **GET** | `/api/master-data` | `authenticate` | Semua role | Mengambil data prodi dan kategori. |
| **POST/PUT/DEL**| `/api/master-data/*` | `authenticate`, `checkRole` | `admin` | Manajemen master data. |
| **GET** | `/api/dashboard/*` | `authenticate`, `checkRole` | `admin`, `panitia`, `dosen` | Statistik dan grafik kehadiran. |
| **GET** | `/health` | Publik | Publik | Health check status server. |
