const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'story', 'epic'],
    default: 'task'
  },
  dueDate: {
    type: Date,
    default: null
  },
  startDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  loggedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  remainingHours: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'relates_to'],
      default: 'blocks'
    }
  }],
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  checklist: [{
    text: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  customFields: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'multiselect', 'boolean']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  position: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
taskSchema.index({ workspace: 1, project: 1, status: 1 });
taskSchema.index({ workspace: 1, assignee: 1, status: 1 });
taskSchema.index({ workspace: 1, reporter: 1 });
taskSchema.index({ project: 1, position: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ parentTask: 1 });

// Virtual for comments
taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task'
});

// Virtual for time entries
taskSchema.virtual('timeEntries', {
  ref: 'TimeEntry',
  localField: '_id',
  foreignField: 'task'
});

// Calculate progress based on checklist
taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Update status automatically based on certain conditions
taskSchema.pre('save', function(next) {
  // Set completedDate when status changes to done
  if (this.isModified('status') && this.status === 'done' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  // Clear completedDate if status changes away from done
  if (this.isModified('status') && this.status !== 'done' && this.completedDate) {
    this.completedDate = null;
  }
  
  // Set startDate when status changes to in_progress for first time
  if (this.isModified('status') && this.status === 'in_progress' && !this.startDate) {
    this.startDate = new Date();
  }
  
  // Calculate remaining hours
  if (this.estimatedHours && this.loggedHours) {
    this.remainingHours = Math.max(0, this.estimatedHours - this.loggedHours);
  }
  
  next();
});

// Check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'done';
});

// Check if task is due soon (within 24 hours)
taskSchema.virtual('isDueSoon').get(function() {
  if (!this.dueDate || this.status === 'done') return false;
  
  const oneDayFromNow = new Date();
  oneDayFromNow.setHours(oneDayFromNow.getHours() + 24);
  
  return this.dueDate <= oneDayFromNow && this.dueDate > new Date();
});

// Add watcher to task
taskSchema.methods.addWatcher = function(userId) {
  if (!this.watchers.includes(userId)) {
    this.watchers.push(userId);
  }
};

// Remove watcher from task
taskSchema.methods.removeWatcher = function(userId) {
  this.watchers = this.watchers.filter(watcher => 
    watcher.toString() !== userId.toString()
  );
};

// Add attachment
taskSchema.methods.addAttachment = function(fileData, userId) {
  this.attachments.push({
    ...fileData,
    uploadedBy: userId,
    uploadedAt: new Date()
  });
};

// Complete checklist item
taskSchema.methods.completeChecklistItem = function(itemId, userId) {
  const item = this.checklist.id(itemId);
  if (item) {
    item.completed = true;
    item.completedBy = userId;
    item.completedAt = new Date();
  }
};

// Add to checklist
taskSchema.methods.addChecklistItem = function(text) {
  this.checklist.push({ text, completed: false });
};

// Calculate estimated vs actual time variance
taskSchema.virtual('timeVariance').get(function() {
  if (!this.estimatedHours || this.estimatedHours === 0) return null;
  
  return {
    variance: this.loggedHours - this.estimatedHours,
    percentage: Math.round(((this.loggedHours - this.estimatedHours) / this.estimatedHours) * 100)
  };
});

module.exports = mongoose.model('Task', taskSchema);
