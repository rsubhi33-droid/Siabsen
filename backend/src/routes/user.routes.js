const router = require('express').Router();
const userCtrl = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

router.get('/mahasiswa/search', authenticate, checkRole('admin', 'panitia'), userCtrl.searchMahasiswa);
router.get('/', authenticate, checkRole('admin', 'panitia'), userCtrl.getAll);
router.get('/:id', authenticate, checkRole('admin'), userCtrl.getById);
router.post('/', authenticate, checkRole('admin'), userCtrl.create);
router.put('/:id', authenticate, checkRole('admin'), userCtrl.update);
router.put('/:id/toggle-active', authenticate, checkRole('admin'), userCtrl.toggleActive);

module.exports = router;
