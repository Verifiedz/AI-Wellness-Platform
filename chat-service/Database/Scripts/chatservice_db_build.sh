#!/bin/bash

# Configuration
DB_NAME="chatservicedb"
USER="wasim"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# FOR DOCKER/AUTOMATION: Set the password so psql doesn't ask every time
# export PGPASSWORD='Wasim1921' 

echo "Starting Database Build for $DB_NAME..."

echo "--- Creating Tables ---"
if [ -d "$SCRIPT_DIR/Tables" ]; then
    for file in "$SCRIPT_DIR/Tables"/*.sql; do 
      echo "Executing $(basename "$file")..."
      psql -U $USER -d $DB_NAME -f "$file"
    done

else 
    echo "unable to find the table"
fi

echo "--- Creating Stored Procedures ---"
if [ -d "$SCRIPT_DIR/StoreProcedures" ]; then
    for file in "$SCRIPT_DIR/StoreProcedures"/*.sql; do
        echo "Executing $(basename "$file")..."
        psql -U $USER -d $DB_NAME -f "$file"
    done
else
    echo "Unable to find the storeprocedure"
fi

echo "Database Setup finished"
