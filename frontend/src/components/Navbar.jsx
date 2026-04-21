import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <style>
        {`
          /* Estilos para el botón hamburguesa */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            gap: 5px;
            background: none;
            border: none;
            z-index: 1001;
          }

          .hamburger span {
            width: 25px;
            height: 3px;
            background-color: white;
            border-radius: 2px;
            transition: 0.3s;
          }

          /* Animación de la X */
          .hamburger.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
          .hamburger.open span:nth-child(2) { opacity: 0; }
          .hamburger.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

          @media (max-width: 768px) {
            .hamburger { display: flex; }
            
            .nav-links-container {
              position: fixed;
              top: 70px;
              right: ${isOpen ? '0' : '-100%'};
              width: 70%;
              height: calc(100vh - 70px);
              background-color: #1a1a1a;
              flex-direction: column;
              padding: 40px 20px !important;
              transition: 0.4s;
              box-shadow: -5px 5px 15px rgba(0,0,0,0.5);
            }
          }
        `}
      </style>

      <nav style={styles.nav}>
        {/* Contenedor Izquierdo */}
        <div style={styles.leftContainer}>
          <div style={styles.logo}>
            <img 
              src="/img-logo-navbar-convertido.jpeg"
              alt="Logo MiApp" 
              style={styles.logoImage} 
            /> 
            {role && <span style={styles.roleTag}>({role})</span>}
          </div>

          
        </div>

        {/* Botón Hamburguesa */}
        <button className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Contenedor Derecho / Menú */}
        <ul className="nav-links-container" style={styles.navLinks}>
          {!token ? (
            <>
              <li>
                <Link to="/" style={styles.link} onClick={() => setIsOpen(false)}>Login</Link>
              </li>
              <li>
                <Link to="/signup" style={styles.link} onClick={() => setIsOpen(false)}>Registro</Link>
              </li>
            </>
          ) : (
            <>
              {role === 'admin' && (
                <li>
                  <Link to="/login" style={styles.linkLogo} onClick={() => setIsOpen(false)}>Login </Link>
                </li>            
              )}
              <li>
                <Link to="/signup" style={styles.link} onClick={() => setIsOpen(false)}>Registro</Link>
              </li>
              <li>
                {token && (
                  <button 
                    onClick={() => { navigate('/informes'); setIsOpen(false); }} 
                    style={styles.informeBtn}
                  >
                    Informes
                  </button>
                )}
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
    </>
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

  leftContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },

  logo: { 
    display: 'flex',
    alignItems: 'center',
    fontSize: '22px', 
    fontWeight: 'bold' 
  },

  logoImage: {
    height: '45px',
    borderRadius: '4px'
  },

  linkLogo: { 
    color: 'white', 
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center'
  },

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

  informeBtn: {
    backgroundColor: '#646cff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s'
  },

  roleTag: {
    marginLeft: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'lowercase',
    opacity: '0.8'
  },
};

export default Navbar;