const pool = require('../db');

exports.registrarCliente = async (req, res) => {
    const {
        id_cedula, name, apellido, celular, direccion, barrio_cliente,
        pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro,
        empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa,
        nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador,
        barrio_fiador, notas, id_cobrador
    } = req.body;

    try {
        const query = `
            INSERT INTO clientes (
                id_cedula, name, apellido, celular, direccion, barrio_cliente,
                pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro,
                empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa,
                nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador,
                barrio_fiador, notas, id_cobrador
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            ) RETURNING *`;

        const values = [
            id_cedula, name, apellido, celular, direccion, barrio_cliente,
            pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro,
            empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa,
            nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador,
            barrio_fiador, notas, id_cobrador
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            mensaje: "Cliente registrado con éxito",
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error(" Error en clientesController:", error);
        res.status(500).json({ 
            mensaje: "Error al registrar cliente en la base de datos",
            error: error.message 
        });
    }
};