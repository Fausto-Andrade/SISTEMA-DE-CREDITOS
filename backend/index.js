// Importa la librería Express.
// Express es un framework para crear servidores en Node.js.
// Permite manejar rutas, middlewares y peticiones HTTP fácilmente.

const express = require('express');

// Importa el middleware cors.
// Sirve para permitir peticiones desde otros dominios.
// Ejemplo: tu frontend en localhost:3000 puede hacer peticiones al backend en localhost:5000.

const cors = require('cors');

// Importa el archivo routes.js (o carpeta routes con index.js).
// Ese archivo contiene las rutas (endpoints) de tu aplicación.
// Lo guardas en la variable authRoutes.

const authRoutes = require('./routes'); // 1. Importas el archivo que acabas de crear


// Crea una aplicación de Express, app es tu servidor, a partir de aquí configuras todo.
const app = express();

// Activa CORS para todas las rutas, permite que otros dominios consuman tu API.
// Sin esto, el navegador bloquearía las peticiones del frontend.
app.use(cors());

// Middleware que permite recibir datos en formato JSON.
// Sin esto, req.body sería undefined.
// Se usa cuando el cliente envía datos tipo JSON
app.use(express.json());

// 2. Conectas las rutas a un prefijo (ej: /api)
//La ruta real sera: http://localhost:5000/api/login
app.use('/api', authRoutes); 

// Inicia el servidor, le dice que escuche en el puerto 5000.
app.listen(5000, () => {
  console.log("Servidor corriendo en http://localhost:5000"); // Mensaje que aparece cuando el servidor inicia correctamente.
});