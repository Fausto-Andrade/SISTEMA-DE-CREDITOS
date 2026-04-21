const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Definir el POST para /api/clientes
router.post('/', clientesController.registrarCliente);

module.exports = router;