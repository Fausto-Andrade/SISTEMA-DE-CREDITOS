const { Router } = require('express');
const router = Router();
// Importamos el controlador que acabas de crear
const compradoresController = require('../controllers/compradoresController');

// 1. Obtener todas las empresas
router.get('/compradores', compradoresController.obtenerTodos);

// 2. Crear una nueva empresa
router.post('/compradores', compradoresController.crearComprador);

// 3. Eliminar una empresa
router.delete('/compradores/:id', compradoresController.eliminarComprador);

module.exports = router;