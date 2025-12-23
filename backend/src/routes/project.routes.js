const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/project.controller');

router.post('/projects', auth(), ctrl.createProject);
router.get('/projects', auth(), ctrl.listProjects);
router.put('/projects/:projectId', auth(), ctrl.updateProject);
router.delete('/projects/:projectId', auth(), ctrl.deleteProject);

module.exports = router;