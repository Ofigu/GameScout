import kagglehub
import schedule
import time
import os
from datetime import datetime
import shutil
import pandas as pd

# Define your project's specific file paths
PROJECT_CSV_PATH = r"C:\Users\LENOVO\OneDrive\Desktop\לימודים\GameScout\backend\data\stats\la_liga_players.csv"
BACKUP_DIR = os.path.join(os.path.dirname(PROJECT_CSV_PATH), "backups")

def download_latest_dataset():
    """
    Downloads the latest version of the LaLiga players stats dataset,
    renames it correctly, and updates the project's CSV file
    """
    try:
        # Create backup directory if it doesn't exist
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)
        
        # Backup existing file if it exists
        if os.path.exists(PROJECT_CSV_PATH):
            backup_filename = f"la_liga_players_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            backup_path = os.path.join(BACKUP_DIR, backup_filename)
            shutil.copy2(PROJECT_CSV_PATH, backup_path)
            print(f"Backed up existing file to: {backup_path}")
        
        try:
            # Download latest version using the correct API
            new_path = kagglehub.model_download(
                "eduardopalmieri/laliga-players-stats"
            )
            
            # If that doesn't work, try alternative method
            if not new_path:
                new_path = kagglehub.dataset_download(
                    "eduardopalmieri/laliga-players-stats"
                )
        except Exception as download_error:
            print(f"Error with initial download method: {str(download_error)}")
            print("Trying alternative download method...")
            new_path = kagglehub.dataset_download(
                "eduardopalmieri/laliga-players-stats"
            )
        
        if not new_path:
            raise Exception("Failed to download dataset")
            
        print(f"Download completed to: {new_path}")
        
        # Find the database file (it might be named 'database.csv' or similar)
        downloaded_csv = None
        for root, dirs, files in os.walk(new_path):
            print(f"Searching in directory: {root}")
            for file in files:
                print(f"Found file: {file}")
                if file.endswith('.csv'):
                    downloaded_csv = os.path.join(root, file)
                    print(f"Found CSV file: {downloaded_csv}")
                    break
        
        if downloaded_csv:
            # Read the CSV to verify it's the correct data
            df = pd.read_csv(downloaded_csv)
            
            # Copy and rename the file to your project location
            shutil.copy2(downloaded_csv, PROJECT_CSV_PATH)
            print(f"Successfully updated project CSV at: {PROJECT_CSV_PATH}")
            
            # Verify the update
            print(f"New dataset contains {len(df)} rows")
            print(f"Update completed at: {datetime.now()}")
            
            # Log the update
            with open(os.path.join(BACKUP_DIR, "update_log.txt"), "a", encoding='utf-8') as log_file:
                log_file.write(f"\nDataset updated on {datetime.now()}")
                log_file.write(f"\nOriginal filename: {os.path.basename(downloaded_csv)}")
                log_file.write(f"\nSaved as: {os.path.basename(PROJECT_CSV_PATH)}")
                log_file.write(f"\nNew row count: {len(df)}\n")
            
            return True
        else:
            raise Exception("Could not find CSV file in downloaded dataset")
    
    except Exception as e:
        print(f"Error updating dataset: {str(e)}")
        # Log the error
        with open(os.path.join(BACKUP_DIR, "update_log.txt"), "a", encoding='utf-8') as log_file:
            log_file.write(f"\nError on {datetime.now()}: {str(e)}\n")
        return False

def schedule_downloads():
    """
    Schedule the dataset download to run weekly
    """
    # Schedule the job to run every Monday at 1 AM
    schedule.every().monday.at("01:00").do(download_latest_dataset)
    
    print("Automatic dataset updates scheduled.")
    print("The script will check for updates every Monday at 1 AM.")
    print("Keep this script running to maintain automatic updates.")
    
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour

if __name__ == "__main__":
    # First download immediately when script starts
    print("Performing initial dataset download...")
    download_latest_dataset()
    
    # Then schedule future downloads
    schedule_downloads()