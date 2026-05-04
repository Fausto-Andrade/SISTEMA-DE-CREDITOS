const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../authMiddleware');
const pool = require('../db');

// --- AUTH ---
router.post('/login', authController.login);
router.post('/registro', verificarToken, esAdmin, authController.register);

// --- USUARIOS ---

// Obtener detalle de un usuario (Perfil)
router.get('/usuarios/:id', verificarToken, authController.obtenerPerfil);

// Actualizar usuario
router.put('/usuarios/:id', verificarToken, esAdmin, authController.updateUsuario);

// Lista de todos los usuarios (para la tabla de administración)
router.get('/usuarios-registrados', verificarToken, esAdmin, authController.listarUsuarios);

// Lista simplificada para selectores de cobradores
router.get('/usuarios-cobradores', verificarToken, authController.listarCobradores);

// Eliminar usuario
router.delete('/usuarios/:id', verificarToken, esAdmin, authController.eliminarUsuario);

module.exports = router;