@echo off
setlocal
cd /d "%~dp0"
if exist "..\.tools\node-v22.23.5-win-x64\node.exe" set "PATH=%~dp0..\.tools\node-v22.23.5-win-x64;%PATH%"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 and run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\next\package.json" (
  call npm.cmd ci
  if errorlevel 1 exit /b 1
)
echo REAL FIGHT Tournament Manager: http://localhost:3001
echo Configure .env.local using README.md to connect Supabase.
call npm.cmd run dev
