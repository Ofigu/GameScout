const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path'); 
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const routePages = require('./routers/routePages.js');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // set to true if using https
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect('mongodb+srv://ofiralmog2:2YIoYX7moljlhN22@gamescout.vbdbi.mongodb.net/', {})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// API routes
app.use('/api', routePages);

app.get('/api/fixtures', (req, res) => {
  getTodaysFixtures((fixtures) => {
    res.json(fixtures);
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // In development, we want to serve the login page directly
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/src/components', 'login.js'));
  });
}

// Start Server
const port = process.env.PORT || 3200;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

