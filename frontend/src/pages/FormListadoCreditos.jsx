import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';

const FormListadoCreditos = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditos = async () => {
      try {
        const token = localStorage.getItem('token');
        // Usamos la ruta que definimos en el backend para el cobrador
        const response = await api.get('/creditos/cobrador', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setCreditos(response.data);
      } catch (error) {
        console.error("Error al cargar créditos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditos();
  }, []);

  if (loading) return <div className="formbold-main-wrapper"><p>Cargando tus créditos...</p></div>;

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      
      {/* Encabezado con botones de navegación */}
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
      }}>
        <h2 style={{ margin: 0 }}>Créditos Generados</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/clientes')} 
            className="formbold-btn" 
            style={{ 
              padding: '10px 20px', 
              width: 'auto', 
              backgroundColor: '#2d3436' 
            }}
          >
            Ver Lista de Clientes
          </button>
        </div>
      </div>

      <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#6366f1', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>N° Crédito</th>
            <th style={{ padding: '12px' }}>Cliente</th>
            <th style={{ padding: '12px' }}>Monto ($)</th>
            <th style={{ padding: '12px' }}>Cuotas</th>
            <th style={{ padding: '12px' }}>Interés (%)</th>
            <th style={{ padding: '12px' }}>Total a Pagar</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {creditos.length > 0 ? (
            creditos.map((credito) => {
              // Aseguramos que los valores sean numéricos para el cálculo
              const monto = parseFloat(credito.monto) || 0;
              const totalPagar = parseFloat(credito.total_pagar) || 0;

              return (
                <tr key={credito.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{credito.numero_credito_cliente}</td>
                  <td style={{ padding: '12px' }}>
                    {credito.cliente_nombre} {credito.cliente_apellido}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {monto.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                  </td>
                  <td style={{ padding: '12px' }}>{credito.cuotas}</td>
                  <td style={{ padding: '12px' }}>{credito.interes}%</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#2ecc71' }}>
                    {totalPagar.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: credito.estado === 'Pagado' ? '#d1fae5' : '#fef3c7',
                      color: credito.estado === 'Pagado' ? '#065f46' : '#92400e',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {credito.estado || 'Activo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => navigate(`/abonos/${credito.id}`)}
                      className="formbold-btn"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        width: 'auto',
                        backgroundColor: '#6366f1' 
                      }}
                    >
                      Gestionar Abonos
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No hay créditos registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FormListadoCreditos;