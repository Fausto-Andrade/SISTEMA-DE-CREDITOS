// Importa la librería jsonwebtoken.
// Esta librería se usa para crear y verificar tokens JWT (JSON Web Tokens).
// jwt será el objeto con los métodos como sign() y verify().

const jwt = require('jsonwebtoken');

// Se define una función middleware para Express, recibe:
// req → request (petición), res → response (respuesta), next → función que pasa al siguiente middleware

const verificarToken = (req, res, next) => {
  // Obtenemos el token del encabezado 'Authorization de la petición HTTP.'
  const authHeader = req.headers['authorization'];

  // Si no existe, token será undefined
  const token = authHeader && authHeader.split(' ')[1]; // Separamos "Bearer TOKEN por espacios"

// Si no hay token: devuelve estado 401 (Unauthorized).
// Envía mensaje en formato JSON.
// return detiene la ejecución del middleware.

  if (!token) {
    return res.status(401).json({ mensaje: "Acceso denegado. No hay token." });
  }

// Se usa try porque jwt.verify() puede lanzar error si el token es inválido o expiró.
  try {

    // Verificamos el token con nuestra clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // es la clave guardada en variables de entorno.

    // Guardamos los datos del usuario (id, rol) en la petición
    req.user = decoded; 
    
  // Llama al siguiente middleware o controlador.
  // Significa: “Todo está bien, continúa”.
    next();

  // Si el token está mal firmado, Está expirado, Fue alterado
  // Devuelve 403 (Forbidden).

  } catch (error) {
    res.status(403).json({ mensaje: "Token inválido o expirado." });
  }
};

// Middleware específico para Administradores, se usa después de verificarToken.
const esAdmin = (req, res, next) => {

// Revisa el rol del usuario.
  if (req.user.role !== 'admin') {

    // Si no es admin Devuelve 403, No permite continuar.
    return res.status(403).json({ mensaje: "Permiso denegado. Se requiere rol de Admin." });
  }

  // Si es admin, continua con la ruta protegida 
  next();
};

// Exporta ambos middlewares permite usarlos en otros archivos:
module.exports = { verificarToken, esAdmin };