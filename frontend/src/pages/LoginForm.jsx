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
    defaultValues: { // Definimos valores iniciales vacíos explícitamente
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    reset({}, { keepDefaultValues: false });
    setFocus("email");
  }, [reset, setFocus]);

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/login', data);
      const { user, token } = response.data;

      // 🛡️ Guardamos los datos necesarios para la sesión
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user)); 

      // 🔥 Alerta de éxito con SweetAlert2
      Swal.fire({
        title: '¡Bienvenido!',
        text: `Hola ${user.username}, iniciando sesión...`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      }).then(() => {
        // Redirección basada en el rol
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

      // ❌ Alerta de error con SweetAlert2
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
        <h1 className="login-title">Iniciar sesión</h1>
        {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form" autoComplete='off'>
          <div className="input-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="form-input"
              {...register('email', { 
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Formato de correo inválido"
                }
              })}
            />
            {errors.email && <span className="formbold-error-message">{errors.email.message}</span>}
          </div>

          <div className="input-group" style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="form-input"
              {...register('password', { required: "La contraseña es obligatoria" })}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#6A64F1',
                zIndex: 10
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            {errors.password && <span className="formbold-error-message">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={!isValid}
            style={{
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.5,
              backgroundColor: isValid ? '#6A64F1' : '#ccc',
              transition: 'all 0.3s ease'
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;