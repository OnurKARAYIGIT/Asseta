import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

const PersonnelFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  currentItem,
  personnelList = [], // Yönetici seçimi için personel listesi
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Şirketleri (lokasyonları) çekmek için query
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locationsForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations/for-selection");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache'le
  });

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && currentItem) {
        // react-hook-form'un reset fonksiyonu için iç içe objeleri düzleştirelim
        const managerId =
          typeof currentItem.manager === "object"
            ? currentItem.manager?._id
            : currentItem.manager;

        const flatItem = {
          ...currentItem,
          ...currentItem.personalInfo,
          ...currentItem.contactInfo,
          ...currentItem.jobInfo,
          company: currentItem.company?._id, // Şirket ID'sini al
          manager: managerId,
          // Tarih inputları için 'yyyy-MM-dd' formatı gerekli
          startDate: currentItem.jobInfo?.startDate
            ? new Date(currentItem.jobInfo.startDate)
                .toISOString()
                .split("T")[0]
            : "",
          birthDate: currentItem.personalInfo?.birthDate
            ? new Date(currentItem.personalInfo.birthDate)
                .toISOString()
                .split("T")[0]
            : "",
        };
        delete flatItem.personalInfo;
        delete flatItem.contactInfo;
        delete flatItem.jobInfo;
        reset(flatItem);
      } else {
        // Yeni kayıt için varsayılan değerler
        reset({
          isActive: true,
          employmentType: "Tam Zamanlı",
        });
      }
    }
  }, [isOpen, isEditMode, currentItem, reset]);

  const handleFormSubmit = (data) => {
    // Formdan gelen düz veriyi, API'nin beklediği iç içe yapıya dönüştürelim
    const structuredData = {
      ...(isEditMode && { _id: currentItem._id }),
      fullName: data.fullName,
      company: data.company, // Şirket bilgisini ekle
      employeeId: data.employeeId,
      email: data.email,
      isActive: data.isActive,
      personalInfo: {
        tcNo: data.tcNo,
        birthDate: data.birthDate || null,
        gender: data.gender,
      },
      contactInfo: {
        phone: data.phone,
        address: data.address,
      },
      jobInfo: {
        department: data.department,
        position: data.position,
        employmentType: data.employmentType,
        startDate: data.startDate,
        manager: data.manager || null, // Yönetici seçilmemişse null gönder
      },
    };
    onSubmit(structuredData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Personel Bilgilerini Düzenle" : "Yeni Personel Ekle"}
      size="2xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temel Bilgiler */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium">
              Adı Soyadı
            </label>
            <input
              id="fullName"
              {...register("fullName", { required: "Ad soyad zorunludur" })}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.fullName && (
              <p className="text-danger text-xs mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium">
              Sicil Numarası
            </label>
            <input
              id="employeeId"
              {...register("employeeId", {
                required: "Sicil numarası zorunludur",
              })}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.employeeId && (
              <p className="text-danger text-xs mt-1">
                {errors.employeeId.message}
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
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Telefon
            </label>
            <input
              id="phone"
              {...register("phone")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
          </div>

          {/* İş Bilgileri */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium">
              Departman
            </label>
            <input
              id="department"
              {...register("department")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium">
              Pozisyon
            </label>
            <input
              id="position"
              {...register("position")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium">
              İşe Başlangıç Tarihi
            </label>
            <input
              id="startDate"
              type="date"
              {...register("startDate", {
                required: "İşe başlangıç tarihi zorunludur",
              })}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background disabled:bg-background-soft disabled:cursor-not-allowed"
              disabled={isEditMode}
            />
            {errors.startDate && (
              <p className="text-danger text-xs mt-1">
                {errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="employmentType"
              className="block text-sm font-medium"
            >
              Çalışma Tipi
            </label>
            <select
              id="employmentType"
              {...register("employmentType")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              <option value="Tam Zamanlı">Tam Zamanlı</option>
              <option value="Yarı Zamanlı">Yarı Zamanlı</option>
              <option value="Stajyer">Stajyer</option>
              <option value="Danışman">Danışman</option>
            </select>
          </div>
          {/* YENİ: Yönetici Seçim Alanı */}
          <div>
            <label htmlFor="manager" className="block text-sm font-medium">
              Yöneticisi
            </label>
            <select
              id="manager"
              {...register("manager")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              <option value="">Yönetici Seçilmedi</option>
              {personnelList
                .filter((p) => p._id !== currentItem?._id) // Kişinin kendisini yönetici olarak seçmesini engelle
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName}
                  </option>
                ))}
            </select>
          </div>

          {/* Kişisel Bilgiler */}
          <div>
            <label htmlFor="tcNo" className="block text-sm font-medium">
              T.C. Kimlik No
            </label>
            <input
              id="tcNo"
              {...register("tcNo")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium">
              Doğum Tarihi
            </label>
            <input
              id="birthDate"
              type="date"
              {...register("birthDate")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium">
              Cinsiyet
            </label>
            <select
              id="gender"
              {...register("gender")}
              className="input mt-1 block w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              <option value="">Seçiniz...</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
              <option value="Belirtilmemiş">Belirtilmemiş</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm">
              Aktif Personel
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Kaydediliyor..."
              : isEditMode
              ? "Güncelle"
              : "Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PersonnelFormModal;
