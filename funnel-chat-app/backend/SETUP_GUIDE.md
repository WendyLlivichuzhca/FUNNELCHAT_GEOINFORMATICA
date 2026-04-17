# FunnelChat Backend - Guía de Configuración

## 🚀 Inicio Rápido (Windows)

Sigue estos pasos simples para ejecutar tu backend de FunnelChat:

### Opción 1: Método Automático (Recomendado) ⭐

Si prefieres que todo se haga automáticamente:

1. **Abre PowerShell o Símbolo del Sistema** en la carpeta `backend`
2. **Ejecuta**: `start.bat`

Esto hará automáticamente:
- ✓ Crear la base de datos
- ✓ Inicializar todas las tablas
- ✓ Iniciar el servidor

**¡Listo!** El servidor estará en: http://localhost:8000

---

### Opción 2: Método Paso a Paso

#### Paso 1: Inicializar la Base de Datos
Haz doble clic en `init_db.bat`

Verás algo como:
```
============================================================
  INICIALIZADOR DE BASE DE DATOS - FunnelChat
============================================================

Activando entorno virtual...
✓ Conexión exitosa a la base de datos
✓ Modelos importados correctamente
✓ Tablas creadas/verificadas exitosamente

✔️  Verificando tablas creadas...
  ✓ Tabla 'usuarios' existe
  ✓ Tabla 'dispositivos' existe
  ✓ Tabla 'contactos' existe
  ✓ Tabla 'mensajes' existe

✅ INICIALIZACIÓN COMPLETADA
```

#### Paso 2: Inicia el Servidor
Haz doble clic en `run_server.bat`

Verás:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

¡El servidor está corriendo! 🎉

---

## 📋 Requisitos Previos

- ✓ Windows 10 o superior
- ✓ Python 3.11+ (ya instalado en venv)
- ✓ Carpeta del proyecto intacta
- ✓ Archivo `.env` presente

---

## 🔧 Comandos Manuales (Línea de Comandos)

Si prefieres usar la terminal:

### Paso 1: Navega a la carpeta backend
```bash
cd C:\ruta\a\tu\funnel-chat-app\backend
```

### Paso 2: Activa el entorno virtual
```bash
venv\Scripts\activate
```

### Paso 3: Inicializa la base de datos
```bash
python init_db.py
```

### Paso 4: Inicia el servidor
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📊 Base de Datos

### Ubicación
- **Archivo**: `devices.db` (en la carpeta backend)
- **Tipo**: SQLite
- **Configuración**: `.env` → `DATABASE_URL=sqlite:///./devices.db`

### Tablas Creadas
| Tabla | Descripción |
|-------|------------|
| **usuarios** | Cuentas y autenticación de usuarios |
| **dispositivos** | Dispositivos WhatsApp conectados |
| **contactos** | Información de contactos |
| **mensajes** | Historial de mensajes |

---

## 🌐 Acceso a la API

Una vez que el servidor esté corriendo:

- **API URL**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

---

## 🆘 Solución de Problemas

### ❌ "No such table: usuarios"
**Solución**: La base de datos no fue inicializada
1. Ejecuta `init_db.bat` primero
2. Luego ejecuta `run_server.bat`

### ❌ "Puerto 8000 ya está en uso"
**Solución**: Usa otro puerto
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### ❌ Error al activar venv
**Solución**: Reinstala el entorno virtual
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ "ModuleNotFoundError"
**Solución**: Instala los requisitos
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ Archivo .env no encontrado
**Solución**: Crea un archivo `.env` en la carpeta backend con:
```
SECRET_KEY=super-secret-key-for-funnel-chat-prod
DATABASE_URL=sqlite:///./devices.db
PORT=8000
DEBUG=True
USE_MOCK_BRIDGE=false
```

---

## 🔄 Ciclo Completo de Trabajo

1. **Primera vez**:
   - Ejecuta `start.bat` (hace todo automáticamente)

2. **Subsecuentes**:
   - Ejecuta `run_server.bat` para iniciar
   - La BD ya estará lista

3. **Desarrollo**:
   - El servidor tiene recarga automática (`--reload`)
   - Guarda cambios en `main.py` y se recargan automáticamente

---

## 📝 Variables de Entorno (.env)

| Variable | Descripción | Valor por Defecto |
|----------|------------|------------------|
| `SECRET_KEY` | Clave secreta para JWT | fallback-secret-key |
| `DATABASE_URL` | Conexión a BD | sqlite:///./devices.db |
| `PORT` | Puerto del servidor | 8000 |
| `DEBUG` | Modo debug | True |
| `USE_MOCK_BRIDGE` | Usar WhatsApp simulado | false |

---

## 🎯 Próximos Pasos

1. ✅ Ejecuta `start.bat`
2. ✅ Accede a http://localhost:8000/docs
3. ✅ Integra con tu aplicación frontend
4. ✅ Realiza tus primeras pruebas de API

---

## 📞 Notas Adicionales

- El servidor se recarga automáticamente al cambiar código
- Los datos se guardan en `devices.db`
- Elimina `devices.db` para empezar con una BD nueva
- Los logs se muestran en la consola

---

**Última actualización**: Marzo 2026
**Versión**: 1.1
**Estado**: ✅ Producción
