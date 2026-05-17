import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// === RUTAS CORREGIDAS ===
import Registro from "./componentes/registro";
import Clases from "./componentes/clases";
import GestionClase from "./componentes/trabajosenclase";
import Foro from "./componentes/foro";
import Calendario from "./componentes/calendario";
import GaleriaSimulaciones from "./componentes/simulaciones";
import ClasesAlumno from "./comoponentesalumno/clasesalumno"; 
import TrabajosAlumno from "./comoponentesalumno/trabajosalumno";

// === NUEVOS COMPONENTES ===
import ForgotPassword from "./componentes/ForgotPassword"; 
import ResetPassword from "./componentes/ResetPassword";   
import Alfred from "./componentes/Alfred";                 

function App() {
  return (
    <Router basename="/EduTec-Hub/">   {/* 👈 AGREGADO PARA GITHUB PAGES */}

      <Routes>
        {/* Rutas existentes */}
        <Route path="/" element={<Registro />} />
        <Route path="/clases" element={<Clases />} />
        <Route path="/gestionClase" element={<GestionClase />} />
        <Route path="/foro" element={<Foro />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/simulaciones" element={<GaleriaSimulaciones />} />
        <Route path="/alumno" element={<ClasesAlumno />} />
        <Route path="/alumno/gestion" element={<TrabajosAlumno />} />
        
        {/* === NUEVAS RUTAS === */}
        <Route path="/forgot-password" element={<ForgotPassword />} /> 
        <Route path="/reset-password" element={<ResetPassword />} /> 
      </Routes>

      {/* Alfred se renderiza fuera de <Routes> para estar en todas las páginas */}
      <Alfred />

    </Router>
  );
}

export default App;
