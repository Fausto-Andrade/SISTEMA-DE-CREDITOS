import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/auth';
import Swal from 'sweetalert2';
import '../App.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { 
    register, 
    handleSubmit, 
    reset,
    setFocus,
    formState: { errors, isValid } 
  } = useForm({ 
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Autofocus en el email al cargar
  useEffect(() => {
    reset({}, { keepDefaultValues: false });
    setFocus("email");
  }, [reset, setFocus]);

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/login', data);
      const { user, token } = response.data;

      // Persistencia de sesión
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user)); 

      Swal.fire({
        title: '¡Bienvenido!',
        text: `Hola ${user.username}, iniciando sesión...`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        // Redirección basada en rol
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/clientes');
        }
      });

    } catch (err) {
      console.error("Error en login:", err);
      const errorMessage = err.response?.data?.mensaje || "Credenciales incorrectas";
      setError(errorMessage);

      Swal.fire({
        title: 'Error de acceso',
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
        <div className="login-header">
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form" autoComplete="off">
          <div className="input-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
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

          <div className="input-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                style={{ paddingRight: '45px' }}
                {...register('password', { required: "La contraseña es obligatoria" })}
              />
              <span 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-icon"
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#6A64F1',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1.2rem'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={!isValid}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '10px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              backgroundColor: isValid ? '#6A64F1' : '#a5a2f7',
              color: 'white',
              transition: 'background-color 0.3s ease'
            }}
          >
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;