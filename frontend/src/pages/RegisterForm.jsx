import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' // Valor por defecto
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', formData);
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      navigate('/'); // Redirigir al Login
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Crear una cuenta</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Nombre"
            className="form-input"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            className="form-input"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="form-input"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          
          {/* Selector de Rol (Opcional, podrías dejarlo fijo en 'user') */}
          <select 
            className="form-input"
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" className="login-button">Registrar</button>
        </form>
        
        <div className="signup-text">
          Ya tiene una cuenta? <a href="/" className="signup-link">Ingrese</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;