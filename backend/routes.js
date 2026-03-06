// Importa Express lo usas para crear rutas.
const express = require('express');

// router permite definir rutas separadas del archivo principal, luego lo conectas con app.use('/api', router).
const router = express.Router();

// Librería para encriptar contraseñas, también permite comparar contraseñas en login.
const bcrypt = require('bcrypt');

// Importa la conexión a PostgreSQL 
const jwt = require('jsonwebtoken');

// pool.query() se usa para hacer consultas.
const pool = require('./db'); // Tu conexión a PostgreSQL

//Login

router.post('/login', async (req, res) => {

  // Extrae email y password enviados desde el frontend.
  const { email, password } = req.body;

  try {
    // 1. Buscar al usuario en la base de datos por email
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]); // $1 evita SQL Injection, [email] reemplaza $1.
    
    // Si no existe el usuario → error 401.
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas (Email)" });
    }

    // Guarda el usuario encontrado.
    const usuario = userQuery.rows[0];

    // 2. Comparar la contraseña ingresada con la encriptada en la DB
    const validPassword = await bcrypt.compare(password, usuario.password); // Devuelve true o false.
    
    // Si la contraseña no coincide → error 401.
    if (!validPassword) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas (Password)" });
    }

    // 3. Crear el "Payload" (los datos que viajan dentro del token)
    const payload = {
      id: usuario.id,
      username: usuario.id,
      role: usuario.role // Aquí incluimos el rol (admin o user)
    };

    // 4. Firmar el Token JWT, usa la clave secreta
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // 5. Responder al frontend con el token y los datos básicos del usuario
    res.json({
      mensaje: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role
      }
    });

    // Si algo falla → error 500.
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Register

router.post('/register', async (req, res) => {
  // 1. IMPORTANTE: Los nombres deben coincidir con el {...register('campo')} del Frontend
  const { username, email, password, role } = req.body; 

  try {

    // Encriptar la contraseña antes de guardar
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Insertar en la base de datos
    // Asegúrate de que la columna se llame 'role' en tu tabla
    const query = `
      INSERT INTO users (username, email, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, username, email, role
    `;
    
    const values = [username, email, hashedPassword, role || 'user'];
    const result = await pool.query(query, values);

    // 3. RESPUESTA CLAVE: Enviamos el usuario creado incluyendo el ROL
    // Si no envías el rol aquí, el Frontend no sabrá a dónde redireccionar
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Error en DB:", err.message);
    res.status(500).json({ message: "Error al registrar usuario en la base de datos" });
  }
});

// Ruta: GET /api/usuarios-registrados
router.get('/usuarios-registrados', async (req, res) => {
  try {
    // Traemos a todos los usuarios, ordenados por los más recientes
    const result = await pool.query(
      'SELECT id, username, email, role FROM users ORDER BY id DESC'
    );

    console.log("Usuarios enviados al front:", result.rows.length); // Mira tu terminal de Node

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "No se pudo obtener la lista de usuarios" });
  }
});

// Ruta para el registro de clientes tipo POST.
router.post('/clientes', async (req, res) => {

  // Extrae datos del cliente.
  const { username, apellido, correo, celular, direccion, genero, ciudad } = req.body;
  
  try {

    // Inserta datos en tabla clientes y devuelve el cliente creado.
    const nuevoCliente = await pool.query(
      `INSERT INTO clientes (username, apellido, correo, celular, direccion, genero, ciudad) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [username, apellido, correo, celular, direccion, genero, ciudad]
    );

    res.status(201).json({
      mensaje: "Cliente registrado con éxito",
      cliente: nuevoCliente.rows[0]
    });
  } catch (error) {
    console.error("Error al insertar cliente:", error);
    // Manejo de error por correo duplicado (UNIQUE), violación de clave única (correo duplicado).
    if (error.code === '23505') {
      return res.status(400).json({ mensaje: "El correo ya está registrado." }); 
    }
    res.status(500).json({ mensaje: "Error al guardar en la base de datos." });
  }
});

// Ruta para obtener todos los clientes y llenar el select
router.get('/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, apellido FROM clientes ORDER BY name ASC');
    res.json(result.rows); // Esto envía los clientes a React
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// Lógica en el Backend para el registrar el conscutivo del credito
router.post('/creditos', async (req, res) => {
  const { cliente_id, monto, cuotas, interes, fecha_inicio } = req.body;

  try {
    // 1. Buscamos el último número de crédito para ESE cliente específico
    const lastNumRes = await pool.query(
      'SELECT MAX(numero_credito_cliente) as ultimo FROM creditos WHERE cliente_id = $1',
      [cliente_id]
    );
    
    // Si no tiene ninguno, empezamos en 1, si tiene, sumamos +1
    const nuevoNumero = (lastNumRes.rows[0].ultimo || 0) + 1;

    // 2. Insertamos el registro con ese número calculado
    const result = await pool.query(
      `INSERT INTO creditos (cliente_id, numero_credito_cliente, monto, cuotas, interes, fecha_inicio) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente_id, nuevoNumero, monto, cuotas, interes, fecha_inicio]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el crédito" });
  }
});

// Exportar el router
module.exports = router; // Esto permite que otros archivos lo usen.