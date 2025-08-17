const mongoose = require('mongoose');

const dashboardWidgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: false // Global dashboard if not specified
    },
    widgets: [{
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: [
                'task_stats',
                'project_stats',
                'recent_activity',
                'upcoming_tasks',
                'productivity_chart',
                'team_performance',
                'calendar',
                'notifications',
                'quick_actions',
                'time_tracking',
                'workload_chart',
                'progress_overview'
            ],
            required: true
        },
        position: {
            x: {
                type: Number,
                default: 0
            },
            y: {
                type: Number,
                default: 0
            },
            width: {
                type: Number,
                default: 4,
                min: 1,
                max: 12
            },
            height: {
                type: Number,
                default: 3,
                min: 1,
                max: 12
            }
        },
        settings: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        visible: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    layout: {
        type: String,
        enum: ['grid', 'list', 'compact'],
        default: 'grid'
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light'
    },
    refreshInterval: {
        type: Number,
        default: 300, // 5 minutes in seconds
        min: 30,
        max: 3600
    },
    autoRefresh: {
        type: Boolean,
        default: true
    },
    filters: {
        timeRange: {
            type: String,
            enum: ['7d', '30d', '90d', '1y', 'custom'],
            default: '30d'
        },
        customStartDate: {
            type: Date
        },
        customEndDate: {
            type: Date
        },
        status: [{
            type: String,
            enum: ['todo', 'in_progress', 'review', 'done', 'cancelled']
        }],
        priority: [{
            type: String,
            enum: ['low', 'medium', 'high', 'urgent']
        }],
        assignee: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        projects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        }],
        tags: [String]
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
dashboardWidgetSchema.index({ user: 1, workspace: 1 }, { unique: true });
dashboardWidgetSchema.index({ user: 1 });
dashboardWidgetSchema.index({ workspace: 1 });

// Virtual for widget count
dashboardWidgetSchema.virtual('widgetCount').get(function() {
    return this.widgets ? this.widgets.length : 0;
});

// Virtual for visible widget count
dashboardWidgetSchema.virtual('visibleWidgetCount').get(function() {
    return this.widgets ? this.widgets.filter(w => w.visible).length : 0;
});

// Method to add widget
dashboardWidgetSchema.methods.addWidget = function(widgetData) {
    const widgetId = new mongoose.Types.ObjectId().toString();
    const widget = {
        id: widgetId,
        type: widgetData.type,
        position: widgetData.position || { x: 0, y: 0, width: 4, height: 3 },
        settings: widgetData.settings || {},
        visible: widgetData.visible !== undefined ? widgetData.visible : true,
        order: widgetData.order || this.widgets.length
    };

    this.widgets.push(widget);
    return widget;
};

// Method to remove widget
dashboardWidgetSchema.methods.removeWidget = function(widgetId) {
    const widgetIndex = this.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex > -1) {
        return this.widgets.splice(widgetIndex, 1)[0];
    }
    return null;
};

// Method to update widget
dashboardWidgetSchema.methods.updateWidget = function(widgetId, updateData) {
    const widget = this.widgets.find(w => w.id === widgetId);
    if (widget) {
        if (updateData.position) widget.position = { ...widget.position, ...updateData.position };
        if (updateData.settings) widget.settings = { ...widget.settings, ...updateData.settings };
        if (updateData.visible !== undefined) widget.visible = updateData.visible;
        if (updateData.order !== undefined) widget.order = updateData.order;
        return widget;
    }
    return null;
};

// Method to reorder widgets
dashboardWidgetSchema.methods.reorderWidgets = function(widgetOrders) {
    widgetOrders.forEach(({ widgetId, order }) => {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.order = order;
        }
    });

    // Sort widgets by order
    this.widgets.sort((a, b) => a.order - b.order);
};

// Method to get default widgets for new dashboard
dashboardWidgetSchema.statics.getDefaultWidgets = function() {
    return [
        {
            id: new mongoose.Types.ObjectId().toString(),
            type: 'task_stats',
            position: { x: 0, y: 0, width: 3, height: 2 },
            settings: { showChart: true },
            visible: true,
            order: 0
        },
        {
            id: new mongoose.Types.ObjectId().toString(),
            type: 'project_stats',
            position: { x: 3, y: 0, width: 3, height: 2 },
            settings: { showProgress: true },
            visible: true,
            order: 1
        },
        {
            id: new mongoose.Types.ObjectId().toString(),
            type: 'recent_activity',
            position: { x: 6, y: 0, width: 6, height: 4 },
            settings: { limit: 10 },
            visible: true,
            order: 2
        },
        {
            id: new mongoose.Types.ObjectId().toString(),
            type: 'upcoming_tasks',
            position: { x: 0, y: 2, width: 6, height: 3 },
            settings: { daysAhead: 7 },
            visible: true,
            order: 3
        }
    ];
};

// Method to create default dashboard
dashboardWidgetSchema.statics.createDefaultDashboard = function(userId, workspaceId = null) {
    return new this({
        user: userId,
        workspace: workspaceId,
        widgets: this.getDefaultWidgets(),
        layout: 'grid',
        theme: 'light',
        refreshInterval: 300,
        autoRefresh: true,
        filters: {
            timeRange: '30d',
            status: [],
            priority: [],
            assignee: [],
            projects: [],
            tags: []
        }
    });
};

// Pre-save middleware to validate custom date range
dashboardWidgetSchema.pre('save', function(next) {
    if (this.filters && this.filters.timeRange === 'custom') {
        if (!this.filters.customStartDate || !this.filters.customEndDate) {
            return next(new Error('Custom start and end dates are required when timeRange is custom'));
        }

        if (this.filters.customEndDate <= this.filters.customStartDate) {
            return next(new Error('End date must be after start date'));
        }

        // Limit to 1 year range
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        if (this.filters.customEndDate - this.filters.customStartDate > oneYearInMs) {
            return next(new Error('Date range cannot exceed 1 year'));
        }
    }

    next();
});

// Pre-save middleware to validate widget positions
dashboardWidgetSchema.pre('save', function(next) {
    if (this.widgets && this.widgets.length > 0) {
        for (const widget of this.widgets) {
            if (widget.position.x < 0 || widget.position.y < 0) {
                return next(new Error('Widget position coordinates must be non-negative'));
            }

            if (widget.position.width < 1 || widget.position.width > 12) {
                return next(new Error('Widget width must be between 1 and 12'));
            }

            if (widget.position.height < 1 || widget.position.height > 12) {
                return next(new Error('Widget height must be between 1 and 12'));
            }
        }
    }

    next();
});

const DashboardWidget = mongoose.model('DashboardWidget', dashboardWidgetSchema);

module.exports = DashboardWidget;

