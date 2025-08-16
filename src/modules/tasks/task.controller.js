const { validationResult } = require('express-validator');
const taskService = require('./task.service');

class TaskController {
    // Create new task
    async createTaskHandler(req, res) {
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
            const result = await taskService.createTask(userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);

        } catch (error) {
            console.error('Create task handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get task details
    async getTaskDetailsHandler(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await taskService.getTaskDetails(taskId, userId);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Get task details handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update task
    async updateTaskHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await taskService.updateTask(taskId, userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Update task handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete task
    async deleteTaskHandler(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await taskService.deleteTask(taskId, userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Delete task handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // List project tasks
    async listProjectTasksHandler(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;
            
            // Extract query parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            // Extract filters
            const filters = {};
            if (req.query.status) filters.status = req.query.status.split(',');
            if (req.query.priority) filters.priority = req.query.priority.split(',');
            if (req.query.type) filters.type = req.query.type.split(',');
            if (req.query.assignee) filters.assignee = req.query.assignee;
            if (req.query.reporter) filters.reporter = req.query.reporter;
            if (req.query.tags) filters.tags = req.query.tags.split(',');
            if (req.query.search) filters.search = req.query.search;
            if (req.query.sortBy) filters.sortBy = req.query.sortBy;
            if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder;
            
            // Date filters
            if (req.query.dueDateFrom || req.query.dueDateTo) {
                filters.dueDate = {};
                if (req.query.dueDateFrom) filters.dueDate.from = req.query.dueDateFrom;
                if (req.query.dueDateTo) filters.dueDate.to = req.query.dueDateTo;
            }

            const result = await taskService.listProjectTasks(projectId, userId, filters, page, limit);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('List project tasks handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Add time entry
    async addTimeEntryHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await taskService.addTimeEntry(taskId, userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);

        } catch (error) {
            console.error('Add time entry handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Add comment
    async addCommentHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await taskService.addComment(taskId, userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);

        } catch (error) {
            console.error('Add comment handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Add watcher
    async addWatcherHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;
            const { userId: watcherUserId } = req.body;

            const result = await taskService.addWatcher(taskId, userId, watcherUserId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(201).json(result);

        } catch (error) {
            console.error('Add watcher handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Remove watcher
    async removeWatcherHandler(req, res) {
        try {
            const { taskId, watcherUserId } = req.params;
            const userId = req.user.id;

            const result = await taskService.removeWatcher(taskId, userId, watcherUserId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Remove watcher handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user tasks
    async getUserTasksHandler(req, res) {
        try {
            const userId = req.user.id;
            
            // Extract query parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            
            // Extract filters
            const filters = {};
            if (req.query.assignedToMe === 'true') filters.assignedToMe = true;
            if (req.query.reportedByMe === 'true') filters.reportedByMe = true;
            if (req.query.watchedByMe === 'true') filters.watchedByMe = true;
            if (req.query.status) filters.status = req.query.status.split(',');
            if (req.query.priority) filters.priority = req.query.priority.split(',');
            if (req.query.overdue === 'true') filters.overdue = true;

            const result = await taskService.getUserTasks(userId, filters, page, limit);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Get user tasks handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update task status
    async updateTaskStatusHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;
            const { status } = req.body;

            const result = await taskService.updateTask(taskId, userId, { status });

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Update task status handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Assign task
    async assignTaskHandler(req, res) {
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

            const { taskId } = req.params;
            const userId = req.user.id;
            const { assignee } = req.body;

            const result = await taskService.updateTask(taskId, userId, { assignee });

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Assign task handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get task statistics
    async getTaskStatsHandler(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            // This would be implemented to get task statistics
            // For now, return a placeholder response
            return res.status(200).json({
                success: true,
                message: 'Task statistics endpoint - to be implemented',
                stats: {
                    total: 0,
                    todo: 0,
                    inProgress: 0,
                    review: 0,
                    done: 0,
                    cancelled: 0
                }
            });

        } catch (error) {
            console.error('Get task stats handler error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new TaskController();

// Generated by Copilot
