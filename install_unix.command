#!/usr/bin/env bash
set -e

# Resolve the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
  Linux*)  os_type="Linux"   ;;
  Darwin*) os_type="Mac"     ;;
  *)       os_type="UNKNOWN" ;;
esac
echo "Detected OS: $os_type"

if [[ "$os_type" == "Mac" || "$os_type" == "Linux" ]]; then
  # FRONTEND
  echo "Installing frontend dependencies..."
  cd "$SCRIPT_DIR/frontend"
  if ! command -v npm &> /dev/null; then
    echo "npm not found. Install Node.js & npm first." >&2
    exit 1
  fi
  npm install
  echo "Frontend dependencies installed."

  # BACKEND
  echo "Setting up backend dependencies..."
  cd "$SCRIPT_DIR/backend"
  if ! command -v python3 &> /dev/null; then
    echo "python3 not found. Install Python 3 first." >&2
    exit 1
  fi

  # Create venv only if it doesn’t already exist
  if [ ! -d env ]; then
    python3 -m venv env
  fi

  # Activate, install, then deactivate
  source env/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  deactivate

  echo "Installation completed successfully."

else
  echo "Unsupported OS: $OS" >&2
  exit 1
fi
