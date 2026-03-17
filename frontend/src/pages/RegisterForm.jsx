import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api/auth';

const RegisterForm = () => {
  const [errorServer, setErrorServer] = useState('');
  const [ showPassword, setShowPassword] = useState(false); // Estado para alternar la visibilidad
  const navigate = useNavigate();
  
  // Usamos solo React Hook Form para capturar los datos
  const { 
    register, 
    handleSubmit, 
    reset,
    setFocus,
    formState: { errors, isValid} } = useForm({
    mode: "onBlur", // Valida en tiempo real mientras escriben
    defaultValues: {
    username: "",
    email: "",
    password: "",
    role: "user" // Valor por defecto según tu imagen
    }
  });

  useEffect(() => {
      reset({ email: "", password: "" });
      setFocus("email");
    }, [reset, setFocus]);
  

  const onSubmit = async (data) => {
    try {
      setErrorServer('');
      
      // Enviamos 'data', que ya contiene todos los campos vinculados con register()
      const response = await api.post('/register', data);

      const user = response.data;
      console.log("Respuesta:", user);

      // 🔥 Alerta de éxito con SweetAlert2
            Swal.fire({
              title: '¡Bienvenido!',
              text: `Hola ${user.username}, iniciando sesión...`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
            }).then(() => {

      // Importante: Verifica que tu backend devuelva 'rol'
      if (user.role === 'admin') {
        alert("Bienvenido, Administrador");
        navigate('/admin-dashboard');
      } else {
        alert("Registro exitoso");
        navigate('/home');
      }
      });

    } catch (error) {
      console.error("Error en el registro", error);
      setErrorServer(error.response?.data?.message || 'Error al conectar con el servidor');

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
        <h1 className="login-title">Crear una cuenta</h1>
        {errorServer && <p style={{ color: 'red', textAlign: 'center' }}>{errorServer}</p>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" autoComplete="off">
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Nombre"
              className="form-input"
              {...register('username', { required: "El nombre es obligatorio" })}
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}
          </div>

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
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          {/* CONTENEDOR DE CONTRASEÑA CON OJO */}
          <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showPassword ? "text" : "password"} // 4. TYPE DINÁMICO
              placeholder="Contraseña"
              autoComplete="new-password"
              className="form-input"
              style={{ width: '100%', paddingRight: '40px' }}
              {...register('password', { required: "La contraseña es obligatoria", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} // 5. FUNCIÓN CORREGIDA
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
          
          <select className="form-input" {...register('role')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button 
            type="submit" 
            className="register-button" 
            disabled={!isValid}
            style={{
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.5,
              backgroundColor: isValid ? '#6A64F1' : '#ccc',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              width: '100%',
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            Registrar
          </button>
        </form>
        
        <div className="signup-text">
          ¿Ya tiene una cuenta? <a href="/" className="signup-link">Ingrese</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;