const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envValidation = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        APP_PORT: Joi.number().default(3000),
        
        // MongoDB Configuration
        MONGODB_URI: Joi.string().required().description('MongoDB connection URI'),
        MONGODB_TEST_URI: Joi.string().optional().description('MongoDB test database URI'),
        
        // JWT Configuration
        JWT_SECRET: Joi.string().required().description('JWT secret key'),
        JWT_EXPIRES_IN: Joi.string().default('7d').description('JWT expiration time'),
        JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh secret'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d').description('JWT refresh expiration'),
        
        // Password Reset
        PASSWORD_RESET_SECRET: Joi.string().required().description('Password reset secret'),
        PASSWORD_RESET_EXPIRES: Joi.string().default('1h').description('Password reset expiration'),
        
        // Email Configuration (Optional for development)
        EMAIL_HOST: Joi.string().optional(),
        EMAIL_PORT: Joi.number().optional().default(587),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASS: Joi.string().optional(),
        EMAIL_FROM: Joi.string().optional(),
        EMAIL_FROM_NAME: Joi.string().optional(),
        
        // File Upload
        MAX_FILE_SIZE: Joi.number().default(10485760),
        FILE_UPLOAD_PATH: Joi.string().default('./public/uploads'),
        ALLOWED_FILE_TYPES: Joi.string().default('jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip'),
        
        // Logging
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        LOG_FOLDER: Joi.string().default('logs'),
        LOG_FILE: Joi.string().default('app.log'),
        
        // Security
        BCRYPT_ROUNDS: Joi.number().default(12),
        SESSION_SECRET: Joi.string().required().description('Session secret key'),
        CORS_ORIGIN: Joi.string().default('*'),
        
        // API Configuration
        API_RATE_LIMIT: Joi.number().default(100),
        API_RATE_WINDOW: Joi.number().default(15),
        
        // Workspace Configuration
        DEFAULT_WORKSPACE_PLAN: Joi.string().default('free'),
        MAX_FREE_MEMBERS: Joi.number().default(5),
        MAX_FREE_PROJECTS: Joi.number().default(3),
        
        // Redis (Optional)
        REDIS_HOST: Joi.string().optional().default('localhost'),
        REDIS_PORT: Joi.number().optional().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        REDIS_USE_PASSWORD: Joi.boolean().default(false),
    })
    .unknown();

const { error, value: envVar } = envValidation.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    nodeEnv: envVar.NODE_ENV,
    port: envVar.APP_PORT,
    
    // Database
    database: {
        uri: envVar.MONGODB_URI,
        testUri: envVar.MONGODB_TEST_URI
    },
    
    // JWT
    jwt: {
        secret: envVar.JWT_SECRET,
        expiresIn: envVar.JWT_EXPIRES_IN,
        refreshSecret: envVar.JWT_REFRESH_SECRET,
        refreshExpiresIn: envVar.JWT_REFRESH_EXPIRES_IN
    },
    
    // Password Reset
    passwordReset: {
        secret: envVar.PASSWORD_RESET_SECRET,
        expiresIn: envVar.PASSWORD_RESET_EXPIRES
    },
    
    // Email
    email: {
        host: envVar.EMAIL_HOST,
        port: envVar.EMAIL_PORT,
        user: envVar.EMAIL_USER,
        pass: envVar.EMAIL_PASS,
        from: envVar.EMAIL_FROM,
        fromName: envVar.EMAIL_FROM_NAME
    },
    
    // File Upload
    upload: {
        maxSize: envVar.MAX_FILE_SIZE,
        path: envVar.FILE_UPLOAD_PATH,
        allowedTypes: envVar.ALLOWED_FILE_TYPES?.split(',') || []
    },
    
    // Logging
    logging: {
        level: envVar.LOG_LEVEL,
        folder: envVar.LOG_FOLDER,
        file: envVar.LOG_FILE
    },
    
    // Security
    security: {
        bcryptRounds: envVar.BCRYPT_ROUNDS,
        sessionSecret: envVar.SESSION_SECRET,
        corsOrigin: envVar.CORS_ORIGIN
    },
    
    // API
    api: {
        rateLimit: envVar.API_RATE_LIMIT,
        rateWindow: envVar.API_RATE_WINDOW
    },
    
    // Workspace
    workspace: {
        defaultPlan: envVar.DEFAULT_WORKSPACE_PLAN,
        maxFreeMembers: envVar.MAX_FREE_MEMBERS,
        maxFreeProjects: envVar.MAX_FREE_PROJECTS
    },
    
    // Redis (Optional)
    redis: {
        host: envVar.REDIS_HOST,
        port: envVar.REDIS_PORT,
        password: envVar.REDIS_PASSWORD,
        usePassword: envVar.REDIS_USE_PASSWORD
    }
};
