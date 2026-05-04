import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authApi } from "../api/auth";
import '../App.css';

const FormListaCliente = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [cobradores, setCobradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const registrosPorPagina = 5;

  // Estados para Modales
  const [isCreditoModalOpen, setIsCreditoModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [clienteSeleccionadoDocs, setClienteSeleccionadoDocs] = useState(null);
  
  const [creandoCredito, setCreandoCredito] = useState(false);
  const [esCreditoAdicional, setEsCreditoAdicional] = useState(false);
  
  const [formData, setFormData] = useState({
    cliente_id: "", 
    nombre_completo: "",
    monto: "",
    tipo_interes: "fijo",
    interes: "",
    frecuencia_cuotas: "diario",
    cuotas: "",
    cobrador_id: "",
    total_pagar: 0,
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  const fetchDatosIniciales = useCallback(async () => {
    try {
      setLoading(true);
      const idAdmin = localStorage.getItem('userId');
      if (!idAdmin) { navigate('/'); return; }

      const resPerfil = await authApi.obtenerPerfilUsuario(idAdmin);
      const infoUsuario = resPerfil.data;
      setUserData(infoUsuario);

      const miCompradorId = infoUsuario.id_comprador || infoUsuario.comprador_id;

      const resClientes = await authApi.obtenerClientesCompleto({ 
        params: { id_comprador: miCompradorId, _t: new Date().getTime() }
      });
      
      if (resClientes.data) {
        setClientes(Array.isArray(resClientes.data) ? resClientes.data : []);
      }

      const resCobradores = await authApi.obtenerCobradores();
      setCobradores(resCobradores.data || []);

    } catch (error) {
      console.error("Error crítico en carga de datos:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchDatosIniciales(); }, [fetchDatosIniciales]);

  useEffect(() => {
    const monto = parseFloat(formData.monto) || 0;
    const interesPct = parseFloat(formData.interes) || 0;
    const total = monto + (monto * (interesPct / 100));
    setFormData(prev => ({ ...prev, total_pagar: total }));
  }, [formData.monto, formData.interes]);

  const openCreditoModal = (item) => {
    const tieneCreditosPrevios = (item.total_creditos > 0) || (item.numero_credito_cliente && item.numero_credito_cliente !== 'PENDIENTE');
    setEsCreditoAdicional(tieneCreditosPrevios);

    setFormData(prev => ({
      ...prev,
      cliente_id: item.id_cedula || item.cedula,
      nombre_completo: `${item.name || item.nombre || ''} ${item.apellido || ''}`,
      monto: "", interes: "", cuotas: "", cobrador_id: ""
    }));
    setIsCreditoModalOpen(true);
  };

  const handleSubirDocsDirecto = (cliente) => {
    setClienteSeleccionadoDocs(cliente);
    setIsDocsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarCredito = async (e) => {
    e.preventDefault();
    if (!formData.monto || !formData.interes || !formData.cobrador_id || !formData.cuotas) {
      return Swal.fire('Atención', 'Por favor complete todos los campos', 'warning');
    }

    try {
      setCreandoCredito(true);

      // --- AJUSTE PARA OBTENER ID_RUTA ---
      const cobradorSeleccionado = cobradores.find(c => String(c.id) === String(formData.cobrador_id));

      const payload = {
        ...formData,
        id_comprador: userData.id_comprador || userData.comprador_id,
        id_usuario_creador: localStorage.getItem('userId'),
        // Mapeo para evitar campos NULL en la DB:
        usuario_id: formData.cobrador_id,
        cobrador_asignado: cobradorSeleccionado?.username || 'Sin Nombre',
        id_ruta: cobradorSeleccionado?.id_ruta || null // Se integra la ruta del cobrador
      };
      
      await authApi.crearCredito(payload);
      
      setIsCreditoModalOpen(false);
      await fetchDatosIniciales(); 
      Swal.fire('¡Éxito!', 'Crédito registrado con éxito', 'success');
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire('Error', error.response?.data?.error || 'Error al procesar el crédito', 'error');
    } finally {
      setCreandoCredito(false);
    }
  };

  const datosFiltrados = clientes.filter(item => {
    const t = busqueda.toLowerCase();
    const nombre = `${item.name || item.nombre || ''} ${item.apellido || ''}`.toLowerCase();
    const cedula = (item.id_cedula || item.cedula || '').toString();
    return nombre.includes(t) || cedula.includes(t);
  });

  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
  const registrosActuales = datosFiltrados.slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina);
  const handleLogout = () => {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: "Tendrás que ingresar tus credenciales nuevamente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear(); // Limpia token, userId y otros datos
      navigate('/');        // Redirige al login
    }
  });
};

  return (
    <div className="table-container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Listado Maestro de Clientes</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6366f1', fontWeight: 'bold' }}>
            CONECTADO: {userData?.username} | EMPRESA: {userData?.nombre_empresa}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
    <button 
      onClick={() => navigate('/cobradores')} 
      className="btn-volver" 
      style={{ 
        backgroundColor: '#6366f1', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        border: 'none', 
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Volver
    </button>

    <button 
      onClick={handleLogout} 
      style={{ 
        backgroundColor: '#ef4444', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        border: 'none', 
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
    >
      Cerrar Sesión
    </button>
  </div>
      </div>

      <input 
        type="text" 
        placeholder="🔍 Buscar cliente por nombre o cédula..." 
        className="formbold-form-input" 
        style={{ marginBottom: '20px', borderRadius: '25px', width: '100%', height: '45px', paddingLeft: '15px' }}
        onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }} 
      />

      <div className="table-wrapper" style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#6366f1', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '15px' }}>FECHA</th>
              <th style={{ padding: '15px' }}># CRÉDITO</th>
              <th style={{ padding: '15px' }}>CLIENTE</th>
              <th style={{ padding: '15px' }}>HISTORIAL</th>
              <th style={{ padding: '15px' }}>PRÉSTAMO</th>
              <th style={{ padding: '15px' }}>TOTAL A PAGAR</th>
              <th style={{ padding: '15px' }}>COBRADOR</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>DOCS</th>
              <th style={{ padding: '15px' }}>ESTADO</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {registrosActuales.map((item, index) => {
              const tieneCreditos = (item.total_creditos > 0) || (item.numero_credito_cliente && item.numero_credito_cliente !== 'PENDIENTE');
              return (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.numero_credito_cliente ? `#${item.numero_credito_cliente}` : 'PENDIENTE'}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{item.name} {item.apellido}</strong><br/>
                    <small style={{ color: '#7f8c8d' }}>CC: {item.id_cedula}</small>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{item.total_creditos || 0}</td>
                  <td style={{ padding: '12px' }}>${Number(item.monto || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px', color: '#6366f1', fontWeight: 'bold' }}>${Number(item.total_pagar || 0).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{item.cobrador_asignado || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {item.tiene_documentos ? (
                      <span title="Documentos cargados" style={{ fontSize: '18px' }}>✅</span>
                    ) : (
                      <button 
                        onClick={() => handleSubirDocsDirecto(item)}
                        style={{ backgroundColor: '#e65656', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        SUBIR DOCS
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span 
                      style={{ 
                        fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold',
                        background: item.estado?.toUpperCase() === 'PAGADO' ? '#dcfce7' : (item.estado?.toUpperCase() === 'NUEVO' || !item.estado) ? '#f3e8ff' : '#94cef5', 
                        color: item.estado?.toUpperCase() === 'PAGADO' ? '#166534' : (item.estado?.toUpperCase() === 'NUEVO' || !item.estado) ? '#7e22ce' : '#374151'
                      }}
                    >
                      {item.estado || 'Nuevo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => openCreditoModal(item)} 
                      style={{ 
                        backgroundColor: tieneCreditos ? '#76eea0' : '#94cef5', 
                        color: 'black', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' 
                      }}
                    >
                      {tieneCreditos ? 'NUEVO CRÉDITO' : 'PRIMER CRÉDITO'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINADO */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
        {[...Array(totalPaginas)].map((_, i) => (
          <button key={i + 1} onClick={() => setCurrentPage(i + 1)} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', backgroundColor: currentPage === i + 1 ? '#6366f1' : '#f3f4f6', color: currentPage === i + 1 ? 'white' : '#374151', fontWeight: 'bold', cursor: 'pointer' }}>{i + 1}</button>
        ))}
        <button disabled={currentPage === totalPaginas} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: currentPage === totalPaginas ? 'not-allowed' : 'pointer' }}>Siguiente</button>
      </div>

      {/* MODAL DOCUMENTOS */}
      {isDocsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '500px', textAlign: 'center' }}>
            <h3 style={{ color: '#6A64F1' }}>Cargar Documentos</h3>
            <p>Cliente: <strong>{clienteSeleccionadoDocs?.name}</strong></p>
            <div style={{ border: '2px dashed #ddd', padding: '40px', borderRadius: '10px', marginBottom: '20px' }}>
                <input type="file" multiple style={{ display: 'block', margin: '10px auto'}} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsDocsModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#6A64F1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cerrar</button>
              <button onClick={() => { setIsDocsModalOpen(false); Swal.fire('Éxito', 'Documentos cargados', 'success'); }} style={{ flex: 1, padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Subir Archivos</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉDITO */}
      {isCreditoModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ background: 'white', padding: '35px', borderRadius: '20px', width: '750px', maxWidth: '95%' }}>
            <h2 style={{ color: '#6A64F1', marginTop: 0, marginBottom: '25px', fontSize: '28px', fontWeight: 'bold' }}>{esCreditoAdicional ? 'Crear Crédito Adicional' : 'Crear Primer Crédito'}</h2>
            <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>👤 {formData.nombre_completo}</span>
              <span style={{ background: '#eeedff', color: '#6A64F1', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>CC: {formData.cliente_id}</span>
            </div>
            <form onSubmit={handleGuardarCredito}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '20px' }}>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Tipo de Interés</label>
                  <select name="tipo_interes" value={formData.tipo_interes} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <option value="fijo">Fijo</option>
                    <option value="indefinido">Indefinido</option>
                  </select>
                </div>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Interés (%)</label>
                  <input type="number" name="interes" value={formData.interes} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '20px' }}>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Monto a Prestar</label>
                  <input type="number" name="monto" value={formData.monto} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                </div>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Número de Cuotas</label>
                  <input type="number" name="cuotas" value={formData.cuotas} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Frecuencia de Cobro</label>
                  <select name="frecuencia_cuotas" value={formData.frecuencia_cuotas} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
                <div>
                  <label style={{ marginBottom: '10px', display: 'block' }}>Cobrador Asignado</label>
                  <select name="cobrador_id" value={formData.cobrador_id} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required>
                    <option value="">Seleccione...</option>
                    {cobradores.map(c => <option key={c.id} value={c.id}>{c.username?.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: '#f4fbf7', padding: '18px', borderRadius: '15px', border: '1px solid #a7f3d0', marginBottom: '30px' }}>
                <label style={{ display: 'block', color: '#27ae60', fontSize: '14px' }}>Total a Pagar</label>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(formData.total_pagar)}</span>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button type="button" onClick={() => setIsCreditoModalOpen(false)} style={{ flex: 1, padding: '15px', background: '#6A64F1', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={creandoCredito} style={{ flex: 1, padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>{creandoCredito ? 'Procesando...' : 'Confirmar Crédito'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormListaCliente;