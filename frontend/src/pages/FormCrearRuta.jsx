// src/pages/FormCrearRuta.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // Importa la librería
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api, { rutasApi } from '../api/auth';// Importa la API que creamos
import { FaMapMarkedAlt, FaUserTie, FaCalendarAlt, FaCalendarPlus } from 'react-icons/fa'; // Iconos para diseño
import '../App.css'; // Asegúrate que tenga los estilos de .login-box, etc.

const FormCrearRuta = ({ onRutaCreada }) => {
  const [cobradores, setCobradores] = useState([]);
  const [errorServer, setErrorServer] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isValid } 
  } = useForm({
    mode: "onChange",
    defaultValues: {
      zona: "",
      fecha: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
      id_cobrador: ""
    }
  });

  // 1. Cargar cobradores al montar el componente
 useEffect(() => {
  const cargarCobradores = async () => {
    try {
      // Ahora 'api' ya está definido gracias a la importación
      const res = await api.get('/usuarios-registrados'); 
      
      console.log("¡Éxito! Datos recibidos:", res.data);

      // Filtramos solo los que tienen rol 'user'
      const soloCobradores = res.data.filter(u => u.role === 'user');
      setCobradores(soloCobradores);
      
    } catch (err) {
      // Aquí verás el error real de la API si vuelve a ocurrir
      setErrorServer("Error al conectar con la ruta de usuarios.");
    }
  };
  cargarCobradores();
}, []);

const onSubmit = async (data) => {
  try {
    setErrorServer('');
    setSuccess(false);
    
    // Enviamos los datos
    const response = await rutasApi.crear(data);
    
    console.log("Ruta creada:", response.data);
    
    // 1. Mostrar la ventana de éxito profesional
    await Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Ruta creada exitosamente',
      confirmButtonColor: '#6a64f1',
      confirmButtonText: 'Aceptar'
    });

    // 2. Limpiar formulario y redireccionar
    reset();
    setSuccess(true);
    if (onRutaCreada) onRutaCreada(); 
    navigate('/admin-dashboard');
    
  } catch (error) {
    console.error("Error creando ruta", error);
    
    // 3. Manejo de error real (aquí SÍ notificamos el fallo)
    const mensajeError = error.response?.data?.message || 'Error al conectar con el servidor';
    setErrorServer(mensajeError);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensajeError,
      confirmButtonColor: '#d33'
    });
  }
};

  return (
    // Usamos las mismas clases CSS de Login y Registro

    <div className="formbold-main-wrapper" style={{ maxWidth: '450px', margin: '20px auto' }}>
      <div className="formbold-form-wrapper">
        <h2 className="login-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarPlus style={{ color: '#6A64F1' }} />
          Crear Nueva Ruta
        </h2>
          
          {errorServer && <p style={{ color: 'red', textAlign: 'center' }}>{errorServer}</p>}
          {success && <p style={{ color: 'green', textAlign: 'center' }}>¡Ruta creada con éxito!</p>}
      
          <div style={{
              display: 'flex',
              justifyContent: 'center', // Centrado horizontal
              alignItems: 'center',     // Centrado vertical
              minHeight: '30vh',       // Asegura que ocupe toda la altura visible
              padding: '20px',
              width: '100%'             // Asegura que ocupe todo el ancho
            }}>

          <form onSubmit={handleSubmit(onSubmit)} 
            className="login-form" style={{
            width: '100%',           // Un ancho responsivo
            maxWidth: '500px',      // No dejar que se pase de 500px en PCs
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}>
            
            {/* Campo: Zona (VARCHAR) */}
            <div className="input-group" style={{ position: 'relative' }}>
              <FaMapMarkedAlt style={styles.icon} />
              <input
                type="text"
                placeholder="Nombre de la Zona (ej. Centro, Sur)"
                className="form-input"
                style={styles.inputWithIcon}
                {...register('zona', { required: "La zona es obligatoria", minLength: { value: 3, message: "Mínimo 3 caracteres" } })}
              />
            </div>
            {errors.zona && <span className="error-text">{errors.zona.message}</span>}

            {/* Campo: Fecha (DATE) */}
            <div className="input-group" style={{ position: 'relative' }}>
              <FaCalendarAlt style={styles.icon} />
              <input
                type="date"
                className="form-input"
                style={styles.inputWithIcon}
                {...register('fecha', { required: "La fecha es obligatoria" })}
              />
            </div>
            {errors.fecha && <span className="error-text">{errors.fecha.message}</span>}
            
            {/* Campo: ID Cobrador (Desplegable) */}
            <div className="input-group" style={{ position: 'relative' }}>
              <FaUserTie style={styles.icon} />
              <select 
                className="form-input" 
                style={styles.inputWithIcon}
                {...register('id_user', { required: "Seleccione un cobrador" })}
                >
                  <option value="">-- Seleccione un Cobrador --</option>
                  {cobradores.map(cobrador => (
                    <option key={cobrador.id} value={cobrador.id}>
                      {cobrador.username}
                    </option>
                  ))}
                </select>
            </div>
            {errors.id_cobrador && <span className="error-text">{errors.id_cobrador.message}</span>}

            <button 
              type="submit" 
              className="register-button" // Usamos la misma clase de Registro (botón morado)
              disabled={!isValid}
              style={{
                ...styles.button,
                cursor: isValid ? 'pointer' : 'not-allowed',
                opacity: isValid ? 1 : 0.5,
                backgroundColor: isValid ? '#6A64F1' : '#ccc',
              }}
            >
              Guardar Ruta
            </button>
            
            
          </form>
        </div>
      </div>
    </div>
  );
};

// Estilos locales rápidos para iconos dentro de inputs
const styles = {
  icon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#ccc', // Gris suave por defecto
    fontSize: '18px',
    zIndex: 2
  },
  inputWithIcon: {
    paddingLeft: '40px' // Espacio para el icono
  },
  button: {
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    width: '100%',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '15px'
  }
};

export default FormCrearRuta;