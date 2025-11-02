import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./components/AuthContext";
import { SettingsProvider } from "./hooks/SettingsContext";
import { PendingCountProvider } from "./contexts/PendingCountContext";
import AppRoutes from "./AppRoutes.jsx"; // Uygulamanın tüm rotalarını içeren bileşeni import ediyoruz

function App() {
  return (
    <>
      <AuthProvider>
        <PendingCountProvider>
          <SettingsProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar
            />
            <AppRoutes />
          </SettingsProvider>
        </PendingCountProvider>
      </AuthProvider>
    </>
  );
}

export default App;
