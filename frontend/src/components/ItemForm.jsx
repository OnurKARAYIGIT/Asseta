import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import Button from "./shared/Button";

const ItemForm = ({
  formData,
  onFormChange,
  onSubmit,
  onClose,
  assetTypesList,
  submitError,
  mode, // 'add' veya 'edit'
}) => {
  const [assetTagError, setAssetTagError] = useState("");
  const [serialNumberError, setSerialNumberError] = useState("");

  // Demirbaş No ve Seri No'nun benzersizliğini kontrol eden fonksiyon
  const checkUniqueness = async (field, value, itemId) => {
    if (!value) {
      if (field === "assetTag") setAssetTagError("");
      if (field === "serialNumber") setSerialNumberError("");
      return;
    }
    try {
      const { data } = await axiosInstance.post("/items/check-unique", {
        field,
        value,
        itemId, // Düzenleme modunda mevcut kaydı kontrol dışı bırakmak için
      });
      if (!data.isUnique) {
        const errorMessage =
          field === "assetTag"
            ? "Bu demirbaş numarası zaten kullanılıyor."
            : "Bu seri numarası zaten kullanılıyor.";
        if (field === "assetTag") setAssetTagError(errorMessage);
        if (field === "serialNumber") setSerialNumberError(errorMessage);
      } else {
        if (field === "assetTag") setAssetTagError("");
        if (field === "serialNumber") setSerialNumberError("");
      }
    } catch (error) {
      console.error("Benzersizlik kontrolü hatası:", error);
    }
  };

  // Demirbaş No değiştiğinde kontrol et
  useEffect(() => {
    const handler = setTimeout(() => {
      checkUniqueness(
        "assetTag",
        formData.assetTag,
        mode === "edit" ? formData._id : null
      );
    }, 500); // Kullanıcı yazmayı bitirene kadar bekle
    return () => clearTimeout(handler);
  }, [formData.assetTag, formData._id, mode]);

  // Seri No değiştiğinde kontrol et
  useEffect(() => {
    const handler = setTimeout(() => {
      checkUniqueness(
        "serialNumber",
        formData.serialNumber,
        mode === "edit" ? formData._id : null
      );
    }, 500);
    return () => clearTimeout(handler);
  }, [formData.serialNumber, formData._id, mode]);

  const hasError = assetTagError || serialNumberError || submitError;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {hasError && (
        <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
          {submitError || assetTagError || serialNumberError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {/* Eşya Adı */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Eşya Adı *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={onFormChange}
            required
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Varlık Cinsi */}
        <div>
          <label
            htmlFor="assetType"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Varlık Cinsi *
          </label>
          <select
            id="assetType"
            name="assetType"
            value={formData.assetType || ""}
            onChange={onFormChange}
            required
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="" disabled>
              Seçiniz...
            </option>
            {assetTypesList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {/* Marka / Model */}
        <div>
          <label
            htmlFor="brand"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Marka / Model
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Varlık Alt Kategori */}
        <div>
          <label
            htmlFor="assetSubType"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Varlık Alt Kategori
          </label>
          <input
            type="text"
            id="assetSubType"
            name="assetSubType"
            value={formData.assetSubType || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Sabit Kıymet Cinsi */}
        <div>
          <label
            htmlFor="fixedAssetType"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Sabit Kıymet Cinsi
          </label>
          <input
            type="text"
            id="fixedAssetType"
            name="fixedAssetType"
            value={formData.fixedAssetType || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Demirbaş No */}
        <div>
          <label
            htmlFor="assetTag"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Demirbaş No
          </label>
          <input
            type="text"
            id="assetTag"
            name="assetTag"
            value={formData.assetTag || ""}
            onChange={onFormChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 ${
              assetTagError
                ? "border-danger focus:border-danger"
                : "border-border focus:border-primary"
            }`}
          />
        </div>
        {/* Seri Numarası */}
        <div>
          <label
            htmlFor="serialNumber"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Seri Numarası
          </label>
          <input
            type="text"
            id="serialNumber"
            name="serialNumber"
            value={formData.serialNumber || ""}
            onChange={onFormChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 ${
              serialNumberError
                ? "border-danger focus:border-danger"
                : "border-border focus:border-primary"
            }`}
          />
        </div>
        {/* Model Yılı */}
        <div>
          <label
            htmlFor="modelYear"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Model Yılı
          </label>
          <input
            type="text"
            id="modelYear"
            name="modelYear"
            placeholder="Örn: 2023"
            value={formData.modelYear || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Ağ Bilgileri (MAC/IP) */}
        <div>
          <label
            htmlFor="networkInfo"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Ağ Bilgileri (MAC/IP)
          </label>
          <input
            type="text"
            id="networkInfo"
            name="networkInfo"
            value={formData.networkInfo || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Sadece düzenleme modunda gösterilecek durum alanı */}
        {mode === "edit" && (
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-text-main mb-1"
            >
              Durum
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || "Boşta"}
              onChange={onFormChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="Boşta">Boşta</option>
              <option value="Arızalı">Arızalı</option>
              <option value="Hurda">Hurda</option>
            </select>
          </div>
        )}
        {/* Yazılım Bilgileri */}
        <div className="lg:col-span-3">
          <label
            htmlFor="softwareInfo"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Yazılım Bilgileri
          </label>
          <input
            type="text"
            id="softwareInfo"
            name="softwareInfo"
            value={formData.softwareInfo || ""}
            onChange={onFormChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {/* Açıklama */}
        <div className="lg:col-span-3">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Açıklama / Özellikler
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={onFormChange}
            rows="3"
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose}>
          İptal
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!!assetTagError || !!serialNumberError}
        >
          {mode === "add" ? "Eşyayı Ekle" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </form>
  );
};

export default ItemForm;
