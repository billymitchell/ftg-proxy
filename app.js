const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path'); // added dependency
const winston = require('winston');
const app = express();
const PORT = process.env.PORT || 3000;

// Setup Winston logger for robust error logging
const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' })
  ],
});

// Secure headers
app.use(helmet());

// Trust the first proxy (required for rate-limiting behind proxies)
app.set('trust proxy', 1);

// Set up CORS
const allowedOrigins = [
  /^https?:\/\/(www\.)?ftg-redemption-test\.mybrightsites\.com$/,
  /^https?:\/\/(www\.)?ftg-redemption\.mybrightsites\.com$/,
  /^https?:\/\/(www\.)?redeem\.forbestravelguide\.com$/
];
app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.some(regex => regex.test(origin)) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

// Middleware to parse JSON body
app.use(express.json());

// Serve the testing HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
});
app.use(limiter);

// Import routes
const getRedemptionStatus = require('./routes/getRedemptionStatus');
const receiveOrderData = require('./routes/receiveOrderData');

// Use the routes
app.use('/api/redemption-code-status', getRedemptionStatus);
app.use('/api', receiveOrderData);

// Error handling middleware with robust logging
app.use((err, req, res, next) => {
  // Log detailed error information to the console and error.log file
  logger.error(`${new Date().toISOString()} - Error: ${err.message} - ${req.method} ${req.url}`, { 
    stack: err.stack 
  });
  // Respond with a generic error message
  res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
