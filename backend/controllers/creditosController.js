const pool = require('../db');

// --- CLIENTES ---
exports.getClientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cedula, c.name, c.apellido, c.fecha_creacion, c.tiene_documentos,
        (SELECT COUNT(*)::int FROM creditos cr WHERE cr.cliente_id = CAST(c.id_cedula AS TEXT)) as cant_creditos,
        (SELECT COUNT(*)::int FROM creditos cr WHERE cr.cliente_id = CAST(c.id_cedula AS TEXT) AND cr.estado != 'Pagado') as creditos_activos
      FROM clientes c
      ORDER BY c.fecha_creacion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

exports.createCliente = async (req, res) => {
    const fields = req.body;
    const columns = Object.keys(fields).join(', ');
    const values = Object.values(fields);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    try {
        const query = `INSERT INTO clientes (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al guardar cliente" });
    }
};

// CORREGIDO: Lógica de saldo pendiente para que no aparezcan todos como "Saldado"
exports.getDetalleCliente = async (req, res) => {
  try {
    const { cedula } = req.params;

    const clienteRes = await pool.query(
      'SELECT * FROM clientes WHERE id_cedula = $1', 
      [cedula]
    );

    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const queryCreditos = `
      SELECT 
        cr.*,
        COALESCE((SELECT SUM(monto_abono) FROM abonos_credito WHERE id_credito = cr.id), 0) as total_abonado
      FROM creditos cr
      WHERE cr.cliente_id = CAST($1 AS TEXT)
      ORDER BY cr.fecha_inicio DESC
    `;

    const creditosRes = await pool.query(queryCreditos, [cedula]);

    // Calculamos el saldo pendiente en el servidor antes de enviar
    const creditosConSaldo = creditosRes.rows.map(credito => {
      const saldo = Number(credito.total_pagar) - Number(credito.total_abonado);
      return {
        ...credito,
        saldo_pendiente: saldo,
        // Forzamos el estado visual si el saldo es mayor a 0
        estado_real: saldo <= 0 ? 'Saldado' : credito.estado 
      };
    });

    res.json({
      cliente: clienteRes.rows[0],
      creditos: creditosConSaldo
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Error al obtener el historial" });
  }
};

// --- CRÉDITOS ---
exports.getTodosLosCreditos = async (req, res) => {
  try {
    const query = `
      SELECT 
        cr.*, 
        c.name, 
        c.apellido, 
        c.id_cedula,
        r.nombre_ruta, -- Traemos el nombre de la tabla rutas
        COALESCE(u.username, cr.cobrador_asignado) as cobrador_asignado,
        (SELECT COUNT(*)::int FROM creditos c2 WHERE c2.cliente_id = cr.cliente_id) as historial_count
      FROM creditos cr
      JOIN clientes c ON CAST(c.id_cedula AS TEXT) = CAST(cr.cliente_id AS TEXT)
      LEFT JOIN users u ON CAST(cr.cobrador_asignado AS TEXT) = CAST(u.id AS TEXT)
      -- Unión directa y simple:
      LEFT JOIN rutas r ON cr.id_ruta = r.id_ruta 
      ORDER BY cr.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getTodosLosCreditos:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getCreditoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT cr.*, c.name as cliente_nombre, c.apellido as cliente_apellido, c.id_cedula,
        (SELECT COALESCE(SUM(monto_abono), 0) FROM abonos_credito WHERE id_credito = cr.id) as total_abonado
      FROM creditos cr
      JOIN clientes c ON CAST(c.id_cedula AS TEXT) = cr.cliente_id
      WHERE cr.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Crédito no encontrado" });
    
    const credito = result.rows[0];
    credito.saldo_pendiente = Number(credito.total_pagar) - Number(credito.total_abonado);
    
    res.json(credito);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener crédito" });
  }
};

exports.crearCredito = async (req, res) => {
  try {
    const { 
      cliente_id, usuario_id, monto, interes, cuotas, 
      frecuencia_cuotas, fecha_inicio, total_pagar, 
      tipo_interes, cobrador_asignado, id_ruta 
    } = req.body;

    const query = `
      INSERT INTO creditos (
        cliente_id, usuario_id, monto, interes, cuotas, 
        frecuencia_cuotas, fecha_inicio, total_pagar, 
        tipo_interes, cobrador_asignado, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 'Activo')
      RETURNING *;
    `;

    const values = [
      cliente_id, usuario_id, monto, interes, cuotas, 
      frecuencia_cuotas, fecha_inicio, total_pagar, 
      tipo_interes || 'fijo', cobrador_asignado || 'Sin asignar',
      id_ruta
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ message: "Crédito creado con éxito", credito: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear crédito" });
  }
};

// --- RUTAS ---
exports.getRutas = async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.username as cobrador_nombre 
            FROM rutas r 
            LEFT JOIN users u ON r.id_user = u.id 
            ORDER BY r.fecha DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar rutas" });
    }
};

exports.createRuta = async (req, res) => {
    const { id_user, nombre_ruta, fecha } = req.body;
    try {
        const query = `
            INSERT INTO rutas (id_user, nombre_ruta, fecha) 
            VALUES ($1, $2, $3) 
            RETURNING *`;
        const result = await pool.query(query, [id_user, nombre_ruta, fecha]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al crear la ruta" });
    }
};

exports.verificarDeudaPendiente = async (req, res) => {
    const { clienteId } = req.params;
    try {
        const query = `SELECT COUNT(id) as cantidad FROM creditos WHERE cliente_id = $1 AND estado = 'Activo'`;
        const result = await pool.query(query, [clienteId]);
        res.json({ tienePendiente: parseInt(result.rows[0].cantidad) > 0 });
    } catch (err) {
        res.status(500).json({ error: "Error al verificar" });
    }
};

exports.getCreditosPorCobrador = async (req, res) => {
  try {
      const username = req.user.username; 
      const query = `
          SELECT c.*, cl.name AS cliente_nombre, cl.apellido AS cliente_apellido
          FROM creditos c
          INNER JOIN clientes cl ON TRIM(CAST(c.cliente_id AS TEXT)) = TRIM(CAST(cl.id_cedula AS TEXT))
          WHERE TRIM(CAST(c.cobrador_asignado AS TEXT)) = TRIM(CAST($1 AS TEXT))
          ORDER BY c.id DESC
      `;
      const result = await pool.query(query, [username]);
      res.json(result.rows);
  } catch (err) {
      res.status(500).json({ error: "Error al obtener créditos" });
  }
};

exports.createAbono = async (req, res) => {
  const { id_credito, id_cliente, monto_abono } = req.body;
  try {
      const result = await pool.query(
          `INSERT INTO abonos_credito (id_credito, id_cliente, monto_abono, fecha_abono, estado) VALUES ($1, $2, $3, NOW(), 1) RETURNING *`,
          [id_credito, id_cliente, monto_abono]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      res.status(500).json({ error: "Error al registrar abono" });
  }
};