import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SAO from "./pages/SAO";
import Explore from "./pages/Explore";
import CreateOrganization from "./pages/CreateOrganization";
import OrganizationManage from "./pages/OrganizationManage";
import Organization from "./pages/Organization";
import OrganizationDocuments from "./pages/OrganizationDocuments";
import Admin from "./pages/Admin";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import ProfileView from "./pages/ProfileView"
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explore" element={<Explore />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sao"
                element={
                  <ProtectedRoute>
                    <SAO />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-organization"
                element={
                  <ProtectedRoute>
                    <CreateOrganization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/org/:id/manage"
                element={
                  <ProtectedRoute>
                    <OrganizationManage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/org/:id"
                element={
                  <ProtectedRoute>
                    <Organization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/org/:id/documents"
                element={
                  <ProtectedRoute>
                    <OrganizationDocuments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;