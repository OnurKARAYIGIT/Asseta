import axiosInstance from "../api/axiosInstance";

/**
 * Eşya verilerini doğrular. Hem senkron hem de asenkron kontroller yapar.
 * @param {object} data - Doğrulanacak eşya verileri.
 * @param {string|null} itemId - Düzenleme modunda ise mevcut eşyanın ID'si.
 * @returns {Promise<string|null>} - Hata mesajı veya null (hata yoksa).
 */
export const validateItemData = async (data, itemId = null) => {
  const { name, assetType, modelYear, assetTag, serialNumber } = data;

  if (!name?.trim() || !assetType?.trim()) {
    return "Eşya Adı ve Varlık Cinsi alanları zorunludur.";
  }

  if (modelYear && !/^\d{4}$/.test(modelYear)) {
    return "Model Yılı 4 haneli bir sayı olmalıdır (örn: 2023).";
  }

  // Demirbaş No ve Seri No benzersizlik kontrolü
  if (assetTag) {
    const { data: uniqueData } = await axiosInstance.post(
      "/items/check-unique",
      {
        field: "assetTag",
        value: assetTag,
        itemId,
      }
    );
    if (!uniqueData.isUnique) {
      return "Bu Demirbaş Numarası zaten başka bir eşya için kayıtlı.";
    }
  }

  if (serialNumber) {
    const { data: uniqueData } = await axiosInstance.post(
      "/items/check-unique",
      {
        field: "serialNumber",
        value: serialNumber,
        itemId,
      }
    );
    if (!uniqueData.isUnique) {
      return "Bu Seri Numarası zaten başka bir eşya için kayıtlı.";
    }
  }

  return null; // Hata yok
};
