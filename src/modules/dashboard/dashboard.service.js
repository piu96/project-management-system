const Task = require('../../models/Task');
const Project = require('../../models/Project');
const Workspace = require('../../models/Workspace');
const WorkspaceMember = require('../../models/WorkspaceMember');

class DashboardService {
    // Get user dashboard overview
    async getUserDashboard(userId) {
        try {
            // Get user's workspace memberships
            const memberships = await WorkspaceMember.find({
                user: userId,
                status: 'active'
            }).populate('workspace', 'name slug');

            const workspaceIds = memberships.map(m => m.workspace._id);

            // Get dashboard stats in parallel
            const [
                taskStats,
                projectStats,
                recentTasks,
                recentProjects,
                upcomingTasks
            ] = await Promise.all([
                this.getTaskStats(userId, workspaceIds),
                this.getProjectStats(userId, workspaceIds),
                this.getRecentTasks(userId, workspaceIds),
                this.getRecentProjects(userId, workspaceIds),
                this.getUpcomingTasks(userId, workspaceIds)
            ]);

            return {
                success: true,
                dashboard: {
                    user: {
                        id: userId,
                        workspaces: memberships.map(m => ({
                            id: m.workspace._id,
                            name: m.workspace.name,
                            slug: m.workspace.slug,
                            role: m.role
                        }))
                    },
                    stats: {
                        tasks: taskStats,
                        projects: projectStats
                    },
                    recentActivity: {
                        tasks: recentTasks,
                        projects: recentProjects
                    },
                    upcoming: {
                        tasks: upcomingTasks
                    }
                }
            };

        } catch (error) {
            console.error('Get user dashboard error:', error);
            return {
                success: false,
                message: 'Failed to fetch dashboard data'
            };
        }
    }

    // Get task statistics for user
    async getTaskStats(userId, workspaceIds) {
        try {
            const [
                totalTasks,
                assignedTasks,
                completedTasks,
                overdueTasks,
                todoTasks,
                inProgressTasks,
                reviewTasks
            ] = await Promise.all([
                // Total tasks in user's workspaces
                Task.countDocuments({
                    workspace: { $in: workspaceIds }
                }),
                // Tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId
                }),
                // Completed tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    status: 'done'
                }),
                // Overdue tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    dueDate: { $lt: new Date() },
                    status: { $nin: ['done', 'cancelled'] }
                }),
                // Todo tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    status: 'todo'
                }),
                // In progress tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    status: 'in_progress'
                }),
                // Review tasks assigned to user
                Task.countDocuments({
                    workspace: { $in: workspaceIds },
                    assignee: userId,
                    status: 'review'
                })
            ]);

            const completionRate = assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0;

            return {
                total: totalTasks,
                assigned: assignedTasks,
                completed: completedTasks,
                overdue: overdueTasks,
                completionRate,
                byStatus: {
                    todo: todoTasks,
                    inProgress: inProgressTasks,
                    review: reviewTasks,
                    done: completedTasks
                }
            };

        } catch (error) {
            console.error('Get task stats error:', error);
            return {
                total: 0,
                assigned: 0,
                completed: 0,
                overdue: 0,
                completionRate: 0,
                byStatus: {
                    todo: 0,
                    inProgress: 0,
                    review: 0,
                    done: 0
                }
            };
        }
    }

    // Get project statistics for user
    async getProjectStats(userId, workspaceIds) {
        try {
            const [
                totalProjects,
                ownedProjects,
                activeProjects,
                completedProjects,
                projectsByStatus
            ] = await Promise.all([
                // Total projects in user's workspaces
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    'archived.isArchived': false
                }),
                // Projects owned by user
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    owner: userId,
                    'archived.isArchived': false
                }),
                // Active projects user is member of
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    'members.user': userId,
                    status: 'active',
                    'archived.isArchived': false
                }),
                // Completed projects user is member of
                Project.countDocuments({
                    workspace: { $in: workspaceIds },
                    'members.user': userId,
                    status: 'completed',
                    'archived.isArchived': false
                }),
                // Projects by status
                Project.aggregate([
                    {
                        $match: {
                            workspace: { $in: workspaceIds },
                            'members.user': userId,
                            'archived.isArchived': false
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const statusCounts = projectsByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            return {
                total: totalProjects,
                owned: ownedProjects,
                active: activeProjects,
                completed: completedProjects,
                byStatus: {
                    planning: statusCounts.planning || 0,
                    active: statusCounts.active || 0,
                    on_hold: statusCounts.on_hold || 0,
                    completed: statusCounts.completed || 0,
                    cancelled: statusCounts.cancelled || 0
                }
            };

        } catch (error) {
            console.error('Get project stats error:', error);
            return {
                total: 0,
                owned: 0,
                active: 0,
                completed: 0,
                byStatus: {
                    planning: 0,
                    active: 0,
                    on_hold: 0,
                    completed: 0,
                    cancelled: 0
                }
            };
        }
    }

    // Get recent tasks for user
    async getRecentTasks(userId, workspaceIds, limit = 10) {
        try {
            const recentTasks = await Task.find({
                workspace: { $in: workspaceIds },
                $or: [
                    { assignee: userId },
                    { reporter: userId }
                ]
            })
            .populate('project', 'name')
            .populate('assignee', 'name email')
            .sort({ updatedAt: -1 })
            .limit(limit);

            return recentTasks.map(task => ({
                id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                type: task.type,
                project: task.project,
                assignee: task.assignee,
                dueDate: task.dueDate,
                isOverdue: task.isOverdue,
                updatedAt: task.updatedAt
            }));

        } catch (error) {
            console.error('Get recent tasks error:', error);
            return [];
        }
    }

    // Get recent projects for user
    async getRecentProjects(userId, workspaceIds, limit = 5) {
        try {
            const recentProjects = await Project.find({
                workspace: { $in: workspaceIds },
                'members.user': userId,
                'archived.isArchived': false
            })
            .populate('owner', 'name email')
            .sort({ updatedAt: -1 })
            .limit(limit);

            return recentProjects.map(project => ({
                id: project._id,
                name: project.name,
                status: project.status,
                priority: project.priority,
                owner: project.owner,
                progress: project.progress,
                memberCount: project.members.length,
                updatedAt: project.updatedAt
            }));

        } catch (error) {
            console.error('Get recent projects error:', error);
            return [];
        }
    }

    // Get upcoming tasks (due soon)
    async getUpcomingTasks(userId, workspaceIds, limit = 10) {
        try {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const upcomingTasks = await Task.find({
                workspace: { $in: workspaceIds },
                assignee: userId,
                dueDate: {
                    $gte: new Date(),
                    $lte: nextWeek
                },
                status: { $nin: ['done', 'cancelled'] }
            })
            .populate('project', 'name')
            .sort({ dueDate: 1 })
            .limit(limit);

            return upcomingTasks.map(task => ({
                id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                project: task.project,
                dueDate: task.dueDate,
                isOverdue: task.isOverdue,
                isDueSoon: task.isDueSoon
            }));

        } catch (error) {
            console.error('Get upcoming tasks error:', error);
            return [];
        }
    }

    // Get workspace dashboard
    async getWorkspaceDashboard(workspaceId, userId) {
        try {
            // Check if user is workspace member
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

            // Get workspace details
            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    message: 'Workspace not found'
                };
            }

            // Get workspace stats
            const [
                projectCount,
                taskCount,
                memberCount,
                activeProjects,
                completedTasks,
                overdueTasks,
                recentActivity
            ] = await Promise.all([
                Project.countDocuments({
                    workspace: workspaceId,
                    'archived.isArchived': false
                }),
                Task.countDocuments({
                    workspace: workspaceId
                }),
                WorkspaceMember.countDocuments({
                    workspace: workspaceId,
                    status: 'active'
                }),
                Project.countDocuments({
                    workspace: workspaceId,
                    status: 'active',
                    'archived.isArchived': false
                }),
                Task.countDocuments({
                    workspace: workspaceId,
                    status: 'done'
                }),
                Task.countDocuments({
                    workspace: workspaceId,
                    dueDate: { $lt: new Date() },
                    status: { $nin: ['done', 'cancelled'] }
                }),
                this.getWorkspaceRecentActivity(workspaceId)
            ]);

            return {
                success: true,
                dashboard: {
                    workspace: {
                        id: workspace._id,
                        name: workspace.name,
                        description: workspace.description
                    },
                    stats: {
                        projects: projectCount,
                        tasks: taskCount,
                        members: memberCount,
                        activeProjects,
                        completedTasks,
                        overdueTasks
                    },
                    recentActivity,
                    userRole: membership.role
                }
            };

        } catch (error) {
            console.error('Get workspace dashboard error:', error);
            return {
                success: false,
                message: 'Failed to fetch workspace dashboard'
            };
        }
    }

    // Get workspace recent activity
    async getWorkspaceRecentActivity(workspaceId, limit = 15) {
        try {
            const [recentProjects, recentTasks] = await Promise.all([
                Project.find({
                    workspace: workspaceId,
                    'archived.isArchived': false
                })
                .populate('owner', 'name email')
                .sort({ updatedAt: -1 })
                .limit(5),

                Task.find({
                    workspace: workspaceId
                })
                .populate('assignee', 'name email')
                .populate('project', 'name')
                .sort({ updatedAt: -1 })
                .limit(10)
            ]);

            const activity = [];

            // Add project activities
            recentProjects.forEach(project => {
                activity.push({
                    type: 'project',
                    action: 'updated',
                    item: {
                        id: project._id,
                        name: project.name,
                        status: project.status
                    },
                    user: project.owner,
                    timestamp: project.updatedAt
                });
            });

            // Add task activities
            recentTasks.forEach(task => {
                activity.push({
                    type: 'task',
                    action: 'updated',
                    item: {
                        id: task._id,
                        title: task.title,
                        status: task.status,
                        project: task.project
                    },
                    user: task.assignee,
                    timestamp: task.updatedAt
                });
            });

            // Sort by timestamp and limit
            activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return activity.slice(0, limit);

        } catch (error) {
            console.error('Get workspace recent activity error:', error);
            return [];
        }
    }

    // Get project dashboard
    async getProjectDashboard(projectId, userId) {
        try {
            const project = await Project.findById(projectId)
                .populate('workspace', 'name')
                .populate('owner', 'name email')
                .populate('members.user', 'name email');

            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            // Check if user is workspace member
            const membership = await WorkspaceMember.findOne({
                workspace: project.workspace._id,
                user: userId,
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this workspace.'
                };
            }

            // Get project task stats
            const [
                totalTasks,
                completedTasks,
                overdueTasks,
                tasksByStatus,
                tasksByPriority,
                recentTasks
            ] = await Promise.all([
                Task.countDocuments({ project: projectId }),
                Task.countDocuments({ project: projectId, status: 'done' }),
                Task.countDocuments({
                    project: projectId,
                    dueDate: { $lt: new Date() },
                    status: { $nin: ['done', 'cancelled'] }
                }),
                Task.aggregate([
                    { $match: { project: project._id } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Task.aggregate([
                    { $match: { project: project._id } },
                    { $group: { _id: '$priority', count: { $sum: 1 } } }
                ]),
                Task.find({ project: projectId })
                    .populate('assignee', 'name email')
                    .sort({ updatedAt: -1 })
                    .limit(10)
            ]);

            const statusCounts = tasksByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            const priorityCounts = tasksByPriority.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                success: true,
                dashboard: {
                    project: {
                        id: project._id,
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        priority: project.priority,
                        owner: project.owner,
                        workspace: project.workspace,
                        progress: project.progress,
                        startDate: project.startDate,
                        endDate: project.endDate,
                        budget: project.budget
                    },
                    stats: {
                        totalTasks,
                        completedTasks,
                        overdueTasks,
                        completionRate,
                        byStatus: {
                            todo: statusCounts.todo || 0,
                            in_progress: statusCounts.in_progress || 0,
                            review: statusCounts.review || 0,
                            done: statusCounts.done || 0,
                            cancelled: statusCounts.cancelled || 0
                        },
                        byPriority: {
                            low: priorityCounts.low || 0,
                            medium: priorityCounts.medium || 0,
                            high: priorityCounts.high || 0,
                            urgent: priorityCounts.urgent || 0
                        }
                    },
                    team: project.members,
                    recentTasks: recentTasks.map(task => ({
                        id: task._id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        assignee: task.assignee,
                        dueDate: task.dueDate,
                        updatedAt: task.updatedAt
                    }))
                }
            };

        } catch (error) {
            console.error('Get project dashboard error:', error);
            return {
                success: false,
                message: 'Failed to fetch project dashboard'
            };
        }
    }
}

module.exports = new DashboardService();

// Generated by Copilot
