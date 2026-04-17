@echo off
REM Script de inicio completo - Inicializa BD e inicia servidor

chcp 65001 >nul
cls

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul
set "PYTHON_EXE=%SCRIPT_DIR%venv\Scripts\python.exe"

echo.
echo ============================================================
echo   FUNNELCHAT - Sistema Completo
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

echo Paso 1 de 2: Inicializando base de datos...
echo.

REM Ejecutar el script de inicializacion
"%PYTHON_EXE%" init_db.py

if errorlevel 1 (
    echo.
    echo Error en la inicializacion de base de datos
    popd >nul
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Paso 2 de 2: Iniciando servidor...
echo ============================================================
echo.
echo El servidor estara disponible en: http://localhost:8000
echo Documentacion API: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor
"%PYTHON_EXE%" -m uvicorn main:sio_app --reload --host 0.0.0.0 --port 8000

set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
    echo.
    echo Error al iniciar el servidor
    popd >nul
    pause
    exit /b %EXIT_CODE%
)

popd >nul
