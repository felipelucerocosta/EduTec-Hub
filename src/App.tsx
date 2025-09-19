import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registro from "../src/componentes/registro";
import Clases from "./componentes/clases";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/clases" element={<Clases />} />
      </Routes>
    </Router>
  );
}

export default App;
