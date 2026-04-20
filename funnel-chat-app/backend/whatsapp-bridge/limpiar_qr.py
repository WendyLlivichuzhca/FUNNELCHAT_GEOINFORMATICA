#!/usr/bin/env python3
"""
Limpieza automática de sesiones WhatsApp para FunnelChat
Detiene procesos, elimina auth_info_baileys, y da instrucciones
"""
import os
import subprocess
import sys
import webbrowser
from pathlib import Path

def main():
    print("=" * 60)
    print("  LIMPIEZA COMPLETA - QR DESDE 0")
    print("=" * 60)
    print()

    # 1. Detener procesos
    print("[1/4] Deteniendo procesos Python/Node...")
    try:
        subprocess.run(["taskkill", "/F", "/IM", "python.exe"], capture_output=True)
        subprocess.run(["taskkill", "/F", "/IM", "node.exe"], capture_output=True)
        print("   ✅ Procesos detenidos")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    print()

    # 2. Eliminar carpetas
    print("[2/4] Eliminando sesiones de WhatsApp...")
    bridge_path = Path(r"C:\Users\Wendy Llivichuzhca\Documents\GEOINFORMATICA\FUNNELCHAT_GEOINFORMATICA\funnel-chat-app\backend\whatsapp-bridge")
    
    auth_folder = bridge_path / "auth_info_baileys"
    sessions_folder = bridge_path / "sessions"
    
    if auth_folder.exists():
        import shutil
        shutil.rmtree(auth_folder)
        print("   ✅ auth_info_baileys eliminado")
    else:
        print("   ℹ️ No existía auth_info_baileys")
    
    if sessions_folder.exists():
        import shutil
        shutil.rmtree(sessions_folder)
        print("   ✅ sessions eliminado")
    print()

    # 3. Instrucciones IndexedDB
    print("[3/4] Para limpiar IndexedDB:")
    print("   Opción A: Abre http://localhost:5173/limpiar-db.html")
    print("   Opción B: F12 → Application → IndexedDB → Delete 'FunnelChatDB'")
    print()

    # 4. Abrir página de limpieza
    try:
        webbrowser.open("http://localhost:5173/limpiar-db.html")
        print("   🌐 Navegador abierto a página de limpieza")
    except:
        print("   ⚠️  Abre manualmente: http://localhost:5173/limpiar-db.html")
    print()

    print("[4/4] Comandos para reiniciar:")
    print("   cd funnel-chat-app/backend && python main.py")
    print("   cd funnel-chat-app/frontend && npm run dev")
    print()
    print("=" * 60)
    print("  ✅ ¡LISTO! Escanea el nuevo QR")
    print("=" * 60)
    input("\nPresiona Enter para salir...")

if __name__ == "__main__":
    main()