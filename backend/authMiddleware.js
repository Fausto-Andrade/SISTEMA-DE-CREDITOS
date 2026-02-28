const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Obtenemos el token del encabezado 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Separamos "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso denegado. No hay token." });
  }

  try {
    // Verificamos el token con nuestra clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Guardamos los datos del usuario (id, rol) en la petición
    next();
  } catch (error) {
    res.status(403).json({ mensaje: "Token inválido o expirado." });
  }
};

// Middleware específico para Administradores
const esAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ mensaje: "Permiso denegado. Se requiere rol de Admin." });
  }
  next();
};

module.exports = { verificarToken, esAdmin };