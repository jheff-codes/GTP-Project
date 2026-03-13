import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Painel";
import Clientes from "./pages/Clientes";
import Properties from "./pages/Imoveis";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import GestaoEquipe from "./pages/GestaoEquipe";
import NotFound from "./pages/NotFound";
import Development from "./pages/Desenvolvedor";
import Disparos from "./pages/Disparos";
import { RootAuthHandler } from "@/components/auth/RootAuthHandler";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          {/* Root Route: Login (if guest) or Dashboard (if auth) */}
          <Route path="/" element={<RootAuthHandler />} />

          {/* Protected Routes - require authentication */}
          <Route element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              {/* Dashboard is handled by RootAuthHandler at "/", so we don't need it here unless we want "/dashboard" alias */}
              {/* But RootAuthHandler renders MainLayout > Dashboard internally for "/" */}

              <Route path="/leads" element={<Clientes />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/disparos" element={<Disparos />} />
              <Route path="/team" element={<GestaoEquipe />} />
              <Route path="/settings" element={<Configuracoes />} />
              <Route path="/development" element={<Development />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
