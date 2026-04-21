import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/auth'; 
import { FaMapMarkedAlt, FaUserTie, FaCalendarAlt, FaCalendarPlus } from 'react-icons/fa';
import '../App.css';

const FormCrearRuta = ({ onRutaCreada }) => {
  const [cobradores, setCobradores] = useState([]);
  const [errorServer, setErrorServer] = useState('');
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isValid } 
  } = useForm({
    mode: "onChange",
    defaultValues: {
      nombre_ruta: "", 
      fecha: new Date().toISOString().split('T')[0],
      id_user: ""      
    }
  });

  useEffect(() => {
    const cargarCobradores = async () => {
      try {
        const res = await api.get('/usuarios-registrados'); 
        const soloCobradores = res.data.filter(u => u.role === 'user');
        setCobradores(soloCobradores);
      } catch (err) {
        setErrorServer("Error al conectar con la base de usuarios.");
      }
    };
    cargarCobradores();
  }, []);

  const onSubmit = async (data) => {
    try {
      setErrorServer('');
      
      const idUserNuevo = parseInt(data.id_user, 10);
      const nombreNuevo = data.nombre_ruta.trim().toUpperCase();

      // Intento de guardado directo
      await api.post('/rutas', {
        ...data,
        nombre_ruta: nombreNuevo,
        id_user: idUserNuevo
      });
      
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Ruta creada y vinculada correctamente',
        confirmButtonColor: '#6a64f1'
      });

      reset();
      if (onRutaCreada) onRutaCreada(); 
      navigate('/admin-dashboard');
      
    } catch (error) {
      // --- ESTRATEGIA DE DETECCIÓN AGRESIVA PARA PRODUCCIÓN ---
      // Capturamos el 409 (Conflict) o el nombre de la restricción en el cuerpo del error
      const cuerpoError = error.response?.data ? JSON.stringify(error.response.data) : "";
      const mensajeError = error.message || "";
      const infoCompleta = (cuerpoError + mensajeError).toUpperCase();

      // Si el servidor responde 409 o el texto contiene nuestra clave de duplicidad
      if (error.response?.status === 409 || infoCompleta.includes('ALERTA_DUPLICADO_RUTA') || infoCompleta.includes('DUPLICADO')) {
        Swal.fire({
          icon: 'warning',
          title: 'Ruta ya existente',
          text: 'Este cobrador ya tiene asignada esta ruta. Por favor, verifica los datos o intenta con otra combinación.',
          confirmButtonColor: '#f39c12'
        });
      } else {
        // Manejo de otros errores (el mensaje rojo en el form)
        const msg = error.response?.data?.error || "Error al crear la ruta";
        setErrorServer(msg);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'No se pudo procesar la solicitud en el servidor.' 
        });
      }
    }
  };

  return (
    <div className="formbold-main-wrapper" style={{ maxWidth: '450px', margin: '20px auto' }}>
      <div className="formbold-form-wrapper">
        <h2 className="login-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarPlus style={{ color: '#6A64F1' }} /> Configurar Ruta
        </h2>
        
        {errorServer && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{errorServer}</p>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="input-group" style={{ position: 'relative' }}>
            <FaMapMarkedAlt style={styles.icon} />
            <input
              type="text"
              placeholder="Nombre de la Ruta"
              className="form-input"
              style={styles.inputWithIcon}
              {...register('nombre_ruta', { required: true, minLength: 3 })}
            />
          </div>

          <div className="input-group" style={{ position: 'relative', marginTop: '15px' }}>
            <FaCalendarAlt style={styles.icon} />
            <input 
              type="date" 
              className="form-input" 
              style={styles.inputWithIcon} 
              {...register('fecha', { required: true })} 
            />
          </div>
          
          <div className="input-group" style={{ position: 'relative', marginTop: '15px' }}>
            <FaUserTie style={styles.icon} />
            <select className="form-input" style={styles.inputWithIcon} {...register('id_user', { required: true })}>
              <option value="">-- Seleccione un Cobrador --</option>
              {cobradores.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="register-button" 
              disabled={!isValid} 
              style={{ 
                backgroundColor: isValid ? '#6A64F1' : '#ccc', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                color: 'white',
                fontWeight: 'bold',
                cursor: isValid ? 'pointer' : 'not-allowed' 
              }}
            >
              Guardar Configuración
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/admin-dashboard')} 
              style={{ 
                backgroundColor: '#f1f2f6', 
                color: '#2f3542', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  icon: { 
    position: 'absolute', 
    left: '12px', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    color: '#6A64F1', 
    fontSize: '18px', 
    zIndex: 2 
  },
  inputWithIcon: { 
    paddingLeft: '40px', 
    width: '100%', 
    boxSizing: 'border-box' 
  }
};

export default FormCrearRuta;