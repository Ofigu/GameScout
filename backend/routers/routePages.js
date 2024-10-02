const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const fs = require('fs');
const csv = require('csv-parser');

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
        date.setHours(hours + 2, minutes, 0, 0); // Add two hours for Premier League
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

// Function to get today's fixtures
const getTodaysFixtures = (callback) => {
    const fixtures = [];
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    fs.createReadStream(path.join(__dirname, '../fixtures/fixtures.csv'))
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

// Get fixtures route
router.get('/fixtures', isAuthenticated, (req, res) => {
    getTodaysFixtures((fixtures) => {
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

// Catch-all error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router;