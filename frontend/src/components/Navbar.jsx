import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; 
import { authApi } from "../api/auth";
import Swal from 'sweetalert2';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState(''); 
  
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const storedUsername = localStorage.getItem('username');
  const userId = localStorage.getItem('userId');

  const tienePermisosEspeciales = role === 'super_admin' || role === 'admin';
  const esSuperAdmin = role === 'super_admin';
  const esAdmin = role === 'admin'; // Definimos el rol admin específicamente

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (esSuperAdmin) {
        console.log("Modo Super Admin: Omitiendo búsqueda de empresa.");
        return;
      }

      if (userId && token) {
        try {
          const res = await authApi.obtenerPerfilUsuario(userId);
          if (res.data && res.data.nombre_empresa) {
            setNombreEmpresa(res.data.nombre_empresa);
          }
        } catch (error) {
          console.warn("Información de empresa no disponible para este perfil.");
        }
      }
    };
    fetchEmpresa();
  }, [userId, token, esSuperAdmin]);

  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleBackup = async () => {
    try {
      setIsExporting(true);
      const response = await authApi.obtenerClientesCompleto();
      const data = response.data;

      if (!data || data.length === 0) {
        Swal.fire('Atención', 'No hay datos disponibles para exportar', 'warning');
        return;
      }

      const dataToExport = data.map(item => ({
        'FECHA REGISTRO': item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'N/A',
        'NÚMERO CRÉDITO': item.numero_credito_cliente || 'N/A',
        'CÉDULA': item.id_cedula,
        'NOMBRE': item.name,
        'APELLIDO': item.apellido,
        'MONTO PRÉSTAMO': item.monto || 0,
        'TOTAL A PAGAR': item.total_pagar || 0,
        'COBRADOR': item.cobrador_asignado || 'N/A',
        'ESTADO': item.estado || 'SIN CRÉDITO'
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Backup_Creditos");

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Backup_Sistema_${fecha}.xlsx`);

      Swal.fire('Éxito', 'Copia de seguridad generada correctamente', 'success');
    } catch (error) {
      console.error("Error en backup:", error);
      Swal.fire('Error', 'No se pudo generar el backup', 'error');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <style>
        {`
          .hamburger { display: none; flex-direction: column; cursor: pointer; gap: 5px; background: none; border: none; z-index: 1001; }
          .hamburger span { width: 25px; height: 3px; background-color: white; border-radius: 2px; transition: 0.3s; }
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
        <div style={styles.leftContainer}>
          <div 
            style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}
            onClick={() => navigate(tienePermisosEspeciales ? '/admin-dashboard' : '/listado-cobros')}
          >
            <div style={styles.userSection}>
              {storedUsername ? (
                <span style={styles.usernameDisplay}>{storedUsername}</span>
              ) : (
                <span style={styles.usernameDisplay}>Usuario</span>
              )}
              {!esSuperAdmin && nombreEmpresa && (
                <span style={styles.empresaTag}>{nombreEmpresa}</span>
              )}
              {esSuperAdmin && (
                <span style={{...styles.empresaTag, color: '#e74c3c'}}>Administrador Global</span>
              )}
            </div>
          </div>
        </div>

        <button className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </button>

        <ul className="nav-links-container" style={styles.navLinks}>
          {!token ? (
            <li><Link to="/" style={styles.link} onClick={() => setIsOpen(false)}>Login</Link></li>
          ) : (
            <>
              {/* Ajuste: Solo el Admin tiene acceso al registro de cobradores desde el Navbar */}
              {/* {esAdmin && (
                <li><Link to="/signup" style={styles.link} onClick={() => setIsOpen(false)}>Registro</Link></li>
              )} */}
              
              {!esSuperAdmin && (
                <>
                  {tienePermisosEspeciales && (
                    <li>
                      <button onClick={handleBackup} disabled={isExporting} style={{...styles.informeBtn, backgroundColor: '#27ae60'}}>
                        {isExporting ? 'Exportando...' : 'Backup'}
                      </button>
                    </li>
                  )}
                  <li><button onClick={() => { navigate('/informes'); setIsOpen(false); }} style={styles.informeBtn}>Informes</button></li>
                  <li><button onClick={() => { navigate('/form-contac'); setIsOpen(false); }} style={styles.informeBtn}>Nuevo Cliente</button></li>  
       
                  {tienePermisosEspeciales && (
                  <li><button onClick={() => { navigate('/listado-cobros'); setIsOpen(false); }} style={styles.informeBtn}>Lista Clientes</button></li>
                  )}
                </>
              )}

              <li><button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button></li>              
            </>
          )}
        </ul>
      </nav>
    </>
  );
};

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px', height: '70px', backgroundColor: '#1a1a1a', color: 'white', position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 1000, boxSizing: 'border-box', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' },
  leftContainer: { display: 'flex', alignItems: 'center', gap: '20px' },
  userSection: { display: 'flex', flexDirection: 'column', marginLeft: '12px', justifyContent: 'center' },
  usernameDisplay: { fontSize: '15px', fontWeight: 'bold', color: '#fff', textTransform: 'capitalize', lineHeight: '1.2' },
  empresaTag: { fontSize: '11px', color: '#646cff', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' },
  navLinks: { display: 'flex', listStyle: 'none', gap: '20px', margin: 0, padding: 0, alignItems: 'center' },
  link: { color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#ff4757', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  informeBtn: { backgroundColor: '#646cff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background-color 0.3s' },
};

export default Navbar;