import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent PWA install prompt from showing automatically
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
