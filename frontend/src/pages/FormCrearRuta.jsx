import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { compradoresApi, authApi, rutasApi } from '../api/auth'; 
import { FaMapMarkedAlt, FaCalendarAlt, FaCalendarPlus, FaBuilding } from 'react-icons/fa';
import '../App.css';

const FormCrearRuta = ({ onRutaCreada, empresas: empresasProp }) => {
  const [cobradores, setCobradores] = useState([]);
  const [empresas, setEmpresas] = useState(empresasProp || []); 
  const [rutasExistentes, setRutasExistentes] = useState([]); 
  const [errorServer, setErrorServer] = useState('');
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isValid } 
  } = useForm({
    mode: "onChange",
    defaultValues: {
      nombre_ruta: "", 
      fecha: new Date().toISOString().split('T')[0],
      id_user: "", 
      id_comprador: ""      
    }
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const solicitudes = [
          axios.get('http://localhost:5000/api/auth/usuarios-registrados', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          rutasApi.getAll()
        ];

        if (!empresasProp || empresasProp.length === 0) {
          solicitudes.push(compradoresApi.getAll());
        }

        const resultados = await Promise.all(solicitudes);
        
        setCobradores(resultados[0].data.filter(u => u.role === 'cobrador' || u.role === 'admin'));
        setRutasExistentes(resultados[1].data || []);
        
        if (resultados[2]) {
          setEmpresas(resultados[2].data);
        }
      } catch (error) {
        console.error("Error al cargar datos en FormRuta:", error);
      }
    };
    cargarDatos();
  }, [empresasProp]);

  const onSubmit = async (data) => {
    try {
      setErrorServer('');
      
      const nombreNuevo = data.nombre_ruta.trim().toUpperCase();
      const idEmpresaSel = parseInt(data.id_comprador, 10);

      if (!idEmpresaSel) {
        return Swal.fire('Error', 'Debes seleccionar una empresa para la ruta', 'error');
      }

      const existeRuta = rutasExistentes.some(ruta => 
        ruta.nombre_ruta.trim().toUpperCase() === nombreNuevo && 
        parseInt(ruta.id_comprador, 10) === idEmpresaSel
      );

      if (existeRuta) {
        return Swal.fire({
          icon: 'error',
          title: 'Ruta Duplicada',
          text: `La empresa seleccionada ya tiene una ruta registrada con el nombre "${nombreNuevo}".`,
          confirmButtonColor: '#6a64f1'
        });
      }

      const payload = {
        nombre_ruta: nombreNuevo,
        fecha: data.fecha,
        id_comprador: idEmpresaSel,
        id_user: data.id_user ? parseInt(data.id_user, 10) : null 
      };

      console.log("Enviando payload:", payload);

      // LLAMADA CORREGIDA A LA API
      // Se utiliza rutasApi.create que es la función correspondiente para esta entidad
      await rutasApi.create(payload);
      
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Ruta creada y vinculada correctamente',
        confirmButtonColor: '#6a64f1'
      });

      reset();
      if (onRutaCreada) onRutaCreada(); 
      if (!onRutaCreada) navigate('/admin-dashboard');
      
    } catch (error) {
      console.error("Error detallado:", error);
      
      let msg = "Error de conexión con el servidor";
      
      if (error.response) {
        msg = error.response.data?.mensaje || error.response.data?.error || `Error ${error.response.status}`;
      } else if (error.request) {
        msg = "El servidor no responde. Verifica tu conexión.";
      }

      setErrorServer(msg);
      Swal.fire('Error al crear', msg, 'error');
    }
  };

  return (
    <div className="formbold-main-wrapper" style={{ maxWidth: '450px', margin: '20px auto' }}>
      <div className="formbold-form-wrapper">
        <h2 className="login-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarPlus style={{ color: '#6A64F1' }} /> Configurar Ruta
        </h2>
        
        {errorServer && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', border: '1px solid #ef9a9a' }}>
            {errorServer}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="input-group" style={{ position: 'relative' }}>
            <FaMapMarkedAlt style={styles.icon} />
            <input
              type="text"
              placeholder="Nombre de la Ruta (Ej: RUTA NORTE)"
              className="form-input"
              style={styles.inputWithIcon}
              {...register('nombre_ruta', { required: true, minLength: 3 })}
            />
          </div>

          <div className="input-group" style={{ position: 'relative', marginTop: '15px' }}>
            <FaBuilding style={styles.icon} />
            <select 
              className="form-input" 
              style={styles.inputWithIcon} 
              {...register('id_comprador', { required: "Seleccione una empresa" })}
            >
              <option value="">-- Vincular a Empresa --</option>
              {empresas.map(e => (
                <option key={e.id_comprador} value={e.id_comprador}>
                  {e.nombre_empresa}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ position: 'relative', marginTop: '15px' }}>
            <FaCalendarAlt style={styles.icon} />
            <input 
              type="date" 
              className="form-input" 
              style={styles.inputWithIcon} 
              {...register('fecha', { required: true })} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="register-button" 
              disabled={!isValid} 
              style={{ 
                backgroundColor: isValid ? '#6A64F1' : '#ccc', 
                color: 'white', 
                fontWeight: 'bold', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: isValid ? 'pointer' : 'not-allowed' 
              }}
            >
              Crear Ruta
            </button>
            <button 
              type="button" 
              onClick={() => onRutaCreada ? onRutaCreada() : navigate('/admin-dashboard')} 
              style={{ 
                backgroundColor: '#f1f2f6', 
                color: '#2f3542', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: 'bold' 
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  icon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6A64F1', fontSize: '18px', zIndex: 2 },
  inputWithIcon: { paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }
};

export default FormCrearRuta;