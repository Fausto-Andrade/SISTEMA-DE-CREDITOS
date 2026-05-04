import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaUser } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/auth'; 
import Swal from 'sweetalert2';
import '../App.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, setFocus, formState: { errors, isValid } } = useForm({ 
    mode: "onBlur",
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    reset({}, { keepDefaultValues: false });
    setFocus("email");
  }, [reset, setFocus]);

  const onSubmit = async (data) => {
    try {
      const response = await authApi.login(data);
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('user', JSON.stringify(user)); 
      localStorage.setItem('username', user.username);

      Swal.fire({
        title: '¡Bienvenido!',
        text: `Hola ${user.username}, iniciando sesión...`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      })
      .then(() => {
        if (user.role === 'super_admin') {
          navigate('/admin-dashboard'); 
        } else if (user.role === 'admin') {
          navigate('/cobradores'); 
        } else {
          navigate('/listado-cobros'); 
        }
      });

    } catch (err) {
      const errorMessage = err.response?.data?.mensaje || "Credenciales incorrectas";
      setError(errorMessage);
      Swal.fire({ title: 'Error', text: errorMessage, icon: 'error' });
    }
  };

  const loginStyles = {
    container: {
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      // Ajuste de opacidad en el degradado para suavizar la vista
      background: 'linear-gradient(135deg, rgba(143, 13, 175, 0.8) 0%, rgba(43, 116, 226, 0.8) 100%)',
      fontFamily: "'Poppins', sans-serif"
    },
    glassBox: {
      background: 'rgba(255, 255, 255, 0.15)', // Un poco más de opacidad para el cristal
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.94)', // Borde más suave
      padding: '40px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 1.2)', // Sombra más realista y menos pesada
      textAlign: 'center',
      color: 'white'
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '14px 45px 14px 15px',
      background: 'rgba(255, 255, 255, 0.9)', // Fondo sólido claro para los inputs como en la imagen
      border: 'none',
      borderRadius: '12px',
      color: '#333', // Texto oscuro para contraste sobre fondo claro
      fontSize: '15px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.3s'
    },
    icon: {
      position: 'absolute',
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#af86f0', // Color grisáceo/blanco que encaja con el diseño
      fontSize: '18px',
      cursor: 'pointer'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      border: 'none',
      borderRadius: '12px',
      background: 'linear-gradient(90deg, #1f96e6, #c444c9)', 
      color: 'white',
      fontWeight: '600',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '10px',
      boxShadow: '0 8px 20px rgba(46, 204, 113, 0.2)',
      transition: 'transform 0.2s'
    }
  };

  return (
    <div style={loginStyles.container}>
      <div style={loginStyles.glassBox}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.2rem', margin: '0', fontWeight: '700' }}>Login</h1>
          <p style={{ opacity: 0.9, fontSize: '0.85rem', marginTop: '8px' }}>
            Bienvenido, por favor ingresa a tu cuenta
          </p>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(231, 76, 60, 0.15)', 
            color: '#fff', 
            padding: '12px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            fontSize: '13px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={loginStyles.inputWrapper}>
            <input
              type="email"
              placeholder="ayf1207@gmail.com"
              style={{
                ...loginStyles.input,
                border: errors.email ? '2px solid #ff7675' : 'none'
              }}
              {...register('email', { required: "Obligatorio" })}
            />
            <FaUser style={loginStyles.icon} />
          </div>

          <div style={loginStyles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••••"
              style={{
                ...loginStyles.input,
                border: errors.password ? '2px solid #ff7675' : 'none'
              }}
              {...register('password', { required: "Obligatorio" })}
            />
            <span onClick={() => setShowPassword(!showPassword)} style={loginStyles.icon}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', fontSize: '13px' }}>
             <input type="checkbox" id="remember" style={{ marginRight: '8px', cursor: 'pointer' }} />
             <label htmlFor="remember" style={{ opacity: 0.9, cursor: 'pointer' }}>Recordarme</label>
          </div>

          <button 
            type="submit" 
            disabled={!isValid}
            style={{ 
              ...loginStyles.submitBtn,
              opacity: isValid ? 1 : 0.7,
              cursor: isValid ? 'pointer' : 'not-allowed'
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