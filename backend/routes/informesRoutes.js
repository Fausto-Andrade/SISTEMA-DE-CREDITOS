const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informesController');

// LINEA 8: Asegúrate de que los nombres después del punto sean IGUALES a los del controlador
router.get('/resumen-rutas', informesController.getResumenRutas);
router.get('/clientes-pendientes-diarios', informesController.getClientesPendientes);
router.get('/crecimiento-diario', informesController.getCrecimientoDiario);
router.get('/clientes-finalizados', informesController.getClientesFinalizados);

module.exports = router;