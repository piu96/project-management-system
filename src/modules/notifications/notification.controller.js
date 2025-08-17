const { validationResult } = require('express-validator');
const notificationService = require('./notification.service');

class NotificationController {
    // Get user notifications
    async getUserNotificationsHandler(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await notificationService.getUserNotifications(userId, page, limit);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Get notifications handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Mark notification as read
    async markAsReadHandler(req, res) {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await notificationService.markAsRead(notificationId, userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Mark as read handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Mark all notifications as read
    async markAllAsReadHandler(req, res) {
        try {
            const userId = req.user.id;

            const result = await notificationService.markAllAsRead(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Mark all as read handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete notification
    async deleteNotificationHandler(req, res) {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const result = await notificationService.deleteNotification(notificationId, userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Delete notification handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get notification preferences
    async getPreferencesHandler(req, res) {
        try {
            const userId = req.user.id;

            const result = await notificationService.getNotificationPreferences(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Get preferences handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update notification preferences
    async updatePreferencesHandler(req, res) {
        try {
            // Check validation results
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const result = await notificationService.updateNotificationPreferences(userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Update preferences handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get unread count
    async getUnreadCountHandler(req, res) {
        try {
            const userId = req.user.id;

            // TODO: Implement unread count logic
            return res.status(200).json({
                success: true,
                count: 0,
                message: 'Unread count - to be implemented'
            });

        } catch (error) {
            console.error('Get unread count handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new NotificationController();

