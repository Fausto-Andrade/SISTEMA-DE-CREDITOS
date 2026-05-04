// Importamos la conexión a la base de datos (ajusta la ruta según tu proyecto)
const pool = require('../db'); 

const compradoresController = {
    // Crear una nueva empresa
    crearComprador: async (req, res) => {
        const { nombre_empresa, max_rutas_permitidas } = req.body;

        try {
            // Validamos que los datos no lleguen vacíos
            if (!nombre_empresa || max_rutas_permitidas === undefined) {
                return res.status(400).json({ message: "Todos los campos son obligatorios" });
            }

            
            const query = `
                INSERT INTO compradores (nombre_empresa, max_rutas_permitidas) 
                VALUES ($1, $2) 
                RETURNING *`;
            
            const values = [nombre_empresa, parseInt(max_rutas_permitidas, 10)];

            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error("Error en compradoresController:", error.message);
            res.status(500).json({ message: "Error al crear la empresa en el servidor" });
        }
    },

    // Obtener todas las empresas (para tu tabla principal)
    obtenerTodos: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM compradores ORDER BY id_comprador ASC');
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ message: "Error al obtener empresas" });
        }
    },

    // Eliminar empresa
    eliminarComprador: async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM compradores WHERE id_comprador = $1', [id]);
            res.json({ message: "Empresa eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ message: "Error al eliminar empresa" });
        }
    }
};

module.exports = compradoresController;