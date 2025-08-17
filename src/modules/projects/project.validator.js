const { body, param } = require('express-validator');

class ProjectValidator {
    // Create project validation
    createProjectValidation = [
        body('workspaceId')
            .isMongoId()
            .withMessage('Workspace ID is required and must be valid'),
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Project name must be between 2 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters'),
        body('status')
            .optional()
            .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
            .withMessage('Invalid status'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid priority'),
        body('startDate')
            .optional()
            .isISO8601()
            .toDate(),
        body('endDate')
            .optional()
            .isISO8601()
            .toDate(),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters'),
        body('budget')
            .optional()
            .isObject()
            .withMessage('Budget must be an object'),
        body('budget.allocated')
            .optional()
            .isNumeric()
            .withMessage('Budget allocated must be a number'),
        body('budget.spent')
            .optional()
            .isNumeric()
            .withMessage('Budget spent must be a number'),
        body('budget.currency')
            .optional()
            .isLength({ min: 3, max: 3 })
            .withMessage('Currency must be 3 characters'),
        body('client')
            .optional()
            .isObject()
            .withMessage('Client must be an object'),
        body('client.name')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Client name cannot exceed 100 characters'),
        body('client.email')
            .optional()
            .isEmail()
            .withMessage('Client email must be valid'),
        body('client.company')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Client company cannot exceed 100 characters'),
        body('settings')
            .optional()
            .isObject()
            .withMessage('Settings must be an object'),
        body('settings.isPublic')
            .optional()
            .isBoolean()
            .withMessage('isPublic must be boolean'),
        body('settings.allowTimeTracking')
            .optional()
            .isBoolean()
            .withMessage('allowTimeTracking must be boolean'),
        body('settings.requireTaskApproval')
            .optional()
            .isBoolean()
            .withMessage('requireTaskApproval must be boolean'),
        body('settings.notifyOnTaskComplete')
            .optional()
            .isBoolean()
            .withMessage('notifyOnTaskComplete must be boolean')
    ];

    // Update project validation
    updateProjectValidation = [
        param('projectId')
            .isMongoId()
            .withMessage('Project ID is required and must be valid'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Project name must be between 2 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description cannot exceed 1000 characters'),
        body('status')
            .optional()
            .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
            .withMessage('Invalid status'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid priority'),
        body('startDate')
            .optional()
            .isISO8601()
            .toDate(),
        body('endDate')
            .optional()
            .isISO8601()
            .toDate(),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
        body('tags.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters'),
        body('budget')
            .optional()
            .isObject()
            .withMessage('Budget must be an object'),
        body('budget.allocated')
            .optional()
            .isNumeric()
            .withMessage('Budget allocated must be a number'),
        body('budget.spent')
            .optional()
            .isNumeric()
            .withMessage('Budget spent must be a number'),
        body('budget.currency')
            .optional()
            .isLength({ min: 3, max: 3 })
            .withMessage('Currency must be 3 characters'),
        body('client')
            .optional()
            .isObject()
            .withMessage('Client must be an object'),
        body('client.name')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Client name cannot exceed 100 characters'),
        body('client.email')
            .optional()
            .isEmail()
            .withMessage('Client email must be valid'),
        body('client.company')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Client company cannot exceed 100 characters'),
        body('settings')
            .optional()
            .isObject()
            .withMessage('Settings must be an object'),
        body('settings.isPublic')
            .optional()
            .isBoolean()
            .withMessage('isPublic must be boolean'),
        body('settings.allowTimeTracking')
            .optional()
            .isBoolean()
            .withMessage('allowTimeTracking must be boolean'),
        body('settings.requireTaskApproval')
            .optional()
            .isBoolean()
            .withMessage('requireTaskApproval must be boolean'),
        body('settings.notifyOnTaskComplete')
            .optional()
            .isBoolean()
            .withMessage('notifyOnTaskComplete must be boolean')
    ];

    // Project ID validation
    projectIdValidation = [
        param('projectId')
            .isMongoId()
            .withMessage('Project ID is required and must be valid')
    ];

    // Add member validation
    addMemberValidation = [
        param('projectId')
            .isMongoId()
            .withMessage('Project ID is required and must be valid'),
        body('userId')
            .isMongoId()
            .withMessage('User ID is required and must be valid'),
        body('role')
            .optional()
            .isIn(['project_lead', 'developer', 'designer', 'tester', 'viewer'])
            .withMessage('Invalid role')
    ];

    // Remove member validation
    removeMemberValidation = [
        param('projectId')
            .isMongoId()
            .withMessage('Project ID is required and must be valid'),
        param('userId')
            .isMongoId()
            .withMessage('User ID is required and must be valid')
    ];
}

module.exports = new ProjectValidator();

