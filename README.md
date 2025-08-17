# Project Management Application

## Overview
A comprehensive project management application built with Node.js, Express.js, and MongoDB. This application provides teams with tools to manage projects, tasks, collaborate effectively, and track progress in real-time.

## Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## Features

### 🏢 Workspace Management
- Create and manage multiple workspaces (organizations)
- Workspace-level user permissions and roles
- Workspace settings and customization
- Invite users to specific workspaces
- Switch between different workspaces
- Workspace billing and subscription management

### 🔐 User Management & Authentication
- User registration and login with JWT authentication
- Role-based access control (Workspace Admin, Project Manager, Team Member)
- User profile management across workspaces
- Password reset functionality
- Multi-workspace user management
- Workspace invitation system

### 📁 Project Management
- Create, edit, and delete projects
- Project overview with key metrics
- Project status tracking (Planning, Active, On Hold, Completed)
- Project templates for quick setup
- Project archiving and restoration

### ✅ Task Management
- Create, assign, and update tasks
- Task prioritization (High, Medium, Low)
- Task status workflow (To Do → In Progress → Review → Done)
- Subtasks and task dependencies
- Task comments and file attachments
- Drag-and-drop task organization

### 👥 Team Collaboration
- Team member assignment to projects and tasks
- User roles and permissions (Workspace Admin, Project Manager, Team Member)
- Task assignment and ownership tracking
- Project member management with role-based access
- Comment system foundation (model implemented)
- Activity tracking in dashboard
- Workspace member invitation system
- User mentions in comments (@mentions)
- Task watchers and notification system

### ⏱️ Time & Progress Tracking
- Time logging for tasks and projects
- Progress tracking with percentage completion
- Deadline management and reminders
- Milestone creation and tracking
- Gantt chart visualization
- Time reports and analytics

### 📊 Dashboard & Reporting
- Personalized dashboard with task overview
- Project progress dashboard
- Team performance metrics
- Time tracking reports
- Export functionality (PDF, CSV)
- Advanced filtering and search

### 📅 Calendar & Scheduling
- Integrated calendar view
- Task deadline visualization
- Project timeline overview
- Meeting scheduling integration
- Milestone calendar

