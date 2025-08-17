const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // allow pending invites without user
  },
  role: {
    type: String,
    enum: ['workspace_admin', 'project_manager', 'team_member'],
    default: 'team_member'
  },
  permissions: {
    type: [String],
    default: [],
    enum: [
      'create_projects',
      'delete_projects',
      'manage_members',
      'manage_workspace_settings',
      'view_reports',
      'export_data',
      'manage_billing'
    ]
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  inviteToken: {
    type: String,
    default: null
  },
  inviteExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Removed unique index on { workspace, user } to allow multiple pending invites with user: null
workspaceMemberSchema.index({ workspace: 1, status: 1 });
workspaceMemberSchema.index({ user: 1, status: 1 });
workspaceMemberSchema.index({ inviteToken: 1 });
workspaceMemberSchema.index({ inviteExpires: 1 });

// Set default permissions based on role
workspaceMemberSchema.pre('save', function(next) {
  if (!this.isModified('role')) return next();
  
  switch (this.role) {
    case 'workspace_admin':
      this.permissions = [
        'create_projects',
        'delete_projects',
        'manage_members',
        'manage_workspace_settings',
        'view_reports',
        'export_data',
        'manage_billing'
      ];
      break;
    case 'project_manager':
      this.permissions = [
        'create_projects',
        'view_reports',
        'export_data'
      ];
      break;
    case 'team_member':
      this.permissions = [];
      break;
  }
  
  next();
});

// Check if member has specific permission
workspaceMemberSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Generate invite token
workspaceMemberSchema.methods.generateInviteToken = function() {
  const crypto = require('crypto');
  this.inviteToken = crypto.randomBytes(32).toString('hex');
  this.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.inviteToken;
};

// Accept invitation
workspaceMemberSchema.methods.acceptInvite = function() {
  this.status = 'active';
  this.joinedAt = new Date();
  this.inviteToken = null;
  this.inviteExpires = null;
};

module.exports = mongoose.model('WorkspaceMember', workspaceMemberSchema);
