const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const { PythonShell } = require('python-shell'); 

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    console.log('Session:', req.session);
    console.log('User:', req.session.user);
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
};

// Function to add hours to the time based on the league
const adjustTime = (time, league) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    if (league === 'Premier League 2024/25' || league == 'Championship 2024/25') {
        date.setHours(hours + 2, minutes, 0, 0); // Add two hours for epl and championship
    } else {
        date.setHours(hours + 1, minutes, 0, 0); // Add one hour for other leagues
    }
    return date.toTimeString().slice(0, 5); // Return time in HH:MM format
};

// Middleware to parse request body
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Add user to db
router.post('/addUser', async (req, res) => {
    const user = new User({
        username: req.body.Username,
        password: req.body.Password,
    });
    try {
        await user.save();
        console.log('User added successfully');
        res.json({ success: true, message: 'User added successfully' });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue && error.keyValue.username) {
            const errorMessage = 'Username already exists. Please choose a different username.';
            console.error(errorMessage);
            res.status(400).json({ error: errorMessage });
        } else {
            console.error('Error adding user:', error);
            res.status(500).json({ error: 'An error occurred while adding the user.' });
        }
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.session.user = user;
            res.json({ success: true, username: user.username });
        } else {
            console.log('Invalid login attempt:', username);
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user data
router.get('/user', isAuthenticated, (req, res) => {
    res.json({ username: req.session.user.username });
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'An error occurred during logout.' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});

// get fixtures by date
const getFixturesForDate = (date, callback) => {
    const fixtures = [];
    const formattedDate = date.toISOString().split('T')[0];

    fs.createReadStream(path.join(__dirname, '../fixtures/fixtures.csv'))
        .pipe(csv())
        .on('data', (row) => {
            if (row.Date === formattedDate) {
                const fixture = {
                    round: row['Round'],
                    team1: row['Team 1'],
                    team2: row['Team 2'],
                    time: row['Time'],
                    league: row['League'],
                    game_id: row['game_id'] 
                };
                fixtures.push(fixture);
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

// Get fixtures route
router.get('/fixtures/:date', isAuthenticated, (req, res) => {
    const date = new Date(req.params.date);
    getFixturesForDate(date, (fixtures) => {
        if (fixtures instanceof Error) {
            console.error('Error fetching fixtures:', fixtures);
            return res.status(500).json({ error: 'Error fetching fixtures' });
        }
        // Adjust time for each fixture based on the league
        fixtures.forEach(fixture => {
            fixture.time = adjustTime(fixture.time, fixture.league);
        });
        // Sort fixtures by time
        fixtures.sort((a, b) => new Date(`1970-01-01T${a.time}:00Z`) - new Date(`1970-01-01T${b.time}:00Z`));
        res.json(fixtures);
    });
});

// Game stats route
router.get('/game-stats/:team1/:team2', isAuthenticated, (req, res) => {
    const { team1, team2 } = req.params;
    console.log(`Received request for game stats: ${team1} vs ${team2}`);

    // Set the correct path to the directory containing app.py
    const scriptPath = path.join(__dirname, '..');
    const appPath = path.join(scriptPath, 'app.py');

    console.log('Script directory:', scriptPath);
    console.log('app.py path:', appPath);

    // Check if app.py exists
    if (!fs.existsSync(appPath)) {
        console.error('Error: app.py not found at', appPath);
        return res.status(500).json({ error: 'Internal server error: Python script not found' });
    }

    const options = {
        mode: 'text',
        pythonPath: 'python', 
        scriptPath: scriptPath,
        args: ['generate_game_stats', team1, team2]
    };
    // Run the Python script
    let pyshell = new PythonShell('app.py', options);
    let scriptOutput = [];
    let scriptError = null;

    pyshell.on('message', function (message) {
        scriptOutput.push(message);
    });

    pyshell.on('stderr', function (stderr) {
        console.error('Python script error:', stderr);
        scriptError = stderr;
    });

    pyshell.end(function (err, code, signal) {
        if (err) {
            console.error('Error running Python script:', err);
            return res.status(500).json({ 
                error: 'An error occurred while fetching game stats', 
                details: err.message,
                pythonError: scriptError
            });
        }

        if (scriptOutput.length === 0) {
            return res.status(500).json({ error: 'No output from Python script' });
        }

        try {
            const data = JSON.parse(scriptOutput[scriptOutput.length - 1]);
            if (data.error) {
                console.error('Error in Python script result:', data.error);
                // Check if the error is due to club not found
                if (data.error.includes("Could not find club ID")) {
                    return res.status(404).json({
                        error: 'Club not found',
                        details: data.error
                    });
                }
                return res.status(404).json(data);
            }
            res.json(data);
        } catch (parseError) {
            console.error('Error parsing Python script output:', parseError);
            res.status(500).json({ 
                error: 'An error occurred while processing game stats', 
                details: parseError.message,
                rawOutput: scriptOutput
            });
        }
    });
});
  


// Catch-all error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router;