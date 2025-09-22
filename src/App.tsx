
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";

// 👇 Importa respetando mayúsculas y carpetas
import Registro from "../src/componentes/registro";
import Clases from "./componentes/clases";
import GestionClase from "./componentes/trabajosenclase"; 
import Foro from "./componentes/foro";                     
import Calendario from "./componentes/calendario";  


function App() {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/clases" element={<Clases />} />
        <Route path="/gestionClase" element={<GestionClase />} />
        <Route path="/foro" element={<Foro />} />
        <Route path="/calendario" element={<Calendario />} />
      </Routes>
    </Router>
  );
}

export default App;