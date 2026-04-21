import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import FormContac from './pages/FormContac';
import FormCredito from './pages/FormCredito';
import AdminDashboard from './pages/AdminDashboard';
import FormCrearRuta from './pages/FormCrearRuta';
import FormListaCliente from './pages/FormListaClientes';
import FormListadoCreditos from './pages/FormListadoCreditos';
import FormAbonosCliente from './pages/FormAbonosCliente';
import DetalleCliente from './pages/DetalleCliente';
import Informes from './pages/Informes';
import CargarDoc from './pages/CargarDoc';

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
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin">
          <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* RUTAS PROTEGIDAS PARA USUARIOS */}
        <Route path="/form-contac" element={<ProtectedRoute allowedRole="user">
          <FormContac />
            </ProtectedRoute>
          } 
        />

         <Route path="/clientes" element={<ProtectedRoute allowedRole="user">
          <FormListaCliente />
            </ProtectedRoute>
          } 
        />

        <Route path="/crear-credito" element={<ProtectedRoute allowedRole="user">
          <FormCredito />
            </ProtectedRoute>
          } 
        />

        {/* RUTA 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* RUTA PROTEGIDA PARA ADMIN */}
          <Route path="/crear-ruta" element={<ProtectedRoute allowedRole="admin">
              <FormCrearRuta />
                </ProtectedRoute>
          } />

        <Route path="/listado-cobros" element={<ProtectedRoute allowedRole="user">
          <FormListadoCreditos />
            </ProtectedRoute>
        } />

        <Route path="/abonos/:idCredito" element={<ProtectedRoute allowedRole="user">
          <FormAbonosCliente />
            </ProtectedRoute>
        } />

        {/* NUEVA RUTA PARA CARGAR DOCUMENTOS */}
        <Route path="/cargar-doc" element={<ProtectedRoute allowedRole="user">
          <CargarDoc />
            </ProtectedRoute>
        } />

          <Route path="/creditos/nuevo" element={<FormCredito />} />

          <Route path="/cliente/detalle/:cedula" element={<DetalleCliente />} />
          <Route path="/Informes" element={<Informes />} />

      </Routes>
    </Router>
  );
}

export default App;


