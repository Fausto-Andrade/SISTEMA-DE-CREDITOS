const pool = require('../db');

// GET: Obtener historial de abonos de un crédito específico
exports.getAbonosPorCredito = async (req, res) => {
  try {
    const { idCredito } = req.params;

    const query = `
      SELECT * FROM abonos_credito 
      WHERE id_credito = $1 
      ORDER BY numero_cuota ASC, fecha_abono ASC
    `;

    const result = await pool.query(query, [idCredito]);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error al obtener abonos:", err.message);
    res.status(500).json({ error: "Error interno al obtener abonos" });
  }
};

// POST: Registrar un nuevo abono (Esta es la que te daba error 404)
exports.crearAbono = async (req, res) => {
  try {
    const { 
      id_credito, 
      id_cliente, 
      id_cobrador, 
      numero_cuota, 
      monto_abono, 
      tipo_abono, 
      observaciones 
    } = req.body;

    const query = `
      INSERT INTO abonos_credito (
        id_credito, 
        id_cliente, 
        id_cobrador, 
        numero_cuota, 
        monto_abono, 
        tipo_abono, 
        observaciones,
        fecha_abono
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const values = [
      id_credito, 
      id_cliente, 
      id_cobrador, 
      numero_cuota, 
      monto_abono, 
      tipo_abono, 
      observaciones
    ];

    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ Error al crear abono:", err.message);
    res.status(500).json({ error: "No se pudo registrar el abono en la base de datos" });
  }
};

// POST: Marcar una cuota en mora (Esta es la que falta)
exports.marcarMora = async (req, res) => {
  try {
    const { id_credito, id_cliente, id_cobrador, numero_cuota, observaciones } = req.body;
    
    // Para la mora, el monto es 0 y el estado suele ser 2 según tus logs
    const query = `
      INSERT INTO abonos_credito (
        id_credito, id_cliente, id_cobrador, numero_cuota, monto_abono, tipo_abono, observaciones, fecha_abono, estado
      ) VALUES ($1, $2, $3, $4, 0, 'mora', $5, NOW(), 2)
      RETURNING *;
    `;
    
    const values = [id_credito, id_cliente, id_cobrador, numero_cuota, observaciones];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al registrar mora:", err.message);
    res.status(500).json({ error: "No se pudo marcar la mora en el servidor" });
  }
};