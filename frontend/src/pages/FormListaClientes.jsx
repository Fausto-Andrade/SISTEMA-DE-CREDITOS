import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from "../api/auth";
import '../App.css';

const FormListaCliente = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 4;

  // Efecto para cargar los clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/creditos/clientes');
        setClientes(response.data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, [navigate]);

  // Reiniciar paginación al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  const verificarYRedirigir = (cliente) => {
    const clienteId = String(cliente.id_cedula).trim();
    const totalActivos = parseInt(cliente.creditos_activos, 10) || 0;

    if (totalActivos > 0) {
      Swal.fire({
        title: '¡Cliente con deuda!',
        text: `El cliente tiene ${totalActivos} crédito(s) activo(s). ¿Deseas crear uno nuevo de todas formas?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f39c12', 
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, crear nuevo',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/crear-credito?clienteId=${clienteId}`);
        }
      });
    } else {
      navigate(`/crear-credito?clienteId=${clienteId}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
    navigate('/');
  };

  // Filtrado de datos
  const datosFiltrados = clientes.filter(item => {
    const termino = busqueda.toLowerCase();
    return (
      item.id_cedula?.toString().includes(termino) || 
      item.name?.toLowerCase().includes(termino) || 
      item.apellido?.toLowerCase().includes(termino)
    );
  });

  // Paginación
  const ultimoRegistro = currentPage * registrosPorPagina;
  const primerRegistro = ultimoRegistro - registrosPorPagina;
  const registrosActuales = datosFiltrados.slice(primerRegistro, ultimoRegistro);
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  const cambiarPagina = (numeroPagina) => setCurrentPage(numeroPagina);

  if (loading) return <div className="loading-container"><p>Cargando clientes...</p></div>;

  return (
    <div className="table-container">
      <h2>Listado de Clientes Registrados</h2>
      <br />
      <div className="table-header-section">        
        <button className="btn-add-client" onClick={() => navigate('/form-contac')}>Nuevo Cliente</button>
        <button className="btn-list-creditos" onClick={() => navigate('/listado-cobros')}>Ver Créditos</button>
        <button 
          onClick={handleLogout} 
          // className="btn-logout" 
          style={{ backgroundColor: '#e74c3c', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </div>
      
      <div style={{ marginBottom: '20px', width: '100%' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por cédula, nombre..."
          className="formbold-form-input"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ paddingLeft: '10px', borderRadius: '25px', border: '1px solid #ddd', width: '100%', height: '45px',}}
        />
      </div>

      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>FECHA CREACIÓN</th>
              <th>TOTAL CRÉDITOS</th>
              <th>CRÉDITOS ABIERTOS</th>
              <th>CÉDULA</th>
              <th>NOMBRE</th>
              <th>APELLIDO</th>
              <th>DOCUMENTOS</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {registrosActuales.map(cliente => {
              const totalActivos = parseInt(cliente.creditos_activos, 10) || 0;
              const tieneDocumentos = cliente.tiene_documentos === true;

              return (
                <tr key={cliente.id_cedula}>
                  <td data-label="FECHA CREACIÓN">
                    {cliente.fecha_creacion ? new Date(cliente.fecha_creacion).toLocaleDateString() : "-"}
                  </td>
                  <td data-label="TOTAL CRÉDITOS" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {cliente.cant_creditos || 0}
                  </td>
                  <td data-label="CRÉDITOS ABIERTOS" style={{ textAlign: 'center', fontWeight: 'bold', color: totalActivos > 0 ? '#e74c3c' : 'inherit' }}>
                    {totalActivos}
                  </td>
                  <td data-label="CÉDULA">{cliente.id_cedula}</td>
                  <td data-label="NOMBRE">{cliente.name}</td>
                  <td data-label="APELLIDO">{cliente.apellido}</td>
                  <td data-label="DOCUMENTOS">
                    {tieneDocumentos ? (
                      <span style={{ backgroundColor: '#2ecc71', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        CARGADOS
                      </span>
                    ) : (
                      <span 
                        onClick={() => navigate(`/cargar-doc?cedula=${cliente.id_cedula}`)}
                        title="Haga clic para cargar documentos"
                        style={{ backgroundColor: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}
                      >
                        PENDIENTE
                      </span>
                    )}
                  </td>
                  <td data-label="ACCIONES">
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button 
                        className="btn-edit" 
                        onClick={() => verificarYRedirigir(cliente)}
                        style={{ backgroundColor: totalActivos > 0 ? '#f39c12' : '#3498db', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        {totalActivos > 0 ? 'Nuevo Crédito' : 'Crear Crédito'}
                      </button>
                      <button 
                        onClick={() => navigate(`/cliente/detalle/${cliente.id_cedula}`)}
                        style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px', paddingBottom: '20px' }}>
            <button 
              onClick={() => cambiarPagina(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white' }}
            >
              Anterior
            </button>
            
            {[...Array(totalPaginas)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => cambiarPagina(index + 1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  backgroundColor: currentPage === index + 1 ? '#6a64f1' : 'white',
                  color: currentPage === index + 1 ? 'white' : 'black',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {index + 1}
              </button>
            ))}

            <button 
              onClick={() => cambiarPagina(currentPage + 1)} 
              disabled={currentPage === totalPaginas}
              style={{ padding: '8px 12px', cursor: currentPage === totalPaginas ? 'not-allowed' : 'pointer', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: currentPage === totalPaginas ? '#f5f5f5' : 'white' }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormListaCliente;