const Task = require('../../models/Task');
const Project = require('../../models/Project');
const WorkspaceMember = require('../../models/WorkspaceMember');

class TaskService {
    // Create new task
    async createTask(userId, data) {
        try {
            const { projectId, title, description, status, priority, type, assignee, dueDate, startDate, estimatedHours, tags } = data;

            // Get project and check permissions
            const project = await Project.findById(projectId);
            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            // Check if user is workspace member
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

            // Check if user is project member
            if (!project.isMember(userId)) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this project.'
                };
            }

            // If assignee is specified, check if they are project member
            if (assignee) {
                if (!project.isMember(assignee)) {
                    return {
                        success: false,
                        message: 'Assignee must be a member of this project.'
                    };
                }
            }

            // Create task
            const task = new Task({
                workspace: project.workspace,
                project: projectId,
                title: title.trim(),
                description: description || '',
                status: status || 'todo',
                priority: priority || 'medium',
                type: type || 'task',
                assignee: assignee || null,
                reporter: userId,
                dueDate: dueDate || null,
                startDate: startDate || null,
                estimatedHours: estimatedHours || 0,
                tags: tags || []
            });

            await task.save();

            return {
                success: true,
                message: 'Task created successfully',
                task: {
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    type: task.type,
                    assignee: task.assignee,
                    reporter: task.reporter,
                    project: task.project,
                    workspace: task.workspace,
                    dueDate: task.dueDate,
                    createdAt: task.createdAt
                }
            };

        } catch (error) {
            console.error('Create task error:', error);
            return {
                success: false,
                message: 'Failed to create task'
            };
        }
    }

    // Get task details
    async getTaskDetails(taskId, userId) {
        try {
            const task = await Task.findById(taskId)
                .populate('project', 'name workspace')
                .populate('assignee', 'name email avatar')
                .populate('reporter', 'name email avatar')
                .populate('watchers', 'name email avatar');

            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

                return {
                    success: true,
                    task: {
                        id: task._id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        type: task.type,
                        assignee: task.assignee,
                        reporter: task.reporter,
                        project: task.project,
                        dueDate: task.dueDate,
                        startDate: task.startDate,
                        completedDate: task.completedDate,
                        estimatedHours: task.estimatedHours,
                        loggedHours: task.loggedHours,
                        remainingHours: task.remainingHours,
                        progress: task.progress,
                        tags: task.tags,
                        watchers: task.watchers,
                        checklist: task.checklist || [],
                        attachments: task.attachments || [],
                        isAssignee: task.assignee && task.assignee._id.toString() === userId.toString(),
                        isReporter: task.reporter._id.toString() === userId.toString(),
                        isWatcher: task.watchers.some(w => w._id.toString() === userId.toString()),
                        isOverdue: task.isOverdue,
                        isDueSoon: task.isDueSoon,
                        checklistProgress: task.checklistProgress,
                        timeVariance: task.timeVariance,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt
                    }
                };        } catch (error) {
            console.error('Get task details error:', error);
            return {
                success: false,
                message: 'Failed to fetch task details'
            };
        }
    }

    // Update task
    async updateTask(taskId, userId, updateData) {
        try {
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // Check permissions - assignee, reporter, or project members with higher roles
            const isAssignee = task.assignee && task.assignee.toString() === userId.toString();
            const isReporter = task.reporter.toString() === userId.toString();
            const projectMemberRole = task.project.getMemberRole(userId);
            const hasEditPermission = ['project_lead', 'developer'].includes(projectMemberRole);

            if (!isAssignee && !isReporter && !hasEditPermission && membership.role !== 'workspace_admin') {
                return {
                    success: false,
                    message: 'Access denied. You do not have permission to edit this task.'
                };
            }

            // Update allowed fields
            const allowedFields = ['title', 'description', 'status', 'priority', 'type', 'assignee', 'dueDate', 'startDate', 'estimatedHours', 'progress', 'tags'];
            const updateFields = {};

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields[field] = updateData[field];
                }
            });

            // If assignee is being changed, check if new assignee is project member
            if (updateData.assignee && updateData.assignee !== task.assignee) {
                if (!task.project.isMember(updateData.assignee)) {
                    return {
                        success: false,
                        message: 'New assignee must be a member of this project.'
                    };
                }
            }

            await Task.findByIdAndUpdate(taskId, updateFields);

            return {
                success: true,
                message: 'Task updated successfully'
            };

        } catch (error) {
            console.error('Update task error:', error);
            return {
                success: false,
                message: 'Failed to update task'
            };
        }
    }

    // Delete task
    async deleteTask(taskId, userId) {
        try {
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // Only reporter, project lead, or workspace admin can delete
            const isReporter = task.reporter.toString() === userId.toString();
            const projectMemberRole = task.project.getMemberRole(userId);
            const isProjectLead = projectMemberRole === 'project_lead';
            const isWorkspaceAdmin = membership.role === 'workspace_admin';

            if (!isReporter && !isProjectLead && !isWorkspaceAdmin) {
                return {
                    success: false,
                    message: 'Access denied. Only task reporter, project lead, or workspace admin can delete tasks.'
                };
            }

            await Task.findByIdAndDelete(taskId);

            return {
                success: true,
                message: 'Task deleted successfully'
            };

        } catch (error) {
            console.error('Delete task error:', error);
            return {
                success: false,
                message: 'Failed to delete task'
            };
        }
    }

    // List project tasks
    async listProjectTasks(projectId, userId, filters = {}, page = 1, limit = 20) {
        try {
            // Get project and check permissions
            const project = await Project.findById(projectId);
            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            // Check if user is workspace member
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

            // Build query
            const query = { project: projectId };

            // Apply filters
            if (filters.status) {
                query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
            }
            if (filters.priority) {
                query.priority = Array.isArray(filters.priority) ? { $in: filters.priority } : filters.priority;
            }
            if (filters.type) {
                query.type = Array.isArray(filters.type) ? { $in: filters.type } : filters.type;
            }
            if (filters.assignee) {
                query.assignee = filters.assignee;
            }
            if (filters.reporter) {
                query.reporter = filters.reporter;
            }
            if (filters.tags && filters.tags.length > 0) {
                query.tags = { $in: filters.tags };
            }
            if (filters.dueDate) {
                if (filters.dueDate.from || filters.dueDate.to) {
                    query.dueDate = {};
                    if (filters.dueDate.from) query.dueDate.$gte = new Date(filters.dueDate.from);
                    if (filters.dueDate.to) query.dueDate.$lte = new Date(filters.dueDate.to);
                }
            }
            if (filters.search) {
                query.$or = [
                    { title: { $regex: filters.search, $options: 'i' } },
                    { description: { $regex: filters.search, $options: 'i' } }
                ];
            }

            // Sorting
            let sort = { createdAt: -1 };
            if (filters.sortBy) {
                sort = {};
                const sortField = filters.sortBy;
                const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
                sort[sortField] = sortOrder;
            }

            const skip = (page - 1) * limit;

            const tasks = await Task.find(query)
                .populate('assignee', 'name email avatar')
                .populate('reporter', 'name email avatar')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Task.countDocuments(query);

            const tasksList = tasks.map(task => ({
                id: task._id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                type: task.type,
                assignee: task.assignee,
                reporter: task.reporter,
                dueDate: task.dueDate,
                progress: task.progress,
                estimatedHours: task.estimatedHours,
                loggedHours: task.loggedHours,
                remainingHours: task.remainingHours,
                tags: task.tags,
                attachmentCount: task.attachments ? task.attachments.length : 0,
                checklistProgress: task.checklistProgress || 0,
                isOverdue: task.isOverdue,
                isDueSoon: task.isDueSoon,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            }));

            return {
                success: true,
                tasks: tasksList,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };

        } catch (error) {
            console.error('List project tasks error:', error);
            return {
                success: false,
                message: 'Failed to fetch tasks'
            };
        }
    }

    // Add time entry
    async addTimeEntry(taskId, userId, timeData) {
        try {
            const { hours, description, date } = timeData;

            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // Check if user is project member
            if (!task.project.isMember(userId)) {
                return {
                    success: false,
                    message: 'Access denied. You are not a member of this project.'
                };
            }

            // Update logged hours directly since timeEntries are in separate model
            task.loggedHours = (task.loggedHours || 0) + hours;
            if (task.estimatedHours > 0) {
                task.remainingHours = Math.max(0, task.estimatedHours - task.loggedHours);
            }
            
            await task.save();

            // TODO: Create TimeEntry record in separate collection
            return {
                success: true,
                message: 'Time logged successfully. Note: Time entries require separate TimeEntry model for full tracking.'
            };

        } catch (error) {
            console.error('Add time entry error:', error);
            return {
                success: false,
                message: 'Failed to add time entry'
            };
        }
    }

    // Add comment
    async addComment(taskId, userId, commentData) {
        try {
            const { content } = commentData;

            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // For now, return success message as comments are handled by separate Comment model
            // TODO: Implement Comment model and create comment record
            return {
                success: true,
                message: 'Comment feature requires separate Comment model implementation'
            };

        } catch (error) {
            console.error('Add comment error:', error);
            return {
                success: false,
                message: 'Failed to add comment'
            };
        }
    }

    // Add watcher
    async addWatcher(taskId, userId, watcherUserId) {
        try {
            const task = await Task.findById(taskId).populate('project');
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // Check if watcher user is project member
            if (!task.project.isMember(watcherUserId)) {
                return {
                    success: false,
                    message: 'User must be a member of this project to watch tasks.'
                };
            }

            // Add watcher (using existing method from Task model)
            task.addWatcher(watcherUserId);
            await task.save();

            return {
                success: true,
                message: 'Watcher added successfully'
            };

        } catch (error) {
            console.error('Add watcher error:', error);
            return {
                success: false,
                message: 'Failed to add watcher'
            };
        }
    }

    // Remove watcher
    async removeWatcher(taskId, userId, watcherUserId) {
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                return {
                    success: false,
                    message: 'Task not found'
                };
            }

            // Check if user is workspace member
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

            // Users can remove themselves, or admins/project leads can remove others
            const canRemove = userId.toString() === watcherUserId.toString() || 
                            membership.role === 'workspace_admin' ||
                            task.project.getMemberRole(userId) === 'project_lead';

            if (!canRemove) {
                return {
                    success: false,
                    message: 'Access denied. You can only remove yourself as a watcher.'
                };
            }

            // Remove watcher
            task.removeWatcher(watcherUserId);
            await task.save();

            return {
                success: true,
                message: 'Watcher removed successfully'
            };

        } catch (error) {
            console.error('Remove watcher error:', error);
            return {
                success: false,
                message: 'Failed to remove watcher'
            };
        }
    }

    // Get user tasks
    async getUserTasks(userId, filters = {}, page = 1, limit = 20) {
        try {
            // Get user's workspace memberships
            const memberships = await WorkspaceMember.find({
                user: userId,
                status: 'active'
            }).select('workspace');

            const workspaceIds = memberships.map(m => m.workspace);

            // Build query
            const query = {
                workspace: { $in: workspaceIds }
            };

            // Apply user-specific filters
            if (filters.assignedToMe) {
                query.assignee = userId;
            }
            if (filters.reportedByMe) {
                query.reporter = userId;
            }
            if (filters.watchedByMe) {
                query.watchers = userId;
            }

            // Apply other filters
            if (filters.status) {
                query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
            }
            if (filters.priority) {
                query.priority = Array.isArray(filters.priority) ? { $in: filters.priority } : filters.priority;
            }
            if (filters.overdue) {
                query.dueDate = { $lt: new Date() };
                query.status = { $nin: ['done', 'cancelled'] };
            }

            const skip = (page - 1) * limit;

            const tasks = await Task.find(query)
                .populate('project', 'name')
                .populate('assignee', 'name email avatar')
                .populate('reporter', 'name email avatar')
                .sort({ dueDate: 1, priority: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Task.countDocuments(query);

            const tasksList = tasks.map(task => ({
                id: task._id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                type: task.type,
                assignee: task.assignee,
                reporter: task.reporter,
                project: task.project,
                dueDate: task.dueDate,
                progress: task.progress,
                isOverdue: task.isOverdue,
                createdAt: task.createdAt
            }));

            return {
                success: true,
                tasks: tasksList,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };

        } catch (error) {
            console.error('Get user tasks error:', error);
            return {
                success: false,
                message: 'Failed to fetch user tasks'
            };
        }
    }
}

module.exports = new TaskService();

