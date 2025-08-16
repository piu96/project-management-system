const Task = require('../../models/Task');
const Project = require('../../models/Project');
const TimeEntry = require('../../models/TimeEntry');
const WorkspaceMember = require('../../models/WorkspaceMember');
const mongoose = require('mongoose');

class ProgressTrackingService {
    // Update task progress
    async updateTaskProgress(taskId, userId, progressData) {
        try {
            const { progress, status, remainingHours, notes } = progressData;

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

            // Check if user can update task (assignee, reporter, or manager)
            const canUpdate = task.assignee?.toString() === userId || 
                             task.reporter.toString() === userId ||
                             ['workspace_admin', 'project_manager'].includes(membership.role);

            if (!canUpdate) {
                return {
                    success: false,
                    message: 'You can only update tasks assigned to you or tasks you created'
                };
            }

            // Update task fields
            if (progress !== undefined) {
                task.progress = Math.max(0, Math.min(100, progress));
            }

            if (status && task.status !== status) {
                task.status = status;
                
                // Auto-complete progress when status is done
                if (status === 'done') {
                    task.progress = 100;
                    task.completedDate = new Date();
                } else if (task.completedDate && status !== 'done') {
                    task.completedDate = null;
                }
            }

            if (remainingHours !== undefined) {
                task.remainingHours = Math.max(0, remainingHours);
            }

            // Calculate remaining hours automatically if not provided
            if (remainingHours === undefined && task.estimatedHours > 0) {
                const completionRatio = task.progress / 100;
                task.remainingHours = Math.max(0, task.estimatedHours - (task.estimatedHours * completionRatio));
            }

            await task.save();

            // Update project progress
            await this.updateProjectProgress(task.project._id);

            return {
                success: true,
                message: 'Task progress updated successfully',
                task: {
                    id: task._id,
                    title: task.title,
                    status: task.status,
                    progress: task.progress,
                    remainingHours: task.remainingHours,
                    estimatedHours: task.estimatedHours,
                    loggedHours: task.loggedHours,
                    completedDate: task.completedDate
                }
            };

        } catch (error) {
            console.error('Update task progress error:', error);
            return {
                success: false,
                message: 'Failed to update task progress'
            };
        }
    }

    // Update project progress automatically
    async updateProjectProgress(projectId) {
        try {
            const project = await Project.findById(projectId);
            if (!project) return;

            // Get all project tasks
            const tasks = await Task.find({ project: projectId });
            
            if (tasks.length === 0) {
                project.progress = 0;
                await project.save();
                return;
            }

            // Calculate weighted progress based on estimated hours
            let totalWeight = 0;
            let weightedProgress = 0;

            tasks.forEach(task => {
                const weight = task.estimatedHours || 1; // Default weight of 1 if no estimate
                totalWeight += weight;
                weightedProgress += (task.progress || 0) * weight;
            });

            const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
            
            project.progress = overallProgress;

            // Auto-update project status based on progress
            if (overallProgress === 100 && project.status !== 'completed') {
                project.status = 'completed';
            } else if (overallProgress > 0 && overallProgress < 100 && project.status === 'planning') {
                project.status = 'active';
            }

            await project.save();

        } catch (error) {
            console.error('Update project progress error:', error);
        }
    }

