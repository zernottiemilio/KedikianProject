#!/usr/bin/env python3
"""
Servidor Mock para probar el frontend Angular
Ejecutar: python mock-backend.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Usuarios de prueba
USUARIOS_PRUEBA = {
    "admin": {
        "password": "123456",
        "id": "1",
        "nombreUsuario": "admin",
        "rol": "administrador"
    },
    "operario": {
        "password": "123456", 
        "id": "2",
        "nombreUsuario": "operario",
        "rol": "operario"
    }
}

@app.route('/')
def home():
    return jsonify({
        "message": "Backend Mock funcionando",
        "endpoints": {
            "login": "/api/v1/login",
            "docs": "/docs"
        }
    })

@app.route('/api/v1/login', methods=['POST'])
def login():
    try:
        # Obtener datos del formulario
        form_data = request.get_data().decode('utf-8')
        print(f"📦 Datos recibidos: {form_data}")
        
        # Parsear username y password
        params = dict(item.split('=') for item in form_data.split('&'))
        
        # Decodificar de base64
        username_b64 = params.get('username', '')
        password_b64 = params.get('password', '')
        
        username = base64.b64decode(username_b64).decode('utf-8')
        password = base64.b64decode(password_b64).decode('utf-8')
        
        print(f"🔐 Credenciales decodificadas: {username} / {password}")
        
        # Verificar usuario
        if username in USUARIOS_PRUEBA and USUARIOS_PRUEBA[username]["password"] == password:
            usuario = USUARIOS_PRUEBA[username].copy()
            usuario["token"] = f"mock_token_{username}_{hash(password)}"
            
            print(f"✅ Login exitoso para: {username}")
            return jsonify(usuario), 200
        else:
            print(f"❌ Login fallido para: {username}")
            return jsonify({"detail": "Incorrect username or password"}), 401
            
    except Exception as e:
        print(f"💥 Error en login: {str(e)}")
        return jsonify({"detail": "Error interno del servidor"}), 500

@app.route('/docs')
def docs():
    return """
    <html>
    <head><title>Backend Mock - Documentación</title></head>
    <body>
        <h1>🔧 Backend Mock - Documentación</h1>
        <h2>Endpoints Disponibles:</h2>
        <ul>
            <li><strong>POST /api/v1/login</strong> - Login con OAuth2PasswordRequestForm</li>
            <li><strong>GET /</strong> - Información del servidor</li>
        </ul>
        
        <h2>Usuarios de Prueba:</h2>
        <ul>
            <li><strong>admin</strong> / <strong>123456</strong> (rol: administrador)</li>
            <li><strong>operario</strong> / <strong>123456</strong> (rol: operario)</li>
        </ul>
        
        <h2>Formato de Request:</h2>
        <pre>
POST /api/v1/login
Content-Type: application/x-www-form-urlencoded

username=YWRtaW4=&password=MTIzNDU2
        </pre>
        
        <h2>Respuesta Exitosa:</h2>
        <pre>
{
  "id": "1",
  "nombreUsuario": "admin", 
  "rol": "administrador",
  "token": "mock_token_admin_123456"
}
        </pre>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("🚀 Iniciando Backend Mock en http://localhost:8000")
    print("📖 Documentación: http://localhost:8000/docs")
    print("🔐 Endpoint de login: http://localhost:8000/api/v1/login")
    print("👥 Usuarios de prueba:")
    print("   - admin / 123456")
    print("   - operario / 123456")
    print("\n💡 Para detener el servidor: Ctrl+C")
    
    app.run(host='0.0.0.0', port=8000, debug=True) 