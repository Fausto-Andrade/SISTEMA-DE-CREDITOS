// backend/routes/rutas.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); 

// Endpoint para OBTENER rutas
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id_ruta, 
        r.nombre_ruta, 
        r.fecha, 
        u.username AS cobrador,
        r.id_user
      FROM rutas r
      INNER JOIN "users" u ON r.id_user = u.id 
      ORDER BY r.fecha DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("DETALLE DEL ERROR EN DB:", error.message);
    res.status(500).json({ error: 'Error al obtener las rutas' });
  }
});

// Endpoint para CREAR ruta (CON VALIDACIÓN DE DUPLICIDAD)
router.post('/', async (req, res) => {
    const { nombre_ruta, fecha, id_user } = req.body;
    
    // Normalizamos el nombre para evitar variaciones por mayúsculas/minúsculas
    const nombreNormalizado = nombre_ruta.trim().toUpperCase();

    try {
        // 1. VALIDACIÓN MANUAL: Verificamos si ya existe la combinación
        const checkQuery = 'SELECT * FROM rutas WHERE UPPER(nombre_ruta) = $1 AND id_user = $2';
        const checkResult = await pool.query(checkQuery, [nombreNormalizado, id_user]);

        if (checkResult.rows.length > 0) {
            // Enviamos 409 (Conflicto) para que React dispare la alerta amarilla
            return res.status(409).json({ 
                error: 'DUPLICADO', 
                message: 'Este cobrador ya tiene asignada esta ruta.' 
            });
        }

        // 2. SI NO EXISTE: Procedemos al INSERT
        const insertQuery = 'INSERT INTO rutas (nombre_ruta, fecha, id_user) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(insertQuery, [nombreNormalizado, fecha, id_user]);
        
        res.status(201).json(result.rows[0]);

    } catch (error) {
        // Manejo de errores de base de datos (por si falla la constraint física)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'DUPLICADO', message: 'Ruta ya existente.' });
        }
        
        console.error("ERROR CRÍTICO AL CREAR RUTA:", error);
        res.status(500).json({ error: 'Error interno del servidor al crear la ruta' });
    }
});

// Endpoint para ELIMINAR ruta
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM rutas WHERE id_ruta = $1', [req.params.id]);
        res.json({ message: 'Ruta eliminada' });
    } catch (error) {
        console.error("ERROR AL ELIMINAR:", error);
        res.status(500).json({ error: 'Error al eliminar la ruta' });
    }
});

module.exports = router;