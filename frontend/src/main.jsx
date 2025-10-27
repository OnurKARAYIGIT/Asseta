import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./components/AuthContext.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import "./pages/print.css"; // Yazdırma stillerini ekle

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
