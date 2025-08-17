const { body, param, query } = require('express-validator');

class ProgressTrackingValidator {
    // Validate task progress update
    validateUpdateTaskProgress() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Valid task ID is required'),

            body('progress')
                .optional()
                .isNumeric()
                .withMessage('Progress must be a number')
                .custom((value) => {
                    if (value < 0 || value > 100) {
                        throw new Error('Progress must be between 0 and 100');
                    }
                    return true;
                }),

            body('status')
                .optional()
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status. Must be one of: todo, in_progress, review, done, cancelled'),

            body('remainingHours')
                .optional()
                .isNumeric()
                .withMessage('Remaining hours must be a number')
                .custom((value) => {
                    if (value < 0) {
                        throw new Error('Remaining hours cannot be negative');
                    }
                    return true;
                }),

            body('notes')
                .optional()
                .isString()
                .withMessage('Notes must be a string')
                .isLength({ max: 1000 })
                .withMessage('Notes cannot exceed 1000 characters')
        ];
    }

    // Validate get task progress
    validateGetTaskProgress() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Valid task ID is required')
        ];
    }

    // Validate get project progress
    validateGetProjectProgress() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Valid project ID is required')
        ];
    }

    // Validate get workspace progress
    validateGetWorkspaceProgress() {
        return [
            param('workspaceId')
                .isMongoId()
                .withMessage('Valid workspace ID is required')
        ];
    }

    // Validate bulk update tasks progress
    validateBulkUpdateTasksProgress() {
        return [
            body('updates')
                .isArray({ min: 1 })
                .withMessage('Updates array is required and must contain at least one item')
                .custom((updates) => {
                    if (updates.length > 50) {
                        throw new Error('Cannot update more than 50 tasks at once');
                    }
                    return true;
                }),

            body('updates.*.taskId')
                .isMongoId()
                .withMessage('Each update must have a valid task ID'),

            body('updates.*.progressData')
                .isObject()
                .withMessage('Each update must have progress data'),

            body('updates.*.progressData.progress')
                .optional()
                .isNumeric()
                .withMessage('Progress must be a number')
                .custom((value) => {
                    if (value < 0 || value > 100) {
                        throw new Error('Progress must be between 0 and 100');
                    }
                    return true;
                }),

            body('updates.*.progressData.status')
                .optional()
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status. Must be one of: todo, in_progress, review, done, cancelled'),

            body('updates.*.progressData.remainingHours')
                .optional()
                .isNumeric()
                .withMessage('Remaining hours must be a number')
                .custom((value) => {
                    if (value < 0) {
                        throw new Error('Remaining hours cannot be negative');
                    }
                    return true;
                })
        ];
    }

    // Validate progress analytics request
    validateProgressAnalytics() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Valid project ID is required'),

            query('startDate')
                .notEmpty()
                .withMessage('Start date is required')
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),

            query('endDate')
                .notEmpty()
                .withMessage('End date is required')
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    const startDate = new Date(req.query.startDate);
                    const endDate = new Date(value);
                    
                    if (endDate <= startDate) {
                        throw new Error('End date must be after start date');
                    }

                    // Limit the date range to prevent performance issues
                    const maxDays = 365; // 1 year
                    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
                    
                    if (daysDiff > maxDays) {
                        throw new Error(`Date range cannot exceed ${maxDays} days`);
                    }

                    return true;
                }),

            query('groupBy')
                .optional()
                .isIn(['day', 'week', 'month'])
                .withMessage('Group by must be one of: day, week, month')
        ];
    }

    // Validate progress report request
    validateProgressReport() {
        return [
            query('workspaceId')
                .optional()
                .isMongoId()
                .withMessage('Valid workspace ID is required'),

            query('projectId')
                .optional()
                .isMongoId()
                .withMessage('Valid project ID is required'),

            query('startDate')
                .optional()
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),

            query('endDate')
                .optional()
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date'),

            query('format')
                .optional()
                .isIn(['json', 'csv', 'excel'])
                .withMessage('Format must be one of: json, csv, excel'),

            query('includeDetails')
                .optional()
                .isBoolean()
                .withMessage('Include details must be a boolean'),

            query('groupBy')
                .optional()
                .isIn(['user', 'project', 'task', 'date'])
                .withMessage('Group by must be one of: user, project, task, date')
        ];
    }

    // Validate milestone creation
    validateCreateMilestone() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Valid project ID is required'),

            body('title')
                .notEmpty()
                .withMessage('Milestone title is required')
                .isLength({ min: 1, max: 200 })
                .withMessage('Title must be between 1 and 200 characters'),

            body('description')
                .optional()
                .isString()
                .withMessage('Description must be a string')
                .isLength({ max: 1000 })
                .withMessage('Description cannot exceed 1000 characters'),

            body('dueDate')
                .notEmpty()
                .withMessage('Due date is required')
                .isISO8601()
                .withMessage('Due date must be a valid ISO 8601 date')
                .custom((value) => {
                    const dueDate = new Date(value);
                    const now = new Date();
                    
                    if (dueDate <= now) {
                        throw new Error('Due date must be in the future');
                    }
                    
                    return true;
                }),

            body('criteria')
                .isArray({ min: 1 })
                .withMessage('Milestone criteria are required and must be an array with at least one item'),

            body('criteria.*.type')
                .isIn(['task_completion', 'progress_percentage', 'time_logged', 'custom'])
                .withMessage('Invalid criteria type'),

            body('criteria.*.value')
                .notEmpty()
                .withMessage('Criteria value is required'),

            body('criteria.*.description')
                .optional()
                .isString()
                .withMessage('Criteria description must be a string')
        ];
    }

    // Validate progress comparison request
    validateProgressComparison() {
        return [
            query('projectIds')
                .notEmpty()
                .withMessage('Project IDs are required')
                .custom((value) => {
                    const ids = Array.isArray(value) ? value : value.split(',');
                    
                    if (ids.length < 2) {
                        throw new Error('At least 2 project IDs are required for comparison');
                    }
                    
                    if (ids.length > 10) {
                        throw new Error('Cannot compare more than 10 projects at once');
                    }
                    
                    // Validate each ID
                    ids.forEach(id => {
                        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                            throw new Error(`Invalid project ID: ${id}`);
                        }
                    });
                    
                    return true;
                }),

            query('metrics')
                .optional()
                .custom((value) => {
                    const allowedMetrics = [
                        'progress', 'time_efficiency', 'task_completion', 
                        'velocity', 'milestone_achievement', 'team_performance'
                    ];
                    
                    const metrics = Array.isArray(value) ? value : value.split(',');
                    
                    metrics.forEach(metric => {
                        if (!allowedMetrics.includes(metric)) {
                            throw new Error(`Invalid metric: ${metric}`);
                        }
                    });
                    
                    return true;
                }),

            query('timeframe')
                .optional()
                .isIn(['7d', '30d', '90d', '6m', '1y', 'all'])
                .withMessage('Timeframe must be one of: 7d, 30d, 90d, 6m, 1y, all')
        ];
    }

    // Common validation helper
    static handleValidationErrors(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
}

module.exports = new ProgressTrackingValidator();

