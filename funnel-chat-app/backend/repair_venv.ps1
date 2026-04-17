# Reparador de entorno virtual para FunnelChat

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "REPARADOR DE ENTORNO VIRTUAL - FunnelChat" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
$pythonExe = Join-Path $scriptDir "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "ERROR: No se encontro Python del entorno virtual" -ForegroundColor Red
    Write-Host "Ruta esperada: $pythonExe" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "Paso 1: Actualizando pip..." -ForegroundColor Yellow
& $pythonExe -m pip install --upgrade pip

Write-Host ""
Write-Host "Paso 2: Instalando dependencias..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  - Instalando fastapi..." -ForegroundColor Cyan
& $pythonExe -m pip install fastapi==0.135.1

Write-Host "  - Instalando uvicorn..." -ForegroundColor Cyan
& $pythonExe -m pip install uvicorn==0.41.0

Write-Host "  - Instalando sqlalchemy..." -ForegroundColor Cyan
& $pythonExe -m pip install sqlalchemy==2.0.48

Write-Host "  - Instalando python-dotenv..." -ForegroundColor Cyan
& $pythonExe -m pip install python-dotenv==1.2.2

Write-Host "  - Instalando python-jose..." -ForegroundColor Cyan
& $pythonExe -m pip install "python-jose[cryptography]"

Write-Host "  - Instalando bcrypt..." -ForegroundColor Cyan
& $pythonExe -m pip install bcrypt==4.2.1

Write-Host "  - Instalando passlib..." -ForegroundColor Cyan
& $pythonExe -m pip install passlib==1.7.4

Write-Host "  - Instalando pydantic..." -ForegroundColor Cyan
& $pythonExe -m pip install pydantic==2.12.5

Write-Host "  - Instalando python-socketio..." -ForegroundColor Cyan
& $pythonExe -m pip install python-socketio==5.16.1

Write-Host "  - Instalando python-engineio..." -ForegroundColor Cyan
& $pythonExe -m pip install python-engineio==4.13.1

Write-Host ""
Write-Host "Paso 3: Verificando instalacion..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Verificando SQLAlchemy..." -ForegroundColor Cyan
& $pythonExe -c "import sqlalchemy; print('OK')"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  EXITO: SQLAlchemy instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "  ERROR: SQLAlchemy no esta instalado" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "REPARACION COMPLETADA" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta: .\start.ps1" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para salir"
