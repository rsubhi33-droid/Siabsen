const { z } = require('zod');

const createKegiatanSchema = z.object({
  nama: z.string().min(3, 'Nama kegiatan minimal 3 karakter').max(200),
  deskripsi: z.string().max(2000).optional(),
  kategori_id: z.number().int().positive().optional(),
  tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  tanggal_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  lokasi: z.string().max(200).optional(),
  kuota: z.number().int().positive().optional(),
  status: z.enum(['draft', 'aktif', 'selesai', 'batal']).optional(),
});

const updateKegiatanSchema = createKegiatanSchema.partial();

const createSesiSchema = z.object({
  nama_sesi: z.string().min(3, 'Nama sesi minimal 3 karakter').max(150),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format jam: HH:mm'),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format jam: HH:mm'),
});

module.exports = { createKegiatanSchema, updateKegiatanSchema, createSesiSchema };
