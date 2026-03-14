import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrefetchProvider } from "@/providers/PrefetchProvider";
import { AppLayout } from "@/components/shared/AppLayout";
import { PageTransition } from "@/components/shared/PageTransition";
import DashboardPage from "@/features/dashboard/DashboardPage";
import ClientsPage from "@/features/clients/ClientsPage";
import ProjectsPage from "@/features/projects/ProjectsPage";
import TasksPage from "@/features/tasks/TasksPage";
import NotesPage from "@/features/notes/NotesPage";
import BillingPage from "@/features/billing/BillingPage";
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

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AppLayout>
      <PageTransition>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <PrefetchProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PrefetchProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
