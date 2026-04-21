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
  
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 5;

  const fetchDatos = async () => {
    if (!idCredito || idCredito === "undefined") return;
    try {
      setLoading(true);
      const [resCredito, resAbonos] = await Promise.all([
        api.get(`/creditos/detalle/${idCredito}`),
        api.get(`/abonos/credito/${idCredito}`)
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

    const { value: montoManual } = await Swal.fire({
      title: `Registrar Pago Cuota #${numeroCuota}`,
      input: 'number',
      inputLabel: `Sugerido: ${formatMoney(valorSugerido)}`,
      inputValue: valorSugerido,
      showCancelButton: true,
    });

    if (!montoManual) return;

    const userAuth = JSON.parse(localStorage.getItem('user')) || {};
    const idCobradorFinal = credito.id_cobrador || credito.usuario_id || userAuth.id;

    try {
      await api.post('/abonos', {
        id_credito: credito.id,
        id_cliente: credito.cliente_id,
        id_cobrador: idCobradorFinal, 
        numero_cuota: numeroCuota,
        monto_abono: montoManual,
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
          await api.post('/abonos/mora', {
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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  if (!credito) return <div style={{ textAlign: 'center', padding: '50px' }}>Crédito no encontrado.</div>;

  const totalCuotas = parseInt(credito.cuotas || 0);
  const totalPaginas = Math.ceil(totalCuotas / registrosPorPagina);
  const cuotasPaginadas = [...Array(totalCuotas)]
    .map((_, i) => i + 1)
    .slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina);

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      <div className="formbold-form-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={() => navigate(-1)} className="formbold-btn" style={{ width: 'auto', backgroundColor: '#6366f1' }}>← Volver</button>
            <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0 }}>Gestión de Cobro</h2>
                <p style={{ color: '#6366f1', fontWeight: 'bold' }}>Cliente: {credito.cliente_nombre} {credito.cliente_apellido}</p>
            </div>
        </div>

        <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Cuota</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Valor a Cobrar</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Valor Recibido</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Fecha Registro</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cuotasPaginadas.map((numCuota) => {
              const valorACobrar = obtenerValorCuotaDinamico(numCuota);
              const registros = abonosRealizados.filter(a => String(a.numero_cuota) === String(numCuota));
              // Buscamos el registro de pago o en su defecto el de mora
              const reg = registros.find(a => ['normal', 'pago_atrasado'].includes(a.tipo_abono)) || registros.find(a => a.tipo_abono === 'mora');
              
              const esPagado = ['normal', 'pago_atrasado'].includes(reg?.tipo_abono);

              return (
                <tr key={numCuota} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{numCuota}</td>
                  <td style={{ padding: '12px' }}>{formatMoney(valorACobrar)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: reg?.tipo_abono === 'normal' ? '#27ae60' : reg?.tipo_abono === 'mora' ? '#e74c3c' : '#f39c12', fontWeight: 'bold' }}>
                      {reg ? reg.tipo_abono.toUpperCase() : 'PENDIENTE'}
                    </span>
                  </td>
                  
                  {/* Campo Valor Recibido */}
                  <td style={{ padding: '12px' }}>
                    {esPagado ? formatMoney(reg.monto_abono) : '---'}
                  </td>

                  {/* Campo Fecha Registro */}
                  <td style={{ padding: '12px', fontSize: '0.9em' }}>
                    {reg?.fecha_abono ? new Date(reg.fecha_abono).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {esPagado ? (
                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✓ Pagado</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => registrarAbono(numCuota, reg?.tipo_abono === 'mora')} 
                          style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {reg?.tipo_abono === 'mora' ? 'Pagar Mora' : 'Cobrar'}
                        </button>
                        {reg?.tipo_abono !== 'mora' && (
                          <button 
                            onClick={() => marcarMora(numCuota)} 
                            style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Mora
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

        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              className="formbold-btn" 
              style={{ width: 'auto', padding: '5px 10px', backgroundColor: currentPage === 1 ? '#ccc' : '#6366f1' }}
            >
              Anterior
            </button>
            <span style={{ padding: '5px' }}>{currentPage} / {totalPaginas}</span>
            <button 
              disabled={currentPage === totalPaginas} 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="formbold-btn" 
              style={{ width: 'auto', padding: '5px 10px', backgroundColor: currentPage === totalPaginas ? '#ccc' : '#6366f1' }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormAbonosCliente;