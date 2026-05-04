import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// CORRECCIÓN: Se cambia la importación por defecto por la nombrada authApi
import { authApi } from '../api/auth';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ArrowLeft, Calendar, Filter, Award, TrendingDown, AlertCircle } from 'lucide-react'; 

const Informes = () => {
  const navigate = useNavigate();
  const [datosRutas, setDatosRutas] = useState([]);
  const [clientesPendientes, setClientesPendientes] = useState([]);
  const [clientesFinalizados, setClientesFinalizados] = useState([]);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filtros, setFiltros] = useState({ inicio: '', fin: '' });

  // --- PAGINACIÓN ---
  const [currentPageRutas, setCurrentPageRutas] = useState(1);
  const [currentPageFinalizados, setCurrentPageFinalizados] = useState(1);
  const itemsPorPagina = 5;

  // 1. OBTENCIÓN ROBUSTA DEL ID
  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const compradorId = user?.id || user?.id_comprador;

  const fetchInformes = useCallback(async () => {
    if (!compradorId) {
      console.error("No se puede cargar informes: compradorId no definido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // CONFIGURACIÓN DE PARÁMETROS
      const paramsBase = { comprador_id: compradorId };
      const paramsCrecimiento = {
        comprador_id: compradorId,
        inicio: filtros.inicio || undefined,
        fin: filtros.fin || undefined
      };

      // 3. PETICIONES UTILIZANDO authApi (Ajustado a la estructura de tu backend)
      const [resRutas, resPendientes, resCrecimiento, resFinalizados] = await Promise.all([
        authApi.obtenerResumenRutas(paramsBase),
        authApi.obtenerClientesPendientes(paramsBase),
        authApi.obtenerCrecimientoDiario(paramsCrecimiento),
        authApi.obtenerClientesFinalizados(paramsBase)
      ]);

      setDatosRutas(resRutas.data || []);
      setClientesPendientes(resPendientes.data || []);
      setDatosGrafico(resCrecimiento.data || []);
      setClientesFinalizados(resFinalizados.data || []);
      
    } catch (error) {
      console.error("Error al cargar informes:", error);
    } finally {
      setLoading(false);
    }
  }, [filtros, compradorId]);

  useEffect(() => {
    fetchInformes();
  }, [fetchInformes]);

  // --- FUNCIONES DE AYUDA (Sin cambios) ---
  const formatMoney = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(val || 0);

  const getScoreStyle = (score) => {
    const s = score?.toLowerCase();
    if (s === 'excelente') return { color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)', icon: <Award size={14} /> };
    if (s === 'moroso') return { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.1)', icon: <TrendingDown size={14} /> };
    return { color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)', icon: <AlertCircle size={14} /> };
  };

  const paginate = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPorPagina;
    return (data || []).slice(startIndex, startIndex + itemsPorPagina);
  };

  const Paginacion = ({ totalItems, currentPage, setPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPorPagina);
    if (totalPages <= 1) return null;
    return (
      <div style={styles.paginationContainer}>
        <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
          style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}>Ant.</button>
        <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}
          style={currentPage === totalPages ? styles.pageBtnDisabled : styles.pageBtn}>Sig.</button>
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>Cargando Dashboard...</div>;

  return (
    <div style={styles.container}>
      <style>
        {`
          @media (max-width: 768px) {
            .header-info { flex-direction: column; text-align: center; gap: 20px; }
            .filter-info { flex-direction: column; gap: 15px; text-align: center; }
            .stats-info { grid-template-columns: 1fr !important; }
            .main-grid-info { grid-template-columns: 1fr !important; }
          }
        `}
      </style>

      <header style={styles.header}>
        <div className="header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.title}>Dashboard de Gestión Empresarial</h1>
            <p style={styles.subtitle}>Reporte de {user?.username || user?.nombre || 'Usuario'} (ID: {compradorId})</p>
          </div>
          <button onClick={() => navigate('/admin-dashboard')} style={styles.backButton}>
            <ArrowLeft size={18} /> Volver al Panel
          </button>
        </div>
      </header>

      <div className="filter-info" style={styles.filterContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="#646cff" />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Filtrar Crecimiento:</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" style={styles.dateInput} value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          <input type="date" style={styles.dateInput} value={filtros.fin} onChange={(e) => setFiltros({ ...filtros, fin: e.target.value })} />
          <button onClick={fetchInformes} style={styles.filterButton}>
            <Filter size={16} /> Aplicar
          </button>
        </div>
      </div>

      <div className="stats-info" style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div><p style={styles.statLabel}>Clientes Activos</p><h3 style={styles.statValue}>{clientesPendientes.length}</h3></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <p style={styles.statLabel}>Recaudo Esperado</p>
            <h3 style={styles.statValue}>
                {formatMoney(datosRutas.reduce((acc, r) => acc + parseFloat(r.total_efectivo || 0), 0))}
            </h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏁</div>
          <div><p style={styles.statLabel}>Finalizados</p><h3 style={styles.statValue}>{clientesFinalizados.length}</h3></div>
        </div>
      </div>

      <div className="main-grid-info" style={styles.mainGrid}>
        <div style={styles.chartSection}>
          <h2 style={styles.sectionTitle}>Crecimiento Diario</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="fecha" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444' }} />
                <Legend />
                <Line type="monotone" dataKey="recaudo" stroke="#646cff" name="Recaudo ($)" />
                <Line type="monotone" dataKey="clientes" stroke="#2ecc71" name="Nuevos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>Rutas y Rentabilidad</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Ruta</th>
                <th style={styles.th}>Efectivo</th>
                <th style={styles.th}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {paginate(datosRutas, currentPageRutas).map((ruta, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{ruta.nombre_ruta}</td>
                  <td style={styles.td}>{formatMoney(ruta.total_efectivo)}</td>
                  <td style={{ ...styles.td, color: '#2ecc71' }}>{formatMoney(ruta.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paginacion totalItems={datosRutas.length} currentPage={currentPageRutas} setPage={setCurrentPageRutas} />
        </div>

        <div style={{ ...styles.tableSection, gridColumn: '1 / -1' }}>
          <h2 style={styles.sectionTitle}>Historial Finalizados</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Finalización</th>
                <th style={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {clientesFinalizados.length > 0 ? paginate(clientesFinalizados, currentPageFinalizados).map((cf, i) => {
                const style = getScoreStyle(cf.score);
                return (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{cf.nombre}</td>
                    <td style={styles.td}>{new Date(cf.fecha_final).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.scoreBadge, backgroundColor: style.bg, color: style.color }}>
                        {style.icon} {cf.score}
                      </span>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Sin datos</td></tr>}
            </tbody>
          </table>
          <Paginacion totalItems={clientesFinalizados.length} currentPage={currentPageFinalizados} setPage={setCurrentPageFinalizados} />
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS MANTENIDOS ---
const styles = {
  container: { padding: '20px', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#e0e0e0' },
  header: { marginBottom: '30px', paddingTop: '80px' },
  title: { fontSize: '24px', color: '#fff' },
  subtitle: { color: '#888', fontSize: '14px' },
  backButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' },
  filterContainer: { backgroundColor: '#1a1a1a', padding: '15px 20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333' },
  dateInput: { backgroundColor: '#252525', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px' },
  filterButton: { backgroundColor: '#646cff', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #333' },
  statIcon: { fontSize: '28px' },
  statLabel: { color: '#888', fontSize: '12px' },
  statValue: { color: '#fff', fontSize: '18px', fontWeight: 'bold' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(40%, 1fr))', gap: '20px' },
  chartSection: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' },
  tableSection: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333'},
  sectionTitle: { fontSize: '16px', color: '#646cff', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', color: '#888', fontSize: '11px' },
  td: { padding: '12px', borderBottom: '1px solid #222', fontSize: '13px' },
  scoreBadge: { padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  loading: { color: '#fff', textAlign: 'center', marginTop: '20%' },
  paginationContainer: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' },
  pageBtn: { backgroundColor: '#333', color: '#fff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' },
  pageBtnDisabled: { backgroundColor: '#111', color: '#444', cursor: 'not-allowed' },
  pageInfo: { color: '#888', fontSize: '12px' }
};

export default Informes;