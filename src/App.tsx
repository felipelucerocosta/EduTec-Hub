import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registro from "../src/componentes/registro";
import Clases from "./componentes/clases";
import GestionClase from "./componentes/trabajosenclase"; // 👈 export default
import Foro from "./componentes/foro";                     // 👈 export default
import Calendario from "./componentes/calendario";         // 👈 export default

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/clases" element={<Clases />} />
        <Route path="/GestionClase" element={<GestionClase />} />
        <Route path="/Foro" element={<Foro />} />
        <Route path="/Calendario" element={<Calendario />} />
      </Routes>
    </Router>
  );
}

export default App;
