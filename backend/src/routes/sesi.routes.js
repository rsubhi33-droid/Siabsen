const router = require('express').Router();
const sesiCtrl = require('../controllers/sesi.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

router.post('/:id/generate-qr', authenticate, checkRole('admin', 'panitia'), sesiCtrl.generateQr);
router.put('/:id/toggle', authenticate, checkRole('admin', 'panitia'), sesiCtrl.toggleSesi);
router.delete('/:id', authenticate, checkRole('admin', 'panitia'), sesiCtrl.deleteSesi);

module.exports = router;
