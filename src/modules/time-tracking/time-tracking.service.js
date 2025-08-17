const TimeEntry = require('../../models/TimeEntry');
const Task = require('../../models/Task');
const Project = require('../../models/Project');
const WorkspaceMember = require('../../models/WorkspaceMember');
const mongoose = require('mongoose');

class TimeTrackingService {
    // Start time tracking (timer)
    async startTimer(userId, data) {
        try {
            const { taskId, description } = data;

            // Get task details
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check workspace membership
            const membership = await WorkspaceMember.findOne({
                workspace: task.workspace,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                };
            }

            // Check if user already has a running timer
            const runningTimer = await TimeEntry.findOne({
                user: userId,
                isRunning: true
            });

            if (runningTimer) {
                return {
                    success: false,
                    message: 'You already have a running timer. Please stop it before starting a new one.',
                    runningTimer: {
                        id: runningTimer._id,
                        task: runningTimer.task,
                        startTime: runningTimer.startTime,
                        description: runningTimer.description
                    }
                };
            }

            // Create new timer entry
            const timeEntry = new TimeEntry({
                user: userId,
                task: taskId,
                project: task.project._id,
                workspace: task.workspace,
                description: description || '',
                startTime: new Date(),
                isRunning: true,
                hours: 0,
                date: new Date()
            });

            await timeEntry.save();

            return {
                success: true,
                message: 'Timer started successfully',
                timeEntry: {
                    id: timeEntry._id,
                    task: task,
                    project: task.project,
                    startTime: timeEntry.startTime,
                    description: timeEntry.description,
                    isRunning: timeEntry.isRunning
                }
            };

        } catch (error) {
            console.error('Start timer error:', error);
            return {
                success: false,
                message: 'Failed to start timer'
            };
        }
    }

    // Stop time tracking (timer)
    async stopTimer(userId, timeEntryId) {
        try {
            const timeEntry = await TimeEntry.findOne({
                _id: timeEntryId,
                user: userId,
                isRunning: true
            }).populate('task project');

            if (!timeEntry) {
                return {
                    success: false,
                    message: 'Running timer not found'
                };
            }

            // Calculate elapsed time
            const endTime = new Date();
            const startTime = new Date(timeEntry.startTime);
            const elapsedMs = endTime - startTime;
            const elapsedHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places

            // Update time entry
            timeEntry.endTime = endTime;
            timeEntry.hours = elapsedHours;
            timeEntry.isRunning = false;

            await timeEntry.save();

            // Update task logged hours
            if (timeEntry.task) {
                timeEntry.task.loggedHours = (timeEntry.task.loggedHours || 0) + elapsedHours;
                await timeEntry.task.save();
            }

            return {
                success: true,
                message: 'Timer stopped successfully',
                timeEntry: {
                    id: timeEntry._id,
                    hours: timeEntry.hours,
                    startTime: timeEntry.startTime,
                    endTime: timeEntry.endTime,
                    task: timeEntry.task,
                    project: timeEntry.project,
                    description: timeEntry.description
                }
            };

        } catch (error) {
            console.error('Stop timer error:', error);
            return {
                success: false,
                message: 'Failed to stop timer'
            };
        }
    }

    // Log time manually
    async logTime(userId, data) {
        try {
            const { taskId, hours, description, date, billable = false } = data;

            // Get task details
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check workspace membership
            const membership = await WorkspaceMember.findOne({
                workspace: task.workspace,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                };
            }

            // Validate date is not in the future
            const logDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (logDate > today) {
                return {
                    success: false,
                    message: 'Cannot log time for future dates'
                };
            }

            // Create time entry
            const timeEntry = new TimeEntry({
                user: userId,
                task: taskId,
                project: task.project._id,
                workspace: task.workspace,
                description: description || '',
                hours: parseFloat(hours),
                date: logDate,
                billable,
                isRunning: false
            });

            await timeEntry.save();

            // Update task logged hours
            task.loggedHours = (task.loggedHours || 0) + parseFloat(hours);
            await task.save();

            // Populate for response
            await timeEntry.populate('task project user');

            return {
                success: true,
                message: 'Time logged successfully',
                timeEntry: {
                    id: timeEntry._id,
                    hours: timeEntry.hours,
                    date: timeEntry.date,
                    description: timeEntry.description,
                    billable: timeEntry.billable,
                    task: timeEntry.task,
                    project: timeEntry.project,
                    user: timeEntry.user
                }
            };

        } catch (error) {
            console.error('Log time error:', error);
            return {
                success: false,
                message: 'Failed to log time'
            };
        }
    }

