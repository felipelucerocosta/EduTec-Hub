import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

// === PAGES ===
import Home from "./componentes/Home";
import Registro from "./componentes/registro";
import ForgotPassword from "./componentes/ForgotPassword"; 
import ResetPassword from "./componentes/ResetPassword";   
import Dashboard from "./pages/Dashboard";
import Clases from "./componentes/clases";
import GestionClase from "./componentes/trabajosenclase";
import Foro from "./componentes/foro";
import Calendario from "./componentes/calendario";
import ClasesAlumno from "./comoponentesalumno/clasesalumno"; 
import TrabajosAlumno from "./comoponentesalumno/trabajosalumno";
import Profile from "./pages/Profile";
import AdminDashboard from "./componentes/AdminDashboard";
import Alfred from "./componentes/Alfred";                 
import NotFound from "./pages/NotFound";
// === NUEVAS PÁGINAS ===
import Rendimiento from "./pages/Rendimiento";
import Boletin from "./pages/Boletin";
import Simuladores from "./pages/Simuladores";
import TrabajoDetallePage from "./pages/TrabajoDetallePage";
import TrabajoProfesorPage from "./pages/TrabajoProfesorPage";


// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-dark)", color: "#94a3b8"
      }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: "2rem", color: "var(--primary)" }}></i>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/registro" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/forgot-password" element={<ForgotPassword />} /> 
      <Route path="/reset-password" element={<ResetPassword />} /> 

      {/* Protected Authenticated Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/clases" element={
        <ProtectedRoute allowedRoles={["profesor", "admin"]}>
          <Clases />
        </ProtectedRoute>
      } />

      <Route path="/gestionClase/:claseId" element={
        <ProtectedRoute allowedRoles={["profesor", "admin"]}>
          <GestionClase />
        </ProtectedRoute>
      } />

      <Route path="/alumno" element={
        <ProtectedRoute allowedRoles={["alumno", "admin"]}>
          <ClasesAlumno />
        </ProtectedRoute>
      } />

      <Route path="/alumno/gestion/:claseId" element={
        <ProtectedRoute allowedRoles={["alumno", "admin"]}>
          <TrabajosAlumno />
        </ProtectedRoute>
      } />

      <Route path="/foro" element={
        <ProtectedRoute>
          <Foro />
        </ProtectedRoute>
      } />

      <Route path="/calendario" element={
        <ProtectedRoute>
          <Calendario />
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* === NUEVAS RUTAS === */}
      <Route path="/rendimiento" element={
        <ProtectedRoute>
          <Rendimiento />
        </ProtectedRoute>
      } />

      <Route path="/boletin" element={
        <ProtectedRoute allowedRoles={["alumno", "admin"]}>
          <Boletin />
        </ProtectedRoute>
      } />

      <Route path="/simuladores/:claseId" element={
        <ProtectedRoute>
          <Simuladores />
        </ProtectedRoute>
      } />

      <Route path="/trabajo/:trabajoId" element={
        <ProtectedRoute allowedRoles={["alumno", "admin"]}>
          <TrabajoDetallePage />
        </ProtectedRoute>
      } />

      <Route path="/gestionClase/:claseId/trabajo/:trabajoId" element={
        <ProtectedRoute allowedRoles={["profesor", "admin"]}>
          <TrabajoProfesorPage />
        </ProtectedRoute>
      } />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>


  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <AppRoutes />
          {/* Alfred floating chatbot */}
          <Alfred />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
