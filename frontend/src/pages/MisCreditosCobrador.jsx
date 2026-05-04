import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import FormAbonosCliente from './FormAbonosCliente';
import '../App.css';

const MisCreditosCobrador = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [recaudoDia, setRecaudoDia] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  
  const [showModal, setShowModal] = useState(false);
  const [selectedCreditoId, setSelectedCreditoId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchRecaudoDia = async () => {
    try {
      const response = await api.get(`/abonos/recaudo-dia/${user.id || user.username}`);
      setRecaudoDia(response.data.total || 0);
    } catch (error) {
      console.error("Error al obtener recaudo del día:", error);
    }
  };

  const fetchMisCreditos = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/creditos/cobrador/${user.username}`);
      setCreditos(response.data);
      await fetchRecaudoDia();
    } catch (error) {
      console.error("Error al obtener créditos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchMisCreditos();
    }
  }, [user?.username]);

  const handleOpenModal = (id) => {
    setSelectedCreditoId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCreditoId(null);
    fetchMisCreditos(); 
  };

  const creditosFiltrados = creditos.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      c.cliente_nombre?.toLowerCase().includes(search) ||
      c.cliente_apellido?.toLowerCase().includes(search) ||
      c.cliente_id?.toString().includes(search) ||
      c.numero_credito_cliente?.toString().includes(search)
    );
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = creditosFiltrados.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(creditosFiltrados.length / recordsPerPage);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return <div className="loading-container"><h3>Cargando cobros...</h3></div>;

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      <style>{`
        @media (max-width: 768px) {
          .styled-table thead { display: none; }
          .styled-table, .styled-table tbody, .styled-table tr, .styled-table td { 
            display: block; 
            width: 100%; 
          }
          .styled-table tr {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            overflow: hidden;
            padding: 10px 0;
          }
          .styled-table td {
            text-align: right;
            padding: 10px 15px;
            position: relative;
            border-bottom: 1px solid #f0f0f0;
          }
          .styled-table td:last-child { border-bottom: none; text-align: center; background: #f8faff; margin-top: 10px; }
          .styled-table td::before {
            content: attr(data-label);
            position: absolute;
            left: 15px;
            width: 45%;
            text-align: left;
            font-weight: bold;
            color: #5b6582;
            text-transform: uppercase;
            font-size: 11px;
          }
          .main-header-flex { flex-direction: column; text-align: center; }
          .btn-logout { max-width: 100% !important; }
        }
        .whatsapp-link {
          color: #25d366;
          text-decoration: none;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .whatsapp-link:hover {
          text-decoration: underline;
        }
      `}</style>

      {showModal && (
        <FormAbonosCliente 
          idCredito={selectedCreditoId} 
          onClose={handleCloseModal} 
        />
      )}  

      <div className="main-header-flex" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        gap: '15px' 
      }}>
        <h2 style={{ margin: 0, flex: '1 1 auto', minWidth: '200px' }}>
          Cobros Asignados a: <span style={{color: '#6366f1'}}>{user.username}</span>
        </h2>
        
        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #22c55e', 
          padding: '10px 20px', 
          borderRadius: '12px',
          textAlign: 'center',
          flex: '1 1 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px', color: '#166534', fontWeight: 'bold' }}>RECAUDO HOY:</span>
          <span style={{ fontSize: '24px', color: '#15803d', fontWeight: '900' }}>
            ${Number(recaudoDia).toLocaleString('es-CO')}
          </span>
        </div>

        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end', minWidth: '150px' }}>
          <button 
              className="btn-logout"
              onClick={() => { localStorage.clear(); navigate('/'); }} 
              style={{ 
                backgroundColor: '#e74c3c', color: 'white', padding: '12px 25px', 
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                width: '100%', maxWidth: '180px' 
              }}>
              Cerrar Sesión
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar por cliente, cédula o # de crédito..."
        className="search-input"
        value={searchTerm}
        onChange={handleSearchChange}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd', boxSizing: 'border-box' }}
      />

      <div className="table-wrapper">
        <table className="styled-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#6366f1', color: 'white' }}>
              <th># CRÉDITO</th>
              <th>CLIENTE</th>
              <th>DIRECCIÓN COBRO</th>
              <th>TELÉFONO</th>
              <th>VALOR PRÉSTAMO</th>
              <th>VALOR A PAGAR</th>
              <th>INTERES %</th>
              <th>ESTADO</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((c) => (
              <tr key={c.id}>
                <td data-label="# CRÉDITO"><strong>#{c.numero_credito_cliente}</strong></td>
                <td data-label="CLIENTE">
                  <strong>{c.cliente_nombre} {c.cliente_apellido}</strong>
                  <div style={{ fontSize: '10px', color: '#666' }}>CC: {c.cliente_id}</div>
                </td>
                <td data-label="DIRECCIÓN">
                  {c.direccion_cobro} <br/>
                  <small style={{color:'#888'}}>{c.barrio_cobro}</small>
                </td>
                <td data-label="TELÉFONO">
                  {c.telefono_cobro ? (
                    <a 
                      href={`https://wa.me/57${c.telefono_cobro.replace(/\s+/g, '')}?text=Hola%20${c.cliente_nombre},%20te%20contacto%20de%20la%20gestión%20de%20tu%20crédito%20%23${c.numero_credito_cliente}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="whatsapp-link"
                    >

                      {/* Logo de WhatsApp en SVG */}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="18" 
                        height="18" 
                        viewBox="0 0 24 24" 
                        fill="#25d366"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>

                      {c.telefono_cobro}
                    </a>
                  ) : 'N/A'}
                </td>
                <td data-label="PRÉSTAMO" style={{ color: '#1b35c7a9', fontWeight: 'bold' }}>
                    ${Number(c.valor_prestamo).toLocaleString('es-CO')}
                </td>
                <td data-label="SALDO" style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                    ${Number(c.total_pagar).toLocaleString('es-CO')}
                  <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#666' }}>{c.frecuencia_cuotas}</div>
                </td>
                <td data-label="INTERÉS" style={{ fontWeight: 'bold', color: '#6366f1' }}>
                    {Number(c.interes || 0).toLocaleString('es-CO')}%
                </td>
                <td data-label="ESTADO">
                  <span className={`badge ${c.estado.toLowerCase()}`} style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '10px', 
                      backgroundColor: c.estado === 'Mora' ? '#fee2e2' : '#fef3c7',
                      color: c.estado === 'Mora' ? '#991b1b' : '#92400e'
                    }}>
                    {c.estado.toUpperCase()}
                  </span>
                </td>
                <td data-label="ACCIÓN">
                  <button 
                    onClick={() => handleOpenModal(c.id)} 
                    style={{ 
                        backgroundColor: '#3c9ae7', color: 'white', padding: '10px 30px', 
                        borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', 
                        cursor: 'pointer', border: 'none'
                    }}>
                    Abonar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creditosFiltrados.length > recordsPerPage && (
        <div className="pagination" style={{ marginTop: '20px', textAlign: 'center' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Anterior</button>
          <span style={{ margin: '0 15px' }}>Página {currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Siguiente</button>
        </div>
      )}
    </div>
  );
};

export default MisCreditosCobrador;