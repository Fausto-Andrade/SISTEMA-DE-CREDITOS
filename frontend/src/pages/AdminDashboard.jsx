import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, rutasApi, compradoresApi } from '../api/auth';
import FormCrearRuta from '../pages/FormCrearRuta.jsx'; 
import Swal from 'sweetalert2';
import '../App.css';

const AdminDashboard = () => {
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModalEmpresa, setShowModalEmpresa] = useState(false);
  const [showModalRuta, setShowModalRuta] = useState(false); 
  
  const [nuevaEmpresa, setNuevaEmpresa] = useState({ 
    nombre_empresa: '', 
    max_rutas_permitidas: '' 
  });

  const navigate = useNavigate();
  const [pageEmpresas, setPageEmpresas] = useState(1);
  const [pageRutas, setPageRutas] = useState(1);
  const itemsPorPagina = 3;

  const verificarYValidar = useCallback(async () => {
    const idAdmin = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    // Validación primaria de sesión
    if (!idAdmin || !token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Validar el Perfil
      const resPerfil = await authApi.obtenerPerfil(idAdmin);
      
      // Normalizamos el rol a minúsculas para la comparación
      const userRole = resPerfil.data.role ? resPerfil.data.role.toLowerCase() : '';

      if (userRole !== 'super_admin') {
        Swal.fire({
          title: 'Acceso Denegado',
          text: 'Solo el Super Admin puede acceder aquí',
          icon: 'error',
          confirmButtonColor: '#633ef1'
        });
        // Si no es super_admin, lo mandamos a su dashboard correspondiente
        navigate(userRole === 'admin' ? '/cobradores' : '/dashboard'); 
        return;
      }

      // 2. Cargar Datos Globales
      const [resEmpresas, resRutas] = await Promise.all([
        compradoresApi.getAll(),
        rutasApi.getAll()
      ]);
      
      setEmpresas(resEmpresas.data || []);
      const rutasOrdenadas = (resRutas.data || []).sort((a, b) => b.id_ruta - a.id_ruta);
      setRutas(rutasOrdenadas);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      // Si el error es 401 o 403, probablemente el token expiró
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    verificarYValidar();
  }, [verificarYValidar]);

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    const nombreNormalizado = nuevaEmpresa.nombre_empresa.trim().toLowerCase();
    const empresaExiste = empresas.some(emp => 
      emp.nombre_empresa.trim().toLowerCase() === nombreNormalizado
    );

    if (empresaExiste) {
      return Swal.fire({
        title: 'Empresa Duplicada',
        text: `Ya existe una empresa registrada con el nombre "${nuevaEmpresa.nombre_empresa}".`,
        icon: 'error',
        confirmButtonColor: '#633ef1'
      });
    }

    try {
      const cantidadRutas = parseInt(nuevaEmpresa.max_rutas_permitidas, 10);
      await compradoresApi.crear({
        nombre_empresa: nuevaEmpresa.nombre_empresa.trim(),
        max_rutas_permitidas: cantidadRutas
      });
      
      Swal.fire('Éxito', 'Empresa registrada', 'success');
      setShowModalEmpresa(false);
      setNuevaEmpresa({ nombre_empresa: '', max_rutas_permitidas: '' });
      verificarYValidar(); 
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar la empresa', 'error');
    }
  };

  const alFinalizarRuta = () => {
    setShowModalRuta(false);
    verificarYValidar();
  };

  const obtenerInfoRutas = (idComprador, maxPermitidas) => {
    const rutasActuales = rutas.filter(r => r.id_comprador === idComprador).length;
    if (maxPermitidas === null || maxPermitidas === undefined) {
      return { texto: 'Ilimitadas', color: '#633ef1', fondo: '#e8f0fe', cuenta: rutasActuales };
    }
    const limite = parseInt(maxPermitidas, 10);
    const disponibles = limite - rutasActuales;
    const esCritico = disponibles <= 0;

    return {
      texto: `${rutasActuales} / ${limite} usadas (${disponibles} disp.)`,
      color: esCritico ? '#e74c3c' : '#633ef1',
      fondo: esCritico ? '#ffeaea' : '#e8f0fe',
      cuenta: rutasActuales
    };
  };

  const obtenerDatosPaginados = (datos, paginaActual) => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return datos.slice(inicio, inicio + itemsPorPagina);
  };

  const eliminarEmpresa = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Eliminar la empresa ${nombre}?`,
      text: "Esto afectará a todos los usuarios vinculados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await compradoresApi.eliminar(id);
        setEmpresas(empresas.filter(e => e.id_comprador !== id));
        Swal.fire('Eliminado', 'Empresa eliminada correctamente.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la empresa', 'error');
      }
    }
  };

  const eliminarRuta = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Eliminar ruta '${nombre}'?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await rutasApi.eliminar(id);
        setRutas(rutas.filter(r => r.id_ruta !== id));
        Swal.fire('Eliminado', 'Ruta borrada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la ruta', 'error');
      }
    }
  };

  const ComponentePaginacion = ({ total, actual, setPage }) => {
    const totalPaginas = Math.ceil(total / itemsPorPagina);
    if (totalPaginas <= 1) return null;
    return (
      <div style={styles.paginacionContainer}>
        <button disabled={actual === 1} onClick={() => setPage(actual - 1)} style={actual === 1 ? styles.btnDisabled : styles.btnActive}>Anterior</button>
        <span style={styles.pageInfo}>{actual} / {totalPaginas}</span>
        <button disabled={actual === totalPaginas} onClick={() => setPage(actual + 1)} style={actual === totalPaginas ? styles.btnDisabled : styles.btnActive}>Siguiente</button>
      </div>
    );
  };

  if (loading) return <div className="loader-container"><div className="loader"></div><p>Cargando Administración Global...</p></div>;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '100px', backgroundColor: '#f4f7fe', minHeight: '100vh', paddingBottom: '40px' }}>
        
        {/* MODAL EMPRESA */}
        {showModalEmpresa && (
          <div style={styles.modalOverlay}>
            <div style={styles.loginCardStyle}>
              <h3 style={styles.loginHeaderTitle}>Registrar Empresa</h3>
              <p style={styles.loginSubTitle}>Completa los datos de la nueva sucursal</p>
              
              <form onSubmit={handleCrearEmpresa}>
                <div style={styles.inputWrapper}>
                  <label style={styles.loginLabel}>Nombre de la Empresa</label>
                  <input 
                    style={styles.loginInput}
                    type="text" 
                    required
                    value={nuevaEmpresa.nombre_empresa}
                    onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, nombre_empresa: e.target.value})}
                    placeholder="Ej. Logística Central"
                  />
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.loginLabel}>Máximo de Rutas</label>
                  <input 
                    style={styles.loginInput}
                    type="number" 
                    required
                    value={nuevaEmpresa.max_rutas_permitidas}
                    onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, max_rutas_permitidas: e.target.value})}
                    placeholder="Ej. 5"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={styles.btnLoginAction}>Guardar Empresa</button>
                  <button type="button" onClick={() => setShowModalEmpresa(false)} style={styles.btnLoginCancel}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL RUTA */}
        {showModalRuta && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.loginCardStyle, width: '450px' }}>
                <div style={{ position: 'relative' }}>
                    <FormCrearRuta 
                        onRutaCreada={alFinalizarRuta} 
                        empresas={empresas} // Pasa la lista de empresas aquí
                        esSuperAdmin={true} // Informa explícitamente al form el modo
                    />
                    <button 
                        onClick={() => setShowModalRuta(false)}
                        style={styles.closeModalX}
                    >✕</button>
                </div>
            </div>
          </div>
        )}

        {/* SECCIÓN EMPRESAS */}
        <div className="container-dashboard" style={styles.container}>
          <header style={styles.header}>
            <h2 style={styles.title}>Empresas Registradas (Compradores)</h2>
            <button onClick={() => setShowModalEmpresa(true)} style={styles.btnCrear}>+ Nueva Empresa</button>
          </header>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Nombre Empresa</th>
                  <th style={styles.th}>Rutas Permitidas</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.length > 0 ? (
                  obtenerDatosPaginados(empresas, pageEmpresas).map(emp => {
                    const info = obtenerInfoRutas(emp.id_comprador, emp.max_rutas_permitidas);
                    const tieneRutas = info.cuenta > 0;
                    return (
                      <tr key={emp.id_comprador} style={styles.trBody}>
                        <td style={styles.td}>{emp.id_comprador}</td>
                        <td style={styles.td}><div style={{ fontWeight: '600' }}>{emp.nombre_empresa}</div></td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, color: info.color, backgroundColor: info.fondo }}>
                            {info.texto}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={() => eliminarEmpresa(emp.id_comprador, emp.nombre_empresa)} 
                            disabled={tieneRutas}
                            style={tieneRutas ? styles.btnEliminarDisabled : styles.btnEliminar}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="4" style={styles.noData}>No hay empresas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <ComponentePaginacion total={empresas.length} actual={pageEmpresas} setPage={setPageEmpresas} />
        </div>

        {/* SECCIÓN RUTAS */}
        <div className="container-dashboard" style={{ ...styles.container, marginTop: '30px' }}>
          <header style={styles.header}>
            <h2 style={styles.title}>Configuración de Rutas Globales</h2>
            <button onClick={() => setShowModalRuta(true)} style={styles.btnCrear}>+ Crear y Asignar Ruta</button>
          </header>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Nombre Ruta</th>
                  <th style={styles.th}>Empresa Asignada</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutas.length > 0 ? (
                  obtenerDatosPaginados(rutas, pageRutas).map(r => {
                    const tieneCobrador = r.id_user !== null && r.id_user !== undefined;
                    return (
                      <tr key={r.id_ruta} style={styles.trBody}>
                        <td style={styles.td}><div style={{ fontWeight: 'bold' }}>{r.nombre_ruta}</div></td>
                        <td style={styles.td}>
                            <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                              {r.nombre_empresa || `Empresa ID: ${r.id_comprador}`}
                            </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={() => eliminarRuta(r.id_ruta, r.nombre_ruta)} 
                            disabled={tieneCobrador}
                            style={tieneCobrador ? styles.btnEliminarDisabled : styles.btnEliminar}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="3" style={styles.noData}>No hay rutas creadas</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <ComponentePaginacion total={rutas.length} actual={pageRutas} setPage={setPageRutas} />
        </div>
      </div>
    </>
  );
};

const styles = {
    modalOverlay: { 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(20, 20, 30, 0.7)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    },
    loginCardStyle: { 
        background: 'rgba(255, 255, 255, 0.2)', 
        backgroundColor: '#9a9ae1', 
        padding: '40px', borderRadius: '24px', width: '400px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.3)',
        textAlign: 'center'
    },
    loginHeaderTitle: { color: 'white', fontSize: '2rem', marginBottom: '10px', fontWeight: 'bold' },
    loginSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '25px' },
    loginLabel: { display: 'block', textAlign: 'left', color: 'white', marginBottom: '8px', fontSize: '14px', marginLeft: '5px' },
    loginInput: { 
        width: '100%', padding: '12px 15px', borderRadius: '12px', border: 'none', 
        backgroundColor: '#e8f0fe', marginBottom: '20px', fontSize: '15px', outline: 'none'
    },
    btnLoginAction: { 
        background: 'linear-gradient(90deg, #4facfe 0%, #a29bfe 100%)', 
        color: 'white', border: 'none', padding: '14px', borderRadius: '12px', 
        cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    btnLoginCancel: { background: 'transparent', color: 'white', border: '1px solid white', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' },
    closeModalX: { position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' },

    container: { width: '90%', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { margin: 0, color: '#2d3436', fontSize: '1.4rem', fontWeight: '700' },
    table: { width: '100%', borderCollapse: 'collapse' },
    trHead: { borderBottom: '2px solid #f0f0f0' },
    th: { padding: '15px', textAlign: 'left', color: '#b5b5c3', fontSize: '12px', textTransform: 'uppercase' },
    td: { padding: '15px', borderBottom: '1px solid #f8f9fa', fontSize: '14px' },
    badge: { padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    btnCrear: { padding: '10px 20px', backgroundColor: '#633ef1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    btnEliminar: { backgroundColor: '#fff5f5', color: '#e74c3c', border: '1px solid #fed7d7', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' },
    btnEliminarDisabled: { backgroundColor: '#f5f5f5', color: '#b5b5c3', border: '1px solid #e2e8f0', padding: '7px 12px', borderRadius: '8px', cursor: 'not-allowed' },
    paginacionContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '25px', gap: '15px' },
    btnActive: { backgroundColor: '#633ef1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
    btnDisabled: { backgroundColor: '#edf2f7', color: '#a0aec0', border: 'none', padding: '8px 16px', borderRadius: '8px' },
    pageInfo: { fontSize: '14px', fontWeight: '600' }
};

export default AdminDashboard;