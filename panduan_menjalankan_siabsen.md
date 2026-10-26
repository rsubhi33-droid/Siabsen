# 🚀 Panduan Menjalankan SIABSEN

## Prasyarat yang Dibutuhkan

| Software | Versi | Keterangan |
|---|---|---|
| **Node.js** | 18+ | Runtime JavaScript ([download](https://nodejs.org)) |
| **MySQL** | 5.7+ atau MariaDB 10+ | Database server |
| **XAMPP** *(opsional)* | Terbaru | Cara termudah mendapat MySQL + phpMyAdmin di Windows |
| **Git** *(opsional)* | Terbaru | Untuk clone project |

> [!NOTE]
> Jika kamu sudah punya **XAMPP** terinstall, kamu sudah punya MySQL. Tinggal pastikan MySQL service-nya **running**.

---

## Langkah-langkah Menjalankan

### Step 1: Pastikan MySQL Berjalan

Jika menggunakan **XAMPP**, buka XAMPP Control Panel dan klik **Start** pada modul **MySQL**.

Jika MySQL standalone, pastikan service MySQL sedang aktif.

### Step 2: Buat Database

Buka **phpMyAdmin** (`http://localhost/phpmyadmin`) atau MySQL CLI, lalu buat database:

```sql
CREATE DATABASE siabsen;
```

### Step 3: Konfigurasi Backend (.env)

File `.env` sudah ada di `backend/.env`. Pastikan pengaturan database sesuai:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=siabsen
DB_USER=root        ← sesuaikan username MySQL kamu
DB_PASS=            ← sesuaikan password MySQL kamu (kosong jika XAMPP default)
```

### Step 4: Jalankan Migration & Seeder

Buka **terminal pertama**, masuk ke folder backend:

```bash
cd d:\siabsen\backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

> [!IMPORTANT]
> Migration membuat semua tabel. Seeder mengisi data demo (akun, kegiatan, sesi).
> Jika terjadi error, pastikan database `siabsen` sudah dibuat dan MySQL berjalan.

### Step 5: Jalankan Backend Server

Di terminal yang sama:

```bash
npm run dev
```

Output yang diharapkan:
```
🚀 Server berjalan di http://localhost:8000
✅ Koneksi database berhasil!
```

### Step 6: Jalankan Frontend

Buka **terminal kedua** (jangan tutup terminal backend):

```bash
cd d:\siabsen\frontend
npm run dev
```

Output yang diharapkan:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Step 7: Buka Aplikasi 🎉

Buka browser dan akses: **http://localhost:5173**

---

## Akun Demo

Semua akun menggunakan password: **`password123`**

| Role | Email | Halaman yang Bisa Diakses |
|---|---|---|
| 🔴 **Admin** | `admin@fakultas.ac.id` | Dashboard, Kelola Kegiatan, Users, Master Data, Laporan |
| 🟠 **Panitia** | `rina@fakultas.ac.id` | Kegiatan Saya, Buat Sesi, Monitoring Live, Generate QR |
| 🔵 **Mahasiswa** | `ahmad@mahasiswa.ac.id` | Daftar Kegiatan, Scan QR, Riwayat Kehadiran |
| 🟢 **Dosen** | `budi.dosen@fakultas.ac.id` | Laporan Kehadiran, Evaluasi & Statistik |

---

## Alur Penggunaan

```
1. Login sebagai PANITIA
   ↓
2. Buat/pilih kegiatan → Buat sesi → Generate QR Code
   ↓
3. Login sebagai MAHASISWA (di browser/device lain)
   ↓
4. Scan QR → ✅ Check-in berhasil!
   ↓
5. Login sebagai DOSEN → Lihat laporan & evaluasi
   ↓
6. Login sebagai ADMIN → Kelola semua data
```

---

## Ringkasan Terminal yang Dibutuhkan

| Terminal | Perintah | Port |
|---|---|---|
| Terminal 1 | `cd d:\siabsen\backend && npm run dev` | `http://localhost:8000` |
| Terminal 2 | `cd d:\siabsen\frontend && npm run dev` | `http://localhost:5173` |

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Cek `DB_USER` dan `DB_PASS` di `backend/.env` |
| `ER_BAD_DB_ERROR` | Database `siabsen` belum dibuat, jalankan `CREATE DATABASE siabsen;` |
| `ECONNREFUSED` | MySQL tidak berjalan, start XAMPP MySQL |
| Migration error | Pastikan database kosong, lalu jalankan ulang `npx sequelize-cli db:migrate` |
| Port 8000 sudah dipakai | Ubah `PORT=8001` di `backend/.env` |
| Halaman blank | Pastikan backend running di port 8000 (Vite proxy ke sana) |
