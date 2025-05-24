@echo off
echo Starting RiskParix...

echo Starting backend (http://localhost:8000)...
start cmd /k "cd backend && uvicorn app:app --reload"

echo Starting frontend (http://localhost:5173)...
start cmd /k "cd frontend && npm run dev"

echo All services started.
pause
