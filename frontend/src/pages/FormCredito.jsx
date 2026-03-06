import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/auth';

const FormCredito = () => {
  const [clientes, setClientes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [proximoNumero, setProximoNumero] = useState(null);
  const [totalPagar, setTotalPagar] = useState(0);

  // 1. Extraemos 'isValid' de formState
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch, 
    formState: { errors, isValid } 
  } = useForm({
    mode: "onChange" // "onChange" es vital para que valide mientras el usuario escribe
  });

  const clienteSeleccionado = watch("cliente_id");
  const monto = watch("monto");
  const cuotas = watch("cuotas");
  const interes = watch("interes");
  const fecha = watch("fecha_inicio");

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const response = await api.get('/clientes');
        setClientes(response.data);
      } catch (error) {
        console.error("Error al obtener clientes", error);
      }
    };
    obtenerClientes();
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      const consultarConsecutivo = async () => {
        try {
          const response = await api.get(`/creditos/conteo/${clienteSeleccionado}`);
          setProximoNumero(parseInt(response.data.count) + 1);
        } catch (error) {
          setProximoNumero(null);
        }
      };
      consultarConsecutivo();
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    const m = parseFloat(monto) || 0;
    const i = parseFloat(interes) || 0;
    if (m > 0) {
      const total = m + (m * (i / 100)); 
      setTotalPagar(total.toFixed(2));
    } else {
      setTotalPagar(0);
    }
  }, [monto, interes]);

  const onSubmit = async (data) => {
    try {
      const dataFinal = { ...data, total_pagar: totalPagar };
      const response = await api.post('/creditos', dataFinal); 
      if (response.status === 201) {
        alert(`Crédito registrado con éxito`);
        reset();
        setTotalPagar(0);
      }
    } catch (error) {
      setMensaje("Error al registrar el crédito");
    }
  };

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="formbold-form-title">
            <h2>Solicitud de Crédito</h2>
            <p>Llene todos los campos para habilitar el botón.</p>
          </div>

          <div className="formbold-mb-3">
            <label className="formbold-form-label">Cliente</label>
            <select className="formbold-form-input" {...register('cliente_id', { required: true })}>
              <option value="">Seleccione...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.apellido}</option>
              ))}
            </select>
            {proximoNumero && <p style={{color: '#6A64F1', fontSize: '13px'}}>Crédito N° {proximoNumero}</p>}
          </div>

          <div className="formbold-input-flex">
            <div>
              <label className="formbold-form-label">Monto Capital ($)</label>
              <input type="number" className="formbold-form-input" {...register('monto', { required: true, min: 1 })} />
            </div>
            <div>
              <label className="formbold-form-label">Cuotas</label>
              <input type="number" className="formbold-form-input" {...register('cuotas', { required: true, min: 1 })} />
            </div>
          </div>

          <div className="formbold-input-flex">
            <div>
              <label className="formbold-form-label">Tasa de Interés (%)</label>
              <input type="number" step="0.1" className="formbold-form-input" {...register('interes', { required: true })} />
            </div>
            <div>
              <label className="formbold-form-label">Fecha Inicio</label>
              <input type="date" className="formbold-form-input" {...register('fecha_inicio', { required: true })} />
            </div>
          </div>

          <div className="formbold-mb-3">
            <label className="formbold-form-label">Total a Pagar</label>
            <input 
              type="text" 
              className="formbold-form-input" 
              value={`$ ${totalPagar}`} 
              readOnly 
              style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold' }}
            />
          </div>

          {/* BOTÓN CON PROPIEDAD DISABLED */}
          <button 
            type="submit" 
            className="formbold-btn"
            disabled={!isValid} // Se deshabilita si isValid es false
            style={{
                backgroundColor: !isValid ? '#ccc' : '#6A64F1',
                cursor: !isValid ? 'not-allowed' : 'pointer',
                opacity: !isValid ? 0.7 : 1
            }}
          >
            Generar Crédito
          </button>
          
          {!isValid && <p style={{color: '#6A64F1', fontSize: '12px', marginTop: '10px'}}>* Complete todos los campos para continuar</p>}
          {mensaje && <p>{mensaje}</p>}
        </form>
      </div>
    </div>
  );
};

export default FormCredito;