import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrefetchProvider } from "@/providers/PrefetchProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/shared/AppLayout";
import { PageTransition } from "@/components/shared/PageTransition";
import { SplashScreen } from "@/components/shared/SplashScreen";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ClientsPage from "@/features/clients/ClientsPage";
import ClientDetailPage from "@/features/clients/ClientDetailPage";
import ProjectsPage from "@/features/projects/ProjectsPage";
import TasksPage from "@/features/tasks/TasksPage";
import TaskDetailPage from "@/features/tasks/TaskDetailPage";
import NotesPage from "@/features/notes/NotesPage";
import BillingPage from "@/features/billing/BillingPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes location={location} key={location.pathname}>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PageTransition>
                <Routes location={location}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/clients/:id" element={<ClientDetailPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:id" element={<TaskDetailPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <PrefetchProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </PrefetchProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
