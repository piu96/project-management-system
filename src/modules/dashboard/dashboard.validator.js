const { param, query } = require('express-validator');

class DashboardValidator {
    // Validate workspace dashboard request
    validateWorkspaceDashboard() {
        return [
            param('workspaceId')
                .isMongoId()
                .withMessage('Invalid workspace ID format')
                .notEmpty()
                .withMessage('Workspace ID is required')
        ];
    }

    // Validate project dashboard request
    validateProjectDashboard() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Invalid project ID format')
                .notEmpty()
                .withMessage('Project ID is required')
        ];
    }

    // Validate dashboard analytics request
    validateDashboardAnalytics() {
        return [
            query('timeframe')
                .optional()
                .isIn(['7d', '30d', '90d', '1y'])
                .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y'),
            
            query('type')
                .optional()
                .isIn(['overview', 'productivity', 'trends'])
                .withMessage('Type must be one of: overview, productivity, trends')
        ];
    }

    // Validate workspace analytics request
    validateWorkspaceAnalytics() {
        return [
            param('workspaceId')
                .isMongoId()
                .withMessage('Invalid workspace ID format')
                .notEmpty()
                .withMessage('Workspace ID is required'),
            
            query('timeframe')
                .optional()
                .isIn(['7d', '30d', '90d', '1y'])
                .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y'),
            
            query('type')
                .optional()
                .isIn(['overview', 'tasks', 'projects', 'members'])
                .withMessage('Type must be one of: overview, tasks, projects, members')
        ];
    }

    // Validate project analytics request
    validateProjectAnalytics() {
        return [
            param('projectId')
                .isMongoId()
                .withMessage('Invalid project ID format')
                .notEmpty()
                .withMessage('Project ID is required'),
            
            query('timeframe')
                .optional()
                .isIn(['7d', '30d', '90d', '1y'])
                .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y'),
            
            query('type')
                .optional()
                .isIn(['overview', 'tasks', 'progress', 'team'])
                .withMessage('Type must be one of: overview, tasks, progress, team')
        ];
    }

    // Validate export dashboard data request
    validateExportDashboard() {
        return [
            query('format')
                .optional()
                .isIn(['json', 'csv', 'pdf'])
                .withMessage('Format must be one of: json, csv, pdf'),
            
            query('sections')
                .optional()
                .isArray()
                .withMessage('Sections must be an array'),
            
            query('sections.*')
                .optional()
                .isIn(['stats', 'tasks', 'projects', 'analytics'])
                .withMessage('Each section must be one of: stats, tasks, projects, analytics'),
            
            query('timeframe')
                .optional()
                .isIn(['7d', '30d', '90d', '1y'])
                .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y')
        ];
    }

    // Validate dashboard settings update
    validateDashboardSettings() {
        return [
            query('widgets')
                .optional()
                .isArray()
                .withMessage('Widgets must be an array'),
            
            query('widgets.*')
                .optional()
                .isIn([
                    'task_stats',
                    'project_stats', 
                    'recent_activity',
                    'upcoming_tasks',
                    'productivity_chart',
                    'team_performance',
                    'calendar',
                    'notifications'
                ])
                .withMessage('Invalid widget type'),
            
            query('layout')
                .optional()
                .isIn(['grid', 'list', 'compact'])
                .withMessage('Layout must be one of: grid, list, compact'),
            
            query('refresh_interval')
                .optional()
                .isInt({ min: 30, max: 3600 })
                .withMessage('Refresh interval must be between 30 and 3600 seconds')
        ];
    }

    // Validate custom date range
    validateCustomDateRange() {
        return [
            query('start_date')
                .optional()
                .isISO8601()
                .withMessage('Start date must be a valid ISO 8601 date'),
            
            query('end_date')
                .optional()
                .isISO8601()
                .withMessage('End date must be a valid ISO 8601 date')
                .custom((value, { req }) => {
                    if (req.query.start_date && value) {
                        const startDate = new Date(req.query.start_date);
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
                })
        ];
    }

    // Validate dashboard filters
    validateDashboardFilters() {
        return [
            query('status')
                .optional()
                .isArray()
                .withMessage('Status must be an array'),
            
            query('status.*')
                .optional()
                .isIn(['todo', 'in_progress', 'review', 'done', 'cancelled'])
                .withMessage('Invalid status value'),
            
            query('priority')
                .optional()
                .isArray()
                .withMessage('Priority must be an array'),
            
            query('priority.*')
                .optional()
                .isIn(['low', 'medium', 'high', 'urgent'])
                .withMessage('Invalid priority value'),
            
            query('assignee')
                .optional()
                .isArray()
                .withMessage('Assignee must be an array'),
            
            query('assignee.*')
                .optional()
                .isMongoId()
                .withMessage('Invalid assignee ID format'),
            
            query('project')
                .optional()
                .isArray()
                .withMessage('Project must be an array'),
            
            query('project.*')
                .optional()
                .isMongoId()
                .withMessage('Invalid project ID format'),
            
            query('tag')
                .optional()
                .isArray()
                .withMessage('Tag must be an array'),
            
            query('tag.*')
                .optional()
                .isString()
                .trim()
                .isLength({ min: 1, max: 50 })
                .withMessage('Tag must be between 1 and 50 characters')
        ];
    }
}

module.exports = new DashboardValidator();