    // Update time entry
    async updateTimeEntry(timeEntryId, userId, updateData) {
        try {
            const timeEntry = await TimeEntry.findOne({
                _id: timeEntryId,
                user: userId
            }).populate('task');

            if (!timeEntry) {
                return {
                    success: false,
                    message: 'Time entry not found'
                };
            }

            // Check if entry is editable
            if (!timeEntry.isEditable) {
                return {
                    success: false,
                    message: 'This time entry cannot be edited (approved, invoiced, or too old)'
                };
            }

            const oldHours = timeEntry.hours;
            const { hours, description, billable, date } = updateData;

            // Update fields
            if (hours !== undefined) {
                timeEntry.hours = parseFloat(hours);
            }
            if (description !== undefined) {
                timeEntry.description = description;
            }
            if (billable !== undefined) {
                timeEntry.billable = billable;
            }
            if (date !== undefined) {
                const logDate = new Date(date);
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                if (logDate > today) {
                    return {
                        success: false,
                        message: 'Cannot set date in the future'
                    };
                }
                timeEntry.date = logDate;
            }

            await timeEntry.save();

            // Update task logged hours if hours changed
            if (hours !== undefined && timeEntry.task) {
                const hoursDifference = timeEntry.hours - oldHours;
                timeEntry.task.loggedHours = (timeEntry.task.loggedHours || 0) + hoursDifference;
                await timeEntry.task.save();
            }

            await timeEntry.populate('task project user');

            return {
                success: true,
                message: 'Time entry updated successfully',
                timeEntry
            };

        } catch (error) {
            console.error('Update time entry error:', error);
            return {
                success: false,
                message: 'Failed to update time entry'
            };
        }
    }

    // Delete time entry
    async deleteTimeEntry(timeEntryId, userId) {
        try {
            const timeEntry = await TimeEntry.findOne({
                _id: timeEntryId,
                user: userId
            }).populate('task');

            if (!timeEntry) {
                return {
                    success: false,
                    message: 'Time entry not found'
                };
            }

            // Check if entry is editable
            if (!timeEntry.isEditable) {
                return {
                    success: false,
                    message: 'This time entry cannot be deleted (approved, invoiced, or too old)'
                };
            }

            // Update task logged hours
            if (timeEntry.task) {
                timeEntry.task.loggedHours = Math.max(0, (timeEntry.task.loggedHours || 0) - timeEntry.hours);
                await timeEntry.task.save();
            }

            await TimeEntry.findByIdAndDelete(timeEntryId);

            return {
                success: true,
                message: 'Time entry deleted successfully'
            };

        } catch (error) {
            console.error('Delete time entry error:', error);
            return {
                success: false,
                message: 'Failed to delete time entry'
            };
        }
    }

    // Get user's time entries
    async getUserTimeEntries(userId, filters = {}) {
        try {
            const {
                startDate,
                endDate,
                projectId,
                taskId,
                billable,
                page = 1,
                limit = 20
            } = filters;

            // Build query
            const query = { user: userId };

            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            if (projectId) {
                query.project = projectId;
            }

            if (taskId) {
                query.task = taskId;
            }

            if (billable !== undefined) {
                query.billable = billable;
            }

            // Get time entries with pagination
            const timeEntries = await TimeEntry.find(query)
                .populate('task', 'title priority status')
                .populate('project', 'name status')
                .sort({ date: -1, createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await TimeEntry.countDocuments(query);

            // Calculate totals
            const totals = await TimeEntry.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        totalHours: { $sum: '$hours' },
                        billableHours: {
                            $sum: {
                                $cond: ['$billable', '$hours', 0]
                            }
                        },
                        nonBillableHours: {
                            $sum: {
                                $cond: ['$billable', 0, '$hours']
                            }
                        },
                        totalEntries: { $sum: 1 }
                    }
                }
            ]);

            const summary = totals.length > 0 ? totals[0] : {
                totalHours: 0,
                billableHours: 0,
                nonBillableHours: 0,
                totalEntries: 0
            };

