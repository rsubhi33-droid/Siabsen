const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/kegiatan', require('./kegiatan.routes'));
router.use('/sesi', require('./sesi.routes'));
router.use('/absensi', require('./absensi.routes'));
router.use('/laporan', require('./laporan.routes'));
router.use('/users', require('./user.routes'));
router.use('/master-data', require('./masterData.routes'));
router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;
