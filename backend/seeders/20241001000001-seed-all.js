'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash('password123', 12);

    // ─── Users ────────────────────────────────────────────────────
    await queryInterface.bulkInsert('users', [
      {
        nama: 'Admin Fakultas',
        email: 'admin@fakultas.ac.id',
        password: hashedPassword,
        nim: null,
        prodi: null,
        angkatan: null,
        no_hp: '081234567890',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Dr. Budi Santoso',
        email: 'budi.dosen@fakultas.ac.id',
        password: hashedPassword,
        nim: null,
        prodi: 'Teknik Informatika',
        angkatan: null,
        no_hp: '081234567891',
        role: 'dosen',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Rina Panitia',
        email: 'rina@fakultas.ac.id',
        password: hashedPassword,
        nim: null,
        prodi: null,
        angkatan: null,
        no_hp: '081234567892',
        role: 'panitia',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Ahmad Fauzi',
        email: 'ahmad@mahasiswa.ac.id',
        password: hashedPassword,
        nim: '2024001001',
        prodi: 'Teknik Informatika',
        angkatan: 2024,
        no_hp: '081234567893',
        role: 'mahasiswa',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Siti Nurhaliza',
        email: 'siti@mahasiswa.ac.id',
        password: hashedPassword,
        nim: '2024001002',
        prodi: 'Sistem Informasi',
        angkatan: 2024,
        no_hp: '081234567894',
        role: 'mahasiswa',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Dimas Prasetyo',
        email: 'dimas@mahasiswa.ac.id',
        password: hashedPassword,
        nim: '2023001001',
        prodi: 'Teknik Informatika',
        angkatan: 2023,
        no_hp: '081234567895',
        role: 'mahasiswa',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // ─── Master Data ──────────────────────────────────────────────
    await queryInterface.bulkInsert('master_data', [
      { tipe: 'kategori_kegiatan', nama: 'Seminar', kode: 'SMR', deskripsi: 'Seminar akademik dan umum', is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'kategori_kegiatan', nama: 'Workshop', kode: 'WKS', deskripsi: 'Workshop praktis dan hands-on', is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'kategori_kegiatan', nama: 'Kuliah Tamu', kode: 'KLT', deskripsi: 'Kuliah tamu dari praktisi/akademisi', is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'kategori_kegiatan', nama: 'Lomba', kode: 'LMB', deskripsi: 'Kompetisi dan perlombaan', is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'prodi', nama: 'Teknik Informatika', kode: 'TI', deskripsi: null, is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'prodi', nama: 'Sistem Informasi', kode: 'SI', deskripsi: null, is_active: true, created_at: new Date(), updated_at: new Date() },
      { tipe: 'prodi', nama: 'Teknik Komputer', kode: 'TK', deskripsi: null, is_active: true, created_at: new Date(), updated_at: new Date() },
    ]);

    // ─── Kegiatan ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('kegiatan', [
      {
        nama: 'Seminar Nasional AI & Machine Learning 2026',
        deskripsi: 'Seminar membahas perkembangan terkini AI dan penerapannya di industri.',
        kategori_id: 1,
        tanggal_mulai: '2026-11-15',
        tanggal_selesai: '2026-11-15',
        lokasi: 'Auditorium Utama Fakultas',
        kuota: 200,
        status: 'aktif',
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nama: 'Workshop Web Development with React',
        deskripsi: 'Workshop 2 hari membangun aplikasi web modern dengan React.js.',
        kategori_id: 2,
        tanggal_mulai: '2026-11-20',
        tanggal_selesai: '2026-11-21',
        lokasi: 'Lab Komputer Lantai 3',
        kuota: 50,
        status: 'aktif',
        created_by: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // ─── Sesi Kegiatan ───────────────────────────────────────────
    await queryInterface.bulkInsert('sesi_kegiatan', [
      {
        kegiatan_id: 1,
        nama_sesi: 'Sesi Pembukaan & Keynote Speaker',
        tanggal: '2026-11-15',
        jam_mulai: '08:00:00',
        jam_selesai: '10:00:00',
        qr_token: null,
        qr_generated_at: null,
        is_open: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        kegiatan_id: 1,
        nama_sesi: 'Sesi Panel Diskusi',
        tanggal: '2026-11-15',
        jam_mulai: '10:30:00',
        jam_selesai: '12:00:00',
        qr_token: null,
        qr_generated_at: null,
        is_open: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        kegiatan_id: 2,
        nama_sesi: 'Workshop Hari 1 - Fundamentals',
        tanggal: '2026-11-20',
        jam_mulai: '09:00:00',
        jam_selesai: '16:00:00',
        qr_token: null,
        qr_generated_at: null,
        is_open: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        kegiatan_id: 2,
        nama_sesi: 'Workshop Hari 2 - Advanced Project',
        tanggal: '2026-11-21',
        jam_mulai: '09:00:00',
        jam_selesai: '16:00:00',
        qr_token: null,
        qr_generated_at: null,
        is_open: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('absensi', null, {});
    await queryInterface.bulkDelete('sesi_kegiatan', null, {});
    await queryInterface.bulkDelete('kegiatan', null, {});
    await queryInterface.bulkDelete('master_data', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
