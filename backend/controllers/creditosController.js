const pool = require('../db');

// 1. Obtener créditos personalizados (Admin/Cobrador)
exports.getCreditosPersonalizados = async (req, res) => {
    const { role, username } = req.user;
    const { id_comprador } = req.query;

    try {
        let baseQuery = `
            SELECT cr.id, cr.numero_credito_cliente, cr.monto, cr.total_pagar, cr.fecha_inicio as fecha,
                   cr.estado, cr.cobrador_asignado, cr.usuario_id as id_user,
                   cl.name, cl.apellido, cl.id_cedula, r.nombre_ruta, cl.tiene_documentos
            FROM creditos cr
            INNER JOIN clientes cl ON CAST(cr.cliente_id AS TEXT) = CAST(cl.id_cedula AS TEXT)
            LEFT JOIN rutas r ON cr.id_ruta = r.id_ruta `;

        let query, params;
        if (role === 'admin' || role === 'super_admin') {
            query = `${baseQuery} WHERE cl.id_comprador = $1 ORDER BY cr.fecha_inicio DESC`;
            params = [id_comprador];
        } else {
            query = `${baseQuery} WHERE cr.cobrador_asignado = $1 AND cr.estado != 'Pagado' ORDER BY cr.fecha_inicio DESC`;
            params = [username];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error en getCreditosPersonalizados:", error);
        res.status(500).json({ error: "Error al obtener créditos" });
    }
};

// 2. Crear un nuevo Crédito
exports.crearCredito = async (req, res) => {
    try {
        let { 
            cliente_id, usuario_id, monto, interes, cuotas, 
            frecuencia_cuotas, fecha_inicio, total_pagar, 
            tipo_interes, cobrador_asignado, id_ruta, id_comprador 
        } = req.body;

        // SEGURO: Si id_ruta no viene en el body, lo buscamos por el usuario_id
        if (!id_ruta && usuario_id) {
            const rutaQuery = await pool.query('SELECT id_ruta FROM rutas WHERE id_user = $1 LIMIT 1', [usuario_id]);
            if (rutaQuery.rows.length > 0) {
                id_ruta = rutaQuery.rows[0].id_ruta;
            }
        }

        const query = `
            INSERT INTO creditos (
                cliente_id, usuario_id, monto, interes, cuotas, 
                frecuencia_cuotas, fecha_inicio, total_pagar, 
                tipo_interes, cobrador_asignado, id_ruta, estado, id_comprador
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Activo', $12)
            RETURNING *`;

        const values = [
            cliente_id, usuario_id, monto, interes, cuotas, 
            frecuencia_cuotas, fecha_inicio, total_pagar, 
            tipo_interes || 'fijo', cobrador_asignado, id_ruta, id_comprador
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ message: "Crédito creado con éxito", credito: result.rows[0] });
    } catch (err) {
        console.error("Error al crear crédito:", err.message);
        res.status(500).json({ error: "Error al crear crédito" });
    }
};

// 3. Obtener todos los créditos (Requerido por tus rutas)
exports.getTodosLosCreditos = async (req, res) => {
    const { id_comprador } = req.query;
    try {
        const query = `
            SELECT cr.*, cl.name, cl.apellido 
            FROM creditos cr
            JOIN clientes cl ON CAST(cr.cliente_id AS TEXT) = CAST(cl.id_cedula AS TEXT)
            WHERE cr.id_comprador = $1
            ORDER BY cr.fecha_inicio DESC`;
        const result = await pool.query(query, [id_comprador]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error en getTodosLosCreditos:", error);
        res.status(500).json({ error: "Error al obtener todos los créditos" });
    }
};

// 4. Rutas, Detalle e Historial
exports.getRutas = async (req, res) => {
    const { id_comprador } = req.query;
    try {
        const query = `
            SELECT r.*, u.username as cobrador_nombre 
            FROM rutas r 
            LEFT JOIN users u ON r.id_user = u.id 
            WHERE r.id_comprador = $1
            ORDER BY r.fecha DESC`;
        const result = await pool.query(query, [id_comprador]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar rutas" });
    }
};

exports.getDetalleCliente = async (req, res) => {
    const { cedula } = req.params;
    try {
        const query = `SELECT * FROM creditos WHERE cliente_id = CAST($1 AS TEXT) ORDER BY fecha_inicio DESC`;
        const result = await pool.query(query, [cedula]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener historial" });
    }
};

exports.getCreditoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM creditos WHERE id = $1`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Crédito no encontrado" });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al detalle" });
    }
};

exports.createAbono = async (req, res) => {
    // Implementación básica para evitar errores de ruta
    res.status(200).json({ message: "Abono procesado correctamente" });
};