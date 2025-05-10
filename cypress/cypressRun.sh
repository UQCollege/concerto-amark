#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Paths
CLIENT_DIR="../client"
BACKEND_DIR="../backend"

# Update .env files
echo "Setting fake auth flags in .env files..."
sed -i 's/^USE_FAKE_AUTH=.*/USE_FAKE_AUTH=True/' "$BACKEND_DIR/.env"
sed -i 's/^VITE_AUTH_DISABLED=.*/VITE_AUTH_DISABLED=true/' "$CLIENT_DIR/.env"

# Start client if not already running
if ! lsof -i:5173 -t >/dev/null; then
    echo "Starting client..."
    (
        cd "$CLIENT_DIR"
        npm run dev &
    )
else
    echo "Client is already running."
fi

# Start backend if not running
if ! docker ps | grep -q "concerto-amark"; then
    echo "Starting backend..."
    (
        cd "$BACKEND_DIR"
        docker compose up -d
    )
else
    echo "Backend is already running."
fi

# Optional: Wait until client is available
echo "Waiting for client to become available at http://localhost:5173..."
until curl -s http://localhost:5173 > /dev/null; do
    sleep 1
done

# Run Cypress tests
echo "Running Cypress tests..."
npm run test

echo "All done!"
