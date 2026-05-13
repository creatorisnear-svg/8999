import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// When deployed as a standalone app (e.g. Koyeb), point the API client at the
// separate API server. Falls back to a relative base (same-origin proxy) for
// Replit and other same-host deployments.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
