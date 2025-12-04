const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuración de multer para subir archivos
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos CSV'), false);
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static('.')); // Servir archivos estáticos

// Ruta para obtener los datos actuales
app.get('/api/ranking', (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'assets/data/ranking.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error leyendo ranking.json:', error);
        res.status(500).json({ error: 'Error leyendo datos' });
    }
});

// Ruta para guardar datos (usado después de importar CSV)
app.post('/api/ranking/save', (req, res) => {
    try {
        const { data } = req.body;
        
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const dataPath = path.join(__dirname, 'assets/data/ranking.json');
        const jsonContent = {
            ranking: data
        };

        fs.writeFileSync(dataPath, JSON.stringify(jsonContent, null, 2), 'utf8');
        console.log(`✅ ranking.json actualizado con ${data.length} colaboradores`);
        
        res.json({ 
            success: true, 
            message: `Se guardaron ${data.length} colaboradores en ranking.json`,
            count: data.length 
        });
    } catch (error) {
        console.error('Error guardando ranking.json:', error);
        res.status(500).json({ error: 'Error guardando datos' });
    }
});

// Ruta para importar CSV
app.post('/api/ranking/import-csv', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió archivo' });
        }

        const filePath = req.file.path;
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'CSV debe tener encabezados y datos' });
        }

        // Parsear CSV
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length >= 2) {
                data.push({
                    nombre: values[0] || '',
                    area: values[1] || '',
                    cargo: values[2] || '',
                    puntos: Number(values[3]) || 0
                });
            }
        }

        if (data.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'No se encontraron datos válidos' });
        }

        // Guardar en ranking.json
        const dataPath = path.join(__dirname, 'assets/data/ranking.json');
        const jsonContent = { ranking: data };
        fs.writeFileSync(dataPath, JSON.stringify(jsonContent, null, 2), 'utf8');

        // Guardar en localStorage del servidor (opcional, para sesiones)
        fs.writeFileSync(
            path.join(__dirname, 'assets/data/ranking-backup.json'), 
            JSON.stringify(jsonContent, null, 2), 
            'utf8'
        );

        // Limpiar archivo temporal
        fs.unlinkSync(filePath);

        console.log(`✅ CSV importado: ${data.length} colaboradores guardados en ranking.json`);
        
        res.json({ 
            success: true, 
            message: `Se importaron ${data.length} colaboradores correctamente`,
            data: data 
        });
    } catch (error) {
        console.error('Error importando CSV:', error);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({ error: 'Error procesando archivo: ' + error.message });
    }
});

// Función auxiliar para parsear líneas CSV
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ';' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
    console.log(`📊 Ranking disponible en: http://localhost:${PORT}`);
    console.log(`⚙️ Panel Admin disponible en: http://localhost:${PORT}/admin.html\n`);
});
