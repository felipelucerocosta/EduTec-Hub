import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../src/App"; // 👈 Cambia Registro por App

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App /> {/* 👈 Ahora cargas App con las rutas */}
  </StrictMode>
);
