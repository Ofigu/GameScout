# GameScout

GameScout is a web application that provides comprehensive soccer/football fixtures information and detailed team statistics for top leagues. The application offers real-time match statistics, head-to-head analysis, and key player information to help users make informed decisions about upcoming matches.

## Features

- **Fixtures Dashboard**: Browse soccer matches from top leagues with an interactive calendar
- **Detailed Match Statistics**:
  - Head-to-head record between teams
  - Recent form analysis
  - Clean sheet probability
  - High-scoring match prediction
  - Card statistics
  - Key player information and market values
- **La Liga Special Features**: Enhanced statistics for La Liga matches including:
  - Detailed player statistics (goals, assists, minutes played)
  - Pass completion rates
  - Expected goals (xG)
- **User Authentication**: Secure login system with session management
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Weekly Data Updates**: Automatic data refresh from Kaggle datasets

## Technology Stack

### Frontend
- React.js
- React Bootstrap for UI components
- React Router for navigation
- Custom CSS for styling
- Lucide React for icons

### Backend
- Express.js
- Node.js
- Python (for data processing)
- MongoDB (user management)
- Express Session for authentication

### Data Processing
- Pandas for data manipulation
- FuzzyWuzzy for string matching
- NumPy for numerical operations

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gamescout.git
cd gamescout
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up MongoDB:
- Create a MongoDB database
- Update the connection string in `server/server.js`

4. Set up environment variables:
- Create `.env` files in both client and server directories
- Add necessary environment variables (MongoDB URI, API keys, etc.)

5. Install Python dependencies:
```bash
pip install pandas numpy fuzzywuzzy
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3000`

## Data Structure

The application uses several CSV datasets:
- `games.csv`: Match history and results
- `club_games.csv`: Club-specific match data
- `clubs.csv`: Club information
- `game_events.csv`: Match events data
- `players.csv`: Player information
- `player_valuations.csv`: Player market values
- `la_liga_players.csv`: Detailed La Liga player statistics

## API Endpoints

- `/api/login`: User authentication
- `/api/logout`: User logout
- `/api/fixtures/:date`: Get fixtures for a specific date
- `/api/game-stats/:team1/:team2`: Get detailed game statistics
- `/api/user`: Get current user information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
