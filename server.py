#!/usr/bin/env python3
"""
Servidor para el Sistema de Ranking Organizacional
Proporciona APIs para guardar y cargar datos del ranking
"""

import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

# Render usa la variable de entorno PORT, si no existe usa 8000 para desarrollo local
PORT = int(os.environ.get('PORT', 8000))
RANKING_FILE = 'assets/data/ranking.json'

class RankingHandler(http.server.SimpleHTTPRequestHandler):
    
    def send_cors_headers(self):
        """Enviar headers CORS en todas las respuestas"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def do_OPTIONS(self):
        """Manejar CORS preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-Length', '0')
        self.end_headers()
        print('🔄 OPTIONS request handled')
    
    def do_GET(self):
        parsed = urlparse(self.path)
        
        # API para obtener ranking
        if parsed.path == '/api/ranking':
            self.send_ranking_data()
        else:
            # Servir archivos estáticos
            super().do_GET()
    
    def do_POST(self):
        parsed = urlparse(self.path)
        print(f'📨 POST request to: {parsed.path}')
        
        if parsed.path == '/api/ranking/save':
            self.save_ranking_data()
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not Found'}).encode('utf-8'))
    
    def send_ranking_data(self):
        """Envía los datos del ranking como JSON"""
        try:
            # Verificar si el archivo existe
            if not os.path.exists(RANKING_FILE):
                # Crear archivo con datos vacíos si no existe
                os.makedirs(os.path.dirname(RANKING_FILE), exist_ok=True)
                default_data = {'ranking': []}
                with open(RANKING_FILE, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2, ensure_ascii=False)
                data = default_data
                print(f'⚠️ GET /api/ranking - Archivo creado con datos vacíos')
            else:
                with open(RANKING_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            print(f'✅ GET /api/ranking - {len(data.get("ranking", []))} colaboradores')
            
        except Exception as e:
            print(f'❌ GET /api/ranking - Error: {e}')
            import traceback
            traceback.print_exc()
            
            # Enviar respuesta de error con datos vacíos como fallback
            self.send_response(200)  # 200 en lugar de 500 para que el cliente pueda funcionar
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            fallback_data = {'ranking': []}
            self.wfile.write(json.dumps(fallback_data, ensure_ascii=False).encode('utf-8'))
    
    def save_ranking_data(self):
        """Guarda los datos del ranking en el archivo JSON"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            print(f'📥 Recibiendo {content_length} bytes...')
            
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            print(f'📦 Datos recibidos: {list(data.keys())}')
            
            if 'data' not in data or not isinstance(data['data'], list):
                self.send_response(400)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Datos inválidos - se requiere "data" como array'}).encode('utf-8'))
                print('❌ POST /api/ranking/save - Datos inválidos')
                return
            
            ranking_data = {'ranking': data['data']}
            
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(RANKING_FILE), exist_ok=True)
            
            # Guardar archivo
            with open(RANKING_FILE, 'w', encoding='utf-8') as f:
                json.dump(ranking_data, f, indent=2, ensure_ascii=False)
            
            count = len(data['data'])
            print(f'✅ POST /api/ranking/save - {count} colaboradores guardados')
            
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            response = {
                'success': True,
                'message': f'Se guardaron {count} colaboradores en ranking.json',
                'count': count
            }
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except json.JSONDecodeError as e:
            self.send_response(400)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'JSON inválido: {str(e)}'}).encode('utf-8'))
            print(f'❌ POST /api/ranking/save - JSON inválido: {e}')
            
        except Exception as e:
            print(f'❌ Error guardando datos: {e}')
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Personalizar mensajes de log"""
        message = format % args
        if '/api/' not in message and 'OPTIONS' not in message:
            print(f"📄 {message}")

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    with ReusableTCPServer(("", PORT), RankingHandler) as httpd:
        print(f"\n{'='*50}")
        print(f"🚀 Servidor ejecutándose en: http://localhost:{PORT}")
        print(f"📊 Ranking: http://localhost:{PORT}")
        print(f"⚙️  Admin: http://localhost:{PORT}/admin.html")
        print(f"{'='*50}")
        print(f"\n💡 Presiona Ctrl+C para detener el servidor\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Servidor detenido")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
    run_server()
