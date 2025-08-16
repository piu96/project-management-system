const Project = require('../../models/Project');
const Workspace = require('../../models/Workspace');
const WorkspaceMember = require('../../models/WorkspaceMember');

class ProjectService {
    // Create new project
    async createProject(userId, data) {
        try {
            const { workspaceId, name, description, status, priority, startDate, endDate, tags, budget, client, settings } = data;

            // Check if user is member of workspace and has permissions
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

            // Check if user has permission to create projects
            if (!['workspace_admin', 'project_manager'].includes(membership.role)) {
                return {
                    success: false,
                    message: 'Access denied. You need admin or project manager privileges to create projects.'
                };
            }

            // Check if project name already exists in this workspace
            const existingProject = await Project.findOne({
                workspace: workspaceId,
                name: name.trim()
            });

            if (existingProject) {
                return {
                    success: false,
                    message: 'A project with this name already exists in the workspace.'
                };
            }

            // Create project
            const project = new Project({
                workspace: workspaceId,
                name: name.trim(),
                description: description || '',
                status: status || 'planning',
                priority: priority || 'medium',
                startDate: startDate || null,
                endDate: endDate || null,
                owner: userId,
                members: [{ user: userId, role: 'project_lead' }],
                tags: tags || [],
                budget: budget || { allocated: 0, spent: 0, currency: 'USD' },
                client: client || {},
                settings: settings || {
                    isPublic: false,
                    allowTimeTracking: true,
                    requireTaskApproval: false,
                    notifyOnTaskComplete: true
                }
            });

            await project.save();

            return {
                success: true,
                message: 'Project created successfully',
                project: {
                    id: project._id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    priority: project.priority,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    owner: project.owner,
                    workspace: project.workspace,
                    progress: project.progress,
                    createdAt: project.createdAt
                }
            };

        } catch (error) {
            console.error('Create project error:', error);
            return {
                success: false,
                message: 'Failed to create project'
            };
        }
    }

    // Get project details
    async getProjectDetails(projectId, userId) {
        try {
            const project = await Project.findById(projectId)
                .populate('workspace', 'name slug')
                .populate('owner', 'name email avatar')
                .populate('members.user', 'name email avatar');

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

            return {
                success: true,
                project: {
                    id: project._id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    priority: project.priority,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    actualStartDate: project.actualStartDate,
                    actualEndDate: project.actualEndDate,
                    owner: project.owner,
                    members: project.members,
                    tags: project.tags,
                    progress: project.progress,
                    budget: project.budget,
                    client: project.client,
                    settings: project.settings,
                    workspace: project.workspace,
                    isOwner: project.owner._id.toString() === userId.toString(),
                    userRole: project.getMemberRole(userId),
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt
                }
            };

        } catch (error) {
            console.error('Get project details error:', error);
            return {
                success: false,
                message: 'Failed to fetch project details'
            };
        }
    }

