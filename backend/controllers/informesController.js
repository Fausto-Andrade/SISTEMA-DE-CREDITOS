const pool = require('../db');

// 1. Resumen de Rutas - Corregido: r.id -> r.id_ruta
exports.getResumenRutas = async (req, res) => {
    try {
        const { comprador_id } = req.query;
        const result = await pool.query(`
            SELECT 
                r.nombre_ruta, 
                u.username as cobrador, 
                COALESCE(SUM(c.total_pagar), 0) as total_efectivo
            FROM rutas r 
            INNER JOIN users u ON r.id_user = u.id
            LEFT JOIN creditos c ON c.id_ruta = r.id_ruta 
            WHERE r.id_comprador = $1
            GROUP BY r.nombre_ruta, u.username
        `, [comprador_id]);
        
        res.json(result.rows);
    } catch (err) { 
        console.error("ERROR SQL EN RUTAS:", err.message);
        res.status(500).json({ error: err.message }); 
    }
};

// 2. Clientes Pendientes
exports.getClientesPendientes = async (req, res) => {
    try {
        const { comprador_id } = req.query;
        const result = await pool.query(`
            SELECT 
                cl.name, 
                COALESCE(c.total_pagar, 0) as saldo_pendiente 
            FROM clientes cl 
            INNER JOIN creditos c ON cl.id_cedula = c.cliente_id 
            WHERE cl.id_comprador = $1 
            AND LOWER(TRIM(c.estado)) = 'activo'
        `, [comprador_id]);
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 3. Crecimiento Diario
exports.getCrecimientoDiario = async (req, res) => {
    try {
        const { comprador_id } = req.query;
        const result = await pool.query(`
            SELECT 
                TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fecha, 
                SUM(total_pagar) as recaudo 
            FROM creditos 
            WHERE id_comprador = $1 
            GROUP BY fecha
            ORDER BY fecha ASC
        `, [comprador_id]);
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 4. Clientes Finalizados
exports.getClientesFinalizados = async (req, res) => {
    try {
        const { comprador_id } = req.query;
        const result = await pool.query(`
            SELECT 
                cl.name, 
                MAX(cr.fecha_inicio) as fecha_final,
                cr.total_pagar as valor_ultimo_credito
            FROM clientes cl 
            INNER JOIN creditos cr ON cl.id_cedula = cr.cliente_id 
            WHERE cl.id_comprador = $1 
            AND (LOWER(TRIM(cr.estado)) = 'pagado' OR LOWER(TRIM(cr.estado)) = 'finalizado')
            GROUP BY cl.id_cedula, cl.name, cr.total_pagar
        `, [comprador_id]);
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};