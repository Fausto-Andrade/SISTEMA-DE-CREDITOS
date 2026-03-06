// db.js
// Importa la librería pg (node-postgres).
// { Pool } significa que estamos extrayendo la clase Pool del paquete.
// Pool sirve para crear un grupo de conexiones (pool de conexiones) a PostgreSQL.
// Esto es mejor que abrir y cerrar conexiones manualmente en cada consulta.

const { Pool } = require('pg');

// Carga las variables del archivo .env.
// .config() hace que las variables del archivo estén disponibles en:

require('dotenv').config();

// Crea una nueva instancia de Pool.
// Aquí se configura la conexión a la base de datos.

const pool = new Pool({
  user: process.env.DB_USER,      // Tu usuario de Postgres
  host: process.env.DB_HOST,      // localhost
  database: process.env.DB_NAME,  // Nombre de tu DB
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Exporta el pool, Permite usarlo en otros archivos.

module.exports = pool;