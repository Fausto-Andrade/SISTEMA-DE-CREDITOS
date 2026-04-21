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

  // --- ESTADOS DE PAGINACIÓN ---
  const [pageUsuarios, setPageUsuarios] = useState(1);
  const [pageRutas, setPageRutas] = useState(1);
  const itemsPorPagina = 2; 

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resUser, resRutas] = await Promise.all([
          api.get('/usuarios-registrados'),
          api.get('/rutas') 
        ]);
        
        setUsuarios(resUser.data || []);
        setRutas(resRutas.data || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // --- LÓGICA DE PAGINACIÓN ---
  const obtenerDatosPaginados = (datos, paginaActual) => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return datos.slice(inicio, inicio + itemsPorPagina);
  };

  const ComponentePaginacion = ({ total, actual, setPage }) => {
    const totalPaginas = Math.ceil(total / itemsPorPagina);
    if (totalPaginas <= 1) return null;

    return (
      <div style={styles.paginacionContainer}>
        <button 
          disabled={actual === 1} 
          onClick={() => setPage(actual - 1)}
          style={actual === 1 ? styles.btnDisabled : styles.btnActive}
        >
          Anterior
        </button>
        <span style={styles.pageInfo}>
          {actual} / {totalPaginas}
        </span>
        <button 
          disabled={actual === totalPaginas} 
          onClick={() => setPage(actual + 1)}
          style={actual === totalPaginas ? styles.btnDisabled : styles.btnActive}
        >
          Siguiente
        </button>
      </div>
    );
  };

  // --- FUNCIONES DE ELIMINACIÓN ---
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
          // Resetear a página 1 si la página actual queda vacía
          if (obtenerDatosPaginados(usuarios, pageUsuarios).length <= 1 && pageUsuarios > 1) {
            setPageUsuarios(pageUsuarios - 1);
          }
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
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/rutas/${id}`);
        setRutas(rutas.filter(r => (r.id_ruta || r.id) !== id));
        // Resetear a página 1 si la página actual queda vacía
        if (obtenerDatosPaginados(rutas, pageRutas).length <= 1 && pageRutas > 1) {
          setPageRutas(pageRutas - 1);
        }
        Swal.fire('Eliminado', 'La ruta ha sido eliminada.', 'success');
      } catch (error) { 
        Swal.fire('Error', 'No se pudo eliminar', 'error'); 
      }
    }
  };

  if (loading) return <div className="loader">Cargando datos...</div>;

  return (
    <>
      <style>
        {`
          @media (max-width: 600px) {
            .header-dashboard { flex-direction: column; gap: 15px; text-align: center; }
            .container-dashboard { padding: 15px !important; width: 95% !important; }
            .table-responsive { font-size: 13px; }
            .btn-action-group { width: 100%; flex-direction: column; }
            th, td { padding: 10px 5px !important; }
          }
        `}
      </style>
      <Navbar />
      <div style={{ paddingTop: '100px', backgroundColor: '#f4f7fe', minHeight: '100vh', paddingBottom: '40px' }}>
        
        {/* LISTADO DE COBRADORES */}
        <div className="container-dashboard" style={styles.container}>
          <header className="header-dashboard" style={styles.header}>
            <h2 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.5rem' }}>Listado de Cobradores</h2>
            <div className="btn-action-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => navigate('/crear-ruta')} style={styles.btnCrear}>+ Ruta</button>
              <button onClick={() => navigate('/signup')} style={styles.btnCrear}>+ Cobrador</button>
            </div>
          </header>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={styles.table} className="table-responsive">
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  obtenerDatosPaginados(usuarios, pageUsuarios).map(user => (
                    <tr key={user.id} style={styles.trBody}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{user.email}</div>
                      </td>
                      <td style={styles.td}><span className="badge-role">{user.role}</span></td>
                      <td style={styles.td}>
                        <button onClick={() => eliminarUsuario(user.id, user.username)} style={styles.btnEliminar}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No hay registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINACIÓN DE USUARIOS */}
          <ComponentePaginacion total={usuarios.length} actual={pageUsuarios} setPage={setPageUsuarios} />
        </div>

        {/* RUTAS PROGRAMADAS */}
        <div className="container-dashboard" style={{ ...styles.container, marginTop: '30px' }}>
          <h2 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.5rem' }}>Rutas Programadas</h2>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={styles.table} className="table-responsive">
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Nombre Ruta</th>
                  <th style={styles.th}>Cobrador</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutas.length > 0 ? (
                  obtenerDatosPaginados(rutas, pageRutas).map(r => (
                    <tr key={r.id_ruta || r.id} style={styles.trBody}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold' }}>{r.nombre_ruta}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{r.fecha ? new Date(r.fecha).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td style={styles.td}>{r.cobrador || r.username || "Sin asignar"}</td>
                      <td style={styles.td}>
                        <button onClick={() => eliminarRuta(r.id_ruta || r.id, r.nombre_ruta)} style={styles.btnEliminar}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No hay rutas</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINACIÓN DE RUTAS */}
          <ComponentePaginacion total={rutas.length} actual={pageRutas} setPage={setPageRutas} />
        </div>
      </div>
    </>
  );
};

const styles = {
  container: { 
    width: '90%', 
    maxWidth: '1000px', 
    margin: '0 auto', 
    backgroundColor: 'white', 
    borderRadius: '12px', 
    padding: '25px', 
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    boxSizing: 'border-box'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
  trHead: { backgroundColor: '#633ef1', color: 'white' },
  th: { padding: '15px', textAlign: 'center', fontSize: '14px' },
  td: { padding: '15px', borderBottom: '1px solid #eee', textAlign: 'center' },
  trBody: { textAlign: 'center' },
  btnCrear: { padding: '10px 15px', backgroundColor: '#633ef1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnEliminar: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  paginacionContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px' },
  btnActive: { backgroundColor: '#633ef1', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  btnDisabled: { backgroundColor: '#ccc', color: '#777', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '12px' },
  pageInfo: { fontSize: '13px', fontWeight: 'bold', color: '#333' }
};

export default AdminDashboard;