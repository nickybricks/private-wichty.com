import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Event from "./pages/Event";
import EditEvent from "./pages/EditEvent";
import HostProfile from "./pages/HostProfile";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Ticket from "./pages/Ticket";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";
import Explore from "./pages/Explore";
import ExploreCategory from "./pages/ExploreCategory";
import ExploreCity from "./pages/ExploreCity";
import UploadDemoImages from "./pages/UploadDemoImages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main landing page */}
          <Route path="/" element={<Landing />} />
          {/* Redirects */}
          <Route path="/wichtel-app" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/create" element={<Navigate to="/dashboard" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/category/:tag" element={<ExploreCategory />} />
          <Route path="/explore/city/:cityName" element={<ExploreCity />} />
          <Route path="/event/:id" element={<Event />} />
          <Route path="/event/:id/edit" element={<EditEvent />} />
          <Route path="/host/:id" element={<HostProfile />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/ratgeber" element={<Blog />} />
          <Route path="/ratgeber/:slug" element={<BlogPost />} />
          <Route path="/ticket/:ticketCode" element={<Ticket />} />
          <Route path="/admin/upload-demo-images" element={<UploadDemoImages />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <CookieConsent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
