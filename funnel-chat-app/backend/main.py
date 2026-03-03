from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

# Inicialización de FastAPI
app = FastAPI(title="Funnel Chat API")

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
    # Datos simulados que luego vendrán de la base de datos
    return {
        "leads": 1284,
        "conversations": 456,
        "conversion_rate": "12.4%",
        "automations": 28
    }

@app.get("/api/contacts")
async def get_contacts():
    return [
        {"id": 1, "name": "Juan Pérez", "email": "juan@example.com", "status": "Caliente", "tag": "Interesado"},
        {"id": 2, "name": "María Garcia", "email": "maria@example.com", "status": "Tibio", "tag": "Soporte"},
        {"id": 3, "name": "Carlos Ruiz", "email": "carlos@example.com", "status": "Frío", "tag": "Nuevo"},
    ]

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def message(sid, data):
    print(f"Message from {sid}: {data}")
    # Eco del mensaje para pruebas
    await sio.emit('response', {'text': f'Recibido: {data}', 'sender': 'bot'}, room=sid)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(sio_app, host="0.0.0.0", port=8000)
