const pool = require("../db"); // Tu conexión a PostgreSQL

exports.subirDocumentos = async (req, res) => {
  try {
    const { cedula } = req.body; // La cédula que enviamos desde el frontend
    const archivos = req.files;

    if (!cedula) {
      return res.status(400).json({ error: "Falta la cédula del cliente." });
    }

    // ACTUALIZACIÓN EN LA BASE DE DATOS
    // Esto es lo que hará que el botón pase de rojo a verde
    const query = "UPDATE clientes SET tiene_documentos = true WHERE id_cedula = $1";
    await pool.query(query, [cedula]);

    res.json({ 
      mensaje: "Documentos cargados y estado actualizado en la base de datos.",
      archivos_recibidos: archivos.length 
    });
  } catch (error) {
    console.error("Error al actualizar la DB:", error);
    res.status(500).json({ error: "Error al vincular los documentos con el cliente." });
  }
};