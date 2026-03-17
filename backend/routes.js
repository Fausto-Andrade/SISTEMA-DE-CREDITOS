const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verificarToken } = require('./authMiddleware');
const pool = require('./db');

// --- LOGIN  ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    const usuario = userQuery.rows[0];
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(401).json({ mensaje: "Credenciales incorrectas" });

    const payload = { id: usuario.id, username: usuario.username, role: usuario.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ mensaje: "Login exitoso", token, user: { id: usuario.id, username: usuario.username, role: usuario.role } });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// --- REGISTER ---
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role';
    const result = await pool.query(query, [username, email, hashedPassword, role || 'user']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// --- RUTAS DE COBRO ---
router.post('/rutas', verificarToken, async (req, res) => {
  const { fecha, id_user, nombre_ruta } = req.body;
  
  try {
    const query = `
      INSERT INTO rutas (fecha, id_user, nombre_ruta) 
      VALUES ($1, $2, $3) 
      RETURNING *`;
      
    const result = await pool.query(query, [fecha, id_user, nombre_ruta]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al insertar en tabla 'rutas':", err.message);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

// --- CLIENTES ---
router.get('/clientes', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.username as nombre_cobrador 
      FROM clientes c
      LEFT JOIN users u ON c.id_cobrador = u.id
      ORDER BY c.id_cedula ASC`;
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

router.post('/clientes', verificarToken, async (req, res) => {
  // Asegúrate de que estos nombres coincidan EXACTAMENTE con lo que envías desde React
  const { id_cedula, name, apellido, celular, direccion, barrio_cliente, pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro, empresa, cargo, direccion_empresa,ciudad_empresa, telefono_empresa, nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador, barrio_fiador, notas, id_cobrador } = req.body;
  
  if (!id_cedula) return res.status(400).json({ mensaje: "La cédula es obligatoria" });

  try {
    const nuevoCliente = await pool.query(
      `INSERT INTO clientes (id_cedula, name, apellido, celular, direccion, barrio_cliente, pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro, empresa, cargo, direccion_empresa,ciudad_empresa, telefono_empresa, nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador, barrio_fiador, notas, id_cobrador) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
      [id_cedula, name, apellido, celular, direccion, barrio_cliente, pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro, empresa, cargo, direccion_empresa,ciudad_empresa, telefono_empresa, nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador, barrio_fiador, notas, id_cobrador]
    );
    res.status(201).json({ mensaje: "Cliente registrado con éxito", cliente: nuevoCliente.rows[0] });
  } catch (error) {
    console.error("Error DB:", error.message);
    res.status(500).json({ mensaje: "Error al guardar cliente: " + error.message });
  }
});

// --- CREAR CREDITOS ---
router.post('/creditos', verificarToken, async (req, res) => {
  const { 
    cliente_id, monto, cuotas, interes, fecha_inicio, total_pagar, tipo_interes, frecuencia_cuotas, cobrador_asignado 
  } = req.body;
  
  const usuario_id = req.user.id; 

  try {
    const query = `
      INSERT INTO creditos (
        cliente_id, monto, cuotas, interes, fecha_inicio, total_pagar, 
        usuario_id, tipo_interes, frecuencia_cuotas, cobrador_asignado
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
      
    const values = [
      cliente_id, monto, cuotas, interes, fecha_inicio, 
      total_pagar, usuario_id, tipo_interes, frecuencia_cuotas, cobrador_asignado
    ];

    const newCredito = await pool.query(query, values);
    res.status(201).json(newCredito.rows[0]);
  } catch (err) {
    console.error("Error al insertar crédito:", err.message);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

// Detalle del crédito (IMPORTANTE: Debe ser /detalle/:id)
router.get('/creditos/detalle/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT c.*, (cl.name || ' ' || cl.apellido) as nombre_cliente
      FROM creditos c
      JOIN clientes cl ON c.cliente_id = cl.id_cedula -- Correcto
      WHERE c.id = $1`; // Asegúrate que 'id' en la tabla creditos sea SERIAL
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: "Crédito no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en detalle:", err.message);
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});

router.get('/creditos/cobrador', verificarToken, async (req, res) => {
  const cobradorId = req.user.id; 
  try {
    const query = `
      SELECT c.*, cl.name AS cliente_nombre, cl.apellido AS cliente_apellido
      FROM creditos c
      JOIN clientes cl ON c.cliente_id = cl.id_cedula
      WHERE c.usuario_id = $1
      ORDER BY c.id DESC`;
    const result = await pool.query(query, [cobradorId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener créditos" });
  }
});

// --- ABONOS ---
// 1. Obtener abonos por crédito
router.get('/abonos/credito/:id_credito', verificarToken, async (req, res) => {
  try {
    const { id_credito } = req.params;
    const result = await pool.query(
      `SELECT *, 
        TO_CHAR(created_at, 'HH12:MI AM') as hora_pago 
       FROM abonos_credito 
       WHERE id_credito = $1 
       ORDER BY created_at ASC`,
      [id_credito]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener abonos:", err.message);
    res.status(500).json({ error: "Error al obtener abonos" });
  }
});

// 2. Registrar abono (Normal o Mora pagada)
router.post('/abonos', verificarToken, async (req, res) => {
  const { 
    id_credito, id_cliente, id_cobrador, numero_cuota, monto_abono, 
    saldo_anterior, saldo_nuevo, observaciones, metodo_pago, tipo_abono 
  } = req.body;

  try {
    const query = `
      INSERT INTO abonos_credito (
        id_credito, id_cliente, id_cobrador, numero_cuota, monto_abono, 
        saldo_anterior, saldo_nuevo, observaciones, metodo_pago, tipo_abono, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1) RETURNING *`;
    
    const values = [
      id_credito, id_cliente, id_cobrador, numero_cuota, monto_abono, 
      saldo_anterior, saldo_nuevo, observaciones, metodo_pago, tipo_abono || 'normal'
    ];
    
    const newAbono = await pool.query(query, values);
    
    // Si el saldo llega a cero, marcamos el crédito como pagado
    if (saldo_nuevo !== undefined && parseFloat(saldo_nuevo) <= 0) {
      await pool.query("UPDATE creditos SET estado = 'Pagado' WHERE id = $1", [id_credito]);
    }
    
    res.status(201).json(newAbono.rows[0]);
  } catch (err) {
    console.error("Error al registrar abono:", err.message);
    res.status(500).json({ error: "Error al registrar el abono" });
  }
});

// 3. Registrar una novedad de "No Pago" (Estado de mora)
router.post('/abonos/mora', verificarToken, async (req, res) => {
  const { id_credito, id_cliente, id_cobrador, numero_cuota, observaciones } = req.body;
  
  try {
    const query = `
      INSERT INTO abonos_credito (
        id_credito, id_cliente, id_cobrador, numero_cuota, 
        monto_abono, tipo_abono, observaciones, estado
      ) VALUES ($1, $2, $3, $4, 0, 'mora', $5, 2) 
      RETURNING *`;
    
    const values = [id_credito, id_cliente, id_cobrador, numero_cuota, observaciones];
    const newMora = await pool.query(query, values);
    
    res.status(201).json({ mensaje: "Mora registrada con éxito", registro: newMora.rows[0] });
  } catch (err) {
    console.error("Error al registrar mora:", err.message);
    res.status(500).json({ error: "Error al guardar el estado de no pago" });
  }
});

// --- CREAR NUEVO CRÉDITO ---
router.post('/creditos', verificarToken, async (req, res) => {
  const { 
    cliente_id, monto, cuotas, interes, fecha_inicio, 
    total_pagar, tipo_interes, frecuencia_cuotas, cobrador_asignado 
  } = req.body;
  
  // El id del usuario que crea el registro viene del token
  const usuario_id = req.user.id; 

  try {
    const query = `
      INSERT INTO creditos (
        cliente_id, monto, cuotas, interes, fecha_inicio, 
        total_pagar, usuario_id, tipo_interes, frecuencia_cuotas, cobrador_asignado, estado
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Por Pagar') 
      RETURNING *`;
      
    const values = [
      cliente_id, monto, cuotas, interes, fecha_inicio, 
      total_pagar, usuario_id, tipo_interes, frecuencia_cuotas, cobrador_asignado
    ];

    const newCredito = await pool.query(query, values);
    res.status(201).json(newCredito.rows[0]);
    
  } catch (err) {
    console.error("Error al insertar crédito:", err.message);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});


// VALIDAR SI EL CLIENTE YA TIENE CREDITOS ACTIVOS
router.get('/creditos/verificar-pendiente/:clienteId', verificarToken, async (req, res) => {
  const { clienteId } = req.params;
  try {
    const query = `
      SELECT COUNT(*) 
      FROM creditos 
      WHERE cliente_id = $1 AND (estado = 'Por Pagar' OR estado = 'Activo')`;
    
    const result = await pool.query(query, [clienteId]);
    const tienePendiente = parseInt(result.rows[0].count) > 0;
    
    res.json({ tienePendiente, cantidad: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: "Error al verificar créditos pendientes" });
  }
});

// OBTENER DETALLE DE UN CLIENTE (DATOS + COBRADOR) Y SUS CRÉDITOS
router.get('/clientes/detalle/:cedula', verificarToken, async (req, res) => {
  const { cedula } = req.params;

  try {
    // 1. Obtener datos básicos del cliente con el nombre del cobrador dinámico
    // Realizamos un LEFT JOIN con la tabla usuarios para traer el nombre real
    const clienteRes = await pool.query(
      `SELECT 
        c.*, 
        u.username AS nombre_cobrador 
       FROM clientes c
       LEFT JOIN users u ON c.id_cobrador = u.id
       WHERE c.id_cedula = $1`, 
      [cedula]
    );
    
    // Verificamos si el cliente existe
    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    // 2. Obtener todos los créditos asociados a esa cédula
    // Ordenamos por fecha de inicio para que el más reciente aparezca primero
    const creditosRes = await pool.query(
      `SELECT * FROM creditos 
       WHERE cliente_id = $1 
       ORDER BY fecha_inicio DESC`, 
      [cedula]
    );

    // Respondemos con ambos objetos consolidados
    res.json({
      cliente: clienteRes.rows[0],
      creditos: creditosRes.rows
    });

  } catch (error) {
    // Log para depuración en consola del servidor
    console.error("Error al obtener detalle del cliente:", error.message);
    res.status(500).json({ 
      mensaje: "Error interno del servidor al obtener el detalle",
      error: error.message 
    });
  }
});

// --- OBTENER TODOS LOS USUARIOS (Para el AdminDashboard) ---
router.get('/usuarios-registrados', verificarToken, async (req, res) => {
  try {
    // Solo seleccionamos los datos que necesitamos (sin el password por seguridad)
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err.message);
    res.status(500).json({ message: "Error al obtener la lista de usuarios" });
  }
});

// --- ELIMINAR USUARIO (Solo Admin) ---
router.delete('/usuarios/:id', verificarToken, async (req, res) => {
  const { id } = req.params;

  // Seguridad: Solo el admin puede borrar
  if (req.user.role !== 'admin') {
    return res.status(403).json({ mensaje: "No tienes permisos para esta acción" });
  }

  try {
    // Evitar que el admin se borre a sí mismo por error
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ mensaje: "No puedes eliminar tu propia cuenta de administrador" });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al eliminar el usuario. Verifique si tiene créditos asignados." });
  }
});

// --- OBTENER TODAS LAS RUTAS ---
router.get('/rutas', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT r.*, u.username as cobrador_nombre 
      FROM rutas r
      JOIN users u ON r.id_user = u.id
      ORDER BY r.fecha DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener rutas:", err.message);
    res.status(500).json({ error: "Error al cargar las rutas" });
  }
});

// --- ELIMINAR UNA RUTA POR ID ---
router.delete('/rutas/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM rutas WHERE id_ruta = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    res.json({ message: "Ruta eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar ruta:", err.message);
    res.status(500).json({ error: "Error interno al eliminar la ruta" });
  }
});
module.exports = router;