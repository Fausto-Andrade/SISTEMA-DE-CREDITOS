import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import api from '../api/auth';
import '../App.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log("Intentando iniciar sesión..."); // Para ver en consola que el botón funciona

    try {
      const response = await api.post('/login', { email, password });

      if (response.data.token) {
        // 1. Guardamos los datos
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.user.role);

        // 2. ¡IMPORTANTE! Aquí es donde le dices que se mueva a la otra página
        navigate('/form-contac'); 
      }
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Credenciales incorrectas o servidor caído';
      setError(mensaje);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Iniciar sesión</h1>

        {/* Mostramos el error si existe */}
        {error && <p className="error-message" style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Dirección de correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <a href="/forgot-password" className="forgot-password-link">
            ¿Olvidó la contraseña?
          </a>

          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>

        <div className="signup-text">
          ¿No tiene una cuenta? <a href="/signup" className="signup-link">Registrarse</a>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;