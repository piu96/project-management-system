const progressTrackingService = require('./progress-tracking.service');
const { validationResult } = require('express-validator');

class ProgressTrackingController {
    // Update task progress
    async updateTaskProgress(req, res) {
        try {
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
            const progressData = req.body;

            const result = await progressTrackingService.updateTaskProgress(taskId, userId, progressData);

            const statusCode = result.success ? 200 : 400;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Update task progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred while updating task progress'
            });
        }
    }

    // Get task progress details
    async getTaskProgress(req, res) {
        try {
            const { taskId } = req.params;
            const userId = req.user.id;

            const result = await progressTrackingService.getTaskProgress(taskId, userId);

            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get task progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred while fetching task progress'
            });
        }
    }

    // Get project progress overview
    async getProjectProgress(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.user.id;

            const result = await progressTrackingService.getProjectProgress(projectId, userId);

            const statusCode = result.success ? 200 : 404;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get project progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred while fetching project progress'
            });
        }
    }

    // Get workspace progress dashboard
    async getWorkspaceProgress(req, res) {
        try {
            const { workspaceId } = req.params;
            const userId = req.user.id;

            const result = await progressTrackingService.getWorkspaceProgress(workspaceId, userId);

            const statusCode = result.success ? 200 : 403;
            res.status(statusCode).json(result);

        } catch (error) {
            console.error('Get workspace progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred while fetching workspace progress'
            });
        }
    }

    // Bulk update multiple tasks progress
    async bulkUpdateTasksProgress(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { updates } = req.body;
            const userId = req.user.id;
            const results = [];

            for (const update of updates) {
                const result = await progressTrackingService.updateTaskProgress(
                    update.taskId, 
                    userId, 
                    update.progressData
                );
                results.push({
                    taskId: update.taskId,
                    success: result.success,
                    message: result.message,
                    task: result.task
                });
            }

            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            res.status(200).json({
                success: true,
                message: `Bulk update completed. ${successCount} successful, ${failCount} failed.`,
                results,
                summary: {
                    total: results.length,
                    successful: successCount,
                    failed: failCount
                }
            });

        } catch (error) {
            console.error('Bulk update tasks progress error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred during bulk update'
            });
        }
    }

    // Get progress analytics for a date range
    async getProgressAnalytics(req, res) {
        try {
            const { projectId } = req.params;
            const { startDate, endDate, groupBy = 'day' } = req.query;
            const userId = req.user.id;

            // Validate date range
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }

            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date must be before end date'
                });
            }

            // Get project progress for analytics
            const result = await progressTrackingService.getProjectProgress(projectId, userId);
            
            if (!result.success) {
                return res.status(404).json(result);
            }

            // Generate analytics data
            const analytics = {
                dateRange: { start: startDate, end: endDate },
                groupBy,
                progressOverTime: this.generateProgressTimeline(result.tasksWithProgress, start, end, groupBy),
                velocityAnalytics: this.generateVelocityAnalytics(result.tasksWithProgress, start, end),
                burndownData: this.generateBurndownAnalytics(result.tasksWithProgress, start, end),
                summary: {
                    totalTasks: result.taskStats.total,
                    completedInPeriod: result.tasksWithProgress.filter(t => 
                        t.status === 'done' && 
                        new Date(t.completedDate) >= start && 
                        new Date(t.completedDate) <= end
                    ).length,
                    averageProgress: result.project.progress,
                    timeEfficiency: result.timeStats.timeProgress
                }
            };

            res.status(200).json({
                success: true,
                analytics
            });

        } catch (error) {
            console.error('Get progress analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error occurred while generating analytics'
            });
        }
    }

    // Helper method to generate progress timeline
    generateProgressTimeline(tasks, start, end, groupBy) {
        const timeline = [];
        const current = new Date(start);
        const endDate = new Date(end);

        while (current <= endDate) {
            const periodStart = new Date(current);
            let periodEnd = new Date(current);

            // Set period end based on groupBy
            switch (groupBy) {
                case 'day':
                    periodEnd.setDate(periodEnd.getDate() + 1);
                    break;
                case 'week':
                    periodEnd.setDate(periodEnd.getDate() + 7);
                    break;
                case 'month':
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    break;
                default:
                    periodEnd.setDate(periodEnd.getDate() + 1);
            }

            // Calculate progress for this period
            const completedInPeriod = tasks.filter(task => 
                task.status === 'done' &&
                task.completedDate &&
                new Date(task.completedDate) >= periodStart &&
                new Date(task.completedDate) < periodEnd
            ).length;

            timeline.push({
                period: periodStart.toISOString().split('T')[0],
                tasksCompleted: completedInPeriod,
                cumulativeProgress: tasks.filter(task => 
                    task.status === 'done' &&
                    task.completedDate &&
                    new Date(task.completedDate) < periodEnd
                ).length
            });

            current.setTime(periodEnd.getTime());
        }

        return timeline;
    }

    // Helper method to generate velocity analytics
    generateVelocityAnalytics(tasks, start, end) {
        const completedTasks = tasks.filter(task => 
            task.status === 'done' &&
            task.completedDate &&
            new Date(task.completedDate) >= start &&
            new Date(task.completedDate) <= end
        );

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const velocityPerDay = totalDays > 0 ? completedTasks.length / totalDays : 0;

        return {
            tasksCompletedInPeriod: completedTasks.length,
            averageVelocityPerDay: Math.round(velocityPerDay * 100) / 100,
            totalHoursLogged: completedTasks.reduce((sum, task) => sum + (task.loggedHours || 0), 0),
            averageHoursPerTask: completedTasks.length > 0 
                ? Math.round((completedTasks.reduce((sum, task) => sum + (task.loggedHours || 0), 0) / completedTasks.length) * 100) / 100
                : 0
        };
    }

    // Helper method to generate burndown analytics
    generateBurndownAnalytics(tasks, start, end) {
        const totalTasks = tasks.length;
        const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        
        const completedTasks = tasks.filter(task => 
            task.status === 'done' &&
            task.completedDate &&
            new Date(task.completedDate) <= end
        );

        const remainingTasks = totalTasks - completedTasks.length;
        const completedHours = completedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const remainingHours = totalHours - completedHours;

        return {
            totalScope: {
                tasks: totalTasks,
                hours: totalHours
            },
            completed: {
                tasks: completedTasks.length,
                hours: completedHours
            },
            remaining: {
                tasks: remainingTasks,
                hours: remainingHours
            },
            completionPercentage: {
                tasks: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
                hours: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0
            }
        };
    }
}

module.exports = new ProgressTrackingController();


