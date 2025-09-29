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

echo Step 3: Installing dependencies if needed...
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

echo Step 4: Checking if port 3001 is available...
netstat -an | findstr ":3001.*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3001 is already in use!
    echo Please close any existing backend servers and try again.
    echo.
    echo Press any key to continue anyway...
    pause
)

echo Starting backend...
cd backend
start "LinkedIn Backend" cmd /k "echo Backend starting... && npm run dev"
cd ..
echo Backend started in new window
echo.

echo Step 5: Waiting for backend to initialize...
ping 127.0.0.1 -n 6 >nul
echo Backend wait completed
echo.

echo Step 6: Starting frontend...
cd frontend
start "LinkedIn Frontend" cmd /k "echo Frontend starting... && npm run dev"
cd ..
echo Frontend started in new window
echo.

echo Step 7: Waiting for frontend to initialize...
ping 127.0.0.1 -n 16 >nul
echo Frontend wait completed
echo.

echo Step 8: Checking if frontend is running...
:check_frontend
netstat -an | findstr ":3000.*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Waiting for frontend to start...
    ping 127.0.0.1 -n 4 >nul
    goto check_frontend
) else (
    echo Frontend is running on port 3000
    echo.
)

echo Step 9: System ready!
echo Frontend should open browser automatically
echo.

echo ========================================
echo SYSTEM STARTED SUCCESSFULLY
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Browser should now be open. If not, manually navigate to:
echo http://localhost:3000
echo.
echo Check the backend and frontend windows for any errors.
echo Close this window when you're done.
echo.
echo Press any key to close this window...
pause