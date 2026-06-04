import React, { useState, useEffect, useCallback } from "react";
import styles from "../calendario.module.css";
import Header from "../components reutilizables/header";

const API_URL = "http://localhost:3001/api";

interface Nota {
  id_nota: number;
  titulo: string;
  descripcion?: string;
  fecha_evento: string;
}

export default function Calendario() {
  const hoy = new Date();
  const [mes, setMes] = useState<number>(hoy.getMonth());
  const [anio, setAnio] = useState<number>(hoy.getFullYear());
  const [notas, setNotas] = useState<Nota[]>([]);
  const [textoNota, setTextoNota] = useState<string>("");
  const [diaNota, setDiaNota] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Cargar notas del backend ---
  const cargarNotas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/calendario/notas`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Inicia sesión para ver tus notas del calendario.");
          return;
        }
        throw new Error("Error al cargar notas");
      }
      const data = await res.json();
      setNotas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError("No se pudieron cargar las notas.");
    }
  }, []);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  const cambiarMes = (valor: number) => {
    let nuevoMes = mes + valor;
    let nuevoAnio = anio;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio -= 1; }
    else if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio += 1; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  // --- Agregar nota al backend ---
  const agregarNota = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textoNota || !diaNota) return;

    const fecha_evento = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(diaNota).padStart(2, "0")}`;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/calendario/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titulo: textoNota, descripcion: "", fecha_evento }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al guardar la nota");
      }
      setTextoNota("");
      setDiaNota("");
      await cargarNotas();
    } catch (err: any) {
      setError(err.message || "Error al guardar la nota.");
    } finally {
      setLoading(false);
    }
  };

  // --- Eliminar nota del backend ---
  const eliminarNota = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/calendario/notas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar nota");
      await cargarNotas();
    } catch (err: any) {
      setError("No se pudo eliminar la nota.");
    }
  };

  const generarCalendario = () => {
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const calendario: { numero: number | ""; notas: Nota[] }[][] = [];
    let diaActual = 1;

    for (let fila = 0; fila < 6; fila++) {
      const semana: { numero: number | ""; notas: Nota[] }[] = [];
      for (let col = 0; col < 7; col++) {
        if ((fila === 0 && col < primerDia) || diaActual > diasEnMes) {
          semana.push({ numero: "", notas: [] });
        } else {
          const notasDelDia = notas.filter((n) => {
            const fechaNota = new Date(n.fecha_evento);
            return (
              fechaNota.getUTCDate() === diaActual &&
              fechaNota.getUTCMonth() === mes &&
              fechaNota.getUTCFullYear() === anio
            );
          });
          semana.push({ numero: diaActual, notas: notasDelDia });
          diaActual++;
        }
      }
      calendario.push(semana);
    }
    return calendario;
  };

  const nombreMes = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(anio, mes));

  useEffect(() => {
    document.title = `Calendario - ${nombreMes} ${anio}`;
  }, [nombreMes, anio]);

  const navLinks = [
    { label: "Zona de Trabajo", to: "/gestionClase" },
    { label: "Foro", to: "/foro" },
    { label: "Clases", to: "/clases" },
  ];

  return (
    <div>
      <Header navLinks={navLinks} />

      {error && (
        <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", margin: "1rem 2rem", fontSize: "0.9rem" }}>
          <i className="bx bx-error-circle" style={{ marginRight: "6px" }}></i>
          {error}
        </div>
      )}

      <main className={styles.contenedor}>
        <section className={styles.encabezado}>
          <button onClick={() => cambiarMes(-1)}>←</button>
          <h2>{`${nombreMes} ${anio}`}</h2>
          <button onClick={() => cambiarMes(1)}>→</button>
        </section>

        <form className={styles["formulario-nota"]} onSubmit={agregarNota}>
          <input
            type="text"
            placeholder="Escribí tu nota..."
            value={textoNota}
            onChange={(e) => setTextoNota(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Día (1-31)"
            min="1"
            max="31"
            value={diaNota}
            onChange={(e) => setDiaNota(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Agregar nota"}
          </button>
        </form>

        <table id={styles.calendario}>
          <thead>
            <tr>
              <th>Dom</th>
              <th>Lun</th>
              <th>Mar</th>
              <th>Mié</th>
              <th>Jue</th>
              <th>Vie</th>
              <th>Sáb</th>
            </tr>
          </thead>
          <tbody>
            {generarCalendario().map((semana, i) => (
              <tr key={i}>
                {semana.map((dia, j) => (
                  <td key={j}>
                    {dia.numero}
                    <ul>
                      {dia.notas.map((n, idx) => (
                        <li
                          key={n.id_nota}
                          className={styles[`nota-color-${idx % 10}`]}
                          title="Click para eliminar"
                          onClick={() => eliminarNota(n.id_nota)}
                          style={{ cursor: "pointer" }}
                        >
                          {n.titulo} ✕
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer>
        <p>Derechos de autor © 2025 EdutecHub</p>
      </footer>
    </div>
  );
}
