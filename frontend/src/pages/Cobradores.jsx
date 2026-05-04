import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/auth'; 
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Cobradores = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [todasLasRutas, setTodasLasRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limiteRutas, setLimiteRutas] = useState(0); 
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 9; 

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const idAdmin = localStorage.getItem('userId');
      if (!idAdmin) {
        navigate('/');
        return;
      }

      const resPerfil = await api.get(`/auth/usuarios/${idAdmin}`);
      const userData = resPerfil.data;
      
      const esSuperAdmin = userData.role === 'super_admin';
      const miComprador = userData.id_comprador || userData.comprador_id; 
      const limiteReal = userData.max_rutas_permitidas || 0;

      if (!esSuperAdmin && !miComprador) {
        Swal.fire('Error', 'No tienes una empresa vinculada.', 'error');
        return;
      }

      setLimiteRutas(limiteReal);

      const params = esSuperAdmin ? '' : `?id_comprador=${miComprador}`;

      const [resUser, resRutas] = await Promise.all([
        api.get(`/auth/usuarios-registrados${params}`),
        api.get(`/rutas/todas${params}`)
      ]);

      const rutasData = resRutas.data || [];
      setTodasLasRutas(rutasData);

      const cobradoresRaw = resUser.data.filter(u => {
        const esCobrador = u.role === 'user';
        return esSuperAdmin ? esCobrador : (esCobrador && String(u.id_comprador) === String(miComprador));
      });

      const cobradoresProcesados = cobradoresRaw.map(user => {
        const rutasAsignadas = rutasData.filter(r => String(r.id_user) === String(user.id));
        return { ...user, rutas: rutasAsignadas };
      });

      setUsuarios(cobradoresProcesados);
    } catch (error) {
      console.error("Error crítico en cargarDatos:", error);
      Swal.fire('Error', 'Fallo en la conexión de datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
    else cargarDatos();
  }, []);

  // Validación para crear nuevo cobrador
  const handleNuevoCobrador = () => {
    if (limiteRutas > 0 && todasLasRutas.length >= limiteRutas) {
      Swal.fire({
        title: 'Límite alcanzado',
        text: `No puedes crear más cobradores. Has alcanzado el límite de rutas permitidas (${limiteRutas}).`,
        icon: 'warning',
        confirmButtonColor: '#633ef1'
      });
    } else {
      navigate('/signup');
    }
  };

  const actualizarCobrador = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: 'Actualizar Cobrador',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${user.username}">` +
        `<input id="swal-input2" class="swal2-input" placeholder="Email" value="${user.email}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      confirmButtonColor: '#633ef1',
      preConfirm: () => {
        return {
          username: document.getElementById('swal-input1').value,
          email: document.getElementById('swal-input2').value
        }
      }
    });

    if (formValues) {
      try {
        await api.put(`/auth/usuarios/${user.id}`, formValues);
        Swal.fire('Éxito', 'Datos actualizados correctamente', 'success');
        cargarDatos(); 
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
      }
    }
  };

  const indexOfLastItem = currentPage * registrosPorPagina;
  const indexOfFirstItem = indexOfLastItem - registrosPorPagina;
  const currentItems = usuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPaginas = Math.ceil(usuarios.length / registrosPorPagina);
  
  const cambiarPagina = (numeroPagina) => setCurrentPage(numeroPagina);

  if (loading) return <div className="loader">Cargando...</div>;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '100px', backgroundColor: '#f4f7fe', minHeight: '100vh', paddingBottom: '40px' }}>
        <div className="container-dashboard" style={styles.container}>
          <header style={styles.header}>
            <div>
              <h2 style={{ margin: 0, color: '#1a1a1a' }}>Gestión de Cobradores</h2>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Rutas totales: <strong>{todasLasRutas.length} {limiteRutas > 0 ? `/ ${limiteRutas}` : ''}</strong>
              </p>
            </div>
            {/* Botón con validación integrada */}
            <button onClick={handleNuevoCobrador} style={styles.btnCrear}>
              Nuevo Cobrador
            </button>
          </header>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Rutas</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(u => (
                    <tr key={u.id} style={styles.trBody}>
                      <td style={styles.td}><strong>{u.username}</strong></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                          {u.rutas?.length > 0 ? u.rutas.map(r => (
                            <span key={r.id_ruta} style={styles.badgeRuta}>{r.nombre_ruta}</span>
                          )) : <span style={{color: '#999', fontSize: '12px'}}>Sin rutas</span>}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => actualizarCobrador(u)} 
                            style={styles.btnActualizar}
                          >
                            Actualizar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No hay cobradores.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {usuarios.length > registrosPorPagina && (
            <div style={styles.paginationContainer}>
              <button 
                onClick={() => cambiarPagina(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{ ...styles.btnPagina, ...(currentPage === 1 ? styles.btnDisabled : {}) }}
              >
                Anterior
              </button>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[...Array(totalPaginas)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => cambiarPagina(i + 1)}
                    style={{
                      ...styles.btnPagina,
                      backgroundColor: currentPage === i + 1 ? '#633ef1' : 'white',
                      color: currentPage === i + 1 ? 'white' : '#633ef1'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => cambiarPagina(currentPage + 1)} 
                disabled={currentPage === totalPaginas}
                style={{ ...styles.btnPagina, ...(currentPage === totalPaginas ? styles.btnDisabled : {}) }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: { width: '95%', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  trHead: { backgroundColor: '#633ef1', color: 'white' },
  th: { padding: '15px', fontSize: '14px', textAlign: 'center' },
  td: { padding: '15px', borderBottom: '1px solid #f5f5f5', textAlign: 'center', fontSize: '14px' },
  btnCrear: { padding: '12px 20px', backgroundColor: '#633ef1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  btnActualizar: { backgroundColor: '#88eca1', color: '#2e7d32', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  btnDisabled: { backgroundColor: '#cccccc', cursor: 'not-allowed', opacity: 0.7 },
  badgeRuta: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #c8e6c9' },
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '25px', padding: '10px' },
  btnPagina: { padding: '8px 15px', border: '1px solid #633ef1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease', fontSize: '13px' }
};

export default Cobradores;