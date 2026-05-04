import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth"; 
import Swal from 'sweetalert2';
import '../App.css';

const FormContac = () => {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "all" });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setNombreUsuario(user.username || "Cobrador");
    }
  }, []);

  const soloLetrasProps = (name) => ({
    ...register(name, { pattern: { value: /^[a-zA-ZÀ-ÿ\s]+$/, message: "Solo letras" } }),
    onKeyDown: (e) => {
      if (!/^[a-zA-ZÀ-ÿ\s]$/.test(e.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)) {
        e.preventDefault();
      }
    }
  });

  const onSubmit = async (data) => {
    try {
      const userLogged = JSON.parse(localStorage.getItem('user'));
      const clienteData = {
        id_cedula: data.cedula,
        name: data.nombre,
        apellido: data.apellido,
        celular: data.celular,
        direccion: data.direccion,
        barrio_cliente: data.barrio_cliente,
        pais: data.pais,
        departamento_cliente: data.departamento_cliente,
        ciudad: data.ciudad,
        barrio_cobro: data.barrio_cobro,
        direccion_cobro: data.direccion_cobro,
        empresa: data.empresa,
        cargo: data.cargo,
        direccion_empresa: data.direccion_empresa,
        ciudad_empresa: data.ciudad_empresa,
        telefono_empresa: data.telefono_empresa,
        nombre_fiador: data.nombre_fiador,
        celular_fiador: data.celular_fiador,
        ciudad_fiador: data.ciudad_fiador,
        direccion_fiador: data.direccion_fiador,
        barrio_fiador: data.barrio_fiador,
        notas: data.notas,
        id_cobrador: userLogged?.id,
        id_comprador: userLogged?.id_comprador || userLogged?.id
      };

      await authApi.registrarCliente(clienteData); 
      Swal.fire('¡Éxito!', 'Cliente registrado correctamente.', 'success').then(() => {
        reset();
        navigate('/clientes');
      });
    } catch (error) {
      Swal.fire('Error', 'No se pudo registrar cliente.', 'error');
    }
  };

  return (
    <div className="formbold-main-wrapper" style={{ padding: '10px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="formbold-form-wrapper" style={{ maxWidth: '1100px', width: '100%', padding: '20px' }}>  
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <div 
            className="formbold-form-title" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid #e0e7ff',
              paddingBottom: '5px'
            }}
          >
            <h2 style={{ color: '#6A64F1', margin: 0, fontSize: '24px' }}>
              Registrar Cliente
            </h2>
            
            <p style={{ margin: 0, fontSize: '24px', color: '#535353' }}>
              Creado por: <strong style={{ color: '#6A64F1' }}>{nombreUsuario}</strong>
            </p>
          </div>

          {/* CONTENEDOR GRID DE DOS COLUMNAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* COLUMNA IZQUIERDA */}
            <div>
              <div className="form-section-divider">
                <legend style={{ color: '#6A64F1', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Información Personal</legend>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input type="number" {...register('cedula', { required: true })} placeholder="Cédula" className="formbold-form-input" />
                  <input {...soloLetrasProps('nombre', { required: true })} placeholder="Nombre" className="formbold-form-input" />
                </div>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...soloLetrasProps('apellido', { required: true })} placeholder="Apellido" className="formbold-form-input" />
                  <input type="number" {...register('celular', { required: true })} placeholder="Celular" className="formbold-form-input" />
                </div>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...register('direccion', { required: true })} placeholder="Dirección Residencia" className="formbold-form-input" />
                  <input {...register('barrio_cliente', { required: true })} placeholder="Barrio Residencia" className="formbold-form-input" />
                </div>
              </div>

              <div className="form-section-divider" style={{ marginTop: '15px' }}>
                <legend style={{ color: '#6A64F1', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Información de Cobro</legend>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...soloLetrasProps('pais')} placeholder="País" className="formbold-form-input" />
                  <input {...soloLetrasProps('departamento_cliente')} placeholder="Departamento" className="formbold-form-input" />
                </div>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...soloLetrasProps('ciudad', { required: true })} placeholder="Ciudad de Cobro" className="formbold-form-input" />
                  <input {...register('barrio_cobro', { required: true })} placeholder="Barrio Cobro" className="formbold-form-input" />
                </div>
                <input {...register('direccion_cobro', { required: true })} placeholder="Dirección Cobro" className="formbold-form-input" style={{ width: '100%' }} />
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div>
              <div className="form-section-divider">
                <legend style={{ color: '#6A64F1', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Datos Laborales</legend>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...register('empresa')} placeholder="Empresa" className="formbold-form-input" />
                  <input {...register('cargo')} placeholder="Cargo" className="formbold-form-input" />
                </div>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...register('direccion_empresa')} placeholder="Dirección Empresa" className="formbold-form-input" style={{ width: '100%' }} />
                </div>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input {...soloLetrasProps('ciudad_empresa')} placeholder="Ciudad Empresa" className="formbold-form-input" />
                  <input type="number" {...register('telefono_empresa')} placeholder="Teléfono Empresa" className="formbold-form-input" />
                </div>
              </div>

              <div className="form-section-divider" style={{ marginTop: '15px' }}>
                <legend style={{ color: '#6A64F1', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Datos del Fiador</legend>
                <input {...soloLetrasProps('nombre_fiador')} placeholder="Nombre Fiador" className="formbold-form-input" style={{ width: '100%', marginBottom: '10px' }}/>
                <div className="formbold-input-flex" style={{ marginBottom: '10px' }}>
                  <input type="number" {...register('celular_fiador')} placeholder="Celular Fiador" className="formbold-form-input" />
                  <input {...soloLetrasProps('ciudad_fiador')} placeholder="Ciudad Fiador" className="formbold-form-input" />
                </div>
                <div className="formbold-input-flex">
                  <input {...register('direccion_fiador')} placeholder="Dirección Fiador" className="formbold-form-input" />
                  <input {...soloLetrasProps('barrio_fiador')} placeholder="Barrio Fiador" className="formbold-form-input" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <textarea {...register('notas')} placeholder="Notas adicionales" className="formbold-form-input" style={{ minHeight: '60px', resize: 'none' }}></textarea>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="formbold-btn" 
              style={{ backgroundColor: '#51d67f', flex: 2, padding: '12px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Registrar Cliente 
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/cobradores')} 
              className="formbold-btn" 
              style={{ backgroundColor: '#6A64F1', color: '#f3f4f6', flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #030303', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormContac;