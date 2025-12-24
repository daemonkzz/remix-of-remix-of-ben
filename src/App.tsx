import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Kurallar from "./pages/Kurallar";
import Guncellemeler from "./pages/Guncellemeler";
import GuncellemeDetay from "./pages/GuncellemeDetay";
import Hikaye from "./pages/Hikaye";
import Basvuru from "./pages/Basvuru";
import BasvuruForm from "./pages/BasvuruForm";
import Admin from "./pages/Admin";
import AdminBasvuruDetay from "./pages/AdminBasvuruDetay";
import FormBuilder from "./pages/admin/FormBuilder";
import NotFound from "./pages/NotFound";
import AmbientParticles from "./components/AmbientParticles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AmbientParticles />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kurallar" element={<Kurallar />} />
            <Route path="/guncellemeler" element={<Guncellemeler />} />
            <Route path="/guncellemeler/:id" element={<GuncellemeDetay />} />
            <Route path="/hikaye" element={<Hikaye />} />
            <Route path="/basvuru" element={<Basvuru />} />
            <Route path="/basvuru/:formId" element={<BasvuruForm />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/basvuru/:id" element={<AdminBasvuruDetay />} />
            <Route path="/admin/form-builder" element={<FormBuilder />} />
            <Route path="/admin/form-builder/:id" element={<FormBuilder />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