    // Update project
    async updateProject(projectId, userId, updateData) {
        try {
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

            // Check permissions - owner, admin, or project manager can update
            const isOwner = project.owner.toString() === userId.toString();
            const hasPermission = ['workspace_admin', 'project_manager'].includes(membership.role);
            
            if (!isOwner && !hasPermission) {
                return {
                    success: false,
                    message: 'Access denied. Only project owner, admin, or project manager can update projects.'
                };
            }

            // Update allowed fields
            const allowedFields = ['name', 'description', 'status', 'priority', 'startDate', 'endDate', 'tags', 'budget', 'client', 'settings'];
            const updateFields = {};

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields[field] = updateData[field];
                }
            });

            // Check for duplicate name if name is being updated
            if (updateData.name && updateData.name !== project.name) {
                const existingProject = await Project.findOne({
                    workspace: project.workspace,
                    name: updateData.name.trim(),
                    _id: { $ne: projectId }
                });

                if (existingProject) {
                    return {
                        success: false,
                        message: 'A project with this name already exists in the workspace.'
                    };
                }
            }

            await Project.findByIdAndUpdate(projectId, updateFields);

            return {
                success: true,
                message: 'Project updated successfully'
            };

        } catch (error) {
            console.error('Update project error:', error);
            return {
                success: false,
                message: 'Failed to update project'
            };
        }
    }

    // Delete project
    async deleteProject(projectId, userId) {
        try {
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

            // Only owner or workspace admin can delete
            const isOwner = project.owner.toString() === userId.toString();
            const isAdmin = membership.role === 'workspace_admin';
            
            if (!isOwner && !isAdmin) {
                return {
                    success: false,
                    message: 'Access denied. Only project owner or workspace admin can delete projects.'
                };
            }

            await Project.findByIdAndDelete(projectId);

            return {
                success: true,
                message: 'Project deleted successfully'
            };

        } catch (error) {
            console.error('Delete project error:', error);
            return {
                success: false,
                message: 'Failed to delete project'
            };
        }
    }

    // List projects in workspace
    async listWorkspaceProjects(workspaceId, userId, page = 1, limit = 10) {
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

            const skip = (page - 1) * limit;
            
            const projects = await Project.find({
                workspace: workspaceId,
                'archived.isArchived': false
            })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            const total = await Project.countDocuments({
                workspace: workspaceId,
                'archived.isArchived': false
            });

            const projectsList = projects.map(project => ({
                id: project._id,
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority,
                startDate: project.startDate,
                endDate: project.endDate,
                owner: project.owner,
                memberCount: project.members.length,
                progress: project.progress,
                tags: project.tags,
                isOwner: project.owner._id.toString() === userId.toString(),
                userRole: project.getMemberRole(userId),
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }));

            return {
                success: true,
                projects: projectsList,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };

        } catch (error) {
            console.error('List workspace projects error:', error);
            return {
                success: false,
                message: 'Failed to fetch projects'
            };
        }
    }

    // Add member to project
    async addProjectMember(projectId, userId, memberData) {
        try {
            const { userId: newMemberId, role = 'developer' } = memberData;

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

            // Check permissions - owner, admin, or project manager can add members
            const isOwner = project.owner.toString() === userId.toString();
            const hasPermission = ['workspace_admin', 'project_manager'].includes(membership.role);
            
            if (!isOwner && !hasPermission) {
                return {
                    success: false,
                    message: 'Access denied. Only project owner, admin, or project manager can add members.'
                };
            }

            // Check if new member is workspace member
            const newMemberWorkspaceMembership = await WorkspaceMember.findOne({
                workspace: project.workspace,
                user: newMemberId,
                status: 'active'
            });

            if (!newMemberWorkspaceMembership) {
                return {
                    success: false,
                    message: 'User is not a member of this workspace.'
                };
            }

            // Check if already project member
            if (project.isMember(newMemberId)) {
                return {
                    success: false,
                    message: 'User is already a member of this project.'
                };
            }

            // Add member
            project.addMember(newMemberId, role);
            await project.save();

            return {
                success: true,
                message: 'Member added successfully'
            };

        } catch (error) {
            console.error('Add project member error:', error);
            return {
                success: false,
                message: 'Failed to add member'
            };
        }
    }

    // Remove member from project
    async removeProjectMember(projectId, userId, memberUserId) {
        try {
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

            // Check permissions - owner, admin, or project manager can remove members
            const isOwner = project.owner.toString() === userId.toString();
            const hasPermission = ['workspace_admin', 'project_manager'].includes(membership.role);
            
            if (!isOwner && !hasPermission) {
                return {
                    success: false,
                    message: 'Access denied. Only project owner, admin, or project manager can remove members.'
                };
            }

            // Cannot remove project owner
            if (project.owner.toString() === memberUserId.toString()) {
                return {
                    success: false,
                    message: 'Cannot remove project owner.'
                };
            }

            // Check if user is project member
            if (!project.isMember(memberUserId)) {
                return {
                    success: false,
                    message: 'User is not a member of this project.'
                };
            }

            // Remove member
            project.removeMember(memberUserId);
            await project.save();

            return {
                success: true,
                message: 'Member removed successfully'
            };

        } catch (error) {
            console.error('Remove project member error:', error);
            return {
                success: false,
                message: 'Failed to remove member'
            };
        }
    }
}

module.exports = new ProjectService();

// Generated by Copilot
