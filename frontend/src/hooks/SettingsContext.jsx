import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext();

const getInitialSettings = () => {
  try {
    const storedSettings = localStorage.getItem("appSettings");
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      // Eğer kullanıcı tüm sütunları kaldırdıysa, varsayılanları geri yükle
      if (
        !parsedSettings.visibleColumns?.assignments ||
        parsedSettings.visibleColumns.assignments.length === 0
      ) {
        parsedSettings.visibleColumns.assignments = defaultColumns.assignments;
      }
      return parsedSettings;
    }
  } catch (error) {
    console.error("Ayarlar okunurken hata oluştu:", error);
  }
  // Varsayılan ayarlar
  return {
    itemsPerPage: 15,
    language: "tr",
    // Yeni eklenen ayar: Varsayılan olarak gösterilecek sütunlar
    visibleColumns: defaultColumns,
  };
};

const defaultColumns = {
  assignments: [
    "company.name",
    "item.assetType",
    "item.assetTag",
    "personnelName",
    "assignmentDate",
  ],
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
