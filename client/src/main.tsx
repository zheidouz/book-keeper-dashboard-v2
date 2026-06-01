import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/providers/AuthProvider";
import "./index.css";

// Clean up stale service workers from other projects
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Prevent flash of unstyled content
document.documentElement.style.setProperty("--mouse-x", "50%");
document.documentElement.style.setProperty("--mouse-y", "50%");

// Track cursor position for glow effect — RAF-throttled to avoid layout thrashing
// Uses AbortController so cleanup on pagehide enables back/forward cache
const abortController = new AbortController();
const signal = abortController.signal;
let rafId: number | null = null;
document.addEventListener("pointermove", (e) => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    rafId = null;
  });
}, { signal });

// Clean up on page hide to allow back/forward cache (bfcache)
window.addEventListener("pagehide", () => abortController.abort(), { once: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
