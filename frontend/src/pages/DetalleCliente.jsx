import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const DetalleCliente = () => {
  const { cedula } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const response = await api.get(`/clientes/detalle/${cedula}`);
        setData(response.data);
      } catch (error) {
        console.error("Error al cargar detalle:", error);
        Swal.fire('Error', 'No se pudo cargar la información del cliente', 'error');
        navigate('/clientes');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [cedula, navigate]);

  if (loading) return <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}><p>Cargando información detallada...</p></div>;
  if (!data) return <p style={{ textAlign: 'center', marginTop: '50px' }}>No se encontró información.</p>;

  const { cliente, creditos } = data;

  const formatCurrency = (val) => 
    new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="table-container" style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* CABECERA Y BOTÓN VOLVER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2d3436', margin: 0 }}>Expediente del Cliente</h2>
        <button 
          onClick={() => navigate('/clientes')} 
          className="formbold-btn" 
          style={{ width: 'auto', backgroundColor: '#6366f1', padding: '10px 20px' }}
        >
          Volver a Lista
        </button>
      </div>

      {/* SECCIÓN 1: DATOS PERSONALES (Única vez) */}
      <div style={cardStylePersona}>
        <h3 style={headerStyle}>Información del Titular</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <p><strong>Nombre:</strong> {cliente.name} {cliente.apellido}</p>
          <p><strong>Cédula:</strong> {cliente.id_cedula}</p>
          <p><strong>Celular:</strong> {cliente.celular}</p>
          <p><strong>Ciudad:</strong> {cliente.ciudad}</p>
          <p><strong>Dirección:</strong> {cliente.direccion}</p>
          <p><strong>Notas:</strong> {cliente.notas || 'Sin observaciones'}</p>
          <p><strong>Cobrador: </strong> 
            <span style={{ color: '#6366f1', fontWeight: '700'}}> 
                {cliente.nombre_cobrador || 'No asignado'}
            </span>
          </p>
        </div>
      </div>

      <h3 style={{ color: '#2d3436', marginTop: '40px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Historial de Créditos Individuales
      </h3>

      {/* SECCIÓN 2: CARDS POR CADA CRÉDITO (Mapeo) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '25px' 
      }}>
        {creditos.length > 0 ? (
          creditos.map((credito, index) => {
            const monto = parseFloat(credito.monto) || 0;
            const porcentajeInteres = parseFloat(credito.interes) || 0;
            const totalPagar = parseFloat(credito.total_pagar) || 0;
            const numCuotas = parseInt(credito.cuotas) || 0;
            
            // Cálculos específicos de ESTE crédito
            const valorInteresPesos = (monto * porcentajeInteres) / 100;
            const valorCuota = numCuotas > 0 ? (totalPagar / numCuotas) : 0;

            return (
              <div key={credito.id || index} style={cardStyleFinanciero}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', marginBottom: '15px', paddingBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold', color: '#6366f1' }}>CRÉDITO #{index + 1}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    backgroundColor: credito.estado === 'Pagado' ? '#d1fae5' : '#fff3cd',
                    color: credito.estado === 'Pagado' ? '#155724' : '#856404'
                  }}>
                    {credito.estado || 'Activo'}
                  </span>
                </div>

                <p><strong>Fecha Inicio:</strong> {credito.fecha_inicio ? new Date(credito.fecha_inicio).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Capital:</strong> {formatCurrency(monto)}</p>
                <p><strong>Tasa Interés:</strong> {porcentajeInteres}%</p>
                <p><strong>Ganancia Interés:</strong> <span style={{ color: '#d35400' }}>{formatCurrency(valorInteresPesos)}</span></p>
                <p><strong>Total a Pagar:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{formatCurrency(totalPagar)}</span></p>
                
                <hr style={{ border: '0.5px solid #f8f8f8', margin: '10px 0' }} />
                
                <p><strong>Número de Cuotas:</strong> {numCuotas}</p>
                <p style={{ fontSize: '1.1em', backgroundColor: '#e8f4fd', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <strong>Valor Cuota:</strong> 
                  <span style={{ color: '#2980b9', fontWeight: 'bold' }}> {formatCurrency(valorCuota)}</span>
                </p>

                <button 
                  onClick={() => navigate(`/abonos/${credito.id}`)}
                  style={btnAbonoStyle}
                >
                  Ver Abonos / Cobrar
                </button>
              </div>
            );
          })
        ) : (
          <p>Este cliente no tiene créditos registrados.</p>
        )}
      </div>
    </div>
  );
};

// ESTILOS
const cardStylePersona = {
  backgroundColor: '#ffffff',
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  borderTop: '5px solid #6366f1',
  marginBottom: '20px'
};

const cardStyleFinanciero = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
  borderTop: '5px solid #2ecc71',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const headerStyle = {
  marginTop: 0,
  marginBottom: '15px',
  color: '#2d3436',
  fontSize: '18px',
  borderBottom: '1px solid #eee',
  paddingBottom: '10px'
};

const btnAbonoStyle = {
  marginTop: '15px',
  padding: '10px',
  backgroundColor: '#2ecc71',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background 0.3s'
};

export default DetalleCliente;