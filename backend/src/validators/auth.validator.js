const { z } = require('zod');

const registerSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
  nim: z.string().min(5).max(20).optional(),
  prodi: z.string().max(100).optional(),
  angkatan: z.number().int().min(2000).max(2099).optional(),
  no_hp: z.string().max(20).optional(),
  role: z.enum(['mahasiswa', 'panitia', 'admin', 'dosen']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const updateProfileSchema = z.object({
  nama: z.string().min(2).max(100).optional(),
  no_hp: z.string().max(20).optional(),
  prodi: z.string().max(100).optional(),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
