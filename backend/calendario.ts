//nav
export {};
const abrir = document.querySelector<HTMLElement>("#abrir-nav");
const cerrar = document.querySelector<HTMLElement>("#cerrar-nav");
const nav = document.querySelector<HTMLElement>(".nav-bar");

if (abrir && nav) {
  abrir.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}

if (cerrar && nav) {
  cerrar.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}

const cuerpo = document.getElementById('cuerpo-calendario') as HTMLTableSectionElement | null;
const mesAnio = document.getElementById('mes-anio') as HTMLElement | null;
let fecha: Date = new Date();
let celdas: Record<string, HTMLTableCellElement> = {}; // Mapa para acceder a las celdas por día y columna

function generarCalendario(fechaBase: Date): void {
  if (!cuerpo || !mesAnio) return;

  cuerpo.innerHTML = '';
  celdas = {};

  const año = fechaBase.getFullYear();
  const mes = fechaBase.getMonth();
  const primerDia = new Date(año, mes, 1).getDay();
  const diasMes = new Date(año, mes + 1, 0).getDate();

  mesAnio.textContent = fechaBase.toLocaleString('es-ES', {
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  let dia = 1;

  while (dia <= diasMes) {
    const fila = document.createElement('tr');

    for (let i = 0; i < 7; i++) {
      const celda = document.createElement('td');

      if (dia === 1 && i < primerDia) {
        // Celdas vacías antes del primer día
        fila.appendChild(celda);
      } else if (dia <= diasMes) {
        // Crear celda con número de día
        celda.innerHTML = `
          <div class="dia-num">${dia}</div>
          <div class="contenido-nota" id="dia-${dia}-${i}"></div>
        `;
        celdas[`${dia}-${i}`] = celda;
        dia++;
        fila.appendChild(celda);
      } else {
        // Celdas vacías después del último día
        fila.appendChild(celda);
      }
    }

    cuerpo.appendChild(fila);
  }
}

generarCalendario(fecha);
