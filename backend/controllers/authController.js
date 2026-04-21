const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    
    const usuario = userQuery.rows[0];
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    
    const payload = { id: usuario.id, username: usuario.username, role: usuario.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensaje: "Login exitoso", token, user: payload });
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    // 1. Verificar si el usuario o el email ya existen antes de intentar insertar
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      // Si ya existe, enviamos una respuesta clara para que el frontend la capture
      return res.status(400).json({ mensaje: "El usuario o el correo electrónico ya están registrados" });
    }

    // 2. Si no existe, procedemos con el registro normal
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role || 'user']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en registro:", err.message);
    res.status(500).json({ mensaje: "Error al registrar usuario en el servidor" });
  }
};

exports.getClientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_cedula, 
        c.name, 
        c.apellido, 
        c.fecha_creacion,
        c.tiene_documentos,
        (SELECT COUNT(*)::int FROM creditos cr WHERE cr.cliente_id = CAST(c.id_cedula AS TEXT)) as cant_creditos,
        (SELECT COUNT(*)::int FROM creditos cr WHERE cr.cliente_id = CAST(c.id_cedula AS TEXT) AND cr.estado != 'Pagado') as creditos_activos
      FROM clientes c
      ORDER BY c.fecha_creacion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(" Error al obtener lista de clientes:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.deleteUsuario = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
};