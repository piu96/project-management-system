const { body, param, query } = require('express-validator');

class TaskValidator {
    // Validation for creating task
    static createTaskValidation() {
        return [
            body('projectId')
                .notEmpty()
                .withMessage('Project ID is required')
                .isMongoId()
                .withMessage('Invalid project ID format'),
            
            body('title')
                .notEmpty()
                .withMessage('Task title is required')
                .isLength({ min: 1, max: 200 })
                .withMessage('Title must be between 1 and 200 characters')
                .trim(),
            
            body('description')
                .optional()
                .isLength({ max: 2000 })
                .withMessage('Description cannot be more than 2000 characters')
                .trim(),
            
            body('status')
                .optional()
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status. Must be one of: todo, in_progress, review, done, cancelled'),
            
            body('priority')
                .optional()
                .isIn(['low', 'medium', 'high', 'critical'])
                .withMessage('Invalid priority. Must be one of: low, medium, high, critical'),
            
            body('type')
                .optional()
                .isIn(['task', 'bug', 'feature', 'story', 'epic'])
                .withMessage('Invalid type. Must be one of: task, bug, feature, story, epic'),
            
            body('assignee')
                .optional()
                .isMongoId()
                .withMessage('Invalid assignee ID format'),
            
            body('dueDate')
                .optional()
                .isISO8601()
                .withMessage('Invalid due date format. Use ISO 8601 format'),
            
            body('startDate')
                .optional()
                .isISO8601()
                .withMessage('Invalid start date format. Use ISO 8601 format'),
            
            body('estimatedHours')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Estimated hours must be a positive number'),
            
            body('tags')
                .optional()
                .isArray()
                .withMessage('Tags must be an array'),
            
            body('tags.*')
                .optional()
                .isString()
                .withMessage('Each tag must be a string')
                .isLength({ min: 1, max: 50 })
                .withMessage('Each tag must be between 1 and 50 characters')
        ];
    }

    // Validation for updating task
    static updateTaskValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('title')
                .optional()
                .isLength({ min: 1, max: 200 })
                .withMessage('Title must be between 1 and 200 characters')
                .trim(),
            
            body('description')
                .optional()
                .isLength({ max: 2000 })
                .withMessage('Description cannot be more than 2000 characters')
                .trim(),
            
            body('status')
                .optional()
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status. Must be one of: todo, in_progress, review, done, cancelled'),
            
            body('priority')
                .optional()
                .isIn(['low', 'medium', 'high', 'critical'])
                .withMessage('Invalid priority. Must be one of: low, medium, high, critical'),
            
            body('type')
                .optional()
                .isIn(['task', 'bug', 'feature', 'story', 'epic'])
                .withMessage('Invalid type. Must be one of: task, bug, feature, story, epic'),
            
            body('assignee')
                .optional()
                .custom((value) => {
                    if (value === null || value === '') return true;
                    return /^[0-9a-fA-F]{24}$/.test(value);
                })
                .withMessage('Invalid assignee ID format'),
            
            body('dueDate')
                .optional()
                .custom((value) => {
                    if (value === null || value === '') return true;
                    return new Date(value).toString() !== 'Invalid Date';
                })
                .withMessage('Invalid due date format'),
            
            body('startDate')
                .optional()
                .custom((value) => {
                    if (value === null || value === '') return true;
                    return new Date(value).toString() !== 'Invalid Date';
                })
                .withMessage('Invalid start date format'),
            
            body('estimatedHours')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('Estimated hours must be a positive number'),
            
            body('progress')
                .optional()
                .isInt({ min: 0, max: 100 })
                .withMessage('Progress must be between 0 and 100'),
            
