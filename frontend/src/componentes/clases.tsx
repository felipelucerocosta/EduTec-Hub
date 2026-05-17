import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.css"; // 👈 módulo css
import Header from "../components reutilizables/header";

interface Clase {
  materia: string;
  nombre: string;
  seccion: string;
  aula: string;
  creador: string;
  id?: number; // opcional si viene del servidor
  codigo?: string;
  titular_id?: number;
}

const STORAGE_KEY = "mis_clases"; // 🔹 clave para localStorage

const Clases: React.FC = () => {
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarUnirse, setMostrarUnirse] = useState(false);
  const [clases, setClases] = useState<Clase[]>([]);
  const navigate = useNavigate();
  const [pendingModal, setPendingModal] = useState<{ open: boolean; claseId?: number; solicitudes: any[] }>({ open: false, solicitudes: [] });
  const [currentUser, setCurrentUser] = useState<{ id?: number; rol?: string; nombre?: string } | null>(null);
  const [accessMap, setAccessMap] = useState<Record<number, boolean>>({});

  // 🔹 Cargar clases guardadas al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setClases(JSON.parse(saved));
      } catch {
        console.error("Error al leer localStorage");
      }
    }
    // Obtener info de sesión para ajustar la UI
    (async () => {
      try {
        const r = await fetch('http://localhost:3001/api/whoami', { credentials: 'include' });
        const d = await r.json();
        setCurrentUser(d.user || null);
        // if we are a professor, prefetch classes and access
        if (d.user && d.user.rol === 'profesor') {
          // fetch server classes and then check access per class
          await fetchServerClasses();
        }
      } catch (err) {
        console.error('No se pudo obtener whoami:', err);
      }
    })();
  }, []);

  // 🔹 Guardar clases cada vez que cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clases));
  }, [clases]);

  const fetchServerClasses = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/clases', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // mapear a tipo Clase (algunos campos pueden variar según backend)
        const mapped = data.map((r: any) => ({
          id: r.id,
          materia: r.materia || r.materia,
          nombre: r.nombre || r.nombre,
          seccion: r.seccion || r.seccion,
          aula: r.aula || r.aula,
          creador: r.creador || r.creador,
          codigo: r.codigo || r.codigo,
          titular_id: r.titular_id || r.titular_id
        }));
        setClases(mapped);
        // después de setear clases, si somos profesor chequear accesos
        if (currentUser?.rol === 'profesor') {
          const ids = mapped.map((m) => m.id).filter(Boolean) as number[];
          if (ids.length > 0) {
            try {
              const r2 = await fetch('http://localhost:3001/api/campus/has-access-batch', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clase_ids: ids })
              });
              const d2 = await r2.json();
              if (r2.ok && d2.access) {
                // d2.access expected: { '1': true, '2': false }
                const newMap: Record<number, boolean> = {};
                Object.keys(d2.access).forEach((k) => { newMap[Number(k)] = !!d2.access[k]; });
                setAccessMap(newMap);
              }
            } catch (err) {
              console.error('Error fetching batch access:', err);
            }
          }
        }
      } else {
        alert('No se encontraron clases en el servidor');
      }
    } catch (err) {
      console.error('Error al cargar clases del servidor', err);
      alert('Error al cargar clases del servidor. Revisa la consola.');
    }
  };

  const checkAccessForClass = async (claseId?: number) => {
    if (!claseId || !currentUser) return;
    try {
      const r = await fetch('http://localhost:3001/api/campus/has-access-batch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clase_ids: [claseId] })
      });
      const d = await r.json();
      if (r.ok && d.access) {
        setAccessMap((prev) => ({ ...prev, [claseId]: !!d.access[claseId] }));
      }
    } catch (err) {
      console.error('Error checking access for class', err);
    }
  };

  const solicitarAcceso = async (claseId?: number) => {
    if (!claseId) {
      alert('Esta clase no tiene id en el servidor. Sincroniza las clases primero.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/campus/solicitar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clase_id: claseId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Solicitud enviada');
      } else {
        alert(data.error || JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error solicitar acceso', err);
      alert('Error al solicitar acceso');
    }
  };

  const abrirSolicitudes = async (claseId?: number) => {
    if (!claseId) { alert('Sin id de clase. Sincroniza con el servidor.'); return; }
    try {
      const res = await fetch(`http://localhost:3001/api/campus/solicitudes/${claseId}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setPendingModal({ open: true, claseId, solicitudes: data.solicitudes || [] });
      } else {
        alert(data.error || JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error al obtener solicitudes', err);
      alert('Error al obtener solicitudes');
    }
  };

  const aprobarSolicitud = async (solicitudId: number) => {
    try {
      const res = await fetch('http://localhost:3001/api/campus/aprobar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitud_id: solicitudId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Aprobada');
        // refrescar lista
        if (pendingModal.claseId) {
          abrirSolicitudes(pendingModal.claseId);
          // refresh classes to reflect any changes
          await fetchServerClasses();
        }
      } else {
        alert(data.error || JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error aprobar solicitud', err);
      alert('Error al aprobar solicitud');
    }
  };

  const handleCrearClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nuevaClase: Clase = {
      materia: formData.get("materia") as string,
      nombre: formData.get("nombre") as string,
      seccion: formData.get("seccion") as string,
      aula: formData.get("aula") as string,
      creador: formData.get("creador") as string,
    };
    // Prevención simple de duplicados en cliente (misma materia+nombre+seccion)
    const existe = clases.some(
      (c) => c.materia === nuevaClase.materia && c.nombre === nuevaClase.nombre && c.seccion === nuevaClase.seccion
    );
    if (existe) {
      alert('Ya existe una clase con la misma materia, nombre y sección.');
      return;
    }

    // Enviar al servidor para persistir y recibir id/codigo
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/crear-clase', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaClase)
        });
        const data = await res.json();
        if (res.status === 201 || data.success) {
          // backend devuelve la clase creada en data.clase o success + campos
          // refrescar lista desde servidor para mantener consistencia
          await fetchServerClasses();
          const claseServidor = data.clase || { id: data.id, nombre: nuevaClase.nombre, materia: nuevaClase.materia, seccion: nuevaClase.seccion, aula: nuevaClase.aula, creador: nuevaClase.creador, codigo: data.codigo };
          // fallback: if fetchServerClasses didn't update yet, append
          setClases((prev) => {
            const exists = prev.some((p) => p.id === claseServidor.id);
            if (exists) return prev;
            return [...prev, claseServidor as any];
          });
        } else if (res.status === 409) {
          alert('La clase ya existe en el servidor.');
        } else {
          console.error('Error crear clase:', data);
          alert(data.error || 'Error creando la clase en el servidor.');
        }
      } catch (err) {
        console.error('Error enviando crear-clase:', err);
        alert('Error al comunicarse con el servidor al crear la clase.');
      }
    })();
    e.currentTarget.reset();
    setMostrarCrear(false);
  };

  const handleUnirseClase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const materia = formData.get("materia") as string;
    const codigo = formData.get("codigo") as string;
    console.log("Unido a clase:", { materia, codigo });
    e.currentTarget.reset();
    setMostrarUnirse(false);
  };

  return (
    <div className={styles.body}>
      <Header />
      <main>
        <div className={styles.mainLayout}>
          <div style={{ flex: "1 1 400px" }}>
            {mostrarCrear && (
              <section className={`${styles.formContainer} ${styles.slideIn}`}>
                <form onSubmit={handleCrearClase} noValidate>
                  <input className={styles.formInput} type="text" name="materia" placeholder="Materia" required />
                  <input className={styles.formInput} type="text" name="nombre" placeholder="Nombre de la clase" required />
                  <input className={styles.formInput} type="text" name="seccion" placeholder="Sección" required />
                  <input className={styles.formInput} type="text" name="aula" placeholder="Aula" required />
                  <input className={styles.formInput} type="text" name="creador" placeholder="Profesor" required />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Crear clase
                  </button>
                </form>
              </section>
            )}
            {mostrarUnirse && (
              <section className={`${styles.formContainer} ${styles.slideIn}`}>
                <form onSubmit={handleUnirseClase} noValidate>
                  <input className={styles.formInput} type="text" name="materia" placeholder="Materia" required />
                  <input className={styles.formInput} type="text" name="codigo" placeholder="Código de clase" required />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Unirse
                  </button>
                </form>
              </section>
            )}
          </div>

          <div style={{ flex: "2 1 600px" }}>
            <div className={styles.container}>
              <img
                src="/Educación Técnica y Herramientas (2).png"
                alt="Logo"
                className={styles.illustration}
              />
              <div className={styles.buttons}>
                {currentUser?.rol === 'profesor' && (
                  <button
                    className={`${styles.btn} ${styles.btnOutline}`}
                    onClick={() => {
                      setMostrarCrear(!mostrarCrear);
                      setMostrarUnirse(false);
                    }}
                  >
                    Crear clase
                  </button>
                )}
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={() => {
                    setMostrarUnirse(!mostrarUnirse);
                    setMostrarCrear(false);
                  }}
                >
                  Unirse a clase
                </button>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => fetchServerClasses()}
                >
                  Sincronizar con servidor
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.coursesList}>
          {clases.map((clase, index) => (
            <div key={index} className={styles.claseItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'left' }} onClick={() => navigate('/Foro')}>
                <h3>{clase.nombre}</h3>
                <p><strong>Materia:</strong> {clase.materia}</p>
                <p><strong>Sección:</strong> {clase.seccion}</p>
                <p><strong>Aula:</strong> {clase.aula}</p>
                <p><strong>Profesor:</strong> {clase.creador}</p>
                {clase.codigo && <p><strong>Código:</strong> {clase.codigo}</p>}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {/* Solicitar acceso: solo profesores pueden solicitar */}
                {currentUser?.rol === 'profesor' && (
                  accessMap[clase.id as number] ? (
                    <button className={styles.btn} disabled>Accedido</button>
                  ) : (
                      <button className={styles.btn} onClick={async () => { await solicitarAcceso(clase.id); await checkAccessForClass(clase.id); }}>
                        Solicitar acceso
                      </button>
                  )
                )}
                {/* Ver solicitudes: solo el titular de la clase */}
                {currentUser?.id && clase.titular_id && currentUser.id === clase.titular_id && (
                  <button className={styles.btn} onClick={() => abrirSolicitudes(clase.id)}>
                    Ver solicitudes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      {/* MODAL DE SOLICITUDES */}
      {pendingModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContenido}>
            <button className={styles.modalCerrar} onClick={() => setPendingModal({ open: false, solicitudes: [] })}>&times;</button>
            <h3>Solicitudes para clase #{pendingModal.claseId}</h3>
            {pendingModal.solicitudes.length === 0 ? (
              <p>No hay solicitudes pendientes.</p>
            ) : (
              <ul>
                {pendingModal.solicitudes.map((s, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    Profesor ID: {s.profesor_id} - Estado: {s.estado} - Solicitado: {new Date(s.solicitado_at).toLocaleString()}
                    <div>
                      <button className={styles.btn} onClick={() => aprobarSolicitud(s.id)}>Aprobar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Clases;
