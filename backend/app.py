import pandas as pd
import json
import sys
import os
from datetime import datetime
import logging
import re
from fuzzywuzzy import fuzz
import numpy as np


logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
logging.debug(f"Current directory: {current_dir}")
logging.debug(f"Files in current directory: {os.listdir(current_dir)}")

# Construct the path to the data directory
data_dir = os.path.join(current_dir, 'data','stats')
logging.debug(f"Data directory: {data_dir}")

try:
    # load csv files
    games = pd.read_csv(os.path.join(data_dir, 'games.csv'))
    club_games = pd.read_csv(os.path.join(data_dir, 'club_games.csv'))
    clubs = pd.read_csv(os.path.join(data_dir, 'clubs.csv'))
    game_events = pd.read_csv(os.path.join(data_dir, 'game_events.csv'))
    players = pd.read_csv(os.path.join(data_dir, 'players.csv'))
    player_valuations = pd.read_csv(os.path.join(data_dir, 'player_valuations.csv'))
except Exception as e:
    logging.error(f"Error loading CSV files: {str(e)}")
    print(json.dumps({"error": f"Error loading CSV files: {str(e)}"}))
    sys.exit(1)

def normalize_club_name(name):
    # Remove common suffixes and prefixes
    name = re.sub(r'\b(FC|SC|AC|SS|CF|United|City)\b', '', name, flags=re.IGNORECASE)
    # Remove non-alphanumeric characters
    name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    # Convert to lowercase and trim
    return name.lower().strip()


# get club id by name
def get_club_id_by_name(club_name):
    logging.debug(f"Searching for club: {club_name}")
    normalized_input = normalize_club_name(club_name)
    
    try:
        best_match = None
        best_ratio = 0
        
        for index, row in clubs.iterrows():
            db_name = row['name']
            normalized_db_name = normalize_club_name(db_name)
            
            # Check for exact match first
            if normalized_db_name == normalized_input:
                logging.debug(f"Exact match found: {db_name}")
                return row['club_id']
            
            # Check for partial match
            ratio = fuzz.partial_ratio(normalized_input, normalized_db_name)
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = row
        
        if best_match is not None and best_ratio > 80:  # Minimum 80% match
            logging.debug(f"Best match found: {best_match['name']} (Score: {best_ratio})")
            return best_match['club_id']
        else:
            logging.error(f"No suitable match found for club: {club_name}")
            return None
    except Exception as e:
        logging.error(f"Error in get_club_id_by_name for {club_name}: {str(e)}")
        return None
def get_recent_form(club_identifier, num_games=5):
    try:
        # Check if club_identifier is a name or an ID
        if isinstance(club_identifier, str):
            club_id = get_club_id_by_name(club_identifier)
            if club_id is None:
                return f"No club found with name: {club_identifier}"
        else:
            club_id = club_identifier

        # Rest of the function remains the same
        recent_games = games[
            (games['home_club_id'] == club_id) | (games['away_club_id'] == club_id)
        ].sort_values('date', ascending=False).head(num_games)
        
        if recent_games.empty:
            return "No recent games found"
        
        form = []
        for _, game in recent_games.iterrows():
            club_game = club_games[
                (club_games['game_id'] == game['game_id']) & 
                (club_games['club_id'] == club_id)
            ]
            
            if club_game.empty:
                form.append('U')
            elif club_game['is_win'].iloc[0] == 1:
                form.append('W')
            elif game['home_club_goals'] == game['away_club_goals']:
                form.append('D')
            else:
                form.append('L')
        
        if len(form) < num_games:
            return f"Only {len(form)} recent games found: {''.join(form[::-1])}"
        
        return ''.join(form[::-1])
    
    except KeyError as e:
        return f"Error: Column not found in DataFrame: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"
    
