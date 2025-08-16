const { body, param, query } = require('express-validator');

class TimeTrackingValidator {
    // Validate start timer request
    validateStartTimer() {
        return [
            body('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format')
                .notEmpty()
                .withMessage('Task ID is required'),
            
            body('description')
                .optional()
                .isString()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot be more than 500 characters')
        ];
    }

    // Validate stop timer request
    validateStopTimer() {
        return [
            param('timeEntryId')
                .isMongoId()
                .withMessage('Invalid time entry ID format')
                .notEmpty()
                .withMessage('Time entry ID is required')
        ];
    }

    // Validate log time request
    validateLogTime() {
        return [
            body('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format')
                .notEmpty()
                .withMessage('Task ID is required'),
            
            body('hours')
                .isFloat({ min: 0.1, max: 24 })
                .withMessage('Hours must be between 0.1 and 24')
                .notEmpty()
                .withMessage('Hours is required'),
            
            body('description')
                .optional()
                .isString()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot be more than 500 characters'),
            
            body('date')
                .optional()
                .isISO8601()
                .withMessage('Date must be a valid ISO 8601 date')
                .custom((value) => {
                    const date = new Date(value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (date > today) {
                        throw new Error('Cannot log time for future dates');
                    }
                    return true;
                }),
            
            body('billable')
                .optional()
                .isBoolean()
                .withMessage('Billable must be a boolean value')
        ];
    }

    // Validate update time entry request
    validateUpdateTimeEntry() {
        return [
            param('timeEntryId')
                .isMongoId()
                .withMessage('Invalid time entry ID format')
                .notEmpty()
                .withMessage('Time entry ID is required'),
            
            body('hours')
                .optional()
                .isFloat({ min: 0.1, max: 24 })
                .withMessage('Hours must be between 0.1 and 24'),
            
            body('description')
                .optional()
                .isString()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot be more than 500 characters'),
            
            body('date')
                .optional()
                .isISO8601()
                .withMessage('Date must be a valid ISO 8601 date')
                .custom((value) => {
                    if (value) {
                        const date = new Date(value);
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        
                        if (date > today) {
                            throw new Error('Cannot set date in the future');
                        }
                    }
                    return true;
                }),
            
            body('billable')
                .optional()
                .isBoolean()
                .withMessage('Billable must be a boolean value')
        ];
    }

    // Validate delete time entry request
    validateDeleteTimeEntry() {
        return [
            param('timeEntryId')
                .isMongoId()
                .withMessage('Invalid time entry ID format')
                .notEmpty()
                .withMessage('Time entry ID is required')
        ];
    }

    // Validate get user time entries request
    validateGetUserTimeEntries() {
        return [
            query('startDate')
                .optional()
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),
            
            query('endDate')
                .optional()
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    if (req.query.startDate && value) {
                        const startDate = new Date(req.query.startDate);
                        const endDate = new Date(value);
                        
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        // Limit to 1 year range
                        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
                        if (endDate - startDate > oneYearInMs) {
                            throw new Error('Date range cannot exceed 1 year');
                        }
                    }
                    return true;
                }),
            
            query('projectId')
                .optional()
                .isMongoId()
                .withMessage('Invalid project ID format'),
            
