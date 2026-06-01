import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AppShell } from "@/components/layout/AppShell";
import { TaoLogo } from "@/components/logo/LogoSvg";
import { useAuthStore } from "@/stores/auth-store";
import { SignIn, useUser } from "@clerk/clerk-react";
import React, { Suspense, lazy } from "react";

// Lazy-loaded pages for code splitting — each page loads only when needed
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const TaskDetail = lazy(() => import("@/pages/TaskDetail"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Forms = lazy(() => import("@/pages/Forms"));
const CustomForms = lazy(() => import("@/pages/CustomForms"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const FinishedTasks = lazy(() => import("@/pages/FinishedTasks"));
const SettingsUsers = lazy(() => import("@/pages/SettingsUsers"));

/**
 * Dev-mode login page with mock role selection.
 * Shown only when VITE_CLERK_PUBLISHABLE_KEY is NOT set.
 */
function DevLoginPage() {
  const { setUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleLogin = (role: "admin" | "manager" | "bookkeeper" | "encoder") => {
    const users = {
      admin: { id: 1, name: "System Admin", email: "admin@bookkeeper.app", role: "admin" as const },
      manager: { id: 2, name: "Jane Manager", email: "manager@bookkeeper.app", role: "manager" as const },
      bookkeeper: { id: 3, name: "John Bookkeeper", email: "bookkeeper@bookkeeper.app", role: "bookkeeper" as const },
      encoder: { id: 4, name: "Emma Encoder", email: "encoder@bookkeeper.app", role: "encoder" as const },
    };
    const u = users[role];
    setUser({ ...u, clerkId: u.role, createdAt: new Date().toISOString() });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="relative">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-blue-900/5 border border-white/50 max-w-md w-[calc(100vw-2rem)] sm:w-full mx-4">
          <div className="text-center mb-6">
            <div className="mb-4">
              <TaoLogo className="justify-center" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Select a role to continue (dev mode)</p>
          </div>
          <div className="space-y-2.5">
            {[
              { role: "admin" as const, label: "Admin", desc: "Full system access", color: "from-red-500 to-rose-600", border: "hover:border-red-200" },
              { role: "manager" as const, label: "Manager", desc: "Team oversight & reports", color: "from-blue-500 to-indigo-600", border: "hover:border-blue-200" },
              { role: "bookkeeper" as const, label: "Bookkeeper", desc: "Client & task management", color: "from-emerald-500 to-green-600", border: "hover:border-emerald-200" },
              { role: "encoder" as const, label: "Encoder", desc: "Data entry only", color: "from-slate-500 to-slate-600", border: "hover:border-slate-200" },
            ].map(({ role, label, desc, color, border }) => (
              <button key={role} onClick={() => handleLogin(role)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 transition-all duration-200 text-left group ${border}`}>
                <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow`}>
                  {label.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">Continue as {label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Development mode — Set <code className="text-xs bg-muted px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> for production auth.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Login page — auto-selects Clerk (prod) or mock (dev) based on env var.
 */
function LoginPage() {
  const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) return <Navigate to="/" replace />;

  if (!hasClerk) return <DevLoginPage />;

  // Production: Clerk handles auth via ClerkProvider in AuthProvider
  // The Zustand store gets synced by ClerkSync in AuthProvider
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <SignIn routing="hash" signUpUrl="/login" />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useAuthStore();
  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
            <Route path="/tasks" element={<SuspenseWrapper><Tasks /></SuspenseWrapper>} />
            <Route path="/tasks/:id" element={<SuspenseWrapper><TaskDetail /></SuspenseWrapper>} />
            <Route path="/clients" element={<SuspenseWrapper><Clients /></SuspenseWrapper>} />
            <Route path="/clients/:id" element={<SuspenseWrapper><ClientDetail /></SuspenseWrapper>} />
            <Route path="/forms" element={<SuspenseWrapper><Forms /></SuspenseWrapper>} />
            <Route path="/forms/custom" element={<SuspenseWrapper><CustomForms /></SuspenseWrapper>} />
            <Route path="/calendar" element={<SuspenseWrapper><Calendar /></SuspenseWrapper>} />
            <Route path="/finished-tasks" element={<SuspenseWrapper><FinishedTasks /></SuspenseWrapper>} />
            <Route path="/settings/users" element={<SuspenseWrapper><SettingsUsers /></SuspenseWrapper>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
