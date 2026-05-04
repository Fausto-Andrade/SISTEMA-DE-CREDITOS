const express = require('express');
const router = express.Router();
const creditosController = require('../controllers/creditosController');
const clientesController = require('../controllers/clientesController'); 
const auth = require('../authMiddleware'); 
const pool = require('../db');

// ==========================================
// SECCIÓN CLIENTES
// ==========================================

// Usamos clientesController para todo lo relacionado a la entidad Cliente
router.get('/clientes', auth.verificarToken, clientesController.getClientes); 
router.post('/clientes/registrar', auth.verificarToken, clientesController.registrarCliente);

// AJUSTE CRÍTICO: Estas rutas ahora apuntan a clientesController
router.get('/clientes-completo', auth.verificarToken, clientesController.getListaMaestraClientes);
router.get('/lista-maestra', auth.verificarToken, clientesController.getListaMaestraClientes);

// ==========================================
// SECCIÓN CRÉDITOS Y COBRADORES
// ==========================================

// Ruta específica para cobradores (Lógica directa en el router)
router.get('/cobrador/:username', auth.verificarToken, async (req, res) => {
    const { username } = req.params;
    try {
        const query = `
            SELECT 
                c.id, 
                c.numero_credito_cliente,
                c.monto AS valor_prestamo, 
                c.total_pagar,
                c.cuotas,
                c.frecuencia_cuotas,
                c.estado, 
                c.cliente_id,
                c.interes,
                cl.name AS cliente_nombre, 
                cl.apellido AS cliente_apellido,
                cl.direccion_cobro,
                cl.barrio_cobro,
                cl.celular AS telefono_cobro
            FROM creditos c
            JOIN clientes cl ON CAST(c.cliente_id AS TEXT) = CAST(cl.id_cedula AS TEXT)
            WHERE c.cobrador_asignado = $1 
            AND c.estado != 'Pagado'
            ORDER BY c.id DESC
        `;
        const result = await pool.query(query, [username]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener créditos del cobrador:", error.message);
        res.status(500).json({ mensaje: "Error al cargar tus cobros", detalle: error.message });
    }
});

// Rutas base de créditos (Funciones en creditosController.js)
router.get('/', auth.verificarToken, creditosController.getCreditosPersonalizados);
router.post('/', auth.verificarToken, creditosController.crearCredito);
router.get('/todos', auth.verificarToken, creditosController.getTodosLosCreditos);

// Ruta con parámetro dinámico
router.get('/detalle/:id', auth.verificarToken, creditosController.getCreditoPorId);

// --- HISTORIAL ---
router.get('/clientes/detalle/:cedula', auth.verificarToken, creditosController.getDetalleCliente);

// --- OTROS ---
router.post('/abonos', auth.verificarToken, creditosController.createAbono);
router.get('/rutas', auth.verificarToken, creditosController.getRutas);

module.exports = router;