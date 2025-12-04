# Configuración para Render

## Pasos para desplegar en Render

### 1. Configurar el servicio en Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Crea un nuevo **Web Service**
3. Conecta tu repositorio de GitHub/GitLab
4. Configura:
   - **Name**: `ranking-api` (o el nombre que prefieras)
   - **Environment**: `Python 3`
   - **Build Command**: (dejar vacío o `python3 -m pip install -r requirements.txt`)
   - **Start Command**: `python3 server.py`
   - **Plan**: Free (o el plan que prefieras)

### 2. Obtener la URL de tu servicio

Una vez desplegado, Render te dará una URL como:
```
https://tu-servicio-render.onrender.com
```

### 3. Actualizar el código JavaScript

Edita el archivo `assets/js/main.js` y busca esta línea (alrededor de la línea 18):

```javascript
const RENDER_API_URL = 'https://tu-servicio-render.onrender.com'; // 👈 CAMBIA ESTO
```

Reemplaza `tu-servicio-render` con el nombre real de tu servicio en Render.

### 4. Subir los cambios

```bash
git add .
git commit -m "Configurar para Render"
git push
```

### 5. Verificar que funciona

1. Abre tu aplicación web (GitHub Pages, Netlify, etc.)
2. Abre la consola del navegador (F12)
3. Deberías ver mensajes como:
   - `✅ Datos cargados desde servidor: X colaboradores`
   - `✅ Datos guardados en ranking.json`

## Estructura de archivos necesarios

```
rnk-main/
├── server.py          # Servidor Python
├── requirements.txt   # Dependencias (vacío, no se necesitan)
├── runtime.txt        # Versión de Python
├── assets/
│   ├── data/
│   │   └── ranking.json  # Archivo de datos inicial
│   └── js/
│       └── main.js    # Código JavaScript (actualizado con URL de Render)
└── ...
```

## Notas importantes

- **Render Free Plan**: El servicio se "duerme" después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en despertar.
- **Persistencia**: Los datos se guardan en el archivo `ranking.json` en el servidor de Render.
- **CORS**: El servidor ya está configurado para permitir peticiones desde cualquier origen.

## Solución de problemas

### El servicio no responde
- Verifica que el servicio esté "Live" en el dashboard de Render
- Revisa los logs en Render para ver errores
- Asegúrate de que la URL en `main.js` sea correcta

### Error de CORS
- El servidor ya tiene CORS configurado, pero si hay problemas, verifica los headers en `server.py`

### Datos no se guardan
- Verifica que el archivo `ranking.json` exista en `assets/data/`
- Revisa los logs del servidor en Render
- Verifica que la URL de la API sea correcta

