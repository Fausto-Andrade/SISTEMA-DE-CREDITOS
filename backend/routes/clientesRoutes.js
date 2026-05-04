const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Definir el POST para /api/clientes
router.post('/', clientesController.registrarCliente);
router.get('/lista-maestra', clientesController.getListaMaestraClientes); // <-- DEBE APUNTAR AQUÍ
router.post('/registrar', clientesController.registrarCliente);

module.exports = router;