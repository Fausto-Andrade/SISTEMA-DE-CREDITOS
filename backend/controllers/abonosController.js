const pool = require('../db');

// GET: Obtener historial de abonos
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
    console.error("Error al obtener abonos:", err.message);
    res.status(500).json({ error: "Error interno al obtener abonos" });
  }
};

// NUEVO - GET: Obtener recaudo diario por cobrador
exports.getRecaudoDia = async (req, res) => {
  const { id_cobrador } = req.params;
  try {
    // Sumamos monto_abono de la tabla abonos_credito filtrando por el cobrador y el día actual
    const query = `
      SELECT SUM(monto_abono) as total 
      FROM abonos_credito 
      WHERE id_cobrador = $1 
      AND fecha_abono::date = CURRENT_DATE
    `;
    const result = await pool.query(query, [id_cobrador]);
    const totalRecaudado = result.rows[0].total || 0;
    res.json({ total: totalRecaudado });
  } catch (err) {
    console.error("Error al obtener recaudo diario:", err.message);
    res.status(500).json({ error: "Error al calcular el recaudo del día" });
  }
};

// POST: Registrar un nuevo abono + CIERRE AUTOMÁTICO
exports.crearAbono = async (req, res) => {
  const client = await pool.connect(); 
  
  try {
    const { 
      id_credito,
      monto_abono, 
      id_cliente, 
      id_cobrador, 
      numero_cuota, 
      tipo_abono, 
      observaciones 
    } = req.body;

    await client.query('BEGIN');

    // 1. Insertamos el abono
    const queryAbono = `
      INSERT INTO abonos_credito (
        id_credito, id_cliente, id_cobrador, numero_cuota, 
        monto_abono, tipo_abono, observaciones, fecha_abono
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const resAbono = await client.query(queryAbono, [
      id_credito, id_cliente, id_cobrador, numero_cuota, 
      monto_abono, tipo_abono, observaciones
    ]);

    // 2. Verificamos el saldo total comparando 'monto' de la tabla creditos
    // contra la suma de abonos en 'abonos_credito'
    const queryBalance = `
      SELECT 
        c.monto, 
        COALESCE(SUM(a.monto_abono), 0) as total_abonado
      FROM creditos c
      LEFT JOIN abonos_credito a ON c.id = a.id_credito
      WHERE c.id = $1
      GROUP BY c.monto;
    `;
    const resBalance = await client.query(queryBalance, [id_credito]);

    if (resBalance.rows.length > 0) {
      const { monto, total_abonado } = resBalance.rows[0];

      // 3. SI EL TOTAL ABONADO CUBRE EL MONTO, CAMBIAMOS EL ESTADO A 'Pagado'
      // Usamos 'Pagado' porque es el término que ya tienes en tu base de datos (imagen 3)
      if (parseFloat(total_abonado) >= parseFloat(monto)) {
        await client.query(
          "UPDATE creditos SET estado = 'Pagado' WHERE id = $1", 
          [id_credito]
        );
        console.log(`✅ Crédito ID ${id_credito} actualizado a 'Pagado'`);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(resAbono.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Error al procesar abono:", err.message);
    res.status(500).json({ error: "No se pudo actualizar la base de datos" });
  } finally {
    client.release();
  }
};

// POST: Marcar una cuota en mora
exports.marcarMora = async (req, res) => {
  try {
    const { id_credito, id_cliente, id_cobrador, numero_cuota, observaciones } = req.body;
    const query = `
      INSERT INTO abonos_credito (
        id_credito, id_cliente, id_cobrador, numero_cuota, monto_abono, 
        tipo_abono, observaciones, fecha_abono, estado
      ) VALUES ($1, $2, $3, $4, 0, 'mora', $5, NOW(), 2)
      RETURNING *;
    `;
    const result = await pool.query(query, [id_credito, id_cliente, id_cobrador, numero_cuota, observaciones]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al registrar mora:", err.message);
    res.status(500).json({ error: "No se pudo marcar la mora" });
  }
};