import { useForm } from "react-hook-form";
import api from "../api/auth"; // 1. Importamos la API
import React, { useState } from "react";

const FormContac = () => {
  const [serverMessage, setServerMessage] = useState(""); // Para mostrar errores del servidor

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({
    mode: "onBlur" // Esto hace que valide al perder el foco
  });

  // 2. Función de envío actualizada
  const onSubmit = async (data) => {
    try {
      setServerMessage("Guardando...");
      
      // Mapeamos los datos del formulario a los nombres de la tabla PostgreSQL
      const dataToPost = {
        name: data.nombre, // Cambiamos 'nombre' por 'name' como pide la tabla
        apellido: data.apellido,
        correo: data.email, // Cambiamos 'email' por 'correo'
        celular: data.celular,
        direccion: data.direccion,
        genero: data.genero === "m" ? "Masculino" : data.genero === "f" ? "Femenino" : "Otro",
        ciudad: data.ciudad
      };

      const response = await api.post('/clientes', dataToPost);

      if (response.status === 201) {
        alert("Cliente registrado exitosamente en la base de datos");
        reset(); // Limpia el formulario
        setServerMessage("");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      const msg = error.response?.data?.mensaje || "Error al conectar con el servidor";
      setServerMessage(msg);
    }
  };

  return (
    <div>
      <div className="formbold-main-wrapper">
        <div className="formbold-form-wrapper">
          <img src="./img-reg.jpg" alt="Registro" />

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="formbold-form-title">
              <h2>Registrar Cliente</h2>
              <p>Debe registrar al usuario para habilitar el crédito.</p>
              {serverMessage && <p style={{ color: 'red', fontWeight: 'bold' }}>{serverMessage}</p>}
            </div>

            {/* NOMBRES Y APELLIDOS */}
            <div className="formbold-input-flex">
                <div>
                    <label className="formbold-form-label">Nombres</label>
                    <input
                        className="formbold-form-input"
                        type="text"
                        placeholder="Ingrese el nombre"
                        autoFocus
                        autoComplete="off"
                        {...register('nombre', {
                        required: "El nombre es obligatorio",
                        minLength: { value: 3, message: "Mínimo 3 caracteres" },
                        pattern: {
                        value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
                        message: "No se permiten números ni caracteres especiales"
                        }
                        })}
                        onKeyDown={(e) => {
                            if (/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            }
                        }}
                    />
                    {errors.nombre && <p className="error-msg">{errors.nombre.message}</p>}
                </div>

                <div>
                <label className="formbold-form-label">Apellidos</label>
                <input
                    type="text"
                    placeholder="Ingrese el apellido"
                    className="formbold-form-input"
                    autoComplete="off"
                    {...register('apellido', {
                    required: "El apellido es obligatorio",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    pattern: {
                        value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
                        message: "No se permiten números ni caracteres especiales"
                        }
                    })}
                        onKeyDown={(e) => {
                            if (/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            }
                        }}
                />
                {errors.apellido && <p className="error-msg">{errors.apellido.message}</p>}
                </div>
            </div>

            {/* EMAIL Y CELULAR */}
            <div className="formbold-input-flex">
                <div>
                <label className="formbold-form-label">Correo Electrónico</label>
                <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    className="formbold-form-input"
                    autoComplete="off"
                    {...register('email', {
                    required: "El correo es obligatorio",                    
                    pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Formato de correo inválido"
                    }
                    })}
                />
                
                {errors.email && <p className="error-msg">{errors.email.message}</p>}
                
                </div>

                <div>
                <label className="formbold-form-label">Número Celular</label>
                    <input
                        type="text"
                        placeholder="Ej: 3001234567"
                        className="formbold-form-input"
                        autoComplete="off"
                        {...register('celular', {
                            required: "El celular es obligatorio",
                            minLength: { value: 9, message: "Número demasiado corto" },                
                            maxLength: { value: 10, message: "Máximo 10 números" }                
                        })}
                        onKeyDown={(e) => {
                            const teclasPermitidas = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight'];
                            if (!/[0-9]/.test(e.key) && !teclasPermitidas.includes(e.key)) {
                            e.preventDefault();
                            }
                        }}
                        />
                    {errors.celular && <p className="error-msg">{errors.celular.message}</p>}
                </div>
            </div>

            {/* DIRECCIÓN */}
            <div className="formbold-mb-3">
                <label className="formbold-form-label">Dirección</label>
                <input
                type="text"
                placeholder="Ingrese la dirección"
                className="formbold-form-input"
                autoComplete="off"
                {...register('direccion', {
                    required: "La dirección es obligatoria",
                    minLength: { value: 9, message: "Mínimo 9 caracteres" },
                })}
                />
                {errors.direccion && <p className="error-msg">{errors.direccion.message}</p>}
            </div>

            {/* GENERO Y CIUDAD */}
            <div className="formbold-input-flex">
                <div>
                <label className="formbold-form-label">Género</label>
                <select 
                    className="formbold-form-input"
                    autoComplete="off"
                    {...register('genero', { required: "Seleccione un género" })}
                >
                    <option value="">Seleccione...</option>
                    <option value="m">Masculino</option>
                    <option value="f">Femenino</option>
                    <option value="o">Otro</option>
                </select>
                {errors.genero && <p className="error-msg">{errors.genero.message}</p>}
                </div>

                <div>
                <label className="formbold-form-label">Ciudad</label>
                <input
                    type="text"
                    placeholder="Ingrese la ciudad"
                    className="formbold-form-input"
                    autoComplete="off"
                    {...register('ciudad', {
                    required: "La ciudad es obligatoria",
                    pattern: {
                        // Esta expresión regular permite letras (incluyendo ñ y tildes) y espacios
                        value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
                        message: "No se permiten números ni caracteres especiales"
                        },
                    minLength: { value: 4, message: "Mínimo 4 caracteres" },
                    })}
                        // Bloqueo físico de números al teclear
                        onKeyDown={(e) => {
                            if (/[0-9]/.test(e.key)) {
                            e.preventDefault();
                            }
                        }}
                />
                {errors.ciudad && <p className="error-msg">{errors.ciudad.message}</p>}
                </div>
            </div>

            {/* CHECKBOX TÉRMINOS */}
            <div className="formbold-checkbox-wrapper">
                <label className="formbold-checkbox-label">
                    <div className="formbold-relative">
                        <input
                            type="checkbox"
                            className="formbold-input-checkbox"
                            {...register('terminos', {
                                required: "Debe aceptar los términos para continuar"
                            })}
                        />                                         
                        {/* Aquí va tu SVG de la flechita */}
                        <div className="formbold-checkbox-inner"></div>                        
                            
                    </div>
                        <span className="formbold-checkbox-text">
                        Acepto los términos <a href="#"> condiciones y políticas definidos.</a>
                        </span>
                </label>
                    </div>
                    {errors.terminos && <p className="error-msg">{errors.terminos.message}</p>}                   

                <button 
                    type="submit" 
                    className="formbold-btn" 
                    disabled={!isValid} // <--- Se deshabilita si el formulario no es válido
                    style={{
                    opacity: isValid ? 1 : 0.6, // Efecto visual de deshabilitado
                    cursor: isValid ? 'pointer' : 'not-allowed'
                    }}
                >
                    Registrarse
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default FormContac;