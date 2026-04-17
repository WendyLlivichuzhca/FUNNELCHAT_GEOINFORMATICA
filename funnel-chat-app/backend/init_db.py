#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de Inicialización de Base de Datos para FunnelChat
Este script crea todas las tablas necesarias desde los modelos de SQLAlchemy
"""

import os
import sys
from pathlib import Path

# Evita errores de consola en Windows cuando el terminal no soporta emojis/UTF-8.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Agregar el directorio actual al path
sys.path.insert(0, str(Path(__file__).parent))

# Cargar variables de entorno
from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=str(env_path))

print("=" * 70)
print("INICIALIZACIÓN DE BASE DE DATOS - FunnelChat")
print("=" * 70)

# Mostrar configuración
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./devices.db")
print(f"\n📊 URL de Base de Datos: {DATABASE_URL}")
print(f"📁 Ruta del archivo .env: {env_path}")

# Importar SQLAlchemy
try:
    from sqlalchemy import create_engine, text, inspect
    print("✓ SQLAlchemy importado correctamente")
except ImportError as e:
    print(f"✗ Error: No se pudo importar SQLAlchemy: {e}")
    sys.exit(1)

# Crear el engine
try:
    print("\n🔧 Creando conexión a la base de datos...")
    engine = create_engine(DATABASE_URL, echo=False)

    # Probar la conexión
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        conn.commit()
    print("✓ Conexión exitosa a la base de datos")
except Exception as e:
    print(f"✗ Error al conectar a la base de datos: {e}")
    sys.exit(1)

# Importar los modelos DESPUÉS de crear el engine
try:
    print("\n📦 Importando modelos de base de datos...")
    # Importar sin ejecutar el servidor
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, DateTime

    # Re-crear el Base sin que main.py interfiera
    Base = declarative_base()

    # Copiar las definiciones de modelos
    from datetime import datetime

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

    class ContactDB(Base):
        __tablename__ = "contactos"
        id = Column(Integer, primary_key=True, autoincrement=True)
        dispositivo_id = Column(Integer, ForeignKey("dispositivos.id"), nullable=False)
        jid = Column(String(100), nullable=False, index=True)
        telefono = Column(String(30), nullable=False, default="")
        nombre = Column(String(150), nullable=True)
        foto_perfil = Column(String(500), nullable=True)
        correo = Column(String(150), nullable=True)
        empresa = Column(String(150), nullable=True)
        estado_lead = Column(String(20), default='nuevo')
        mensajes_sin_leer = Column(Integer, default=0)
        ultimo_mensaje = Column(Text, nullable=True)
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
        estado = Column(Integer, default=0)
        fecha_mensaje = Column(DateTime, nullable=False, default=datetime.utcnow)
        creado_en = Column(DateTime, default=datetime.utcnow)

    print("✓ Modelos importados correctamente")
except Exception as e:
    print(f"✗ Error al importar los modelos: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Crear todas las tablas
try:
    print("\n🏗️  Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas creadas/verificadas exitosamente")
except Exception as e:
    print(f"✗ Error al crear las tablas: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Verificar que las tablas existen
try:
    print("\n✔️  Verificando tablas creadas...")
    inspector = inspect(engine)
    tablas = inspector.get_table_names()

    tablas_esperadas = ['usuarios', 'dispositivos', 'contactos', 'mensajes']

    for tabla in tablas_esperadas:
        if tabla in tablas:
            print(f"  ✓ Tabla '{tabla}' existe")
        else:
            print(f"  ✗ Tabla '{tabla}' NO existe")

    print(f"\nTablas en la base de datos: {', '.join(tablas) if tablas else 'Ninguna'}")
except Exception as e:
    print(f"⚠️  No se pudo verificar las tablas: {e}")

print("\n" + "=" * 70)
print("✅ INICIALIZACIÓN COMPLETADA")
print("=" * 70)
print("\nAhora puedes iniciar el servidor con:")
print("  python -m uvicorn main:sio_app --reload --host 0.0.0.0 --port 8000")
print("\nO usa el script: run_server.bat")
print("")
