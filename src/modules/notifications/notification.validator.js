const { body, param, query } = require('express-validator');

class NotificationValidator {
    // Validation for notification ID parameter
    static notificationIdValidation() {
        return [
            param('notificationId')
                .isMongoId()
                .withMessage('Invalid notification ID format')
        ];
    }

    // Validation for updating notification preferences
    static updatePreferencesValidation() {
        return [
            body('emailNotifications')
                .optional()
                .isBoolean()
                .withMessage('Email notifications must be a boolean'),
            
            body('pushNotifications')
                .optional()
                .isBoolean()
                .withMessage('Push notifications must be a boolean'),
            
            body('inAppNotifications')
                .optional()
                .isBoolean()
                .withMessage('In-app notifications must be a boolean'),
            
            body('taskNotifications')
                .optional()
                .isObject()
                .withMessage('Task notifications must be an object'),
            
            body('taskNotifications.assignments')
                .optional()
                .isBoolean()
                .withMessage('Task assignment notifications must be a boolean'),
            
            body('taskNotifications.statusChanges')
                .optional()
                .isBoolean()
                .withMessage('Task status change notifications must be a boolean'),
            
            body('taskNotifications.dueDates')
                .optional()
                .isBoolean()
                .withMessage('Task due date notifications must be a boolean'),
            
            body('taskNotifications.comments')
                .optional()
                .isBoolean()
                .withMessage('Task comment notifications must be a boolean'),
            
            body('projectNotifications')
                .optional()
                .isObject()
                .withMessage('Project notifications must be an object'),
            
            body('projectNotifications.updates')
                .optional()
                .isBoolean()
                .withMessage('Project update notifications must be a boolean'),
            
            body('projectNotifications.memberChanges')
                .optional()
                .isBoolean()
                .withMessage('Project member change notifications must be a boolean'),
            
            body('workspaceNotifications')
                .optional()
                .isObject()
                .withMessage('Workspace notifications must be an object'),
            
            body('workspaceNotifications.invitations')
                .optional()
                .isBoolean()
                .withMessage('Workspace invitation notifications must be a boolean'),
            
            body('workspaceNotifications.announcements')
                .optional()
                .isBoolean()
                .withMessage('Workspace announcement notifications must be a boolean'),
            
            body('digestFrequency')
                .optional()
                .isIn(['never', 'daily', 'weekly', 'monthly'])
                .withMessage('Digest frequency must be one of: never, daily, weekly, monthly'),
            
            body('quietHours')
                .optional()
                .isObject()
                .withMessage('Quiet hours must be an object'),
            
            body('quietHours.enabled')
                .optional()
                .isBoolean()
                .withMessage('Quiet hours enabled must be a boolean'),
            
            body('quietHours.startTime')
                .optional()
                .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .withMessage('Start time must be in HH:MM format'),
            
            body('quietHours.endTime')
                .optional()
                .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .withMessage('End time must be in HH:MM format')
        ];
    }

    // Validation for query parameters
    static notificationQueryValidation() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            
            query('unreadOnly')
                .optional()
                .isBoolean()
                .withMessage('Unread only must be a boolean'),
            
            query('type')
                .optional()
                .isIn(['task', 'project', 'workspace', 'system'])
                .withMessage('Type must be one of: task, project, workspace, system')
        ];
    }
}

module.exports = NotificationValidator;

// Generated by Copilot
