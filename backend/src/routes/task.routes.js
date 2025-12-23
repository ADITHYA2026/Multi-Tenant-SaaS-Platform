const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/task.controller');

router.post('/projects/:projectId/tasks', auth(), ctrl.createTask);
router.get('/projects/:projectId/tasks', auth(), ctrl.listTasks);
router.patch('/tasks/:taskId/status', auth(), ctrl.updateTaskStatus);
router.put('/tasks/:taskId', auth(), ctrl.updateTask);

module.exports = router;