@echo off
REM Script de reparacion del entorno virtual
REM Reinstala todas las dependencias

chcp 65001 >nul
cls

echo.
echo ============================================================
echo   REPARADOR DE ENTORNO VIRTUAL - FunnelChat
echo ============================================================
echo.

REM Verificar que estamos en el lugar correcto
if not exist venv\Scripts\activate.bat (
    echo ✗ Error: No se encontro el entorno virtual
    echo   Asegurate de estar en la carpeta backend
    echo.
    pause
    exit /b 1
)

echo Este script reparara tu entorno virtual instalando todas las dependencias.
echo.

REM Activar venv
echo Activando entorno virtual...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ✗ Error: No se pudo activar el entorno virtual
    pause
    exit /b 1
)

echo ✓ Entorno virtual activado
echo.

REM Actualizar pip
echo Paso 1: Actualizando pip...
python -m pip install --upgrade pip >nul 2>&1

if errorlevel 1 (
    echo ADVERTENCIA: Hubo un problema actualizando pip
    echo Continuando de todas formas...
) else (
    echo ✓ pip actualizado
)

echo.

REM Instalar dependencias
echo Paso 2: Instalando dependencias...
echo (Esto puede tomar unos minutos...)
echo.

echo   Instalando: fastapi
pip install fastapi==0.135.1 --quiet
echo   Instalando: uvicorn
pip install uvicorn==0.41.0 --quiet
echo   Instalando: sqlalchemy
pip install sqlalchemy==2.0.48 --quiet
echo   Instalando: python-dotenv
pip install python-dotenv==1.2.2 --quiet
echo   Instalando: python-jose
pip install python-jose==3.5.0 --quiet
echo   Instalando: bcrypt
pip install bcrypt==4.2.1 --quiet
echo   Instalando: passlib
pip install passlib==1.7.4 --quiet
echo   Instalando: pydantic
pip install pydantic==2.12.5 --quiet
echo   Instalando: python-socketio
pip install python-socketio==5.16.1 --quiet
echo   Instalando: python-engineio
pip install python-engineio==4.13.1 --quiet

echo ✓ Dependencias instaladas
echo.

echo Paso 3: Verificando instalacion...

REM Verificar SQLAlchemy
python -c "import sqlalchemy; print('OK')" >nul 2>&1
if errorlevel 1 (
    echo ✗ SQLAlchemy NO esta instalado
    echo Intentando instalar de nuevo...
    pip install sqlalchemy --upgrade
) else (
    echo ✓ SQLAlchemy instalado correctamente
)

echo.
echo ============================================================
echo ✅ REPARACION COMPLETADA
echo ============================================================
echo.
echo Ahora puedes ejecutar: start.bat
echo.
pause
