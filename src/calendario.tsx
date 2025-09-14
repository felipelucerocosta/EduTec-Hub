import React, { useState, useEffect } from "react";
import "./calendario.css";
import Header2 from "../src/components reutilizables/header2"; // 👈 importa correctamente

interface Nota {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_evento: string;
}

const STORAGE_KEY = "calendario_notas";

const getNotas = (): Nota[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveNotas = (notas: Nota[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
};

export default function Calendario() {
  const hoy = new Date();
  const [mes, setMes] = useState<number>(hoy.getMonth());
  const [anio, setAnio] = useState<number>(hoy.getFullYear());
  const [notas, setNotas] = useState<Nota[]>([]);

  const [textoNota, setTextoNota] = useState<string>("");
  const [diaNota, setDiaNota] = useState<string>("");

  useEffect(() => {
    setNotas(getNotas());
  }, []);

  const cambiarMes = (valor: number) => {
    let nuevoMes = mes + valor;
    let nuevoAnio = anio;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }

    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  const agregarNota = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!textoNota || !diaNota) return;

    const fecha_evento = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(
      diaNota
    ).padStart(2, "0")}`;

    const nuevaNota: Nota = {
      id: Date.now(),
      titulo: textoNota,
      descripcion: "",
      fecha_evento,
    };

    const nuevasNotas = [...notas, nuevaNota];
    setNotas(nuevasNotas);
    saveNotas(nuevasNotas);

    setTextoNota("");
    setDiaNota("");
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

  const nombreMes = new Intl.DateTimeFormat("es-ES", {
    month: "long",
  }).format(new Date(anio, mes));

  useEffect(() => {
    document.title = `Calendario - ${nombreMes} ${anio}`;
  }, [nombreMes, anio]);

  return (
    <div>
      <header>
        <Header2 /> {/* 👈 ahora sí */}
      </header>

      <main className="contenedor">
        <section className="encabezado">
          <button onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
            ←
          </button>
          <h2>{`${nombreMes} ${anio}`}</h2>
          <button onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
            →
          </button>
        </section>

        <form className="formulario-nota" onSubmit={agregarNota}>
          <input
            type="text"
            placeholder="Escribí tu nota..."
            value={textoNota}
            onChange={(e) => setTextoNota(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Día (1-31)"
            min="1"
            max="31"
            value={diaNota}
            onChange={(e) => setDiaNota(e.target.value)}
            required
          />
          <button type="submit">Agregar nota</button>
        </form>

        <table id="calendario">
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
                      {dia.notas.map((n) => (
                        <li key={n.id}>{n.titulo}</li>
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
        <p>Derechos de autor © 2024 EdutecHub</p>
      </footer>
    </div>
  );
}
