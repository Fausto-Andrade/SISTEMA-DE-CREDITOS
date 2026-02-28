import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import FormContac from './pages/FormContac';

// 🛡️ Componente para proteger rutas según el ROL
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    // Si no hay token, lo mandamos al Login
    return <Navigate to="/" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Si el rol no coincide (ej: un user intentando entrar a admin)
    return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/user-profile'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* RUTA PÚBLICA: El Login siempre es la primera pantalla */}
        <Route path="/" element={<LoginForm />} />

        {/* RUTAS PROTEGIDAS PARA ADMINISTRADOR */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              {/* <AdminDashboard /> */}
            </ProtectedRoute>
          } 
        />

        {/* RUTAS PROTEGIDAS PARA USUARIOS NORMALES */}
        <Route 
          path="/user-profile" 
          element={
            <ProtectedRoute allowedRole="user">
              {/* <UserProfile /> */}
            </ProtectedRoute>
          } 
        />

        {/* RUTA 404: Si escriben cualquier cosa, regresan al login o su perfil */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<RegisterForm />} />
        <Route path="/form-contac" element={<FormContac />} />
      </Routes>
    </Router>
  );
}

export default App;