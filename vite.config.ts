import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/EduTec-Hub/",   // 👈 IMPORTANTE PARA GITHUB PAGES
  plugins: [react()],
});
