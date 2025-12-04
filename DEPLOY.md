# 🚀 Guía Rápida de Despliegue

## ✅ Configuración Actual

Tu aplicación ya está configurada para:
- **Frontend**: GitHub Pages
- **Backend**: Render (`https://ranking-81qv.onrender.com`)

## 📝 Pasos para Desplegar

### 1. Subir Frontend a GitHub

```bash
git add .
git commit -m "Configurar para producción"
git push origin main
```

### 2. Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. **Source**: Selecciona `main` branch
4. **Folder**: `/ (root)`
5. Click **Save**

Tu sitio estará en: `https://tu-usuario.github.io/tu-repo/`

### 3. Verificar Backend en Render

- Tu backend ya está en: `https://ranking-81qv.onrender.com`
- Verifica que esté "Live" en el dashboard de Render

## ⚙️ Cambiar Configuración

### Para usar servidor LOCAL (solo desarrollo):

Edita `assets/js/main.js` línea **18**:
```javascript
const USE_LOCAL_SERVER = true; // Cambiar a true
```

### Para usar servidor RENDER (producción):

Edita `assets/js/main.js` línea **18**:
```javascript
const USE_LOCAL_SERVER = false; // Dejar en false
```

## 🔍 Verificar que Funciona

1. Abre tu sitio en GitHub Pages
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   🔧 Configuración del servidor: {
     USE_LOCAL_SERVER: false,
     isProduction: true,
     API_BASE: "https://ranking-81qv.onrender.com"
   }
   ```

## 📁 Estructura del Repositorio

```
rnk-main/
├── index.html          # ✅ Frontend (GitHub Pages)
├── admin.html          # ✅ Frontend (GitHub Pages)
├── assets/             # ✅ Frontend (GitHub Pages)
│   ├── css/
│   ├── js/
│   └── data/
├── server.py          # ✅ Backend (Render)
├── requirements.txt   # ✅ Backend (Render)
├── runtime.txt        # ✅ Backend (Render)
└── Procfile           # ✅ Backend (Render)
```

**Nota**: Todos los archivos pueden estar en el mismo repositorio. GitHub Pages solo servirá los archivos HTML/CSS/JS, y Render solo usará los archivos del backend.

