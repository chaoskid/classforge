@echo off
SETLOCAL

echo "Detected Windows environment"

:: Check if Node.js and npm are installed
where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo "npm could not be found. Please install Node.js and npm before proceeding."
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo "Python could not be found. Please install Python before proceeding."
    exit /b 1
)

:: Navigate to the backend folder and set up the virtual environment
::cd ..
echo "Setting up backend dependencies..."
cd backend

:: Create the virtual environment (env) if it doesn't exist
IF NOT EXIST env (
    python -m venv env
)

:: Activate the virtual environment
call env\Scripts\activate

:: Upgrade pip and install backend dependencies
pip install --upgrade pip
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    echo "pip install failed in backend. Please check for issues."
    pause
    exit /b 1
)
echo "Backend dependencies installed."
:: Deactivate the virtual environment
call deactivate
:: Check if the frontend folder exists
IF NOT EXIST ..\frontend (
    echo "Frontend folder not found. Please ensure the directory structure is correct."
    exit /b 1
)

:: Navigate to the frontend folder and install npm dependencies
echo "Installing frontend dependencies..."
cd ..
cd frontend
npm install
echo "Frontend dependencies installed."

echo "Installation completed successfully!"
pause  :: This will keep the window open after completion

ENDLOCAL