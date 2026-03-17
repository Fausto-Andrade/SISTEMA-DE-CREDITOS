import React, { useEffect, useState } from 'react';
import { clientesApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from "../api/auth";
import '../App.css';

const FormListaCliente = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
  const fetchClientes = async () => {
    try {
      setLoading(true); // Suponiendo que tienes un estado de loading
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Error capturado:", error);
      // ¡IMPORTANTE! Si ocurre un error, debes detener el loading
      setLoading(false); 
      
      if (error.response?.status === 403) {
        Swal.fire('Acceso denegado', 'Tu sesión expiró o no tienes permisos.', 'error');
      }
    } finally {
      setLoading(false); // Esto asegura que el mensaje "Cargando" desaparezca siempre
    }
  };

  fetchClientes();
}, []);

  if (loading) return <div className="loading-container"><p>Cargando clientes...</p></div>;

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Se cerrará tu sesión actual",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        navigate('/login');
      }
    });
  };

  const datosFiltrados = clientes.filter(item => {
  const termino = busqueda.toLowerCase();
  
  // Ajusta estos campos según los nombres de tu base de datos
  return (
    item.id_cedula?.toString().includes(termino) || 
    item.name?.toLowerCase().includes(termino) || 
    item.apellido?.toLowerCase().includes(termino)
  );
});

  return (
    <div className="table-container">
      <h2>Listado de Clientes Registrados</h2>
      <div className="table-header-section">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleLogout} className="btn-logout" style={{ padding: '10px 30px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '20px' }}>
            Cerrar Sesión
          </button>
        </div>
        
        <button className="btn-add-client" type='button' onClick={() => navigate('/form-contac')}>
          + Nuevo Cliente
        </button>

        <button className="btn-list-creditos" type='button' onClick={() => navigate('/creditos/cobrador')}>
          + Listado de Creditos
        </button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por cédula, nombre o número de crédito..."
          className="formbold-form-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            paddingLeft: '40px',
            borderRadius: '25px',
            border: '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>FECHA DE CREACIÓN</th>
              <th>Nº DE CRÉDITOS</th>
              <th>CÉDULA</th>
              <th>NOMBRE</th>
              <th>APELLIDO</th>
              <th>CELULAR</th>
              <th>CIUDAD</th>
              <th>COBRADOR</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.length > 0 ? (
              datosFiltrados.map(cliente => {
                // Lógica de validación
                const numeroDeCreditos = Number(cliente.cant_creditos) || 0;
                const estaDeshabilitado = numeroDeCreditos > 0;

                return (
                  <tr key={cliente.id_cedula}>
                    <td>{cliente.fecha_creacion ? new Date(cliente.fecha_creacion).toLocaleDateString() : "Sin fecha"}</td>
                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {numeroDeCreditos}</td>
                    {/* <td>{cliente.numeroDeCreditos}</td> */}
                    <td>{cliente.id_cedula}</td>
                    <td>{cliente.name}</td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.celular}</td>
                    <td>{cliente.ciudad}</td>
                    <td>{cliente.nombre_cobrador || 'Sin asignar'}</td>
                    <td>
                      <button 
                        className="btn-edit" 
                        disabled={estaDeshabilitado}
                        onClick={() => navigate(`/crear-credito?clienteId=${cliente.id_cedula}`)}
                        style={{
                          backgroundColor: estaDeshabilitado ? '#bdc3c7' : '#3498db',
                          color: estaDeshabilitado ? '#7f8c8d' : 'white',
                          cursor: estaDeshabilitado ? 'not-allowed' : 'pointer',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          opacity: estaDeshabilitado ? 0.7 : 1
                        }}
                      >
                        {estaDeshabilitado ? 'Con Crédito' : 'Crear Crédito'}
                      </button>

                      <button 
                        className="btn-view"                         
                        onClick={() => 
                        { console.log("Navegando al cliente:", cliente.id_cedula);
                          navigate(`/cliente/detalle/${cliente.id_cedula}`)}}
                        style={{ marginRight: '8px', backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', marginLeft: '20px' }}
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>No hay clientes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormListaCliente;