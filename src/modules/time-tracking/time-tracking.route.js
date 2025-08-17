const express = require('express');
const router = express.Router();
const timeTrackingController = require('./time-tracking.controller');
const timeTrackingValidator = require('./time-tracking.validator');
const authMiddleware = require('../auth/auth.middleware');

// Apply authentication middleware to all time tracking routes
router.use(authMiddleware.authenticateToken);

/**
 * @route   POST /api/time-tracking/timer/start
 * @desc    Start time tracking timer
 * @access  Private
 */
router.post(
    '/timer/start',
    timeTrackingValidator.validateStartTimer(),
    timeTrackingController.startTimer
);

/**
 * @route   PUT /api/time-tracking/timer/:timeEntryId/stop
 * @desc    Stop time tracking timer
 * @access  Private
 */
router.put(
    '/timer/:timeEntryId/stop',
    timeTrackingValidator.validateStopTimer(),
    timeTrackingController.stopTimer
);

/**
 * @route   GET /api/time-tracking/timer/running
 * @desc    Get current running timer
 * @access  Private
 */
router.get('/timer/running', timeTrackingController.getRunningTimer);

/**
 * @route   POST /api/time-tracking/entries
 * @desc    Log time manually
 * @access  Private
 */
router.post(
    '/entries',
    timeTrackingValidator.validateLogTime(),
    timeTrackingController.logTime
);

/**
 * @route   GET /api/time-tracking/entries
 * @desc    Get user's time entries
 * @access  Private
 */
router.get(
    '/entries',
    timeTrackingValidator.validateGetUserTimeEntries(),
    timeTrackingController.getUserTimeEntries
);

/**
 * @route   PUT /api/time-tracking/entries/:timeEntryId
 * @desc    Update time entry
 * @access  Private
 */
router.put(
    '/entries/:timeEntryId',
    timeTrackingValidator.validateUpdateTimeEntry(),
    timeTrackingController.updateTimeEntry
);

/**
 * @route   DELETE /api/time-tracking/entries/:timeEntryId
 * @desc    Delete time entry
 * @access  Private
 */
router.delete(
    '/entries/:timeEntryId',
    timeTrackingValidator.validateDeleteTimeEntry(),
    timeTrackingController.deleteTimeEntry
);

/**
 * @route   GET /api/time-tracking/projects/:projectId
 * @desc    Get project time tracking summary
 * @access  Private
 */
router.get(
    '/projects/:projectId',
    timeTrackingValidator.validateGetProjectTimeTracking(),
    timeTrackingController.getProjectTimeTracking
);

/**
 * @route   GET /api/time-tracking/tasks/:taskId
 * @desc    Get task time summary
 * @access  Private
 */
router.get(
    '/tasks/:taskId',
    timeTrackingValidator.validateGetTaskTimeSummary(),
    timeTrackingController.getTaskTimeSummary
);

/**
 * @route   GET /api/time-tracking/workspaces/:workspaceId/reports
 * @desc    Get time tracking reports for workspace
 * @access  Private
 */
router.get(
    '/workspaces/:workspaceId/reports',
    timeTrackingValidator.validateGetTimeReports(),
    timeTrackingController.getTimeReports
);

/**
 * @route   GET /api/time-tracking/workspaces/:workspaceId/dashboard
 * @desc    Get workspace time tracking dashboard
 * @access  Private
 */
router.get(
    '/workspaces/:workspaceId/dashboard',
    timeTrackingValidator.validateGetWorkspaceTimeDashboard(),
    timeTrackingController.getWorkspaceTimeDashboard
);

/**
 * @route   POST /api/time-tracking/entries/bulk
 * @desc    Bulk create time entries
 * @access  Private
 */
