require('dotenv').config();
// 1. PRIMERO: Los requires (las importaciones)
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes');
const { SiDotenv } = require('react-icons/si');

// 2. SEGUNDO: La inicialización
const app = express();

// 3. TERCERO: Los middlewares (aquí es donde usas cors y express.json)
app.use(cors());           // Esto ahora sí sabe qué es 'cors'
app.use(express.json());   // Esto es lo que soluciona tu error de 'undefined'

// 4. CUARTO: Las rutas
app.use('/api', authRoutes);

// 5. QUINTO: El inicio del servidor
app.listen(5000, () => {
  console.log("Servidor corriendo en http://localhost:5000");
});