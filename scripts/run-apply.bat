@echo off
setlocal
set "ROOT=%~dp0.."
cd /d "%ROOT%"
if not exist logs mkdir logs
npm run apply >> logs\cron.log 2>&1