router.post(
    '/entries/bulk',
    timeTrackingValidator.validateBulkTimeEntries(),
    async (req, res) => {
        try {
            const { entries } = req.body;
            const userId = req.user.id;
            const results = [];
            const timeTrackingService = require('./time-tracking.service');

            for (const entryData of entries) {
                const result = await timeTrackingService.logTime(userId, entryData);
                results.push({
                    entry: entryData,
                    success: result.success,
                    message: result.message,
                    timeEntry: result.timeEntry || null
                });
            }

            const successCount = results.filter(r => r.success).length;
            const failedCount = results.length - successCount;

            res.status(200).json({
                success: true,
                message: `Bulk time entry completed. ${successCount} successful, ${failedCount} failed.`,
                data: {
                    results,
                    summary: {
                        total: results.length,
                        successful: successCount,
                        failed: failedCount
                    }
                }
            });

        } catch (error) {
            console.error('Bulk time entries error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   PUT /api/time-tracking/entries/approve
 * @desc    Approve or reject time entries (managers only)
 * @access  Private
 */
router.put(
    '/entries/approve',
    timeTrackingValidator.validateApproveTimeEntries(),
    async (req, res) => {
        try {
            const { timeEntryIds, approved, comment } = req.body;
            const userId = req.user.id;
            const TimeEntry = require('../../models/TimeEntry');
            const WorkspaceMember = require('../../models/WorkspaceMember');

            // Check if user has manager permissions
            const results = [];

            for (const entryId of timeEntryIds) {
                try {
                    const timeEntry = await TimeEntry.findById(entryId).populate('workspace');
                    
                    if (!timeEntry) {
                        results.push({
                            entryId,
                            success: false,
                            message: 'Time entry not found'
                        });
                        continue;
                    }

                    // Check if user is workspace admin or project manager
                    const membership = await WorkspaceMember.findOne({
                        workspace: timeEntry.workspace,
                        user: userId,
                        status: 'active'
                    });

                    if (!membership || !['workspace_admin', 'project_manager'].includes(membership.role)) {
                        results.push({
                            entryId,
                            success: false,
                            message: 'Insufficient permissions to approve time entries'
                        });
                        continue;
                    }

                    // Update approval status
                    timeEntry.approved = {
                        isApproved: approved,
                        approvedBy: userId,
                        approvedAt: new Date(),
                        comment: comment || ''
                    };

                    await timeEntry.save();

                    results.push({
                        entryId,
                        success: true,
                        message: `Time entry ${approved ? 'approved' : 'rejected'} successfully`
                    });

                } catch (error) {
                    results.push({
                        entryId,
                        success: false,
                        message: 'Failed to process time entry'
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            res.status(200).json({
                success: true,
                message: `Time entry approval completed. ${successCount}/${results.length} entries processed.`,
                data: results
            });

        } catch (error) {
            console.error('Approve time entries error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   GET /api/time-tracking/workspaces/:workspaceId/export
 * @desc    Export time tracking data
 * @access  Private
 */
router.get(
    '/workspaces/:workspaceId/export',
    timeTrackingValidator.validateExportTimeData(),
    async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const userId = req.user.id;
            const {
                format = 'csv',
                startDate,
                endDate,
                projectIds,
                userIds,
                billableOnly,
                includeDescriptions
            } = req.query;

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
            const mongoose = require('mongoose');

            // Build export query
            const query = {
                workspace: mongoose.Types.ObjectId(workspaceId),
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            if (projectIds && projectIds.length > 0) {
                query.project = { $in: projectIds.map(id => mongoose.Types.ObjectId(id)) };
            }

            if (userIds && userIds.length > 0) {
                query.user = { $in: userIds.map(id => mongoose.Types.ObjectId(id)) };
            }

            if (billableOnly === 'true') {
                query.billable = true;
            }

            // Get time entries
            const timeEntries = await TimeEntry.find(query)
                .populate('user', 'name email')
                .populate('task', 'title')
                .populate('project', 'name')
                .sort({ date: 1, createdAt: 1 });

            if (format === 'csv') {
                // Generate CSV
                let csv = 'Date,User,Project,Task,Hours,Billable';
                if (includeDescriptions === 'true') {
                    csv += ',Description';
                }
                csv += '\n';

                timeEntries.forEach(entry => {
                    const row = [
                        entry.date.toISOString().split('T')[0],
                        entry.user.name,
                        entry.project.name,
                        entry.task.title,
                        entry.hours,
                        entry.billable ? 'Yes' : 'No'
                    ];

                    if (includeDescriptions === 'true') {
                        row.push(`"${entry.description || ''}"`);
                    }

                    csv += row.join(',') + '\n';
                });

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=time-entries-${startDate}-to-${endDate}.csv`);
                res.status(200).send(csv);
            } else {
                // Return JSON data for other formats
                res.status(200).json({
                    success: true,
                    message: 'Time tracking data exported successfully',
                    data: {
                        timeEntries,
                        summary: {
                            totalEntries: timeEntries.length,
                            totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
                            billableHours: timeEntries.filter(e => e.billable).reduce((sum, entry) => sum + entry.hours, 0)
                        },
                        filters: req.query
                    }
                });
            }

        } catch (error) {
            console.error('Export time data error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
);

/**
 * @route   GET /api/time-tracking/my-summary
 * @desc    Get current user's time tracking summary
 * @access  Private
 */
router.get('/my-summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'week' } = req.query;

        const TimeEntry = require('../../models/TimeEntry');
        const today = new Date();
        let startDate, endDate;

        // Calculate period dates
        switch (period) {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(today.setDate(today.getDate() - today.getDay()));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today.setDate(today.getDate() - today.getDay() + 6));
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(today.setDate(today.getDate() - today.getDay()));
                endDate = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        }

        // Get summary data
        const summary = await TimeEntry.getUserTotalHours(userId, startDate, endDate);

        // Get recent entries
        const recentEntries = await TimeEntry.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        })
        .populate('task', 'title')
        .populate('project', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(10);

        res.status(200).json({
            success: true,
            message: 'User time summary retrieved successfully',
            data: {
                period,
                summary,
                recentEntries,
                dateRange: { startDate, endDate }
            }
        });

    } catch (error) {
        console.error('Get user time summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;

