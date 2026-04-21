const jwt = require('jsonwebtoken');

// Verificación de seguridad al cargar el módulo
if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR CRÍTICO: JWT_SECRET no definido en el archivo .env");
  // En producción, esto evita que la app sea vulnerable por falta de llave
}

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Soporta tanto si envían solo el token como si envían "Bearer <token>"
  const token = authHeader && authHeader.startsWith('Bearer ') 
                ? authHeader.split(' ')[1] 
                : authHeader;

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso denegado. No se proporcionó un token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Datos del payload (id, username, role)
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token inválido o expirado." });
  }
};

const esAdmin = (req, res, next) => {
  // Verificamos que exista el usuario y que su rol sea admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ mensaje: "Permiso denegado. Se requiere nivel de Administrador." });
  }
  next();
};

module.exports = { verificarToken, esAdmin };