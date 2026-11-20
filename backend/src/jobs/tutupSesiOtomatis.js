const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');

/**
 * Job otomatis untuk menutup sesi presensi (is_open = false)
 * yang telah melewati tanggal dan jam selesai (jam_selesai).
 * Berjalan otomatis setiap 5 menit.
 */
const initTutupSesiOtomatis = () => {
  // Jadwal: setiap 5 menit (*/5 * * * *)
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0]; // 'HH:mm:ss'

      // Cari sesi yang masih terbuka (is_open = true)
      // tetapi tanggalnya sudah lewat ATAU tanggalnya hari ini dan jam_selesai < jam sekarang
      const [updatedCount] = await db.SesiKegiatan.update(
        { is_open: false },
        {
          where: {
            is_open: true,
            [Op.or]: [
              { tanggal: { [Op.lt]: todayStr } },
              {
                tanggal: todayStr,
                jam_selesai: { [Op.lt]: timeStr },
              },
            ],
          },
        }
      );

      if (updatedCount > 0) {
        console.log(`⏰ [Cron] Otomatis menutup ${updatedCount} sesi kegiatan yang telah melewati batas waktu.`);
      }
    } catch (err) {
      console.error('❌ [Cron] Gagal menjalankan job tutup sesi otomatis:', err.message);
    }
  });

  console.log('🕒 [Cron] Job tutup sesi otomatis berhasil diinisialisasi (berjalan tiap 5 menit).');
};

module.exports = initTutupSesiOtomatis;

