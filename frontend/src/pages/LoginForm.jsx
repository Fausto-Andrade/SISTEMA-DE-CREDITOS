import React, { useState, useEffect} from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/auth';
import '../App.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [ error, setError] = useState(""); 
  const [ showPassword, setShowPassword] = useState(false); // Estado para alternar la visibilidad
  const { 
    register, 
    handleSubmit, 
    reset,
    setFocus,
    formState: {errors, isValid} } = useForm({   
    mode: "onBlur", // <--- Importante: Valida mientras el usuario escribe
    defaultValues: {
    email: "",
    password: ""
    }
   });

   useEffect(() => {
    reset({ email: "", password: "" });
    setFocus("email");
  }, [reset, setFocus]);

  const onSubmit = async (data) => {
  try {
    const response = await api.post('/login', data);
    const { user, token } = response.data;

    // 🛡️ ¡ESTO ES VITAL! Para que ProtectedRoute funcione
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);

    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/clientes'); // Asegúrate que coincida con App.js
    }
  } catch (err) {
    console.error("Error en login:", err);
    setError("Credenciales incorrectas");
  }
};
  
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Iniciar sesión</h1>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              autoComplete="new-password"
              className="form-input"
              autoFocus
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

          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

            <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              autoComplete="new-password"
              className="form-input"
              style={{ width: '100%', paddingRight: '40px' }}
              {...register('password', { 
                required: "La contraseña es obligatoria" })}
            />
            </div> 

             {/* 4. Botón para alternar el estado */}
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{
                    paddingTop: "12px",
                    position: 'absolute',
                    right: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#636e72', // Gris elegante
                    zIndex: 10 // Para asegurar que esté por encima del input
                  }}
                >
            
              <span 
                className="formbold-password-icon" 
                onClick={() => setShowPassword(!showPassword)}
              >
              {showPassword ? <FaEyeSlash /> : <FaEye />}     
            </span>
            </span>   
            {errors.password && <span className="formbold-error-message">{errors.password.message}</span>}
          </div>
             

          <button 
            type="submit" 
            className="login-button" 
            disabled={!isValid} // Se deshabilita si isValid es falso
            style={{
              cursor: isValid ? 'pointer' : 'not-allowed', // Cambia el cursor según el estado
              opacity: isValid ? 1 : 0.5,                  // Se ve más opaco cuando está apagado
              backgroundColor: isValid ? '#6A64F1' : '#ccc' // Cambia el color si gustas
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