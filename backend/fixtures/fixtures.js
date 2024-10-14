const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const baseDir = path.join(__dirname, '..', '..', 'data', 'football.json-master', 'football.json-master');
console.log('Base directory:', baseDir);


const processMatch = (match, leagueName, round = 'N/A') => {
    let scoreString = 'N/A';
    if (match.score && match.score.ft && Array.isArray(match.score.ft) && match.score.ft.length === 2) {
        scoreString = `${match.score.ft[0]}-${match.score.ft[1]}`;
    } else if (match.score && typeof match.score === 'string') {
        scoreString = match.score;
    }

    return {
        round: match.round || round,
        date: match.date || 'N/A',
        time: match.time || 'N/A',
        team1: match.team1 || 'N/A',
        team2: match.team2 || 'N/A',
        score: scoreString,
        league: leagueName
    };
};

const readJsonFiles = (dir) => {
    console.log(`Reading files from directory: ${dir}`);
    const files = fs.readdirSync(dir);
    console.log(`Files found in ${path.basename(dir)}:`, files);
    let allMatches = [];

    files.forEach(file => {
        if (path.extname(file) === '.json' && !file.includes('clubs')) {
            const filePath = path.join(dir, file);
            console.log(`Processing file: ${file}`);
            try {
                const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const leagueName = jsonData.name;

                if (Array.isArray(jsonData.matches)) {
                    // New format
                    console.log(`League name: ${leagueName}, Matches found: ${jsonData.matches.length}`);
                    allMatches = allMatches.concat(jsonData.matches.map(match => processMatch(match, leagueName)));
                } else if (Array.isArray(jsonData.rounds)) {
                    // Old format
                    console.log(`League name: ${leagueName}, Rounds found: ${jsonData.rounds.length}`);
                    jsonData.rounds.forEach(round => {
                        if (Array.isArray(round.matches)) {
                            allMatches = allMatches.concat(round.matches.map(match => processMatch(match, leagueName, round.name)));
                        }
                    });
                } else {
                    console.log(`Skipping file as it does not contain valid match data: ${file}`);
                }
            } catch (error) {
                console.error(`Error processing file ${file}:`, error.message);
            }
        }
    });

    console.log(`Total matches found in ${path.basename(dir)}: ${allMatches.length}`);
    return allMatches;
};

const processAllYears = () => {
    console.log('Starting to process all years');
    const allFolders = fs.readdirSync(baseDir);
    console.log('All folders found:', allFolders);
    
    const yearFolders = allFolders.filter(folder => 
        fs.statSync(path.join(baseDir, folder)).isDirectory() && 
        /^\d{4}-\d{2}$/.test(folder)
    );
    console.log('Year folders identified:', yearFolders);

    const workbook = XLSX.utils.book_new();

    yearFolders.forEach(yearFolder => {
        console.log(`\nProcessing year folder: ${yearFolder}`);
        const yearDir = path.join(baseDir, yearFolder);
        const matches = readJsonFiles(yearDir);

        if (matches.length > 0) {
            const ws = XLSX.utils.json_to_sheet(matches);
            XLSX.utils.book_append_sheet(workbook, ws, yearFolder);
            console.log(`Added worksheet for ${yearFolder} with ${matches.length} matches`);
        } else {
            console.log(`No matches found for ${yearFolder}. Skipping this year.`);
        }
    });

    if (workbook.SheetNames.length > 0) {
        const outputPath = path.join(__dirname, 'all_fixtures.xlsx');
        XLSX.writeFile(workbook, outputPath);
        console.log(`\nExcel file was written successfully: ${outputPath}`);
        console.log('Sheets created:', workbook.SheetNames);
    } else {
        console.log('\nNo data to write. Workbook is empty.');
    }
};

processAllYears();