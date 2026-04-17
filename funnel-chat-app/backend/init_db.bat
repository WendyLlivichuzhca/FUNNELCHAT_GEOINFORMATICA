@echo off
REM Script de inicializacion de base de datos para Windows
REM Este script crea todas las tablas necesarias

chcp 65001 >nul
cls

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul
set "PYTHON_EXE=%SCRIPT_DIR%venv\Scripts\python.exe"

echo.
echo ============================================================
echo   INICIALIZADOR DE BASE DE DATOS - FunnelChat
echo ============================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist main.py (
    echo Error: No se encontro main.py
    echo Asegurate de estar en la carpeta backend
    echo.
    popd >nul
    pause
    exit /b 1
)

if not exist "%PYTHON_EXE%" (
    echo Error: No se encontro Python del entorno virtual
    echo Ruta esperada: %PYTHON_EXE%
    echo.
    popd >nul
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Ejecutando inicializacion de base de datos...
echo ============================================================
echo.

REM Ejecutar el script de inicializacion
"%PYTHON_EXE%" init_db.py

if errorlevel 1 (
    echo.
    echo ============================================================
    echo ERROR: La inicializacion fallo
    echo ============================================================
    echo.
    echo Posibles soluciones:
    echo   1. Verifica que el archivo .env existe
    echo   2. Verifica que todas las dependencias estan instaladas
    echo   3. Revisa que el entorno virtual siga existiendo
    echo.
    popd >nul
    pause
    exit /b 1
)

echo.
echo ============================================================
echo INICIALIZACION EXITOSA
echo ============================================================
echo.
echo La base de datos esta lista.
echo.
echo Proximo paso: Inicia el servidor ejecutando run_server.bat
echo.
popd >nul
pause
