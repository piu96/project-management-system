const express = require('express');
const router = express.Router();

// All mobile/app routes register here //

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile/App API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Basic routes - will be replaced with actual modules
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Project Management Mobile/App API',
    version: '1.0.0',
    endpoints: {
      health: '/api/app/health',
      auth: {
        register: 'POST /api/app/auth/register',
        login: 'POST /api/app/auth/login'
      },
      workspaces: {
        create: 'POST /api/app/workspaces',
        list: 'GET /api/app/workspaces',
        details: 'GET /api/app/workspaces/:id',
        update: 'PUT /api/app/workspaces/:id',
        members: 'GET /api/app/workspaces/:id/members',
        invite: 'POST /api/app/workspaces/:id/invite'
      },
      projects: {
        create: 'POST /api/app/projects',
        list: 'GET /api/app/projects/workspace/:workspaceId',
        details: 'GET /api/app/projects/:id',
        update: 'PUT /api/app/projects/:id',
        delete: 'DELETE /api/app/projects/:id',
        addMember: 'POST /api/app/projects/:id/members',
        removeMember: 'DELETE /api/app/projects/:id/members/:userId'
      },
      tasks: {
        create: 'POST /api/app/tasks',
        list: 'GET /api/app/tasks/project/:projectId',
        details: 'GET /api/app/tasks/:id',
        update: 'PUT /api/app/tasks/:id',
        delete: 'DELETE /api/app/tasks/:id',
        addComment: 'POST /api/app/tasks/:id/comments',
        addTimeEntry: 'POST /api/app/tasks/:id/time'
      },
      dashboard: {
        user: 'GET /api/app/dashboard',
        workspace: 'GET /api/app/dashboard/workspace/:workspaceId',
        project: 'GET /api/app/dashboard/project/:projectId',
        analytics: 'GET /api/app/dashboard/analytics',
        export: 'GET /api/app/dashboard/export'
      },
      timeTracking: {
        startTimer: 'POST /api/app/time-tracking/timer/start',
        stopTimer: 'PUT /api/app/time-tracking/timer/:timeEntryId/stop',
        runningTimer: 'GET /api/app/time-tracking/timer/running',
        logTime: 'POST /api/app/time-tracking/entries',
        getEntries: 'GET /api/app/time-tracking/entries',
        updateEntry: 'PUT /api/app/time-tracking/entries/:timeEntryId',
        deleteEntry: 'DELETE /api/app/time-tracking/entries/:timeEntryId',
        projectSummary: 'GET /api/app/time-tracking/projects/:projectId',
        taskSummary: 'GET /api/app/time-tracking/tasks/:taskId',
        reports: 'GET /api/app/time-tracking/workspaces/:workspaceId/reports',
        dashboard: 'GET /api/app/time-tracking/workspaces/:workspaceId/dashboard',
        mySummary: 'GET /api/app/time-tracking/my-summary'
      },
      progressTracking: {
        updateTaskProgress: 'PUT /api/app/progress/tasks/:taskId',
        getTaskProgress: 'GET /api/app/progress/tasks/:taskId',
        getProjectProgress: 'GET /api/app/progress/projects/:projectId',
        getWorkspaceProgress: 'GET /api/app/progress/workspaces/:workspaceId',
        bulkUpdateTasks: 'PUT /api/app/progress/tasks/bulk',
        getAnalytics: 'GET /api/app/progress/projects/:projectId/analytics',
        generateReports: 'GET /api/app/progress/reports',
        compareProjects: 'GET /api/app/progress/compare',
        getInsights: 'GET /api/app/progress/insights/:projectId',
        getHealthScore: 'GET /api/app/progress/health/:workspaceId'
      }
    }
  });
});

// Authentication routes
const authRoutes = require('../modules/auth/auth.route');
router.use('/auth', authRoutes);

// Workspace routes
const workspaceRoutes = require('../modules/workspaces/workspace.route');
router.use('/workspaces', workspaceRoutes);

// Project routes
const projectRoutes = require('../modules/projects/project.route');
router.use('/projects', projectRoutes);

// Task routes
const taskRoutes = require('../modules/tasks/task.route');
router.use('/tasks', taskRoutes);

// Dashboard routes
const dashboardRoutes = require('../modules/dashboard/dashboard.route');
router.use('/dashboard', dashboardRoutes);

// Time tracking routes
const timeTrackingRoutes = require('../modules/time-tracking/time-tracking.route');
router.use('/time-tracking', timeTrackingRoutes);

// Progress tracking routes
const progressTrackingRoutes = require('../modules/time-tracking/progress-tracking.route');
router.use('/progress', progressTrackingRoutes);

module.exports = router;
