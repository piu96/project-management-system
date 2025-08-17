const express = require('express');
const notificationController = require('./notification.controller');
const notificationValidator = require('./notification.validator');
const authMiddleware = require('../auth/auth.middleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

// Get user notifications
router.get(
    '/',
    notificationValidator.notificationQueryValidation(),
    notificationController.getUserNotificationsHandler
);

// Get unread notification count
router.get(
    '/unread-count',
    notificationController.getUnreadCountHandler
);

// Mark notification as read
router.patch(
    '/:notificationId/read',
    notificationValidator.notificationIdValidation(),
    notificationController.markAsReadHandler
);

// Mark all notifications as read
router.patch(
    '/mark-all-read',
    notificationController.markAllAsReadHandler
);

// Delete notification
router.delete(
    '/:notificationId',
    notificationValidator.notificationIdValidation(),
    notificationController.deleteNotificationHandler
);

// Get notification preferences
router.get(
    '/preferences',
    notificationController.getPreferencesHandler
);

// Update notification preferences
router.put(
    '/preferences',
    notificationValidator.updatePreferencesValidation(),
    notificationController.updatePreferencesHandler
);

module.exports = router;

