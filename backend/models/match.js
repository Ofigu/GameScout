const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    date: Date,
    homeTeam: String,
    awayTeam: String,
    league: String,
    location: String
    });

const Match = mongoose.model('Match', matchSchema);

