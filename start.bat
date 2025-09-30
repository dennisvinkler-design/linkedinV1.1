@echo off
echo Starting LinkedIn Post Generator System...
echo.

echo Step 1: Checking Node.js...
node --version
if errorlevel 1 (
    echo Error: Node.js not found
    pause
    exit /b 1
)
echo Node.js OK
echo.

echo Step 2: Checking directories...
if not exist "backend" (
    echo Error: Backend directory not found
    pause
    exit /b 1
)
echo Backend directory found

if not exist "frontend" (
    echo Error: Frontend directory not found
    pause
    exit /b 1
)
echo Frontend directory found
echo.

echo Step 3: Checking database schema...
echo NOTE: If you see database errors, run the fix_database_columns.sql file in your Supabase SQL Editor
echo.

echo Step 4: Installing dependencies if needed...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    if errorlevel 1 (
        echo Error installing backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo Backend dependencies installed
) else (
    echo Backend dependencies already installed
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if errorlevel 1 (
        echo Error installing frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo Frontend dependencies installed
) else (
    echo Frontend dependencies already installed
)
echo.

echo Step 5: Checking if port 3002 is available...
netstat -an | findstr ":3002.*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3002 is already in use!
    echo Killing existing process on port 3002...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002.*LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    echo Port 3002 cleared
)

echo Starting backend...
cd backend
start "LinkedIn Backend" cmd /k "echo Backend starting... && npm run dev"
cd ..
echo Backend started in new window
echo.

echo Step 6: Waiting for backend to initialize...
echo Checking backend status...
set /a attempts=0
:check_backend
set /a attempts+=1
if %attempts% gtr 15 (
    echo Backend port check completed
    goto continue_backend
)
REM Check if port is listening
netstat -an | findstr ":3002.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Waiting for backend to be ready... (attempt %attempts%/15)
    ping 127.0.0.1 -n 3 >nul
    goto check_backend
) else (
    echo Backend is ready on port 3002
    goto continue_backend
)
:continue_backend
echo Backend initialization completed
echo.

echo Step 7: Checking if port 3000 is available...
netstat -an | findstr ":3000.*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3000 is already in use!
    echo Killing existing process on port 3000...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000.*LISTENING"') do taskkill /f /pid %%a >nul 2>&1
    echo Port 3000 cleared
)

echo Starting frontend...
cd frontend
start "LinkedIn Frontend" cmd /k "echo Frontend starting... && set PORT=3000 && npm start"
cd ..
echo Frontend started in new window
echo.

echo Step 8: Waiting for frontend to initialize...
ping 127.0.0.1 -n 16 >nul
echo Frontend wait completed
echo.

echo Step 9: Checking if frontend is running...
set /a attempts=0
:check_frontend
set /a attempts+=1
if %attempts% gtr 30 (
    echo WARNING: Frontend did not start within 2 minutes
    echo Please check the frontend window for errors
    goto continue
)
netstat -an | findstr ":3000.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Waiting for frontend to start... (attempt %attempts%/30)
    ping 127.0.0.1 -n 4 >nul
    goto check_frontend
) else (
    echo Frontend is running on port 3000
    set FRONTEND_PORT=3000
    echo.
)
:continue

echo Step 10: System ready!
echo Opening browser automatically...
echo.

echo ========================================
echo SYSTEM STARTED SUCCESSFULLY
echo ========================================
echo.
echo Backend: http://localhost:3002
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.

REM Wait a moment for frontend to fully load
ping 127.0.0.1 -n 3 >nul

REM Check which port frontend is actually running on
set FRONTEND_PORT=3000
netstat -an | findstr ":3000.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Frontend might be running on a different port, checking...
    for /L %%i in (3001,1,3010) do (
        netstat -an | findstr ":%%i.*LISTENING" >nul 2>&1
        if not errorlevel 1 (
            set FRONTEND_PORT=%%i
            echo Found frontend on port %%i
            goto :found_port
        )
    )
    echo WARNING: Could not detect frontend port, using default 3000
)
:found_port

REM Open browser automatically
start http://localhost:%FRONTEND_PORT%

echo Browser opened automatically!
echo.
echo Check the backend and frontend windows for any errors.
echo Close this window when you're done.
echo.
echo System is ready for use!