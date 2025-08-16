const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const dashboardValidator = require('./dashboard.validator');
const authMiddleware = require('../auth/auth.middleware');

// Apply authentication middleware to all dashboard routes
router.use(authMiddleware.authenticateToken);

/**
 * @route   GET /api/dashboard
 * @desc    Get user dashboard overview
 * @access  Private
 */
router.get('/', dashboardController.getUserDashboard);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get dashboard analytics data
 * @access  Private
 */
router.get(
    '/analytics',
    dashboardValidator.validateDashboardAnalytics(),
    dashboardController.getDashboardAnalytics
);

/**
 * @route   GET /api/dashboard/workspace/:workspaceId
 * @desc    Get workspace dashboard
 * @access  Private
 */
router.get(
    '/workspace/:workspaceId',
    dashboardValidator.validateWorkspaceDashboard(),
    dashboardController.getWorkspaceDashboard
);

/**
 * @route   GET /api/dashboard/project/:projectId
 * @desc    Get project dashboard
 * @access  Private
 */
router.get(
    '/project/:projectId',
    dashboardValidator.validateProjectDashboard(),
    dashboardController.getProjectDashboard
);

/**
 * @route   GET /api/dashboard/workspace/:workspaceId/analytics
 * @desc    Get workspace analytics
 * @access  Private
 */
router.get(
    '/workspace/:workspaceId/analytics',
    dashboardValidator.validateWorkspaceAnalytics(),
    async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const userId = req.user.id;
            const { timeframe = '30d', type = 'overview' } = req.query;

            // Get workspace analytics
            const analytics = await getWorkspaceAnalytics(workspaceId, userId, timeframe, type);

            res.status(200).json({
                success: true,
                message: 'Workspace analytics retrieved successfully',
                data: analytics
            });

        } catch (error) {
            console.error('Get workspace analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   GET /api/dashboard/project/:projectId/analytics
 * @desc    Get project analytics
 * @access  Private
 */
router.get(
    '/project/:projectId/analytics',
    dashboardValidator.validateProjectAnalytics(),
    async (req, res) => {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;
            const { timeframe = '30d', type = 'overview' } = req.query;

            // Get project analytics
            const analytics = await getProjectAnalytics(projectId, userId, timeframe, type);

            res.status(200).json({
                success: true,
                message: 'Project analytics retrieved successfully',
                data: analytics
            });

        } catch (error) {
            console.error('Get project analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   GET /api/dashboard/export
 * @desc    Export dashboard data
 * @access  Private
 */
router.get(
    '/export',
    dashboardValidator.validateExportDashboard(),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const { format = 'json', sections = ['stats'], timeframe = '30d' } = req.query;

            // Export dashboard data
            const exportData = await exportDashboardData(userId, format, sections, timeframe);

            if (format === 'json') {
                res.status(200).json({
                    success: true,
                    message: 'Dashboard data exported successfully',
                    data: exportData
                });
            } else if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.csv');
                res.status(200).send(exportData);
            } else if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.pdf');
                res.status(200).send(exportData);
            }

        } catch (error) {
            console.error('Export dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   POST /api/dashboard/settings
 * @desc    Update dashboard settings
 * @access  Private
 */
router.post(
    '/settings',
    dashboardValidator.validateDashboardSettings(),
    async (req, res) => {
        try {
            const userId = req.user.id;
            const settings = req.body;

            // Update dashboard settings
            const updatedSettings = await updateDashboardSettings(userId, settings);

            res.status(200).json({
                success: true,
                message: 'Dashboard settings updated successfully',
                data: updatedSettings
            });

        } catch (error) {
            console.error('Update dashboard settings error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

// Helper functions for advanced features
async function getWorkspaceAnalytics(workspaceId, userId, timeframe, type) {
    // Implementation for workspace-specific analytics
    const WorkspaceMember = require('../../models/WorkspaceMember');
    const Task = require('../../models/Task');
    const Project = require('../../models/Project');

    // Check workspace access
    const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: 'active'
    });

    if (!membership) {
        throw new Error('Access denied');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
        case '7d': startDate.setDate(startDate.getDate() - 7); break;
        case '30d': startDate.setDate(startDate.getDate() - 30); break;
        case '90d': startDate.setDate(startDate.getDate() - 90); break;
        case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    if (type === 'tasks') {
        // Task analytics for workspace
        return await Task.aggregate([
            { $match: { workspace: workspaceId, createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    created: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    } else if (type === 'projects') {
        // Project analytics for workspace
        return await Project.aggregate([
            { $match: { workspace: workspaceId, createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
    } else {
        // Overview analytics
        const [taskCount, projectCount, memberCount] = await Promise.all([
            Task.countDocuments({ workspace: workspaceId }),
            Project.countDocuments({ workspace: workspaceId }),
            WorkspaceMember.countDocuments({ workspace: workspaceId, status: 'active' })
        ]);

        return { taskCount, projectCount, memberCount };
    }
}

async function getProjectAnalytics(projectId, userId, timeframe, type) {
    // Implementation for project-specific analytics
    const Task = require('../../models/Task');
    const Project = require('../../models/Project');
    const WorkspaceMember = require('../../models/WorkspaceMember');

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    const membership = await WorkspaceMember.findOne({
        workspace: project.workspace,
        user: userId,
        status: 'active'
    });

    if (!membership) {
        throw new Error('Access denied');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
        case '7d': startDate.setDate(startDate.getDate() - 7); break;
        case '30d': startDate.setDate(startDate.getDate() - 30); break;
        case '90d': startDate.setDate(startDate.getDate() - 90); break;
        case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    if (type === 'tasks') {
        // Task timeline for project
        return await Task.aggregate([
            { $match: { project: project._id, createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    created: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    } else if (type === 'progress') {
        // Project progress over time
        return {
            totalTasks: await Task.countDocuments({ project: project._id }),
            completedTasks: await Task.countDocuments({ project: project._id, status: 'done' }),
            progress: project.progress
        };
    } else {
        // Overview analytics
        const taskStats = await Task.aggregate([
            { $match: { project: project._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            project: {
                name: project.name,
                status: project.status,
                progress: project.progress
            },
            tasks: taskStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };
    }
}

async function exportDashboardData(userId, format, sections, timeframe) {
    // Implementation for data export
    const dashboardService = require('./dashboard.service');
    
    const data = {};
    
    if (sections.includes('stats')) {
        const dashboard = await dashboardService.getUserDashboard(userId);
        data.stats = dashboard.dashboard?.stats || {};
    }
    
    if (format === 'json') {
        return data;
    } else if (format === 'csv') {
        // Convert to CSV format
        let csv = 'Type,Metric,Value\n';
        if (data.stats?.tasks) {
            Object.entries(data.stats.tasks).forEach(([key, value]) => {
                csv += `Task,${key},${value}\n`;
            });
        }
        if (data.stats?.projects) {
            Object.entries(data.stats.projects).forEach(([key, value]) => {
                csv += `Project,${key},${value}\n`;
            });
        }
        return csv;
    }
    
    return data;
}

async function updateDashboardSettings(userId, settings) {
    // Implementation for dashboard settings update
    const User = require('../../models/User');
    
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    // Update user dashboard preferences
    if (!user.preferences) {
        user.preferences = {};
    }
    
    user.preferences.dashboard = {
        ...user.preferences.dashboard,
        ...settings
    };
    
    await user.save();
    
    return user.preferences.dashboard;
}

module.exports = router;

// Generated by Copilot
