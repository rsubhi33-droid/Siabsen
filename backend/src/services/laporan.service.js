const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../models');
const ApiError = require('../utils/ApiError');

const STORAGE_DIR = path.resolve(__dirname, '../../storage/laporan');

// Pastikan direktori storage ada
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Generate laporan kehadiran dalam format Excel.
 */
const generateExcel = async (kegiatanId, generatedBy) => {
  const kegiatan = await db.Kegiatan.findByPk(kegiatanId, {
    include: [
      {
        model: db.SesiKegiatan,
        as: 'sesi',
        include: [
          {
            model: db.Absensi,
            as: 'absensi',
            include: [
              { model: db.User, as: 'user', attributes: ['nama', 'nim', 'prodi', 'angkatan'] },
            ],
          },
        ],
      },
    ],
  });

  if (!kegiatan) {
    throw ApiError.notFound('Kegiatan tidak ditemukan.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIABSEN';
  workbook.created = new Date();

  // Sheet per sesi
  for (const sesi of kegiatan.sesi) {
    const sheet = workbook.addWorksheet(sesi.nama_sesi.slice(0, 31));

    // Header info
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = `Laporan Kehadiran: ${kegiatan.nama}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value = `Sesi: ${sesi.nama_sesi} | Tanggal: ${sesi.tanggal} | Jam: ${sesi.jam_mulai} - ${sesi.jam_selesai}`;

    // Column headers
    sheet.getRow(4).values = ['No', 'NIM', 'Nama', 'Prodi', 'Waktu Check-in', 'Status'];
    sheet.getRow(4).font = { bold: true };

    sheet.columns = [
      { key: 'no', width: 5 },
      { key: 'nim', width: 15 },
      { key: 'nama', width: 30 },
      { key: 'prodi', width: 25 },
      { key: 'waktu', width: 20 },
      { key: 'status', width: 12 },
    ];

    // Data rows
    sesi.absensi.forEach((abs, idx) => {
      sheet.addRow({
        no: idx + 1,
        nim: abs.user?.nim || '-',
        nama: abs.user?.nama || '-',
        prodi: abs.user?.prodi || '-',
        waktu: abs.waktu_checkin ? new Date(abs.waktu_checkin).toLocaleString('id-ID') : '-',
        status: abs.status,
      });
    });

    // Summary
    const totalRow = sheet.lastRow.number + 2;
    sheet.getCell(`A${totalRow}`).value = `Total Hadir: ${sesi.absensi.length}`;
    sheet.getCell(`A${totalRow}`).font = { bold: true };
  }

  const filename = `laporan_${kegiatan.nama.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.xlsx`;
  const filepath = path.join(STORAGE_DIR, filename);
  await workbook.xlsx.writeFile(filepath);

  // Simpan record laporan
  const laporan = await db.Laporan.create({
    kegiatan_id: kegiatanId,
    generated_by: generatedBy,
    tipe: 'excel',
    filename,
    filepath,
  });

  return laporan;
};

/**
 * Generate laporan kehadiran dalam format PDF.
 */
const generatePdf = async (kegiatanId, generatedBy) => {
  const kegiatan = await db.Kegiatan.findByPk(kegiatanId, {
    include: [
      {
        model: db.SesiKegiatan,
        as: 'sesi',
        include: [
          {
            model: db.Absensi,
            as: 'absensi',
            include: [
              { model: db.User, as: 'user', attributes: ['nama', 'nim', 'prodi', 'angkatan'] },
            ],
          },
        ],
      },
    ],
  });

  if (!kegiatan) {
    throw ApiError.notFound('Kegiatan tidak ditemukan.');
  }

  const filename = `laporan_${kegiatan.nama.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;
  const filepath = path.join(STORAGE_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN KEHADIRAN', { align: 'center' });
    doc.fontSize(14).text(kegiatan.nama, { align: 'center' });
    doc.moveDown();

    for (const sesi of kegiatan.sesi) {
      doc.fontSize(12).font('Helvetica-Bold').text(`Sesi: ${sesi.nama_sesi}`);
      doc.fontSize(10).font('Helvetica').text(`Tanggal: ${sesi.tanggal} | Jam: ${sesi.jam_mulai} - ${sesi.jam_selesai}`);
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const col = { no: 50, nim: 80, nama: 160, prodi: 320, status: 440 };
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('No', col.no, tableTop);
      doc.text('NIM', col.nim, tableTop);
      doc.text('Nama', col.nama, tableTop);
      doc.text('Prodi', col.prodi, tableTop);
      doc.text('Status', col.status, tableTop);

      doc.moveTo(50, tableTop + 14).lineTo(550, tableTop + 14).stroke();

      let y = tableTop + 20;
      doc.font('Helvetica').fontSize(9);
      sesi.absensi.forEach((abs, idx) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(`${idx + 1}`, col.no, y);
        doc.text(abs.user?.nim || '-', col.nim, y);
        doc.text(abs.user?.nama || '-', col.nama, y, { width: 150 });
        doc.text(abs.user?.prodi || '-', col.prodi, y, { width: 110 });
        doc.text(abs.status, col.status, y);
        y += 16;
      });

      doc.y = y + 10;
      doc.font('Helvetica-Bold').fontSize(10).text(`Total Hadir: ${sesi.absensi.length}`);
      doc.moveDown();
    }

    doc.end();
    stream.on('finish', async () => {
      try {
        const laporan = await db.Laporan.create({
          kegiatan_id: kegiatanId,
          generated_by: generatedBy,
          tipe: 'pdf',
          filename,
          filepath,
        });
        resolve(laporan);
      } catch (err) {
        reject(err);
      }
    });
    stream.on('error', reject);
  });
};

module.exports = { generateExcel, generatePdf };
