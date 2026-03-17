import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';
import '../App.css';

const AdminDashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resUsuarios, resRutas] = await Promise.all([
          api.get('/usuarios-registrados'),
          api.get('/rutas')
        ]);
        setUsuarios(resUsuarios.data);
        setRutas(resRutas.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const eliminarUsuario = async (id, username) => {
    Swal.fire({
      title: `¿Eliminar a ${username}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/usuarios/${id}`);
          setUsuarios(usuarios.filter(user => user.id !== id));
          Swal.fire('Eliminado', 'Usuario removido con éxito.', 'success');
        } catch (error) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  const eliminarRuta = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Eliminar la ruta '${nombre}'?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/rutas/${id}`);
        setRutas(rutas.filter(r => r.id_ruta !== id));
        Swal.fire('Eliminado', 'La ruta ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la ruta', 'error');
      }
    }
  };

  if (loading) return <div className="loader">Cargando datos...</div>;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '100px', backgroundColor: '#f4f7fe', minHeight: '100vh'}}>
        
        {/* --- SECCIÓN USUARIOS --- */}
        <div style={styles.container}>
          <header style={styles.header}>
            <h2 style={{ margin: 0 }}>Listado de Cobradores</h2>
            <button onClick={() => navigate('/crear-ruta')} className="register-button" style={styles.btnCrear}>+ Crear Ruta</button>
            <button onClick={() => navigate('/signup')} className="register-button" style={styles.btnCrear}>+ Crear Cobrador</button>
          </header>    
          
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th>Usuario</th><th>Email</th><th>Rol</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id} style={styles.trBody}>
                  <td>{user.username}</td><td>{user.email}</td>
                  <td>{user.role}</td>
                  <td><button onClick={() => eliminarUsuario(user.id, user.username)} style={styles.btnEliminar}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- SECCIÓN RUTAS --- */}
        <div style={{ ...styles.container, marginTop: '30px', marginTop: '10px' }}>
          <h2 style={{ marginBottom: '20px' }}>Rutas Programadas</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th>Nombre Ruta</th><th>Fecha</th><th>Cobrador Asignado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutas.map(r => (
                <tr key={r.id_ruta} style={styles.trBody}>
                  <td>{r.nombre_ruta}</td>
                  <td>{new Date(r.fecha).toLocaleDateString()}</td>
                  <td>{r.cobrador_nombre}</td>
                  <td>
                    <button onClick={() => eliminarRuta(r.id_ruta, r.nombre_ruta)} style={styles.btnEliminar}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: { width: '90%', maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  trHead: { backgroundColor: '#633ef1', color: 'white', padding: '15px' },
  trBody: { borderBottom: '1px solid #eee', textAlign: 'center', padding: '10px' },
  btnCrear: { width: 'auto', padding: '10px 20px', backgroundColor: '#633ef1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnEliminar: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }
};

export default AdminDashboard;