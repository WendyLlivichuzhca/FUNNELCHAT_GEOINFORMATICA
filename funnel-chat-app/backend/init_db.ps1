# Script de inicializacion de base de datos para PowerShell
# FunnelChat Backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  INICIALIZADOR DE BASE DE DATOS - FunnelChat" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
$pythonExe = Join-Path $scriptDir "venv\Scripts\python.exe"

if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: No se encontro main.py" -ForegroundColor Red
    Write-Host "Asegurate de estar en la carpeta backend" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

if (-not (Test-Path $pythonExe)) {
    Write-Host "ERROR: No se encontro Python del entorno virtual" -ForegroundColor Red
    Write-Host "Ruta esperada: $pythonExe" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  Ejecutando inicializacion de base de datos..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

& $pythonExe init_db.py

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "ERROR: La inicializacion fallo" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  1. Verifica que el archivo .env existe" -ForegroundColor Yellow
    Write-Host "  2. Verifica que todas las dependencias estan instaladas" -ForegroundColor Yellow
    Write-Host "  3. Revisa que el entorno virtual siga existiendo" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "INICIALIZACION EXITOSA" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "La base de datos esta lista." -ForegroundColor Green
Write-Host ""
Write-Host "Proximo paso: Inicia el servidor ejecutando:" -ForegroundColor Cyan
Write-Host "  .\start.ps1" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para salir"
