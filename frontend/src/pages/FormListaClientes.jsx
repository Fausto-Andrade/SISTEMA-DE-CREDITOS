import React, { useEffect, useState } from 'react';
import { clientesApi } from '../api/auth'; // Asegúrate de que la ruta sea correcta
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../App.css';

const FormListaCliente = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await clientesApi.getAll();
        setClientes(response.data);
      } catch (error) {
        console.error("Error cargando clientes:", error);
      } finally {
        setLoading(false);
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
        // 1. Limpiar el almacenamiento (ajusta según tu lógica)
        localStorage.removeItem('token'); 
        
        // 2. Redirigir al login
        navigate('/login'); 
      }
    });
  };

  return (
    <div className="table-container">
        <h2>Listado de Clientes Registrados</h2>      
      <div className="table-header-section">
        
      {/* Encabezado con el botón de cerrar sesión */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1px' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '10px 30px', 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            marginRight: '20px',
            cursor: 'pointer' 
          }}
        >
          Cerrar Sesión
        </button>
      </div>
      
      {/* BOTÓN PARA CREAR NUEVO CLIENTE */}
        <button 
          className="btn-add-client" type='button'
          onClick={() => navigate('/form-contac')}
        >
          + Nuevo Cliente
        </button>

      {/* BOTÓN PARA LISTAR LOS CREDITOS */}
        <button 
          className="btn-list-creditos" type='button'
          onClick={() => navigate('/creditos/cobrador')}
        >
          + Listado de Creditos
        </button>

      </div>
      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre / Usuario</th>
              <th>Apellido</th>
              <th>Correo Electrónico</th>
              <th>Celular</th>
              <th>Ciudad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.id}</td>
                  <td>{cliente.name}</td>
                  <td>{cliente.apellido}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.celular}</td>
                  <td>{cliente.ciudad}</td>
                  <td>
                    <button 
                      className="btn-edit" 
                      onClick={() => navigate(`/creditos?clienteId=${cliente.id}`)}
                      >
                      Crear Crédito
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No hay clientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormListaCliente;