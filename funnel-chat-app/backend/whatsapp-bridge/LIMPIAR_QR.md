# Instrucciones de Limpieza Completa - QR desde 0

## ✅ Ya eliminado:
- `auth_info_baileys/` - Sesiones de WhatsApp
- `sessions/` - (no existía)

## 📝 PASOS RESTANTES:

### 1. Detener servidores (si están corriendo)
En las terminales donde tengas:
- `python main.py` → Ctrl+C
- `npm run dev` → Ctrl+C

### 2. Limpiar IndexedDB del navegador

Abre Chrome/Edge y en la consola del navegador (F12):

```javascript
// Ir a Application → Storage → IndexedDB
// Eliminar la base de datos "FunnelChatDB"
// O ejecuta este código en la consola:
indexedDB.deleteDatabase('FunnelChatDB').then(() => {
    console.log('✅ IndexedDB limpiado');
    location.reload();
});
```

### 3. Reiniciar Backend
```bash
cd funnel-chat-app/backend
python main.py
```
Verás: `>>> WhatsApp Bridge iniciando...`

### 4. Reiniciar Frontend
```bash
cd funnel-chat-app/frontend
npm run dev
```

### 5. Escanear QR
- Abre http://localhost:5173
- Aparecerá **QR NUEVO**
- Escanea con tu WhatsApp

---

## 🎯 Resultado esperado:
- Lista de chats **vacia** (descarga completa desde 0)
- Contactos se descargan de nuevo
- Historial se obtiene progresivamente
- Todo como WhatsApp Web limpio

---

## ⚠️ Nota:
El historial en MySQL **NO se borra** (solo la caché local). Si quieres borrar también MySQL:
```bash
# En main.py hay una función para resetBD (pero mejor no la usemos)
# La app reconstruirá todo desde WhatsApp
```