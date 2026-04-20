# 🧹 LIMPIEZA QR - FunnelChat

## 🚀 **OPCIÓN 1: Ejecutar Script Automático (Recomendado)**

```bash
cd funnel-chat-app/backend/whatsapp-bridge
python limpiar_qr.py
```

Este script:
- ✅ Detiene todos los procesos Python/Node
- ✅ Elimina `auth_info_baileys/`
- ✅ Abre Chrome a página de limpieza IndexedDB
- ✅ Muestra comandos para reiniciar

---

## 🔧 **OPCIÓN 2: Manual Paso a Paso**

### Paso 1: Detener servidores
- En las terminales: `Ctrl+C`
- O ejecuta:
```powershell
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

### Paso 2: Eliminar carpeta de sesiones
```powershell
cd "C:\Users\Wendy Llivichuzhca\Documents\GEOINFORMATICA\FUNNELCHAT_GEOINFORMATICA\funnel-chat-app\backend\whatsapp-bridge"
Remove-Item -Recurse -Force .\auth_info_baileys
```

### Paso 3: Limpiar IndexedDB
Abre Chrome → http://localhost:5173/limpiar-db.html
O manual: F12 → Application → IndexedDB → Delete `FunnelChatDB`

### Paso 4: Reiniciar
```bash
# Terminal 1 - Backend
cd funnel-chat-app/backend
python main.py

# Terminal 2 - Frontend
cd funnel-chat-app/frontend
npm run dev
```

### Paso 5: Escanear QR
- Abre http://localhost:5173
- Aparece QR nuevo
- Escanea con WhatsApp

---

## 📁 **Archivos Creados para Limpieza**

| Archivo | Propósito |
|---------|-----------|
| `limpiar_qr.py` | Script Python automático (recomendado) |
| `LIMPIAR_QR.bat` | Batch para Windows doble-click |
| `LIMPIAR_Y_REINICIAR.ps1` | PowerShell avanzado |
| `limpiar-db.html` | Página web para limpiar IndexedDB |
| `LIMPIAR_QR.md` | Este archivo |

---

## ⚠️ **Importante**

- MySQL **NO** se borra (los contactos/mensajes persistirán)
- Al reconectar, Baileys **descarga todo el historial de nuevo**
- La primera sincronización puede tardar 2-5 minutos dependiendo de tu historial

---

**¿Ejecuto el script automático ahora?** (solo necesitas confirmar)