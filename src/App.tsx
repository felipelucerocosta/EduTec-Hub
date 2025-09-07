import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registro from "./registro";
import Clases from "./clases";

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
