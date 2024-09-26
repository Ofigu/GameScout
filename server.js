const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path'); 
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://ofiralmog2:2YIoYX7moljlhN22@gamescout.vbdbi.mongodb.net/', {})
  .then(() => {
      console.log('Connected to MongoDB');
  })
  .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
  });

  // Configure session middleware
app.use(session({
  secret: 'your_secret_key', // Replace with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Start Server
const port = 3200;
app.listen(port, function () {
    console.log("Server started on port", port);
});

// Parse JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./views'));

// Set home page to login.html
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'views', 'login.html')); 
});

// Set Routers
var pages = require('./backend/routers/routePages');
app.use('/', pages);