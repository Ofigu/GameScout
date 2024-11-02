const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const baseDir = path.join(__dirname, '..', '..', '2024-25');

const processMatch = (match, leagueName) => {
    // Skip matches with completed scores
    if (match.score && 
        ((match.score.ft && match.score.ft.length === 2) || 
         (typeof match.score === 'string' && match.score !== ''))) {
        return null;
    }

    // Process time field
    let matchTime = 'TBD';
    if (match.time && match.time.includes(':')) {
        matchTime = match.time;
    } else if (!match.time && match.date && match.date.includes('2024')) {
        matchTime = 'TBD';  // Ensure future matches without time get 'TBD'
    }

    return {
        'Round': match.round || 'N/A',
        'Date': match.date || 'N/A',
        'Time': matchTime,
        'Team 1': match.team1 || 'N/A',
        'Team 2': match.team2 || 'N/A',
        'League': leagueName
    };
};

const processAllMatches = () => {
    const files = fs.readdirSync(baseDir);
    let allMatches = [];

    files.forEach(file => {
        if (path.extname(file) === '.json' && !file.includes('clubs')) {
            const filePath = path.join(baseDir, file);
            try {
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const leagueName = jsonData.name;

                if (Array.isArray(jsonData.matches)) {
                    const futureMatches = jsonData.matches
                        .map(match => processMatch(match, leagueName))
                        .filter(match => match !== null && match.Date.includes('2024'));
                    allMatches = allMatches.concat(futureMatches);
                }
            } catch (error) {
                console.error(`Error processing file ${file}:`, error.message);
            }
        }
    });

    // Sort matches by date and time
    allMatches.sort((a, b) => {
        const dateCompare = new Date(a.Date) - new Date(b.Date);
        if (dateCompare === 0) {
            if (a.Time === 'TBD') return 1;  // TBD times go last
            if (b.Time === 'TBD') return -1;
            return a.Time.localeCompare(b.Time);
        }
        return dateCompare;
    });

    if (allMatches.length > 0) {
        const ws = XLSX.utils.json_to_sheet(allMatches);
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        fs.writeFileSync('fixtures.csv', csvContent, 'utf8');
        console.log(`Processed ${allMatches.length} matches`);
    }
};

processAllMatches();