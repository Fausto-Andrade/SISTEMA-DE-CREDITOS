// Importa la librería Axios, se usa para hacer peticiones HTTP desde el frontend
// Permite hacer: GET, POST, PUT, DELETE
import axios from 'axios';

// Crea una instancia personalizada de Axios, en vez de usar axios.get()
// directamente, usarás api.get(), esto permite configurar cosas globales (como la URL base).
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // La URL de tu Backend, todas las peticiones usarán automáticamente esa dirección.
});

// 🛡️ Este "Interceptor" inyecta el token automáticamente en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exporta la instancia, permite usarla en otros archivos.
export default api;