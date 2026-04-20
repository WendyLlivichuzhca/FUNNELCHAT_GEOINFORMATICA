# Parche para error de bcrypt/passlib
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import socketio
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean, Text, DateTime, inspect, text as sql_text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import time
import os
import json
import base64
from dotenv import load_dotenv

# Evita errores de consola en Windows cuando el terminal no soporta UTF-8.
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Cargar variables de entorno de forma robusta
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

class RegisterRequest(BaseModel):
    nombre: str
    correo: str
    password: str

# Configuración de Base de Datos (SQLAlchemy) - MySQL via XAMPP
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/funnelchat")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Seguridad y JWT
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 semana

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, index=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    foto_perfil = Column(String(500), nullable=True)
    whatsapp_personal = Column(String(20), nullable=True)
    zona_horaria = Column(String(100), default='America/Guayaquil')
    rol = Column(String(20), default='admin')
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    ultimo_acceso = Column(DateTime, nullable=True)

class Device(Base):
    __tablename__ = "dispositivos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(String(100), unique=True, nullable=False)
    nombre = Column(String(150), default='Mi WhatsApp')
    numero_telefono = Column(String(20), nullable=True)
    estado = Column(String(20), default='desconectado')
    codigo_qr = Column(Text, nullable=True)
    conectado_en = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

# ============================================================
# MODELOS DE PERSISTENCIA: Contactos y Mensajes (tablas MySQL)
# ============================================================
class ContactDB(Base):
    __tablename__ = "contactos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    jid = Column(String(100), nullable=False, index=True)
    telefono = Column(String(30), nullable=False, default="")
    nombre = Column(String(150), nullable=True)
    push_name = Column(String(150), nullable=True)
    verified_name = Column(String(150), nullable=True)
    notify_name = Column(String(150), nullable=True)
    foto_perfil = Column(String(500), nullable=True)
    correo = Column(String(150), nullable=True)
    empresa = Column(String(150), nullable=True)
    estado_lead = Column(String(20), default='nuevo')
    mensajes_sin_leer = Column(Integer, default=0)
    ultimo_mensaje = Column(Text, nullable=True)
    participants_json = Column(Text, nullable=True)
    last_timestamp = Column(Integer, nullable=True)
    last_media_type = Column(String(20), nullable=True)
    ultima_vez_visto = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MessageDB(Base):
    __tablename__ = "mensajes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    mensaje_id = Column(String(100), nullable=False, default="")
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    chat_jid = Column(String(100), nullable=False, index=True)
    de_jid = Column(String(100), nullable=True)
    es_mio = Column(Boolean, default=False)
    es_grupo = Column(Boolean, default=False)
    texto = Column(Text, nullable=True)
    tipo = Column(String(20), default='texto')
    url_media = Column(String(500), nullable=True)
    mime_media = Column(String(100), nullable=True)
    nombre_archivo = Column(String(255), nullable=True)
    participant_jid = Column(String(100), nullable=True)
    push_name = Column(String(150), nullable=True)
    estado = Column(Integer, default=0)
    fecha_mensaje = Column(DateTime, nullable=False, default=datetime.utcnow)
    creado_en = Column(DateTime, default=datetime.utcnow)

# ============================================================
# MODELOS COMPLETOS SEGÚN ESQUEMA MySQL
# ============================================================

class ConfiguracionDB(Base):
    __tablename__ = "configuracion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nombre_negocio = Column(String(200), nullable=True)
    logo_url = Column(String(500), nullable=True)
    mensaje_bienvenida = Column(Text, nullable=True)
    mensaje_fuera_horario = Column(Text, nullable=True)
    idioma = Column(String(10), default='es')
    zona_horaria = Column(String(100), default='America/Guayaquil')
    notificaciones_email = Column(Boolean, default=True)
    notificaciones_push = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HorarioAtencion(Base):
    __tablename__ = "horarios_atencion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dia_semana = Column(String(20), nullable=False)
    hora_inicio = Column(String(8), nullable=False, default="08:00")
    hora_fin = Column(String(8), nullable=False, default="18:00")
    activo = Column(Boolean, default=True)

class Etiqueta(Base):
    __tablename__ = "etiquetas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    color = Column(String(20), default='#6366f1')
    creado_en = Column(DateTime, default=datetime.utcnow)

class RespuestaRapida(Base):
    __tablename__ = "respuestas_rapidas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    atajo = Column(String(50), nullable=False)
    contenido = Column(Text, nullable=False)
    tipo = Column(String(20), default='texto')
    creado_en = Column(DateTime, default=datetime.utcnow)

