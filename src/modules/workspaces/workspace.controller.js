const { validationResult } = require('express-validator');
const workspaceService = require('./workspace.service');

class WorkspaceController {
    // Create new workspace
    createWorkspaceHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const userId = req.user._id;
            const { name, description, plan } = req.body;

            // Create workspace through service
            const result = await workspaceService.createWorkspace(userId, {
                name,
                description,
                plan
            });

            if (!result.success) {
                return res.status(400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(201).json({
                status: 1,
                message: result.message,
                data: result.workspace
            });

        } catch (error) {
            console.error('Create workspace controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Get user workspaces with pagination
    getUserWorkspacesHandler = async (req, res) => {
        try {
            const userId = req.user._id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await workspaceService.getUserWorkspaces(userId, page, limit);

            if (!result.success) {
                return res.status(400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: 'Workspaces fetched successfully',
                data: {
                    workspaces: result.workspaces,
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages
                }
            });

        } catch (error) {
            console.error('Get user workspaces controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Get workspace details
    getWorkspaceDetailsHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const userId = req.user._id;
            const { workspaceId } = req.params;

            const result = await workspaceService.getWorkspaceDetails(workspaceId, userId);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 404).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: 'Workspace details fetched successfully',
                data: result.workspace
            });

        } catch (error) {
            console.error('Get workspace details controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Update workspace
    updateWorkspaceHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const userId = req.user._id;
            const { workspaceId } = req.params;
            const updateData = req.body;

            const result = await workspaceService.updateWorkspace(workspaceId, userId, updateData);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: result.message,
                data: {}
            });

        } catch (error) {
            console.error('Update workspace controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Get workspace members
    getWorkspaceMembersHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const userId = req.user._id;
            const { workspaceId } = req.params;

            const result = await workspaceService.getWorkspaceMembers(workspaceId, userId);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: 'Workspace members fetched successfully',
                data: {
                    members: result.members,
                    total: result.members.length
                }
            });

        } catch (error) {
            console.error('Get workspace members controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Generate invitation link
    generateInviteLinkHandler = async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 0,
                    message: errors.array()[0].msg,
                    data: {}
                });
            }

            const userId = req.user._id;
            const { workspaceId } = req.params;
            const { role = 'member' } = req.body;

            const result = await workspaceService.generateInviteLink(workspaceId, userId, role);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: result.message,
                data: {
                    inviteLink: result.inviteLink,
                    expiresAt: result.expiresAt,
                    inviteToken: result.inviteToken
                }
            });

        } catch (error) {
            console.error('Generate invite link controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Join workspace by invite token
    joinWorkspaceByInviteHandler = async (req, res) => {
        try {
            const userId = req.user._id;
            const { inviteToken } = req.params;

            const result = await workspaceService.joinWorkspaceByInvite(inviteToken, userId);

            if (!result.success) {
                return res.status(400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: result.message,
                data: result.data || {}
            });
        } catch (error) {
            console.error('Join workspace by invite controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    }
}

module.exports = new WorkspaceController();

// Generated by Copilot
