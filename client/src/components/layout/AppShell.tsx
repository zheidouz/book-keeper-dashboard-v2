import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

function Preloader() {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={exiting ? "preloader-exit" : "preloader"} aria-hidden="true">
      <div className="flex items-center gap-1.5">
        <div className="preloader-dot" />
        <div className="preloader-dot" />
        <div className="preloader-dot" />
      </div>
    </div>
  );
}

export function AppShell() {
  const { sidebarOpen } = useAuthStore();
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {showPreloader && <Preloader />}
      <div className="noise-overlay" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300 ease-out h-screen overflow-hidden relative z-[1]",
          "lg:ml-64",
          !sidebarOpen && "lg:ml-16"
        )}
      >
        <div className="fade-in h-full overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
