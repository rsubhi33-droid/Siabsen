const router = require('express').Router();
const kegiatanCtrl = require('../controllers/kegiatan.controller');
const sesiCtrl = require('../controllers/sesi.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const validate = require('../middlewares/validate');
const { createKegiatanSchema, updateKegiatanSchema } = require('../validators/kegiatan.validator');
const { createSesiSchema } = require('../validators/kegiatan.validator');

// Kegiatan CRUD
router.get('/', authenticate, kegiatanCtrl.getAll);
router.get('/:id', authenticate, kegiatanCtrl.getById);
router.post('/', authenticate, checkRole('admin', 'panitia'), validate(createKegiatanSchema), kegiatanCtrl.create);
router.put('/:id', authenticate, checkRole('admin', 'panitia'), validate(updateKegiatanSchema), kegiatanCtrl.update);
router.delete('/:id', authenticate, checkRole('admin', 'panitia'), kegiatanCtrl.remove);

// Sesi kegiatan (nested)
router.get('/:kegiatanId/sesi', authenticate, sesiCtrl.getSesiByKegiatan);
router.post('/:kegiatanId/sesi', authenticate, checkRole('admin', 'panitia'), validate(createSesiSchema), sesiCtrl.createSesi);

module.exports = router;
