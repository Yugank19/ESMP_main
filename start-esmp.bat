@echo off
:: If running inside PowerShell, relaunch as proper CMD
if "%PROCESSOR_ARCHITEW6432%"=="" (
    if not "%ComSpec%"=="%SystemRoot%\system32\cmd.exe" goto :run
)

:run
title ESMP Dev Server
setlocal

set ROOT=%~dp0

echo.
echo  Stopping any running processes...
echo  ----------------------------------------------------------

taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Kill port 3000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill port 4000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 3 /nobreak >nul

:: Delete Next.js lock file
if exist "%ROOT%apps\web\.next\dev\lock" (
    del /f /q "%ROOT%apps\web\.next\dev\lock" >nul 2>&1
    echo  Cleared Next.js lock file
)

:: Generate Prisma client
echo  Generating Prisma client...
pushd "%ROOT%apps\api"
call npx prisma generate
popd

echo.
echo  Starting API on http://localhost:4000 ...
start "ESMP API" cmd /k "cd /d "%ROOT%apps\api" && npm run start:dev"

timeout /t 2 /nobreak >nul

echo  Starting Web on http://localhost:3000 ...
start "ESMP Web" cmd /k "cd /d "%ROOT%apps\web" && npm run dev"

echo.
echo  ----------------------------------------------------------
echo   Web  -^>  http://localhost:3000
echo   API  -^>  http://localhost:4000
echo  ----------------------------------------------------------
echo.
pause
endlocal
