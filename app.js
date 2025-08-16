require('./src/DB/db.connection.js'); // database register //
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')
const helmet = require('helmet')
var app = express();
const corsOptions = {
  origin: '*',

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE'
  ],

  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'x-access-token',
    'x-forwarded-for'
  ],
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors(corsOptions)); // Enable CORS
app.use(helmet()); // Enable Helmet for security
app.disable('x-powered-by')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//Register Routes
app.use('/api/app', require('./src/routes/app')); // Registers all app-related routes
app.use('/api/web', require('./src/routes/web'));   // Registers all web-related routes

// 404 Handler - If no route matches
app.use((req, res, next) => {
  return res.status(404).json({ 
      success: false, 
      message: `Endpoint ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString()
  });
});

module.exports = app;
