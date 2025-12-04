# 🚀 Guía de Despliegue

## Arquitectura

- **Frontend**: GitHub Pages (archivos HTML, CSS, JS)
- **Backend**: Render (API Python)

## 📋 Pasos para Desplegar

### 1. Backend en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Crea un nuevo **Web Service**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `ranking-api` (o el nombre que prefieras)
   - **Environment**: `Python 3`
   - **Build Command**: (dejar vacío)
   - **Start Command**: `python3 server.py`
   - **Plan**: Free (o el plan que prefieras)

5. Una vez desplegado, copia la URL del servicio (ej: `https://ranking-81qv.onrender.com`)

### 2. Configurar Frontend

1. Edita `assets/js/main.js`
2. Busca la línea con `RENDER_API_URL` (alrededor de la línea 22)
3. Actualiza con tu URL de Render:
   ```javascript
   const RENDER_API_URL = 'https://tu-servicio-render.onrender.com';
   ```
4. Asegúrate de que `USE_LOCAL_SERVER = false` (línea 18)

### 3. Frontend en GitHub Pages

1. Sube tu código a GitHub:
   ```bash
   git add .
   git commit -m "Configurar para GitHub Pages + Render"
   git push origin main
   ```

2. Ve a tu repositorio en GitHub
3. Settings → Pages
4. Source: selecciona la rama `main` (o `master`)
5. Folder: `/root` (o la carpeta donde está `index.html`)
6. Guarda

7. Tu sitio estará disponible en: `https://tu-usuario.github.io/tu-repo/`

## ⚙️ Configuración del Código

### Variables de Configuración en `main.js`:

```javascript
// Línea 18: Cambiar entre local y Render
const USE_LOCAL_SERVER = false; // false = usa Render en producción

// Línea 22: URL de tu servidor en Render
const RENDER_API_URL = 'https://ranking-81qv.onrender.com';
```

### Comportamiento:

- **`USE_LOCAL_SERVER = false`** (recomendado para producción):
  - En localhost: usa `http://localhost:8000`
  - En GitHub Pages: usa `https://ranking-81qv.onrender.com`

- **`USE_LOCAL_SERVER = true`** (solo desarrollo local):
  - Siempre usa `http://localhost:8000`
  - Requiere tener el servidor corriendo localmente

## 📁 Archivos Necesarios

### Para GitHub Pages (Frontend):
- ✅ `index.html`
- ✅ `admin.html`
- ✅ `assets/` (css, js, data)
- ❌ NO incluir: `server.py`, `server.js`, `requirements.txt`, `Procfile`, `runtime.txt`

### Para Render (Backend):
- ✅ `server.py`
- ✅ `requirements.txt`
- ✅ `runtime.txt`
- ✅ `Procfile` (opcional)
- ✅ `assets/data/ranking.json` (archivo inicial)

## 🔍 Verificar que Funciona

1. **Frontend en GitHub Pages**:
   - Abre tu sitio en GitHub Pages
   - Abre la consola del navegador (F12)
   - Deberías ver: `🔧 Configuración del servidor: { API_BASE: "https://ranking-81qv.onrender.com" }`

2. **Backend en Render**:
   - Ve a tu dashboard de Render
   - Verifica que el servicio esté "Live"
   - Prueba: `https://tu-servicio.onrender.com/api/ranking`

## 🐛 Solución de Problemas

### El frontend no se conecta al backend:
- Verifica que `USE_LOCAL_SERVER = false`
- Verifica que la URL de Render sea correcta
- Revisa la consola del navegador para ver errores de CORS

### Error 500 en Render:
- Verifica los logs en Render Dashboard
- Asegúrate de que `assets/data/ranking.json` exista en el repositorio
- Verifica que el archivo `server.py` esté en la raíz

### CORS Errors:
- El servidor ya tiene CORS configurado
- Si hay problemas, verifica que `send_cors_headers()` se esté llamando

