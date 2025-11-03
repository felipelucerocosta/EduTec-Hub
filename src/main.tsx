import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // 👈 CORRECCIÓN: La ruta era "../src/App"

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App /> {/* Ahora cargas App con las rutas */}
  </StrictMode>
);