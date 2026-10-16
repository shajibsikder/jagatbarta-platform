@echo off
title Jagatbarta News Engine Launcher
color 0A

echo ====================================================================
echo        JAGATBARTA AUTOMATED NEWS ENGINE & PROMPT GENERATOR
echo ====================================================================
echo.
echo [*] Checking local environment...

cd /d "%~dp0"

if not exist node_modules (
    echo [*] Installing required packages, please wait a moment...
    call npm install
)

echo [*] Starting News Engine Server...
echo [*] Opening Dashboard in your browser: http://localhost:3000
echo.

start "" "http://localhost:3000"
node server.js

pause
