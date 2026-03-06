import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';

const RegisterForm = () => {
  const [errorServer, setErrorServer] = useState('');
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

      // Importante: Verifica que tu backend devuelva 'rol'
      if (user.role === 'admin') {
        alert("Bienvenido, Administrador");
        navigate('/admin-dashboard');
      } else {
        alert("Registro exitoso");
        navigate('/home');
      }

    } catch (error) {
      console.error("Error en el registro", error);
      setErrorServer(error.response?.data?.message || 'Error al conectar con el servidor');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Crear una cuenta</h1>
        {errorServer && <p style={{ color: 'red', textAlign: 'center' }}>{errorServer}</p>}
        
        {/* CORRECCIÓN: handleSubmit(onSubmit) */}
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" autoComplete="off">
          
          <input
            type="text"
            placeholder="Nombre"
            className="form-input"
            autoFocus
            {...register('username', { required: "El nombre es obligatorio" })}
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}

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

          <input
            type="password"
            placeholder="Contraseña"
            autoComplete="new-password"
            className="form-input"
            {...register('password', { required: "La contraseña es obligatoria" })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          
          <select 
            className="form-input"
            {...register('role')} // Vinculamos el select
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button 
              type="submit" 
              className="register-button" 
              disabled={!isValid} // Se deshabilita si algún campo falta o es inválido
              style={{
                cursor: isValid ? 'pointer' : 'not-allowed',
                opacity: isValid ? 1 : 0.5,
                backgroundColor: isValid ? '#6A64F1' : '#ccc', // El color morado de tu imagen o gris
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                width: '100%',
                fontWeight: 'bold',
                fontSize: '16px'
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