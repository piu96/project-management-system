const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  actualStartDate: {
    type: Date,
    default: null
  },
  actualEndDate: {
    type: Date,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['project_lead', 'developer', 'designer', 'tester', 'viewer'],
      default: 'developer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  budget: {
    allocated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  client: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    company: {
      type: String,
      trim: true
    }
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowTimeTracking: {
      type: Boolean,
      default: true
    },
    requireTaskApproval: {
      type: Boolean,
      default: false
    },
    notifyOnTaskComplete: {
      type: Boolean,
      default: true
    }
  },
  archived: {
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ workspace: 1, owner: 1 });
projectSchema.index({ workspace: 1, 'members.user': 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ 'archived.isArchived': 1 });

// Virtual for tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project'
});

// Virtual for task counts
projectSchema.virtual('taskCounts', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Calculate progress based on completed tasks
projectSchema.methods.calculateProgress = async function() {
  const Task = mongoose.model('Task');
  
  const totalTasks = await Task.countDocuments({ project: this._id });
  if (totalTasks === 0) {
    this.progress = 0;
    return 0;
  }
  
  const completedTasks = await Task.countDocuments({ 
    project: this._id, 
    status: 'done' 
  });
  
  this.progress = Math.round((completedTasks / totalTasks) * 100);
  await this.save();
  
  return this.progress;
};

// Check if user is project member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.user.toString() === userId.toString());
};

// Add member to project
projectSchema.methods.addMember = function(userId, role = 'developer') {
  if (!this.isMember(userId)) {
    this.members.push({ user: userId, role });
  }
};

// Remove member from project
projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
};

// Get member role
projectSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Archive project
projectSchema.methods.archive = function(userId) {
  this.archived.isArchived = true;
  this.archived.archivedAt = new Date();
  this.archived.archivedBy = userId;
  this.status = 'completed';
};

// Restore project
projectSchema.methods.restore = function() {
  this.archived.isArchived = false;
  this.archived.archivedAt = null;
  this.archived.archivedBy = null;
  this.status = 'active';
};

module.exports = mongoose.model('Project', projectSchema);