            body('tags')
                .optional()
                .isArray()
                .withMessage('Tags must be an array')
        ];
    }

    // Validation for task ID parameter
    static taskIdValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format')
        ];
    }

    // Validation for project ID parameter
    static projectIdValidation() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Invalid project ID format')
        ];
    }

    // Validation for adding time entry
    static addTimeEntryValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('hours')
                .notEmpty()
                .withMessage('Hours is required')
                .isFloat({ min: 0.1, max: 24 })
                .withMessage('Hours must be between 0.1 and 24'),
            
            body('description')
                .optional()
                .isLength({ max: 500 })
                .withMessage('Description cannot be more than 500 characters')
                .trim(),
            
            body('date')
                .optional()
                .isISO8601()
                .withMessage('Invalid date format. Use ISO 8601 format')
                .custom((value) => {
                    const date = new Date(value);
                    const now = new Date();
                    if (date > now) {
                        throw new Error('Date cannot be in the future');
                    }
                    return true;
                })
        ];
    }

    // Validation for adding comment
    static addCommentValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('content')
                .notEmpty()
                .withMessage('Comment content is required')
                .isLength({ min: 1, max: 1000 })
                .withMessage('Comment must be between 1 and 1000 characters')
                .trim()
        ];
    }

    // Validation for adding watcher
    static addWatcherValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('userId')
                .notEmpty()
                .withMessage('User ID is required')
                .isMongoId()
                .withMessage('Invalid user ID format')
        ];
    }

    // Validation for removing watcher
    static removeWatcherValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            param('watcherUserId')
                .isMongoId()
                .withMessage('Invalid watcher user ID format')
        ];
    }

    // Validation for updating task status
    static updateStatusValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('status')
                .notEmpty()
                .withMessage('Status is required')
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status. Must be one of: todo, in_progress, review, done, cancelled')
        ];
    }

    // Validation for assigning task
    static assignTaskValidation() {
        return [
            param('taskId')
                .isMongoId()
                .withMessage('Invalid task ID format'),
            
            body('assignee')
                .custom((value) => {
                    if (value === null || value === '' || value === undefined) return true;
                    return /^[0-9a-fA-F]{24}$/.test(value);
                })
                .withMessage('Invalid assignee ID format')
        ];
    }

    // Validation for listing tasks query parameters
    static listTasksQueryValidation() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            
            query('status')
                .optional()
                .custom((value) => {
                    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
                    const statuses = value.split(',');
                    return statuses.every(status => validStatuses.includes(status));
                })
                .withMessage('Invalid status filter'),
            
            query('priority')
                .optional()
                .custom((value) => {
                    const validPriorities = ['low', 'medium', 'high', 'critical'];
                    const priorities = value.split(',');
                    return priorities.every(priority => validPriorities.includes(priority));
                })
                .withMessage('Invalid priority filter'),
            
            query('type')
                .optional()
                .custom((value) => {
                    const validTypes = ['task', 'bug', 'feature', 'story', 'epic'];
                    const types = value.split(',');
                    return types.every(type => validTypes.includes(type));
                })
                .withMessage('Invalid type filter'),
            
            query('assignee')
                .optional()
                .isMongoId()
                .withMessage('Invalid assignee ID format'),
            
            query('reporter')
                .optional()
                .isMongoId()
                .withMessage('Invalid reporter ID format'),
            
            query('search')
                .optional()
                .isLength({ min: 1, max: 100 })
                .withMessage('Search query must be between 1 and 100 characters'),
            
            query('sortBy')
                .optional()
                .isIn(['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'])
                .withMessage('Invalid sort field'),
            
            query('sortOrder')
                .optional()
                .isIn(['asc', 'desc'])
                .withMessage('Sort order must be asc or desc'),
            
            query('dueDateFrom')
                .optional()
                .isISO8601()
                .withMessage('Invalid due date from format'),
            
            query('dueDateTo')
                .optional()
                .isISO8601()
                .withMessage('Invalid due date to format')
        ];
    }

    // Validation for user tasks query parameters
    static userTasksQueryValidation() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            
            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            
            query('assignedToMe')
                .optional()
                .isBoolean()
                .withMessage('assignedToMe must be a boolean'),
            
            query('reportedByMe')
                .optional()
                .isBoolean()
                .withMessage('reportedByMe must be a boolean'),
            
            query('watchedByMe')
                .optional()
                .isBoolean()
                .withMessage('watchedByMe must be a boolean'),
            
            query('status')
                .optional()
                .custom((value) => {
                    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'cancelled'];
                    const statuses = value.split(',');
                    return statuses.every(status => validStatuses.includes(status));
                })
                .withMessage('Invalid status filter'),
            
            query('priority')
                .optional()
                .custom((value) => {
                    const validPriorities = ['low', 'medium', 'high', 'critical'];
                    const priorities = value.split(',');
                    return priorities.every(priority => validPriorities.includes(priority));
                })
                .withMessage('Invalid priority filter'),
            
            query('overdue')
                .optional()
                .isBoolean()
                .withMessage('overdue must be a boolean')
        ];
    }
}

module.exports = TaskValidator;

// Generated by Copilot
