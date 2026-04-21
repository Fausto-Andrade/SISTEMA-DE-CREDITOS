import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const DetalleCliente = () => {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const creditosPorPagina = 1;

  const fetchDetalle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/creditos/cliente/detalle/${cedula}`);
      setData(response.data);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error 404',
        text: 'No se encontró el expediente del cliente en el servidor',
        confirmButtonColor: '#6366f1'
      });
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalle();
  }, [cedula]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>Cargando expediente...</div>;
  if (!data || !data.cliente) return <p style={{ textAlign: 'center', padding: '50px' }}>No hay datos disponibles.</p>;

  const { cliente, creditos } = data;

  // LÓGICA DE PAGINACIÓN
  const totalCreditos = creditos ? creditos.length : 0;
  const totalPaginas = Math.ceil(totalCreditos / creditosPorPagina);
  const indiceUltimo = currentPage * creditosPorPagina;
  const indicePrimer = indiceUltimo - creditosPorPagina;
  const creditosActuales = creditos ? creditos.slice(indicePrimer, indiceUltimo) : [];

  // --- AJUSTE DE COBRADOR ---
  // Buscamos 'cobrador_asignado' en el primer crédito, luego en el cliente, o 'No asignado'
  const cobradorNombre = (creditos && creditos[0]?.cobrador_asignado) || cliente.nombre_cobrador || 'No asignado';

  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(val || 0);

  return (
    <div className="table-container" style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* CABECERA DE LA PÁGINA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>       
        <h2 style={{ margin: 0, color: '#757580' }}> Expediente: {cliente.name} {cliente.apellido}</h2> 
        
        <button 
          onClick={() => navigate('/clientes')} 
          style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
        >
          Volver a Lista
        </button>
      </div>

      {/* SECCIÓN DE DATOS PERSONALES */}
      <div style={cardStyle}>
        <h3 style={headerStyle}>Datos Personales y Ubicación</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <p><strong>Cédula:</strong> {cliente.id_cedula}</p>
          <p><strong>Celular:</strong> {cliente.celular}</p>
          <p><strong>Ciudad:</strong> {cliente.ciudad || 'No registrada'}</p>
          <p><strong>Dirección de Cobro:</strong> {cliente.direccion_cobro || 'No registrada'}</p>
          <p><strong>Barrio de Cobro:</strong> {cliente.barrio_cobro || 'No registrado'}</p>
          <p><strong>Dirección de Residencia:</strong> {cliente.direccion || 'No registrada'}</p>
          <p><strong>Barrio de Residencia:</strong> {cliente.barrio_cliente || 'No registrado'}</p>
          <p><strong>Cobrador Asignado:</strong> <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{cobradorNombre}</span></p>
        </div>
      </div>

      {/* SECCIÓN DE HISTORIAL DE CRÉDITOS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '40px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#374151' }}>Historial de Créditos</h3>
        {totalCreditos > 0 && (
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
            Mostrando {currentPage} de {totalPaginas} créditos
          </span>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        {creditosActuales.length > 0 ? (
          creditosActuales.map((credito, index) => {
            const fecha = credito.fecha_inicio ? new Date(credito.fecha_inicio).toLocaleDateString() : 'N/A';
            const saldoActual = parseFloat(credito.saldo_pendiente) || 0;
            const esPagado = saldoActual <= 0 || credito.estado === 'Pagado';

            return (
              <div key={credito.id || index} style={{ 
                ...cardStyle, 
                borderTop: esPagado ? '5px solid #27ae60' : '5px solid #f1c40f',
                position: 'relative',
                maxWidth: '600px', 
                margin: '0 auto 15px auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 'bold', color: '#6366f1' }}>CRÉDITO #{credito.numero_credito_cliente || credito.id}</span>
                  <span style={{ 
                    fontSize: '12px', padding: '2px 8px', borderRadius: '10px', 
                    backgroundColor: esPagado ? '#d1fae5' : '#fff3cd',
                    color: esPagado ? '#155724' : '#856404',
                    fontWeight: 'bold'
                  }}>
                    {esPagado ? 'Saldado' : 'Pendiente'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <p><strong>Fecha de Creación:</strong> {fecha}</p>
                  <p><strong>Monto Prestado:</strong> {formatCurrency(credito.monto)}</p>
                  <p><strong>Tipo de Interés:</strong> {credito.tipo_interes || 'Corriente'} ({credito.interes}%)</p>
                  <p><strong>Frecuencia:</strong> <span style={{ textTransform: 'capitalize' }}>{credito.frecuencia_cuotas || 'N/A'}</span></p>
                  <p><strong>Total a Pagar:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{formatCurrency(credito.total_pagar)}</span></p>
                  
                  <p style={{ marginTop: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                    <strong>Saldo Pendiente:</strong> 
                    <span style={{ 
                      marginLeft: '8px',
                      color: esPagado ? '#27ae60' : '#e74c3c', 
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {formatCurrency(saldoActual)}
                    </span>
                  </p>
                </div>
                
                <button 
                  onClick={() => navigate(`/abonos/${credito.id}`)}
                  style={{ 
                    width: '100%', marginTop: '15px', padding: '10px', 
                    backgroundColor: esPagado ? '#6c757d' : '#2ecc71', 
                    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
                    transition: '0.2s'
                  }}
                >
                  {esPagado ? 'Ver Historial de Abonos' : 'Gestionar Cobro / Abonos'}
                </button>
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            Este cliente no registra historial crediticio.
          </p>
        )}

        {/* CONTROLES DE PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: currentPage === 1 ? '#000000' : '#6366f1',
                color: 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              Anterior
            </button>
            <span style={{ fontWeight: 'bold', color: '#4b5563' }}>
              {currentPage} / {totalPaginas}
            </span>
            <button
              disabled={currentPage === totalPaginas}
              onClick={() => setCurrentPage(prev => prev + 1)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: currentPage === totalPaginas ? '#000000' : '#6366f1',
                cursor: currentPage === totalPaginas ? 'not-allowed' : 'pointer',
                color: 'white',
                fontWeight: '500'
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ESTILOS CONSTANTES
const cardStyle = { 
  backgroundColor: '#fff', 
  padding: '25px', 
  borderRadius: '12px', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
  marginBottom: '15px' 
};

const headerStyle = { 
  marginTop: 0, 
  borderBottom: '1px solid #eee', 
  paddingBottom: '12px', 
  marginBottom: '20px', 
  fontSize: '18px', 
  color: '#2d3436' 
};

export default DetalleCliente;