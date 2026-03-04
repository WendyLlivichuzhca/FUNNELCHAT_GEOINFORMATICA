from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import socketio
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

class RegisterRequest(BaseModel):
    username: str
    password: str

# Configuración de Base de Datos (SQLAlchemy)
SQLALCHEMY_DATABASE_URL = "sqlite:///./devices.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Seguridad y JWT
SECRET_KEY = "super-secret-key-for-funnel-chat" # Cambiar en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 semana

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    devices = relationship("Device", back_populates="owner")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_name = Column(String, nullable=False)
    status = Column(String, nullable=False) # 'conectado' o 'desconectado'
    phone = Column(String, nullable=True)
    
    owner = relationship("User", back_populates="devices")

Base.metadata.create_all(bind=engine)

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

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

import subprocess
import os
from contextlib import asynccontextmanager

bridge_process = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global bridge_process
    print("Iniciando el puente de WhatsApp (Node.js)...")
    bridge_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whatsapp-bridge")
    bridge_script = os.path.join(bridge_dir, "bridge.js")
    
    try:
        # Se inicia en segundo plano sin bloquear el hilo principal de Python
        bridge_process = subprocess.Popen(
            ["node", bridge_script],
            cwd=bridge_dir
        )
        print("Puente de WhatsApp iniciado automáticamente.")
    except Exception as e:
        print(f"Error al iniciar el puente de WhatsApp: {e}")
        
    yield # Aquí el backend está corriendo
    
    if bridge_process:
        print("Deteniendo el puente de WhatsApp...")
        bridge_process.terminate()
        try:
            bridge_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            bridge_process.kill()
        print("Puente de WhatsApp detenido.")

# Inicialización de FastAPI
app = FastAPI(title="Funnel Chat API", lifespan=lifespan)

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


# Configuración de CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de Socket.io para tiempo real
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.get("/")
async def root():
    return {"message": "Funnel Chat API is running", "status": "online"}

@app.get("/api/stats")
async def get_stats():
    campaigns_count = len(campaigns_db)
    total_contacts = sum(len(v) for v in contacts_mock_db.values())
    return {
        "leads": total_contacts or 387,
        "conversations": 42,
        "conversion_rate": "18.5%",
        "automations": campaigns_count + 12
    }

# Almacenamiento de contactos por usuario (user_id -> list of contacts)
contacts_mock_db = {}  # user_id -> list of contacts

# Sesión QR activa: rastrear qué usuario está esperando vinculación
qr_sessions = {}  # device_id -> user_id  (qué usuario inició el escaneo)
active_qr_user_id = None  # El último user_id que inició una sesión QR

