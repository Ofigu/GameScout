const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');

// Middleware to parse request body
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Login route
router.post('/login', async (req, res) => {
    const { Username, Password } = req.body;

    try {
        const user = await User.findOne({ username: Username, password: Password });

        if (user) {
            req.session.user = user; // Set user in session
            res.redirect('/home');
        } else {
            const errorMessage = 'Invalid username or password.';
            console.error(errorMessage);
            res.send(`<script>alert('${errorMessage}'); window.location.href='/loginPage'</script>`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('An error occurred during login.');
    }
});

// Sends to login page
router.get('/loginPage', function (req, res) {
    res.sendFile(path.join(__dirname, '../../views/login.html'));
});

// Home route
router.get('/home', function (req, res) {
    if (req.session.user) {
        res.send(`
            <html>
                <body>
                    <h1>Welcome, ${req.session.user.username}!</h1>
                    <p>This is your personalized home page.</p>
                    <a href="/logout">Logout</a>
                </body>
            </html>
        `);
    } else {
        res.redirect('/loginPage'); // Redirect to login page if user is not logged in
    }
});

// Logout route
router.get('/logout', function (req, res) {
    console.log('Logging out user:', req.session.user.username, ',session ID:', req.sessionID);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('An error occurred during logout.');
        } else {
            res.redirect('/loginPage'); // Redirect to login page after logout
        }
    });
});

module.exports = router;