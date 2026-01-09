#!/bin/bash

# Exit on error
set -e

# Function to clean up background processes
cleanup() {
    echo "Stopping background processes..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID"
    fi
}

# Trap script exit (Ctrl+C, etc.) to call cleanup function
trap cleanup EXIT

# --- Backend ---
echo "Starting Spring Boot backend..."
(cd backend && ./gradlew bootRun) &
BACKEND_PID=$!

# Give backend a moment to start
sleep 10

# --- Frontend ---
echo "Starting Next.js frontend..."
(cd frontend && yarn dev)