@app.post("/token")
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(data.password)
    new_user = User(username=data.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Crear dispositivos iniciales para el nuevo usuario
    d1 = Device(user_id=new_user.id, device_name="WhatsApp Personal", status="desconectado", phone="Sin registro")
    d2 = Device(user_id=new_user.id, device_name="WhatsApp Empresa", status="desconectado", phone="Sin registro")
    db.add_all([d1, d2])
    db.commit()
    
    return {"status": "success", "message": "User created", "user_id": new_user.id}

@app.get("/api/contacts")
async def get_contacts(current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if user_id not in contacts_mock_db:
        contacts_mock_db[user_id] = [
            {"id": 1, "name": "Agrega tus contactos vinculando WhatsApp", "email": "", "status": "Info", "tag": "Sistema", "notes": "Escanea el QR en Dashboard para importar tus contactos reales."}
        ]
    return contacts_mock_db[user_id]

@app.put("/api/contacts/{contact_id}")
async def update_contact(contact_id: int, data: dict):
    global contacts_db
    for contact in contacts_db:
        if contact["id"] == contact_id:
            contact.update(data)
            return {"status": "success", "message": "Contacto actualizado"}
    return {"status": "error", "message": "Contacto no encontrado"}

# Almacenamiento de Campañas
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

# Almacenamiento temporal en memoria (luego será base de datos)
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
    current_id = data.get("current_node_id") # Soporte para sesión de prueba
    
    def find_next(cid, msg):
        out_edges = [e for e in edges if e["source"] == cid]
        if not cid:
            # Buscar disparador inicial
            for n in nodes:
                if msg.lower() in n.get("data", {}).get("label", "").lower(): return n
            return nodes[0] if nodes else None
        
        if not out_edges: return None
        
        curr_n = next((n for n in nodes if n["id"] == cid), None)
        if curr_n and curr_n["type"] == "condition":
            # Lógica de decisión mejorada
            is_pos = any(w in msg.lower() for w in ["si", "yes", "ok", "claro", "quiero", "acepto"])
            target = "yes" if is_pos else "no"
            edge = next((e for e in out_edges if e.get("sourceHandle") == target), out_edges[0])
            return next((n for n in nodes if n["id"] == edge["target"]), None)
        
        return next((n for n in nodes if n["id"] == out_edges[0]["target"]), None)

    next_node = find_next(current_id, message)
    if next_node:
        return {"response": next_node["data"]["label"], "node_id": next_node["id"]}
    return {"response": "Fin del flujo de prueba.", "node_id": None}

@app.get("/api/devices")
async def get_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    devices = db.query(Device).filter(Device.user_id == current_user.id).all()
    return devices

@app.post("/api/devices/start-qr")
async def start_qr_session(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """El frontend llama a este endpoint cuando el usuario abre el modal QR.
    Registramos qué user_id inició la sesión para asociar los contactos después."""
    global active_qr_user_id
    device_id = data.get("device_id")
    active_qr_user_id = current_user.id
    if device_id:
        qr_sessions[device_id] = current_user.id
    
    print(f"[QR SESSION] Usuario {current_user.username} (id={current_user.id}) inició sesión QR")
    
    # IMPORTANTE: Pedir al puente su estado actual por si ya está conectado
    print("--- [MAIN.PY] SOLICITANDO ESTADO ACTUAL AL PUENTE ---")
    await sio.emit('request_whatsapp_status', {})
    
    return {"status": "ok", "user_id": current_user.id}

@app.post("/connect_device")
async def connect_device(data: dict, db: Session = Depends(get_db)):
    device_id = data.get("device_id")
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.status = "conectado"
        db.commit()
        db.refresh(device)
        # Emitir cambio en tiempo real
        await sio.emit('device_status', {"device_id": device.id, "status": "conectado"})
        return {"message": f"Dispositivo {device.device_name} conectado"}
    return {"message": "Dispositivo no encontrado"}, 404

@app.post("/disconnect_device")
async def disconnect_device(data: dict, db: Session = Depends(get_db)):
    device_id = data.get("device_id")
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.status = "desconectado"
        db.commit()
        db.refresh(device)
        # Emitir cambio en tiempo real
        await sio.emit('device_status', {"device_id": device.id, "status": "desconectado"})
        return {"message": f"Dispositivo {device.device_name} desconectado"}
    return {"message": "Dispositivo no encontrado"}, 404

# Alias para compatibilidad con el dashboard previo
@app.post("/api/devices/{device_id}/toggle")
async def toggle_device(device_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == current_user.id).first()
    if device:
        new_status = "conectado" if device.status == "desconectado" else "desconectado"
        device.status = new_status
        db.commit()
        await sio.emit('device_status', {"device_id": device.id, "status": new_status})
        return {"status": "success", "device": device}
    return {"status": "error", "message": "Dispositivo no encontrado o no pertenece a este usuario"}

# --- MOTOR DE INTELIGENCIA DE FLUJOS ---
user_states = {} # contact_id -> current_node_id
chat_histories = {} # contact_id -> list of messages

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

@app.get("/api/chat/{contact_id}")
async def get_chat_history(contact_id: str):
    if not contact_id or contact_id == "null" or contact_id == "undefined":
        return []

    # Intentamos encontrar el JID del contacto si es un ID numérico
    db_contacts = []
    for u_id in contacts_mock_db:
        db_contacts.extend(contacts_mock_db[u_id])
    
    contact = next((c for c in db_contacts if str(c.get("id")) == str(contact_id)), None)
    wid = contact.get("whatsapp_id") if contact else (contact_id if "@" in contact_id else None)

    if not wid:
        print(f">>> [BACKEND] No se encontró JID para el ID: {contact_id}")
        return []

    local_history = chat_histories.get(wid, [])
    if not local_history:
        print(f">>> [BACKEND] PIDIENDO HISTORIAL REAL AL PUENTE PARA WID: {wid}")
        await sio.emit('request_chat_history', {"contact_id": wid})
    
    return local_history

@sio.on('whatsapp_history_response')
async def handle_whatsapp_history(sid, data):
    contact_id = data.get("contact_id")
    history = data.get("history", [])
    print(f">>> [BACKEND] RECIBIDO HISTORIAL DE {len(history)} MENSAJES PARA {contact_id}")
    # Guardar en caché local temporal
    chat_histories[contact_id] = history
    # Notificar al frontend para que refresque
    await sio.emit('history_ready', {"contact_id": contact_id, "history": history})

# --- EVENTOS DEL PUENTE WHATSAPP (NODE.JS) ---

@sio.on('whatsapp_qr')
async def handle_whatsapp_qr(sid, data):
    qr_code = data.get("qr")
    print(f">>> [SOCKET] QR RECIBIDO DEL PUENTE. RETRANSMITIENDO A FRONTEND...")
    await sio.emit('whatsapp_qr_ready', {"qr": qr_code})
    print(f">>> [SOCKET] EVENTO 'whatsapp_qr_ready' EMITIDO AL FRONTEND")

@sio.on('whatsapp_status')
async def handle_whatsapp_status(sid, data):
    status_val = data.get("status")
    print(f">>> [SOCKET] ESTADO RECIBIDO: {status_val}")
    
    db = SessionLocal()
    try:
        # Prioridad 1: El usuario que está intentando conectar ahora
        # Prioridad 2: Buscar si hay algún dispositivo ya conectado que necesite refrescar su estado
        device = None
        if active_qr_user_id:
            device = db.query(Device).filter(
                Device.user_id == active_qr_user_id,
                Device.device_name == "WhatsApp Personal"
            ).first()
        
        if not device:
            # Fallback seguro: No pillar ID 1 a ciegas, buscar quién está marcado como conectado
            device = db.query(Device).filter(
                Device.device_name == "WhatsApp Personal",
                Device.status == "conectado"
            ).first()
        
        # Si sigue sin haber nada, entonces cogemos el primero (Wendy ID 3 en su caso)
        if not device:
            device = db.query(Device).filter(Device.device_name == "WhatsApp Personal").first()
        
        if device:
            device.status = "conectado" if status_val == "conectado" else "desconectado"
            db.commit()
            print(f"--- [MAIN.PY] Dispositivo '{device.device_name}' del user_id={device.user_id} -> {device.status} ---")
            await sio.emit('device_status', {"device_id": device.id, "status": device.status})
    finally:
        db.close()

@sio.on('whatsapp_message')
async def handle_whatsapp_message(sid, data):
    # Simular entrada de mensaje para el motor de flujos
    print(f"MENSAJE REAL RECIBIDO: {data}")
    await message(sid, {"text": data.get("body"), "contact_id": 1})

@sio.on('whatsapp_contacts')
async def handle_whatsapp_contacts(sid, data):
    new_contacts = data.get("contacts", [])
    target_user_id = active_qr_user_id  # El usuario que inició el escaneo QR
    
    # Fallback: Si no hay usuario activo (conexión automática al arrancar), buscar quién es el dueño del dispositivo
    if target_user_id is None:
        db = SessionLocal()
        try:
            device = db.query(Device).filter(Device.device_name == "WhatsApp Personal", Device.status == "conectado").first()
            if device:
                target_user_id = device.user_id
                print(f"--- [MAIN.PY] Fallback: Asignando contactos al dueño del dispositivo (user_id={target_user_id}) ---")
        finally:
            db.close()

    print(f"--- [MAIN.PY] RECIBIDOS {len(new_contacts)} CONTACTOS - asignando a user_id={target_user_id} ---")
    
    if target_user_id is None:
        print("[WARN] No hay usuario activo ni dispositivo conectado para asociar contactos. Ignorando.")
        return
    
    # Inicializar lista del usuario si no existe
    if target_user_id not in contacts_mock_db:
        contacts_mock_db[target_user_id] = []
    
    existing_nums = {c.get("phone") for c in contacts_mock_db[target_user_id]}
    synced_count = 0
    for wc in new_contacts:
        num = wc.get("number") or (wc.get("id", "").split("@")[0])
        name = wc.get("name", num)
        if num and num not in existing_nums:
            new_contact = {
                "id": len(contacts_mock_db[target_user_id]) + 1,
                "whatsapp_id": wc.get("id"), # Guardamos el JID real
                "name": name,
                "phone": num,
                "email": f"{num}@whatsapp.com",
                "status": "Nuevo",
                "tag": "WhatsApp",
                "notes": f"Importado desde WhatsApp"
            }
            contacts_mock_db[target_user_id].append(new_contact)
            existing_nums.add(num)
            synced_count += 1
    
    print(f">>> [BACKEND] PROCESANDO {synced_count} CONTACTOS NUEVOS...")
    
    # Emitir broadcast para que cualquier pestaña del usuario se actualice
    print(f">>> [BACKEND] EMITIENDO 'contacts_updated' AL FRONTEND (Total: {len(contacts_mock_db.get(target_user_id, []))})")
    await sio.emit('contacts_updated', {"count": synced_count, "user_id": target_user_id})

@app.post("/api/devices/logout")
async def logout_device(current_user: User = Depends(get_current_user)):
    print(f"--- [MAIN.PY] USUARIO {current_user.id} SOLICITA LOGOUT DE WHATSAPP ---")
    await sio.emit('whatsapp_logout', {})
    
    db = SessionLocal()
    try:
        device = db.query(Device).filter(Device.user_id == current_user.id, Device.device_name == "WhatsApp Personal").first()
        if device:
            device.status = "desconectado"
            db.commit()
            await sio.emit('device_status', {"device_id": device.id, "status": "desconectado"})
    finally:
        db.close()
        
    return {"status": "success", "message": "Orden de logout enviada"}

@app.post("/api/sync_contacts")
async def sync_contacts():
    # Enviar comando al puente para que sincronice
    print("--- [MAIN.PY] SOLICITANDO SINCRONIZACIÓN MANUAL AL PUENTE ---")
    await sio.emit('request_contacts_sync', {})
    return {"status": "success", "message": "Petición de sincronización enviada"}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def message(sid, data):
    # Obtener contact_id dinámico del mensaje
    contact_id = data.get("contact_id", 1) if isinstance(data, dict) else 1
    text = data.get("text", data) if isinstance(data, dict) else data
    
    if contact_id not in chat_histories: chat_histories[contact_id] = []
    chat_histories[contact_id].append({"id": len(chat_histories[contact_id]), "text": text, "sender": "user"})
    
    current_node_id = user_states.get(contact_id)
    next_node = get_next_node(current_node_id, text)
    
    if next_node:
        user_states[contact_id] = next_node["id"]
        bot_response = next_node["data"]["label"]
        
        # LÓGICA DE ACTUALIZACIÓN DEL CRM:
        # Si el nodo contiene palabras clave como "comprar" o "interesado", subir temperatura
        if any(w in bot_response.lower() for w in ["precio", "comprar", "oferta"]):
            for contact in contacts_db:
                if contact["id"] == contact_id: contact["status"] = "Caliente"

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(sio_app, host="0.0.0.0", port=8000)
