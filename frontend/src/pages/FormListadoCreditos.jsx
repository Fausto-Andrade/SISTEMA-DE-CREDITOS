import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const FormListadoCreditos = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchCreditos = async () => {
      try {
        const token = localStorage.getItem('token');
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

  // Función para validar deuda antes de navegar
  const verificarYRedirigir = async (clienteId) => {
    try {
      const resDeuda = await api.get(`/creditos/verificar-pendiente/${clienteId}`);
      
      if (resDeuda.data.tienePendiente) {
        Swal.fire({
          title: '¡Cliente con deuda!',
          text: `Este cliente ya tiene ${resDeuda.data.cantidad} crédito(s) pendientes. ¿Deseas generar uno nuevo?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#6A64F1',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/creditos/nuevo?clienteId=${clienteId}`);
          }
        });
      } else {
        navigate(`/creditos/nuevo?clienteId=${clienteId}`);
      }
    } catch (error) {
      console.error("Error al verificar deuda:", error);
      Swal.fire('Error', 'No se pudo verificar el estado del cliente', 'error');
    }
  };

  const datosFiltrados = creditos.filter(item => {
    const termino = busqueda.toLowerCase();
    return (
      item.cliente_cedula?.toString().includes(termino) || 
      item.cliente_nombre?.toLowerCase().includes(termino) || 
      item.cliente_apellido?.toLowerCase().includes(termino) ||
      item.numero_credito_cliente?.toString().includes(termino)
    );
  });

  if (loading) return <div className="formbold-main-wrapper"><p>Cargando tus créditos...</p></div>;

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Créditos Generados</h2>
        <button onClick={() => navigate('/clientes')} className="formbold-btn" style={{ padding: '10px 20px', width: 'auto', backgroundColor: '#2d3436' }}>
          Ver Lista de Clientes
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por cédula, nombre o N° de crédito..."
          className="formbold-form-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
        />
      </div>

      <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#6366f1', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>N° Crédito</th>
            <th style={{ padding: '12px' }}>Cédula</th> 
            <th style={{ padding: '12px' }}>Cliente</th>
            <th style={{ padding: '12px' }}>Valor a entregar</th>
            <th style={{ padding: '12px' }}>Cuotas</th>
            <th style={{ padding: '12px' }}>Interés (%)</th>
            <th style={{ padding: '12px' }}>Total a Pagar</th>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datosFiltrados.length > 0 ? (
            datosFiltrados.map((credito) => (
              <tr key={credito.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{credito.numero_credito_cliente}</td>
                <td style={{ padding: '12px', color: '#444' }}>{credito.cliente_id}</td>
                <td style={{ padding: '12px' }}>
                  {credito.cliente_nombre} {credito.cliente_apellido}
                  <br /><small style={{ color: '#888' }}>{credito.cliente_cedula}</small>
                </td>
                <td style={{ padding: '12px' }}>
                  {parseFloat(credito.monto).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: '12px' }}>{credito.cuotas}</td>
                <td style={{ padding: '12px' }}>{credito.interes}%</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2ecc71' }}>
                  {parseFloat(credito.total_pagar).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: credito.estado === 'Pagado' ? '#d1fae5' : '#fef3c7', color: credito.estado === 'Pagado' ? '#065f46' : '#fd0000', fontSize: '12px', fontWeight: 'bold' }}>
                    {credito.estado === 'Activo' || !credito.estado ? 'Por Pagar' : credito.estado}
                  </span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => navigate(`/abonos/${credito.id}`)} className="formbold-btn" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', backgroundColor: '#6366f1' }}>
                    Abonos
                  </button>
                  <button
                    type="button"
                    onClick={() => verificarYRedirigir(credito.cliente_id)}
                    style={{ padding: '6px 10px', backgroundColor: '#6A64F1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Nuevo crédito para este cliente"
                  >
                    <span>+</span> Nuevo Crédito
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No hay registros.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FormListadoCreditos;