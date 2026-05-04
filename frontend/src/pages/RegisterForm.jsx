import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaStore, FaRoute, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { authApi, rutasApi, compradoresApi } from '../api/auth';

const RegisterForm = () => {
  const [compradores, setCompradores] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const adminId = localStorage.getItem('userId');

  const { register, handleSubmit, reset, setFocus, setValue, watch, formState: { isValid } } = useForm({
    mode: "onChange",
    defaultValues: {
      role: "user",
      id_comprador: "",
      id_ruta: ""
    }
  });

  const selectedComprador = watch('id_comprador');

  const rutasFiltradas = rutas.filter(r => {
    const compRuta = Number(r.id_comprador);
    const compSeleccionado = Number(selectedComprador);
    return compRuta === compSeleccionado && compSeleccionado !== 0;
  });

  const cargarConfiguracion = useCallback(async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      // Traemos también la lista de usuarios para contar cobradores activos
      const [resPerfil, resComp, resRutas, resUsuarios] = await Promise.all([
        authApi.obtenerPerfilUsuario(adminId), // Usando el nombre de función corregido
        compradoresApi.getAll(),
        rutasApi.getAll(),
        authApi.obtenerUsuariosRegistrados() 
      ]);

      const perfil = resPerfil.data;
      const listaCompradores = Array.isArray(resComp.data) ? resComp.data : [];
      const listaRutas = Array.isArray(resRutas.data) ? resRutas.data : [];
      const listaUsuarios = Array.isArray(resUsuarios.data) ? resUsuarios.data : [];

      // --- LÓGICA DE VALIDACIÓN DE LÍMITE DE COBRADORES ---
      const limitePermitido = parseInt(perfil.max_rutas_permitidas) || 0;
      const miCompradorId = perfil.id_comprador;

      // Contamos cuántos usuarios con rol 'user' pertenecen a este id_comprador
      const cobradoresActuales = listaUsuarios.filter(u => 
        String(u.id_comprador) === String(miCompradorId) && u.role === 'user'
      ).length;

      if (limitePermitido > 0 && cobradoresActuales >= limitePermitido) {
        await Swal.fire({
          title: 'Cupo de Cobradores Lleno',
          text: `Tu plan permite un máximo de ${limitePermitido} cobradores (uno por ruta) y ya has alcanzado ese límite.`,
          icon: 'warning',
          confirmButtonColor: '#633ef1'
        });
        navigate('/cobradores');
        return;
      }
      // ---------------------------------------------------

      setCompradores(listaCompradores);
      setRutas(listaRutas);

      if (perfil && miCompradorId) {
        setValue('id_comprador', String(miCompradorId), { shouldValidate: true });
      }

    } catch (error) {
      console.error("Error cargando configuración:", error);
      Swal.fire('Error', 'No se pudo validar el cupo de la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  }, [adminId, setValue, navigate]);

  useEffect(() => {
    setFocus("username");
    cargarConfiguracion();
  }, [cargarConfiguracion, setFocus]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, role: 'user' };
      await authApi.registro(payload);

      Swal.fire({
        title: 'Éxito',
        text: 'Cobrador creado y vinculado a la ruta correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/cobradores');
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo completar el registro',
        icon: 'error'
      });
    }
  };

  const styles = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #8f0daf 0%, #2b74e2 100%)', fontFamily: "'Poppins', sans-serif" },
    glass: { background: 'rgba(255, 255, 255, 0.15)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' },
    inputGroup: { position: 'relative', marginBottom: '15px' },
    input: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '12px', border: 'none', background: 'white', color: '#333', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    inputReadOnly: { width: '100%', padding: '12px 45px 12px 15px', borderRadius: '12px', border: 'none', background: 'rgba(255, 255, 255, 0.8)', color: '#333', fontSize: '14px', boxSizing: 'border-box', cursor: 'not-allowed', fontWeight: '600' },
    icon: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '18px' },
    btnPrimary: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #3498db, #d548f1)', color: 'white', fontWeight: '600', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
    btnSecondary: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.4)', background: 'transparent', color: 'white', fontSize: '14px', cursor: 'pointer', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glass}>
        <h2 style={{ margin: '0 0 10px 0' }}>Registrar Cobrador</h2>
        <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '25px' }}>Panel de Administración de Rutas</p>

        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div style={styles.inputGroup}>
            <input {...register('username', { required: true })} placeholder="Nombre de usuario" style={styles.input} />
            <FaUser style={styles.icon} />
          </div>

          <div style={styles.inputGroup}>
            <input {...register('email', { required: true })} type="email" placeholder="Correo electrónico" style={styles.input} />
            <FaEnvelope style={styles.icon} />
          </div>

          <div style={styles.inputGroup}>
            <input {...register('password', { required: true, minLength: 6 })} type={showPassword ? "text" : "password"} placeholder="Contraseña" style={styles.input} />
            <span style={{ ...styles.icon, cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div style={styles.inputGroup}>
            <input
              type="text"
              readOnly
              value={compradores.find(c => String(c.id_comprador) === String(selectedComprador))?.nombre_empresa || "Cargando empresa..."}
              style={styles.inputReadOnly}
            />
            <FaStore style={styles.icon} />
            <input type="hidden" {...register('id_comprador')} />
          </div>

          <div style={styles.inputGroup}>
            <select {...register('id_ruta', { required: true })} style={{ ...styles.input, appearance: 'none' }}>
              <option value="">
                {loading ? "Cargando rutas..." : rutasFiltradas.length > 0 ? "Seleccionar Ruta Destino" : "No hay rutas disponibles"}
              </option>
              {rutasFiltradas.map(r => (
                <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
              ))}
            </select>
            <FaRoute style={styles.icon} />
          </div>

          <button type="submit" disabled={loading || !isValid} style={{ ...styles.btnPrimary, opacity: (loading || !isValid) ? 0.7 : 1 }}>
            {loading ? "Validando..." : "Crear Cobrador"}
          </button>

          <button type="button" onClick={() => navigate('/cobradores')} style={styles.btnSecondary}>
            <FaArrowLeft /> Volver al listado
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;