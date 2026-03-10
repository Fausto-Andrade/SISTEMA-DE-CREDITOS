import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import Swal from 'sweetalert2';
import '../App.css';

const AdminDashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await api.get('/usuarios-registrados');
        setUsuarios(response.data);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    obtenerUsuarios();
  }, []);

  const eliminarUsuario = async (id, username) => {
    Swal.fire({
      title: `¿Eliminar a ${username}?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#bdc3c7',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/usuarios/${id}`);
          // Actualizamos la lista local filtrando el usuario borrado
          setUsuarios(usuarios.filter(user => user.id !== id));
          Swal.fire('Eliminado', 'El cobrador ha sido removido.', 'success');
        } catch (error) {
          Swal.fire('Error', error.response?.data?.mensaje || 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  if (loading) return <div className="loader">Cargando datos...</div>;

  return (
    <>
      <Navbar />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        paddingTop: '100px', 
        minHeight: '100vh',
        backgroundColor: '#f4f7fe'
      }}>

        <div style={{ 
          minHeight: '100vh', 
          width: '100%',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',    
          padding: '40px 0' 
        }}>
    
          <div style={{ 
            display: '-ms-flexbox',
            justifyContent: 'center',
            alignItems: 'center',
            width: '90%', 
            maxWidth: '1000px', 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.30)', 
            padding: '25px',
            margin: '0 auto'
          }}>
            
            <header style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>Listado de Cobradores</h2>
        
              <div style={{ textAlign: 'right' }}>
                <button 
                  onClick={() => navigate('/crear-ruta')}
                  className="register-button" 
                  style={{ 
                    width: 'auto', 
                    padding: '10px 25px', 
                    color: 'white', 
                    backgroundColor: '#633ef1',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  + Crear Ruta
                </button>
              </div>
            </header>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                margin: '0 auto'
              }}>
                <thead>
                  <tr style={{ backgroundColor:'#633ef1', color: 'white' }}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Usuario</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Rol</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{user.username}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: user.role === 'admin' ? '#f8d7da' : '#d4edda',
                          color: user.role === 'admin' ? '#721c24' : '#155724'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => eliminarUsuario(user.id, user.username)}
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  th: { padding: '15px', textAlign: 'center', borderBottom: '2px solid #e3e6f0' },
  td: { padding: '12px', textAlign: 'center', color: '#4e5154' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }
};

export default AdminDashboard;