import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminSessionProvider } from "./contexts/AdminSessionContext";
import { AdminEditorStateProvider } from "./contexts/AdminEditorStateContext";
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import PageLoader from "./components/PageLoader";

// Public pages - direct import
import Index from "./pages/Index";
import Kurallar from "./pages/Kurallar";
import Guncellemeler from "./pages/Guncellemeler";
import GuncellemeDetay from "./pages/GuncellemeDetay";
import Hikaye from "./pages/Hikaye";
import GizlilikSozlesmesi from "./pages/GizlilikSozlesmesi";
import Basvuru from "./pages/Basvuru";
import BasvuruForm from "./pages/BasvuruForm";
import BasvuruRevision from "./pages/BasvuruRevision";
import NotFound from "./pages/NotFound";
import AmbientParticles from "./components/AmbientParticles";

// Admin pages - lazy loaded for better performance
const Admin = lazy(() => import("./pages/Admin"));
const AdminBasvuruDetay = lazy(() => import("./pages/AdminBasvuruDetay"));
const FormBuilder = lazy(() => import("./pages/admin/FormBuilder"));
const UpdateEditor = lazy(() => import("./pages/admin/UpdateEditor"));
const RulesEditor = lazy(() => import("./pages/admin/RulesEditor"));
const Gallery = lazy(() => import("./pages/admin/Gallery"));
const ManageAccess = lazy(() => import("./pages/admin/ManageAccess"));
const NotificationEditor = lazy(() => import("./pages/admin/NotificationEditor"));
const WhiteboardEditor = lazy(() => import("./pages/admin/WhiteboardEditor"));
const Locked = lazy(() => import("./pages/admin/Locked"));
const GlossaryEditor = lazy(() => import("./pages/admin/GlossaryEditor"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const PermissionsEditor = lazy(() => import("./pages/admin/PermissionsEditor"));

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
        <Route path="/gizlilik-sozlesmesi" element={<GizlilikSozlesmesi />} />
        <Route path="/basvuru" element={<Basvuru />} />
        <Route path="/basvuru/:formId" element={<BasvuruForm />} />
        <Route path="/basvuru/:formId/revision" element={<BasvuruRevision />} />

        {/* Admin Routes - Protected with 2FA, Lazy Loaded */}
        <Route
          path="/admin/*"
          element={
            <AdminSessionProvider>
              <AdminEditorStateProvider>
                <AdminRouteGuard>
                  <Suspense fallback={<PageLoader />}>
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
                      <Route path="glossary-editor" element={<GlossaryEditor />} />
                      <Route path="users" element={<UsersManagement />} />
                      <Route path="permissions" element={<PermissionsEditor />} />
                      <Route path="locked" element={<Locked />} />
                    </Routes>
                  </Suspense>
                </AdminRouteGuard>
              </AdminEditorStateProvider>
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
