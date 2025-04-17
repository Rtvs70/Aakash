@echo off
REM Check for Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js 16.x or higher.
    exit /b 1
)

REM Check if .env file exists
IF NOT EXIST .env (
    echo Warning: .env file not found. Creating from template...
    IF EXIST .env.example (
        copy .env.example .env
        echo Created .env file from .env.example. Please edit it with your actual values.
    ) ELSE (
        echo Error: .env.example not found. Please create a .env file manually.
        exit /b 1
    )
)

REM Check if dependencies are installed
IF NOT EXIST node_modules (
    echo Installing dependencies...
    call npm install
)

REM Start the app in development or production mode
IF "%1"=="prod" (
    echo Starting in production mode...
    call npm run build && npm run start
) ELSE (
    echo Starting in development mode...
    call npm run dev
)