    // Get task progress details
    async getTaskProgress(taskId, userId) {
        try {
            const task = await Task.findById(taskId)
                .populate('project', 'name status progress')
                .populate('assignee', 'name email')
                .populate('reporter', 'name email');

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

            // Get time tracking data
            const timeEntries = await TimeEntry.find({ task: taskId })
                .populate('user', 'name email')
                .sort({ date: -1 });

            const timeStats = {
                totalLogged: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
                billableLogged: timeEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0),
                entriesCount: timeEntries.length
            };

            // Calculate progress metrics
            const progressMetrics = {
                timeProgress: task.estimatedHours > 0 ? Math.round((task.loggedHours / task.estimatedHours) * 100) : 0,
                remainingHours: task.remainingHours,
                estimatedCompletion: this.calculateEstimatedCompletion(task, timeEntries),
                velocity: this.calculateVelocity(timeEntries),
                burndown: this.calculateBurndown(task, timeEntries)
            };

            return {
                success: true,
                task: {
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    progress: task.progress,
                    estimatedHours: task.estimatedHours,
                    loggedHours: task.loggedHours,
                    remainingHours: task.remainingHours,
                    dueDate: task.dueDate,
                    startDate: task.startDate,
                    completedDate: task.completedDate,
                    project: task.project,
                    assignee: task.assignee,
                    reporter: task.reporter
                },
                timeStats,
                progressMetrics,
                recentTimeEntries: timeEntries.slice(0, 5)
            };

        } catch (error) {
            console.error('Get task progress error:', error);
            return {
                success: false,
                message: 'Failed to fetch task progress'
            };
        }
    }

    // Get project progress overview
    async getProjectProgress(projectId, userId) {
        try {
            const project = await Project.findById(projectId)
                .populate('owner', 'name email')
                .populate('members.user', 'name email');

            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            // Check workspace membership
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

            // Get project tasks with progress
            const tasks = await Task.find({ project: projectId })
                .populate('assignee', 'name email')
                .sort({ createdAt: 1 });

            // Calculate task statistics
            const taskStats = {
                total: tasks.length,
                todo: tasks.filter(t => t.status === 'todo').length,
                inProgress: tasks.filter(t => t.status === 'in_progress').length,
                review: tasks.filter(t => t.status === 'review').length,
                done: tasks.filter(t => t.status === 'done').length,
                cancelled: tasks.filter(t => t.status === 'cancelled').length
            };

            // Calculate time statistics
            const timeStats = {
                totalEstimated: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
                totalLogged: tasks.reduce((sum, task) => sum + (task.loggedHours || 0), 0),
                totalRemaining: tasks.reduce((sum, task) => sum + (task.remainingHours || 0), 0)
            };

            timeStats.timeProgress = timeStats.totalEstimated > 0 
                ? Math.round((timeStats.totalLogged / timeStats.totalEstimated) * 100)
                : 0;

            // Calculate milestone progress
            const milestones = this.calculateMilestones(tasks, project);

            // Team performance
            const teamPerformance = await this.calculateTeamPerformance(projectId, tasks);

            return {
                success: true,
                project: {
                    id: project._id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    priority: project.priority,
                    progress: project.progress,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    owner: project.owner,
                    members: project.members
                },
                taskStats,
                timeStats,
                milestones,
                teamPerformance,
                tasksWithProgress: tasks.map(task => ({
                    id: task._id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                    progress: task.progress,
                    estimatedHours: task.estimatedHours,
                    loggedHours: task.loggedHours,
                    remainingHours: task.remainingHours,
                    assignee: task.assignee,
                    dueDate: task.dueDate
                }))
            };

        } catch (error) {
            console.error('Get project progress error:', error);
            return {
                success: false,
                message: 'Failed to fetch project progress'
            };
        }
    }

    // Calculate estimated completion date
    calculateEstimatedCompletion(task, timeEntries) {
        if (!task.remainingHours || task.remainingHours === 0) {
            return task.status === 'done' ? task.completedDate : null;
        }

        // Calculate average hours per day from recent entries
        const recentEntries = timeEntries
            .filter(entry => entry.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
            .sort((a, b) => b.date - a.date);

        if (recentEntries.length === 0) return null;

        const totalHours = recentEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const workingDays = new Set(recentEntries.map(entry => entry.date.toDateString())).size;
        const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

        if (avgHoursPerDay === 0) return null;

        const daysToComplete = Math.ceil(task.remainingHours / avgHoursPerDay);
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(estimatedCompletion.getDate() + daysToComplete);

        return estimatedCompletion;
    }

    // Calculate work velocity
    calculateVelocity(timeEntries) {
        const last7Days = timeEntries.filter(
            entry => entry.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        const last30Days = timeEntries.filter(
            entry => entry.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        return {
            last7Days: last7Days.reduce((sum, entry) => sum + entry.hours, 0),
            last30Days: last30Days.reduce((sum, entry) => sum + entry.hours, 0),
            avgPerDay7: last7Days.length > 0 ? (last7Days.reduce((sum, entry) => sum + entry.hours, 0) / 7) : 0,
            avgPerDay30: last30Days.length > 0 ? (last30Days.reduce((sum, entry) => sum + entry.hours, 0) / 30) : 0
        };
    }

    // Calculate burndown data
    calculateBurndown(task, timeEntries) {
        const sortedEntries = timeEntries.sort((a, b) => a.date - b.date);
        const burndown = [];
        let remainingWork = task.estimatedHours || 0;

        // Starting point
        if (sortedEntries.length > 0) {
            burndown.push({
                date: sortedEntries[0].date,
                remaining: remainingWork,
                logged: 0
            });
        }

        // Calculate daily burndown
        let totalLogged = 0;
        sortedEntries.forEach(entry => {
            totalLogged += entry.hours;
            const progressRatio = task.estimatedHours > 0 ? totalLogged / task.estimatedHours : 0;
            remainingWork = Math.max(0, task.estimatedHours - (task.estimatedHours * Math.min(1, progressRatio)));

            burndown.push({
                date: entry.date,
                remaining: remainingWork,
                logged: totalLogged
            });
        });

        return burndown;
    }

    // Calculate project milestones
    calculateMilestones(tasks, project) {
        const milestones = [];

        // Quarter milestones based on estimated completion
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;

        [25, 50, 75, 100].forEach(percent => {
            const requiredTasks = Math.ceil((totalTasks * percent) / 100);
            const milestone = {
                percent,
                required: requiredTasks,
                completed: Math.min(completedTasks, requiredTasks),
                achieved: completedTasks >= requiredTasks,
                remainingTasks: Math.max(0, requiredTasks - completedTasks)
            };

            milestones.push(milestone);
        });

        return milestones;
    }

    // Calculate team performance
    async calculateTeamPerformance(projectId, tasks) {
        try {
            const performance = {};

            // Get time entries for the project
            const timeEntries = await TimeEntry.find({ project: projectId })
                .populate('user', 'name email');

            // Group by user
            const userPerformance = {};
            
            timeEntries.forEach(entry => {
                const userId = entry.user._id.toString();
                if (!userPerformance[userId]) {
                    userPerformance[userId] = {
                        user: entry.user,
                        totalHours: 0,
                        tasksWorkedOn: new Set(),
                        avgHoursPerTask: 0,
                        completedTasks: 0
                    };
                }

                userPerformance[userId].totalHours += entry.hours;
                userPerformance[userId].tasksWorkedOn.add(entry.task.toString());
            });

            // Add task completion data
            tasks.forEach(task => {
                if (task.assignee && task.status === 'done') {
                    const userId = task.assignee._id.toString();
                    if (userPerformance[userId]) {
                        userPerformance[userId].completedTasks++;
                    }
                }
            });

            // Calculate averages
            Object.values(userPerformance).forEach(perf => {
                perf.tasksWorkedOn = perf.tasksWorkedOn.size;
                perf.avgHoursPerTask = perf.tasksWorkedOn > 0 
                    ? Math.round((perf.totalHours / perf.tasksWorkedOn) * 100) / 100
                    : 0;
            });

            return Object.values(userPerformance);

        } catch (error) {
            console.error('Calculate team performance error:', error);
            return [];
        }
    }

    // Get workspace progress dashboard
    async getWorkspaceProgress(workspaceId, userId) {
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

            // Get all workspace projects
            const projects = await Project.find({ 
                workspace: workspaceId,
                'archived.isArchived': false 
            });

            // Get all workspace tasks
            const tasks = await Task.find({ workspace: workspaceId });

            // Calculate overall statistics
            const overallStats = {
                projects: {
                    total: projects.length,
                    planning: projects.filter(p => p.status === 'planning').length,
                    active: projects.filter(p => p.status === 'active').length,
                    onHold: projects.filter(p => p.status === 'on_hold').length,
                    completed: projects.filter(p => p.status === 'completed').length,
                    avgProgress: projects.length > 0 
                        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
                        : 0
                },
                tasks: {
                    total: tasks.length,
                    todo: tasks.filter(t => t.status === 'todo').length,
                    inProgress: tasks.filter(t => t.status === 'in_progress').length,
                    review: tasks.filter(t => t.status === 'review').length,
                    done: tasks.filter(t => t.status === 'done').length,
                    cancelled: tasks.filter(t => t.status === 'cancelled').length,
                    avgProgress: tasks.length > 0 
                        ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
                        : 0
                },
                time: {
                    totalEstimated: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
                    totalLogged: tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0),
                    totalRemaining: tasks.reduce((sum, t) => sum + (t.remainingHours || 0), 0)
                }
            };

            overallStats.time.timeEfficiency = overallStats.time.totalEstimated > 0 
                ? Math.round((overallStats.time.totalLogged / overallStats.time.totalEstimated) * 100)
                : 0;

            // Get project progress summary
            const projectProgress = projects.map(project => ({
                id: project._id,
                name: project.name,
                status: project.status,
                progress: project.progress,
                startDate: project.startDate,
                endDate: project.endDate,
                tasksCount: tasks.filter(t => t.project.toString() === project._id.toString()).length,
                completedTasks: tasks.filter(t => t.project.toString() === project._id.toString() && t.status === 'done').length
            }));

            return {
                success: true,
                workspace: { id: workspaceId },
                overallStats,
                projectProgress,
                topPerformingProjects: projectProgress
                    .sort((a, b) => b.progress - a.progress)
                    .slice(0, 5),
                recentlyCompletedTasks: tasks
                    .filter(t => t.status === 'done' && t.completedDate)
                    .sort((a, b) => b.completedDate - a.completedDate)
                    .slice(0, 10)
                    .map(t => ({
                        id: t._id,
                        title: t.title,
                        completedDate: t.completedDate,
                        loggedHours: t.loggedHours
                    }))
            };

        } catch (error) {
            console.error('Get workspace progress error:', error);
            return {
                success: false,
                message: 'Failed to fetch workspace progress'
            };
        }
    }
}

module.exports = new ProgressTrackingService();

// Generated by Copilot
