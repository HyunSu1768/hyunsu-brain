#!/bin/bash

# --- Cleanup ---
echo "--- Cleaning up old processes and lock files ---"
# 백엔드(8080) 및 프론트엔드(3000) 포트 점유 프로세스 종료
lsof -t -i:3000 | xargs kill -9 &>/dev/null || true
lsof -t -i:8080 | xargs kill -9 &>/dev/null || true
# Next.js 잠금 파일 제거
rm -f frontend/.next/dev/lock
echo "--- Cleanup complete ---"
echo ""

# Job Control 활성화 (프로세스 그룹 관리를 위해 필요)
set -m

# --- Backend ---
echo "Starting Spring Boot backend..."
# --console=plain 옵션을 추가하여 "85% EXECUTING" 바가 가독성을 해치지 않게 설정
(cd backend && ./gradlew bootRun --console=plain) &
BACKEND_PID=$!

# --- Cleanup Trap ---
# 스크립트 종료 시(Ctrl+C 등) 백엔드 프로세스 그룹 전체를 종료
trap 'echo -e "\nStopping background processes..."; kill -TERM -$BACKEND_PID &>/dev/null' EXIT

# --- Wait for Backend ---
echo "Waiting for backend to start on port 8080..."
while ! nc -z localhost 8080; do
  # 백엔드 프로세스가 살아있는지 확인. 죽었다면 에러 메시지 출력 후 종료.
  if ! ps -p $BACKEND_PID > /dev/null; then
    echo "----------------------------------------------------------"
    echo "Backend process died before it could start."
    echo "Please check backend logs by running: cd backend && ./gradlew bootRun"
    echo "----------------------------------------------------------"
    wait $BACKEND_PID
    exit 1
  fi
  sleep 1
done
echo "Backend started successfully!"
echo ""

# --- Frontend Dependency Check & Install ---
echo "Checking frontend dependencies..."
cd frontend

# 패키지 매니저 확인 (yarn 우선, 없으면 npm)
if command -v yarn &> /dev/null; then
    PM="yarn"
    INSTALL_CMD="yarn install"
    DEV_CMD="yarn dev"
else
    PM="npm"
    INSTALL_CMD="npm install"
    DEV_CMD="npm run dev"
fi

# node_modules 폴더가 없으면 설치 진행
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Installing dependencies using $PM..."
    $INSTALL_CMD
    if [ $? -ne 0 ]; then
        echo "Error: Frontend dependencies installation failed."
        exit 1
    fi
    echo "Dependencies installed successfully."
else
    echo "Dependencies are already installed."
fi

# --- Starting Frontend ---
echo "Starting Next.js frontend with $PM..."
echo ""
# 프론트엔드를 포그라운드에서 실행. 종료 시 위에서 설정한 trap이 작동함.
$DEV_CMD