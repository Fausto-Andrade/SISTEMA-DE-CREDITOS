import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.linkLogo}>
            <img 
                src="/img-logo-navbar-convertido.jpeg"
                alt="Logo MiApp" 
                style={styles.logoImage} 
            /> 
        </Link>
        {role && <span style={styles.roleTag}>({role})</span>}
      </div>

      <ul style={styles.navLinks}>
        {/* Si NO hay token, mostramos Login y Registro */}
        {!token ? (
          <>
            <li>
              <Link to="/" style={styles.link}>Login</Link>
            </li>
            <li>
              <Link to="/signup" style={styles.link}>Registro</Link>
            </li>
          </>
        ) : (
          /* Si HAY token, mostramos Dashboard (si es admin) y Cerrar Sesión */
          <>
            {role === 'admin' && (
              <li>
               <Link to="/login" style={styles.linkLogo}>Login </Link>
              </li>            
            )}
            <li>
              <Link to="/signup" style={styles.link}>Registro</Link>
            </li>
            <li>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Cerrar Sesión
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 50px',
    height: '70px',
    backgroundColor: '#1a1a1a',
    color: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    boxSizing: 'border-box',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  logo: { fontSize: '22px', fontWeight: 'bold' },
  linkLogo: { color: 'white', textDecoration: 'none' },
  roleTag: { fontSize: '12px', color: '#646cff', textTransform: 'uppercase' },
  navLinks: { 
    display: 'flex', 
    listStyle: 'none', 
    gap: '30px', 
    margin: 0, 
    padding: 0,
    alignItems: 'center' 
  },
  link: { 
    color: 'white', 
    textDecoration: 'none', 
    fontSize: '16px',
    fontWeight: '500',
    transition: 'color 0.3s'
  },
  logoutBtn: {
    backgroundColor: '#ff4757',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },

  roleTag: {
    marginLeft: '15px',      // <--- Crea la separación que pediste
    color: '#ffffff',        // <--- Color blanco
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'lowercase', // O uppercase si lo prefieres en mayúsculas
    opacity: '0.8'           // Opcional: le da un toque elegante (blanco suave)
  },

};

export default Navbar;