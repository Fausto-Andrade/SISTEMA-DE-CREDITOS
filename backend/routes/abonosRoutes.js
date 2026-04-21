const express = require('express');
const router = express.Router();
const abonosController = require('../controllers/abonosController');
const { verificarToken } = require('../authMiddleware'); 


router.post('/', verificarToken, abonosController.crearAbono);
router.get('/credito/:idCredito', verificarToken, abonosController.getAbonosPorCredito);
router.post('/mora', abonosController.marcarMora);

module.exports = router;