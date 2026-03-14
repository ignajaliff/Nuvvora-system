// Mock data layer — will be replaced by Supabase queries later

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'development' | 'maintenance' | 'staging';
  createdAt: string;
  stack: string;
  version: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: 'in_progress' | 'completed' | 'paused';
  progress: number;
  dueDate: string;
  budget: number;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  linkedTo?: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  projectName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedAt: string;
  dueDate: string;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const mockClients: Client[] = [
  { id: '1', name: 'Carlos Mendez', email: 'carlos@techcorp.com', company: 'TechCorp', status: 'development', createdAt: '2025-01-15', stack: 'React + Vite', version: '2.1.0' },
  { id: '2', name: 'Laura Vásquez', email: 'laura@designstudio.co', company: 'Design Studio', status: 'maintenance', createdAt: '2025-02-20', stack: 'Next.js + Tailwind', version: '1.3.2' },
  { id: '3', name: 'Miguel Ángel Rivas', email: 'miguel@startupx.io', company: 'StartupX', status: 'staging', createdAt: '2025-03-01', stack: 'React + Supabase', version: '0.9.1' },
  { id: '4', name: 'Ana Belén Torres', email: 'ana@mediaco.com', company: 'MediaCo', status: 'maintenance', createdAt: '2024-11-10', stack: 'Vue + Firebase', version: '3.0.4' },
  { id: '5', name: 'Roberto Díaz', email: 'roberto@finserv.com', company: 'FinServ', status: 'development', createdAt: '2025-01-28', stack: 'React + Node.js', version: '1.0.0' },
];

export const mockProjects: Project[] = [
  { id: '1', name: 'E-commerce Platform', clientId: '1', clientName: 'TechCorp', status: 'in_progress', progress: 72, dueDate: '2026-04-15', budget: 15000 },
  { id: '2', name: 'Brand Redesign', clientId: '2', clientName: 'Design Studio', status: 'in_progress', progress: 45, dueDate: '2026-05-01', budget: 8000 },
  { id: '3', name: 'MVP Development', clientId: '3', clientName: 'StartupX', status: 'in_progress', progress: 30, dueDate: '2026-06-30', budget: 25000 },
  { id: '4', name: 'Marketing Site', clientId: '4', clientName: 'MediaCo', status: 'completed', progress: 100, dueDate: '2026-01-15', budget: 5000 },
  { id: '5', name: 'API Integration', clientId: '5', clientName: 'FinServ', status: 'paused', progress: 60, dueDate: '2026-04-30', budget: 12000 },
];

export const mockTasks: Task[] = [
  { id: '1', title: 'Setup payment gateway', projectId: '1', projectName: 'E-commerce Platform', status: 'in_progress', priority: 'high', dueDate: '2026-03-20' },
  { id: '2', title: 'Design product pages', projectId: '1', projectName: 'E-commerce Platform', status: 'todo', priority: 'medium', dueDate: '2026-03-25' },
  { id: '3', title: 'Create logo variants', projectId: '2', projectName: 'Brand Redesign', status: 'done', priority: 'high', dueDate: '2026-03-10' },
  { id: '4', title: 'User auth flow', projectId: '3', projectName: 'MVP Development', status: 'in_progress', priority: 'high', dueDate: '2026-03-18' },
  { id: '5', title: 'API documentation', projectId: '5', projectName: 'API Integration', status: 'todo', priority: 'low', dueDate: '2026-04-05' },
  { id: '6', title: 'Color palette selection', projectId: '2', projectName: 'Brand Redesign', status: 'in_progress', priority: 'medium', dueDate: '2026-03-22' },
  { id: '7', title: 'Deploy staging env', projectId: '3', projectName: 'MVP Development', status: 'todo', priority: 'medium', dueDate: '2026-03-28' },
];

export const mockNotes: Note[] = [
  { id: '1', title: 'Meeting notes - TechCorp', content: 'Discussed payment integration options. Client prefers Stripe.', linkedTo: 'TechCorp', updatedAt: '2026-03-12' },
  { id: '2', title: 'Design inspiration', content: 'Minimalist approach with bold typography. Reference: Linear, Vercel.', updatedAt: '2026-03-10' },
  { id: '3', title: 'StartupX requirements', content: 'Need user auth, dashboard, and API. Timeline is tight.', linkedTo: 'StartupX', updatedAt: '2026-03-08' },
  { id: '4', title: 'Invoice reminder', content: 'Send Q1 invoices to all active clients by March 31.', updatedAt: '2026-03-05' },
];

export const mockInvoices: Invoice[] = [
  { id: '1', clientName: 'TechCorp', projectName: 'E-commerce Platform', amount: 7500, status: 'paid', issuedAt: '2026-02-01', dueDate: '2026-03-01' },
  { id: '2', clientName: 'Design Studio', projectName: 'Brand Redesign', amount: 4000, status: 'sent', issuedAt: '2026-03-01', dueDate: '2026-03-31' },
  { id: '3', clientName: 'StartupX', projectName: 'MVP Development', amount: 12500, status: 'draft', issuedAt: '2026-03-10', dueDate: '2026-04-10' },
  { id: '4', clientName: 'MediaCo', projectName: 'Marketing Site', amount: 5000, status: 'paid', issuedAt: '2025-12-15', dueDate: '2026-01-15' },
  { id: '5', clientName: 'FinServ', projectName: 'API Integration', amount: 6000, status: 'overdue', issuedAt: '2026-01-15', dueDate: '2026-02-15' },
];

// Simulated API calls (will be replaced with Supabase)
export const api = {
  getClients: async (): Promise<Client[]> => { await delay(100); return mockClients; },
  getProjects: async (): Promise<Project[]> => { await delay(100); return mockProjects; },
  getTasks: async (): Promise<Task[]> => { await delay(100); return mockTasks; },
  getNotes: async (): Promise<Note[]> => { await delay(100); return mockNotes; },
  getInvoices: async (): Promise<Invoice[]> => { await delay(100); return mockInvoices; },
};
