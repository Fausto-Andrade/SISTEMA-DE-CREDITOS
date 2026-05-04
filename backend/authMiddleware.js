const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Soporta tanto el formato "Bearer <token>" como el token directo
  const token = authHeader && authHeader.startsWith('Bearer ') 
                ? authHeader.split(' ')[1] 
                : authHeader;

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso denegado. No se proporcionó un token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Al asignar 'decoded' a 'req.user', estamos inyectando:
    // id, username, role e id_comprador en cada petición protegida.
    req.user = decoded; 
    
    next();
  } catch (error) {
    console.error("Error en verificación de token:", error.message);
    return res.status(403).json({ mensaje: "Token inválido o expirado." });
  }
};

/**
 * Middleware para restringir acceso solo a personal administrativo.
 * Permite el paso tanto a 'admin' como a 'super_admin'.
 */
const esAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({ mensaje: "Permiso denegado. Se requiere nivel administrativo." });
  }
  next();
};

module.exports = { verificarToken, esAdmin };