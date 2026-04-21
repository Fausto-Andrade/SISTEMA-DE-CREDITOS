import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const FormListadoCreditos = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 5;

  useEffect(() => {
    const fetchCreditos = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await api.get('/creditos/todos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCreditos(response.data);
      } catch (error) {
        console.error("❌ Error al cargar créditos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const datosFiltrados = creditos.filter(item => {
    const termino = busqueda.toLowerCase();
    return (
      item.cliente_cedula?.toString().includes(termino) || 
      item.cliente_nombre?.toLowerCase().includes(termino) || 
      item.cliente_apellido?.toLowerCase().includes(termino) ||
      item.numero_credito_cliente?.toString().includes(termino) ||
      item.cobrador_asignado?.toLowerCase().includes(termino)
    );
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    navigate('/');
  };

  const ultimoRegistro = currentPage * registrosPorPagina;
  const primerRegistro = ultimoRegistro - registrosPorPagina;
  const registrosActuales = datosFiltrados.slice(primerRegistro, ultimoRegistro);
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  const cambiarPagina = (numeroPagina) => setCurrentPage(numeroPagina);

  if (loading) return <div className="formbold-main-wrapper"><p>Cargando créditos...</p></div>;

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center'}}>
        <h2 style={{ margin: 0 }}>Créditos Generados (Todos los Clientes)</h2>        
      </div>
      <div style={{ display: 'flex', justifyContent: 'end', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={() => navigate('/clientes')} className="formbold-btn" style={{ padding: '10px 20px', width: 'auto', backgroundColor: '#2d3436' }}>
          Ver Clientes
        </button>
        <button 
          onClick={handleLogout} 
          // className="btn-logout" 
          style={{ backgroundColor: '#e74c3c', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por cédula, nombre o número de crédito..."
          className="formbold-form-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', borderRadius: '20px', border: '1px solid #ddd' }}
        />
      </div>

      <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ backgroundColor: '#6366f1', color: 'white', textAlign: 'left' }}>
      <th style={{ padding: '12px' }}># CRÉDITO</th>
      <th style={{ padding: '12px' }}>RUTA</th>
      <th style={{ padding: '12px' }}>CLIENTE</th>
      <th style={{ padding: '12px' }}>HISTORIAL</th>
      <th style={{ padding: '12px' }}>PRÉSTAMO</th>
      <th style={{ padding: '12px' }}>TOTAL A PAGAR</th>
      <th style={{ padding: '12px' }}>COBRADOR</th>
      <th style={{ padding: '12px' }}>ESTADO</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>ACCIONES</th>
    </tr>
  </thead>
  <tbody>
    {registrosActuales.length > 0 ? (
      registrosActuales.map((credito) => {
        const estadoNormalizado = credito.estado?.trim().toLowerCase();
        const estaPagado = estadoNormalizado === 'pagado';
        
        return (
          <tr key={credito.id} style={{ borderBottom: '1px solid #eee' }}>
            <td data-label="# CRÉDITO" style={{ padding: '12px', fontWeight: 'bold' }}>
              {credito.numero_credito_cliente || 'N/A'}
            </td>

            {/* Muestra el nombre de la ruta que viene de la tabla rutas */}
            <td data-label="RUTA" style={{ padding: '12px' }}>
              <span style={{ 
                fontWeight: 'bold', 
                color: '#4b5563', 
                backgroundColor: '#f3f4f6', 
                padding: '4px 8px', 
                borderRadius: '6px',
                fontSize: '11px',
                border: '1px solid #e5e7eb',
                display: 'inline-block'
              }}>
                {credito.nombre_ruta || 'SIN RUTA'} 
              </span>
            </td>

            <td data-label="CLIENTE" style={{ padding: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#6366f1' }}>{credito.name} {credito.apellido}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>CC: {credito.id_cedula}</div>
            </td>

            <td data-label="HISTORIAL" style={{ padding: '12px' }}>
              <span style={{ backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', border: '1px solid #ddd' }}>
                {credito.historial_count || 0} cred.
              </span>
            </td>

            <td data-label="PRÉSTAMO" style={{ padding: '12px', fontWeight: 'bold' }}>
              ${Number(credito.monto || 0).toLocaleString('es-CO')}
            </td>

            <td data-label="TOTAL A PAGAR" style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>
              ${Number(credito.total_pagar || 0).toLocaleString('es-CO')}
            </td>

            <td data-label="COBRADOR" style={{ padding: '12px' }}>
              <span style={{ 
                fontWeight: 'bold', 
                color: '#4b5563', 
                backgroundColor: '#e5e7eb', 
                padding: '4px 8px', 
                borderRadius: '6px',
                fontSize: '12px' 
              }}>
                {credito.cobrador_asignado || 'Luis Toro'}
              </span>
            </td>

            <td data-label="ESTADO" style={{ padding: '12px' }}>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: estaPagado ? '#d1fae5' : '#fef3c7', 
                color: estaPagado ? '#065f46' : '#92400e',
                fontWeight: 'bold',
                fontSize: '11px'
              }}>
                {credito.estado || 'Pago Pendiente'}
              </span>
            </td>

            <td data-label="ACCIONES" style={{ padding: '12px', textAlign: 'center' }}>
              <button                            
                className="formbold-btn" 
                disabled={true}                         
                style={{ 
                  padding: '5px 10px', 
                  fontSize: '11px', 
                  width: 'auto',
                  cursor: 'not-allowed',
                  backgroundColor: estaPagado ? '#d1fae5' : '#fef3c7',
                  border: 'none',
                  color: estaPagado ? '#065f46' : '#92400e',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                {estaPagado ? 'Completado' : 'Pago Pendiente'}
              </button>
            </td>
          </tr>
        );
      })
    ) : (
      <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron créditos.</td></tr>
    )}
  </tbody>
</table>
      

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
          <button onClick={() => cambiarPagina(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '8px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white' }}>
            Anterior
          </button>
          {[...Array(totalPaginas)].map((_, index) => (
            <button key={index + 1} onClick={() => cambiarPagina(index + 1)} style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: currentPage === index + 1 ? '#6366f1' : 'white', color: currentPage === index + 1 ? 'white' : 'black', cursor: 'pointer', fontWeight: 'bold' }}>
              {index + 1}
            </button>
          ))}
          <button onClick={() => cambiarPagina(currentPage + 1)} disabled={currentPage === totalPaginas} style={{ padding: '8px 12px', cursor: currentPage === totalPaginas ? 'not-allowed' : 'pointer', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: currentPage === totalPaginas ? '#f5f5f5' : 'white' }}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default FormListadoCreditos;