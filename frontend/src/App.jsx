import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import FormContac from './pages/FormContac';
import FormCredito from './pages/FormCredito';
import AdminDashboard from './pages/AdminDashboard';
import FormCrearRuta from './pages/FormCrearRuta';
import FormListaCliente from './pages/FormListaClientes';
import FormListadoCreditos from './pages/FormListaClientes'; // Nota: Revisar si este archivo es el mismo que ListaCliente
import FormAbonosCliente from './pages/FormAbonosCliente';
import DetalleCliente from './pages/DetalleCliente';
import Informes from './pages/Informes';
import CargarDoc from './pages/CargarDoc';
import MisCreditosCobrador from './pages/MisCreditosCobrador';
import Cobradores from './pages/Cobradores';

// 🛡️ Componente actualizado para proteger rutas soportando múltiples roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si no se pasan roles permitidos, solo validamos el token
  if (!allowedRoles) return children;

  // Verificamos si el rol actual está incluido en los permitidos
  if (!allowedRoles.includes(role)) {
    // Redirección inteligente basada en el rol si intenta entrar a sitio prohibido
    const dest = role === 'super_admin' ? '/admin-dashboard' : 
                 role === 'admin' ? '/cobradores' : '/mis-creditos';
    return <Navigate to={dest} replace />;
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

        {/* --- NIVEL SUPER ADMIN --- */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crear-ruta" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <FormCrearRuta />
            </ProtectedRoute>
          } 
        />

        {/* --- NIVEL ADMIN & SUPER ADMIN (Compartido) --- */}
        <Route 
          path="/cobradores" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <Cobradores />
            </ProtectedRoute>
          } 
        />

        {/* --- NIVEL ADMIN --- */}
        <Route 
          path="/form-contac" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FormContac />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clientes" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>    
              <FormListaCliente />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crear-credito" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FormCredito />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/listado-cobros" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FormListadoCreditos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cargar-doc" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CargarDoc />
            </ProtectedRoute>
          } 
        />

        {/* --- NIVEL COBRADOR / USER --- */}
        <Route 
          path="/mis-creditos" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'super_admin']}>
              <MisCreditosCobrador />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/abonos/:idCredito" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <FormAbonosCliente />
            </ProtectedRoute>
          } 
        />

        {/* RUTAS DE DETALLE / INFORMES */}
        <Route path="/cliente/detalle/:cedula" element={<DetalleCliente />} />
        <Route path="/Informes" element={<Informes />} />
        <Route path="/creditos/nuevo" element={<FormCredito />} />

        {/* RUTA 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;