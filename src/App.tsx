import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Kurallar from "./pages/Kurallar";
import Guncellemeler from "./pages/Guncellemeler";
import GuncellemeDetay from "./pages/GuncellemeDetay";
import Hikaye from "./pages/Hikaye";
import Basvuru from "./pages/Basvuru";
import NotFound from "./pages/NotFound";
import AmbientParticles from "./components/AmbientParticles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
