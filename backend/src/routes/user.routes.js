const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');
const missingCtrl = require('../controllers/missing.controller');

router.post('/tenants/:tenantId/users', auth(['tenant_admin', 'super_admin']), ctrl.addUser);
router.get('/tenants/:tenantId/users', auth(), ctrl.listUsers);
router.put('/users/:userId', auth(), missingCtrl.updateUser);
router.delete('/users/:userId', auth(['tenant_admin', 'super_admin']), missingCtrl.deleteUser); 

module.exports = router;