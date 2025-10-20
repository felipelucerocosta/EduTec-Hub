import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 👇 Importa respetando mayúsculas y carpetas
import Registro from "../src/componentes/registro";
import Clases from "./componentes/clases";
import GestionClase from "./componentes/trabajosenclase";
import Foro from "./componentes/foro";
import Calendario from "./componentes/calendario";
<<<<<<< HEAD

=======
// 👇 Como GaleriaSimulaciones es export default se importa SIN llaves
>>>>>>> 8f54c20 (first commit)
import GaleriaSimulaciones from "./componentes/simulaciones"; 
// Vistas para alumno
import ClasesAlumno from "./comoponentesalumno/clasesalumno";
import TrabajosAlumno from "./comoponentesalumno/trabajosalumno";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/clases" element={<Clases />} />
        <Route path="/gestionClase" element={<GestionClase />} />
<<<<<<< HEAD
        {/* Rutas para vistas de alumno */}
        <Route path="/alumno" element={<ClasesAlumno />} />
        <Route path="/alumno/gestion" element={<TrabajosAlumno />} />
=======
  {/* Rutas para vistas de alumno */}
  <Route path="/alumno" element={<ClasesAlumno />} />
  <Route path="/alumno/gestion" element={<TrabajosAlumno />} />
>>>>>>> 8f54c20 (first commit)
        <Route path="/foro" element={<Foro />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/simulaciones" element={<GaleriaSimulaciones />} />
      </Routes>
    </Router>
  );
}

export default App;
