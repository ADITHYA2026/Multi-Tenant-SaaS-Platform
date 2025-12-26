const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const missingCtrl = require('../controllers/missing.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register-tenant', ctrl.registerTenant);
router.post('/login', ctrl.login);
router.get('/me', auth(), ctrl.me);
router.post('/logout', auth(), missingCtrl.logout); // Added logout endpoint

module.exports = router;