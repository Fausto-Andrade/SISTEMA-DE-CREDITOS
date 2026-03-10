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

  const [clientes, setClientes] = useState([]);

  const { register, handleSubmit, watch, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: { cliente_id: idDesdeUrl || "" }
  });

  // Cargar Clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const resClientes = await api.get('/clientes');
        setClientes(resClientes.data);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }
    };
    fetchClientes();
  }, []);

  const monto = watch("monto") || 0;
  const interes = watch("interes") || 0;
  const totalPagar = parseFloat(monto) + (parseFloat(monto) * (parseFloat(interes) / 100));

  const guardarCredito = async (data) => {
  try {
    const token = localStorage.getItem('token');
    // Ya no enviamos numero_credito_cliente, la BD lo hace sola
    const dataFinal = { 
      ...data, 
      cliente_id: parseInt(idDesdeUrl || data.cliente_id),
      total_pagar: totalPagar 
    };

    const response = await api.post('/creditos', dataFinal, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    Swal.fire('¡Éxito!', `Crédito N° ${response.data.numero_credito_cliente} registrado`, 'success');
    navigate('/creditos/cobrador');
  } catch (error) {
    Swal.fire('Error', 'No se pudo registrar el crédito', 'error');
  }
};

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <form onSubmit={handleSubmit(guardarCredito)} autoComplete="off">
          
          {/* Cliente */}
          <div className="formbold-mb-3">
            <label>Cliente</label>
            {idDesdeUrl ? (
              <div className="formbold-form-input" style={{ backgroundColor: '#f0f0f0' }}>
                {clientes.find(c => c.id == idDesdeUrl)?.name || "Cargando..."}
              </div>
            ) : (
              <select className="formbold-form-input" {...register('cliente_id', { required: true })}>
                <option value="">Seleccione un cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.name} {c.apellido}</option>)}
              </select>
            )}
          </div>

          {/* Fila: N° Crédito (Previsualización) y Monto */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label>N° Crédito</label>
              <input 
                type="text" 
                value="Se generará automáticamente"
                className="formbold-form-input" 
                readOnly 
                style={{ backgroundColor: '#f0f0f0', color: '#999', fontWeight: 'bold' }} 
              />
            </div>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label>Monto</label>
              <input 
                type="number" 
                step="0.01" 
                {...register('monto', { required: true })} 
                className="formbold-form-input" 
              />
            </div>
          </div>

          {/* Fila: Cuotas e Interés */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label>Cuotas</label>
              <input type="number" {...register('cuotas', { required: true })} className="formbold-form-input" />
            </div>
            <div className="formbold-mb-3" style={{ flex: 1 }}>
              <label>Interés (%)</label>
              <input type="number" step="0.1" {...register('interes', { required: true })} className="formbold-form-input" />
            </div>
          </div>

          <div className="formbold-mb-3">
            <label>Total a Pagar:</label>
            <input 
              type="text" 
              value={new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalPagar)} 
              className="formbold-form-input" 
              readOnly 
              style={{ color: '#2ecc71', fontWeight: 'bold' }} 
            />
          </div>

          <div className="formbold-mb-3">
            <label>Fecha de Inicio</label>
            <input type="date" {...register('fecha_inicio', { required: true })} className="formbold-form-input" />
          </div>

          <button type="submit" className="formbold-btn" disabled={!isValid}>Confirmar Crédito</button>
        </form>
      </div>
    </div>
  );
};

export default FormCredito;