def get_head_to_head(club_id_1, club_id_2):
    try:
        # Get all games between the two clubs
        h2h_games = games[
            ((games['home_club_id'] == club_id_1) & (games['away_club_id'] == club_id_2)) |
            ((games['home_club_id'] == club_id_2) & (games['away_club_id'] == club_id_1))
        ].sort_values('date')

        if h2h_games.empty:
            return "No head-to-head games found"

        first_game_date = h2h_games['date'].iloc[0]
        total_games = len(h2h_games)
        
        club_1_wins = 0
        club_2_wins = 0
        draws = 0

        for _, game in h2h_games.iterrows():
            if game['home_club_goals'] > game['away_club_goals']:
                if game['home_club_id'] == club_id_1:
                    club_1_wins += 1
                else:
                    club_2_wins += 1
            elif game['home_club_goals'] < game['away_club_goals']:
                if game['away_club_id'] == club_id_1:
                    club_1_wins += 1
                else:
                    club_2_wins += 1
            else:
                draws += 1

        club_1_name = clubs[clubs['club_id'] == club_id_1]['name'].iloc[0]
        club_2_name = clubs[clubs['club_id'] == club_id_2]['name'].iloc[0]

        return {
            "total_games": total_games,
            "first_game_date": first_game_date,
            f"{club_1_name}_wins": club_1_wins,
            f"{club_2_name}_wins": club_2_wins,
            "draws": draws
        }

    except KeyError as e:
        return f"Error: Column not found in DataFrame: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"
    
def is_high_scoring(club_id_1, club_id_2):
    try:
        h2h_games = games[
            ((games['home_club_id'] == club_id_1) & (games['away_club_id'] == club_id_2)) |
            ((games['home_club_id'] == club_id_2) & (games['away_club_id'] == club_id_1))
        ]

        if h2h_games.empty:
            return "No head-to-head games found"

        total_goals = h2h_games['home_club_goals'].sum() + h2h_games['away_club_goals'].sum()
        total_games = len(h2h_games)

        avg_goals = total_goals / total_games

        return avg_goals > 2.5

    except KeyError as e:
        return f"Error: Column not found in DataFrame: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

def get_key_player(club_id):
    try:
        # Get all players for the club
        club_players = players[players['current_club_id'] == club_id]
        
        if club_players.empty:
            return f"No players found for club ID {club_id}"

        # Get the latest valuation for each player
        latest_valuations = player_valuations.sort_values('date', ascending=False).drop_duplicates('player_id')
        
        # Merge player data with latest valuations
        club_players_with_values = club_players.merge(latest_valuations[['player_id', 'market_value_in_eur']], on='player_id', how='left')
        
        if club_players_with_values.empty:
            return f"No valuation data found for players of club ID {club_id}"

        # Use the 'market_value_in_eur' from player_valuations if available, otherwise use from players
        club_players_with_values['final_market_value'] = club_players_with_values['market_value_in_eur_y'].fillna(club_players_with_values['market_value_in_eur_x'])

        # Find the player with the highest market value
        key_player = club_players_with_values.loc[club_players_with_values['final_market_value'].idxmax()]
        
        return {
            'name': key_player['name'],
            'position': key_player['position'],
            'market_value': key_player['final_market_value']
        }

    except Exception as e:
        return f"An error occurred: {str(e)}\nClub ID: {club_id}\nPlayers DataFrame Shape: {players.shape}\nValuations DataFrame Shape: {player_valuations.shape}"

def get_clean_sheet_probability(club_id, num_games=10):
    try:
        # Get the last 10 games for the club
        recent_games = games[
            (games['home_club_id'] == club_id) | (games['away_club_id'] == club_id)
        ].sort_values('date', ascending=False).head(num_games)

        if recent_games.empty:
            return "No recent games found"

        clean_sheets = 0
        for _, game in recent_games.iterrows():
            if game['home_club_id'] == club_id:
                if game['away_club_goals'] == 0:
                    clean_sheets += 1
            else:  # Away game
                if game['home_club_goals'] == 0:
                    clean_sheets += 1

        probability = (clean_sheets / len(recent_games)) * 100
        return round(probability, 2)

    except Exception as e:
        return f"An error occurred: {str(e)}"

def is_high_card_game(club_id_1, club_id_2, num_games=3):
    try:
        # Get all games between the two clubs, sorted by date (most recent first)
        h2h_games = games[
            ((games['home_club_id'] == club_id_1) & (games['away_club_id'] == club_id_2)) |
            ((games['home_club_id'] == club_id_2) & (games['away_club_id'] == club_id_1))
        ].sort_values('date', ascending=False).head(num_games)

        if h2h_games.empty:
            return "No head-to-head games found"

        high_card_games = 0
        total_games = len(h2h_games)

        for _, game in h2h_games.iterrows():
            # Get all card events for this game
            game_cards = game_events[
                (game_events['game_id'] == game['game_id']) &
                (game_events['type'] == 'Cards')
            ]
            
            # If there are more than 4 cards, consider it a high-card game
            if len(game_cards) > 4:
                high_card_games += 1

        # Calculate the percentage of high-card games
        high_card_percentage = (high_card_games / total_games) * 100

        # Return True if more than 50% of the last 3 games are high-card games
        return high_card_percentage > 30

    except KeyError as e:
        return f"Error: Column not found in DataFrame: {str(e)}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}" 

def convert_to_json_serializable(obj):
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    else:
        return obj

def generate_game_stats(team1, team2):
    logging.debug(f"Generating game stats for {team1} vs {team2}")
    
    try:
        # Get club IDs from team names
        club_id_1 = get_club_id_by_name(team1)
        club_id_2 = get_club_id_by_name(team2)

        logging.debug(f"Club IDs: {team1}={club_id_1}, {team2}={club_id_2}")

        if club_id_1 is None and club_id_2 is None:
            error_msg = f"Could not find club IDs for both {team1} and {team2}. Please check the team names."
            logging.error(error_msg)
            return {"error": error_msg}
        elif club_id_1 is None:
            error_msg = f"Could not find club ID for {team1}. Please check the team name."
            logging.error(error_msg)
            return {"error": error_msg}
        elif club_id_2 is None:
            error_msg = f"Could not find club ID for {team2}. Please check the team name."
            logging.error(error_msg)
            return {"error": error_msg}

        # If we've made it here, we have both club IDs
        matched_team1 = clubs[clubs['club_id'] == club_id_1]['name'].iloc[0]
        matched_team2 = clubs[clubs['club_id'] == club_id_2]['name'].iloc[0]

        stats = {
            "team1": {
                "input_name": team1,
                "matched_name": matched_team1,
                "club_id": club_id_1
            },
            "team2": {
                "input_name": team2,
                "matched_name": matched_team2,
                "club_id": club_id_2
            },
            "recent_form": {
                team1: get_recent_form(club_id_1),
                team2: get_recent_form(club_id_2)
            },
            "head_to_head": get_head_to_head(club_id_1, club_id_2),
            "key_players": {
                team1: get_key_player(club_id_1),
                team2: get_key_player(club_id_2)
            },
            "high_scoring": is_high_scoring(club_id_1, club_id_2),
            "high_card": is_high_card_game(club_id_1, club_id_2),
            "clean_sheet": {
                team1: get_clean_sheet_probability(club_id_1),
                team2: get_clean_sheet_probability(club_id_2)
            },
        }
        logging.debug(f"Generated stats: {stats}")
        return convert_to_json_serializable(stats)
    except Exception as e:
        logging.error(f"Error generating game stats: {str(e)}")
        return {"error": f"Error generating game stats: {str(e)}"}
    
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
    logging.debug(f"Script started with arguments: {sys.argv}")
    if len(sys.argv) < 4:
        logging.error("Not enough arguments")
        print(json.dumps({"error": "Not enough arguments"}))
    else:
        function_name = sys.argv[1]
        if function_name == "generate_game_stats":
            team1 = sys.argv[2]
            team2 = sys.argv[3]
            logging.info(f"Calling generate_game_stats for {team1} vs {team2}")
            result = generate_game_stats(team1, team2)
            logging.debug(f"Result: {result}")
            try:
                print(json.dumps(result))
            except TypeError as e:
                logging.error(f"Error serializing result to JSON: {str(e)}")
                print(json.dumps({"error": "Error serializing result to JSON"}))
        else:
            logging.error(f"Unknown function: {function_name}")
            print(json.dumps({"error": f"Unknown function: {function_name}"}))