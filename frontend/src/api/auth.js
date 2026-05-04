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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  registro: (data) => api.post('/auth/registro', data),
  obtenerPerfilUsuario: (id) => api.get(`/auth/usuarios/${id}`), 
  
  // Administración de usuarios
  obtenerUsuariosRegistrados: () => api.get('/auth/usuarios-registrados'),
  obtenerCobradores: () => api.get('/auth/usuarios-cobradores'),
  eliminarUsuario: (id) => api.delete(`/auth/usuarios/${id}`),
  actualizarUsuario: (id, data) => api.put(`/auth/usuarios/${id}`, data),

  // Clientes y Créditos
  registrarCliente: (data) => api.post('/clientes', data),
  obtenerClientesParaCredito: () => api.get('/creditos/clientes'), 
  obtenerClientesCompleto: (config = {}) => api.get('/creditos/clientes-completo', config),
  crearCredito: (data) => api.post('/creditos', data),
  obtenerDetalleCredito: (id) => api.get(`/creditos/detalle/${id}`),
  obtenerAbonosPorCredito: (id) => api.get(`/abonos/credito/${id}`),
  registrarAbono: (data) => api.post('/abonos', data),
  marcarMora: (data) => api.post('/abonos/mora', data),
  obtenerDetalleClienteExpediente: (cedula) => api.get(`/creditos/cliente/detalle/${cedula}`),
  obtenerCompradores: () => api.get('/compradores'),
  cargarDocumentos: (formData) => api.post('/documentos/cargar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const rutasApi = {
  getAll: () => api.get('/rutas'),
  create: (data) => api.post('/rutas', data),
  eliminar: (id) => api.delete(`/rutas/${id}`),
};

export const compradoresApi = {
  getAll: () => api.get('/compradores'), 
  crear: (data) => api.post('/compradores', data),
  eliminar: (id) => api.delete(`/compradores/${id}`),
};

export default api;