import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminSessionProvider } from "./contexts/AdminSessionContext";
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import Index from "./pages/Index";
import Kurallar from "./pages/Kurallar";
import Guncellemeler from "./pages/Guncellemeler";
import GuncellemeDetay from "./pages/GuncellemeDetay";
import Hikaye from "./pages/Hikaye";
import Basvuru from "./pages/Basvuru";
import BasvuruForm from "./pages/BasvuruForm";
import BasvuruRevision from "./pages/BasvuruRevision";
import Admin from "./pages/Admin";
import AdminBasvuruDetay from "./pages/AdminBasvuruDetay";
import FormBuilder from "./pages/admin/FormBuilder";
import UpdateEditor from "./pages/admin/UpdateEditor";
import RulesEditor from "./pages/admin/RulesEditor";
import Gallery from "./pages/admin/Gallery";
import ManageAccess from "./pages/admin/ManageAccess";
import NotificationEditor from "./pages/admin/NotificationEditor";
import WhiteboardEditor from "./pages/admin/WhiteboardEditor";
import Locked from "./pages/admin/Locked";
import LiveMap from "./pages/LiveMap";
import NotFound from "./pages/NotFound";
import AmbientParticles from "./components/AmbientParticles";

const queryClient = new QueryClient();

const RouteEffects = () => {
  const location = useLocation();
  const showParticles = !location.pathname.startsWith("/canli-harita");

  return (
    <>
      {showParticles && <AmbientParticles />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/kurallar" element={<Kurallar />} />
        <Route path="/guncellemeler" element={<Guncellemeler />} />
        <Route path="/guncellemeler/:id" element={<GuncellemeDetay />} />
        <Route path="/hikaye" element={<Hikaye />} />
        <Route path="/basvuru" element={<Basvuru />} />
        <Route path="/basvuru/:formId" element={<BasvuruForm />} />
        <Route path="/basvuru/:formId/revision" element={<BasvuruRevision />} />
        <Route path="/canli-harita" element={<LiveMap />} />

        {/* Admin Routes - Protected with 2FA */}
        <Route
          path="/admin/*"
          element={
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
                  <Route path="notification-editor" element={<NotificationEditor />} />
                  <Route path="whiteboard-editor" element={<WhiteboardEditor />} />
                  <Route path="locked" element={<Locked />} />
                </Routes>
              </AdminRouteGuard>
            </AdminSessionProvider>
          }
        />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <BrowserRouter>
            <RouteEffects />
          </BrowserRouter>
        </AppErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
