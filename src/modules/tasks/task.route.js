const express = require('express');
const taskController = require('./task.controller');
const taskValidator = require('./task.validator');
const authMiddleware = require('../auth/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// Task CRUD operations
router.post(
    '/',
    taskValidator.createTaskValidation(),
    taskController.createTaskHandler
);

router.get(
    '/:taskId',
    taskValidator.taskIdValidation(),
    taskController.getTaskDetailsHandler
);

router.put(
    '/:taskId',
    taskValidator.updateTaskValidation(),
    taskController.updateTaskHandler
);

router.delete(
    '/:taskId',
    taskValidator.taskIdValidation(),
    taskController.deleteTaskHandler
);

// Project tasks
router.get(
    '/project/:projectId',
    taskValidator.projectIdValidation(),
    taskValidator.listTasksQueryValidation(),
    taskController.listProjectTasksHandler
);

// User tasks
router.get(
    '/user/my-tasks',
    taskValidator.userTasksQueryValidation(),
    taskController.getUserTasksHandler
);

// Task status management
router.patch(
    '/:taskId/status',
    taskValidator.updateStatusValidation(),
    taskController.updateTaskStatusHandler
);

// Task assignment
router.patch(
    '/:taskId/assign',
    taskValidator.assignTaskValidation(),
    taskController.assignTaskHandler
);

// Time tracking
router.post(
    '/:taskId/time',
    taskValidator.addTimeEntryValidation(),
    taskController.addTimeEntryHandler
);

// Comments
router.post(
    '/:taskId/comments',
    taskValidator.addCommentValidation(),
    taskController.addCommentHandler
);

// Watchers
router.post(
    '/:taskId/watchers',
    taskValidator.addWatcherValidation(),
    taskController.addWatcherHandler
);

router.delete(
    '/:taskId/watchers/:watcherUserId',
    taskValidator.removeWatcherValidation(),
    taskController.removeWatcherHandler
);

// Task statistics
router.get(
    '/project/:projectId/stats',
    taskValidator.projectIdValidation(),
    taskController.getTaskStatsHandler
);

module.exports = router;

