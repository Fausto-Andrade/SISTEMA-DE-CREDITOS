import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
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

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPageRutas, setCurrentPageRutas] = useState(1);
  const [currentPageFinalizados, setCurrentPageFinalizados] = useState(1);
  const [currentPagePendientes, setCurrentPagePendientes] = useState(1);
  const itemsPorPagina = 5;

  useEffect(() => {
    fetchInformes();
  }, []);

  const fetchInformes = async () => {
    try {
      setLoading(true);
      const urlCrecimiento = filtros.inicio && filtros.fin 
        ? `/informes/crecimiento-diario?inicio=${filtros.inicio}&fin=${filtros.fin}`
        : '/informes/crecimiento-diario';

      const [resRutas, resPendientes, resCrecimiento, resFinalizados] = await Promise.all([
        api.get('/informes/resumen-rutas'),
        api.get('/informes/clientes-pendientes-diarios'),
        api.get(urlCrecimiento),
        api.get('/informes/clientes-finalizados')
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
  };

  const formatMoney = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(val);

  const getScoreStyle = (score) => {
    const s = score?.toLowerCase();
    if (s === 'excelente') return { color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)', icon: <Award size={14} /> };
    if (s === 'moroso') return { color: '#f39c12', bg: 'rgba(243, 156, 18, 0.1)', icon: <TrendingDown size={14} /> };
    return { color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)', icon: <AlertCircle size={14} /> };
  };

  // --- LÓGICA DE PAGINACIÓN ---
  const paginate = (data, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPorPagina;
    return data.slice(startIndex, startIndex + itemsPorPagina);
  };

  const Paginacion = ({ totalItems, currentPage, setPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPorPagina);
    if (totalPages <= 1) return null;

    return (
      <div style={styles.paginationContainer}>
        <button 
          disabled={currentPage === 1} 
          onClick={() => setPage(currentPage - 1)}
          style={currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
        >
          Ant.
        </button>
        <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
        <button 
          disabled={currentPage === totalPages} 
          onClick={() => setPage(currentPage + 1)}
          style={currentPage === totalPages ? styles.pageBtnDisabled : styles.pageBtn}
        >
          Sig.
        </button>
      </div>
    );
  };

  if (loading) return <div style={styles.loading}>Cargando Dashboard Empresarial...</div>;

  return (
    <div style={styles.container}>
      <style>
        {`
          @media (max-width: 768px) {
            .header-info { flex-direction: column; text-align: center; gap: 20px; }
            .filter-info { flex-direction: column; gap: 15px; text-align: center; }
            .stats-info { grid-template-columns: 1fr !important; }
            .main-grid-info { grid-template-columns: 1fr !important; }
            .date-group { width: 100%; justify-content: center; }
          }
        `}
      </style>

      <header style={styles.header}>
        <div className="header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.title}>Dashboard de Gestión Empresarial</h1>
            <p style={styles.subtitle}>Reporte consolidado de operaciones y rutas</p>
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
        <div className="date-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" style={styles.dateInput} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} />
          <span style={{ color: '#888' }}>al</span>
          <input type="date" style={styles.dateInput} onChange={(e) => setFiltros({ ...filtros, fin: e.target.value })} />
          <button onClick={fetchInformes} style={styles.filterButton}>
            <Filter size={16} /> Aplicar
          </button>
        </div>
      </div>

      <div className="stats-info" style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <p style={styles.statLabel}>Clientes Activos</p>
            <h3 style={styles.statValue}>{clientesPendientes.length}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <p style={styles.statLabel}>Recaudo Esperado</p>
            <h3 style={styles.statValue}>{formatMoney(datosRutas.reduce((acc, r) => acc + parseFloat(r.total_efectivo || 0), 0))}</h3>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏁</div>
          <div>
            <p style={styles.statLabel}>Créditos Finalizados</p>
            <h3 style={styles.statValue}>{clientesFinalizados.length}</h3>
          </div>
        </div>
      </div>

      <div className="main-grid-info" style={styles.mainGrid}>
        <div style={styles.chartSection}>
          <h2 style={styles.sectionTitle}>Crecimiento Diario de Rutas</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="fecha" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="recaudo" stroke="#646cff" strokeWidth={3} dot={{ r: 3 }} name="Recaudo ($)" />
                <Line type="monotone" dataKey="clientes" stroke="#2ecc71" strokeWidth={3} dot={{ r: 3 }} name="Nuevos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.tableSection}>
          <h2 style={styles.sectionTitle}>Rutas y Rentabilidad</h2>
          <div style={{ overflowX: 'auto' }}>
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
                    <td style={{ ...styles.td, color: '#2ecc71', fontWeight: 'bold' }}>{formatMoney(ruta.ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion totalItems={datosRutas.length} currentPage={currentPageRutas} setPage={setCurrentPageRutas} />
        </div>

        <div style={{ ...styles.tableSection, gridColumn: '1 / -1' }}>
          <h2 style={styles.sectionTitle}>Historial Finalizados y Score</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thr}>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Finalización</th>
                  <th style={styles.th}>Valor</th>
                  <th style={styles.th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {clientesFinalizados.length > 0 ? (
                  paginate(clientesFinalizados, currentPageFinalizados).map((cf, i) => {
                    const style = getScoreStyle(cf.score);
                    return (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{cf.nombre}</td>
                        <td style={styles.td}>{new Date(cf.fecha_final).toLocaleDateString()}</td>
                        <td style={styles.td}>{formatMoney(cf.valor_ultimo_credito)}</td>
                        <td style={styles.td}>
                          <div style={{ ...styles.scoreBadge, backgroundColor: style.bg, color: style.color }}>
                            {cf.score}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#666' }}>Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion totalItems={clientesFinalizados.length} currentPage={currentPageFinalizados} setPage={setCurrentPageFinalizados} />
        </div>

        <div style={{ ...styles.tableSection, gridColumn: '1 / -1' }}>
          <h2 style={styles.sectionTitle}>Reporte Diario: Por Pagar</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thr}>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Ruta</th>
                  <th style={styles.th}>Cuotas</th>
                  <th style={styles.th}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {paginate(clientesPendientes, currentPagePendientes).map((c, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>
                        <div style={{fontWeight: 'bold'}}>{c.nombre}</div>
                        <div style={{fontSize: '11px', color: '#888'}}>{c.cedula}</div>
                    </td>
                    <td style={styles.td}>{c.ruta || 'General'}</td>
                    <td style={styles.td}>{c.cuotas_faltantes}</td>
                    <td style={styles.td}>{formatMoney(c.saldo_pendiente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion totalItems={clientesPendientes.length} currentPage={currentPagePendientes} setPage={setCurrentPagePendientes} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#e0e0e0', fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: '30px', paddingTop: '80px' },
  title: { fontSize: '24px', color: '#fff', marginBottom: '8px' },
  subtitle: { color: '#888', fontSize: '14px' },
  backButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  filterContainer: { backgroundColor: '#1a1a1a', padding: '15px 20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', flexWrap: 'wrap' },
  dateInput: { backgroundColor: '#252525', border: '1px solid #444', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' },
  filterButton: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#646cff', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #333' },
  statIcon: { fontSize: '28px' },
  statLabel: { color: '#888', fontSize: '12px', margin: 0 },
  statValue: { color: '#fff', fontSize: '18px', margin: '5px 0 0 0', fontWeight: 'bold' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(40%, 1fr))', gap: '20px' },
  chartSection: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333',  },
  tableSection: { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333'},
  sectionTitle: { fontSize: '16px', marginBottom: '15px', color: '#646cff', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '450px' },
  thr: { borderBottom: '1px solid #333' },
  th: { padding: '12px', textAlign: 'left', color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' },
  td: { padding: '12px', borderBottom: '1px solid #222', fontSize: '13px' },
  tr: { transition: 'background 0.3s' },
  scoreBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
  loading: { color: '#fff', textAlign: 'center', marginTop: '20%', fontSize: '18px' },
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', gap: '10px' },
  pageBtn: { backgroundColor: '#333', color: '#fff', border: '1px solid #444', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  pageBtnDisabled: { backgroundColor: '#111', color: '#444', border: '1px solid #222', padding: '5px 10px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '12px' },
  pageInfo: { fontSize: '12px', color: '#888' }
};

export default Informes;