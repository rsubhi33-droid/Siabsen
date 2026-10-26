const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(registerSchema), authCtrl.register);
router.post('/login', authLimiter, validate(loginSchema), authCtrl.login);
router.get('/me', authenticate, authCtrl.getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), authCtrl.updateProfile);

module.exports = router;
