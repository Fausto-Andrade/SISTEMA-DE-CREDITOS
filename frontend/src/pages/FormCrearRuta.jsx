// src/pages/FormCrearRuta.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api, { rutasApi } from '../api/auth';
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
      
      // Convertimos id_user a número entero antes de enviar para evitar errores de tipo en la DB
      const datosFinales = {
        ...data,
        id_user: parseInt(data.id_user, 10)
      };
      
      await rutasApi.crear(datosFinales);
      
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Ruta creada exitosamente',
        confirmButtonColor: '#6a64f1'
      });

      reset();
      if (onRutaCreada) onRutaCreada(); 
      navigate('/admin-dashboard');
      
    } catch (error) {
      const mensajeError = error.response?.data?.error || 'Error al crear la ruta';
      setErrorServer(mensajeError);
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeError });
    }
  };

  return (
    <div className="formbold-main-wrapper" style={{ maxWidth: '450px', margin: '20px auto' }}>
      <div className="formbold-form-wrapper">
        <h2 className="login-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarPlus style={{ color: '#6A64F1' }} /> Crear Nueva Ruta
        </h2>
        
        {errorServer && <p style={{ color: 'red', textAlign: 'center' }}>{errorServer}</p>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {/* Campo: nombre_ruta */}
          <div className="input-group" style={{ position: 'relative' }}>
            <FaMapMarkedAlt style={styles.icon} />
            <input
              type="text"
              placeholder="Nombre de la Ruta (ej. Centro)"
              className="form-input"
              style={styles.inputWithIcon}
              {...register('nombre_ruta', { required: "Este campo es obligatorio", minLength: 3 })}
            />
          </div>
          {errors.nombre_ruta && <span className="error-text">Nombre inválido</span>}

          {/* Campo: Fecha */}
          <div className="input-group" style={{ position: 'relative' }}>
            <FaCalendarAlt style={styles.icon} />
            <input type="date" className="form-input" style={styles.inputWithIcon} {...register('fecha', { required: true })} />
          </div>
          
          {/* Campo: Cobrador (id_user) */}
          <div className="input-group" style={{ position: 'relative' }}>
            <FaUserTie style={styles.icon} />
            <select className="form-input" style={styles.inputWithIcon} {...register('id_user', { required: true })}>
              <option value="">-- Seleccione un Cobrador --</option>
              {cobradores.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
            </select>
          </div>
          {errors.id_user && <span className="error-text">Seleccione un cobrador</span>}

          <button type="submit" className="register-button" disabled={!isValid} style={{ backgroundColor: isValid ? '#6A64F1' : '#ccc' }}>
            Guardar Ruta
          </button>
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
    color: '#ccc',
    fontSize: '18px',
    zIndex: 2
  },
  inputWithIcon: {
    paddingLeft: '40px'
  }
};

export default FormCrearRuta;