const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Directory containing JSON files
const jsonDir = path.join(__dirname, '../../2024-25');

// Get the current date and time
const now = new Date();

// Function to read and parse JSON files
const readJsonFiles = (dir) => {
  const files = fs.readdirSync(dir);
  let allMatches = [];

  files.forEach(file => {
    if (path.extname(file) === '.json') {
      const filePath = path.join(dir, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Extract the league name from the JSON file
      const leagueName = jsonData.name;

      // Combine the league name with each match
      const matchesWithLeague = jsonData.matches.map(match => ({
        round: match.round,
        date: match.date,
        time: match.time,
        team1: match.team1,
        team2: match.team2,
        league: leagueName
      }));

      allMatches = allMatches.concat(matchesWithLeague);
    }
  });

  return allMatches;
};

// Read all JSON files and combine data
const allMatches = readJsonFiles(jsonDir);

// Extract relevant data and filter fixtures that haven't started yet
const fixtures = allMatches
  .filter(match => new Date(`${match.date}T${match.time}`) > now)
  .map(match => ({
    round: match.round,
    date: match.date,
    time: match.time,
    team1: match.team1,
    team2: match.team2,
    league: match.league
  }));

// Define the CSV writer
const csvWriter = createCsvWriter({
  path: path.join(__dirname, 'fixtures.csv'), // Path to the same folder
  header: [
    { id: 'round', title: 'Round' },
    { id: 'date', title: 'Date' },
    { id: 'time', title: 'Time' },
    { id: 'team1', title: 'Team 1' },
    { id: 'team2', title: 'Team 2' },
    { id: 'league', title: 'League' } // Add league column to the CSV
  ]
});

// Write the data to the CSV file
csvWriter.writeRecords(fixtures)
  .then(() => {
    console.log('CSV file was written successfully');
  })
  .catch(err => {
    console.error('Error writing CSV file:', err);
  });
