import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';

const FormCredito = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(search);
  const idDesdeUrl = query.get('clienteId'); 
  
  const [cobradores, setCobradores] = useState([]);
  const [loadingCobradores, setLoadingCobradores] = useState(true);
  const [clientes, setClientes] = useState([]);

  const { register, handleSubmit, watch, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { 
      cliente_id: idDesdeUrl || "",
      tipo_interes: "fijo",
      frecuencia_cuotas: "diario"
    }
  });

  // Solo cargamos los datos necesarios (clientes y cobradores)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingCobradores(true);
        const [resClientes, resCobradores] = await Promise.all([
          api.get('/clientes'),
          api.get('/usuarios-registrados')
        ]);
        
        setClientes(resClientes.data);
        setCobradores(resCobradores.data.filter(u => u.role === 'user'));
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoadingCobradores(false);
      }
    };

    cargarDatos();
  }, []); // Ya no dependemos de nada más

  const monto = watch("monto") || 0;
  const interes = watch("interes") || 0;
  const totalPagar = parseFloat(monto) + (parseFloat(monto) * (parseFloat(interes) / 100));

  const guardarCredito = async (data) => {
    try {
      const dataFinal = { 
        ...data, 
        cliente_id: idDesdeUrl || data.cliente_id,
        total_pagar: totalPagar 
      };
      await api.post('/creditos', dataFinal);
      Swal.fire('¡Éxito!', 'Crédito registrado correctamente', 'success');
      navigate('/creditos/cobrador');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo registrar', 'error');
    }
  };

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <form onSubmit={handleSubmit(guardarCredito)} autoComplete="off">
          
          {/* SECCIÓN CLIENTE */}
          <div className="formbold-mb-3">
            <label className="formbold-form-label">Cliente</label>
            {idDesdeUrl ? (
              <div className="formbold-form-input" style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd', color: '#555' }}>
                <strong>
                  {clientes.find(c => String(c.id_cedula) === String(idDesdeUrl))?.name || "Cargando..."} 
                  {" "}
                  {clientes.find(c => String(c.id_cedula) === String(idDesdeUrl))?.apellido || ""}
                </strong>
                <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#888' }}>
                  (CC: {idDesdeUrl})
                </span>
              </div> 
            ) : (
              <select className="formbold-form-input" {...register('cliente_id', { required: true })}>
                <option value="">Seleccione un cliente...</option>
                {clientes.map(c => (
                  <option key={c.id_cedula} value={c.id_cedula}>
                    {c.name} {c.apellido} - {c.id_cedula}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">N° Crédito</label>
              <input 
                type="text" 
                value="Automático"
                className="formbold-form-input" 
                readOnly 
                style={{ backgroundColor: '#f0f0f0', color: '#999' }} 
              />
            </div>

            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">Tipo de Interés</label>
              <select {...register('tipo_interes')} className="formbold-form-input">
                <option value="fijo">Fijo</option>
                <option value="indefinido">Indefinido</option>
              </select>
            </div>          
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">Monto a Prestar</label>
              <input 
                type="number" 
                placeholder="0.00"
                {...register('monto', { required: true, min: 1 })} 
                className="formbold-form-input" 
              />
            </div>

            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">Interés (%)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="%"
                {...register('interes', { required: true })} 
                className="formbold-form-input" 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>  
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">Frecuencia de Cobro</label>
              <select {...register('frecuencia_cuotas')} className="formbold-form-input">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>          
            </div>  

            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label className="formbold-form-label">Número de Cuotas</label>
              <input 
                type="number" 
                placeholder="Ej: 30"
                {...register('cuotas', { required: true, min: 1 })} 
                className="formbold-form-input" 
              />
            </div>            
          </div>

          <div className="formbold-mb-3">            
            <label className="formbold-form-label">Cobrador Asignado</label>
            <select 
              {...register('cobrador_asignado', { required: true })} 
              className="formbold-form-input"
              disabled={loadingCobradores}
            >
              <option value="">{loadingCobradores ? 'Cargando...' : 'Seleccione cobrador'}</option>
              {cobradores.map(u => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>            
          </div>

          <div className="formbold-mb-3">
            <label className="formbold-form-label">Total a Pagar (Capital + Interés)</label>
            <input 
              type="text" 
              value={new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPagar)} 
              className="formbold-form-input" 
              readOnly 
              style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.2em', backgroundColor: '#f4fbf7' }} 
            /> 
          </div>

          <div className="formbold-mb-3">
            <label className="formbold-form-label">Fecha de Inicio</label>
            <input 
              type="date" 
              {...register('fecha_inicio', { required: true })} 
              className="formbold-form-input" 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={() => navigate('/clientes')} 
              className="formbold-btn" 
              style={{ backgroundColor: '#e2e8f0', color: '#475569' }}
            >
              Volver
            </button>

            <button 
              type="submit" 
              className="formbold-btn" 
              disabled={!isValid}
              style={{ 
                backgroundColor: isValid ? '#6A64F1' : '#ccc',
                cursor: isValid ? 'pointer' : 'not-allowed'
              }}
            >
              Confirmar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormCredito;