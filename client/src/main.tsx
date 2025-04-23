import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from "@radix-ui/react-toast";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </GoogleOAuthProvider>
);
