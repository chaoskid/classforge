@echo off
SETLOCAL

echo Detected Windows environment

:: 1) Start backend in a new window
echo Starting backend in a new terminal...
start "Backend" cmd /k "cd backend && env\Scripts\activate && python app.py"

:: 2) Wait for backend to come up on port 5002
echo Waiting for backend to become available on port 5002...
:WAIT_LOOP
  powershell -NoLogo -NoProfile -Command ^
    "if ((Test-NetConnection -ComputerName 'localhost' -Port 5002).TcpTestSucceeded) { exit 0 } else { exit 1 }"
  IF %ERRORLEVEL% NEQ 0 (
    timeout /t 1 >nul
    goto WAIT_LOOP
  )

echo Backend is up!

:: 3) Start frontend in this window
echo Starting frontend...
cd frontend
npm run start

ENDLOCAL
