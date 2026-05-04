const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const { obtenerCompradores } = require('../controllers/rutasController');
const { verificarToken, esAdmin } = require('../authMiddleware');

// --- 1. OBTENER LISTA DE COMPRADORES ---
router.get('/compradores', verificarToken, obtenerCompradores); 

// --- 2. LÓGICA REUTILIZABLE PARA OBTENER RUTAS (Manteniendo todas las columnas y estilos) ---
const getRutasLogic = async (req, res) => {
    const { role, id, id_comprador: adminCompanyId } = req.user;

    try {
        let query;
        let params = [];

        let baseQuery = `
            SELECT r.*, u.username AS nombre_cobrador, c.nombre_empresa
            FROM rutas r
            LEFT JOIN users u ON r.id_user = u.id 
            LEFT JOIN compradores c ON r.id_comprador = c.id_comprador
        `;

        if (role === 'super_admin') {
            query = `${baseQuery} ORDER BY r.fecha DESC`;
        } else if (role === 'admin') {
            query = `${baseQuery} WHERE r.id_comprador = $1 ORDER BY r.fecha DESC`;
            params = [adminCompanyId];
        } else {
            query = `${baseQuery} WHERE r.id_user = $1 ORDER BY r.fecha DESC`;
            params = [id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR AL OBTENER RUTAS:", error);
        res.status(500).json({ error: 'Error al obtener rutas' });
    }
};

router.get('/', verificarToken, getRutasLogic);
router.get('/todas', verificarToken, getRutasLogic);

// --- 3. FILTRAR POR EMPRESA ---
router.get('/por-empresa', verificarToken, async (req, res) => {
    const { id_comprador } = req.query; 
    try {
        const result = await pool.query('SELECT * FROM rutas WHERE id_comprador = $1', [id_comprador]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al filtrar rutas" });
    }
});

// --- 4. CREAR RUTA (Mantiene validaciones de límites y duplicidad) ---
router.post('/', verificarToken, async (req, res) => {
    const { nombre_ruta, fecha, id_user, id_comprador } = req.body;
    const { role, id: userIdToken } = req.user;
    
    if (!nombre_ruta || !id_comprador) {
        return res.status(400).json({ error: 'Nombre de ruta y Empresa son obligatorios' });
    }

    const nombreNormalizado = nombre_ruta.trim().toUpperCase();
    const finalUserId = (role === 'admin' || role === 'super_admin') ? id_user : userIdToken;

    try {
        // Validación de límite
        const compradorResult = await pool.query(
            'SELECT max_rutas_permitidas FROM compradores WHERE id_comprador = $1', 
            [id_comprador]
        );
        const rutasActuales = await pool.query(
            'SELECT COUNT(*) FROM rutas WHERE id_comprador = $1', 
            [id_comprador]
        );

        if (compradorResult.rowCount > 0) {
            const limite = compradorResult.rows[0].max_rutas_permitidas;
            const actuales = parseInt(rutasActuales.rows[0].count);
            if (limite > 0 && actuales >= limite) {
                return res.status(403).json({ 
                    message: `Límite alcanzado. Esta empresa solo tiene permitidas ${limite} rutas.` 
                });
            }
        }

        // Validar duplicidad
        const checkQuery = 'SELECT * FROM rutas WHERE UPPER(nombre_ruta) = $1 AND id_user = $2';
        const checkResult = await pool.query(checkQuery, [nombreNormalizado, finalUserId]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ 
                error: 'DUPLICADO', 
                message: 'Este cobrador ya tiene asignada esta ruta.' 
            });
        }

        const insertQuery = `
            INSERT INTO rutas (nombre_ruta, fecha, id_user, id_comprador) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [nombreNormalizado, fecha, finalUserId, id_comprador]);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("ERROR AL CREAR RUTA:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// --- 5. ACTUALIZAR RUTA (Ajustado para permitir asignación parcial) ---
router.put('/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { id_user, id_comprador, nombre_ruta } = req.body;

    try {
        let query;
        let params;

        // Si solo viene id_user (Asignación rápida desde Registro)
        if (id_user && !nombre_ruta && !id_comprador) {
            query = 'UPDATE rutas SET id_user = $1 WHERE id_ruta = $2 RETURNING *';
            params = [id_user, id];
        } 
        // Si viene la edición completa (Desde el panel de administración)
        else {
            query = `
                UPDATE rutas 
                SET id_user = COALESCE($1, id_user), 
                    id_comprador = COALESCE($2, id_comprador), 
                    nombre_ruta = COALESCE($3, nombre_ruta) 
                WHERE id_ruta = $4 
                RETURNING *
            `;
            params = [
                id_user, 
                id_comprador, 
                nombre_ruta ? nombre_ruta.trim().toUpperCase() : null, 
                id
            ];
        }

        const result = await pool.query(query, params);

        if (result.rowCount === 0) return res.status(404).json({ mensaje: "Ruta no encontrada" });
        res.json({ mensaje: "Ruta actualizada correctamente", ruta: result.rows[0] });
    } catch (error) {
        console.error("ERROR AL ACTUALIZAR RUTA:", error);
        res.status(500).json({ error: 'Error al actualizar ruta' });
    }
});

// --- 6. ELIMINAR RUTA ---
router.delete('/:id', verificarToken, async (req, res) => {
    const { role, id: userIdToken } = req.user;
    const idRuta = req.params.id;

    try {
        if (role !== 'admin' && role !== 'super_admin') {
            const check = await pool.query('SELECT * FROM rutas WHERE id_ruta = $1 AND id_user = $2', [idRuta, userIdToken]);
            if (check.rows.length === 0) return res.status(403).json({ mensaje: "No tienes permiso para eliminar esta ruta" });
        }
        
        await pool.query('DELETE FROM rutas WHERE id_ruta = $1', [idRuta]);
        res.json({ message: 'Ruta eliminada correctamente' });
    } catch (error) {
        console.error("ERROR AL ELIMINAR RUTA:", error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;