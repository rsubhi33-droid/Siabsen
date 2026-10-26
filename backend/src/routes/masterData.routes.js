const router = require('express').Router();
const masterDataCtrl = require('../controllers/masterData.controller');
const authenticate = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

router.get('/', authenticate, masterDataCtrl.getAll);
router.post('/', authenticate, checkRole('admin'), masterDataCtrl.create);
router.put('/:id', authenticate, checkRole('admin'), masterDataCtrl.update);
router.delete('/:id', authenticate, checkRole('admin'), masterDataCtrl.remove);

module.exports = router;
