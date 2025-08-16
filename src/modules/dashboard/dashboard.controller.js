const dashboardService = require('./dashboard.service');
const { validationResult } = require('express-validator');

class DashboardController {
    // Get user dashboard
    async getUserDashboard(req, res) {
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
            const result = await dashboardService.getUserDashboard(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'User dashboard retrieved successfully',
                data: result.dashboard
            });

        } catch (error) {
            console.error('Get user dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get workspace dashboard
    async getWorkspaceDashboard(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { workspaceId } = req.params;
            const userId = req.user.id;

            const result = await dashboardService.getWorkspaceDashboard(workspaceId, userId);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 404).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Workspace dashboard retrieved successfully',
                data: result.dashboard
            });

        } catch (error) {
            console.error('Get workspace dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get project dashboard
    async getProjectDashboard(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { projectId } = req.params;
            const userId = req.user.id;

            const result = await dashboardService.getProjectDashboard(projectId, userId);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 404).json(result);
            }

            res.status(200).json({
                success: true,
                message: 'Project dashboard retrieved successfully',
                data: result.dashboard
            });

        } catch (error) {
            console.error('Get project dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get dashboard analytics
    async getDashboardAnalytics(req, res) {
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
            const { timeframe = '30d', type = 'overview' } = req.query;

            // Get analytics data based on timeframe and type
            const analytics = await this.getAnalyticsData(userId, timeframe, type);

            res.status(200).json({
                success: true,
                message: 'Dashboard analytics retrieved successfully',
                data: analytics
            });

        } catch (error) {
            console.error('Get dashboard analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Helper method to get analytics data
    async getAnalyticsData(userId, timeframe, type) {
        try {
            // Calculate date range based on timeframe
            const endDate = new Date();
            let startDate = new Date();

            switch (timeframe) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 30);
            }

            // Get user's workspace memberships
            const WorkspaceMember = require('../../models/WorkspaceMember');
            const memberships = await WorkspaceMember.find({
                user: userId,
                status: 'active'
            });

            const workspaceIds = memberships.map(m => m.workspace);

            if (type === 'productivity') {
                return await this.getProductivityAnalytics(userId, workspaceIds, startDate, endDate);
            } else if (type === 'trends') {
                return await this.getTrendAnalytics(userId, workspaceIds, startDate, endDate);
            } else {
                return await this.getOverviewAnalytics(userId, workspaceIds, startDate, endDate);
            }

        } catch (error) {
            console.error('Get analytics data error:', error);
            return {
                timeframe,
                type,
                data: {}
            };
        }
    }

    // Get overview analytics
    async getOverviewAnalytics(userId, workspaceIds, startDate, endDate) {
        try {
            const Task = require('../../models/Task');
            const Project = require('../../models/Project');

            const [
                tasksCreated,
                tasksCompleted,
                projectsCreated,
                activeProjects
            ] = await Promise.all([
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    status: 'done',
                    updatedAt: { $gte: startDate, $lte: endDate }
                }),
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    'members.user': userId,
                    status: 'active',
                    'archived.isArchived': false
                })
            ]);

            return {
                overview: {
                    tasksCreated,
                    tasksCompleted,
                    projectsCreated,
                    activeProjects,
                    productivity: tasksCompleted > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0
                }
            };

        } catch (error) {
            console.error('Get overview analytics error:', error);
            return { overview: {} };
        }
    }

    // Get productivity analytics
    async getProductivityAnalytics(userId, workspaceIds, startDate, endDate) {
        try {
            const Task = require('../../models/Task');

            // Get daily task completion data
            const dailyCompletions = await Task.aggregate([
                {
                    $match: {
                        workspace: { $in: workspaceIds },
                        assignee: userId,
                        status: 'done',
                        updatedAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$updatedAt' },
                            month: { $month: '$updatedAt' },
                            day: { $dayOfMonth: '$updatedAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
                }
            ]);

            // Get task completion by priority
            const completionsByPriority = await Task.aggregate([
                {
                    $match: {
                        workspace: { $in: workspaceIds },
                        assignee: userId,
                        status: 'done',
                        updatedAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                }
            ]);

            return {
                productivity: {
                    dailyCompletions,
                    completionsByPriority: completionsByPriority.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                }
            };

        } catch (error) {
            console.error('Get productivity analytics error:', error);
            return { productivity: {} };
        }
    }

    // Get trend analytics
    async getTrendAnalytics(userId, workspaceIds, startDate, endDate) {
        try {
            const Task = require('../../models/Task');
            const Project = require('../../models/Project');

            // Get monthly trends
            const [taskTrends, projectTrends] = await Promise.all([
                Task.aggregate([
                    {
                        $match: {
                            workspace: { $in: workspaceIds },
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            created: { $sum: 1 },
                            completed: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'done'] }, 1, 0]
                                }
                            }
                        }
                    },
                    {
                        $sort: { '_id.year': 1, '_id.month': 1 }
                    }
                ]),
                Project.aggregate([
                    {
                        $match: {
                            workspace: { $in: workspaceIds },
                            createdAt: { $gte: startDate, $lte: endDate }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            created: { $sum: 1 },
                            completed: {
                                $sum: {
                                    $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                                }
                            }
                        }
                    },
                    {
                        $sort: { '_id.year': 1, '_id.month': 1 }
                    }
                ])
            ]);

            return {
                trends: {
                    tasks: taskTrends,
                    projects: projectTrends
                }
            };

        } catch (error) {
            console.error('Get trend analytics error:', error);
            return { trends: {} };
        }
    }
}

module.exports = new DashboardController();

// Generated by Copilot
