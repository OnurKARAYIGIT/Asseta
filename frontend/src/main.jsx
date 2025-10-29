import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.jsx";
import { AuthProvider } from "./components/AuthContext.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";
import { SettingsProvider } from "./hooks/SettingsContext.jsx"; // SettingsProvider'ı da ekleyelim
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
// import "./pages/print.css"; // Yazdırma stillerini ekle

// 1. Bir React Query istemcisi (client) oluştur
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. Uygulamanızı QueryClientProvider ile sarmalayın */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
