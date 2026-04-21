const express = require('express');
const router = express.Router();
const creditosController = require('../controllers/creditosController');
const { verificarToken } = require('../authMiddleware');
// const pool = require('../db');

// --- CLIENTES ---
router.get('/clientes', verificarToken, creditosController.getClientes);
router.post('/clientes', verificarToken, creditosController.createCliente);
router.get('/cliente/detalle/:cedula', verificarToken, creditosController.getDetalleCliente);

// --- CRÉDITOS ---

router.post('/', verificarToken, creditosController.crearCredito);
router.get('/creditos/cobrador', verificarToken, creditosController.getCreditosPorCobrador);
router.get('/detalle/:id', verificarToken, creditosController.getCreditoPorId);

// Detalle del cliente y crédito (Movido aquí por lógica de negocio)
router.get('/clientes/detalle/:cedula', verificarToken, async (req, res) => {
    try {
        const { cedula } = req.params;
        const clienteRes = await pool.query(`SELECT * FROM clientes WHERE id_cedula = $1`, [cedula]);
        if (clienteRes.rows.length === 0) return res.status(404).json({ error: "No existe" });
        
        const creditosRes = await pool.query(
            `SELECT cr.*, 
            (cr.total_pagar - COALESCE((SELECT SUM(monto_abono) FROM abonos_credito WHERE id_credito = cr.id), 0)) as saldo_pendiente
             FROM creditos cr WHERE cr.cliente_id = $1 ORDER BY cr.fecha_inicio DESC`, [cedula]
        );
        res.json({ cliente: clienteRes.rows[0], creditos: creditosRes.rows });
    } catch (err) {
        res.status(500).json({ error: "Error servidor" });
    }
});

// --- ABONOS ---
router.post('/abonos', verificarToken, creditosController.createAbono);

// --- RUTAS ---
router.get('/rutas', verificarToken, creditosController.getRutas);

router.get('/cobrador', verificarToken, creditosController.getCreditosPorCobrador);

router.get('/todos', verificarToken, creditosController.getTodosLosCreditos);

module.exports = router;