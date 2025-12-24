import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminSessionProvider } from "./contexts/AdminSessionContext";
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
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
import UpdateEditor from "./pages/admin/UpdateEditor";
import RulesEditor from "./pages/admin/RulesEditor";
import Gallery from "./pages/admin/Gallery";
import ManageAccess from "./pages/admin/ManageAccess";
import Locked from "./pages/admin/Locked";
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
            
            {/* Admin Routes - Protected with 2FA */}
            <Route path="/admin/*" element={
              <AdminSessionProvider>
                <AdminRouteGuard>
                  <Routes>
                    <Route index element={<Admin />} />
                    <Route path="basvuru/:id" element={<AdminBasvuruDetay />} />
                    <Route path="form-builder" element={<FormBuilder />} />
                    <Route path="form-builder/:id" element={<FormBuilder />} />
                    <Route path="update-editor" element={<UpdateEditor />} />
                    <Route path="update-editor/:id" element={<UpdateEditor />} />
                    <Route path="rules-editor" element={<RulesEditor />} />
                    <Route path="gallery" element={<Gallery />} />
                    <Route path="manage-access" element={<ManageAccess />} />
                    <Route path="locked" element={<Locked />} />
                  </Routes>
                </AdminRouteGuard>
              </AdminSessionProvider>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
