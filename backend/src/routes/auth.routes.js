const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register-tenant', ctrl.registerTenant);
router.post('/login', ctrl.login);
router.get('/me', auth(), ctrl.me);
router.post('/logout', auth(), ctrl.logout); // ADD THIS LINE

module.exports = router;