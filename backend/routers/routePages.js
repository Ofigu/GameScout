const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const { getTodaysFixtures } = require('../../server.js'); 


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
        // Save the user to the database
        await user.save();
        console.log('User added successfully');
        res.redirect('/loginPage'); 
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue && error.keyValue.username) {
            const errorMessage = 'Username already exists. Please choose a different username.';
            console.error(errorMessage);
            res.send(`<script>alert('${errorMessage}'); window.location.href='/signup'</script>`);
        } else {
            console.error('Error adding user:', error);
            res.status(500).send('An error occurred while adding the user.');
        }
    }
});
// login route
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
// sends logged in user to home page
router.get('/home', function (req, res) {
    if (req.session.user) {
      // Get today's fixtures and render the home page
      getTodaysFixtures((fixtures) => {
        res.render('home', { username: req.session.user.username, fixtures: fixtures });
      });
    } else {
      res.redirect('/loginPage');
    }
  });
  
// Logout route
router.get('/logout', function (req, res) {
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