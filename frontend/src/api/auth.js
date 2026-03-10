import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exportación nombrada para los servicios
export const rutasApi = {
  crear: (data) => api.post('/rutas', data),
  // Nota: sin la barra inicial para evitar el error de duplicación /api/api/
  obtenerCobradores: () => api.get('usuarios-registrados'), 
};

// api/auth.js (o donde tengas tus llamadas axios)
export const clientesApi = {
  getAll: () => api.get('/clientes'),
};

// Exportación por defecto para la instancia de axios
export default api;