#!/usr/bin/env bash
set -e

# Point at the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

OS="$(uname -s)"
case "$OS" in
  Linux*)  os_type="Linux" ;;
  Darwin*) os_type="Mac"   ;;
  *)       os_type="UNKNOWN" ;;
esac
echo "Detected OS: $os_type"

# Helper to wait for backend port
wait_for_backend() {
  echo "Waiting for backend to become available on port 5002.."
  # Use nc or bash TCP; fall back to curl if you prefer a health endpoint
  until nc -z localhost 5000 2>/dev/null; do
    sleep 1
  done
  echo "Backend is up!"
}

if [ "$os_type" = "Mac" ]; then
  echo "Starting backend in a new Terminal window…"
  osascript <<EOF
    tell application "Terminal"
      activate
      do script "cd '$SCRIPT_DIR/backend' && source env/bin/activate && python app.py"
    end tell
EOF

  wait_for_backend

  echo "Starting frontend in current shell…"
  cd "$SCRIPT_DIR/frontend"
  npm run start

elif [ "$os_type" = "Linux" ]; then
  echo "Starting backend in a new terminal…"
  gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend' && source env/bin/activate && python app.py; exec bash"

  wait_for_backend

  echo "Starting frontend in current shell…"
  cd "$SCRIPT_DIR/frontend"
  npm run start

else
  echo "Unsupported OS: $OS" >&2
  exit 1
fi
