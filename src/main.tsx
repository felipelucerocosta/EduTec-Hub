import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Registro from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Registro />
  </StrictMode>
);