### 📬 Notifications
- Real-time notifications for task updates
- Email notifications for important events
- In-app notifications and alerts
- Notification settings and preferences

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vue)   │◄──►│   (Node.js +    │◄──►│   (MongoDB)     │
│                 │    │    Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Middleware    │              │
         │              │   - Auth        │              │
         │              │   - Validation  │              │
         │              │   - Logging     │              │
         │              └─────────────────┘              │
         │                                               │
    ┌─────────────────┐                        ┌─────────────────┐
    │   External      │                        │   File Storage  │
    │   Services      │                        │   (Local/Cloud) │
    │   - Email       │                        │                 │
    │   - Push Notif  │                        │                 │
    └─────────────────┘                        └─────────────────┘
```

### Database Architecture
```
MongoDB Database: project_management
├── Collections:
│   ├── users                    # User accounts (global)
│   ├── workspaces              # Workspace/Organization data
│   ├── workspace_members       # User-Workspace relationships
│   ├── projects                # Projects (workspace-scoped)
│   ├── tasks                   # Tasks (workspace-scoped)
│   ├── comments                # Task/Project comments
│   ├── time_entries            # Time tracking logs
│   ├── notifications           # User notifications
│   └── dashboard_widgets       # User dashboard configurations
│
├── Indexes:
│   ├── users: { email: 1 } (unique)
│   ├── workspace_members: { workspace: 1, user: 1 } (compound)
│   ├── projects: { workspace: 1, status: 1 }
│   ├── tasks: { workspace: 1, project: 1, assignee: 1 }
│   ├── time_entries: { user: 1, date: 1 }
│   ├── comments: { task: 1, createdAt: -1 }
│   └── dashboard_widgets: { user: 1, workspace: 1 }
│
└── Relationships:
    ├── Workspace → WorkspaceMembers (1:Many)
    ├── User → WorkspaceMembers (1:Many) 
    ├── Workspace → Projects (1:Many)
    ├── Project → Tasks (1:Many)
    ├── User → Tasks (1:Many) [assignee, reporter]
    ├── Task → Comments (1:Many)
    ├── Task → TimeEntries (1:Many)
    ├── Project → TimeEntries (1:Many)
    ├── User → TimeEntries (1:Many)
    ├── User → DashboardWidgets (1:Many)
    ├── Comment → Comment (1:Many) [replies]
    └── Task → Task (Many:Many) [dependencies, subtasks]
```

### Database Connection Flow
```
src/DB/db.connection.js
├── MongoDB Connection Setup
├── Mongoose Configuration  
├── Connection Pool Management
├── Error Handling & Retry Logic
└── Environment-based Configuration
    ├── Development: Local MongoDB
    ├── Testing: In-Memory MongoDB
    └── Production: MongoDB Atlas
```

### Backend Architecture
```
project-management/
├── src/
│   ├── config/              # Application configurations
│   ├── DB/                  # Database connection and configuration
│   ├── models/              # MongoDB/Mongoose models
│   ├── modules/             # Business logic modules (feature-based)
│   │   ├── auth/           # Authentication module
│   │   │   ├── auth.controller.js    # Authentication logic
│   │   │   ├── auth.service.js       # Auth business logic
│   │   │   ├── auth.validator.js     # Auth input validation
│   │   │   ├── auth.route.js         # Auth routes
│   │   │   └── auth.middleware.js    # Auth middleware
│   │   ├── workspaces/     # Workspace management
│   │   │   ├── workspace.controller.js
│   │   │   ├── workspace.service.js
│   │   │   ├── workspace.validator.js
│   │   │   └── workspace.route.js
│   │   ├── projects/       # Project management
│   │   │   ├── project.controller.js
│   │   │   ├── project.service.js
│   │   │   ├── project.validator.js
│   │   │   └── project.route.js
│   │   ├── tasks/          # Task management
│   │   │   ├── task.controller.js
│   │   │   ├── task.service.js
│   │   │   ├── task.validator.js
│   │   │   └── task.route.js
│   │   ├── time-tracking/  # Time & Progress tracking
│   │   │   ├── time-tracking.controller.js
│   │   │   ├── time-tracking.service.js
│   │   │   ├── time-tracking.validator.js
│   │   │   ├── time-tracking.route.js
│   │   │   ├── progress-tracking.controller.js
│   │   │   ├── progress-tracking.service.js
│   │   │   ├── progress-tracking.validator.js
│   │   │   └── progress-tracking.route.js
│   │   ├── dashboard/      # Dashboard management
│   │   │   ├── dashboard.controller.js
│   │   │   ├── dashboard.service.js
│   │   │   ├── dashboard.validator.js
│   │   │   └── dashboard.route.js
│   │   └── notifications/  # Notification management
│   │       ├── notification.controller.js
│   │       ├── notification.service.js
│   │       ├── notification.validator.js
│   │       └── notification.route.js
│   ├── routes/             # API route definitions
│   │   ├── app.js          # Mobile/App routes
│   │   └── web.js          # Web application routes
│   ├── services/           # External services and integrations
│   └── utils/              # Helper functions and utilities
├── bin/                    # Application entry point
├── public/                 # Static files
├── app.js                  # Express application setup
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## Database Schema

### Workspaces Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  slug: String (unique),
  logo: String,
  owner: ObjectId (ref: User),
  settings: {
    timezone: String,
    workingDays: [String],
    workingHours: { start: String, end: String },
    currency: String,
    features: [String]
  },
  subscription: {
    plan: String (enum: ['free', 'pro', 'enterprise']),
    expiresAt: Date,
    isActive: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### WorkspaceMembers Collection
```javascript
{
  _id: ObjectId,
  workspace: ObjectId (ref: Workspace),
  user: ObjectId (ref: User),
  role: String (enum: ['workspace_admin', 'project_manager', 'team_member']),
  permissions: [String],
  invitedBy: ObjectId (ref: User),
  invitedAt: Date,
  joinedAt: Date,
  status: String (enum: ['pending', 'active', 'inactive']),
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  defaultWorkspace: ObjectId (ref: Workspace),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```javascript
{
  _id: ObjectId,
  workspace: ObjectId (ref: Workspace),
  name: String,
  description: String,
  status: String (enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  priority: String (enum: ['low', 'medium', 'high', 'critical']),
  startDate: Date,
  endDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  owner: ObjectId (ref: User),
  members: [{
    user: ObjectId (ref: User),
    role: String (enum: ['project_manager', 'developer', 'designer', 'tester', 'viewer']),
    joinedAt: Date
  }],
  tags: [String],
  progress: Number (0-100),
  budget: {
    estimated: Number,
    actual: Number,
    currency: String
  },
  visibility: String (enum: ['public', 'private', 'team']),
  archived: {
    isArchived: Boolean,
    archivedAt: Date,
    archivedBy: ObjectId (ref: User)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection
```javascript
{
  _id: ObjectId,
  workspace: ObjectId (ref: Workspace),
  title: String,
  description: String,
  project: ObjectId (ref: Project),
  assignee: ObjectId (ref: User),
  reporter: ObjectId (ref: User),
  status: String (enum: ['todo', 'in_progress', 'review', 'done', 'cancelled']),
  priority: String (enum: ['low', 'medium', 'high', 'critical']),
  type: String (enum: ['task', 'bug', 'feature', 'story', 'epic']),
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  estimatedHours: Number,
  loggedHours: Number,
  remainingHours: Number,
  progress: Number (0-100),
  tags: [String],
  dependencies: [{
    task: ObjectId (ref: Task),
    type: String (enum: ['blocks', 'blocked_by', 'relates_to'])
  }],
  subtasks: [ObjectId] (ref: Task),
  parentTask: ObjectId (ref: Task),
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedBy: ObjectId (ref: User),
    uploadedAt: Date
  }],
  checklist: [{
    text: String,
    completed: Boolean,
    completedBy: ObjectId (ref: User),
    completedAt: Date
  }],
  customFields: [{
    name: String,
    type: String (enum: ['text', 'number', 'date', 'select', 'multiselect', 'boolean']),
    value: Mixed
  }],
  watchers: [ObjectId] (ref: User),
  position: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Comments Collection
```javascript
{
  _id: ObjectId,
  content: String,
  author: ObjectId (ref: User),
  task: ObjectId (ref: Task),
  project: ObjectId (ref: Project),
  parentComment: ObjectId (ref: Comment),
  mentions: [ObjectId] (ref: User),
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: Date
  }],
  reactions: [{
    user: ObjectId (ref: User),
    emoji: String (enum: ['👍', '👎', '❤️', '😄', '😮', '😢', '😡']),
    createdAt: Date
  }],
  isEdited: Boolean,
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### TimeEntries Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  task: ObjectId (ref: Task),
  project: ObjectId (ref: Project),
  workspace: ObjectId (ref: Workspace),
  description: String,
  hours: Number,
  date: Date,
  startTime: Date,
  endTime: Date,
  isRunning: Boolean,
  category: String (enum: ['development', 'design', 'testing', 'meeting', 'documentation', 'research', 'bug_fixing', 'review', 'other']),
  billable: Boolean,
  hourlyRate: Number,
  cost: Number,
  tags: [String],
  approved: {
    isApproved: Boolean,
    approvedBy: ObjectId (ref: User),
    approvedAt: Date,
    rejectionReason: String
  },
  invoice: {
    invoiceId: String,
    invoiced: Boolean,
    invoicedAt: Date
  },
  source: String (enum: ['manual', 'timer', 'import']),
  createdAt: Date,
  updatedAt: Date
}
```

### Notifications Collection
```javascript
{
  _id: ObjectId,
  recipient: ObjectId (ref: User),
  sender: ObjectId (ref: User),
  type: String (enum: ['task_assigned', 'comment_added', 'deadline_reminder', 'mention']),
  message: String,
  isRead: Boolean,
  relatedTask: ObjectId (ref: Task),
  relatedProject: ObjectId (ref: Project),
  createdAt: Date
}
```

### DashboardWidgets Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  workspace: ObjectId (ref: Workspace),
  widgets: [{
    id: String,
    type: String (enum: ['task_stats', 'project_stats', 'recent_activity', 'upcoming_tasks', 'productivity_chart', 'team_performance', 'calendar', 'notifications', 'quick_actions', 'time_tracking', 'workload_chart', 'progress_overview']),
    position: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    settings: {
      refreshInterval: Number,
      dateRange: String,
      showCompleted: Boolean,
      maxItems: Number,
      chartType: String,
      groupBy: String
    },
    isVisible: Boolean
  }],
  layout: String (enum: ['grid', 'list']),
  theme: String (enum: ['light', 'dark', 'auto']),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication Routes
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # User login
POST   /api/auth/logout        # User logout
POST   /api/auth/refresh       # Refresh JWT token
POST   /api/auth/forgot        # Forgot password
POST   /api/auth/reset         # Reset password
```

### Workspace Routes
```
GET    /api/workspaces         # Get user's workspaces
POST   /api/workspaces         # Create new workspace
GET    /api/workspaces/:id     # Get workspace details
PUT    /api/workspaces/:id     # Update workspace
DELETE /api/workspaces/:id     # Delete workspace
POST   /api/workspaces/:id/invite    # Invite user to workspace
GET    /api/workspaces/:id/members   # Get workspace members
PUT    /api/workspaces/:id/members/:userId # Update member role
DELETE /api/workspaces/:id/members/:userId # Remove member
POST   /api/workspaces/:id/switch    # Switch to workspace
```

### User Routes
```
GET    /api/users              # Get users in current workspace
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user profile
DELETE /api/users/:id          # Delete user
POST   /api/users/:id/avatar   # Upload avatar
```

### Project Routes (Workspace Scoped)
```
GET    /api/workspaces/:workspaceId/projects           # Get workspace projects
POST   /api/workspaces/:workspaceId/projects           # Create project
GET    /api/workspaces/:workspaceId/projects/:id       # Get project by ID
PUT    /api/workspaces/:workspaceId/projects/:id       # Update project
DELETE /api/workspaces/:workspaceId/projects/:id       # Delete project
POST   /api/workspaces/:workspaceId/projects/:id/members # Add member to project
DELETE /api/workspaces/:workspaceId/projects/:id/members/:userId # Remove member
```

### Task Routes (Workspace Scoped)
```
GET    /api/workspaces/:workspaceId/tasks              # Get workspace tasks
POST   /api/workspaces/:workspaceId/tasks              # Create task
GET    /api/workspaces/:workspaceId/tasks/:id          # Get task by ID
PUT    /api/workspaces/:workspaceId/tasks/:id          # Update task
DELETE /api/workspaces/:workspaceId/tasks/:id          # Delete task
POST   /api/workspaces/:workspaceId/tasks/:id/comments # Add comment
GET    /api/workspaces/:workspaceId/tasks/:id/comments # Get task comments
```

### Time Tracking Routes
```
POST   /api/app/time-tracking/timer/start              # Start time timer
PUT    /api/app/time-tracking/timer/:timeEntryId/stop  # Stop time timer
GET    /api/app/time-tracking/timer/running            # Get running timer
POST   /api/app/time-tracking/entries                  # Log time manually
GET    /api/app/time-tracking/entries                  # Get time entries
PUT    /api/app/time-tracking/entries/:timeEntryId     # Update time entry
DELETE /api/app/time-tracking/entries/:timeEntryId     # Delete time entry
GET    /api/app/time-tracking/projects/:projectId      # Get project time summary
GET    /api/app/time-tracking/tasks/:taskId            # Get task time summary
GET    /api/app/time-tracking/workspaces/:workspaceId/reports    # Time reports
GET    /api/app/time-tracking/workspaces/:workspaceId/dashboard  # Time dashboard
GET    /api/app/time-tracking/my-summary               # Personal time summary
PUT    /api/app/time-tracking/entries/bulk             # Bulk update entries
GET    /api/app/time-tracking/entries/export           # Export time data
```

### Progress Tracking Routes
```
PUT    /api/app/progress/tasks/:taskId                 # Update task progress
GET    /api/app/progress/tasks/:taskId                 # Get task progress details
GET    /api/app/progress/projects/:projectId           # Get project progress overview
GET    /api/app/progress/workspaces/:workspaceId       # Get workspace progress dashboard
PUT    /api/app/progress/tasks/bulk                    # Bulk update task progress
GET    /api/app/progress/projects/:projectId/analytics # Get progress analytics
GET    /api/app/progress/reports                       # Generate progress reports
GET    /api/app/progress/compare                       # Compare project progress
GET    /api/app/progress/insights/:projectId           # AI progress insights
GET    /api/app/progress/health/:workspaceId           # Workspace health score
```

### Dashboard Routes
```
GET    /api/app/dashboard                              # User dashboard overview
GET    /api/app/dashboard/workspace/:workspaceId       # Workspace dashboard
GET    /api/app/dashboard/project/:projectId           # Project dashboard
GET    /api/app/dashboard/analytics                    # Dashboard analytics
GET    /api/app/dashboard/export                       # Export dashboard data
```

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **express-validator** - Input validation

### Development Tools
- **nodemon** - Development server
- **dotenv** - Environment variables
- **eslint** - Code linting
- **prettier** - Code formatting
- **jest** - Testing framework
- **supertest** - API testing

### Optional Frontend
- **React.js** or **Vue.js** - Frontend framework
- **Axios** - HTTP client
- **Socket.io** - Real-time communication

## Project Structure

```
project-management/
├── src/
│   ├── config/
│   │   ├── app.config.js        # Application configuration
│   │   ├── jwt.config.js        # JWT configuration
│   │   └── upload.config.js     # File upload configuration
│   ├── DB/
│   │   ├── db.connection.js     # MongoDB connection
│   │   └── db.config.js         # Database configuration
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Workspace.js         # Workspace model
│   │   ├── WorkspaceMember.js   # Workspace member model
│   │   ├── Project.js           # Project model
│   │   ├── Task.js              # Task model
│   │   ├── Comment.js           # Comment model
│   │   ├── TimeEntry.js         # Time tracking model
│   │   ├── Notification.js      # Notification model
│   │   ├── DashboardWidget.js   # Dashboard configuration model
│   │   └── index.js             # Model exports
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js    # Authentication logic
│   │   │   ├── auth.service.js       # Auth business logic
│   │   │   └── auth.validator.js     # Auth input validation
│   │   ├── workspaces/
│   │   │   ├── workspace.controller.js
│   │   │   ├── workspace.service.js
│   │   │   └── workspace.validator.js
│   │   ├── projects/
│   │   │   ├── project.controller.js
│   │   │   ├── project.service.js
│   │   │   └── project.validator.js
│   │   ├── tasks/
│   │   │   ├── task.controller.js
│   │   │   ├── task.service.js
│   │   │   └── task.validator.js
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.validator.js
│   │   └── dashboard/
│   │       ├── dashboard.controller.js
│   │       └── dashboard.service.js
│   ├── routes/
│   │   ├── app.js               # Mobile/App API routes
│   │   │   # /api/app/auth, /api/app/projects, etc.
│   │   └── web.js               # Web application routes  
│   │       # /api/web/dashboard, /api/web/reports, etc.
│   ├── services/
│   │   ├── emailService.js      # Email notifications
│   │   ├── notificationService.js # Push notifications
│   │   ├── fileService.js       # File upload/management
│   │   └── reportService.js     # Report generation
│   └── utils/
│       ├── helpers.js           # General helper functions
│       ├── constants.js         # Application constants
│       ├── validators.js        # Common validation rules
│       ├── middleware.js        # Custom middleware
│       └── responseHandler.js   # API response formatting
├── bin/
│   └── www                      # Application entry point
├── public/
│   ├── uploads/                 # File uploads directory
│   └── assets/                  # Static assets
├── tests/                       # Test files
├── docs/                        # Documentation
├── app.js                       # Express application setup
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project_management

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password

# File Upload
MAX_FILE_SIZE=10000000
FILE_UPLOAD_PATH=./uploads
```

## Usage

1. **Register a new account** or login with existing credentials
2. **Create a new project** and invite team members
3. **Add tasks** to your project and assign them to team members
4. **Track time** spent on tasks and monitor progress
5. **Use the dashboard** to get an overview of all projects and tasks
6. **Generate reports** to analyze team performance and project progress

## Development Phases

### Phase 1: Core Setup (Week 1)
- [ ] Project setup and configuration
- [ ] Database models and connections
- [ ] User authentication system
- [ ] Basic CRUD operations for users, projects, and tasks

### Phase 2: Advanced Features (Week 2)
- [ ] Time tracking functionality
- [ ] Comments and collaboration features
- [ ] Dashboard and reporting
- [ ] File upload and management
- [ ] Notifications system
- [ ] Frontend integration (if applicable)

### Phase 3: Testing & Documentation
- [ ] Unit and integration tests
- [ ] API documentation
- [ ] Deployment configuration
- [ ] Performance optimization

## Contributing

This project was created as part of a Final Evaluation Assignment to demonstrate technical skills and system architecture capabilities. While contributions are welcome, please note this is primarily a showcase project.

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/project-management-system.git
   cd project-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Contribution Guidelines

1. **Fork the repository** and create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Follow coding standards**
   - Use consistent naming conventions
   - Add comments for complex business logic
   - Follow existing code structure and patterns

3. **Write tests** for new functionality
   ```bash
   npm test
   ```

4. **Commit your changes** with descriptive messages
   ```bash
   git commit -m 'feat: Add amazing feature for user experience'
   ```

5. **Push to your branch** and create a Pull Request
   ```bash
   git push origin feature/amazing-feature
   ```

### Pull Request Process

- Ensure your code follows existing patterns and conventions
- Update documentation for any new features

### Code Style

This project follows these conventions:
- **ES6+** syntax with async/await
- **Modular architecture** with separation of concerns
- **RESTful API** design principles
- **Express.js** best practices
- **MongoDB** query optimization

### Reporting Issues

If you find bugs or have feature suggestions:
1. Check existing issues first
2. Create detailed bug reports with steps to reproduce
3. Include relevant error messages and system information

## License



## Acknowledgments

- **Created by:** Sutrishna for Final Evaluation Assignment
- **Purpose:** Technical skill demonstration and system architecture showcase
- **Architecture:** Multi-tenant SaaS with advanced analytics capabilities

---

