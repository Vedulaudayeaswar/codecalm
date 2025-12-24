@echo off
REM CodeCalm Database Setup Script for Windows
REM This script installs all dependencies and sets up the database

echo ========================================
echo CodeCalm Database Setup - Windows
echo ========================================
echo.

REM Change to backend directory
cd /d %~dp0

echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Checking PostgreSQL installation...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL not found in PATH
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)
echo PostgreSQL found!
echo.

echo [3/4] Running interactive database setup...
python setup_database.py
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    pause
    exit /b 1
)
echo.

echo [4/4] Setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Edit .env file and add your API keys
echo 2. Run: python main.py
echo 3. Visit: http://localhost:5000
echo ========================================
echo.

pause
