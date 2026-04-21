const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informesController');
const { verificarToken } = require('../authMiddleware');

// Rutas existentes
router.get('/resumen-rutas', verificarToken, informesController.getResumenRutas);
router.get('/clientes-pendientes-diarios', verificarToken, informesController.getClientesPendientes);
router.get('/crecimiento-diario', verificarToken, informesController.getCrecimientoDiario);

// Nueva ruta para el Score Crediticio
router.get('/clientes-finalizados', verificarToken, informesController.getClientesFinalizados);

module.exports = router;