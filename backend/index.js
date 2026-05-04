require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importación de Rutas (Todos con require)
const authRoutes = require('./routes/authRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const informesRoutes = require('./routes/informesRoutes');
const creditosRoutes = require('./routes/creditosRoutes');
const docRoutes = require('./routes/docRoutes');
const abonosRoutes = require('./routes/abonosRoutes');
const rutasRoutes = require('./routes/rutasRoutes'); 
const compradoresRoutes = require('./routes/compradoresRoutes');

const app = express();

// Middlewares
app.use(cors());           
app.use(express.json());   

// Uso de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/informes', informesRoutes); 
app.use('/api/creditos', creditosRoutes); 
app.use('/api/abonos', abonosRoutes);
app.use('/api/documentos', docRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api', compradoresRoutes); 

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});