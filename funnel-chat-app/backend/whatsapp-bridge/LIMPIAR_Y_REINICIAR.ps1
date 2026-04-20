# 🧹 LIMPIEZA COMPLETA PARA QR NUEVO

## Ejecuta esto en PowerShell (como Administrador si hay errores):

```powershell
# 1. Detener todos los procesos Python y Node
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Procesos detenidos" -ForegroundColor Green

# 2. Ir a la carpeta del bridge
cd "C:\Users\Wendy Llivichuzhca\Documents\GEOINFORMATICA\FUNNELCHAT_GEOINFORMATICA\funnel-chat-app\backend\whatsapp-bridge"

# 3. Eliminar sesiones de WhatsApp
if (Test-Path .\auth_info_baileys) {
    Remove-Item -Recurse -Force .\auth_info_baileys
    Write-Host "✅ auth_info_baileys eliminado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No existía auth_info_baileys" -ForegroundColor Yellow
}

if (Test-Path .\sessions) {
    Remove-Item -Recurse -Force .\sessions
    Write-Host "✅ sessions eliminado" -ForegroundColor Green
}

# 4. Mensaje para IndexedDB
Write-Host "`n🌐 Ahora abre Chrome y ve a:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173/limpiar-db.html" -ForegroundColor White
Write-Host "   O presiona F12 → Application → IndexedDB → Eliminar 'FunnelChatDB'" -ForegroundColor White

Write-Host "`n🚀 Luego ejecuta:" -ForegroundColor Cyan
Write-Host "   cd backend && python main.py" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor White

Write-Host "`n✅ ¡Listo! Escanea el nuevo QR" -ForegroundColor Green
```

## 📁 Archivos creados:
- `LIMPIAR_QR.md` - Instrucciones
- `limpiar-db.html` - Página para limpiar IndexedDB fácilmente

---

**¿Ejecuto el comando PowerShell ahora?** (Se cerrarán los procesos Python/Node)