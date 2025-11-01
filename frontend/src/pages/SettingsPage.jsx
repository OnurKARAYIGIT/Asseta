import React, { useState, useEffect, useCallback } from "react";
import { history } from "../history.js";
import { FaCog, FaSave } from "react-icons/fa";
import Modal from "../components/shared/Modal";
import Button from "../components/shared/Button";
import { toast } from "react-toastify";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

// Yeni oluşturduğumuz bileşenleri import edelim
import { defaultSettings } from "../hooks/SettingsContext";
import NotificationSettings from "../components/settings/NotificationSettings";
import DisplaySettings from "../components/settings/DisplaySettings";
import ColumnManager from "../components/settings/ColumnManager";
import AccountSecurity from "../components/settings/AccountSecurity";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";
import Loader from "../components/Loader";

// Tüm olası sütunların listesi
const allAssignmentColumns = [
  { key: "personnel.fullName", name: "Kullanıcı Adı", group: "Zimmet" },
  { key: "company.name", name: "Konum", group: "Zimmet" },
  { key: "unit", name: "Bulunduğu Birim", group: "Zimmet" },
  { key: "location", name: "Bulunduğu Yer", group: "Zimmet" },
  { key: "registeredSection", name: "Kayıtlı Bölüm", group: "Zimmet" },
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
  const queryClient = useQueryClient();

  // --- React Query ile Ayarları Çekme ---
  const { data: settings, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users/settings");
      return data; // Veriyi olduğu gibi döndür, burada birleştirme yapma.
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  const [localSettings, setLocalSettings] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  // Şifre Değiştirme Modalı için state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
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

  // --- React Query ile Ayarları Güncelleme ---
  const { mutate: saveSettings, isLoading: isSaving } = useMutation({
    mutationFn: (newSettings) =>
      axiosInstance.put("/users/settings", newSettings),
    onSuccess: (savedSettings) => {
      // Cache'i yeni kaydedilen ayarlarla güncelle
      queryClient.setQueryData(["userSettings"], savedSettings);
      toast.success("Ayarlar başarıyla kaydedildi!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Ayarlar kaydedilemedi.");
    },
  });

  const handleSave = () => saveSettings(localSettings);

  // --- Şifre Değiştirme ---
  const { mutate: updateUserPassword, isLoading: isPasswordUpdating } =
    useMutation({
      mutationFn: ({ oldPassword, newPassword }) =>
        axiosInstance.put("/users/profile/password", {
          oldPassword,
          newPassword,
        }),
      onSuccess: () => {
        toast.success("Şifreniz başarıyla güncellendi.");
        setIsChangePasswordModalOpen(false);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Şifre güncellenemedi.");
      },
    });

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

  if (isLoading || localSettings === null) {
    return <Loader />;
  }

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-8">
        <FaCog className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Ayarlar
        </h1>
      </div>

      <div className="space-y-10">
        <NotificationSettings
          settings={localSettings}
          onSettingChange={handleSettingChange}
        />

        <ColumnManager
          visibleColumns={localSettings.visibleColumns?.assignments || []}
          allColumns={allAssignmentColumns}
          onColumnChange={handleColumnChange}
        />

        <DisplaySettings
          settings={localSettings}
          onSettingChange={handleSettingChange}
        />

        <AccountSecurity
          onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        />
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          className="min-w-[150px]"
        >
          <FaSave /> Ayarları Kaydet
        </Button>
      </div>

      {/* Kaydedilmemiş Değişiklikler Uyarı Modalı */}
      <Modal
        isOpen={showUnsavedChangesModal}
        onClose={handleStayOnPage}
        title="Kaydedilmemiş Değişiklikler"
        size="small"
      >
        <p>
          Yaptığınız değişiklikler kaydedilmedi. Bu sayfadan ayrılırsanız
          değişiklikleriniz kaybolacaktır.
        </p>
        <p>Yine de ayrılmak istiyor musunuz?</p>
        <div className="flex justify-end gap-4 mt-6">
          <Button onClick={handleStayOnPage} variant="secondary">
            Sayfada Kal
          </Button>
          <Button onClick={handleLeavePage} variant="danger">
            Evet, Ayrıl
          </Button>
        </div>
      </Modal>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSubmit={updateUserPassword}
        isLoading={isPasswordUpdating}
      />
    </div>
  );
};

export default SettingsPage;