            query('taskId')
                .optional()
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            query('billable')
                .optional()
                .isBoolean()
                .withMessage('Billable must be a boolean value'),
            
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100')
        ];
    }

    // Validate get project time tracking request
    validateGetProjectTimeTracking() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Invalid project ID format')
                .notEmpty()
                .withMessage('Project ID is required'),
            
            query('startDate')
                .optional()
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),
            
            query('endDate')
                .optional()
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    if (req.query.startDate && value) {
                        const startDate = new Date(req.query.startDate);
                        const endDate = new Date(value);
                        
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                    }
                    return true;
                })
        ];
    }

    // Validate get time reports request
    validateGetTimeReports() {
        return [
            param('workspaceId')
                .isMongoId()
                .withMessage('Invalid workspace ID format')
                .notEmpty()
                .withMessage('Workspace ID is required'),
            
            query('startDate')
                .optional()
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),
            
            query('endDate')
                .optional()
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    if (req.query.startDate && value) {
                        const startDate = new Date(req.query.startDate);
                        const endDate = new Date(value);
                        
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        // Limit to 1 year range for reports
                        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
                        if (endDate - startDate > oneYearInMs) {
                            throw new Error('Date range cannot exceed 1 year');
                        }
                    }
                    return true;
                }),
            
            query('projectId')
                .optional()
                .isMongoId()
                .withMessage('Invalid project ID format'),
            
            query('userId')
                .optional()
                .isMongoId()
                .withMessage('Invalid user ID format'),
            
            query('reportType')
                .optional()
                .isIn(['summary', 'daily', 'user', 'project'])
                .withMessage('Report type must be one of: summary, daily, user, project')
        ];
    }

    // Validate get task time summary request
    validateGetTaskTimeSummary() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format')
                .notEmpty()
                .withMessage('Task ID is required')
        ];
    }

    // Validate get workspace time dashboard request
    validateGetWorkspaceTimeDashboard() {
        return [
            param('workspaceId')
                .isMongoId()
                .withMessage('Invalid workspace ID format')
                .notEmpty()
                .withMessage('Workspace ID is required')
        ];
    }

    // Validate bulk time entry operations
    validateBulkTimeEntries() {
        return [
            body('entries')
                .isArray({ min: 1, max: 10 })
                .withMessage('Entries must be an array with 1-10 items'),
            
            body('entries.*.taskId')
                .isMongoId()
                .withMessage('Invalid task ID format in entry'),
            
            body('entries.*.hours')
                .isFloat({ min: 0.1, max: 24 })
                .withMessage('Hours must be between 0.1 and 24 in each entry'),
            
            body('entries.*.date')
                .isISO8601()
                .withMessage('Date must be a valid ISO 8601 date in each entry')
                .custom((value) => {
                    const date = new Date(value);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (date > today) {
                        throw new Error('Cannot log time for future dates');
                    }
                    return true;
                }),
            
            body('entries.*.description')
                .optional()
                .isString()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot be more than 500 characters in each entry'),
            
            body('entries.*.billable')
                .optional()
                .isBoolean()
                .withMessage('Billable must be a boolean value in each entry')
        ];
    }

    // Validate time entry approval (for managers)
    validateApproveTimeEntries() {
        return [
            body('timeEntryIds')
                .isArray({ min: 1 })
                .withMessage('Time entry IDs must be a non-empty array'),
            
            body('timeEntryIds.*')
                .isMongoId()
                .withMessage('Invalid time entry ID format'),
            
            body('approved')
                .isBoolean()
                .withMessage('Approved must be a boolean value'),
            
            body('comment')
                .optional()
                .isString()
                .trim()
                .isLength({ max: 200 })
                .withMessage('Comment cannot be more than 200 characters')
        ];
    }

    // Validate time tracking settings
    validateTimeTrackingSettings() {
        return [
            body('autoStopTimer')
                .optional()
                .isBoolean()
                .withMessage('Auto stop timer must be a boolean value'),
            
            body('defaultBillable')
                .optional()
                .isBoolean()
                .withMessage('Default billable must be a boolean value'),
            
            body('roundingMinutes')
                .optional()
                .isInt({ min: 1, max: 60 })
                .withMessage('Rounding minutes must be between 1 and 60'),
            
            body('requireDescription')
                .optional()
                .isBoolean()
                .withMessage('Require description must be a boolean value'),
            
            body('allowFutureTime')
                .optional()
                .isBoolean()
                .withMessage('Allow future time must be a boolean value'),
            
            body('maxHoursPerDay')
                .optional()
                .isFloat({ min: 1, max: 24 })
                .withMessage('Max hours per day must be between 1 and 24')
        ];
    }

    // Validate export time data request
    validateExportTimeData() {
        return [
            query('format')
                .optional()
                .isIn(['csv', 'pdf', 'excel'])
                .withMessage('Format must be one of: csv, pdf, excel'),
            
            query('startDate')
                .isISO8601()
                .withMessage('Start date is required and must be a valid ISO 8601 date'),
            
            query('endDate')
                .isISO8601()
                .withMessage('End date is required and must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    const startDate = new Date(req.query.startDate);
                    const endDate = new Date(value);
                    
                    if (endDate <= startDate) {
                        throw new Error('End date must be after start date');
                    }
                    
                    // Limit export range to 1 year
                    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
                    if (endDate - startDate > oneYearInMs) {
                        throw new Error('Export date range cannot exceed 1 year');
                    }
                    
                    return true;
                }),
            
            query('projectIds')
                .optional()
                .isArray()
                .withMessage('Project IDs must be an array'),
            
            query('projectIds.*')
                .optional()
                .isMongoId()
                .withMessage('Invalid project ID format'),
            
            query('userIds')
                .optional()
                .isArray()
                .withMessage('User IDs must be an array'),
            
            query('userIds.*')
                .optional()
                .isMongoId()
                .withMessage('Invalid user ID format'),
            
            query('billableOnly')
                .optional()
                .isBoolean()
                .withMessage('Billable only must be a boolean value'),
            
            query('includeDescriptions')
                .optional()
                .isBoolean()
                .withMessage('Include descriptions must be a boolean value')
        ];
    }
}

module.exports = new TimeTrackingValidator();

// Generated by Copilot
