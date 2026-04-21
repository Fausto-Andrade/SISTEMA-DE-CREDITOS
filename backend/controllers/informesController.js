const pool = require('../db');

exports.getResumenRutas = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.nombre_ruta,
        u.username as cobrador,
        SUM(c.total_pagar) as total_efectivo,
        SUM(c.total_pagar - c.monto) as ganancia
      FROM rutas r
      JOIN users u ON r.id_user = u.id
      JOIN creditos c ON TRIM(c.cobrador_asignado) = TRIM(u.username)
      WHERE c.estado != 'Pagado'
      GROUP BY r.nombre_ruta, u.username;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en Resumen Rutas:", err.message);
    res.status(500).json({ error: "Error en la consulta de rutas" });
  }
};

exports.getClientesPendientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        cl.name || ' ' || cl.apellido as nombre,
        cl.id_cedula as cedula,
        c.cuotas as cuotas_faltantes,
        (c.total_pagar - COALESCE(
          (SELECT SUM(a.monto_abono) 
           FROM abonos_credito a 
           WHERE a.id_credito = c.id), 0)
        ) as saldo_pendiente
      FROM clientes cl
      JOIN creditos c ON cl.id_cedula = c.cliente_id
      WHERE c.estado = 'Activo'
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en Clientes Pendientes:", err.message);
    res.status(500).json({ error: "Error en clientes pendientes" });
  }
};

exports.getCrecimientoDiario = async (req, res) => {
  const { inicio, fin } = req.query;
  try {
    let query = `
      SELECT 
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') as fecha,
        SUM(total_pagar) as recaudo,
        COUNT(id) as clientes
      FROM creditos
    `;
    
    const params = [];
    if (inicio && fin) {
      query += ` WHERE fecha_inicio BETWEEN $1 AND $2 `;
      params.push(inicio, fin);
    }

    query += ` GROUP BY fecha_inicio ORDER BY fecha_inicio ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- NUEVO INFORME: Clientes Finalizados y Score ---
exports.getClientesFinalizados = async (req, res) => {
  try {
    const query = `
      SELECT 
        cl.name || ' ' || cl.apellido as nombre,
        MAX(cr.fecha_inicio + (cr.cuotas || ' days')::interval) as fecha_final, 
        cr.total_pagar as valor_ultimo_credito,
        CASE 
          WHEN (SELECT COUNT(*) FROM abonos_credito a WHERE a.id_credito = cr.id AND a.tipo_abono = 'mora') = 0 THEN 'Excelente'
          WHEN (SELECT COUNT(*) FROM abonos_credito a WHERE a.id_credito = cr.id AND a.tipo_abono = 'mora') BETWEEN 1 AND 3 THEN 'Moroso'
          ELSE 'Rojo'
        END as score
      FROM clientes cl
      JOIN creditos cr ON cl.id_cedula = cr.cliente_id
      WHERE cr.estado = 'Pagado'
      GROUP BY cl.id_cedula, cl.name, cl.apellido, cr.id, cr.total_pagar
      ORDER BY fecha_final DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en Clientes Finalizados:", err.message);
    res.status(500).json({ error: "Error al obtener historial de finalizados" });
  }
};