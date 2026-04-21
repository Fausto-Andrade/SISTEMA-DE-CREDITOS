import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/auth";
import Swal from 'sweetalert2';
import '../App.css';

const CargarDoc = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para archivos y UI
  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [cedulaCliente, setCedulaCliente] = useState(null);

  // 1. Efecto para capturar la cédula de la URL apenas cargue el componente
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cedula = queryParams.get("cedula");
    if (cedula) {
      setCedulaCliente(cedula);
      console.log("Cédula recuperada con éxito:", cedula);
    } else {
      console.warn("No se encontró cédula en la URL");
    }
  }, [location]);

  // Manejar la selección de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(files);

    // Generar previsualizaciones
    const previews = files.map(file => URL.createObjectURL(file));
    setPrevisualizaciones(previews);
  };

  const onSubmit = async (e) => {
    if (e) e.preventDefault();

    console.log("Iniciando envío...");
    console.log("Cédula detectada para envío:", cedulaCliente);
    console.log("Archivos seleccionados:", archivos.length);

    // Verificación de seguridad: Si no hay cédula, no dejamos subir nada
    if (!cedulaCliente) {
      return Swal.fire('Error', 'No se detectó la identificación del cliente. Por favor, regresa al listado y vuelve a intentarlo.', 'error');
    }

    if (archivos.length === 0) {
      return Swal.fire('Atención', 'Por favor selecciona al menos un archivo.', 'info');
    }

    setSubiendo(true);
    const formData = new FormData();
    
    // 2. Agregamos la cédula al FormData (Clave para actualizar la DB)
    formData.append('cedula', cedulaCliente);

    // Agregamos todos los archivos al FormData
    archivos.forEach((archivo) => {
      formData.append('documentos', archivo);
    });

    try {
      // 3. Envío al servidor
      await api.post('/documentos/cargar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire('¡Éxito!', 'Documentos vinculados correctamente al cliente.', 'success').then(() => {
        // Al terminar, volvemos a la lista de clientes para ver el estado "CARGADOS"
        navigate('/clientes');
      });
    } catch (error) {
      console.error("Error al subir:", error);
      Swal.fire('Error', 'No se pudieron vincular los documentos en el servidor.', 'error');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <div className="formbold-form-title">
          <h2 style={{ color: '#6A64F1' }}>Cargar Documentación</h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd' }}>
            <p style={{ fontWeight: 'bold', color: '#555', margin: 0 }}>
              Cliente ID: {cedulaCliente ? cedulaCliente : <span style={{ color: 'red' }}>No detectado</span>}
            </p>
          </div>
          <p>Sube las fotos de la cédula o documentos del cliente (Opcional).</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="formbold-mb-5">
            <label htmlFor="file" className="formbold-form-label">
              Seleccionar imágenes (Cédula frontal, trasera, etc.)
            </label>
            <input
              type="file"
              name="file"
              id="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="formbold-form-input"
              style={{ padding: '10px' }}
            />
          </div>

          {/* Contenedor de Previsualización */}
          {previsualizaciones.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px', marginBottom: '15px' }}>
              {previsualizaciones.map((src, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img 
                    src={src} 
                    alt={`Preview ${index}`} 
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #6A64F1' }} 
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="formbold-btn" 
              style={{ backgroundColor: (subiendo || !cedulaCliente) ? '#ccc' : '#2ecc71' }}
              disabled={subiendo || !cedulaCliente}
            >
              {subiendo ? 'Subiendo...' : 'Confirmar Carga'}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/clientes')} 
              className="formbold-btn" 
              style={{ backgroundColor: '#6a64f1' }}
            >
              Cancelar y Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CargarDoc;