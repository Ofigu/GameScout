const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path'); 
const fs = require('fs');
const csv = require('csv-parser');
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

  // Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const getTodaysFixtures = (callback) => {
  const fixtures = [];
  const today = new Date();

  // Format today's date as YYYY-MM-DD
  const formattedToday = today.toISOString().split('T')[0]; // calculate today's date

  fs.createReadStream(path.join(__dirname, 'backend/fixtures/fixtures.csv'))
    .pipe(csv())
    .on('data', (row) => {
      if (row.Date === formattedToday) {
        fixtures.push({
          round: row['Round'], 
          team1: row['Team 1'],
          team2: row['Team 2'],
          time: row['Time'],
          league: row['League']
        });
      }
    })
    .on('end', () => {
       callback(fixtures); 
    })
    .on('error', (err) => {
      console.error("Error reading CSV:", err);
      callback([]); 
    });
};




// Export the getTodaysFixtures function to routepages
module.exports = { getTodaysFixtures };

  // Configure session middleware
app.use(session({
  secret: 'your_secret_key', 
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