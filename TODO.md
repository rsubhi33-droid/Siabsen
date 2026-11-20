# TODO: Rencana Pengembangan Fitur Masa Depan

Dokumen ini mencatat usulan fitur proposal yang belum diimplementasikan pada rilis saat ini agar dapat dikembangkan pada siklus rilis berikutnya:

## 1. Notifikasi Real-time
- **Deskripsi**: Pengiriman notifikasi kehadiran dan pembukaan sesi presensi ke mahasiswa via WebSocket (Socket.IO) atau Web Push Notifications.
- **Rencana Implementasi**:
  - Setup Socket.IO server di backend terintegrasi dengan middleware autentikasi JWT.
  - Client subscription untuk event `sesi:opened`, `sesi:closed`, dan konfirmasi `checkin:success`.
  - Integrasi Firebase Cloud Messaging (FCM) untuk push notification background.

## 2. Offline Mode Presensi
- **Deskripsi**: Kemampuan perangkat mahasiswa untuk memindai kode QR atau panitia melakukan pencatatan saat koneksi internet tidak stabil / terputus sementara.
- **Rencana Implementasi**:
  - Penyimpanan payload absensi di IndexedDB via Service Worker (PWA).
  - Background Sync API untuk otomatis menyinkronkan data absensi yang tertunda begitu koneksi internet pulih.
  - Verifikasi token terenkripsi secara lokal dan validasi ulang di server dengan pencegahan replay attack / duplicate scan index.
