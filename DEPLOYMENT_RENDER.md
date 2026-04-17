# Guía de Despliegue en Render

Esta guía te llevará paso a paso para desplegar tu proyecto FunnelChat en Render. Render soporta aplicaciones Python/FastAPI y Node.js, así como WebSockets.

## Prerrequisitos

1. Cuenta en Render (crear en https://render.com si no tienes)
2. GitHub connectado a Render
3. Git configurado localmente

## Paso 1: Preparar tu Repositorio

Tu repositorio ya está configurado con:
- ✅ `.gitignore` - Archivos a ignorar
- ✅ `.env.example` - Ejemplo de variables de entorno
- ✅ `render.yaml` - Configuración de Render
- ✅ `funnel-chat-app/frontend/src/config/api.js` - Configuración de URLs dinámicas

### Verificar que todo esté commiteado:
```bash
git status
```

Si hay cambios sin commitar, hacerlos:
```bash
git add -A
git commit -m "Cambios finales antes del deploy"
```

## Paso 2: Push a GitHub

Sube los cambios al repositorio main en GitHub:

```bash
git push origin main
```

> **Nota:** Asegúrate de estar en la rama `main`. Si estás en una rama de feature, haz un pull request primero.

## Paso 3: Crear Servicios en Render

### Opción A: Usando render.yaml (RECOMENDADO)

1. Ve a https://render.com/dashboard
2. Click en "New +"
3. Selecciona "Web Service"
4. Selecciona tu repositorio de GitHub
5. Autoriza a Render si no lo ha hecho
6. Render leerá automáticamente `render.yaml` y creará:
   - **Backend Service** (FastAPI en puerto 8000)
   - **Frontend Service** (React/Vite compilado)
   - **Database** (SQLite)

### Opción B: Manual (si no usas render.yaml)

#### Backend Service:

1. Click "New +" > "Web Service"
2. Conecta tu repositorio
3. **Name:** `funnelchat-backend`
4. **Environment:** Python 3.11
5. **Build Command:**
   ```
   cd funnel-chat-app/backend && pip install -r requirements.txt
   ```
6. **Start Command:**
   ```
   cd funnel-chat-app/backend && uvicorn main:sio_app --host 0.0.0.0 --port $PORT
   ```
7. **Environment Variables:**
   ```
   SECRET_KEY=<generate-a-random-key>
   DATABASE_URL=sqlite:///./devices.db
   DEBUG=false
   USE_MOCK_BRIDGE=false
   ```

#### Frontend Service:

1. Click "New +" > "Static Site"
2. Conecta el mismo repositorio
3. **Name:** `funnelchat-frontend`
4. **Build Command:**
   ```
   npm --prefix funnel-chat-app/frontend run build
   ```
5. **Publish Directory:** `funnel-chat-app/frontend/dist`
6. **Environment Variables:**
   - `VITE_API_URL` = URL del backend (ej: https://funnelchat-backend.onrender.com)
   - `VITE_SOCKET_URL` = URL del backend (mismo que arriba)

## Paso 4: Configurar Variables de Entorno

### Backend (.env variables):

```
SECRET_KEY=your-secret-key-change-this
DATABASE_URL=sqlite:///./devices.db
DEBUG=false
USE_MOCK_BRIDGE=false
FRONTEND_URL=https://funnelchat-frontend.onrender.com
```

### Frontend (Automáticas):

Si usas render.yaml, Render inyecta automáticamente:
- `VITE_API_URL` = URL del backend
- `VITE_SOCKET_URL` = URL del backend

Si lo haces manual, asigna en el dashboard de Render.

## Paso 5: Configurar el Domain (Opcional pero Recomendado)

### Para el Backend:
1. Ve a tu servicio backend en Render
2. Ve a "Settings"
3. En "Custom Domain", agrega tu dominio (ej: api.tudominio.com)
4. Sigue las instrucciones de DNS

### Para el Frontend:
1. Ve a tu sitio estático en Render
2. Ve a "Settings"
3. Render te da un dominio automático o agrega el tuyo

## Paso 6: Verificar el Despliegue

### Backend:
```
https://funnelchat-backend.onrender.com/docs
```
Deberías ver la documentación de FastAPI.

### Frontend:
```
https://funnelchat-frontend.onrender.com
```
Deberías ver tu aplicación React.

## Paso 7: Testing Post-Deploy

1. **Verificar conexión a base de datos:**
   - Abre la consola del backend en Render
   - Deberías ver los logs de inicio de Uvicorn

2. **Verificar WebSocket:**
   - Abre la consola del navegador en tu frontend
   - Deberías ver la conexión a Socket.io sin errores CORS

3. **Verificar API:**
   - En el navegador ve a `/docs` en el backend
   - Prueba un endpoint como GET `/api/contacts`

## Solución de Problemas

### Error: "Connection refused" en frontend

**Causa:** El VITE_API_URL no está configurado o es incorrecto.

**Solución:**
1. Verifica que `funnel-chat-app/frontend/src/config/api.js` está usando `import.meta.env.VITE_API_URL`
2. En Render, verifica que la variable `VITE_API_URL` apunta a tu backend

### Error: "CORS error"

**Causa:** El backend no acepta la URL del frontend.

**Solución:**
1. En `main.py` del backend, verifica que CORS está habilitado
2. Asegúrate que `FRONTEND_URL` coincide con tu URL de frontend

### Error: "Cannot connect to database"

**Causa:** El archivo `devices.db` no existe o no tiene permisos.

**Solución:**
1. SQLite creará el archivo automáticamente en el primer inicio
2. Si persiste, asegúrate que el directorio es escribible

### WebSocket no se conecta

**Causa:** Render puede estar bloqueando WebSockets.

**Solución:**
1. Verifica que estás usando `transports: ['websocket']` en Socket.io (ya está en el código)
2. En Render, asegúrate que no hay un proxy que bloquee WebSockets

## Configuración de Renovación Automática (CI/CD)

Render redespliega automáticamente cada vez que hagas push a la rama `main`:

1. Ve a tu servicio en Render
2. En "Settings" > "Auto-Deploy", asegúrate que está activado
3. Listo - cada push a main redespliega automáticamente

## Notas Importantes

- **Base de datos:** SQLite se almacena en la instancia de Render. Si Render reinicia la instancia, perderás los datos. Para datos persistentes en producción, migra a PostgreSQL.
- **WhatsApp Bridge:** La conectividad de WhatsApp depende de que la sesión se mantenga. Los reinicios de Render pueden requerir reconexión.
- **Logs:** Revisa los logs en el dashboard de Render para debugging

## Próximos Pasos

Después del deploy exitoso:

1. **Migrar a PostgreSQL** para base de datos persistente
2. **Configurar dominios personalizados** con HTTPS
3. **Configurar backups** de base de datos
4. **Monitorear logs y errores** regularmente

---

**¿Necesitas ayuda?** Contáctame para soporte en el deployment.
