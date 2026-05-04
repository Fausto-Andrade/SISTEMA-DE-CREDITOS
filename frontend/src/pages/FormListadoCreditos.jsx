import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import '../App.css';

const FormListadoCreditos = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [userData, setUserData] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 10;

  const fetchCreditos = useCallback(async () => {
    try {
      setLoading(true);
      const idAdmin = localStorage.getItem('userId');
      
      if (!idAdmin) {
        navigate('/');
        return;
      }

      // 1. Obtener perfil para asegurar el id_comprador y datos del usuario
      const resPerfil = await api.get(`/usuarios/${idAdmin}`);
      const infoUsuario = resPerfil.data;
      setUserData(infoUsuario);

      const miComprador = infoUsuario.id_comprador;

      if (!miComprador) {
        console.warn("Usuario sin empresa vinculada.");
        setCreditos([]);
        setLoading(false);
        return;
      }

      // 2. Consultar créditos filtrados por la empresa en el Backend
      const response = await api.get(`/creditos?id_comprador=${miComprador}`);
      
      // Ordenar por los más recientes
      const dataOrdenada = (Array.isArray(response.data) ? response.data : []).sort((a, b) => 
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );

      setCreditos(dataOrdenada);
    } catch (error) {
      console.error("❌ Error cargando créditos:", error);
      if (error.response?.status === 401) navigate('/');
      else Swal.fire('Error', 'No se pudo obtener la lista de créditos', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCreditos();
  }, [fetchCreditos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  // LOGICA DE FILTRADO (Seguridad + Búsqueda)
  const datosFiltrados = creditos.filter(cred => {
    const termino = busqueda.toLowerCase();
    
    // 1. Filtro de Rol: Si es 'user' (cobrador), solo ve lo que tiene asignado. 
    // Si es 'admin' o 'super_admin', ve todo lo de su empresa.
    const esAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
    const perteneceAlCobrador = cred.cobrador_asignado?.toLowerCase() === userData?.username?.toLowerCase();

    if (!esAdmin && !perteneceAlCobrador) return false;

    // 2. Filtro de búsqueda textual (Nombre, Cédula, # Crédito)
    return (
      cred.id_cedula?.toString().includes(termino) || 
      cred.name?.toLowerCase().includes(termino) || 
      cred.apellido?.toLowerCase().includes(termino) ||
      cred.numero_credito_cliente?.toString().includes(termino)
    );
  });

  const registrosActuales = datosFiltrados.slice(
    (currentPage - 1) * registrosPorPagina, 
    currentPage * registrosPorPagina
  );
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  if (loading) return <div className="loading-container"><p>Cargando créditos de la empresa...</p></div>;

  return (
    <>
      <Navbar />
      <div className="table-container" style={{ padding: '20px', paddingTop: '100px', backgroundColor: '#f4f7fe', minHeight: '100vh' }}>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#1a1a1a' }}>
              {userData?.role === 'admin' ? "Gestión Global de Créditos" : `Mis Créditos: ${userData?.username}`}
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate(-1)} className="formbold-btn" style={{ backgroundColor: '#6366f1', width: 'auto', padding: '10px 20px' }}>
                Volver
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, cédula o número de crédito..."
              className="formbold-form-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#6366f1', color: 'white' }}>
                  <th style={styles.th}># CRÉDITO</th>
                  <th style={styles.th}>CLIENTE</th>
                  <th style={styles.th}>PRÉSTAMO</th>
                  <th style={styles.th}>TOTAL</th>
                  <th style={styles.th}>DOCUMENTOS</th>
                  <th style={styles.th}>ESTADO</th>
                  <th style={styles.th}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {registrosActuales.length > 0 ? (
                  registrosActuales.map((c) => {
                    const tieneDocumentos = c.documentos_cargados === true || c.has_docs === true; 
                    return (
                      <tr key={c.id_credito || c.id} style={styles.trBody}>
                        <td style={styles.td}>{c.numero_credito_cliente || 'N/A'}</td>
                        <td style={styles.td}><strong>{c.name} {c.apellido}</strong></td>
                        <td style={styles.td}>${Number(c.monto).toLocaleString()}</td>
                        <td style={{ ...styles.td, color: '#6366f1', fontWeight: 'bold' }}>
                          ${Number(c.total_pagar).toLocaleString()}
                        </td>
                        <td style={styles.td}>
                          {tieneDocumentos ? (
                            <span style={{ backgroundColor: '#2ecc71', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                              CARGADOS
                            </span>
                          ) : (
                            <span 
                              onClick={() => navigate(`/cargar-doc?cedula=${c.id_cedula}`)}
                              style={{ backgroundColor: '#e74c3c', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: c.estado?.toLowerCase() === 'pagado' ? '#d1fae5' : '#fef3c7',
                            color: c.estado?.toLowerCase() === 'pagado' ? '#065f46' : '#92400e'
                          }}>
                            {c.estado}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={() => navigate(`/perfil-cliente/${c.id_cedula}`)}
                            style={styles.btnVer}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                      No se encontraron créditos vinculados a su empresa o asignación.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', alignItems: 'center' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={styles.pageBtn}>Anterior</button>
              <span style={{ fontSize: '14px' }}>Página {currentPage} de {totalPaginas}</span>
              <button disabled={currentPage === totalPaginas} onClick={() => setCurrentPage(p => p + 1)} style={styles.pageBtn}>Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  card: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  th: { padding: '15px', textAlign: 'center' },
  td: { padding: '15px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', fontSize: '14px' },
  trBody: { transition: 'background 0.2s' },
  btnVer: { backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  pageBtn: { padding: '8px 15px', border: '1px solid #ddd', backgroundColor: '#fff', borderRadius: '8px', cursor: 'pointer' }
};

export default FormListadoCreditos;