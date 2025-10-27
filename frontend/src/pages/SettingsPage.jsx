import React, { useState, useEffect } from "react";
import { history } from "../history.js";
import {
  FaCog,
  FaSun,
  FaMoon,
  FaBell,
  FaList,
  FaLanguage,
  FaKey,
  FaColumns,
  FaShieldAlt,
  FaSave,
} from "react-icons/fa";
import { useTheme } from "../components/ThemeContext";
import Modal from "../components/Modal";
import { useSettings } from "../hooks/SettingsContext";
import { toast } from "react-toastify";
import "./SettingsPage.css";

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
  const { theme, toggleTheme } = useTheme();
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

      <div className="settings-card">
        <h2>Bildirim Tercihleri</h2>
        <div className="setting-item">
          <div className="setting-label">
            <FaBell style={{ marginRight: "10px", color: "#3498db" }} />
            Yeni zimmet atandığında e-posta ile bildir
          </div>
          <div className="setting-control">
            <label className="theme-switch">
              <input
                name="emailOnNewAssignment"
                type="checkbox"
                onChange={handleSettingChange}
                checked={localSettings.emailOnNewAssignment}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <FaBell style={{ marginRight: "10px", color: "#3498db" }} />
            Zimmet durumu değiştiğinde e-posta ile bildir
            <p className="setting-description">
              Onay, ret veya iade durumlarında bildirim alırsınız.
            </p>
          </div>
          <div className="setting-control">
            <label className="theme-switch">
              <input
                name="emailOnStatusChange"
                type="checkbox"
                onChange={handleSettingChange}
                checked={localSettings.emailOnStatusChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Veri Gösterimi</h2>
        <div className="setting-item">
          <div className="setting-label">
            <FaList style={{ marginRight: "10px", color: "#2ecc71" }} />
            Sayfa başına gösterilecek kayıt sayısı
          </div>
          <div className="setting-control">
            <select
              name="itemsPerPage"
              value={localSettings.itemsPerPage}
              onChange={handleSettingChange}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Tablo Görünümü Ayarları</h2>
        <div className="setting-item column-manager">
          <div className="setting-label">
            <FaColumns style={{ marginRight: "10px", color: "#1abc9c" }} />
            Zimmetler Tablosu Sütunları
            <p className="setting-description">
              Listeleme sayfasında varsayılan olarak görmek istediğiniz
              sütunları seçin.
            </p>
          </div>
          <div className="setting-control column-list">
            {allAssignmentColumns.map((col) => (
              <label key={col.key} className="column-checkbox">
                <input
                  type="checkbox"
                  checked={localSettings.visibleColumns?.assignments.includes(
                    col.key
                  )}
                  onChange={() => handleColumnChange(col.key)}
                />
                {col.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Hesap ve Güvenlik</h2>
        <div className="setting-item">
          <div className="setting-label">
            <FaKey style={{ marginRight: "10px", color: "#e67e22" }} />
            Şifre Değiştir
            <p className="setting-description">
              Güvenliğiniz için şifrenizi periyodik olarak değiştirin.
            </p>
          </div>
          <div className="setting-control">
            <button className="secondary-button">Şifreyi Değiştir</button>
          </div>
        </div>
        <div className="setting-item">
          <div className="setting-label">
            <FaShieldAlt style={{ marginRight: "10px", color: "#e74c3c" }} />
            İki Faktörlü Kimlik Doğrulama (2FA)
            <p className="setting-description">
              Hesabınıza ekstra bir güvenlik katmanı ekleyin.
            </p>
          </div>
          <div className="setting-control">
            <button className="secondary-button" disabled>
              Etkinleştir (Yakında)
            </button>
          </div>
        </div>
      </div>
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
