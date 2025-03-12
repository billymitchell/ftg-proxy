// Importing dependencies
const express = require('express');      // Web framework to create the server
const cors = require('cors');            // Middleware to handle Cross-Origin Resource Sharing
const rateLimit = require('express-rate-limit'); // Middleware for rate-limiting requests
const helmet = require('helmet');        // Middleware to secure HTTP headers
const path = require('path');            // Node.js utility for file and directory paths
const winston = require('winston');      // Logging library for error logging
const http = require('http');            // Core module for HTTP server and agent configurations
const https = require('https');          // Core module for HTTPS server and agent configurations

// Enable HTTP Keep-Alive
// This configuration keeps sockets around after requests are finished,
// which can help reduce connection timeout errors (ETIMEDOUT) by reusing connections.
http.globalAgent.keepAlive = true;
https.globalAgent.keepAlive = true;

const app = express();                   // Initialize Express application
const PORT = process.env.PORT || 3000;   // Set the port from environment variable or default to 3000

// Setup Winston logger for robust error logging
// This logger sends errors to both the console and a log file named "error.log".
const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.Console(),                 // Log errors to the console
    new winston.transports.File({ filename: 'error.log' }) // Log errors to file
  ],
});

// Secure headers with Helmet
// Helmet helps secure the app by setting various HTTP headers.
app.use(helmet());

// Trust the first proxy (required when behind a reverse proxy such as a load balancer)
// This is necessary for accurate IP detection for rate limiting and security.
app.set('trust proxy', 1);

// Set up CORS
// Define an array of allowed origins using regular expressions.
// Requests from these origins or non-browser contexts (no origin) are allowed.
const allowedOrigins = [
  /^https?:\/\/(www\.)?ftg-redemption-test\.mybrightsites\.com$/,
  /^https?:\/\/(www\.)?ftg-redemption\.mybrightsites\.com$/,
  /^https?:\/\/(www\.)?redeem\.forbestravelguide\.com$/
];
app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.some(regex => regex.test(origin)) || !origin) {
      // Allow request if origin is allowed or if there's no origin (like server-to-server communication)
      callback(null, true);
    } else {
      // Deny request if the origin is not allowed
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

// Middleware to parse JSON body
// Automatically parses incoming JSON requests into JavaScript objects.
app.use(express.json());

// Serve the testing HTML page at the root route
// This sends the index.html file, which is used for testing purposes.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rate Limiting
// Limit the number of requests per minute for each IP to mitigate abuse.
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100,           // Maximum 100 requests per IP per window
});
app.use(limiter);

// Import route modules for handling API requests
const getRedemptionStatus = require('./routes/getRedemptionStatus');
const receiveOrderData = require('./routes/receiveOrderData');

// Use the API routes
// Endpoints for handling redemption code status and order data.
app.use('/api/redemption-code-status', getRedemptionStatus);
app.use('/api', receiveOrderData);

// Global error handling middleware with robust logging
// This middleware catches errors thrown from any part of the application.
app.use((err, req, res, next) => {
  // Log detailed error information including a timestamp, HTTP method, URL, error message, and stack trace.
  logger.error(`${new Date().toISOString()} - Error: ${err.message} - ${req.method} ${req.url}`, { 
    stack: err.stack 
  });
  // Respond with a generic error message to avoid exposing internal details.
  res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
});

// Start the server and listen on the specified port,
// logging a confirmation message once the server is up and running.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
