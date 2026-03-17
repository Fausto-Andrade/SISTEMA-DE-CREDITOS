import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../api/auth";
import Swal from 'sweetalert2';
import '../App.css';

const FormContac = () => {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm({ mode: "all" });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setNombreUsuario(JSON.parse(userData).nombre || "Cobrador");
  }, []);

  // Función reutilizable para validar solo letras
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
    
    // Crea el objeto exacto que el servidor espera
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
      id_cobrador: userLogged?.id
    };

    await api.post('/clientes', clienteData);
    Swal.fire('¡Éxito!', 'Cliente registrado.', 'success').then(() => {
      reset();
      navigate('/clientes');
    });
  } catch (error) {
    console.error("Error detallado:", error.response?.data);
    Swal.fire('Error', 'No se pudo registrar. Verifica los campos.', 'error');
  }
};

  const isFormReady = isValid && watch("terminos");

  return (
    <div className="formbold-main-wrapper">
      <div className="formbold-form-wrapper">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="formbold-form-title">
            <h2 style={{ color: '#6A64F1' }}>Registrar Cliente</h2>
            <p>Creado por: <strong style={{ color: '#6A64F1' }}>{nombreUsuario}</strong></p>
          </div>

          <legend style={{ color: '#6A64F1', fontWeight: 'bold' }}>Información Personal</legend>
            <div className="formbold-input-flex">
              <input type="number" {...register('cedula', { required: true })} placeholder="Cédula" className="formbold-form-input" />
              <input {...soloLetrasProps('nombre')} placeholder="Nombre" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
              <input {...soloLetrasProps('apellido')} placeholder="Apellido" className="formbold-form-input" />
              <input type="number" {...register('celular', { required: true })} placeholder="Celular" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
              <input {...register('direccion')} placeholder="Dirección Residencia" className="formbold-form-input" />
              <input {...register('barrio_cobro')} placeholder="Barrio Cliente" className="formbold-form-input" />
            </div>



            <legend style={{ color: '#6A64F1', fontWeight: 'bold' }}>Información de Cobro</legend>            
            <div className="formbold-input-flex">
              <input {...soloLetrasProps('pais')} placeholder="País" className="formbold-form-input" />
              <input {...soloLetrasProps('departamento_cliente')} placeholder="Departamento" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
              <input {...soloLetrasProps('ciudad')} placeholder="Ciudad" className="formbold-form-input" />
              <input {...register('barrio_cobro')} placeholder="Barrio Cobro" className="formbold-form-input" />
              
            </div>
            <div className="formbold-input-flex">
              <input {...register('direccion_cobro')} placeholder="Dirección Cobro" className="formbold-form-input" />
            </div>


          

          <legend style={{ color: '#6A64F1', fontWeight: 'bold' }}>Datos Laborales</legend>
            <div className="formbold-input-flex">
              <input {...register('empresa')} placeholder="Empresa" className="formbold-form-input" />
              <input {...register('cargo')} placeholder="Cargo" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
            <input {...register('direccion_empresa')} placeholder="Dirección Empresa" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
              <input {...soloLetrasProps('ciudad_empresa')} placeholder="Ciudad Empresa" className="formbold-form-input" />
              <input type="number" {...register('telefono_empresa')} placeholder="Teléfono Empresa" className="formbold-form-input" />
            </div>
          

          <legend style={{ color: '#6A64F1', fontWeight: 'bold' }}>Datos del Fiador</legend>
            <div className="formbold-input-flex">
              <input {...soloLetrasProps('nombre_fiador')} placeholder="Nombre Fiador" className="formbold-form-input"/>
            </div>
            <div className="formbold-input-flex">
              <input type="number" {...register('celular_fiador')} placeholder="Celular Fiador" className="formbold-form-input" />
              <input {...soloLetrasProps('ciudad_fiador')} placeholder="Ciudad Fiador" className="formbold-form-input" />
            </div>
            <div className="formbold-input-flex">
              <input {...register('direccion_fiador')} placeholder="Dirección Fiador" className="formbold-form-input" />
              <input {...soloLetrasProps('barrio_fiador')} placeholder="Barrio Fiador" className="formbold-form-input" />
            </div>

          <textarea {...register('notas')} placeholder="Notas adicionales" className="formbold-form-input"></textarea>

          <label style={{ color: '#6A64F1', fontWeight: 'bold' }}>
            <input type="checkbox" {...register('terminos', { required: true })} /> Acepto términos
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <button type="submit" className="formbold-btn" disabled={!isFormReady} style={{ backgroundColor: isFormReady ? '#6A64F1' : '#ccc' }}>Registrar</button>
            <button type="button" onClick={() => navigate('/clientes')} className="formbold-btn" style={{ backgroundColor: '#6a64f1' }}>Volver</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormContac;