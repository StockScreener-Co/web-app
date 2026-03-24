import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@/lib/api-client";

// Set base URL for API calls in production
if (import.meta.env.PROD) {
  setBaseUrl(import.meta.env.VITE_API_URL || "https://core-production-bdad.up.railway.app");
}

createRoot(document.getElementById("root")!).render(<App />);
