const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../authMiddleware');
const pool = require('../db');

// --- AUTH ---
router.post('/login', authController.login);
router.post('/register', authController.register);

// --- USUARIOS (Gestión interna) ---
router.get('/usuarios-registrados', verificarToken, esAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

router.get('/usuarios-cobradores', verificarToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, username FROM users ORDER BY username ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Error al traer cobradores" });
    }
});

router.delete('/usuarios/:id', verificarToken, esAdmin, authController.deleteUsuario);

module.exports = router;