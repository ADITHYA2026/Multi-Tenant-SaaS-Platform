const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/tenant.controller');

router.get('/:tenantId', auth(), ctrl.getTenant);
router.put('/:tenantId', auth(), ctrl.updateTenant);
router.get('/', auth(['super_admin']), ctrl.listTenants);

module.exports = router;