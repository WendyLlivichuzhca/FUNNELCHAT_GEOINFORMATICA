@echo off
echo ========================================
echo   LIMPIEZA COMPLETA PARA QR NUEVO
echo ========================================
echo.

echo [1/4] Deteniendo procesos...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
echo ✅ Procesos detenidos
echo.

echo [2/4] Eliminando sesiones de WhatsApp...
cd /d "C:\Users\Wendy Llivichuzhca\Documents\GEOINFORMATICA\FUNNELCHAT_GEOINFORMATICA\funnel-chat-app\backend\whatsapp-bridge"

if exist auth_info_baileys (
    rmdir /s /q auth_info_baileys
    echo ✅ auth_info_baileys eliminado
) else (
    echo ℹ️ No existia auth_info_baileys
)

if exist sessions (
    rmdir /s /q sessions
    echo ✅ sessions eliminado
)
echo.

echo [3/4] Instrucciones para IndexedDB:
echo    Abre http://localhost:5173/limpiar-db.html
echo    O presiona F12 -> Application -> IndexedDB -> Delete FunnelChatDB
echo.

echo [4/4] Para reiniciar:
echo    cd backend ^&^& python main.py
echo    cd frontend ^&^& npm run dev
echo.

echo ========================================
echo   ✅ LISTO! Escanea el nuevo QR
echo ========================================
pause