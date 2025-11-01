import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import axiosInstance from "../api/axiosInstance";

const SettingsContext = createContext();

const defaultColumns = {
  assignments: [
    // Kullanıcının ilk gördüğünde en anlamlı olacak sütunları varsayılan yapalım
    "personnel.fullName",
    "item.assetType",
    "item.assetTag",
    "item.brand",
    "company.name",
    "assignmentDate",
  ],
};

export const defaultSettings = {
  itemsPerPage: 15,
  language: "tr",
  emailOnNewAssignment: true,
  emailOnStatusChange: true,
  visibleColumns: defaultColumns,
};

export const SettingsProvider = ({ children }) => {
  // Başlangıçta varsayılan ayarları kullan, API'dan gelen veri bunu güncelleyecek.
  const [settings, setSettings] = useState(defaultSettings);
  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (userInfo) {
        try {
          const { data } = await axiosInstance.get("/users/settings");
          // Kullanıcının kaydettiği ayarları, varsayılanların üzerine "derinlemesine" yaz.
          const mergedSettings = {
            ...defaultSettings,
            ...data,
            visibleColumns: {
              ...defaultSettings.visibleColumns,
              ...data?.visibleColumns,
            },
          };
          setSettings(mergedSettings);
        } catch (error) {
          console.error("Kullanıcı ayarları çekilemedi:", error);
          // Hata durumunda varsayılan ayarlarla devam et
          setSettings(defaultSettings);
        }
      }
    };

    fetchUserSettings();
  }, [userInfo]); // Kullanıcı giriş yaptığında veya değiştiğinde ayarları çek

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
