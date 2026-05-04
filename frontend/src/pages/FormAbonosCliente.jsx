import React, { useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import Swal from 'sweetalert2';

const FormAbonosCliente = ({ idCredito, onClose }) => {
  const [credito, setCredito] = useState(null);
  const [abonosRealizados, setAbonosRealizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 5;

  const fetchDatos = async () => {
    if (!idCredito) return;
    try {
      setLoading(true);
      const [resCredito, resAbonos] = await Promise.all([
        authApi.obtenerDetalleCredito(idCredito),
        authApi.obtenerAbonosPorCredito(idCredito)
      ]);
      setCredito(resCredito.data);
      setAbonosRealizados(resAbonos.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      Swal.fire('Error', 'No se pudo obtener la información', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDatos(); 
  }, [idCredito]);

  const formatMoney = (val) => new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(val || 0);

  const totalAbonado = abonosRealizados.reduce((acc, curr) => {
    if (curr.tipo_abono === 'normal' || curr.tipo_abono === 'pago_atrasado') {
      return acc + parseFloat(curr.monto_abono || 0);
    }
    return acc;
  }, 0);

  const saldoRestante = credito ? parseFloat(credito.total_pagar) - totalAbonado : 0;

  const obtenerValorCuotaDinamico = (numCuotaActual) => {
    if (!credito) return 0;
    const totalPagar = parseFloat(credito.total_pagar);
    const numTotalCuotas = parseInt(credito.cuotas);
    const valorCuotaRedondeado = Math.ceil((totalPagar / numTotalCuotas) / 100) * 100;

    let valorSugerido = numCuotaActual < numTotalCuotas 
      ? valorCuotaRedondeado 
      : totalPagar - (valorCuotaRedondeado * (numTotalCuotas - 1));

    let saldoPendienteArrastrado = 0;
    for (let i = 1; i < numCuotaActual; i++) {
      const valorQueDebiaPagar = (i < numTotalCuotas) ? valorCuotaRedondeado : (totalPagar - (valorCuotaRedondeado * (numTotalCuotas - 1)));
      const abono = abonosRealizados.find(a => String(a.numero_cuota) === String(i) && (a.tipo_abono === 'normal' || a.tipo_abono === 'pago_atrasado'));
      const montoPagado = abono ? parseFloat(abono.monto_abono) : 0;
      if (montoPagado < valorQueDebiaPagar) saldoPendienteArrastrado += (valorQueDebiaPagar - montoPagado);
    }
    return valorSugerido + saldoPendienteArrastrado;
  };

  const registrarAbono = async (numeroCuota, esDeMora) => {
    const valorSugerido = obtenerValorCuotaDinamico(numeroCuota);
    
    // Función para formatear con puntos de mil visualmente
    const formatInput = (val) => {
        return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const { value: montoFormateado } = await Swal.fire({
      title: `Registrar Pago Cuota #${numeroCuota}`,
      input: 'text',
      inputLabel: `Sugerido: ${formatMoney(valorSugerido)}`,
      inputValue: formatInput(valorSugerido),
      showCancelButton: true,
      inputAttributes: {
        style: 'height: 75px; font-size: 36px; font-weight: bold; text-align: center;'
      },
      didOpen: () => {
        const input = Swal.getInput();
        input.addEventListener('input', (e) => {
            e.target.value = formatInput(e.target.value);
        });
      },
      preConfirm: (value) => {
        if (!value) {
            Swal.showValidationMessage('Por favor ingresa un monto');
            return false;
        }
        return value.replace(/\./g, ""); // Retorna el valor limpio
      }
    });

    if (!montoFormateado) return;
    const userAuth = JSON.parse(localStorage.getItem('user')) || {};
    const idCobradorFinal = credito.id_cobrador || credito.usuario_id || userAuth.id;

    try {
      await authApi.registrarAbono({
        id_credito: credito.id,
        id_cliente: credito.cliente_id,
        id_cobrador: idCobradorFinal, 
        numero_cuota: numeroCuota,
        monto_abono: parseFloat(montoFormateado),
        tipo_abono: esDeMora ? 'pago_atrasado' : 'normal',
        observaciones: `Abono cuota #${numeroCuota}`
      });
      Swal.fire('¡Éxito!', 'Abono registrado', 'success');
      fetchDatos(); 
    } catch (error) {
      Swal.fire('Error', 'No se pudo registrar el abono', 'error');
    }
  };

  const marcarMora = (numCuota) => {
    Swal.fire({
      title: '¿Marcar mora?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const userAuth = JSON.parse(localStorage.getItem('user')) || {};
        const idCobradorFinal = credito.id_cobrador || credito.usuario_id || userAuth.id;
        try {
          await authApi.marcarMora({
            id_credito: credito.id,
            id_cliente: credito.cliente_id,
            id_cobrador: idCobradorFinal, 
            numero_cuota: numCuota
          });
          fetchDatos();
        } catch (error) { 
          Swal.fire('Error', 'No se pudo marcar la mora', 'error'); 
        }
      }
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  if (!credito) return null;

  const totalCuotas = parseInt(credito.cuotas || 0);
  const totalPaginas = Math.ceil(totalCuotas / registrosPorPagina);
  const cuotasPaginadas = [...Array(totalCuotas)]
    .map((_, i) => i + 1)
    .slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, padding: '10px'
    }}>
      <style>{`
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px; /* Reducido para ajuste en una fila */
          margin-bottom: 20px;
          background-color: #f9fafb;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          text-align: center;
          border-right: 1px solid #e5e7eb;
        }
        .summary-item:last-child { border-right: none; }
        .summary-label {
          font-size: 9px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .summary-value {
          font-size: 13px;
          color: #111827;
          font-weight: 600;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(5, 1fr);
            overflow-x: auto;
            gap: 5px;
          }
          .summary-value { font-size: 10px; }
          .summary-label { font-size: 8px; }
          
          .styled-table thead { display: none; }
          .styled-table tr { 
            display: block; 
            margin-bottom: 20px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 10px;
            background: #fff;
          }
          .styled-table td { 
            display: flex; 
            justify-content: space-between;
            align-items: center; 
            padding: 10px 5px; 
            border: none; 
            border-bottom: 1px solid #f3f4f6;
          }
          .styled-table td:before { 
            content: attr(data-label); 
            font-weight: 700; 
            color: #4b5563; 
            font-size: 12px;
            text-transform: uppercase;
            flex: 1;
            text-align: left;
          }
          .styled-table td .valor-celda {
            flex: 1;
            text-align: right;
            display: block;
          }
        }
      `}</style>

      <div className="formbold-form-wrapper" style={{ 
        maxWidth: '900px', width: '100%', backgroundColor: '#fff', 
        padding: '25px', borderRadius: '12px', position: 'relative',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0px 10px 30px rgba(0,0,0,0.3)'
      }}>
        
        <button onClick={onClose} style={{ 
            position: 'absolute', top: '15px', right: '15px', backgroundColor: '#ef4444', 
            color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '50%', 
            cursor: 'pointer', fontWeight: 'bold', zIndex: 1010
          }}>✕</button>

        <div style={{ marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5em', color: '#111827' }}>Gestión de Cobro</h2>
            <p style={{ color: '#6366f1', fontWeight: '600', marginTop: '8px' }}>
                Cliente: {credito.cliente_nombre} {credito.cliente_apellido} <span style={{color: '#9ca3af', margin: '0 5px'}}>|</span> Crédito #{credito.numero_credito_cliente}
            </p>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Préstamo</span>
            <span className="summary-value">{formatMoney(credito.monto)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Interés</span>
            <span className="summary-value" style={{color: '#ab5ceb'}}>{credito.interes}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total</span>
            <span className="summary-value" style={{color: '#6366f1'}}>{formatMoney(credito.total_pagar)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Abonado</span>
            <span className="summary-value" style={{color: '#059669'}}>{formatMoney(totalAbonado)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Saldo</span>
            <span className="summary-value" style={{color: '#dc2626'}}>{formatMoney(saldoRestante)}</span>
          </div>
        </div>

        <div className="table-wrapper">
            <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Cuota</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Valor a Cobrar</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Recibido</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cuotasPaginadas.map((numCuota) => {
                  const valorACobrar = obtenerValorCuotaDinamico(numCuota);
                  const registros = abonosRealizados.filter(a => String(a.numero_cuota) === String(numCuota));
                  const reg = registros.find(a => ['normal', 'pago_atrasado'].includes(a.tipo_abono)) || registros.find(a => a.tipo_abono === 'mora');
                  const esPagado = ['normal', 'pago_atrasado'].includes(reg?.tipo_abono);

                  return (
                    <tr key={numCuota} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td data-label="Cuota" style={{ padding: '12px' }}><span className="valor-celda">{numCuota}</span></td>
                      <td data-label="Valor a Cobrar" style={{ padding: '12px' }}><span className="valor-celda" style={{ fontWeight: '700' }}>{formatMoney(valorACobrar)}</span></td>
                      <td data-label="Estado" style={{ padding: '12px' }}>
                        <span className="valor-celda" style={{ 
                          color: reg?.tipo_abono === 'normal' ? '#059669' : reg?.tipo_abono === 'mora' ? '#dc2626' : '#d97706', 
                          fontWeight: 'bold', fontSize: '12px' 
                        }}>
                          {reg ? reg.tipo_abono.toUpperCase().replace('_', ' ') : 'PENDIENTE'}
                        </span>
                      </td>
                      <td data-label="Recibido" style={{ padding: '12px' }}><span className="valor-celda">{esPagado ? formatMoney(reg.monto_abono) : '---'}</span></td>
                      <td data-label="Fecha" style={{ padding: '12px' }}><span className="valor-celda" style={{ color: '#6b7280' }}>{reg?.fecha_abono ? new Date(reg.fecha_abono).toLocaleDateString('es-CO') : '---'}</span></td>
                      <td data-label="Acción" style={{ padding: '12px' }}>
                        <div className="valor-celda" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {esPagado ? <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ Pagado</span> : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => registrarAbono(numCuota, reg?.tipo_abono === 'mora')} style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                                {reg?.tipo_abono === 'mora' ? 'Pagar Mora' : 'Cobrar'}
                              </button>
                              {reg?.tipo_abono !== 'mora' && (
                                <button onClick={() => marcarMora(numCuota)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Mora</button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>

        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px', gap: '15px', alignItems: 'center' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 16px', backgroundColor: currentPage === 1 ? '#e5e7eb' : '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Anterior</button>
            <span style={{fontWeight: 'bold'}}>{currentPage} / {totalPaginas}</span>
            <button disabled={currentPage === totalPaginas} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 16px', backgroundColor: currentPage === totalPaginas ? '#e5e7eb' : '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormAbonosCliente;