import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api/auth';

const RegisterForm = () => {
  const [errorServer, setErrorServer] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    setFocus,
    formState: { errors, isValid } 
  } = useForm({
    mode: "onBlur", 
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "user" 
    }
  });

  useEffect(() => {
    // Reset corregido para limpiar campos al cargar
    reset({ username: "", email: "", password: "", role: "user" });
    setFocus("username");
  }, [reset, setFocus]);
  

  const onSubmit = async (data) => {
    try {
      setErrorServer('');
      
      const response = await api.post('/register', data);
      const user = response.data;

      Swal.fire({
        title: '¡Registro Exitoso!',
        text: `Usuario ${user.username} creado correctamente.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        // Redirección basada en el rol del usuario creado
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/home');
        }
      });

    } catch (error) {
      console.error("Error en el registro", error);
      
      // Capturamos el mensaje específico del backend (ej: "El usuario ya existe")
      const errorMessage = error.response?.data?.mensaje || error.response?.data?.message || 'Error al conectar con el servidor';
      setErrorServer(errorMessage);

      Swal.fire({
        title: 'No se pudo registrar',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Reintentar',
        confirmButtonColor: '#6A64F1'
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Crear una cuenta</h1>
        
        {errorServer && (
          <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center', fontSize: '14px', border: '1px solid #fecaca' }}>
            {errorServer}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" autoComplete="off">
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Nombre"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              {...register('username', { required: "El nombre es obligatorio" })}
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}
          </div>

          <div className="input-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              {...register('email', { 
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Formato de correo inválido"
                }
              })}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              autoComplete="new-password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              style={{ width: '100%', paddingRight: '40px' }}
              {...register('password', { 
                required: "La contraseña es obligatoria", 
                minLength: { value: 6, message: "Mínimo 6 caracteres" } 
              })}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '15px',
                cursor: 'pointer',
                color: '#636e72',
                display: 'flex',
                zIndex: 10
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <span className="error-text">{errors.password.message}</span>}
          
          <div className="input-group">
            <select className="form-input" {...register('role')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="register-button" 
            disabled={!isValid}
            style={{
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.7,
              backgroundColor: isValid ? '#6A64F1' : '#a5a2f7',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              width: '100%',
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '10px',
              transition: 'all 0.3s ease'
            }}
          >
            Registrar
          </button>

          <button 
            type="button" 
            onClick={() => navigate('/admin-dashboard')} 
            style={{ 
              backgroundColor: '#e2e8f0', 
              color: '#475569', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer',  
              marginTop: '15px', 
              width: '100%', 
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Volver al Panel
          </button>
        </form>
        
        <div className="signup-text" style={{ marginTop: '20px', textAlign: 'center' }}>
          ¿Ya tiene una cuenta? <a href="/" className="signup-link" style={{ color: '#6A64F1', fontWeight: 'bold', textDecoration: 'none' }}>Ingrese</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;