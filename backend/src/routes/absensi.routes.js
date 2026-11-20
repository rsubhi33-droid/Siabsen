const router = require('express').Router();
const absensiCtrl = require('../controllers/absensi.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const validate = require('../middlewares/validate');
const { scanLimiter } = require('../middlewares/rateLimiter');
const { scanQrSchema, manualAbsensiSchema } = require('../validators/absensi.validator');

router.post('/scan', authenticate, scanLimiter, validate(scanQrSchema), absensiCtrl.scanQr);
router.post('/manual', authenticate, checkRole('admin', 'panitia'), validate(manualAbsensiSchema), absensiCtrl.manualCheckIn);
router.get('/sesi/:sesiId', authenticate, checkRole('admin', 'panitia', 'dosen'), absensiCtrl.getBySesi);
router.get('/riwayat', authenticate, absensiCtrl.getRiwayat);

module.exports = router;
