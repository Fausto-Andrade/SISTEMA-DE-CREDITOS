const pool = require('../db');

// Obtener lista detallada (para vistas administrativas/específicas)
exports.getClientes = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    const { role, username } = req.user; 
    
    try {
        let query;
        let params = [];

        let baseQuery = `
            SELECT 
                c.id_cedula, 
                c.name, 
                c.apellido, 
                c.fecha_creacion,
                c.tiene_documentos,
                COALESCE(cr.numero_credito_cliente, '0') as numero_credito_cliente, 
                COALESCE(cr.monto, 0) as monto, 
                COALESCE(cr.total_pagar, 0) as total_pagar,
                COALESCE(cr.cobrador_asignado, 'Sin asignar') as cobrador_asignado, 
                cr.estado, 
                cr.fecha_inicio
            FROM clientes c
            LEFT JOIN LATERAL (
                SELECT numero_credito_cliente, monto, total_pagar, cobrador_asignado, estado, fecha_inicio
                FROM creditos 
                WHERE cliente_id = CAST(c.id_cedula AS TEXT)
                ORDER BY id DESC LIMIT 1
            ) cr ON true
        `;

        if (role === 'admin') {
            query = `${baseQuery} ORDER BY c.fecha_creacion DESC`;
        } else {
            query = `${baseQuery} WHERE cr.cobrador_asignado = $1 ORDER BY c.fecha_creacion DESC`;
            params = [username];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("❌ ERROR SQL EN getClientes:", err.message);
        res.status(500).json({ error: "Error en la consulta", detalle: err.message });
    }
};

// REGISTRO DE CLIENTES

exports.registrarCliente = async (req, res) => {
    const {
        id_cedula, name, apellido, celular, direccion, barrio_cliente,
        pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro,
        empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa,
        nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador,
        barrio_fiador, notas, id_cobrador, id_comprador 
    } = req.body;

    try {
        const query = `
            INSERT INTO clientes (
                id_cedula, name, apellido, celular, direccion, barrio_cliente,
                pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro,
                empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa,
                nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador,
                barrio_fiador, notas, id_cobrador, id_comprador, 
                cant_creditos, tiene_documentos
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 
                0, false -- Valores por defecto para nuevos clientes
            ) RETURNING *`;
        
        const values = [
            id_cedula, name, apellido, celular, direccion, barrio_cliente, 
            pais, departamento_cliente, ciudad, barrio_cobro, direccion_cobro, 
            empresa, cargo, direccion_empresa, ciudad_empresa, telefono_empresa, 
            nombre_fiador, celular_fiador, ciudad_fiador, direccion_fiador, 
            barrio_fiador, notas, id_cobrador, id_comprador
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ mensaje: "Cliente registrado con éxito", cliente: result.rows[0] });
    } catch (error) {
        console.error("Error al registrar:", error.message);
        res.status(500).json({ mensaje: "Error al registrar cliente", error: error.message });
    }
};

// LISTA MAESTRA (Optimizada para evitar duplicados y mostrar clientes nuevos)
exports.getListaMaestraClientes = async (req, res) => {
    const { id_comprador } = req.query;
    
    if (!id_comprador) {
        return res.status(400).json({ error: "id_comprador es requerido" });
    }

    try {
        // Usamos LEFT JOIN simple para NO perder ningún crédito
        // Y COALESCE para que los clientes nuevos tengan valores por defecto en lugar de nulls problemáticos
        const query = `
            SELECT 
                cl.id_cedula, 
                cl.name, 
                cl.apellido, 
                cl.tiene_documentos, 
                cl.id_comprador,
                cr.id AS id_credito, 
                cr.numero_credito_cliente, 
                cr.monto, 
                cr.total_pagar, 
                cr.estado, 
                cr.cobrador_asignado,
                -- Si no hay crédito, usamos la fecha de creación del cliente
                COALESCE(cr.fecha_inicio, cl.fecha_creacion) AS fecha_creacion,
                (SELECT COUNT(*) FROM creditos WHERE cliente_id = CAST(cl.id_cedula AS TEXT)) as total_creditos
            FROM clientes cl
            LEFT JOIN creditos cr ON CAST(cl.id_cedula AS TEXT) = CAST(cr.cliente_id AS TEXT)
            WHERE CAST(cl.id_comprador AS TEXT) = CAST($1 AS TEXT)
            ORDER BY cl.fecha_creacion DESC, cr.id DESC`;
            
        const result = await pool.query(query, [id_comprador]);
        
        // Log para que verifiques en la consola de Node si están llegando los datos
        console.log(`Cargados ${result.rows.length} registros para comprador: ${id_comprador}`);
        
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error en lista maestra:", error);
        res.status(500).json({ error: "Error al obtener la lista maestra", detalle: error.message });
    }
};