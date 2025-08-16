const { validationResult } = require('express-validator');
const projectService = require('./project.service');

class ProjectController {
    // Create project
    createProjectHandler = async (req, res) => {
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
            const projectData = req.body;

            const result = await projectService.createProject(userId, projectData);

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
                data: result.project
            });

        } catch (error) {
            console.error('Create project controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Get project details
    getProjectDetailsHandler = async (req, res) => {
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
            const { projectId } = req.params;

            const result = await projectService.getProjectDetails(projectId, userId);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 404).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: 'Project details fetched successfully',
                data: result.project
            });

        } catch (error) {
            console.error('Get project details controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Update project
    updateProjectHandler = async (req, res) => {
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
            const { projectId } = req.params;
            const updateData = req.body;

            const result = await projectService.updateProject(projectId, userId, updateData);

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
            console.error('Update project controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Delete project
    deleteProjectHandler = async (req, res) => {
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
            const { projectId } = req.params;

            const result = await projectService.deleteProject(projectId, userId);

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
            console.error('Delete project controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // List projects in workspace
    listWorkspaceProjectsHandler = async (req, res) => {
        try {
            const userId = req.user._id;
            const { workspaceId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await projectService.listWorkspaceProjects(workspaceId, userId, page, limit);

            if (!result.success) {
                return res.status(result.message.includes('Access denied') ? 403 : 400).json({
                    status: 0,
                    message: result.message,
                    data: {}
                });
            }

            return res.status(200).json({
                status: 1,
                message: 'Projects fetched successfully',
                data: {
                    projects: result.projects,
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages
                }
            });

        } catch (error) {
            console.error('List workspace projects controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Add project member
    addProjectMemberHandler = async (req, res) => {
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
            const { projectId } = req.params;
            const memberData = req.body;

            const result = await projectService.addProjectMember(projectId, userId, memberData);

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
            console.error('Add project member controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };

    // Remove project member
    removeProjectMemberHandler = async (req, res) => {
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
            const { projectId, userId: memberUserId } = req.params;

            const result = await projectService.removeProjectMember(projectId, userId, memberUserId);

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
            console.error('Remove project member controller error:', error);
            return res.status(500).json({
                status: 0,
                message: 'Internal server error',
                data: {}
            });
        }
    };
}

module.exports = new ProjectController();

// Generated by Copilot
