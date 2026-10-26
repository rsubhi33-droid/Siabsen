const router = require('express').Router();
const dashboardCtrl = require('../controllers/dashboard.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

router.get('/stats', authenticate, checkRole('admin', 'panitia', 'dosen'), dashboardCtrl.getStats);
router.get('/kehadiran-per-kegiatan', authenticate, checkRole('admin', 'panitia', 'dosen'), dashboardCtrl.getKehadiranPerKegiatan);
router.get('/kehadiran-per-prodi', authenticate, checkRole('admin', 'panitia', 'dosen'), dashboardCtrl.getKehadiranPerProdi);
router.get('/recent-activity', authenticate, checkRole('admin', 'panitia', 'dosen'), dashboardCtrl.getRecentActivity);

module.exports = router;
