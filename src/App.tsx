import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { ProtectedGhasRoute } from "@/components/ProtectedGhasRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Administracao from "./pages/Administracao";
import Registro from "./pages/Registro";
import RegistroGlobal from "./pages/RegistroGlobal";
import FeedbackGhas from "./pages/FeedbackGhas";
import Feedback from "./pages/Feedback";
import Calculo from "./pages/Calculo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administracao"
              element={
                <ProtectedAdminRoute>
                  <Administracao />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/registro"
              element={
                <ProtectedRoute>
                  <Registro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registro-global"
              element={
                <ProtectedGhasRoute>
                  <RegistroGlobal />
                </ProtectedGhasRoute>
              }
            />
            <Route
              path="/feedback-ghas"
              element={
                <ProtectedGhasRoute>
                  <FeedbackGhas />
                </ProtectedGhasRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calculo"
              element={
                <ProtectedRoute>
                  <Calculo />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
