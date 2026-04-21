const pool = require('../db'); 

const crearRuta = async (req, res) => {
    const { nombre_ruta, fecha, id_user } = req.body;

    if (!nombre_ruta || !fecha || !id_user) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const query = `
            INSERT INTO rutas (nombre_ruta, fecha, id_user)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        // Normalizamos para que la restricción UNIQUE de la DB funcione siempre
        const values = [nombre_ruta.trim().toUpperCase(), fecha, id_user];
        const result = await pool.query(query, values);

        res.status(201).json({
            message: 'Ruta creada exitosamente',
            ruta: result.rows[0]
        });

    } catch (error) {
        // CAPTURAMOS EL ERROR 23505 (LLAVE DUPLICADA)
        if (error.code === '23505') {
            console.warn('Bloqueado intento de duplicado:', error.constraint);
            return res.status(409).json({ 
                error: 'duplicado', 
                message: 'La combinación de ruta y cobrador ya existe.',
                constraint: error.constraint 
            });
        }

        // Cualquier otro error de base de datos
        console.error('Error no controlado en el servidor:', error);
        return res.status(500).json({ 
            error: 'server_error', 
            message: 'Ocurrió un fallo inesperado en el servidor.' 
        });
    }
};

module.exports = { crearRuta };