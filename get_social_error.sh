#!/bin/bash
# Helper script to find Meta OAuth errors in cPanel logs

echo "Searching for Meta OAuth errors..."
echo "---------------------------------"

# Search current directory and subdirectories for the specific log signature
# Common cPanel locations: error.log, stderr.log, passenger.log
grep -r "\[OAuth Failure\]" . --include="*.log" | tail -n 5

if [ $? -ne 0 ]; then
    echo "No errors found yet. Make sure you tried to connect Facebook AFTER the last update."
fi