            return {
                success: true,
                timeEntries,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                summary
            };

        } catch (error) {
            console.error('Get user time entries error:', error);
            return {
                success: false,
                message: 'Failed to fetch time entries'
            };
        }
    }

    // Get project time tracking summary
    async getProjectTimeTracking(projectId, userId, filters = {}) {
        try {
            // Check project access
            const project = await Project.findById(projectId);
            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            const membership = await WorkspaceMember.findOne({
                workspace: project.workspace,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                };
            }

            const { startDate, endDate } = filters;

            // Get project time summary
            const summary = await TimeEntry.getProjectTimeSummary(
                projectId,
                startDate ? new Date(startDate) : null,
                endDate ? new Date(endDate) : null
            );

            // Get tasks with time tracking
            const tasks = await Task.find({ project: projectId })
                .select('title estimatedHours loggedHours status priority assignee')
                .populate('assignee', 'name email');

            // Calculate project totals
            const projectTotals = {
                totalEstimated: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
                totalLogged: tasks.reduce((sum, task) => sum + (task.loggedHours || 0), 0),
                totalTasks: tasks.length,
                completedTasks: tasks.filter(task => task.status === 'done').length
            };

            projectTotals.progress = projectTotals.totalEstimated > 0 
                ? Math.round((projectTotals.totalLogged / projectTotals.totalEstimated) * 100)
                : 0;

            return {
                success: true,
                project: {
                    id: project._id,
                    name: project.name,
                    status: project.status
                },
                summary,
                tasks,
                totals: projectTotals
            };

        } catch (error) {
            console.error('Get project time tracking error:', error);
            return {
                success: false,
                message: 'Failed to fetch project time tracking'
            };
        }
    }

    // Get running timer for user
    async getRunningTimer(userId) {
        try {
            const runningTimer = await TimeEntry.findOne({
                user: userId,
                isRunning: true
            }).populate('task project');

            if (!runningTimer) {
                return {
                    success: true,
                    runningTimer: null
                };
            }

            // Calculate elapsed time
            const elapsed = new Date() - new Date(runningTimer.startTime);
            const elapsedHours = Math.round((elapsed / (1000 * 60 * 60)) * 100) / 100;

            return {
                success: true,
                runningTimer: {
                    id: runningTimer._id,
                    task: runningTimer.task,
                    project: runningTimer.project,
                    startTime: runningTimer.startTime,
                    description: runningTimer.description,
                    elapsedHours
                }
            };

        } catch (error) {
            console.error('Get running timer error:', error);
            return {
                success: false,
                message: 'Failed to fetch running timer'
            };
        }
    }

    // Get time tracking reports
    async getTimeReports(userId, workspaceId, filters = {}) {
        try {
            // Check workspace membership
            const membership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                };
            }

            const {
                startDate,
                endDate,
                projectId,
                userId: targetUserId,
                reportType = 'summary'
            } = filters;

            const matchQuery = { workspace: workspaceId };

            if (startDate && endDate) {
                matchQuery.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            if (projectId) {
                matchQuery.project = mongoose.Types.ObjectId(projectId);
            }

            if (targetUserId) {
                matchQuery.user = mongoose.Types.ObjectId(targetUserId);
            }

            let reportData;

            if (reportType === 'daily') {
                // Daily breakdown
                reportData = await TimeEntry.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                            },
                            totalHours: { $sum: '$hours' },
                            billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
                            entries: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.date': 1 } }
                ]);
            } else if (reportType === 'user') {
                // User breakdown
                reportData = await TimeEntry.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: '$user',
                            totalHours: { $sum: '$hours' },
                            billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
                            entries: { $sum: 1 }
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
                    { $unwind: '$user' }
                ]);
            } else if (reportType === 'project') {
                // Project breakdown
                reportData = await TimeEntry.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: '$project',
                            totalHours: { $sum: '$hours' },
                            billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
                            entries: { $sum: 1 }
                        }
                    },
                    {
                        $lookup: {
                            from: 'projects',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'project'
                        }
                    },
                    { $unwind: '$project' }
                ]);
            } else {
                // Summary report
                reportData = await TimeEntry.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: null,
                            totalHours: { $sum: '$hours' },
                            billableHours: { $sum: { $cond: ['$billable', '$hours', 0] } },
                            nonBillableHours: { $sum: { $cond: ['$billable', 0, '$hours'] } },
                            totalEntries: { $sum: 1 },
                            averageHoursPerDay: { $avg: '$hours' }
                        }
                    }
                ]);
            }

            return {
                success: true,
                reportType,
                data: reportData,
                filters
            };

        } catch (error) {
            console.error('Get time reports error:', error);
            return {
                success: false,
                message: 'Failed to generate time reports'
            };
        }
    }
}

module.exports = new TimeTrackingService();

