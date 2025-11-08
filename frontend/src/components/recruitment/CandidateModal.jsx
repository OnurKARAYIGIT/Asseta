import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { FaUpload, FaFileAlt, FaTimes } from "react-icons/fa";

const CandidateModal = ({ isOpen, onClose, onSubmit, mode, currentItem }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [newFiles, setNewFiles] = useState([]); // YENİ: Birden fazla yeni dosyayı tutmak için
  const fileInputRef = useRef(null);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && currentItem) {
        reset(currentItem);
      } else {
        reset({
          fullName: "",
          email: "",
          phone: "",
          source: "Kariyer.net", // Varsayılan bir değer atayabiliriz
          resumePaths: [],
        });
      }
      // Modal her açıldığında dosya state'ini ve input'unu sıfırla
      setNewFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, isEditMode, currentItem, reset]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setNewFiles((prevFiles) => [...prevFiles, ...files]);
    }
  };

  const removeNewFile = (fileToRemove) => {
    setNewFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  const handleFormSubmit = async (data) => {
    // Backend'deki modelinize göre bu alan adını `resumePaths` olarak değiştirebilirsiniz.
    let existingPaths = currentItem?.resumePaths || [];
    const uploadedPaths = [];

    // Eğer yeni dosyalar seçildiyse, onları tek tek yükle
    if (newFiles.length > 0) {
      try {
        for (const file of newFiles) {
          const fileFormData = new FormData();
          fileFormData.append("form", file);
          const uploadResponse = await axiosInstance.post(
            "/upload",
            fileFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          uploadedPaths.push(uploadResponse.data.filePath);
        }
      } catch (error) {
        toast.error(
          "Dosyalar yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
        return; // Yükleme başarısız olursa işlemi durdur
      }
    }

    const payload = {
      ...data,
      // Backend'deki modele göre `resumePaths` olarak güncelleyin
      resumePaths: [...existingPaths, ...uploadedPaths],
    };

    if (isEditMode) {
      payload._id = currentItem._id;
    }
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Aday Bilgilerini Düzenle" : "Yeni Aday Ekle"}
      size="2xl" // Modal boyutunu büyüttük
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sol Sütun: Form Alanları */}
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium">
                Ad Soyad
              </label>
              <input
                id="fullName"
                {...register("fullName", { required: "Ad soyad zorunludur" })}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
              {errors.fullName && (
                <p className="text-danger text-xs mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "E-posta zorunludur" })}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Telefon
              </label>
              <input
                id="phone"
                {...register("phone")}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium">
                Başvuru Kaynağı
              </label>
              <select
                id="source"
                {...register("source")}
                className="input mt-1 w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              >
                <option value="Kariyer.net">Kariyer.net</option>
                <option value="İş-Kur">İş-Kur</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referans">Referans</option>
                <option value="Web Sitesi">Web Sitesi</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>

          {/* Sağ Sütun: Dosya Yükleme Alanı */}
          <div>
            <label htmlFor="cvFile" className="block text-sm font-medium">
              Belge Yükle (CV, Sertifika vb.)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FaUpload className="mx-auto h-12 w-12 text-text-light" />
                <div className="flex text-sm text-text-main">
                  <label
                    htmlFor="cvFile"
                    className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                  >
                    <span>Bir dosya seçin</span>
                  </label>
                  <p className="pl-1">veya sürükleyip bırakın</p>
                </div>
                <p className="text-xs text-text-light">
                  PDF, DOC, DOCX, JPG, PNG (MAX. 5MB)
                </p>
              </div>
            </div>
            <input
              id="cvFile"
              name="cvFile"
              type="file"
              multiple // Birden fazla dosya seçimine izin ver
              className="sr-only"
              onChange={handleFileChange}
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />

            {/* Yüklenen Dosyalar Listesi */}
            <div className="mt-2 space-y-2">
              {isEditMode &&
                currentItem?.resumePaths?.map((path, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-background-soft p-2 rounded-md text-sm"
                  >
                    <a
                      href={path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-text-light hover:text-primary"
                      title="Belgeyi Görüntüle"
                    >
                      <FaFileAlt className="text-success flex-shrink-0" />
                      <span className="truncate">
                        {path.split("/").pop() /* Sadece dosya adını göster */}
                      </span>
                    </a>
                    {/* Mevcut dosyaları silme özelliği eklenebilir */}
                  </div>
                ))}
              {newFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-background-soft p-2 rounded-md text-sm"
                >
                  <a
                    href={URL.createObjectURL(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-text-main hover:text-primary"
                    title="Yeni Belgeyi Görüntüle"
                  >
                    <FaFileAlt className="text-primary flex-shrink-0" />
                    <span className="truncate" title={file.name}>
                      {file.name}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => removeNewFile(file)}
                    className="text-danger hover:text-danger-dark"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Kaydediliyor..."
              : isEditMode
              ? "Güncelle"
              : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CandidateModal;
