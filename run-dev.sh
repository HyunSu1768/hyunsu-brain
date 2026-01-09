#!/bin/bash

# --- Cleanup ---
echo "--- Cleaning up old processes and lock files ---"
# Kill processes on frontend and backend ports
lsof -t -i:3000 | xargs kill -9 &>/dev/null || true
lsof -t -i:8080 | xargs kill -9 &>/dev/null || true
# Remove Next.js lock file
rm -f frontend/.next/dev/lock
echo "--- Cleanup complete ---"
echo ""

# Enable Job Control to manage process groups
set -m

# --- Backend ---
echo "Starting Spring Boot backend..."
(cd backend && ./gradlew bootRun) &
BACKEND_PID=$!

# --- Cleanup Trap ---
# When the script exits (e.g. via Ctrl+C), kill the entire process group of the backend
trap 'echo -e "\nStopping background processes..."; kill -TERM -$BACKEND_PID &>/dev/null' EXIT

# --- Wait for Backend ---
echo "Waiting for backend to start on port 8080..."
while ! nc -z localhost 8080; do
  # Check if the backend process is still alive. If not, exit.
  if ! ps -p $BACKEND_PID > /dev/null; then
    echo "Backend process died before it could start. Check logs for errors."
    # wait for the failed process to get its exit code
    wait $BACKEND_PID
    exit 1
  fi
  sleep 1
done
echo "Backend started successfully!"
echo ""

# --- Frontend ---
echo "Starting Next.js frontend..."
# Start frontend in the foreground. If it exits, the script will exit, triggering the trap.
cd frontend && yarn dev