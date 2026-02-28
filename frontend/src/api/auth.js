import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // La URL de tu Backend
});

export default api;