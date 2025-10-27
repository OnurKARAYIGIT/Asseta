import React from "react";

const ItemForm = ({
  formData,
  onFormChange,
  onSubmit,
  onClose,
  assetTypesList,
  submitError,
  mode = "add",
}) => {
  return (
    <form onSubmit={onSubmit}>
      {submitError && <p style={{ color: "red" }}>{submitError}</p>}
      <div className="form-grid">
        <input
          type="text"
          name="name"
          placeholder="Eşya Adı"
          value={formData.name || ""}
          onChange={onFormChange}
          required
        />
        <select
          name="assetType"
          value={formData.assetType || ""}
          onChange={onFormChange}
          required
        >
          <option value="">* Varlık Cinsi Seçin...</option>
          {assetTypesList.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="assetSubType"
          placeholder="Varlık Alt Kategori"
          value={formData.assetSubType || ""}
          onChange={onFormChange}
        />
        <input
          type="text"
          name="fixedAssetType"
          placeholder="Sabit Kıymet Cinsi"
          value={formData.fixedAssetType || ""}
          onChange={onFormChange}
        />
        <input
          type="text"
          name="brand"
          placeholder="Marka / Model"
          value={formData.brand || ""}
          onChange={onFormChange}
        />
        <input
          type="text"
          name="assetTag"
          placeholder="Demirbaş No"
          value={formData.assetTag || ""}
          onChange={onFormChange}
        />
        <input
          type="text"
          name="modelYear"
          placeholder="Model Yılı"
          value={formData.modelYear || ""}
          onChange={onFormChange}
        />
        <input
          type="text"
          name="serialNumber"
          placeholder="Seri Numarası (varsa)"
          value={formData.serialNumber || ""}
          onChange={onFormChange}
        />
      </div>
      <textarea
        name="networkInfo"
        placeholder="Mac Adresi / IP Adresi"
        value={formData.networkInfo || ""}
        onChange={onFormChange}
        style={{ marginTop: "1rem" }}
      />
      <textarea
        name="softwareInfo"
        placeholder="Kurulu Programlar & İşletim Sistemi"
        value={formData.softwareInfo || ""}
        onChange={onFormChange}
        style={{ marginTop: "1rem" }}
      />
      <textarea
        name="description"
        placeholder="Özellik / Açıklama"
        value={formData.description || ""}
        onChange={onFormChange}
        style={{ marginTop: "1rem" }}
      />
      <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{ backgroundColor: "var(--text-color-light)" }}
        >
          İptal
        </button>
        <button type="submit">{mode === "add" ? "Ekle" : "Kaydet"}</button>
      </div>
    </form>
  );
};

export default ItemForm;
