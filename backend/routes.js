const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Tu conexión a PostgreSQL

//Login

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar al usuario en la base de datos por email
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas (Email)" });
    }

    const usuario = userQuery.rows[0];

    // 2. Comparar la contraseña ingresada con la encriptada en la DB
    const validPassword = await bcrypt.compare(password, usuario.password);
    
    if (!validPassword) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas (Password)" });
    }

    // 3. Crear el "Payload" (los datos que viajan dentro del token)
    const payload = {
      id: usuario.id,
      role: usuario.role // Aquí incluimos el rol (admin o user)
    };

    // 4. Firmar el Token JWT
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // 5. Responder al frontend con el token y los datos básicos
    res.json({
      mensaje: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Registro

router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // 1. Verificar si el usuario ya existe
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insertar en PostgreSQL
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, role || 'user']
    );

    res.status(201).json({
      mensaje: "Usuario registrado con éxito",
      user: { id: newUser.rows[0].id, username: newUser.rows[0].username }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
});

module.exports = router; // Esto permite que otros archivos lo usen