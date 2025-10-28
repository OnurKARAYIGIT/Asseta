import React, { useState, useEffect } from "react";
import { history } from "../history.js";
import { FaCog, FaSave } from "react-icons/fa";
import Modal from "../components/Modal";
import { useSettings } from "../hooks/SettingsContext";
import { toast } from "react-toastify";
import "./SettingsPage.css";

// Yeni oluşturduğumuz bileşenleri import edelim
import NotificationSettings from "../components/settings/NotificationSettings";
import DisplaySettings from "../components/settings/DisplaySettings";
import ColumnManager from "../components/settings/ColumnManager";
import AccountSecurity from "../components/settings/AccountSecurity";

// Tüm olası sütunların listesi
const allAssignmentColumns = [
  { key: "company.name", name: "Çalıştığı Firma", group: "Zimmet" },
  { key: "personnelName", name: "Kullanıcı Adı", group: "Zimmet" },
  { key: "unit", name: "Bulunduğu Birim", group: "Zimmet" },
  { key: "location", name: "Bulunduğu Yer", group: "Zimmet" },
  { key: "registeredSection", name: "Kayıtlı Bölüm", group: "Zimmet" },
  { key: "previousUser", name: "Eski Kullanıcı", group: "Zimmet" },
  { key: "assignmentNotes", name: "Açıklama", group: "Zimmet" },
  { key: "assignmentDate", name: "Zimmet Tarihi", group: "Zimmet" },
  { key: "item.name", name: "Eşya Adı", group: "Eşya" },
  { key: "item.assetTag", name: "Demirbaş No", group: "Eşya" },
  { key: "item.assetType", name: "Varlık Cinsi", group: "Eşya" },
  { key: "item.assetSubType", name: "Varlık Alt Kategori", group: "Eşya" },
  { key: "item.fixedAssetType", name: "Sabit Kıymet Cinsi", group: "Eşya" },
  { key: "item.brand", name: "Marka", group: "Eşya" },
  { key: "item.modelYear", name: "Model Yılı", group: "Eşya" },
  { key: "item.serialNumber", name: "Seri No", group: "Eşya" },
  { key: "item.networkInfo", name: "Mac/IP Adresi", group: "Eşya" },
  { key: "item.softwareInfo", name: "Kurulu Programlar", group: "Eşya" },
  { key: "item.description", name: "Eşya Özellik", group: "Eşya" },
];

const SettingsPage = () => {
  const { settings, setSettings } = useSettings();
  // Ayarları düzenlemek için lokal bir state oluşturuyoruz.
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [blockedTransition, setBlockedTransition] = useState(null);
  const [unblock, setUnblock] = useState(() => () => {});
  // Ayarlarda değişiklik olup olmadığını kontrol et
  useEffect(() => {
    // Lokal state ile global state'i karşılaştır
    const hasChanges =
      JSON.stringify(localSettings) !== JSON.stringify(settings);
    setIsDirty(hasChanges);
  }, [localSettings, settings]);

  // Uygulama içi gezinmelerde uyar
  useEffect(() => {
    if (isDirty) {
      const unblocker = history.block((tx) => {
        // Tarayıcı uyarısı yerine kendi modal'ımızı açalım
        setBlockedTransition(tx);
        setShowUnsavedChangesModal(true);
      });
      setUnblock(() => unblocker); // unblock fonksiyonunu state'e kaydet
      return () => unblocker(); // cleanup
    }
  }, [isDirty]);

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : isNaN(Number(value))
          ? value
          : Number(value),
    }));
  };

  const handleColumnChange = (columnKey) => {
    setLocalSettings((prev) => {
      const currentVisible = prev.visibleColumns?.assignments || [];
      const newVisible = currentVisible.includes(columnKey)
        ? currentVisible.filter((c) => c !== columnKey)
        : [...currentVisible, columnKey];
      return {
        ...prev,
        visibleColumns: { ...prev.visibleColumns, assignments: newVisible },
      };
    });
  };

  const handleSave = () => {
    // Ayarları localStorage'a manuel olarak kaydet
    localStorage.setItem("appSettings", JSON.stringify(localSettings));
    // Lokal state'i global state'e aktar
    setSettings(localSettings);
    toast.success("Ayarlar başarıyla kaydedildi!");
  };

  const handleLeavePage = () => {
    if (blockedTransition) {
      unblock(); // Önce engeli kaldır
      // Yönlendirme engelini kaldır ve işlemi yeniden dene
      blockedTransition.retry();
      setShowUnsavedChangesModal(false);
      setBlockedTransition(null);
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedChangesModal(false);
    blockedTransition?.reset();
    setBlockedTransition(null);
  };

  return (
    <div className="page-container">
      <h1>
        <FaCog style={{ color: "var(--secondary-color)" }} /> Ayarlar
      </h1>

      <NotificationSettings
        settings={localSettings}
        onSettingChange={handleSettingChange}
      />

      <DisplaySettings
        settings={localSettings}
        onSettingChange={handleSettingChange}
      />

      <ColumnManager
        visibleColumns={localSettings.visibleColumns?.assignments || []}
        allColumns={allAssignmentColumns}
        onColumnChange={handleColumnChange}
      />

      <AccountSecurity onNavigateToProfile={() => history.push("/profile")} />

      <div className="save-settings-container">
        <button onClick={handleSave} className="save-button">
          <FaSave /> Ayarları Kaydet
        </button>
      </div>

      {/* Kaydedilmemiş Değişiklikler Uyarı Modalı */}
      <Modal
        isOpen={showUnsavedChangesModal}
        onClose={handleStayOnPage}
        title="Kaydedilmemiş Değişiklikler"
      >
        <p>
          Yaptığınız değişiklikler kaydedilmedi. Bu sayfadan ayrılırsanız
          değişiklikleriniz kaybolacaktır.
        </p>
        <p>Yine de ayrılmak istiyor musunuz?</p>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={handleStayOnPage}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            Sayfada Kal
          </button>
          <button onClick={handleLeavePage} className="danger">
            Evet, Ayrıl
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
