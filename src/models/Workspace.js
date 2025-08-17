const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Workspace name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  logo: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '17:00'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    features: {
      type: [String],
      default: ['projects', 'tasks', 'time_tracking', 'reports'],
      enum: ['projects', 'tasks', 'time_tracking', 'reports', 'calendar', 'files', 'gantt']
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 5 // Free plan limit
    },
    maxProjects: {
      type: Number,
      default: 3 // Free plan limit
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// slug already has unique: true, so no need for separate index
// workspaceSchema.index({ slug: 1 }); // Removed duplicate
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ isActive: 1 });
workspaceSchema.index({ 'subscription.plan': 1 });

// Virtual for workspace members
workspaceSchema.virtual('members', {
  ref: 'WorkspaceMember',
  localField: '_id',
  foreignField: 'workspace'
});

// Virtual for workspace projects
workspaceSchema.virtual('projects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'workspace'
});

// Generate unique slug before saving
workspaceSchema.pre('save', async function(next) {
  if (!this.isModified('name')) return next();
  
  try {
    let baseSlug = this.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and generate unique one
    while (await mongoose.model('Workspace').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

// Check subscription limits
workspaceSchema.methods.canAddMember = async function() {
  const memberCount = await mongoose.model('WorkspaceMember').countDocuments({
    workspace: this._id,
    status: 'active'
  });
  return memberCount < this.subscription.maxMembers;
};

workspaceSchema.methods.canAddProject = async function() {
  const projectCount = await mongoose.model('Project').countDocuments({
    workspace: this._id
  });
  return projectCount < this.subscription.maxProjects;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
