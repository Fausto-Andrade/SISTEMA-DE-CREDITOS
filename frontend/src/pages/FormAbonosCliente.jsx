import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const FormAbonosCliente = () => {
  const { idCredito } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [abonosRealizados, setAbonosRealizados] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDatos = async () => {
    if (!idCredito) return;
    try {
      const [resCredito, resAbonos] = await Promise.all([
        api.get(`/creditos/detalle/${idCredito}`),
        api.get(`/abonos/credito/${idCredito}`)
      ]);
      setCredito(resCredito.data);
      setAbonosRealizados(resAbonos.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDatos(); }, [idCredito]);

  const registrarAbono = async (numeroCuota, monto, esDeMora) => {
    const tipoAbono = esDeMora ? 'pago_atrasado' : 'normal';
    try {
      const res = await api.post('/abonos', {
        id_credito: credito.id,
        id_cliente: credito.cliente_id,
        id_cobrador: credito.usuario_id,
        numero_cuota: numeroCuota,
        monto_abono: monto,
        tipo_abono: tipoAbono,
        observaciones: esDeMora ? `Pago de mora #${numeroCuota}` : `Pago cuota #${numeroCuota}`
      });
      
      Swal.fire('¡Éxito!', 'Pago registrado correctamente', 'success');
      setAbonosRealizados(prev => [...prev, res.data]);
      fetchDatos(); 
    } catch (error) {
      Swal.fire('Error', 'No se pudo procesar el pago', 'error');
    }
  };

  const marcarMora = (numCuota) => {
    Swal.fire({
      title: '¿Marcar como incumplido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      confirmButtonText: 'Sí, marcar mora'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.post('/abonos/mora', {
            id_credito: credito.id,
            id_cliente: credito.cliente_id,
            id_cobrador: credito.usuario_id,
            numero_cuota: numCuota,
            observaciones: `Incumplimiento cuota #${numCuota}`
          });
          fetchDatos();
        } catch (error) { Swal.fire('Error', 'Error al marcar mora', 'error'); }
      }
    });
  };

  if (loading) return <div className="formbold-main-wrapper">Cargando...</div>;

  const valorCuota = parseFloat(credito.total_pagar) / parseInt(credito.cuotas);

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper" style={{ maxWidth: '1000px' }}>
        <h2>Gestión de Abonos - #{credito.numero_credito_cliente}</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '15px' }}>Cuota</th>
              <th style={{ padding: '15px' }}>Valor</th>
              <th style={{ padding: '15px' }}>Estado</th>
              <th style={{ padding: '15px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(parseInt(credito.cuotas))].map((_, index) => {
              const numCuota = index + 1;
              const registrosCuota = abonosRealizados.filter(a => String(a.numero_cuota) === String(numCuota));
              const registroFinal = registrosCuota.find(a => a.tipo_abono === 'normal' || a.tipo_abono === 'pago_atrasado') 
                                   || registrosCuota.find(a => a.tipo_abono === 'mora');

              const esPagado = registroFinal?.tipo_abono === 'normal';
              const esPagoAtrasado = registroFinal?.tipo_abono === 'pago_atrasado';
              const esMora = registroFinal?.tipo_abono === 'mora';
              const esFinalizado = esPagado || esPagoAtrasado;

              return (
                <tr key={numCuota} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{numCuota}</td>
                  <td style={{ padding: '15px' }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valorCuota)}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      color: esPagoAtrasado ? '#8B4513' : esPagado ? '#27ae60' : esMora ? '#e74c3c' : '#f39c12', 
                      fontWeight: 'bold' 
                    }}>
                      {esPagoAtrasado ? 'MORA PAGADA' : esPagado ? 'PAGADO' : esMora ? 'MORA' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    {esFinalizado ? (
                      <button disabled className="formbold-btn" style={{ 
                        backgroundColor: esPagoAtrasado ? '#8B4513' : '#27ae60', 
                        padding: '8px 15px', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'not-allowed' 
                      }}>
                        {esPagoAtrasado ? 'Mora Pagada' : 'Pago Ok'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => registrarAbono(numCuota, valorCuota, esMora)} 
                          className="formbold-btn" 
                          style={{ backgroundColor: esMora ? '#f39c12' : '#633ef1', padding: '8px 15px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                          {esMora ? 'Pagar Mora' : 'Registrar Pago'}
                        </button>
                        {!esMora && (
                          <button 
                            onClick={() => marcarMora(numCuota)} 
                            className="formbold-btn" 
                            style={{ backgroundColor: '#e74c3c', padding: '8px 15px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                          >
                            No Pagó
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormAbonosCliente;