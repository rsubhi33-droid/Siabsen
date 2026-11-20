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
 * Sanitasi nama kegiatan untuk nama file yang aman dari path traversal.
 */
const sanitizeFilename = (name) => {
  return (name || 'kegiatan')
    .toString()
    .replace(/[\\/:\*\?"<>\|]/g, '') // Karakter terlarang OS
    .replace(/\.\.+/g, '')           // Buang traversal '..'
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 50);
};

/**
 * Validasi path agar selalu berada di dalam direktori laporan (cegah path traversal).
 */
const validateReportPath = (targetPath) => {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(STORAGE_DIR + path.sep) && resolved !== STORAGE_DIR) {
    throw ApiError.forbidden('Akses path tidak diizinkan.');
  }
  return resolved;
};
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

  // Style helper borders
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };

  // 1. SHEET UTAMA: "Semua Sesi" (Semua sesi digabung berurutan dalam 1 lembar kerja seperti PDF)
  const masterSheet = workbook.addWorksheet('Semua Sesi', {
    views: [{ showGridLines: true }]
  });

  // Judul & Header Dokumen Master Sheet
  masterSheet.mergeCells('A1:F1');
  const mTitle = masterSheet.getCell('A1');
  mTitle.value = 'LAPORAN REKAPITULASI KEHADIRAN (SEMUA SESI)';
  mTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  mTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  masterSheet.getRow(1).height = 28;

  masterSheet.mergeCells('A2:F2');
  const mSub = masterSheet.getCell('A2');
  mSub.value = `${kegiatan.nama.toUpperCase()}`;
  mSub.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1F2937' } };
  mSub.alignment = { vertical: 'middle', horizontal: 'center' };
  masterSheet.getRow(2).height = 20;

  masterSheet.mergeCells('A3:F3');
  const mMeta = masterSheet.getCell('A3');
  mMeta.value = `Lokasi: ${kegiatan.lokasi || '-'}   |   Waktu: ${kegiatan.tanggal_mulai} s/d ${kegiatan.tanggal_selesai}   |   Total Sesi: ${kegiatan.sesi.length}`;
  mMeta.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
  mMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  masterSheet.getRow(3).height = 18;

  masterSheet.columns = [
    { key: 'no', width: 8 },
    { key: 'nim', width: 22 },
    { key: 'nama', width: 36 },
    { key: 'prodi', width: 28 },
    { key: 'waktu', width: 24 },
    { key: 'status', width: 18 },
  ];

  let mRow = 5;

  for (const sesi of kegiatan.sesi) {
    // Banner Sesi
    masterSheet.mergeCells(`A${mRow}:F${mRow}`);
    const sBanner = masterSheet.getCell(`A${mRow}`);
    sBanner.value = `SESI: ${sesi.nama_sesi.toUpperCase()}  (Tanggal: ${sesi.tanggal} | Pukul: ${sesi.jam_mulai} - ${sesi.jam_selesai} WIB)`;
    sBanner.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF1E3A8A' } };
    sBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Soft Indigo
    sBanner.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sBanner.border = thinBorder;
    masterSheet.getRow(mRow).height = 24;
    mRow++;

    // Table Header Sesi
    const sHeader = masterSheet.getRow(mRow);
    sHeader.values = ['No', 'NIM / Identifier', 'Nama Lengkap Mahasiswa', 'Program Studi', 'Waktu Check-in', 'Status Kehadiran'];
    sHeader.height = 24;
    sHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });
    mRow++;

    // Data Baris Sesi
    if (sesi.absensi.length === 0) {
      masterSheet.mergeCells(`A${mRow}:F${mRow}`);
      const emptyC = masterSheet.getCell(`A${mRow}`);
      emptyC.value = 'Belum ada data kehadiran pada sesi ini';
      emptyC.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF6B7280' } };
      emptyC.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyC.border = thinBorder;
      masterSheet.getRow(mRow).height = 22;
      mRow++;
    } else {
      sesi.absensi.forEach((abs, idx) => {
        const isEven = idx % 2 === 1;
        const row = masterSheet.getRow(mRow);
        const checkinStr = abs.waktu_checkin 
          ? new Date(abs.waktu_checkin).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) 
          : '-';
        const statusUpper = (abs.status || '-').toUpperCase();

        row.values = [
          idx + 1,
          abs.user?.nim || '-',
          abs.user?.nama || '-',
          abs.user?.prodi || '-',
          checkinStr,
          statusUpper,
        ];
        row.height = 21;

        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF111827' } };
          cell.border = thinBorder;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' }
          };

          if (colNumber === 1 || colNumber === 2 || colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (colNumber === 6) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.font = { name: 'Arial', size: 8.5, bold: true };
            if (statusUpper === 'HADIR') {
              cell.font.color = { argb: 'FF065F46' };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            } else if (statusUpper === 'TERLAMBAT') {
              cell.font.color = { argb: 'FF92400E' };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            } else {
              cell.font.color = { argb: 'FF991B1B' };
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });

        mRow++;
      });
    }

    // Subtotal Sesi
    masterSheet.mergeCells(`A${mRow}:D${mRow}`);
    const subTotLabel = masterSheet.getCell(`A${mRow}`);
    subTotLabel.value = `SUBTOTAL PESERTA (${sesi.nama_sesi}):`;
    subTotLabel.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF1F2937' } };
    subTotLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    subTotLabel.border = thinBorder;
    subTotLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    masterSheet.mergeCells(`E${mRow}:F${mRow}`);
    const subTotVal = masterSheet.getCell(`E${mRow}`);
    subTotVal.value = `${sesi.absensi.length} Peserta`;
    subTotVal.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF1E3A8A' } };
    subTotVal.alignment = { vertical: 'middle', horizontal: 'center' };
    subTotVal.border = thinBorder;
    subTotVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    masterSheet.getRow(mRow).height = 22;

    mRow += 2; // Spacing antar sesi
  }

  // Footer di Sheet Utama
  masterSheet.getCell(`A${mRow}`).value = `Dicetak otomatis oleh Sistem SIABSEN pada ${new Date().toLocaleString('id-ID')}`;
  masterSheet.getCell(`A${mRow}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF9CA3AF' } };

  // 2. SHEET TAMBAHAN: Tab per Sesi (Untuk kemudahan filtering per sesi)
  for (const sesi of kegiatan.sesi) {
    const rawName = sesi.nama_sesi.replace(/[\\/?*\[\]:]/g, '').trim();
    const sheetName = rawName.slice(0, 31) || `Sesi ${sesi.id}`;
    // Hindari tab tabrakan dengan nama "Semua Sesi"
    const finalSheetName = sheetName.toLowerCase() === 'semua sesi' ? `${sheetName} (Detail)` : sheetName;
    const sheet = workbook.addWorksheet(finalSheetName, {
      views: [{ showGridLines: true }]
    });

    // Judul & Banner Dokumen
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN REKAPITULASI KEHADIRAN KEGIATAN';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:F2');
    const subTitle = sheet.getCell('A2');
    subTitle.value = `${kegiatan.nama.toUpperCase()}`;
    subTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1F2937' } };
    subTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.mergeCells('A3:F3');
    const metaCell = sheet.getCell('A3');
    metaCell.value = `Sesi: ${sesi.nama_sesi}   |   Tanggal: ${sesi.tanggal}   |   Waktu: ${sesi.jam_mulai} - ${sesi.jam_selesai} WIB`;
    metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(3).height = 18;

    // Spacer
    sheet.getRow(4).height = 10;

    // Header Tabel
    const headerRow = sheet.getRow(5);
    headerRow.values = ['No', 'NIM / Identifier', 'Nama Lengkap Mahasiswa', 'Program Studi', 'Waktu Check-in', 'Status Kehadiran'];
    headerRow.height = 26;

    sheet.columns = [
      { key: 'no', width: 8 },
      { key: 'nim', width: 22 },
      { key: 'nama', width: 36 },
      { key: 'prodi', width: 28 },
      { key: 'waktu', width: 24 },
      { key: 'status', width: 18 },
    ];

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Deep Royal Blue
      };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });

    // Baris Data
    let rowIndex = 6;
    sesi.absensi.forEach((abs, idx) => {
      const isEven = idx % 2 === 1;
      const row = sheet.getRow(rowIndex);
      
      const checkinStr = abs.waktu_checkin 
        ? new Date(abs.waktu_checkin).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) 
        : '-';

      const statusUpper = (abs.status || '-').toUpperCase();

      row.values = [
        idx + 1,
        abs.user?.nim || '-',
        abs.user?.nama || '-',
        abs.user?.prodi || '-',
        checkinStr,
        statusUpper,
      ];
      row.height = 22;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF111827' } };
        cell.border = thinBorder;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF9FAFB' : 'FFFFFFFF' }
        };

        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Arial', size: 9, bold: true };
          if (statusUpper === 'HADIR') {
            cell.font.color = { argb: 'FF065F46' }; // Dark Green
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          } else if (statusUpper === 'TERLAMBAT') {
            cell.font.color = { argb: 'FF92400E' }; // Amber
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          } else {
            cell.font.color = { argb: 'FF991B1B' }; // Red
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      rowIndex++;
    });

    if (sesi.absensi.length === 0) {
      sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
      const emptyCell = sheet.getCell(`A${rowIndex}`);
      emptyCell.value = 'Belum ada data kehadiran pada sesi ini';
      emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } };
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyCell.border = thinBorder;
      sheet.getRow(rowIndex).height = 24;
      rowIndex++;
    }

    // Baris Total / Rekapitulasi
    sheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    const totalLabelCell = sheet.getCell(`A${rowIndex}`);
    totalLabelCell.value = 'TOTAL PESERTA HADIR TERCATAT:';
    totalLabelCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1F2937' } };
    totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
    totalLabelCell.border = thinBorder;
    totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    sheet.mergeCells(`E${rowIndex}:F${rowIndex}`);
    const totalValueCell = sheet.getCell(`E${rowIndex}`);
    totalValueCell.value = `${sesi.absensi.length} Orang`;
    totalValueCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    totalValueCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totalValueCell.border = thinBorder;
    totalValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    sheet.getRow(rowIndex).height = 24;

    // Footer info
    const footerRow = rowIndex + 2;
    sheet.getCell(`A${footerRow}`).value = `Dicetak otomatis oleh Sistem SIABSEN pada ${new Date().toLocaleString('id-ID')}`;
    sheet.getCell(`A${footerRow}`).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF9CA3AF' } };
  }

  const safeName = sanitizeFilename(kegiatan.nama);
  const filename = `laporan_${safeName}_${Date.now()}.xlsx`;
  const filepath = validateReportPath(path.join(STORAGE_DIR, filename));
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

  const safeName = sanitizeFilename(kegiatan.nama);
  const filename = `laporan_${safeName}_${Date.now()}.pdf`;
  const filepath = validateReportPath(path.join(STORAGE_DIR, filename));

  return new Promise((resolve, reject) => {
    // Ukuran A4 Portrait dengan margin 35pt
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 35,
      info: {
        Title: `Laporan Kehadiran - ${kegiatan.nama}`,
        Author: 'SIABSEN Kampus'
      }
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const marginLeft = 35;
    const tableWidth = pageWidth - (marginLeft * 2); // 525.28 pt

    // Dimensi Kolom Tabel (Total = tableWidth)
    const colWidths = {
      no: 30,
      nim: 85,
      nama: 175,
      prodi: 105,
      waktu: 70,
      status: 60
    };

    // Helper untuk render Header Tabel
    const drawTableHeader = (yPos) => {
      doc.rect(marginLeft, yPos, tableWidth, 22)
         .fill('#1E3A8A'); // Dark Blue

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
      
      let x = marginLeft;
      // No
      doc.text('NO', x, yPos + 6, { width: colWidths.no, align: 'center' });
      x += colWidths.no;
      // NIM
      doc.text('NIM', x, yPos + 6, { width: colWidths.nim, align: 'center' });
      x += colWidths.nim;
      // Nama
      doc.text('NAMA MAHASISWA', x + 5, yPos + 6, { width: colWidths.nama - 10, align: 'left' });
      x += colWidths.nama;
      // Prodi
      doc.text('PROGRAM STUDI', x + 5, yPos + 6, { width: colWidths.prodi - 10, align: 'left' });
      x += colWidths.prodi;
      // Waktu
      doc.text('WAKTU', x, yPos + 6, { width: colWidths.waktu, align: 'center' });
      x += colWidths.waktu;
      // Status
      doc.text('STATUS', x, yPos + 6, { width: colWidths.status, align: 'center' });

      // Outline border header
      doc.rect(marginLeft, yPos, tableWidth, 22).strokeColor('#1E3A8A').lineWidth(0.5).stroke();
      return yPos + 22;
    };

    // Helper Kop Laporan
    const drawKop = () => {
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1E3A8A')
         .text('SISTEM INFORMASI PRESENSI FAKULTAS (SIABSEN)', marginLeft, 35, { align: 'center', width: tableWidth });
      
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827')
         .text(kegiatan.nama.toUpperCase(), marginLeft, 53, { align: 'center', width: tableWidth });

      doc.font('Helvetica').fontSize(8.5).fillColor('#6B7280')
         .text(`Lokasi: ${kegiatan.lokasi || '-'}   |   Waktu Pelaksanaan: ${kegiatan.tanggal_mulai} s/d ${kegiatan.tanggal_selesai}`, marginLeft, 68, { align: 'center', width: tableWidth });

      // Garis Kop Ganda
      doc.moveTo(marginLeft, 82).lineTo(marginLeft + tableWidth, 82).strokeColor('#1E3A8A').lineWidth(1.5).stroke();
      doc.moveTo(marginLeft, 85).lineTo(marginLeft + tableWidth, 85).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    };

    drawKop();
    let currentY = 98;

    kegiatan.sesi.forEach((sesi, sesiIdx) => {
      // Jika jarak ke bawah halaman kurang dari 120, pindah halaman
      if (currentY > doc.page.height - 130) {
        doc.addPage();
        drawKop();
        currentY = 98;
      }

      // Box Banner Sesi
      doc.rect(marginLeft, currentY, tableWidth, 24)
         .fillColor('#F1F5F9').fill();
      doc.rect(marginLeft, currentY, tableWidth, 24)
         .strokeColor('#CBD5E1').lineWidth(0.5).stroke();

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1E3A8A')
         .text(`SESI: ${sesi.nama_sesi.toUpperCase()}`, marginLeft + 10, currentY + 7);

      doc.font('Helvetica').fontSize(8.5).fillColor('#4B5563')
         .text(`Tanggal: ${sesi.tanggal}  |  Pukul: ${sesi.jam_mulai} - ${sesi.jam_selesai} WIB`, marginLeft, currentY + 7, {
           width: tableWidth - 10,
           align: 'right'
         });

      currentY += 28;

      // Gambar Header Tabel
      currentY = drawTableHeader(currentY);

      // Isi Tabel Peserta
      if (sesi.absensi.length === 0) {
        doc.rect(marginLeft, currentY, tableWidth, 20)
           .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#9CA3AF')
           .text('Belum ada data presensi untuk sesi ini.', marginLeft, currentY + 6, {
             width: tableWidth,
             align: 'center'
           });
        currentY += 20;
      } else {
        sesi.absensi.forEach((abs, idx) => {
          const rowHeight = 18;

          // Cek paging baris tabel
          if (currentY + rowHeight > doc.page.height - 50) {
            doc.addPage();
            drawKop();
            currentY = 98;
            currentY = drawTableHeader(currentY);
          }

          const isEven = idx % 2 === 1;
          // Background selang-seling (Zebra striping)
          if (isEven) {
            doc.rect(marginLeft, currentY, tableWidth, rowHeight)
               .fillColor('#F8FAFC').fill();
          }

          // Border baris
          doc.rect(marginLeft, currentY, tableWidth, rowHeight)
             .strokeColor('#E2E8F0').lineWidth(0.5).stroke();

          // Garis pemisah vertikal antar kolom
          let colX = marginLeft;
          [colWidths.no, colWidths.nim, colWidths.nama, colWidths.prodi, colWidths.waktu].forEach(w => {
            colX += w;
            doc.moveTo(colX, currentY).lineTo(colX, currentY + rowHeight)
               .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          });

          // Teks Data
          doc.font('Helvetica').fontSize(8).fillColor('#1F2937');
          let textX = marginLeft;

          // No
          doc.text(`${idx + 1}`, textX, currentY + 5, { width: colWidths.no, align: 'center' });
          textX += colWidths.no;

          // NIM
          doc.text(abs.user?.nim || '-', textX, currentY + 5, { width: colWidths.nim, align: 'center' });
          textX += colWidths.nim;

          // Nama
          doc.font('Helvetica-Bold').text(abs.user?.nama || '-', textX + 5, currentY + 5, { width: colWidths.nama - 10, align: 'left', lineBreak: false });
          doc.font('Helvetica');
          textX += colWidths.nama;

          // Prodi
          doc.text(abs.user?.prodi || '-', textX + 5, currentY + 5, { width: colWidths.prodi - 10, align: 'left', lineBreak: false });
          textX += colWidths.prodi;

          // Waktu
          const checkinTime = abs.waktu_checkin 
            ? new Date(abs.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
            : '-';
          doc.text(checkinTime, textX, currentY + 5, { width: colWidths.waktu, align: 'center' });
          textX += colWidths.waktu;

          // Status Badge / Teks
          const st = (abs.status || '').toUpperCase();
          if (st === 'HADIR') {
            doc.fillColor('#059669'); // Emerald
          } else if (st === 'TERLAMBAT') {
            doc.fillColor('#D97706'); // Amber
          } else {
            doc.fillColor('#DC2626'); // Red
          }
          doc.font('Helvetica-Bold').fontSize(7.5).text(st, textX, currentY + 5, { width: colWidths.status, align: 'center' });

          currentY += rowHeight;
        });
      }

      // Baris Total Hadir
      doc.rect(marginLeft, currentY, tableWidth, 18)
         .fillColor('#F1F5F9').fill();
      doc.rect(marginLeft, currentY, tableWidth, 18)
         .strokeColor('#CBD5E1').lineWidth(0.5).stroke();

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E3A8A')
         .text(`TOTAL HADIR: ${sesi.absensi.length} MAHASISWA`, marginLeft + 10, currentY + 5, {
           width: tableWidth - 20,
           align: 'right'
         });

      currentY += 26;
    });

    // Footer Dokumen
    const bottomY = doc.page.height - 30;
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94A3B8')
       .text(`Dokumen ini di-generate otomatis oleh SIABSEN pada ${new Date().toLocaleString('id-ID')}`, marginLeft, bottomY, {
         width: tableWidth,
         align: 'center'
       });

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

module.exports = { generateExcel, generatePdf, sanitizeFilename, validateReportPath, STORAGE_DIR };
