import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../api/auth"; 
import Swal from 'sweetalert2';
import '../App.css';

const CargarDoc = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [archivos, setArchivos] = useState([]);
  const [previsualizaciones, setPrevisualizaciones] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [cedulaCliente, setCedulaCliente] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cedula = queryParams.get("cedula");
    if (cedula) {
      setCedulaCliente(cedula);
    }
  }, [location]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(files);

    // Revocar URLs anteriores para evitar fugas de memoria
    previsualizaciones.forEach(url => URL.revokeObjectURL(url));

    const previews = files.map(file => URL.createObjectURL(file));
    setPrevisualizaciones(previews);
  };

  const onSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!cedulaCliente) {
      return Swal.fire('Error', 'No se detectó la identificación del cliente.', 'error');
    }

    if (archivos.length === 0) {
      return Swal.fire('Atención', 'Por favor selecciona al menos un archivo.', 'info');
    }

    setSubiendo(true);
    const formData = new FormData();
    formData.append('cedula', cedulaCliente);

    archivos.forEach((archivo) => {
      // 'documentos' debe coincidir con la configuración de Multer en el backend
      formData.append('documentos', archivo);
    });

    try {
      /**
       * AJUSTE TÉCNICO DE INSTANCIA:
       * Se extrae la instancia de axios de forma segura desde authApi 
       * para evitar el error "Cannot read properties of undefined (reading 'post')".
       */
      const axiosInstance = authApi.api || (authApi.defaults ? authApi : null);

      if (authApi.cargarDocumentos) {
        // Opción prioritaria: Usar método centralizado si existe en la API
        await authApi.cargarDocumentos(formData);
      } else if (axiosInstance) {
        // Opción secundaria: Usar la instancia de axios configurada
        await axiosInstance.post('/documentos/cargar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Último recurso: Intento directo si authApi es la instancia
        await authApi.post('/documentos/cargar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      Swal.fire('¡Éxito!', 'Documentos vinculados correctamente.', 'success').then(() => {
        navigate('/clientes');
      });
    } catch (error) {
      console.error("Error al subir:", error);
      const errorMsg = error.response?.data?.message || 'No se pudieron vincular los documentos.';
      Swal.fire('Error', errorMsg, 'error');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <div className="formbold-form-title">
          <h2 style={{ color: '#6A64F1' }}>Cargar Documentación</h2>
          
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '15px', 
            border: '1px solid #ddd',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)' 
          }}>
            <p style={{ fontWeight: 'bold', color: '#555', margin: 0 }}>
              Cliente ID: {cedulaCliente ? cedulaCliente : <span style={{ color: 'red' }}>No detectado</span>}
            </p>
          </div>
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
              aria-label="Seleccionar archivos de imagen"
            />
          </div>

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
              style={{ 
                backgroundColor: (subiendo || !cedulaCliente) ? '#ccc' : '#2ecc71',
                cursor: (subiendo || !cedulaCliente) ? 'not-allowed' : 'pointer'
              }}
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