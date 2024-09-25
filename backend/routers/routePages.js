const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const Match = require('../models/match');   
const Recommendation = require('../models/Recommendation');

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
            // Duplicate username error
            const errorMessage = 'Username already exists. Please choose a different username.';
            console.error(errorMessage);
            // Display an alert with the error message
            res.send(`<script>alert('${errorMessage}'); window.location.href='/signup'</script>`);
        } else {
            // Log the error and send a generic error message
            console.error('Error adding user:', error);
            res.status(500).send('An error occurred while adding the user.');
        }
    }
});

// Sends to login page
router.get('/loginPage', function (req, res) {
    res.sendFile(path.join(__dirname, '../../views/homePage.html')); 
  });
module.exports = router;