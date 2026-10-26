# SIABSEN - Sistem Absensi Kegiatan Fakultas

Platform absensi digital berbasis QR Code untuk pencatatan kehadiran mahasiswa pada kegiatan seminar, workshop, dan acara resmi fakultas.

## Tech Stack

| Komponen | Teknologi |
|---|---|
| **Frontend** | React 18 + Vite 5, React Router, Axios, Lucide Icons, html5-qrcode, qrcode.react |
| **Backend** | Node.js + Express 4, Sequelize ORM, JWT Auth, Zod Validation |
| **Database** | MySQL |
| **Export** | ExcelJS (.xlsx), PDFKit (.pdf) |
| **QR** | qrcode (server), html5-qrcode (client scanner), qrcode.react (display) |

## Fitur

- ✅ **Multi-role**: Admin, Panitia, Mahasiswa, Dosen
- ✅ **QR Code Check-in**: Generate QR unik per sesi, scan via kamera HP
- ✅ **Absensi Manual**: Input kehadiran manual oleh panitia (backup jika tidak ada HP)
- ✅ **Monitoring Live**: Pantau kehadiran real-time saat acara berlangsung (auto-refresh 5 detik)
- ✅ **Dashboard & Statistik**: Stat card, bar chart kehadiran per kegiatan, donut chart per prodi
- ✅ **Laporan**: Generate & download laporan kehadiran format Excel/PDF
- ✅ **Riwayat Kehadiran**: Timeline kehadiran mahasiswa
- ✅ **Master Data**: Kelola kategori kegiatan, prodi, fakultas
- ✅ **Hak Akses**: Manajemen pengguna & role-based access
- ✅ **Dark Mode UI**: Premium glassmorphism design, responsive

## Setup

### Prerequisites
- Node.js 18+
- MySQL 5.7+ / MariaDB 10+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # Edit konfigurasi DB sesuai environment Anda
```

Buat database MySQL:
```sql
CREATE DATABASE siabsen;
```

Jalankan migration & seed:
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

Start server:
```bash
npm run dev    # http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Vite sudah dikonfigurasi proxy `/api` → `localhost:8000`, jadi tidak perlu `.env` untuk development.

## Akun Demo

Semua akun menggunakan password: `password123`

| Role | Email | Akses |
|---|---|---|
| **Admin** | admin@fakultas.ac.id | Dashboard, Kelola Kegiatan, Users, Master Data, Laporan |
| **Panitia** | rina@fakultas.ac.id | Kegiatan Saya, Buat Sesi, Generate QR, Monitoring Live |
| **Mahasiswa** | ahmad@mahasiswa.ac.id | Daftar Kegiatan, Scan QR, Riwayat Kehadiran |
| **Dosen** | budi.dosen@fakultas.ac.id | Laporan Kehadiran, Evaluasi & Statistik |

## Struktur Proyek

```
siabsen/
├── backend/
│   ├── src/
│   │   ├── config/          # Konfigurasi database & environment
│   │   ├── controllers/     # Handler request HTTP
│   │   ├── middlewares/      # Auth, role check, validation, rate limit
│   │   ├── models/           # Sequelize model definitions
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Business logic (absensi, QR, laporan)
│   │   ├── utils/            # ApiError, response formatter
│   │   └── validators/       # Zod validation schemas
│   ├── migrations/           # Database migrations
│   ├── seeders/              # Demo data seeder
│   └── storage/              # Generated reports (Excel/PDF)
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios API client modules
│   │   ├── components/       # Reusable components (QR, charts, layout)
│   │   ├── context/          # Auth context provider
│   │   ├── pages/            # Page components per role
│   │   │   ├── admin/        # Dashboard, kegiatan, users, master data, laporan
│   │   │   ├── panitia/      # Kegiatan saya, buat sesi, monitoring live
│   │   │   ├── mahasiswa/    # Daftar kegiatan, scan QR, riwayat
│   │   │   └── dosen/        # Laporan, evaluasi statistik
│   │   ├── routes/           # React Router configuration
│   │   └── index.css         # Design system (dark glassmorphism)
│   └── index.html
└── docs/
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | /api/auth/register | Registrasi user baru |
| POST | /api/auth/login | Login, dapatkan JWT token |
| GET | /api/auth/me | Profil user yang login |
| GET | /api/kegiatan | List kegiatan (paginated, searchable) |
| POST | /api/kegiatan | Buat kegiatan baru (admin/panitia) |
| GET | /api/kegiatan/:id | Detail kegiatan + sesi |
| POST | /api/kegiatan/:id/sesi | Buat sesi kegiatan |
| POST | /api/sesi/:id/generate-qr | Generate QR token untuk sesi |
| PUT | /api/sesi/:id/toggle | Buka/tutup sesi absensi |
| POST | /api/absensi/scan | Check-in via QR scan |
| POST | /api/absensi/manual | Check-in manual (panitia) |
| GET | /api/absensi/sesi/:id | Daftar hadir per sesi |
| GET | /api/absensi/riwayat | Riwayat kehadiran user |
| POST | /api/laporan/generate | Generate laporan Excel/PDF |
| GET | /api/laporan/download/:id | Download file laporan |
| GET | /api/dashboard/stats | Statistik dashboard |
| GET | /api/users | Kelola users (admin) |
| GET | /api/master-data | Data referensi (kategori, prodi) |
