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

// --- CLIENTES ---
router.get('/clientes', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

router.post('/clientes', verificarToken, async (req, res) => {
  const { name, apellido, correo, celular, direccion, genero, ciudad } = req.body;
  try {
    const nuevoCliente = await pool.query(
      `INSERT INTO clientes (name, apellido, correo, celular, direccion, genero, ciudad) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, apellido, correo, celular, direccion, genero, ciudad]
    );
    res.status(201).json({ mensaje: "Cliente registrado con éxito", cliente: nuevoCliente.rows[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al guardar cliente" });
  }
});

// --- CREAR CREDITOS ---

router.post('/creditos', verificarToken, async (req, res) => {
  const { cliente_id, monto, cuotas, interes, fecha_inicio, total_pagar } = req.body;
  const usuario_id = req.user.id; 
  try {
    const query = `
      INSERT INTO creditos (cliente_id, numero_credito_cliente, monto, cuotas, interes, fecha_inicio, total_pagar, usuario_id) 
      VALUES ($1, nextval('creditos_id_seq'), $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [cliente_id, monto, cuotas, interes, fecha_inicio, total_pagar, usuario_id];
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
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Crédito no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener detalle" });
  }
});

router.get('/creditos/cobrador', verificarToken, async (req, res) => {
  const cobradorId = req.user.id; 
  try {
    const query = `
      SELECT c.*, cl.name AS cliente_nombre, cl.apellido AS cliente_apellido
      FROM creditos c
      JOIN clientes cl ON c.cliente_id = cl.id
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

module.exports = router;