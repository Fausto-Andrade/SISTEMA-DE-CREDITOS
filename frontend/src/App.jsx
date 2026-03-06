import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import FormContac from './pages/FormContac';
import FormCredito from './pages/FormCredito';
import AdminDashboard from './pages/AdminDashboard';

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
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<LoginForm />} />
        <Route path="/signup" element={<RegisterForm />} />

        {/* RUTAS PROTEGIDAS PARA ADMIN */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* RUTAS PROTEGIDAS PARA USUARIOS */}
        <Route 
          path="/form-contac" 
          element={
            <ProtectedRoute allowedRole="user">
              <FormContac />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/form-credito" 
          element={
            <ProtectedRoute allowedRole="user">
              <FormCredito />
            </ProtectedRoute>
          } 
        />

        {/* RUTA 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;