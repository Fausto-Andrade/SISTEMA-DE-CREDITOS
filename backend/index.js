const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes'); // 1. Importas el archivo que acabas de crear

const app = express();

app.use(cors());
app.use(express.json());

// 2. Conectas las rutas a un prefijo (ej: /api)
app.use('/api', authRoutes); 

app.listen(5000, () => {
  console.log("Servidor corriendo en http://localhost:5000");
});