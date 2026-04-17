@echo off
REM Server startup script for Windows
REM This will start the FunnelChat backend server

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul
set "PYTHON_EXE=%SCRIPT_DIR%venv\Scripts\python.exe"

echo ============================================================
echo FunnelChat Backend Server
echo ============================================================
echo.

if not exist "%PYTHON_EXE%" (
    echo Error: Could not find virtual environment Python
    echo Expected path: %PYTHON_EXE%
    popd >nul
    pause
    exit /b 1
)

REM Run uvicorn server
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

"%PYTHON_EXE%" -m uvicorn main:sio_app --reload --host 0.0.0.0 --port 8000

set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
    echo.
    echo Error: Failed to start server
    popd >nul
    pause
    exit /b %EXIT_CODE%
)

popd >nul
