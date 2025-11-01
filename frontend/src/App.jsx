import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./components/AuthContext";
import { SettingsProvider } from "./hooks/SettingsContext";
import { PendingCountProvider } from "./contexts/PendingCountContext";
import AppRoutes from "./AppRoutes"; // Yeni route bileşenimizi import ediyoruz

function App() {
  return (
    <>
      {/* <BrowserRouter> */}
      <AuthProvider>
        {" "}
        {/* AuthProvider'ı BrowserRouter içine alıyoruz */}
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
      {/* </BrowserRouter> */}
    </>
  );
}

export default App;
