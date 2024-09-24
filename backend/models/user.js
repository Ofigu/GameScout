const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String, unique: true,
  password: String, 
  preferences: {
    team: String,
    league: String,
    preferredDays: String,  
    timeOfDay: String,          
  }
});

const User = mongoose.model('User', userSchema);
