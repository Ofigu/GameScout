const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const app = express();
const { PythonShell } = require('python-shell');
const routePages = require('./routers/routePages.js');
// enable server to handle cross-origin requests(from client)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({ 
  secret: 'your_secret_key',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // only save session if session data exists
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // only HTTPS in production
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax' // protect against CSRF attacks
  }
}));

mongoose.connect('mongodb+srv://ofiralmog2:2YIoYX7moljlhN22@gamescout.vbdbi.mongodb.net/', {})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

app.use('/api', routePages);

// Serve static files and handle routes only in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.get('/api/game-stats/:team1/:team2', (req, res) => {
  const { team1, team2 } = req.params;
  console.log(`Fetching game stats for teams: ${team1} vs ${team2}`);
  // run app.py to fetch game stats
  PythonShell.run(path.join(__dirname, 'app.py'), { args: ['generate_game_stats', team1, team2] }, (err, results) => {
    if (err) {
      console.error('Error running Python script:', err);
      res.status(500).json({ error: 'An error occurred while fetching game stats' });
    } else {
      console.log('Python script results:', results);
      try {
        const data = JSON.parse(results[0]);
        if (data.error) {
          res.status(404).json(data);
        } else {
          res.status(200).json(data);
        }
      } catch (parseError) {
        console.error('Error parsing Python script results:', parseError);
        res.status(500).json({ error: 'An error occurred while processing game stats' });
      }
    }
  });
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../client/public')));

// Handle routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public', 'index.html'));
});

const port = process.env.PORT || 3200;
app.listen(port, () => console.log(`Server started on port ${port}`));