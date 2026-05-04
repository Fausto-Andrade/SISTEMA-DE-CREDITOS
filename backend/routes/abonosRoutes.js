const express = require('express');
const router = express.Router();
const abonosController = require('../controllers/abonosController');
const { verificarToken } = require('../authMiddleware'); 

// Rutas existentes
router.post('/', verificarToken, abonosController.crearAbono);
router.get('/credito/:idCredito', verificarToken, abonosController.getAbonosPorCredito);
router.post('/mora', abonosController.marcarMora);

// NUEVA RUTA: Obtener recaudo diario por cobrador
router.get('/recaudo-dia/:id_cobrador', verificarToken, abonosController.getRecaudoDia);

module.exports = router;