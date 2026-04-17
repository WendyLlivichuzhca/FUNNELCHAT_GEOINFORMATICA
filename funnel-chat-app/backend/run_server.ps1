# Script para iniciar el servidor
# FunnelChat Backend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SERVIDOR FUNNELCHAT" -ForegroundColor Cyan
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
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Iniciando servidor..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "El servidor estara disponible en: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Documentacion API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

& $pythonExe -m uvicorn main:sio_app --reload --host 0.0.0.0 --port 8000

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Fallo al iniciar el servidor" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
