# Galaxium Travels - Windows PowerShell Start Script
# Starts both backend and frontend servers

Write-Host "Starting Galaxium Travels..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Delete old database if exists
$dbPath = "booking_system_backend\galaxium_booking.db"
if (Test-Path $dbPath) {
    Write-Host "Removing old database..." -ForegroundColor Yellow
    Remove-Item $dbPath -Force
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Blue
Set-Location booking_system_backend

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment and install dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt

# Start backend in new window
Write-Host "Starting backend on http://localhost:8080" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\.venv\Scripts\Activate.ps1; python server.py"

Set-Location ..

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Blue
Set-Location booking_system_frontend

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Start frontend in new window
Write-Host "Starting frontend on http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Set-Location ..

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Galaxium Travels is starting!" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8080/docs" -ForegroundColor White
Write-Host ""
Write-Host "Both servers are running in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the servers." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

# Made with Bob
