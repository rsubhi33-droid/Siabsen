const router = require('express').Router();
const laporanCtrl = require('../controllers/laporan.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

router.post('/generate', authenticate, checkRole('admin', 'dosen'), laporanCtrl.generate);
router.get('/download/:id', authenticate, checkRole('admin', 'dosen'), laporanCtrl.download);
router.get('/', authenticate, checkRole('admin', 'dosen'), laporanCtrl.getAll);

module.exports = router;
