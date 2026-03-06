import Navbar from '../components/Navbar.jsx';
import React, { useEffect, useState } from 'react';
import api from '../api/auth';
import '../App.css';

const AdminDashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="loader">Cargando datos...</div>;

return (  
  
  <>
      <Navbar />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        paddingTop: '100px', // Espacio para que el Navbar no tape la tabla
        minHeight: '100vh',
        backgroundColor: '#f4f7fe'
      }}>

  {/* 1. Fondo de toda la página */}
  <div style={{ 
    // backgroundColor: '#f0f2f5', 
    minHeight: '100vh', 
    width: '100%',
    display: 'flex', 
    justifyContent: 'center', // Centrado horizontal
    alignItems: 'center',     // Centrado vertical
    padding: '40px 0' 
  }}>
    
    {/* 2. El "Card" o caja que contiene la tabla */}
    <div style={{ 
      display: '-ms-flexbox',
      justifyContent: 'center',
      alignItems: 'center',
      width: '90%',               // Ocupa casi todo el ancho en móviles
      maxWidth: '1000px',         // No se estira más de esto en PC
      backgroundColor: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 8px 30px rgba(0,0,0,0.30)', 
      padding: '25px',
      margin: '0 auto'            // Refuerzo de centrado horizontal
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
        
      </header>

      {/* 3. Contenedor de la tabla con scroll para móviles */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          margin: '0 auto' // Centra la tabla dentro de su div
        }}>
          <thead>
            <tr style={{ backgroundColor: '#4e73df', color: 'white' }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Usuario</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Rol</th>
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
// Estilos rápidos para limpiar el JSX
const styles = {
  th: { padding: '15px', textAlign: 'center', borderBottom: '2px solid #e3e6f0' },
  td: { padding: '12px', textAlign: 'center', color: '#4e5154' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }
};

export default AdminDashboard;