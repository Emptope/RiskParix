#!/usr/bin/env bash
set -e

trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT SIGTERM

echo "Starting backend..."
pushd backend > /dev/null
uvicorn app:app --reload &
BACKEND_PID=$!
popd > /dev/null

echo "Starting frontend..."
pushd frontend > /dev/null
npm run dev &
FRONTEND_PID=$!
popd > /dev/null

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

wait $BACKEND_PID $FRONTEND_PID