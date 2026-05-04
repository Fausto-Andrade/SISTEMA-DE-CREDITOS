const pool = require('../db');

// --- 1. OBTENER RUTAS (Mantiene columnas y lógica de roles) ---
const obtenerRutas = async (req, res) => {
    const { role, id } = req.user; 
    let { id_comprador } = req.user; 

    try {
        if (role === 'admin' && !id_comprador) {
            const userRes = await pool.query('SELECT id_comprador FROM users WHERE id = $1', [id]);
            if (userRes.rows.length > 0) {
                id_comprador = userRes.rows[0].id_comprador;
            }
        }

        let query;
        let values = [];

        // LEFT JOIN es vital para que las rutas aparezcan aunque no tengan cobrador asignado
        // Mantenemos exactamente el alias 'nombre_cobrador' para el frontend
        const baseQuery = `
            SELECT r.*, u.username as nombre_cobrador, c.nombre_empresa 
            FROM rutas r 
            LEFT JOIN users u ON r.id_user = u.id 
            LEFT JOIN compradores c ON r.id_comprador = c.id_comprador
        `;

        if (role === 'super_admin') {
            query = `${baseQuery} ORDER BY r.fecha DESC`;
        } else if (role === 'admin') {
            if (!id_comprador) return res.json([]);
            query = `${baseQuery} WHERE r.id_comprador = $1 ORDER BY r.fecha DESC`;
            values = [id_comprador]; 
        } else {
            query = `${baseQuery} WHERE r.id_user = $1 ORDER BY r.fecha DESC`;
            values = [id];
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR AL OBTENER RUTAS:", error.message);
        res.status(500).json({ error: 'Error interno al obtener rutas' });
    }
};

// --- 2. CREAR RUTA (Integrando validaciones de límite y duplicidad) ---
const crearRuta = async (req, res) => {
    const { nombre_ruta, fecha, id_comprador, id_user } = req.body;
    const { role, id: userIdToken } = req.user;

    if (!nombre_ruta || !id_comprador) {
        return res.status(400).json({ error: 'Nombre de ruta y Empresa son obligatorios' });
    }

    const nombreNormalizado = nombre_ruta.trim().toUpperCase();
    const finalUserId = (role === 'admin' || role === 'super_admin') ? id_user : userIdToken;

    try {
        // Validación de límite de rutas permitidas para la empresa
        const compradorRes = await pool.query(
            'SELECT max_rutas_permitidas FROM compradores WHERE id_comprador = $1', 
            [id_comprador]
        );
        const rutasActuales = await pool.query(
            'SELECT COUNT(*) FROM rutas WHERE id_comprador = $1', 
            [id_comprador]
        );

        if (compradorRes.rowCount > 0) {
            const limite = compradorRes.rows[0].max_rutas_permitidas;
            const actuales = parseInt(rutasActuales.rows[0].count);
            if (limite > 0 && actuales >= limite) {
                return res.status(403).json({ 
                    message: `Límite alcanzado. Esta empresa solo tiene permitidas ${limite} rutas.` 
                });
            }
        }

        // Validar duplicidad (Evitar que el mismo usuario tenga dos rutas con igual nombre)
        const checkDuplicado = await pool.query(
            'SELECT * FROM rutas WHERE UPPER(nombre_ruta) = $1 AND id_user = $2',
            [nombreNormalizado, finalUserId]
        );

        if (checkDuplicado.rows.length > 0) {
            return res.status(409).json({ 
                error: 'DUPLICADO', 
                message: 'Este cobrador ya tiene asignada esta ruta.' 
            });
        }

        const insertQuery = `
            INSERT INTO rutas (nombre_ruta, fecha, id_comprador, id_user)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [nombreNormalizado, fecha, id_comprador, finalUserId || null]);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("ERROR AL CREAR RUTA:", error.message);
        res.status(500).json({ error: "Error interno al crear la ruta" });
    }
};

// --- 3. ACTUALIZAR / ASIGNAR RUTA (Lógica flexible para Registro y Admin) ---
const actualizarRuta = async (req, res) => {
    const { id } = req.params;
    const { id_user, id_comprador, nombre_ruta } = req.body;

    try {
        let query;
        let params;

        // Caso A: Solo asignación de cobrador (Usado en el Registro de Usuarios)
        if (id_user && !nombre_ruta) {
            query = `UPDATE rutas SET id_user = $1 WHERE id_ruta = $2 RETURNING *`;
            params = [id_user, id];
        } 
        // Caso B: Edición completa (Desde el panel de administración de rutas)
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

        if (result.rowCount === 0) return res.status(404).json({ error: "Ruta no encontrada" });
        res.json({ message: "Ruta actualizada correctamente", ruta: result.rows[0] });
    } catch (error) {
        console.error("ERROR AL ACTUALIZAR RUTA:", error.message);
        res.status(500).json({ error: "Error interno al asignar el cobrador a la ruta" });
    }
};

// --- 4. OBTENER COMPRADORES ---
const obtenerCompradores = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_comprador, nombre_empresa FROM compradores ORDER BY nombre_empresa ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener compradores:', error);
        res.status(500).json({ error: 'Error al obtener la lista de empresas' });
    }
};

// --- NUEVA FUNCIÓN: OBTENER SOLO COBRADORES DE UNA EMPRESA ---
const obtenerCobradoresPorEmpresa = async (req, res) => {
    const { id_comprador } = req.query; // Se recibe desde el frontend

    try {
        if (!id_comprador) {
            return res.status(400).json({ error: "Falta el id_comprador" });
        }

        // Filtramos por id_comprador y por rol 'user' (que es el rol de cobrador según tu DB)
        const query = `
            SELECT id, username, rol 
            FROM users 
            WHERE id_comprador = $1 
            AND (LOWER(rol) = 'user' OR LOWER(rol) = 'cobrador')
            ORDER BY username ASC`;
        
        const result = await pool.query(query, [id_comprador]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener cobradores por empresa:", error);
        res.status(500).json({ error: "Error interno al obtener cobradores" });
    }
};

// --- 5. ELIMINAR RUTA ---
const eliminarRuta = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM rutas WHERE id_ruta = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Ruta no encontrada" });
        res.json({ message: "Ruta eliminada con éxito", ruta: result.rows[0] });
    } catch (error) {
        console.error("ERROR AL ELIMINAR:", error.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar la ruta' });
    }
};

module.exports = { 
    crearRuta, 
    obtenerRutas, 
    obtenerCompradores, 
    eliminarRuta, 
    actualizarRuta,
    obtenerCobradoresPorEmpresa
};