class AutomatizacionDB(Base):
    __tablename__ = "automatizaciones"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    tipo_disparador = Column(String(30), default='palabra_clave')
    palabra_clave = Column(String(255), nullable=True)
    activo = Column(Boolean, default=True)
    nodos = Column(Text, nullable=True)
    conexiones = Column(Text, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CampanaDB(Base):
    __tablename__ = "campanas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    url_media = Column(String(500), nullable=True)
    estado = Column(String(20), default='borrador')
    total_enviados = Column(Integer, default=0)
    total_fallidos = Column(Integer, default=0)
    programado_para = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

class EnvioMasivoDBModel(Base):
    __tablename__ = "envios_masivos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    url_media = Column(String(500), nullable=True)
    estado = Column(String(20), default='borrador')
    total_enviados = Column(Integer, default=0)
    total_fallidos = Column(Integer, default=0)
    total_pendientes = Column(Integer, default=0)
    programado_para = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

class NotificacionDB(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=True)
    tipo = Column(String(20), default='info')
    leido = Column(Boolean, default=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

class PlanDB(Base):
    __tablename__ = "planes"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio_mensual = Column(String(20), default='0.00')
    precio_anual = Column(String(20), default='0.00')
    max_dispositivos = Column(Integer, default=1)
    max_agentes = Column(Integer, default=1)
    max_contactos = Column(Integer, default=500)
    max_envios_masivos = Column(Integer, default=100)
    max_automatizaciones = Column(Integer, default=5)
    permite_ia = Column(Boolean, default=False)
    permite_whalink = Column(Boolean, default=False)
    permite_grupos = Column(Boolean, default=False)
    permite_campanas = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

class SuscripcionDB(Base):
    __tablename__ = "suscripciones"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes.id"), nullable=False)
    estado = Column(String(20), default='prueba')
    periodo = Column(String(20), default='mensual')
    fecha_inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_vencimiento = Column(DateTime, nullable=False, default=datetime.utcnow)
    renovacion_auto = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

class WhalinkDB(Base):
    __tablename__ = "whalinks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    mensaje_bienvenida = Column(Text, nullable=True)
    url_redireccion = Column(String(500), nullable=True)
    activo = Column(Boolean, default=True)
    total_clics = Column(Integer, default=0)
    creado_en = Column(DateTime, default=datetime.utcnow)

class RecordatorioDB(Base):
    __tablename__ = "recordatorios"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    contacto_id = Column(Integer, ForeignKey("contactos.id"), nullable=False)
    nota = Column(Text, nullable=False)
    completado = Column(Boolean, default=False)
    recordar_en = Column(DateTime, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

class AgenteIA(Base):
    __tablename__ = "agentes_ia"
    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    modelo = Column(String(100), default='gpt-4')
    instrucciones = Column(Text, nullable=True)
    personalidad = Column(Text, nullable=True)
    activo = Column(Boolean, default=False)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Crear todas las tablas en la base de datos (con checkfirst para evitar errores si ya existen)
try:
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas de base de datos creadas/verificadas correctamente")
except Exception as e:
    print(f"⚠ Advertencia al crear tablas: {e}")
    print("  Las tablas pueden ya existir, continuando...")

def ensure_runtime_columns():
    """
    Alinea columnas faltantes cuando la base ya existia.
    """
    expected_columns = {
        "contactos": {
            "push_name": "VARCHAR(150) NULL",
            "verified_name": "VARCHAR(150) NULL",
            "notify_name": "VARCHAR(150) NULL",
            "participants_json": "TEXT NULL",
            "last_timestamp": "INT NULL",
            "last_media_type": "VARCHAR(20) NULL",
        },
        "mensajes": {
            "participant_jid": "VARCHAR(100) NULL",
            "push_name": "VARCHAR(150) NULL",
        },
    }

    try:
        inspector = inspect(engine)
        with engine.begin() as conn:
            for table_name, columns in expected_columns.items():
                try:
                    existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
                except Exception:
                    continue

                for column_name, ddl in columns.items():
                    if column_name in existing_columns:
                        continue
                    conn.execute(sql_text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}"))
                    print(f">>> [DB] Columna agregada: {table_name}.{column_name}")
    except Exception as e:
        print(f">>> [DB] Advertencia al alinear columnas runtime: {e}")

ensure_runtime_columns()

# Utilidades de Seguridad
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependencia para obtener la sesión de DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_personal_device(db: Session, user_id: int):
    device = db.query(Device).filter(
        Device.usuario_id == user_id,
        Device.nombre == "WhatsApp Personal"
    ).first()

    if device:
        return device

    device = Device(
        usuario_id=user_id,
        dispositivo_id=f"device_{user_id}_personal_{int(time.time() * 1000)}",
        nombre="WhatsApp Personal",
        estado="desconectado"
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    print(f"[DEVICES] Dispositivo personal creado automaticamente para user_id={user_id}")
    return device

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        if correo is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.correo == correo).first()
    if user is None:
        raise credentials_exception
    return user

import subprocess
import os
from contextlib import asynccontextmanager

bridge_process = None  # Proceso legacy/idle que se conserva por compatibilidad.
bridge_processes = {}  # device_id -> subprocess.Popen

def bridge_runtime_paths(user_id: int, device_id: int):
    bridge_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whatsapp-bridge")
    sessions_dir = os.path.join(bridge_dir, "sessions", f"user_{user_id}", f"device_{device_id}")
    return bridge_dir, sessions_dir

def start_bridge_for_device(user_id: int, device_id: int):
    existing = bridge_processes.get(device_id)
    if existing and existing.poll() is None:
        return existing

    bridge_dir, auth_path = bridge_runtime_paths(user_id, device_id)
    use_mock = os.getenv("USE_MOCK_BRIDGE", "false").lower() == "true"
    script_name = "mock_bridge.js" if use_mock else "bridge.js"
    bridge_script = os.path.join(bridge_dir, script_name)
    os.makedirs(auth_path, exist_ok=True)

    env = os.environ.copy()
    env["WHATSAPP_USER_ID"] = str(user_id)
    env["WHATSAPP_DEVICE_ID"] = str(device_id)
    env["WHATSAPP_AUTH_PATH"] = auth_path
    env["AUTO_START_WHATSAPP"] = "true"

    print(f">>> [BRIDGE] Iniciando puente WhatsApp para user_id={user_id}, device_id={device_id}")
    process = subprocess.Popen(["node", bridge_script], cwd=bridge_dir, env=env)
    bridge_processes[device_id] = process
    return process

def stop_bridge_for_device(device_id: int):
    process = bridge_processes.pop(device_id, None)
    if not process or process.poll() is not None:
        return
    print(f">>> [BRIDGE] Deteniendo puente WhatsApp device_id={device_id}")
    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()

def stop_all_bridge_processes():
    for device_id in list(bridge_processes.keys()):
        stop_bridge_for_device(device_id)

def start_persisted_bridge_processes():
    db = SessionLocal()
    try:
        devices = db.query(Device).filter(Device.estado.in_(["conectado", "conectando"])).all()
        for device in devices:
            start_bridge_for_device(device.usuario_id, device.id)
    except Exception as e:
        print(f">>> [BRIDGE] No se pudieron restaurar puentes persistidos: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global bridge_process
    print("Iniciando el puente de WhatsApp (Node.js)...")
    bridge_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whatsapp-bridge")
    
    # Decidir qué script usar: real o simulación
    use_mock = os.getenv("USE_MOCK_BRIDGE", "false").lower() == "true"
    script_name = "mock_bridge.js" if use_mock else "bridge.js"
    bridge_script = os.path.join(bridge_dir, script_name)
    
    print(f"--- [MODO: {'SIMULACIÓN' if use_mock else 'REAL'}] ---")
    print(f"Lanzando: {script_name}")
    
    try:
        bridge_process = subprocess.Popen(
            ["node", bridge_script],
            cwd=bridge_dir
        )
        print(f"Puente de WhatsApp ({script_name}) iniciado automáticamente.")
    except Exception as e:
        print(f"Error al iniciar el puente de WhatsApp: {e}")

    # Restaurar datos persistidos de sesiones anteriores
    print(">>> [DB] Cargando datos persistidos de MySQL (XAMPP)...")
    db_load_all()
    print(">>> [BRIDGE] Los puentes WhatsApp por usuario/dispositivo se restauran bajo demanda.")
    if os.getenv("AUTO_RESTORE_WHATSAPP_BRIDGES", "true").lower() == "true":
        start_persisted_bridge_processes()

    yield
    
    if bridge_process:
        print("Deteniendo el puente de WhatsApp...")
        bridge_process.terminate()
        try:
            bridge_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            bridge_process.kill()
        print("Puente de WhatsApp detenido.")
    stop_all_bridge_processes()

# Inicialización de FastAPI
app = FastAPI(title="Funnel Chat API", lifespan=lifespan)

# Servir archivos multimedia
media_storage_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whatsapp-bridge", "media")
if not os.path.exists(media_storage_path):
    os.makedirs(media_storage_path)
app.mount("/media", StaticFiles(directory=media_storage_path), name="media")

# Manejador global de excepciones para debugging
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    error_str = traceback.format_exc()
    print(f"\n=== ERROR 500 ===\n{error_str}\n================\n")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_str[-1000:]}
    )

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Socket.io
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.get("/")
async def root():
    return {"message": "Funnel Chat API is running", "status": "online"}

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    contacts = contacts_mock_db.get(user_id, [])
    if not contacts:
        contacts = hydrate_user_contacts_from_db(user_id)

    total_contacts = len([c for c in contacts if c.get("whatsapp_id")])
    conversations_count = len([
        c for c in contacts
        if c.get("whatsapp_id") and (c.get("last_message") or c.get("timestamp"))
    ])
    campaigns_count = db.query(CampanaDB).filter(CampanaDB.usuario_id == user_id).count()
    automations_count = db.query(AutomatizacionDB).filter(AutomatizacionDB.usuario_id == user_id).count()
    return {
        "leads": total_contacts,
        "conversations": conversations_count,
        "conversion_rate": "0%" if total_contacts == 0 else f"{round((conversations_count / total_contacts) * 100, 1)}%",
        "automations": automations_count,
        "campaigns": campaigns_count,
    }

# ============================================================
# PERSISTENCIA: helpers de base de datos
# ============================================================

def normalize_timestamp(value):
    if value is None:
        return 0
    try:
        return int(value)
    except Exception:
        return 0

def parse_participants(raw_value):
    if isinstance(raw_value, list):
        return raw_value
    if not raw_value:
        return []
    try:
        data = json.loads(raw_value)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def normalize_phone_value(value):
    raw = str(value or "").split("@")[0].split(":")[0].strip()
    return raw[1:] if raw.startswith("+") else raw

def is_group_identifier(value):
    return str(value or "").endswith("@g.us")

def merge_chat_history_keys(old_jid: str, new_jid: str):
    if not old_jid or not new_jid or old_jid == new_jid:
        return
    old_history = chat_histories.pop(old_jid, [])
    if not old_history:
        return
    merged = {}
    for item in chat_histories.get(new_jid, []) + old_history:
        item_id = item.get("id") or f"{item.get('timestamp', 0)}-{item.get('text', '')}"
        merged[item_id] = item
    chat_histories[new_jid] = sorted(
        merged.values(),
        key=lambda item: normalize_timestamp(item.get("timestamp"))
    )

def contact_matches_identity(contact: dict, jid: str, phone: str = None) -> bool:
    if contact.get("whatsapp_id") == jid:
        return True
    if not phone or contact.get("is_group") or is_group_identifier(jid):
        return False
    return normalize_phone_value(contact.get("phone")) == normalize_phone_value(phone)

def safe_int(value):
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None

def get_whatsapp_event_device_id(data: dict = None):
    if data:
        device_id = safe_int(data.get("device_id"))
        if device_id:
            return device_id
    return active_qr_device_id

def get_whatsapp_event_user_ids(data: dict = None):
    if data:
        user_id = safe_int(data.get("user_id"))
        if user_id:
            return [user_id]
        device_id = safe_int(data.get("device_id"))
        if device_id and device_id in connected_whatsapp_sessions:
            return [connected_whatsapp_sessions[device_id]]
        if device_id and device_id in qr_sessions:
            return [qr_sessions[device_id]]
    if connected_whatsapp_user_id:
        return [connected_whatsapp_user_id]
    if active_qr_user_id:
        return [active_qr_user_id]
    if len(set(connected_whatsapp_sessions.values())) == 1:
        return list(set(connected_whatsapp_sessions.values()))
    return []

def get_user_contacts_from_cache_or_db(user_id: int):
    contacts = contacts_mock_db.get(user_id, [])
    if not contacts:
        contacts = hydrate_user_contacts_from_db(user_id)
    return contacts or []

def find_user_contact(user_id: int, contact_id_or_jid):
    value = str(contact_id_or_jid)
    contacts = get_user_contacts_from_cache_or_db(user_id)
    contact = next((c for c in contacts if str(c.get("id")) == value), None)
    if not contact and "@" in value:
        contact = next((c for c in contacts if str(c.get("whatsapp_id")) == value), None)
    return contact

def require_user_contact(user_id: int, contact_id_or_jid, group_only: bool = False):
    contact = find_user_contact(user_id, contact_id_or_jid)
    if not contact:
        raise HTTPException(status_code=404, detail="Chat no encontrado para este usuario")
    if group_only and "@g.us" not in str(contact.get("whatsapp_id", "")):
        raise HTTPException(status_code=400, detail="El chat no es un grupo de este usuario")
    return contact

def ensure_active_whatsapp_belongs_to_user(user_id: int, device_id: int = None):
    if device_id and connected_whatsapp_sessions.get(device_id) == user_id:
        return
    if user_id in connected_whatsapp_sessions.values() or active_qr_user_id == user_id:
        return
    owner_ids = get_whatsapp_event_user_ids({"device_id": device_id} if device_id else None)
    if not owner_ids:
        raise HTTPException(status_code=409, detail="No hay una sesion de WhatsApp activa para sincronizar")
    if user_id not in owner_ids:
        raise HTTPException(status_code=403, detail="La sesion de WhatsApp activa pertenece a otro usuario")

def get_active_device_id_for_user(user_id: int):
    for device_id, owner_id in connected_whatsapp_sessions.items():
        if owner_id == user_id:
            return device_id
    if active_qr_user_id == user_id and active_qr_device_id:
        return active_qr_device_id
    db = SessionLocal()
    try:
        device = db.query(Device).filter(
            Device.usuario_id == user_id,
            Device.estado.in_(["conectado", "conectando"])
        ).order_by(Device.conectado_en.desc()).first()
        return device.id if device else None
    finally:
        db.close()

def get_chat_history_for_user(user_id: int, jid: str):
    return [
        msg for msg in chat_histories.get(jid, [])
        if msg.get("owner_user_id") in (None, user_id)
    ]

def db_upsert_contact(user_id: int, contact: dict, device_id: int = None):
    """Guarda o actualiza un contacto en la tabla 'contactos' de MySQL."""
    db = SessionLocal()
    try:
        wid = contact.get("whatsapp_id")
        if not wid:
            return
        # Buscar el dispositivo exacto cuando el evento viene de una sesion Baileys concreta.
        if not device_id:
            device_id = contact.get("device_id")
        device = None
        if device_id:
            device = db.query(Device).filter(Device.id == device_id, Device.usuario_id == user_id).first()
        if not device:
            device = db.query(Device).filter(Device.usuario_id == user_id).first()
        if not device:
            return
        phone = contact.get("phone") or wid.split("@")[0]
        resolved_name = resolve_contact_name(contact, phone)
        participants_json = json.dumps(contact.get("participants", []), ensure_ascii=False)
        last_timestamp = normalize_timestamp(contact.get("timestamp"))
        last_seen = datetime.fromtimestamp(last_timestamp) if last_timestamp else None
        last_message = contact.get("last_message") or get_message_preview(contact)
        unread_count = contact.get("unread_count", 0)
        row = db.query(ContactDB).filter(
            ContactDB.dispositivo_id == device.id,
            ContactDB.jid == wid
        ).first()
        if not row and phone and not is_group_identifier(wid):
            row = db.query(ContactDB).filter(
                ContactDB.dispositivo_id == device.id,
                ContactDB.telefono == phone
            ).first()
        if row:
            row.jid = wid
            row.nombre = resolved_name or row.nombre
            row.push_name = contact.get("pushName") or row.push_name
            row.verified_name = contact.get("verifiedName") or row.verified_name
            row.notify_name = contact.get("notify") or row.notify_name
            row.foto_perfil = contact.get("photo_url") or row.foto_perfil
            row.telefono = phone or row.telefono or ""
            row.ultimo_mensaje = last_message or row.ultimo_mensaje
            row.mensajes_sin_leer = unread_count if unread_count is not None else (row.mensajes_sin_leer or 0)
            row.participants_json = participants_json or row.participants_json
            row.last_timestamp = last_timestamp or row.last_timestamp
            row.last_media_type = contact.get("mediaType") or row.last_media_type
            row.ultima_vez_visto = last_seen or row.ultima_vez_visto
        else:
            row = ContactDB(
                dispositivo_id=device.id,
                jid=wid,
                telefono=phone or "",
                nombre=resolved_name,
                push_name=contact.get("pushName"),
                verified_name=contact.get("verifiedName"),
                notify_name=contact.get("notify"),
                foto_perfil=contact.get("photo_url"),
                ultimo_mensaje=last_message,
                mensajes_sin_leer=unread_count or 0,
                participants_json=participants_json,
                last_timestamp=last_timestamp or None,
                last_media_type=contact.get("mediaType"),
                ultima_vez_visto=last_seen,
                estado_lead='nuevo'
            )
            db.add(row)
        db.commit()
    except Exception as e:
        print(f">>> [DB] Error al guardar contacto {wid}: {e}")
        db.rollback()
    finally:
        db.close()

def db_save_message(jid: str, user_id_val: int, message: dict, device_id: int = None):
    """Guarda un mensaje en la tabla 'mensajes' de MySQL."""
    db = SessionLocal()
    try:
        # Buscar el dispositivo del usuario
        device = None
        if device_id and user_id_val:
            device = db.query(Device).filter(Device.id == device_id, Device.usuario_id == user_id_val).first()
        if user_id_val:
            device = device or db.query(Device).filter(Device.usuario_id == user_id_val).first()
        if not device:
            device = db.query(Device).filter(Device.estado == "conectado").first()
        if not device:
            return

        ts = message.get("timestamp")
        fecha = datetime.fromtimestamp(ts) if ts else datetime.utcnow()

        from_me = message.get("sender") in ("bot", "me") or message.get("fromMe", False)

        # Mapear tipo de media al enum de MySQL
        tipo_map = {
            "image": "imagen", "imagen": "imagen",
            "video": "video",
            "audio": "audio",
            "document": "documento", "documento": "documento",
            "sticker": "sticker"
        }
        raw_tipo = message.get("mediaType") or "texto"
        tipo = tipo_map.get(raw_tipo, "texto")

        # Verificar que no exista ya ese mensaje_id para ese dispositivo
        msg_id = str(message.get("id", ""))
        if msg_id:
            existing = db.query(MessageDB).filter(
                MessageDB.dispositivo_id == device.id,
                MessageDB.mensaje_id == msg_id
            ).first()
            if existing:
                return

        row = MessageDB(
            mensaje_id=msg_id,
            dispositivo_id=device.id,
            chat_jid=jid,
            de_jid=message.get("participant") if message.get("participant") else (None if from_me else jid),
            es_mio=from_me,
            es_grupo="@g.us" in jid,
            texto=message.get("text"),
            tipo=tipo,
            url_media=message.get("mediaPath"),
            nombre_archivo=message.get("fileName"),
            participant_jid=message.get("participant"),
            push_name=message.get("pushName"),
            estado=message.get("status", 0),
            fecha_mensaje=fecha
        )
        db.add(row)
        db.commit()
    except Exception as e:
        print(f">>> [DB] Error al guardar mensaje para {jid}: {e}")
        db.rollback()
    finally:
        db.close()

def db_load_all():
    """Carga contactos y mensajes desde MySQL al arrancar."""
    db = SessionLocal()
    try:
        # Cargar mapa de dispositivos -> usuario
        device_user_map = {}
        for dev in db.query(Device).all():
            device_user_map[dev.id] = dev.usuario_id

        contact_rows = db.query(ContactDB).all()
        count_c = 0
        for row in contact_rows:
            try:
                uid = device_user_map.get(row.dispositivo_id)
                if uid is None:
                    continue
                if uid not in contacts_mock_db:
                    contacts_mock_db[uid] = []
                existing = next(
                    (c for c in contacts_mock_db[uid] if c.get("whatsapp_id") == row.jid),
                    None
                )
                if not existing:
                    restored_timestamp = (
                        normalize_timestamp(row.last_timestamp) or
                        (int(row.ultima_vez_visto.timestamp()) if row.ultima_vez_visto else 0)
                    )
                    contact = {
                        "id": row.id,
                        "device_id": row.dispositivo_id,
                        "whatsapp_id": row.jid,
                        "name": resolve_contact_name({
                            "name": row.nombre,
                            "pushName": row.push_name,
                            "verifiedName": row.verified_name,
                            "notify": row.notify_name,
                            "phone": row.telefono,
                            "whatsapp_id": row.jid,
                        }, row.telefono or ""),
                        "pushName": row.push_name or "",
                        "verifiedName": row.verified_name or "",
                        "notify": row.notify_name or "",
                        "phone": row.telefono or "",
                        "photo_url": row.foto_perfil,
                        "last_message": row.ultimo_mensaje or "",
                        "unread_count": row.mensajes_sin_leer or 0,
                        "is_group": "@g.us" in (row.jid or ""),
                        "timestamp": restored_timestamp,
                        "participants": parse_participants(row.participants_json),
                        "mediaType": row.last_media_type,
                        "notes": "",
                        "tag": "WhatsApp",
                        "status": row.estado_lead or "nuevo",
                    }
                    contacts_mock_db[uid].append(contact)
                else:
                    existing.update({
                        "name": resolve_contact_name({
                            "name": row.nombre,
                            "pushName": row.push_name or existing.get("pushName"),
                            "verifiedName": row.verified_name or existing.get("verifiedName"),
                            "notify": row.notify_name or existing.get("notify"),
                            "phone": row.telefono or existing.get("phone"),
                            "whatsapp_id": row.jid,
                        }, row.telefono or existing.get("phone") or ""),
                        "pushName": row.push_name or existing.get("pushName", ""),
                        "verifiedName": row.verified_name or existing.get("verifiedName", ""),
                        "notify": row.notify_name or existing.get("notify", ""),
                        "phone": row.telefono or existing.get("phone", ""),
                        "photo_url": row.foto_perfil or existing.get("photo_url"),
                        "last_message": row.ultimo_mensaje or existing.get("last_message", ""),
                        "unread_count": row.mensajes_sin_leer if row.mensajes_sin_leer is not None else existing.get("unread_count", 0),
                        "is_group": "@g.us" in (row.jid or ""),
                        "timestamp": normalize_timestamp(row.last_timestamp) or existing.get("timestamp", 0),
                        "participants": parse_participants(row.participants_json) or existing.get("participants", []),
                        "mediaType": row.last_media_type or existing.get("mediaType"),
                        "status": row.estado_lead or existing.get("status", "nuevo"),
                    })
                count_c += 1
            except Exception:
                pass

        msg_rows = db.query(MessageDB).order_by(MessageDB.id).all()
        count_m = 0
        for row in msg_rows:
            try:
                jid = row.chat_jid
                if jid not in chat_histories:
                    chat_histories[jid] = []
                owner_user_id = device_user_map.get(row.dispositivo_id)
                # Evitar duplicados por mensaje_id dentro del mismo usuario/dispositivo.
                existing_ids = {
                    (m.get("id"), m.get("owner_user_id"))
                    for m in chat_histories[jid]
                }
                msg = {
                    "id": row.mensaje_id or str(row.id),
                    "text": row.texto,
                    "sender": "bot" if row.es_mio else "user",
                    "timestamp": int(row.fecha_mensaje.timestamp()) if row.fecha_mensaje else 0,
                    "mediaType": None if row.tipo == "texto" else row.tipo,
                    "mediaPath": row.url_media,
                    "fileName": row.nombre_archivo,
                    "participant": row.participant_jid,
                    "pushName": row.push_name,
                    "status": row.estado,
                    "device_id": row.dispositivo_id,
                    "owner_user_id": owner_user_id,
                }
                if (msg["id"], msg["owner_user_id"]) not in existing_ids:
                    chat_histories[jid].append(msg)
                    count_m += 1
            except Exception:
                pass

        for uid, contacts_list in contacts_mock_db.items():
            for contact in contacts_list:
                jid = contact.get("whatsapp_id")
                history = get_chat_history_for_user(uid, jid)
                if not history:
                    continue
                last_msg = history[-1]
                msg_timestamp = normalize_timestamp(last_msg.get("timestamp"))
                if msg_timestamp:
                    contact["timestamp"] = msg_timestamp
                preview = get_message_preview(last_msg)
                if preview:
                    contact["last_message"] = preview
                if last_msg.get("mediaType"):
                    contact["mediaType"] = last_msg.get("mediaType")

        print(f">>> [DB] ✅ Restaurados {count_c} contactos y {count_m} mensajes desde MySQL.")
    except Exception as e:
        print(f">>> [DB] Error al restaurar datos: {e}")
    finally:
        db.close()

def hydrate_user_contacts_from_db(user_id: int):
    """Recarga contactos de un usuario desde MySQL si la memoria estÃ¡ vacÃ­a o incompleta."""
    db = SessionLocal()
    try:
        device_ids = [
            dev.id
            for dev in db.query(Device).filter(Device.usuario_id == user_id).all()
        ]
        if not device_ids:
            return contacts_mock_db.get(user_id, [])

        if user_id not in contacts_mock_db:
            contacts_mock_db[user_id] = []

        contacts_list = contacts_mock_db[user_id]
        contacts_map = {
            c.get("whatsapp_id"): c
            for c in contacts_list
            if c.get("whatsapp_id")
        }

        rows = db.query(ContactDB).filter(ContactDB.dispositivo_id.in_(device_ids)).all()
        for row in rows:
            # FILTRO: Solo contactos con JID válido de WhatsApp (contiene @)
            if not row.jid or '@' not in str(row.jid):
                continue
                
            existing = contacts_map.get(row.jid)
            restored_timestamp = (
                normalize_timestamp(row.last_timestamp) or
                (int(row.ultima_vez_visto.timestamp()) if row.ultima_vez_visto else 0)
            )
            payload = {
                "id": row.id,
                "device_id": row.dispositivo_id,
                "whatsapp_id": row.jid,
                "name": resolve_contact_name({
                    "name": row.nombre,
                    "pushName": row.push_name,
                    "verifiedName": row.verified_name,
                    "notify": row.notify_name,
                    "phone": row.telefono,
                    "whatsapp_id": row.jid,
                }, row.telefono or ""),
                "pushName": row.push_name or "",
                "verifiedName": row.verified_name or "",
                "notify": row.notify_name or "",
                "phone": row.telefono or "",
                "photo_url": row.foto_perfil,
                "last_message": row.ultimo_mensaje or "",
                "unread_count": row.mensajes_sin_leer or 0,
                "is_group": "@g.us" in (row.jid or ""),
                "is_user": True,  # Si tiene JID válido, es usuario de WhatsApp
                "timestamp": restored_timestamp,
                "participants": parse_participants(row.participants_json),
                "mediaType": row.last_media_type,
                "notes": existing.get("notes", "") if existing else "",
                "tag": existing.get("tag", "WhatsApp") if existing else "WhatsApp",
                "status": row.estado_lead or (existing.get("status") if existing else "nuevo") or "nuevo",
            }

            history = get_chat_history_for_user(user_id, row.jid)
            if history:
                last_msg = history[-1]
                payload["timestamp"] = normalize_timestamp(last_msg.get("timestamp")) or payload["timestamp"]
                payload["last_message"] = get_message_preview(last_msg) or payload["last_message"]
                payload["mediaType"] = last_msg.get("mediaType") or payload["mediaType"]

            if existing:
                existing.update({
                    key: value
                    for key, value in payload.items()
                    if value not in (None, "")
                })
            else:
                contacts_list.append(payload)
                contacts_map[row.jid] = payload

        return contacts_list
    except Exception as e:
        print(f">>> [DB] Error al rehidratar contactos para user_id={user_id}: {e}")
        return contacts_mock_db.get(user_id, [])
    finally:
        db.close()

# ============================================================
# ALMACENAMIENTO EN MEMORIA
# ============================================================
contacts_mock_db = {}  # user_id -> list of contacts
qr_sessions = {}  # device_id -> user_id
active_qr_user_id = None
active_qr_device_id = None
connected_whatsapp_user_id = None
connected_whatsapp_sessions = {}  # device_id -> user_id

# ============================================================
# HELPER: Resolver nombre de contacto con prioridad correcta
# ============================================================
def resolve_contact_name(contact_data: dict, fallback_phone: str = None) -> str:
    """
    Prioridad parecida a WhatsApp Web: name > verifiedName > pushName > notify > phone > jid_numero
    """
    normalized_fallback = normalize_phone_value(fallback_phone)
    for candidate in [
        contact_data.get("name"),
        contact_data.get("verifiedName"),
        contact_data.get("pushName"),
        contact_data.get("notify"),
    ]:
        candidate_str = str(candidate or "").strip()
        if not candidate_str:
            continue
        if normalized_fallback and normalize_phone_value(candidate_str) == normalized_fallback:
            continue
        return candidate_str
    return (
        fallback_phone or
        contact_data.get("phone") or
        (contact_data.get("whatsapp_id", "").split("@")[0] if contact_data.get("whatsapp_id") else None) or
        "Desconocido"
    )

# ============================================================
# HELPER: Preview de mensaje según tipo
# ============================================================
def get_message_preview(msg_data: dict) -> str:
    text = msg_data.get("text") or msg_data.get("lastMessage") or ""
    if text:
        return text[:80]
    media_type = msg_data.get("mediaType") or msg_data.get("type") or ""
    previews = {
        "image": "📷 Imagen",
        "video": "🎥 Video", 
        "audio": "🎵 Audio",
        "document": f"📄 {msg_data.get('fileName', 'Documento')}",
        "sticker": "🎭 Sticker",
        "location": "📍 Ubicación compartida",
        "contact": "👤 Contacto compartido",
        "reaction": "✨ Reacción",
        "deleted": "🚫 Mensaje eliminado",
    }
    return previews.get(media_type, "💬 Mensaje")

async def request_bridge_history_refresh(wid: str, local_history: list, mode: str = "latest", count: int = 60, user_id: int = None, device_id: int = None):
    payload = {
        "contact_id": wid,
        "whatsapp_id": wid,
        "known_count": len(local_history),
        "oldest_id": local_history[0].get("id") if local_history else None,
        "mode": mode,
        "count": count,
    }
    if user_id:
        payload["user_id"] = user_id
    if device_id:
        payload["device_id"] = device_id
    await sio.emit('request_chat_history', payload)

# ============================================================
# AUTH ENDPOINTS
# ============================================================
@app.post("/token")
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # form_data.username se trata como correo electrónico
    print(f"\n[AUTH] Intentando login para correo: {form_data.username}")
    user = db.query(User).filter(User.correo == form_data.username).first()
    if not user or not verify_password(form_data.password, user.contrasena_hash):
        print(f"[AUTH] ❌ Credenciales inválidas para: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"[AUTH] ✅ Login exitoso: {form_data.username} ({user.nombre})")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.correo}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "nombre": user.nombre}

@app.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    print(f"\n[AUTH] Intentando registro: {data.correo} ({data.nombre})")
    existing_user = db.query(User).filter(User.correo == data.correo).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado")

    hashed_password = get_password_hash(data.password)
    new_user = User(
        nombre=data.nombre,
        correo=data.correo,
        contrasena_hash=hashed_password,
        rol='admin',
        activo=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Crear dispositivos por defecto con dispositivo_id único
    d1 = Device(
        usuario_id=new_user.id,
        dispositivo_id=f"device_{new_user.id}_personal",
        nombre="WhatsApp Personal",
        estado="desconectado"
    )
    d2 = Device(
        usuario_id=new_user.id,
        dispositivo_id=f"device_{new_user.id}_empresa",
        nombre="WhatsApp Empresa",
        estado="desconectado"
    )
    db.add_all([d1, d2])
    db.commit()
    print(f"[AUTH] ✅ Usuario registrado exitosamente: {data.correo}")

    return {"status": "success", "message": "Usuario creado", "user_id": new_user.id}

# ============================================================
# CONTACTS ENDPOINT (directorio CRM)
# ============================================================
@app.get("/api/contacts")
async def get_contacts(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if user_id not in contacts_mock_db or not contacts_mock_db.get(user_id):
        hydrate_user_contacts_from_db(user_id)
    if user_id not in contacts_mock_db:
        contacts_mock_db[user_id] = [
            {"id": 1, "name": "Agrega tus contactos vinculando WhatsApp", "email": "", "status": "Info", "tag": "Sistema", "notes": "Escanea el QR en Dashboard para importar tus contactos reales."}
        ]
    
    # FILTRO: Solo devolver contactos con JID válido de WhatsApp (contiene @)
    filtered_contacts = [
        c for c in contacts_mock_db[user_id]
        if c.get("whatsapp_id") and '@' in str(c.get("whatsapp_id", ""))
    ]
    
    total_original = len(contacts_mock_db[user_id])
    print(f">>> [API/CONTACTS] Devolviendo {len(filtered_contacts)} contactos (de {total_original} total, filtrados por JID) para user_id={user_id}")
    return filtered_contacts

@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: int, data: dict, current_user: User = Depends(get_current_user)):
    contact = find_user_contact(current_user.id, contact_id)
    if contact:
        contact.update(data)
        db_upsert_contact(current_user.id, contact)
        return {"status": "success", "message": "Contacto actualizado"}
    return {"status": "error", "message": "Contacto no encontrado"}

# ============================================================
# *** NUEVO *** CHATS ENDPOINT (lista de conversaciones)
# ============================================================
@app.get("/api/chats")
async def get_chats(current_user: User = Depends(get_current_user)):
    """
    Devuelve la lista de chats ordenada por más reciente.
    - Nombre resuelto con prioridad: pushName > name > phone > jid
    - Preview del último mensaje real (texto o tipo de media)
    - Timestamp correcto para ordenación
    - Solo devuelve chats con actividad (tienen timestamp o last_message)
    """
    user_id = current_user.id
    contacts = contacts_mock_db.get(user_id, [])
    if not contacts:
        contacts = hydrate_user_contacts_from_db(user_id)
    
    total_with_jid = 0
    total_with_history = 0
    
    chats = []
    for c in contacts:
        jid = c.get("whatsapp_id")
        # FILTRO 1: Solo contactos con JID válido de WhatsApp (contiene @)
        if not jid or '@' not in str(jid):
            continue
        total_with_jid += 1

        # Obtener historial COMPLETO para verificar si hay mensajes
        history = get_chat_history_for_user(user_id, jid)
        
        # FILTRO 2: Solo incluir si hay historial REAL de mensajes
        # Esto asegura que solo aparezcan contactos con los que has hablado
        if not history or len(history) == 0:
            continue
        total_with_history += 1
        
        # Tomar el último mensaje del historial real (más confiable)
        last_msg = history[-1]
        last_message = get_message_preview(last_msg)
        timestamp = last_msg.get("timestamp", 0) or c.get("timestamp", 0)

        # Nombre con prioridad correcta
        name = resolve_contact_name(c, c.get("phone"))

        chats.append({
            "id": c.get("id"),
            "whatsapp_id": jid,
            "name": name,
            "pushName": c.get("pushName", ""),
            "phone": c.get("phone", ""),
            "photo": c.get("photo_url", ""),
            "last_message": last_message,
            "timestamp": timestamp,
            "unread_count": c.get("unread_count", 0),
            "is_group": c.get("is_group", False),
            "isOnline": c.get("isOnline", False),
            "lastSeen": c.get("lastSeen", None),
            "mediaType": c.get("mediaType", None),
            "notes": c.get("notes", ""),
            "participants": c.get("participants", []),
        })
    
    # Ordenar por timestamp descendente (más reciente primero)
    chats.sort(key=lambda x: x.get("timestamp") or 0, reverse=True)
    
    print(f">>> [API/CHATS] Con JID WhatsApp: {total_with_jid}, Con historial: {total_with_history}, Devueltos: {len(chats)}")
    return chats

# ============================================================
# CAMPAIGNS
# ============================================================
campaigns_db = [
    {
        "id": 1, 
        "name": "Bienvenida Primavera", 
        "message": "¡Hola! Tenemos nuevas ofertas para ti.", 
        "segment": "Todos", 
        "sent_count": 1284, 
        "date": "2024-03-01",
        "status": "Completada"
    }
]

@app.get("/api/campaigns")
async def get_campaigns():
    return campaigns_db

@app.post("/api/campaigns")
async def create_campaign(data: dict):
    global campaigns_db
    new_id = len(campaigns_db) + 1
    new_campaign = {
        "id": new_id,
        "name": data.get("name", "Campaña sin nombre"),
        "message": data.get("message", ""),
        "segment": data.get("segment", "Todos"),
        "sent_count": data.get("sent_count", 0),
        "date": "2024-03-04",
        "status": "Enviando..."
    }
    campaigns_db.insert(0, new_campaign)
    return {"status": "success", "campaign": new_campaign}

# ============================================================
# FLOWS
# ============================================================
current_flows = {
    "nodes": [
        {"id": "1", "type": "message", "position": {"x": 250, "y": 0}, "data": {"label": "Entrada: Palabra clave \"Hola\""}},
        {"id": "2", "type": "condition", "position": {"x": 240, "y": 120}, "data": {"label": "¿Es cliente registrado?"}},
        {"id": "3", "type": "message", "position": {"x": 50, "y": 280}, "data": {"label": "Enviar: ¡Bienvenido de nuevo! 👋"}},
        {"id": "4", "type": "message", "position": {"x": 400, "y": 280}, "data": {"label": "Enviar: ¡Hola! Cuéntanos tu nombre."}}
    ],
    "edges": [
        {"id": "e1-2", "source": "1", "target": "2", "animated": True, "style": {"stroke": "var(--primary)", "strokeWidth": 2}},
        {"id": "e2-3", "source": "2", "sourceHandle": "yes", "target": "3", "animated": True, "style": {"stroke": "#10b981", "strokeWidth": 2}},
        {"id": "e2-4", "source": "2", "sourceHandle": "no", "target": "4", "animated": True, "style": {"stroke": "#ef4444", "strokeWidth": 2}}
    ]
}

@app.get("/api/flows")
async def get_flows():
    return current_flows

@app.post("/api/flows")
async def save_flows(data: dict):
    global current_flows
    current_flows = data
    return {"status": "success", "message": "Flujo guardado correctamente"}

@app.post("/api/flows/test")
async def test_flow(data: dict):
    message = data.get("message", "")
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    current_id = data.get("current_node_id")
    
    def find_next(cid, msg):
        out_edges = [e for e in edges if e["source"] == cid]
        if not cid:
            for n in nodes:
                if msg.lower() in n.get("data", {}).get("label", "").lower(): return n
            return nodes[0] if nodes else None
        
        if not out_edges: return None
        
        curr_n = next((n for n in nodes if n["id"] == cid), None)
        if curr_n and curr_n["type"] == "condition":
            is_pos = any(w in msg.lower() for w in ["si", "yes", "ok", "claro", "quiero", "acepto"])
            target = "yes" if is_pos else "no"
            edge = next((e for e in out_edges if e.get("sourceHandle") == target), out_edges[0])
            return next((n for n in nodes if n["id"] == edge["target"]), None)
        
        return next((n for n in nodes if n["id"] == out_edges[0]["target"]), None)

    next_node = find_next(current_id, message)
    if next_node:
        return {"response": next_node["data"]["label"], "node_id": next_node["id"]}
    return {"response": "Fin del flujo de prueba.", "node_id": None}

# ============================================================
# DEVICES
# ============================================================
@app.get("/api/devices")
async def get_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(Device).filter(Device.usuario_id == current_user.id).all()
    if not devices:
        get_or_create_personal_device(db, current_user.id)
        devices = db.query(Device).filter(Device.usuario_id == current_user.id).all()
    # Normalizar campos para compatibilidad con el frontend
    result = []
    for d in devices:
        result.append({
            "id": d.id,
            "user_id": d.usuario_id,
            "device_name": d.nombre,
            "status": d.estado,
            "phone": d.numero_telefono or "",
        })
    return result

@app.post("/api/devices/start-qr")
async def start_qr_session(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    global active_qr_user_id, active_qr_device_id
    requested_device_id = data.get("device_id")
    active_qr_user_id = current_user.id

    device = None
    if requested_device_id:
        device = db.query(Device).filter(
            Device.id == requested_device_id,
            Device.usuario_id == current_user.id
        ).first()

    if not device:
        device = get_or_create_personal_device(db, current_user.id)

    qr_sessions[device.id] = current_user.id
    active_qr_device_id = device.id
    device.estado = "conectando"
    db.commit()
    start_bridge_for_device(current_user.id, device.id)
    
    print(f"[QR SESSION] Usuario {current_user.correo} (id={current_user.id}) inició sesión QR")
    
    print("--- [MAIN.PY] SOLICITANDO ESTADO ACTUAL AL PUENTE ---")
    session_payload = {"user_id": current_user.id, "device_id": device.id}
    await sio.emit('start_whatsapp_session', session_payload)
    await sio.emit('request_whatsapp_status', session_payload)
    
    return {
        "status": "ok",
        "user_id": current_user.id,
        "device": {
            "id": device.id,
            "user_id": device.usuario_id,
            "device_name": device.nombre,
            "status": device.estado,
            "phone": device.numero_telefono or "",
        }
    }

@app.post("/connect_device")
async def connect_device(data: dict, db: Session = Depends(get_db)):
    device_id = data.get("device_id")
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.estado = "conectado"
        db.commit()
        db.refresh(device)
        await sio.emit('device_status', {"device_id": device.id, "status": "conectado"})
        return {"message": f"Dispositivo {device.nombre} conectado"}
    return {"message": "Dispositivo no encontrado"}, 404

@app.post("/disconnect_device")
async def disconnect_device(data: dict, db: Session = Depends(get_db)):
    device_id = data.get("device_id")
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.estado = "desconectado"
        db.commit()
        db.refresh(device)
        await sio.emit('device_status', {"device_id": device.id, "status": "desconectado"})
        return {"message": f"Dispositivo {device.nombre} desconectado"}
    return {"message": "Dispositivo no encontrado"}, 404

@app.post("/api/devices/{device_id}/toggle")
async def toggle_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.id == device_id, Device.usuario_id == current_user.id).first()
    if device:
        new_status = "conectado" if device.estado == "desconectado" else "desconectado"
        device.estado = new_status
        db.commit()
        await sio.emit('device_status', {"device_id": device.id, "status": new_status})
        return {"status": "success", "device": {"id": device.id, "nombre": device.nombre, "estado": device.estado}}
    return {"status": "error", "message": "Dispositivo no encontrado o no pertenece a este usuario"}

@app.post("/api/devices/logout")
async def logout_device(current_user: User = Depends(get_current_user)):
    global connected_whatsapp_user_id, active_qr_user_id, active_qr_device_id
    print(f"--- [MAIN.PY] USUARIO {current_user.id} SOLICITA LOGOUT DE WHATSAPP ---")

    db = SessionLocal()
    try:
        device = db.query(Device).filter(
            Device.usuario_id == current_user.id,
            Device.nombre == "WhatsApp Personal"
        ).first()
        if device:
            session_payload = {"user_id": current_user.id, "device_id": device.id}
            await sio.emit('whatsapp_logout', session_payload)
            stop_bridge_for_device(device.id)
            connected_whatsapp_sessions.pop(device.id, None)
            qr_sessions.pop(device.id, None)
            device.estado = "desconectado"
            db.commit()
            await sio.emit('device_status', {"device_id": device.id, "status": "desconectado"})
    finally:
        db.close()

    if connected_whatsapp_user_id == current_user.id:
        connected_whatsapp_user_id = None
    if active_qr_user_id == current_user.id:
        active_qr_user_id = None
    if active_qr_device_id and active_qr_device_id not in qr_sessions:
        active_qr_device_id = None

    return {"status": "success", "message": "Orden de logout enviada"}

# ============================================================
# MOTOR DE FLUJOS
# ============================================================
user_states = {}
chat_histories = {}

def get_next_node(current_node_id, message_text=None):
    nodes = current_flows.get("nodes", [])
    edges = current_flows.get("edges", [])
    
    if not current_node_id:
        for node in nodes:
            label = node.get("data", {}).get("label", "").lower()
            if message_text and message_text.lower() in label:
                return node
        return nodes[0] if nodes else None

    outgoing_edges = [e for e in edges if e["source"] == current_node_id]
    if not outgoing_edges: return None

    current_node = next((n for n in nodes if n["id"] == current_node_id), None)
    if current_node and current_node["type"] == "condition":
        is_positive = any(word in (message_text or "").lower() for word in ["si", "yes", "ok", "claro", "acepto", "quiero"])
        target_handle = "yes" if is_positive else "no"
        edge = next((e for e in outgoing_edges if e.get("sourceHandle") == target_handle), outgoing_edges[0])
        return next((n for n in nodes if n["id"] == edge["target"]), None)
    
    target_node_id = outgoing_edges[0]["target"]
    return next((n for n in nodes if n["id"] == target_node_id), None)

# ============================================================
# CHAT HISTORY ENDPOINT
# ============================================================
@app.get("/api/chat/{contact_id}")
async def get_chat_history(contact_id: str, current_user: User = Depends(get_current_user)):
    if not contact_id or contact_id == "null" or contact_id == "undefined":
        return []

    contact = find_user_contact(current_user.id, contact_id)
    wid = contact.get("whatsapp_id") if contact else None

    # FILTRO: Solo permitir historial para contactos con JID válido de WhatsApp
    if not wid or '@' not in str(wid):
        print(f">>> [BACKEND] Contacto sin JID WhatsApp válido (filtrado): {contact_id}, wid={wid}")
        return []

    local_history = get_chat_history_for_user(current_user.id, wid)
    target_device_id = contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    if connected_whatsapp_sessions.get(target_device_id) == current_user.id or active_qr_user_id == current_user.id:
        print(f">>> [BACKEND] PIDIENDO REFRESH DE HISTORIAL AL PUENTE PARA WID: {wid}")
        await request_bridge_history_refresh(wid, local_history, mode="latest", count=60, user_id=current_user.id, device_id=target_device_id)
    
    return local_history

@app.post("/api/chat/{contact_id}/load-more")
async def load_more_chat_history(contact_id: str, count: int = 60, current_user: User = Depends(get_current_user)):
    if not contact_id or contact_id in ("null", "undefined"):
        return {"status": "ignored", "reason": "contact_id invalido"}

    contact = find_user_contact(current_user.id, contact_id)
    wid = contact.get("whatsapp_id") if contact else None
    if not wid:
        raise HTTPException(status_code=404, detail="Chat no encontrado")

    local_history = get_chat_history_for_user(current_user.id, wid)
    target_device_id = contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    if connected_whatsapp_sessions.get(target_device_id) != current_user.id and active_qr_user_id != current_user.id:
        raise HTTPException(status_code=409, detail="No hay una sesion de WhatsApp activa para cargar mas historial")
    await request_bridge_history_refresh(wid, local_history, mode="older", count=max(20, min(count, 120)), user_id=current_user.id, device_id=target_device_id)
    return {"status": "ok", "known_count": len(local_history)}

# ============================================================
# SEARCH
# ============================================================
@app.get("/api/search")
async def global_search(q: str, current_user: User = Depends(get_current_user)):
    results = []
    query = q.lower()
    
    contacts_list = get_user_contacts_from_cache_or_db(current_user.id)
    allowed_jids = {c.get("whatsapp_id") for c in contacts_list if c.get("whatsapp_id")}
    contact_names = {c.get("whatsapp_id"): resolve_contact_name(c) for c in contacts_list}

    for jid in allowed_jids:
        for msg in get_chat_history_for_user(current_user.id, jid):
            text = msg.get("text", "")
            if query in text.lower():
                results.append({
                    "contact_id": jid,
                    "contact_name": contact_names.get(jid, jid),
                    "message": msg
                })
    
    results.sort(key=lambda x: x["message"]["timestamp"], reverse=True)
    return results[:50]

@app.post("/api/chat/read")
async def mark_chat_as_read(whatsapp_id: str, message_id: str, current_user: User = Depends(get_current_user)):
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = find_user_contact(current_user.id, whatsapp_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Chat no encontrado")
    contact["unread_count"] = 0
    db_upsert_contact(current_user.id, contact)
    
    await sio.emit('mark_as_read', {
        "whatsapp_id": whatsapp_id,
        "message_id": message_id,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    
    return {"status": "success"}

class NoteRequest(BaseModel):
    notes: str

@app.post("/api/contacts/{contact_id}/notes")
async def update_contact_notes(contact_id: int, request: NoteRequest, current_user: User = Depends(get_current_user)):
    contact = find_user_contact(current_user.id, contact_id)
    if contact:
        contact["notes"] = request.notes
        db_upsert_contact(current_user.id, contact)
        return {"status": "success", "notes": request.notes}

    raise HTTPException(status_code=404, detail="Contacto no encontrado")

@app.post("/api/sync_contacts")
async def sync_contacts(current_user: User = Depends(get_current_user)):
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    print("--- [MAIN.PY] SOLICITANDO SINCRONIZACIÓN MANUAL AL PUENTE ---")
    await sio.emit('request_contacts_sync', {
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success", "message": "Petición de sincronización enviada"}

@app.post("/api/chat/send-media")
async def send_media_file(
    to: str = Form(...),
    media_type: str = Form(...),
    caption: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Recibe un archivo multimedia y lo envía por WhatsApp vía el bridge."""
    try:
        ensure_active_whatsapp_belongs_to_user(current_user.id)
        contact = require_user_contact(current_user.id, to)
        content = await file.read()
        b64_data = base64.b64encode(content).decode("utf-8")

        await sio.emit("send_whatsapp_media", {
            "to": to,
            "mediaType": media_type,
            "base64Data": b64_data,
            "fileName": file.filename,
            "mimeType": file.content_type,
            "caption": caption,
            "user_id": current_user.id,
            "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
        })

        print(f">>> [API] MEDIA ENVIADA: {media_type} ({file.filename}) a {to}")
        return {"status": "success", "message": f"Archivo {media_type} enviado"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# PROFILE ENDPOINTS
# ============================================================

class ProfileUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    whatsapp_personal: Optional[str] = None
    zona_horaria: Optional[str] = None
    foto_perfil: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@app.get("/api/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "correo": current_user.correo,
        "foto_perfil": current_user.foto_perfil or "",
        "whatsapp_personal": current_user.whatsapp_personal or "",
        "zona_horaria": current_user.zona_horaria or "America/Guayaquil",
        "rol": current_user.rol or "admin",
        "creado_en": current_user.creado_en.isoformat() if current_user.creado_en else "",
        "ultimo_acceso": current_user.ultimo_acceso.isoformat() if current_user.ultimo_acceso else "",
    }

@app.put("/api/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza nombre, whatsapp_personal, zona_horaria y foto_perfil."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.nombre is not None:
        user.nombre = data.nombre
    if data.whatsapp_personal is not None:
        user.whatsapp_personal = data.whatsapp_personal
    if data.zona_horaria is not None:
        user.zona_horaria = data.zona_horaria
    if data.foto_perfil is not None:
        user.foto_perfil = data.foto_perfil

    db.commit()
    db.refresh(user)
    print(f"[PROFILE] ✅ Perfil actualizado para: {user.correo}")
    return {"status": "success", "message": "Perfil actualizado correctamente"}

@app.put("/api/profile/password")
async def change_password(
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cambia la contraseña del usuario."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not verify_password(data.current_password, user.contrasena_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    user.contrasena_hash = get_password_hash(data.new_password)
    db.commit()
    print(f"[PROFILE] ✅ Contraseña cambiada para: {user.correo}")
    return {"status": "success", "message": "Contraseña actualizada correctamente"}

# ============================================================
# CONFIGURACIÓN DEL NEGOCIO
# ============================================================

@app.get("/api/configuracion")
async def get_configuracion(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cfg = db.query(ConfiguracionDB).filter(ConfiguracionDB.usuario_id == current_user.id).first()
    if not cfg:
        # Crear configuración por defecto
        cfg = ConfiguracionDB(
            usuario_id=current_user.id,
            nombre_negocio="",
            mensaje_bienvenida="¡Hola! Bienvenido a nuestro servicio. ¿En qué podemos ayudarte?",
            mensaje_fuera_horario="Gracias por contactarnos. En este momento estamos fuera de horario. Te responderemos pronto.",
            idioma="es",
            zona_horaria="America/Guayaquil",
            notificaciones_email=True,
            notificaciones_push=True
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return {
        "id": cfg.id,
        "nombre_negocio": cfg.nombre_negocio or "",
        "logo_url": cfg.logo_url or "",
        "mensaje_bienvenida": cfg.mensaje_bienvenida or "",
        "mensaje_fuera_horario": cfg.mensaje_fuera_horario or "",
        "idioma": cfg.idioma or "es",
        "zona_horaria": cfg.zona_horaria or "America/Guayaquil",
        "notificaciones_email": cfg.notificaciones_email,
        "notificaciones_push": cfg.notificaciones_push,
    }

@app.put("/api/configuracion")
async def update_configuracion(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cfg = db.query(ConfiguracionDB).filter(ConfiguracionDB.usuario_id == current_user.id).first()
    if not cfg:
        cfg = ConfiguracionDB(usuario_id=current_user.id)
        db.add(cfg)
    for field in ["nombre_negocio", "logo_url", "mensaje_bienvenida", "mensaje_fuera_horario", "idioma", "zona_horaria", "notificaciones_email", "notificaciones_push"]:
        if field in data:
            setattr(cfg, field, data[field])
    db.commit()
    return {"status": "success", "message": "Configuración guardada correctamente"}

# ============================================================
# HORARIOS DE ATENCIÓN
# ============================================================

DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]

@app.get("/api/horarios")
async def get_horarios(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    horarios = db.query(HorarioAtencion).filter(HorarioAtencion.usuario_id == current_user.id).all()
    if not horarios:
        # Crear horarios por defecto (lun-vie activos)
        defaults = []
        for dia in DIAS:
            activo = dia not in ["sabado", "domingo"]
            h = HorarioAtencion(usuario_id=current_user.id, dia_semana=dia, hora_inicio="08:00", hora_fin="18:00", activo=activo)
            db.add(h)
            defaults.append(h)
        db.commit()
        for h in defaults:
            db.refresh(h)
        horarios = defaults
    return [{"id": h.id, "dia_semana": h.dia_semana, "hora_inicio": str(h.hora_inicio)[:5], "hora_fin": str(h.hora_fin)[:5], "activo": h.activo} for h in horarios]

@app.put("/api/horarios")
async def update_horarios(data: list, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for item in data:
        horario = db.query(HorarioAtencion).filter(
            HorarioAtencion.usuario_id == current_user.id,
            HorarioAtencion.dia_semana == item["dia_semana"]
        ).first()
        if horario:
            horario.hora_inicio = item.get("hora_inicio", "08:00")
            horario.hora_fin = item.get("hora_fin", "18:00")
            horario.activo = item.get("activo", True)
        else:
            h = HorarioAtencion(
                usuario_id=current_user.id,
                dia_semana=item["dia_semana"],
                hora_inicio=item.get("hora_inicio", "08:00"),
                hora_fin=item.get("hora_fin", "18:00"),
                activo=item.get("activo", True)
            )
            db.add(h)
    db.commit()
    return {"status": "success", "message": "Horarios actualizados correctamente"}

# ============================================================
# ETIQUETAS
# ============================================================

@app.get("/api/etiquetas")
async def get_etiquetas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tags = db.query(Etiqueta).filter(Etiqueta.usuario_id == current_user.id).all()
    return [{"id": t.id, "nombre": t.nombre, "color": t.color} for t in tags]

@app.post("/api/etiquetas")
async def create_etiqueta(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tag = Etiqueta(usuario_id=current_user.id, nombre=data.get("nombre", "Sin nombre"), color=data.get("color", "#6366f1"))
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return {"status": "success", "etiqueta": {"id": tag.id, "nombre": tag.nombre, "color": tag.color}}

@app.delete("/api/etiquetas/{etiqueta_id}")
async def delete_etiqueta(etiqueta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tag = db.query(Etiqueta).filter(Etiqueta.id == etiqueta_id, Etiqueta.usuario_id == current_user.id).first()
    if tag:
        db.delete(tag)
        db.commit()
    return {"status": "success"}

# ============================================================
# RESPUESTAS RÁPIDAS
# ============================================================

@app.get("/api/respuestas-rapidas")
async def get_respuestas_rapidas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(RespuestaRapida).filter(RespuestaRapida.usuario_id == current_user.id).all()
    return [{"id": r.id, "atajo": r.atajo, "contenido": r.contenido, "tipo": r.tipo} for r in items]

@app.post("/api/respuestas-rapidas")
async def create_respuesta_rapida(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = RespuestaRapida(
        usuario_id=current_user.id,
        atajo=data.get("atajo", ""),
        contenido=data.get("contenido", ""),
        tipo=data.get("tipo", "texto")
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"status": "success", "respuesta": {"id": r.id, "atajo": r.atajo, "contenido": r.contenido, "tipo": r.tipo}}

@app.delete("/api/respuestas-rapidas/{respuesta_id}")
async def delete_respuesta_rapida(respuesta_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(RespuestaRapida).filter(RespuestaRapida.id == respuesta_id, RespuestaRapida.usuario_id == current_user.id).first()
    if r:
        db.delete(r)
        db.commit()
    return {"status": "success"}

# ============================================================
# SUSCRIPCIÓN Y PLAN
# ============================================================

@app.get("/api/suscripcion")
async def get_suscripcion(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = db.query(SuscripcionDB).filter(SuscripcionDB.usuario_id == current_user.id).order_by(SuscripcionDB.id.desc()).first()
    if not sub:
        return {"plan": "Gratis", "estado": "activa", "periodo": "mensual", "fecha_vencimiento": None}
    plan = db.query(PlanDB).filter(PlanDB.id == sub.plan_id).first()
    return {
        "plan": plan.nombre if plan else "Desconocido",
        "estado": sub.estado,
        "periodo": sub.periodo,
        "fecha_inicio": sub.fecha_inicio.isoformat() if sub.fecha_inicio else None,
        "fecha_vencimiento": sub.fecha_vencimiento.isoformat() if sub.fecha_vencimiento else None,
        "renovacion_auto": sub.renovacion_auto,
        "max_dispositivos": plan.max_dispositivos if plan else 1,
        "max_contactos": plan.max_contactos if plan else 500,
        "max_automatizaciones": plan.max_automatizaciones if plan else 5,
        "permite_ia": plan.permite_ia if plan else False,
        "precio_mensual": str(plan.precio_mensual) if plan else "0.00",
    }

# ============================================================
# NOTIFICACIONES IN-APP
# ============================================================

@app.get("/api/notificaciones")
async def get_notificaciones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(NotificacionDB).filter(
        NotificacionDB.usuario_id == current_user.id
    ).order_by(NotificacionDB.creado_en.desc()).limit(50).all()
    return [{"id": n.id, "titulo": n.titulo, "mensaje": n.mensaje, "tipo": n.tipo, "leido": n.leido, "creado_en": n.creado_en.isoformat() if n.creado_en else ""} for n in notifs]

@app.post("/api/notificaciones/{notif_id}/leer")
async def marcar_notificacion_leida(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(NotificacionDB).filter(NotificacionDB.id == notif_id, NotificacionDB.usuario_id == current_user.id).first()
    if n:
        n.leido = True
        db.commit()
    return {"status": "success"}

@app.post("/api/notificaciones/leer-todas")
async def marcar_todas_notificaciones_leidas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(NotificacionDB).filter(
        NotificacionDB.usuario_id == current_user.id, NotificacionDB.leido == False
    ).update({"leido": True})
    db.commit()
    return {"status": "success"}

# ============================================================
# CAMPAÑAS (BD REAL)
# ============================================================

@app.get("/api/campanas")
async def get_campanas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    campanas = db.query(CampanaDB).filter(CampanaDB.usuario_id == current_user.id).order_by(CampanaDB.creado_en.desc()).all()
    return [{
        "id": c.id, "nombre": c.nombre, "mensaje": c.mensaje,
        "estado": c.estado, "total_enviados": c.total_enviados,
        "total_fallidos": c.total_fallidos,
        "programado_para": c.programado_para.isoformat() if c.programado_para else None,
        "creado_en": c.creado_en.strftime("%Y-%m-%d") if c.creado_en else ""
    } for c in campanas]

@app.post("/api/campanas")
async def create_campana(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.usuario_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=400, detail="No hay dispositivo vinculado")
    campana = CampanaDB(
        usuario_id=current_user.id,
        dispositivo_id=device.id,
        nombre=data.get("nombre", "Sin nombre"),
        mensaje=data.get("mensaje", ""),
        estado="completado",
        total_enviados=data.get("total_enviados", 0),
    )
    db.add(campana)
    db.commit()
    db.refresh(campana)
    return {"status": "success", "campaign": {
        "id": campana.id, "nombre": campana.nombre, "mensaje": campana.mensaje,
        "estado": campana.estado, "total_enviados": campana.total_enviados,
        "creado_en": campana.creado_en.strftime("%Y-%m-%d") if campana.creado_en else ""
    }}

# ============================================================
# AUTOMATIZACIONES (BD REAL)
# ============================================================

@app.get("/api/automatizaciones")
async def get_automatizaciones(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    autos = db.query(AutomatizacionDB).filter(AutomatizacionDB.usuario_id == current_user.id).all()
    return [{
        "id": a.id, "nombre": a.nombre, "tipo_disparador": a.tipo_disparador,
        "palabra_clave": a.palabra_clave, "activo": a.activo,
        "nodos": json.loads(a.nodos) if a.nodos else [],
        "conexiones": json.loads(a.conexiones) if a.conexiones else []
    } for a in autos]

@app.post("/api/automatizaciones")
async def create_automatizacion(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.usuario_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=400, detail="No hay dispositivo vinculado")
    auto = AutomatizacionDB(
        usuario_id=current_user.id,
        dispositivo_id=device.id,
        nombre=data.get("nombre", "Nueva automatización"),
        tipo_disparador=data.get("tipo_disparador", "palabra_clave"),
        palabra_clave=data.get("palabra_clave"),
        activo=data.get("activo", True),
        nodos=json.dumps(data.get("nodos", [])),
        conexiones=json.dumps(data.get("conexiones", []))
    )
    db.add(auto)
    db.commit()
    db.refresh(auto)
    return {"status": "success", "id": auto.id}

@app.put("/api/automatizaciones/{auto_id}")
async def update_automatizacion(auto_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    auto = db.query(AutomatizacionDB).filter(AutomatizacionDB.id == auto_id, AutomatizacionDB.usuario_id == current_user.id).first()
    if not auto:
        raise HTTPException(status_code=404, detail="Automatización no encontrada")
    for field in ["nombre", "tipo_disparador", "palabra_clave", "activo"]:
        if field in data:
            setattr(auto, field, data[field])
    if "nodos" in data:
        auto.nodos = json.dumps(data["nodos"])
    if "conexiones" in data:
        auto.conexiones = json.dumps(data["conexiones"])
    db.commit()
    return {"status": "success"}

@app.delete("/api/automatizaciones/{auto_id}")
async def delete_automatizacion(auto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    auto = db.query(AutomatizacionDB).filter(AutomatizacionDB.id == auto_id, AutomatizacionDB.usuario_id == current_user.id).first()
    if auto:
        db.delete(auto)
        db.commit()
    return {"status": "success"}

# ============================================================
# SOCKET.IO EVENTS — WHATSAPP BRIDGE
# ============================================================

@sio.on('whatsapp_qr')
async def handle_whatsapp_qr(sid, data):
    qr_code = data.get("qr")
    print(f">>> [SOCKET] QR RECIBIDO DEL PUENTE. RETRANSMITIENDO A FRONTEND...")
    await sio.emit('whatsapp_qr_ready', {"qr": qr_code})

@sio.on('whatsapp_qr_ready')
async def handle_whatsapp_qr_ready(sid, data):
    print(f">>> [BACKEND] RELAY: whatsapp_qr_ready")
    await sio.emit('whatsapp_qr_ready', data)

@sio.on('whatsapp_status')
async def handle_whatsapp_status(sid, data):
    global connected_whatsapp_user_id, active_qr_user_id, active_qr_device_id
    status_val = data.get("status")
    phone_val = data.get("phone")
    event_user_id = safe_int(data.get("user_id"))
    event_device_id = safe_int(data.get("device_id"))
    print(f">>> [BACKEND] RELAY: whatsapp_status -> {status_val} (Phone: {phone_val})")
    
    await sio.emit('whatsapp_status', data)
    
    if status_val == "conectado":
        db = SessionLocal()
        try:
            target_user_id = event_user_id or active_qr_user_id or connected_whatsapp_user_id
            device = None

            if event_device_id:
                device = db.query(Device).filter(Device.id == event_device_id).first()
                if device:
                    target_user_id = device.usuario_id

            if phone_val and not device:
                device = db.query(Device).filter(Device.numero_telefono == phone_val).first()
                if device:
                    print(f">>> [BACKEND] REUTILIZANDO DISPOSITIVO EXISTENTE: {device.nombre} (ID: {device.id})")
                    if target_user_id and device.usuario_id != target_user_id:
                        print(f"[WARN] El telefono {phone_val} ya pertenece al usuario {device.usuario_id}; no se reasigna al usuario {target_user_id}.")
                    target_user_id = device.usuario_id

            if not device and target_user_id:
                device = db.query(Device).filter(
                    Device.usuario_id == target_user_id,
                    Device.nombre == "WhatsApp Personal"
                ).first()

            if not device and target_user_id:
                device = get_or_create_personal_device(db, target_user_id)

            if device:
                device.estado = status_val
                device.conectado_en = datetime.utcnow()
                if phone_val:
                    device.numero_telefono = phone_val
                db.commit()
                connected_whatsapp_user_id = device.usuario_id
                active_qr_user_id = device.usuario_id
                active_qr_device_id = device.id
                connected_whatsapp_sessions[device.id] = device.usuario_id
                await sio.emit('device_status', {"device_id": device.id, "user_id": device.usuario_id, "status": status_val})
            else:
                print("[WARN] WhatsApp conectado, pero no hay usuario dueño del QR. No se asigna a ningun usuario.")
        finally:
            db.close()
    elif status_val in ("session_expired", "desconectado", "logged_out", "error"):
        if event_device_id:
            connected_whatsapp_sessions.pop(event_device_id, None)
            qr_sessions.pop(event_device_id, None)
            if active_qr_device_id == event_device_id:
                active_qr_device_id = None
                active_qr_user_id = None
        if not connected_whatsapp_sessions:
            connected_whatsapp_user_id = None

# *** FIX CRÍTICO: data=None para evitar TypeError cuando bridge emite sin payload ***
@sio.on('whatsapp_ready_for_sync')
async def handle_whatsapp_ready_for_sync(sid, data=None):
    print(">>> [BACKEND] RELAY: whatsapp_ready_for_sync")
    await sio.emit('whatsapp_ready_for_sync', data or {})
    await sio.emit('request_contacts_sync', data or {})

@sio.on('whatsapp_message')
async def handle_whatsapp_message(sid, data):
    jid = data.get("whatsapp_id") or data.get("contact_id")
    text = data.get("text") or ""
    media = data.get("media")
    
    print(f">>> [BACKEND] MENSAJE DE {jid}: {text[:50]}... (Media: {'SI' if media else 'NO'})")
    
    await process_whatsapp_message(data)

@sio.on('whatsapp_history_response')
async def handle_whatsapp_history(sid, data):
    contact_id = data.get("contact_id")
    history = data.get("history", [])
    print(f">>> [BACKEND] RECIBIDO HISTORIAL DE {len(history)} MENSAJES PARA {contact_id}")
    target_user_ids = get_whatsapp_event_user_ids(data)
    if not target_user_ids:
        print("[WARN] Historial recibido sin usuario dueño de WhatsApp. Ignorando para evitar mezcla.")
        return
    owner_user_id = target_user_ids[0]
    owner_device_id = get_whatsapp_event_device_id(data)
    for msg in history:
        msg["owner_user_id"] = owner_user_id
        msg["device_id"] = owner_device_id
    other_history = [
        msg for msg in chat_histories.get(contact_id, [])
        if msg.get("owner_user_id") not in (None, owner_user_id)
    ]
    chat_histories[contact_id] = other_history + history
    await sio.emit('history_ready', {"contact_id": contact_id, "history": history, "user_id": owner_user_id, "device_id": owner_device_id})

@sio.on('whatsapp_chat_history')
async def handle_whatsapp_chat_history(sid, data):
    jid = data.get("whatsapp_id") or data.get("contact_id")
    history = data.get("history", [])
    
    print(f">>> [BACKEND] RECIBIDO HISTORIAL BAILEYS PARA {jid}: {len(history)} MENSAJES")
    
    target_user_ids = get_whatsapp_event_user_ids(data)
    if not target_user_ids:
        print("[WARN] Historial recibido sin usuario dueño de WhatsApp. Ignorando para evitar mezcla.")
        return
    owner_user_id = target_user_ids[0]
    owner_device_id = get_whatsapp_event_device_id(data)

    normalized_history = []
    for h in history:
        normalized_history.append({
            "id": h.get("id"),
            "text": h.get("text"),
            "sender": h.get("sender"),
            "timestamp": h.get("timestamp"),
            "status": h.get("status", 1),
            "participant": h.get("participant"),
            "pushName": h.get("pushName"),
            "mediaType": h.get("mediaType"),
            "mediaPath": h.get("mediaPath"),
            "fileName": h.get("fileName"),
            "owner_user_id": owner_user_id,
            "device_id": owner_device_id,
        })

    existing_history = chat_histories.get(jid, [])
    other_history = [
        item for item in existing_history
        if item.get("owner_user_id") not in (None, owner_user_id)
    ]
    existing_history = [
        item for item in existing_history
        if item.get("owner_user_id") in (None, owner_user_id)
    ]
    merged_history = {}
    for item in existing_history + normalized_history:
        item_id = item.get("id") or f"{item.get('timestamp', 0)}-{item.get('text', '')}"
        merged_history[item_id] = item
    ordered_history = sorted(
        merged_history.values(),
        key=lambda item: normalize_timestamp(item.get("timestamp"))
    )
    chat_histories[jid] = sorted(
        other_history + ordered_history,
        key=lambda item: normalize_timestamp(item.get("timestamp"))
    )
    
    public_phone = normalize_phone_value(jid)
    db_contacts = []
    for u_id in target_user_ids:
        db_contacts.extend(contacts_mock_db.get(u_id, []))
    
    contact = next((c for c in db_contacts if contact_matches_identity(c, jid, public_phone)), None)
    c_id = contact.get("id") if contact else 1

    if ordered_history:
        last_msg = ordered_history[-1]
        preview = get_message_preview(last_msg)
        for u_id in target_user_ids:
            for c in contacts_mock_db.get(u_id, []):
                if not contact_matches_identity(c, jid, public_phone):
                    continue
                if c.get("whatsapp_id") != jid:
                    merge_chat_history_keys(c.get("whatsapp_id"), jid)
                    c["whatsapp_id"] = jid
                c["last_message"] = preview
                c["timestamp"] = normalize_timestamp(last_msg.get("timestamp"))
                if last_msg.get("mediaType"):
                    c["mediaType"] = last_msg.get("mediaType")
                if last_msg.get("pushName"):
                    c["pushName"] = last_msg.get("pushName")
                    if not c.get("name") or c.get("name") == c.get("phone"):
                        c["name"] = last_msg.get("pushName")
                c["device_id"] = owner_device_id or c.get("device_id")
                db_upsert_contact(u_id, c, owner_device_id)
                for msg in normalized_history:
                    db_save_message(jid, u_id, msg, owner_device_id)
    
    await sio.emit('history_ready', {
        "contact_id": jid,
        "contact_db_id": c_id,
        "whatsapp_id": jid,
        "history": ordered_history,
        "user_id": owner_user_id,
        "device_id": owner_device_id,
        "prepend": bool(data.get("prepend")),
        "hasMore": data.get("hasMore", False),
        "totalCount": data.get("totalCount", len(ordered_history))
    })

async def process_whatsapp_message(data):
    jid = data.get("whatsapp_id") or data.get("contact_id")
    text = data.get("text")
    media_type = data.get("mediaType")
    from_me = data.get("fromMe", False)
    sender = data.get("sender", "bot" if from_me else "user")
    timestamp = data.get("timestamp") or int(time.time())
    push_name = data.get("pushName")
    participant = data.get("participant")
    message_id = data.get("id") or f"{jid}-{timestamp}"
    public_phone = normalize_phone_value(jid)
    
    # Generar preview correcto
    preview = text or get_message_preview(data)
    
    print(f">>> [BACKEND] PROCESANDO MENSAJE DE {jid}: {str(preview)[:40]}...")
    target_user_ids = get_whatsapp_event_user_ids(data)
    if not target_user_ids:
        print("[WARN] Mensaje recibido sin usuario dueño de WhatsApp. Ignorando para evitar mezcla.")
        return
    owner_user_id = target_user_ids[0]
    owner_device_id = get_whatsapp_event_device_id(data)
    
    # Actualizar metadatos del contacto en contacts_mock_db
    for u_id in target_user_ids:
        for contact in contacts_mock_db.get(u_id, []):
            if contact_matches_identity(contact, jid, public_phone):
                if contact.get("whatsapp_id") != jid:
                    merge_chat_history_keys(contact.get("whatsapp_id"), jid)
                    contact["whatsapp_id"] = jid
                # Actualizar last_message con preview real
                contact["last_message"] = preview
                contact["timestamp"] = timestamp
                if media_type:
                    contact["mediaType"] = media_type
                
                if push_name:
                    current_name = contact.get("name") or contact.get("pushName") or ""
                    if not current_name or current_name == contact.get("phone"):
                        contact["name"] = push_name
                    contact["pushName"] = push_name
                if participant and contact.get("is_group"):
                    participants = contact.get("participants") or []
                    if participant not in participants:
                        participants.append(participant)
                        contact["participants"] = participants
                
                if not from_me:
                    contact["unread_count"] = contact.get("unread_count", 0) + 1
                break

    # Guardar en historial
    if jid not in chat_histories: 
        chat_histories[jid] = []
    
    new_msg = {
        "id": message_id, 
        "text": text, 
        "sender": sender,
        "timestamp": timestamp,
        "mediaType": media_type,
        "mediaPath": data.get("mediaPath"),
        "fileName": data.get("fileName"),
        "status": data.get("status", 1),
        "participant": participant,
        "pushName": push_name,
        "owner_user_id": owner_user_id,
        "device_id": owner_device_id,
    }
    existing_index = next((
        index for index, item in enumerate(chat_histories[jid])
        if item.get("id") == message_id and item.get("owner_user_id") in (None, owner_user_id)
    ), None)
    if existing_index is None:
        chat_histories[jid].append(new_msg)
    else:
        chat_histories[jid][existing_index] = {**chat_histories[jid][existing_index], **new_msg}

    # Persistir mensaje en SQLite
    target_uid_for_msg = None
    for u_id in target_user_ids:
        for c in contacts_mock_db.get(u_id, []):
            if contact_matches_identity(c, jid, public_phone):
                if c.get("whatsapp_id") != jid:
                    merge_chat_history_keys(c.get("whatsapp_id"), jid)
                    c["whatsapp_id"] = jid
                target_uid_for_msg = u_id
                # También persistir el contacto con el último mensaje actualizado
                c["device_id"] = owner_device_id or c.get("device_id")
                db_upsert_contact(u_id, c, owner_device_id)
                break
        if target_uid_for_msg:
            break
    db_save_message(jid, target_uid_for_msg or 0, new_msg, owner_device_id)

    # Notificar al frontend
    await sio.emit('new_whatsapp_message', {
        "contact_id": jid,
        "whatsapp_id": jid,
        "user_id": owner_user_id,
        "device_id": owner_device_id,
        "message": new_msg,
        "unreadCount": next(
            (
                c.get("unread_count", 0)
                for uid in target_user_ids
                for c in contacts_mock_db.get(uid, [])
                if c.get("whatsapp_id") == jid
            ),
            0
        )
    })

@sio.on('whatsapp_receipt')
async def handle_whatsapp_receipt(sid, data):
    receipts = data.get("receipts", data) if isinstance(data, dict) else data
    print(f">>> [BACKEND] RECIBIDO RECIBO WHATSAPP: {len(receipts)} actualizaciones")
    await sio.emit('message_status_update', receipts)
    target_user_ids = get_whatsapp_event_user_ids(data if isinstance(data, dict) else None)
    
    for item in receipts:
        jid = item.get("key", {}).get("remoteJid")
        msg_id = item.get("key", {}).get("id")
        new_status = item.get("update", {}).get("status")
        
        if jid in chat_histories:
            for msg in chat_histories[jid]:
                if msg.get("id") == msg_id and msg.get("owner_user_id") in (None, *target_user_ids):
                    msg["status"] = new_status
                    break

@sio.on('whatsapp_contacts')
async def handle_whatsapp_contacts(sid, data):
    new_contacts = data.get("contacts", [])
    event_device_id = get_whatsapp_event_device_id(data)
    event_user_ids = get_whatsapp_event_user_ids(data)
    target_user_id = event_user_ids[0] if event_user_ids else (connected_whatsapp_user_id or active_qr_user_id)
    
    if target_user_id is None:
        db = SessionLocal()
        try:
            device = db.query(Device).filter(
                Device.nombre == "WhatsApp Personal",
                Device.estado == "conectado"
            ).order_by(Device.conectado_en.desc()).first()
            if device:
                target_user_id = device.usuario_id
                print(f"--- [MAIN.PY] Fallback: Asignando contactos al dueño del dispositivo (user_id={target_user_id}) ---")
        finally:
            db.close()

    print(f"--- [MAIN.PY] RECIBIDOS {len(new_contacts)} CONTACTOS - asignando a user_id={target_user_id} ---")
    
    # Contador para filtrado
    filtered_out = 0
    processed = 0
    
    if target_user_id is None:
        print("[WARN] No hay usuario activo ni dispositivo conectado para asociar contactos. Ignorando.")
        return
    
    if target_user_id not in contacts_mock_db:
        contacts_mock_db[target_user_id] = []
    
    contacts_list = contacts_mock_db.get(target_user_id, [])
    existing_contacts_map = {c.get("whatsapp_id"): c for c in contacts_list if c.get("whatsapp_id")}
    existing_contacts_by_phone = {
        normalize_phone_value(c.get("phone")): c
        for c in contacts_list
        if c.get("phone") and not c.get("is_group")
    }
    
    print(f">>> [BACKEND] SINCRONIZANDO {len(new_contacts)} CONTACTOS (LOTE BAILEYS) para user_id={target_user_id}...")
    
    updated_count = 0
    synced_count = 0
    last_wc = None
    
    for wc in new_contacts:
        last_wc = wc
        w_id = wc.get("id")  # JID de Baileys
        num = wc.get("number")
        is_group = wc.get("isGroup", False) or wc.get("is_group", False)
        
        # *** FILTRO CRÍTICO 1: Solo contactos con JID válido de WhatsApp ***
        if not w_id or '@' not in str(w_id):
            filtered_out += 1
            continue
        
        # *** FILTRO CRÍTICO 2: Solo usuarios de WhatsApp o grupos ***
        is_user = wc.get("isUser", True)
        if not is_user and not is_group:
            filtered_out += 1
            continue
        
        wc["device_id"] = event_device_id
        processed += 1
        
        # *** FIX: Resolver nombre con prioridad correcta desde Baileys ***
        name = resolve_contact_name({
            "name": wc.get("name"),
            "verifiedName": wc.get("verifiedName"),
            "pushName": wc.get("pushName"),
            "notify": wc.get("notify"),
            "phone": num,
            "whatsapp_id": w_id,
        }, num)
        
        # Preview del último mensaje
        last_msg_preview = wc.get("lastMessage") or wc.get("last_message") or ""
        
        existing = existing_contacts_map.get(w_id) if w_id else None
        if not existing and num and not wc.get("isGroup", False):
            existing = existing_contacts_by_phone.get(normalize_phone_value(num))
            if existing and existing.get("whatsapp_id") != w_id:
                merge_chat_history_keys(existing.get("whatsapp_id"), w_id)
                if existing.get("whatsapp_id") in existing_contacts_map:
                    existing_contacts_map.pop(existing.get("whatsapp_id"), None)
                existing["whatsapp_id"] = w_id
                existing_contacts_map[w_id] = existing

        if existing:
            # Solo actualizar si es usuario de WhatsApp o grupo
            existing_is_user = existing.get("is_user", True)
            if not is_user and not is_group and existing_is_user:
                # El contacto existente era de WhatsApp, pero el nuevo no, no lo sobreescribimos
                continue
            
            # Solo actualizar nombre si el nuevo tiene más información
            if name and name != num:  # Si el nombre no es solo el número
                existing["name"] = name
            existing["pushName"] = wc.get("pushName", existing.get("pushName", ""))
            existing["verifiedName"] = wc.get("verifiedName", existing.get("verifiedName", ""))
            existing["notify"] = wc.get("notify", existing.get("notify", ""))
            existing["phone"] = num or existing.get("phone", "")
            existing["last_message"] = last_msg_preview or existing.get("last_message", "")
            existing["timestamp"] = wc.get("timestamp", 0) or existing.get("timestamp", 0)
            existing["unread_count"] = wc.get("unreadCount", existing.get("unread_count", 0))
            existing["is_group"] = wc.get("isGroup", False)
            existing["participants"] = wc.get("participants", [])
            existing["photo_url"] = wc.get("photo_url") or existing.get("photo_url")
            existing["mediaType"] = wc.get("mediaType") or existing.get("mediaType")
            existing["device_id"] = event_device_id or existing.get("device_id")
            existing["is_user"] = is_user if is_user else existing.get("is_user", True)
            if num and not existing.get("is_group"):
                existing_contacts_by_phone[normalize_phone_value(num)] = existing
            updated_count += 1
        else:
            # Solo crear si es usuario de WhatsApp o grupo
            if not is_user and not is_group:
                continue
                
            new_contact = {
                "id": len(contacts_list) + 1,
                "device_id": event_device_id,
                "whatsapp_id": w_id,
                "name": name,
                "pushName": wc.get("pushName", ""),
                "verifiedName": wc.get("verifiedName", ""),
                "notify": wc.get("notify", ""),
                "phone": num,
                "email": f"{num}@whatsapp.com" if num else "",
                "status": "Nuevo",
                "tag": "WhatsApp",
                "notes": "",
                "last_message": last_msg_preview,
                "timestamp": wc.get("timestamp", 0),
                "unread_count": wc.get("unreadCount", 0),
                "is_group": is_group,
                "is_user": is_user,
                "participants": wc.get("participants", []),
                "photo_url": wc.get("photo_url"),
                "mediaType": wc.get("mediaType"),
            }
            contacts_list.append(new_contact)
            if num and not new_contact.get("is_group"):
                existing_contacts_by_phone[normalize_phone_value(num)] = new_contact
            synced_count += 1
    
    print(f">>> [BACKEND] CONTACTOS: {processed} procesados, {filtered_out} filtrados. {synced_count} nuevos, {updated_count} actualizados.")

    # Persistir contactos nuevos/actualizados en SQLite
    for c in contacts_mock_db.get(target_user_id, []):
        db_upsert_contact(target_user_id, c, event_device_id or c.get("device_id"))

    # Solo emitir cuando termine el lote completo
    if last_wc:
        is_last_batch = last_wc.get("batch_index", 0) + 1 >= last_wc.get("total_chats", 1)
        if is_last_batch:
            await sio.emit('contacts_updated', {"count": len(contacts_list), "user_id": target_user_id, "device_id": event_device_id})

# ============================================================
# SOCKET.IO — EVENTOS GENERALES
# ============================================================

@sio.on('user_typing')
async def handle_user_typing(sid, data):
    """Retransmite el estado de escritura al frontend."""
    await sio.emit('user_typing', data)

@sio.on('presence_update')
async def handle_presence_update(sid, data):
    """Retransmite la actualización de presencia al frontend."""
    await sio.emit('presence_update', data)

@sio.on('contact_photo')
async def handle_contact_photo(sid, data):
    """Guarda y retransmite la foto de perfil de un contacto."""
    wid = data.get("whatsapp_id")
    photo_url = data.get("photo_url")
    if not wid or not photo_url:
        return

    target_user_ids = get_whatsapp_event_user_ids(data)
    event_device_id = get_whatsapp_event_device_id(data)
    if not target_user_ids:
        print("[WARN] Foto de contacto recibida sin usuario dueño de WhatsApp. Ignorando para evitar mezcla.")
        return

    for u_id in target_user_ids:
        for contact in contacts_mock_db.get(u_id, []):
            if contact_matches_identity(contact, wid, normalize_phone_value(wid)):
                if contact.get("whatsapp_id") != wid:
                    merge_chat_history_keys(contact.get("whatsapp_id"), wid)
                    contact["whatsapp_id"] = wid
                contact["photo_url"] = photo_url
                contact["device_id"] = event_device_id or contact.get("device_id")
                db_upsert_contact(u_id, contact, event_device_id)
                await sio.emit('contact_photo_updated', {
                    "whatsapp_id": wid,
                    "photo_url": photo_url,
                    "user_id": u_id,
                    "device_id": event_device_id
                })
                return

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def message(sid, data):
    contact_id = data.get("contact_id", 1) if isinstance(data, dict) else 1
    text = data.get("text", data) if isinstance(data, dict) else data
    
    if contact_id not in chat_histories: chat_histories[contact_id] = []
    chat_histories[contact_id].append({"id": len(chat_histories[contact_id]), "text": text, "sender": "user"})
    
    current_node_id = user_states.get(contact_id)
    next_node = get_next_node(current_node_id, text)
    
    if next_node:
        user_states[contact_id] = next_node["id"]
        bot_response = next_node["data"]["label"]
        chat_histories[contact_id].append({"id": len(chat_histories[contact_id]), "text": bot_response, "sender": "bot"})
        await sio.emit('response', {'text': bot_response, 'sender': 'bot', 'contact_id': contact_id}, room=sid)
    else:
        user_states[contact_id] = None
        response = "He completado mi flujo. ¿En qué más puedo ayudarte?"
        chat_histories[contact_id].append({"id": len(chat_histories[contact_id]), "text": response, "sender": "bot"})
        await sio.emit('response', {'text': response, 'sender': 'bot', 'contact_id': contact_id}, room=sid)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# ============================================================
# MENSAJES: EDITAR, ELIMINAR, REACCIONES
# ============================================================

class EditMessageRequest(BaseModel):
    message_id: str
    new_text: str

@app.post("/api/chat/edit-message")
async def edit_message(data: EditMessageRequest, current_user: User = Depends(get_current_user)):
    """Edita un mensaje enviado."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    await sio.emit('edit_message', {
        "message_id": data.message_id,
        "new_text": data.new_text,
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success", "message_id": data.message_id}

class DeleteMessageRequest(BaseModel):
    message_id: str
    jid: str
    delete_for_everyone: bool = False

@app.post("/api/chat/delete-message")
async def delete_message(data: DeleteMessageRequest, current_user: User = Depends(get_current_user)):
    """Elimina un mensaje."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, data.jid)
    await sio.emit('delete_message', {
        "message_id": data.message_id,
        "jid": data.jid,
        "delete_for_everyone": data.delete_for_everyone,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success", "message_id": data.message_id}

class ReactionRequest(BaseModel):
    message_id: str
    jid: str
    reaction: str

@app.post("/api/chat/react")
async def send_reaction(data: ReactionRequest, current_user: User = Depends(get_current_user)):
    """Envía una reacción a un mensaje."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, data.jid)
    valid_reactions = ["❤️", "😂", "😮", "😢", "😡", "😍", "👍", "👎"]
    if data.reaction not in valid_reactions:
        raise HTTPException(status_code=400, detail="Reacción no válida")
    
    await sio.emit('send_reaction', {
        "message_id": data.message_id,
        "jid": data.jid,
        "reaction": data.reaction,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

# ============================================================
# GRUPOS: CREAR, GESTIONAR
# ============================================================

class CreateGroupRequest(BaseModel):
    subject: str
    participants: List[str]

@app.post("/api/groups/create")
async def create_group(data: CreateGroupRequest, current_user: User = Depends(get_current_user)):
    """Crea un nuevo grupo de WhatsApp."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    await sio.emit('create_group', {
        "subject": data.subject,
        "participants": data.participants,
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

class GroupActionRequest(BaseModel):
    jid: str
    participants: List[str]

@app.post("/api/groups/add-participants")
async def add_group_participants(data: GroupActionRequest, current_user: User = Depends(get_current_user)):
    """Agrega participantes a un grupo."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, data.jid, group_only=True)
    await sio.emit('add_group_participants', {
        "jid": data.jid,
        "participants": data.participants,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

@app.post("/api/groups/remove-participants")
async def remove_group_participants(data: GroupActionRequest, current_user: User = Depends(get_current_user)):
    """Remueve participantes de un grupo."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, data.jid, group_only=True)
    await sio.emit('remove_group_participants', {
        "jid": data.jid,
        "participants": data.participants,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

class SetAdminRequest(BaseModel):
    jid: str
    participant: str
    action: str  # "promote" or "demote"

@app.post("/api/groups/set-admin")
async def set_group_admin(data: SetAdminRequest, current_user: User = Depends(get_current_user)):
    """Promueve o degrada a un admin."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, data.jid, group_only=True)
    if data.action not in ("promote", "demote"):
        raise HTTPException(status_code=400, detail="Acción no válida")
    
    await sio.emit('set_group_admin', {
        "jid": data.jid,
        "participant": data.participant,
        "action": data.action,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

@app.post("/api/groups/leave")
async def leave_group(jid: str, current_user: User = Depends(get_current_user)):
    """Sale de un grupo."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, jid, group_only=True)
    await sio.emit('leave_group', {
        "jid": jid,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

# ============================================================
# ESTADOS (STORIES)
# ============================================================

@app.get("/api/status")
async def get_status_list(current_user: User = Depends(get_current_user)):
    """Obtiene la lista de estados (stories)."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    await sio.emit('request_status_list', {
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

class PostStatusRequest(BaseModel):
    media_type: Optional[str] = None
    media_base64: Optional[str] = None
    caption: Optional[str] = ""
    background_color: Optional[str] = None

@app.post("/api/status/post")
async def post_status(data: PostStatusRequest, current_user: User = Depends(get_current_user)):
    """Publica un estado (story)."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    await sio.emit('post_status', {
        "mediaType": data.media_type,
        "mediaBase64": data.media_base64,
        "caption": data.caption,
        "backgroundColor": data.background_color,
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

# ============================================================
# CONTACTOS: INFO Y BÚSQUEDA AVANZADA
# ============================================================

@app.get("/api/contacts/{jid}/info")
async def get_contact_info(jid: str, current_user: User = Depends(get_current_user)):
    """Obtiene información de un contacto."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, jid)
    await sio.emit('get_contact_info', {
        "jid": jid,
        "user_id": current_user.id,
        "device_id": contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success"}

# ============================================================
# ADJUNTAR MÚLTIPLES ARCHIVOS
# ============================================================

@app.post("/api/chat/send-media-multiple")
async def send_multiple_media(
    files: List[UploadFile] = File(...),
    to: str = Form(...),
    caption: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """Envía múltiples archivos a la vez."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    contact = require_user_contact(current_user.id, to)
    target_device_id = contact.get("device_id") or get_active_device_id_for_user(current_user.id)
    results = []
    
    for file in files:
        try:
            content = await file.read()
            b64_data = base64.b64encode(content).decode("utf-8")
            
            media_type = "document"
            if file.content_type.startswith("image/"):
                media_type = "image"
            elif file.content_type.startswith("video/"):
                media_type = "video"
            elif file.content_type.startswith("audio/"):
                media_type = "audio"
            
            await sio.emit("send_whatsapp_media", {
                "to": to,
                "mediaType": media_type,
                "base64Data": b64_data,
                "fileName": file.filename,
                "mimeType": file.content_type,
                "caption": caption if files.index(file) == 0 else "",
                "user_id": current_user.id,
                "device_id": target_device_id
            })
            
            results.append({"file": file.filename, "status": "sent"})
        except Exception as e:
            results.append({"file": file.filename, "status": "error", "error": str(e)})
    
    return {"status": "success", "results": results}

# ============================================================
# SINCRONIZACIÓN COMPLETA
# ============================================================

@app.post("/api/sync/full")
async def full_sync(current_user: User = Depends(get_current_user)):
    """Fuerza una sincronización completa desde WhatsApp."""
    ensure_active_whatsapp_belongs_to_user(current_user.id)
    await sio.emit('request_contacts_sync', {
        "user_id": current_user.id,
        "device_id": get_active_device_id_for_user(current_user.id)
    })
    return {"status": "success", "message": "Sincronización completa iniciada"}

@app.get("/api/sync/status")
async def get_sync_status(current_user: User = Depends(get_current_user)):
    """Obtiene el estado actual de la sincronización."""
    contacts = get_user_contacts_from_cache_or_db(current_user.id)
    user_jids = {c.get("whatsapp_id") for c in contacts if c.get("whatsapp_id")}
    return {
        "is_syncing": bool(contacts),
        "contacts_count": len(contacts),
        "chats_count": len([jid for jid in user_jids if get_chat_history_for_user(current_user.id, jid)])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(sio_app, host="0.0.0.0", port=8000)
