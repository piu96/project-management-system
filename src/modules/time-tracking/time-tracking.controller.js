const timeTrackingService = require('./time-tracking.service');
const { validationResult } = require('express-validator');

class TimeTrackingController {
    // Start timer
    async startTimer(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const result = await timeTrackingService.startTimer(userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.timeEntry
            });

        } catch (error) {
            console.error('Start timer controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Stop timer
    async stopTimer(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { timeEntryId } = req.params;

            const result = await timeTrackingService.stopTimer(userId, timeEntryId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.timeEntry
            });

        } catch (error) {
            console.error('Stop timer controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Log time manually
    async logTime(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const result = await timeTrackingService.logTime(userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(201).json({
                success: true,
                message: result.message,
                data: result.timeEntry
            });

        } catch (error) {
            console.error('Log time controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update time entry
    async updateTimeEntry(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { timeEntryId } = req.params;

            const result = await timeTrackingService.updateTimeEntry(timeEntryId, userId, req.body);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.timeEntry
            });

        } catch (error) {
            console.error('Update time entry controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete time entry
    async deleteTimeEntry(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { timeEntryId } = req.params;

            const result = await timeTrackingService.deleteTimeEntry(timeEntryId, userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            console.error('Delete time entry controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user's time entries
    async getUserTimeEntries(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                projectId: req.query.projectId,
                taskId: req.query.taskId,
                billable: req.query.billable,
                page: req.query.page || 1,
                limit: req.query.limit || 20
            };

            const result = await timeTrackingService.getUserTimeEntries(userId, filters);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Time entries retrieved successfully',
                data: result.timeEntries,
                pagination: result.pagination,
                summary: result.summary
            });

        } catch (error) {
            console.error('Get user time entries controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get project time tracking
    async getProjectTimeTracking(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { projectId } = req.params;
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate
            };

            const result = await timeTrackingService.getProjectTimeTracking(projectId, userId, filters);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Project time tracking retrieved successfully',
                data: {
                    project: result.project,
                    summary: result.summary,
                    tasks: result.tasks,
                    totals: result.totals
                }
            });

        } catch (error) {
            console.error('Get project time tracking controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get running timer
    async getRunningTimer(req, res) {
        try {
            const userId = req.user.id;
            const result = await timeTrackingService.getRunningTimer(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Running timer retrieved successfully',
                data: result.runningTimer
            });

        } catch (error) {
            console.error('Get running timer controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get time tracking reports
    async getTimeReports(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { workspaceId } = req.params;
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                projectId: req.query.projectId,
                userId: req.query.userId,
                reportType: req.query.reportType || 'summary'
            };

            const result = await timeTrackingService.getTimeReports(userId, workspaceId, filters);

            if (!result.success) {
                return res.status(403).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Time reports retrieved successfully',
                data: {
                    reportType: result.reportType,
                    data: result.data,
                    filters: result.filters
                }
            });

        } catch (error) {
            console.error('Get time reports controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get task time summary
    async getTaskTimeSummary(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { taskId } = req.params;
            const TimeEntry = require('../../models/TimeEntry');
            const Task = require('../../models/Task');

            // Get task and verify access
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check workspace membership
            const WorkspaceMember = require('../../models/WorkspaceMember');
            const membership = await WorkspaceMember.findOne({
                workspace: task.workspace,
                user: req.user.id,
                status: 'active'
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                });
            }

            // Get time entries for task
            const timeEntries = await TimeEntry.find({ task: taskId })
                .populate('user', 'name email')
                .sort({ date: -1 });

            // Calculate summary
            const summary = {
                totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
                billableHours: timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0),
                entriesCount: timeEntries.length,
                estimatedHours: task.estimatedHours || 0,
                loggedHours: task.loggedHours || 0
            };

            summary.remainingHours = Math.max(0, summary.estimatedHours - summary.loggedHours);
            summary.progress = summary.estimatedHours > 0 
                ? Math.round((summary.loggedHours / summary.estimatedHours) * 100)
                : 0;

            res.status(200).json({
                success: true,
                message: 'Task time summary retrieved successfully',
                data: {
                    task: {
                        id: task._id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        project: task.project
                    },
                    summary,
                    timeEntries
                }
            });

        } catch (error) {
            console.error('Get task time summary controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get workspace time dashboard
    async getWorkspaceTimeDashboard(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { workspaceId } = req.params;

            // Check workspace membership
            const WorkspaceMember = require('../../models/WorkspaceMember');
            const membership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                });
            }

            const TimeEntry = require('../../models/TimeEntry');
            const today = new Date();
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

            // Get this week's data
            const weeklyData = await TimeEntry.aggregate([
                {
                    $match: {
                        workspace: require('mongoose').Types.ObjectId(workspaceId),
                        date: { $gte: startOfWeek, $lte: endOfWeek }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfWeek: '$date' },
                            user: '$user'
                        },
                        totalHours: { $sum: '$hours' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.day',
                        totalHours: { $sum: '$totalHours' },
                        userCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            // Get top performers this week
            const topPerformers = await TimeEntry.aggregate([
                {
                    $match: {
                        workspace: require('mongoose').Types.ObjectId(workspaceId),
                        date: { $gte: startOfWeek, $lte: endOfWeek }
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        totalHours: { $sum: '$hours' },
                        billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $sort: { totalHours: -1 } },
                { $limit: 5 }
            ]);

            res.status(200).json({
                success: true,
                message: 'Workspace time dashboard retrieved successfully',
                data: {
                    weeklyData,
                    topPerformers,
                    period: {
                        startOfWeek,
                        endOfWeek
                    }
                }
            });

        } catch (error) {
            console.error('Get workspace time dashboard controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new TimeTrackingController();

