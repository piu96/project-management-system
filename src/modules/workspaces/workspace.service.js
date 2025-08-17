const Workspace = require('../../models/Workspace');
const WorkspaceMember = require('../../models/WorkspaceMember');
const User = require('../../models/User');
const crypto = require('crypto');

class WorkspaceService {
    // Create new workspace
    async createWorkspace(ownerId, workspaceData) {
        try {
            const { name, description, plan = 'free' } = workspaceData;

            // Generate unique slug
            const baseSlug = name.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');

            let slug = baseSlug;
            let counter = 1;

            // Ensure slug is unique
            while (await Workspace.findOne({ slug })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Create workspace
            const workspace = new Workspace({
                name,
                description,
                slug,
                owner: ownerId,
                plan,
                settings: {
                    allowPublicJoin: false,
                    requireApproval: true,
                    allowGuestAccess: false
                }
            });


            await workspace.save();

            // Add owner as admin member, rollback workspace if member creation fails
            try {
                const workspaceMember = new WorkspaceMember({
                    workspace: workspace._id,
                    user: ownerId,
                    invitedBy: ownerId,
                    role: 'workspace_admin',
                    status: 'active',
                    joinedAt: new Date()
                });
                await workspaceMember.save();
            } catch (memberError) {
                // Rollback: delete workspace if member creation fails
                await Workspace.findByIdAndDelete(workspace._id);
                throw memberError;
            }

            return {
                success: true,
                message: 'Workspace created successfully',
                workspace: {
                    id: workspace._id,
                    name: workspace.name,
                    description: workspace.description,
                    slug: workspace.slug,
                    plan: workspace.plan,
                    ownerId: workspace.owner,
                    settings: workspace.settings,
                    createdAt: workspace.createdAt
                }
            };

        } catch (error) {
            console.error('Create workspace error:', error);
            return {
                success: false,
                message: 'Failed to create workspace'
            };
        }
    }


    // Get user workspaces with pagination
    async getUserWorkspaces(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const workspaceMembers = await WorkspaceMember.find({
                user: userId,
                status: 'active'
            })
            .populate('workspace')
            .skip(skip)
            .limit(limit);

            const total = await WorkspaceMember.countDocuments({
                user: userId,
                status: 'active'
            });

            const workspaces = workspaceMembers
                .filter(member => member.workspace)
                .map(member => ({
                    id: member.workspace._id,
                    name: member.workspace.name,
                    description: member.workspace.description,
                    slug: member.workspace.slug,
                    plan: member.workspace.plan,
                    role: member.role,
                    joinedAt: member.joinedAt,
                    isOwner: member.workspace.owner.toString() === userId.toString()
                }));

            return {
                success: true,
                workspaces,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Get user workspaces error:', error);
            return {
                success: false,
                message: 'Failed to fetch workspaces'
            };
        }
    }

    // Get workspace details
    async getWorkspaceDetails(workspaceId, userId) {
        try {
            // Check if user is member of workspace
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

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    message: 'Workspace not found'
                };
            }

            // Get member count
            const memberCount = await WorkspaceMember.countDocuments({
                workspace: workspaceId,
                status: 'active'
            });

            return {
                success: true,
                workspace: {
                    id: workspace._id,
                    name: workspace.name,
                    description: workspace.description,
                    slug: workspace.slug,
                    plan: workspace.plan,
                    ownerId: workspace.owner,
                    settings: workspace.settings,
                    memberCount,
                    userRole: membership.role,
                    isOwner: workspace.owner.toString() === userId.toString(),
                    createdAt: workspace.createdAt,
                    updatedAt: workspace.updatedAt
                }
            };

        } catch (error) {
            console.error('Get workspace details error:', error);
            return {
                success: false,
                message: 'Failed to fetch workspace details'
            };
        }
    }

    // Update workspace
    async updateWorkspace(workspaceId, userId, updateData) {
        try {
            // Check if user is admin or owner (fix role and field names)
            const membership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                role: { $in: ['workspace_admin', 'workspace_owner'] },
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                };
            }

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    message: 'Workspace not found'
                };
            }

            // Update allowed fields
            const allowedFields = ['name', 'description', 'settings'];
            const updateFields = {};

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields[field] = updateData[field];
                }
            });

            // Update slug if name changed
            if (updateData.name && updateData.name !== workspace.name) {
                const baseSlug = updateData.name.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');

                let slug = baseSlug;
                let counter = 1;

                while (await Workspace.findOne({ slug, _id: { $ne: workspaceId } })) {
                    slug = `${baseSlug}-${counter}`;
                    counter++;
                }

                updateFields.slug = slug;
            }

            await Workspace.findByIdAndUpdate(workspaceId, updateFields);

            return {
                success: true,
                message: 'Workspace updated successfully'
            };

        } catch (error) {
            console.error('Update workspace error:', error);
            return {
                success: false,
                message: 'Failed to update workspace'
            };
        }
    }

    // Get workspace members
    async getWorkspaceMembers(workspaceId, userId) {
        try {
            // Check if user is member of workspace
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

            const members = await WorkspaceMember.find({
                workspace: workspaceId,
                status: 'active'
            }).populate('user', 'name email avatar').sort({ joinedAt: -1 });

            const membersList = members.map(member => ({
                id: member._id,
                userId: member.user._id,
                name: member.user.name,
                email: member.user.email,
                avatar: member.user.avatar,
                role: member.role,
                joinedAt: member.joinedAt
            }));

            return {
                success: true,
                members: membersList
            };

        } catch (error) {
            console.error('Get workspace members error:', error);
            return {
                success: false,
                message: 'Failed to fetch workspace members'
            };
        }
    }

    // Generate invitation link
    async generateInviteLink(workspaceId, userId, role = 'member') {
        try {
            // Check if user is admin or owner
            const membership = await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                role: { $in: ['workspace_admin', 'project_manager'] },
                status: 'active'
            });

            if (!membership) {
                return {
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                };
            }

            const workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    message: 'Workspace not found'
                };
            }

            // Generate invitation token
            const inviteToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            // Use valid role for pending invite
            const validRole = ['workspace_admin', 'project_manager', 'team_member'].includes(role) ? role : 'team_member';
            // Create pending WorkspaceMember (omit 'user' field)
            const inviteMember = new WorkspaceMember({
                workspace: workspaceId,
                invitedBy: userId,
                role: validRole,
                status: 'pending',
                inviteToken,
                inviteExpires: expiresAt
            });
            await inviteMember.save();

            const inviteLink = `${process.env.CLIENT_URL}/invite/${inviteToken}`;

            return {
                success: true,
                message: 'Invitation link generated successfully',
                inviteLink,
                expiresAt,
                inviteToken
            };

        } catch (error) {
            console.error('Generate invite link error:', error);
            return {
                success: false,
                message: 'Failed to generate invitation link'
            };
        }
    }

    // Join workspace by invite token
    async joinWorkspaceByInvite(inviteToken, userId) {
        try {
            // Find the invitation
            const member = await WorkspaceMember.findOne({
                inviteToken,
                status: 'pending',
                inviteExpires: { $gt: new Date() }
            });
            if (!member) {
                return { success: false, message: 'Invalid or expired invite token' };
            }
            // Check if user already a member
            const alreadyMember = await WorkspaceMember.findOne({
                workspace: member.workspace,
                user: userId,
                status: 'active'
            });
            if (alreadyMember) {
                return { success: false, message: 'You are already a member of this workspace' };
            }
            // Accept invite
            member.user = userId;
            member.acceptInvite();
            await member.save();
            return {
                success: true,
                message: 'Joined workspace successfully',
                data: { workspaceId: member.workspace }
            };
        } catch (error) {
            console.error('Join workspace by invite error:', error);
            return { success: false, message: 'Failed to join workspace' };
        }
    }
}

module.exports = new WorkspaceService();

