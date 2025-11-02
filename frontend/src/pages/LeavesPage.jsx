import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import {
  FaCalendarAlt,
  FaCalendarPlus,
  FaPaperPlane,
  FaPlus,
  FaPrint,
  FaUser,
} from "react-icons/fa";
import Loader from "../components/Loader";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Modal from "../components/shared/Modal";
import Button from "../components/shared/Button";
import { useForm, Controller } from "react-hook-form"; // Controller'ı import et
import Select from "react-select";
import { toast } from "react-toastify";
import { useAuth } from "../components/AuthContext";
import { FaAlignLeft, FaBriefcase, FaUpload } from "react-icons/fa6";

const LeaveStatusBadge = ({ status }) => {
  const statusMap = {
    Beklemede: "status-warning",
    Onaylandı: "status-success",
    Reddedildi: "status-danger",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const LeavesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveFormFile, setLeaveFormFile] = useState(null);
  const fileInputRef = useRef(null);
  const { hasPermission, userInfo } = useAuth();

  // İzin taleplerini çeken sorgu
  const {
    data: leaves,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/leaves/my-leaves");
      return data;
    },
  });

  // Adminler için personel listesini çeken sorgu
  const { data: personnelOptions, isLoading: personnelLoading } = useQuery({
    queryKey: ["personnelForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel/for-selection");
      return data.map((p) => ({ value: p._id, label: p.fullName }));
    },
    enabled: hasPermission("admin"),
    staleTime: 1000 * 60 * 5,
  });

  // Yeni izin talebi oluşturma mutasyonu
  const createLeaveMutation = useMutation({
    mutationFn: (newLeave) => axiosInstance.post("/leaves", newLeave),
    onSuccess: () => {
      toast.success("İzin talebiniz başarıyla oluşturuldu.");
      queryClient.invalidateQueries({ queryKey: ["myLeaves", "allLeaves"] });
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Talep oluşturulurken bir hata oluştu."
      );
    },
  });

  // Form yönetimi
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    control, // Controller için
    formState: { errors },
  } = useForm();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeaveFormFile(file);
    }
  };

  const onSubmit = async (data) => {
    if (!leaveFormFile) {
      toast.warn("Lütfen imzalı izin talep formunu yükleyin.");
      return;
    }

    try {
      // 1. Dosyayı yükle
      const fileFormData = new FormData();
      fileFormData.append("form", leaveFormFile);
      const uploadResponse = await axiosInstance.post("/upload", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const formPath = uploadResponse.data.filePath;

      // 2. İzin talebini oluştur
      const payload = {
        ...data,
        personnelId: data.personnel?.value,
        formPath: formPath, // Yüklenen dosyanın yolunu ekle
      };
      delete payload.personnel; // Orijinal personnel objesini sil

      createLeaveMutation.mutate(payload);
    } catch (error) {
      toast.error(
        "Dosya yüklenirken veya talep oluşturulurken bir hata oluştu."
      );
      console.error("Leave request submission error:", error);
    }
  };

  const handlePrint = async () => {
    const formData = getValues(); // Formdaki güncel verileri al
    const { leaveType, startDate, endDate, reason, personnel } = formData;

    if (!leaveType || !startDate || !endDate || !reason) {
      toast.warn("Lütfen yazdırmadan önce tüm izin bilgilerini doldurun.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/leaves/print-form",
        {
          leaveType,
          startDate,
          endDate,
          reason,
          personnelId: personnel?.value,
        },
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      window.open(url); // PDF'i yeni sekmede aç
    } catch (error) {
      toast.error("PDF oluşturulurken bir hata oluştu.");
      console.error("PDF Print Error:", error);
    }
  };

  const openModal = () => {
    reset();
    setLeaveFormFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsModalOpen(true);
  };

  if (isLoading) return <Loader />;
  if (isError)
    return <div className="text-danger">İzin talepleri yüklenemedi.</div>;

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FaCalendarPlus className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            İzin Talebi
          </h1>
        </div>
        <Button onClick={openModal}>
          <FaPlus className="mr-2" /> Yeni İzin Talebi
        </Button>
      </div>

      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">İzin Türü</th>
              <th className="th-cell">Başlangıç</th>
              <th className="th-cell">Bitiş</th>
              <th className="th-cell">Durum</th>
              <th className="th-cell">Talep Tarihi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leaves && leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr
                  key={leave._id}
                  className="hover:bg-background-soft transition-colors"
                >
                  <td className="td-cell font-medium">{leave.leaveType}</td>
                  <td className="td-cell">
                    {format(new Date(leave.startDate), "dd MMM yyyy", {
                      locale: tr,
                    })}
                  </td>
                  <td className="td-cell">
                    {format(new Date(leave.endDate), "dd MMM yyyy", {
                      locale: tr,
                    })}
                  </td>
                  <td className="td-cell">
                    <LeaveStatusBadge status={leave.status} />
                  </td>
                  <td className="td-cell text-text-light">
                    {format(new Date(leave.createdAt), "dd MMM yyyy, HH:mm", {
                      locale: tr,
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-text-light">
                  Henüz oluşturulmuş bir izin talebiniz bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Yeni İzin Talebi Modalı */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni İzin Talebi Oluştur"
        size="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasPermission("admin") && (
              <div className="md:col-span-2">
                <label
                  htmlFor="personnel"
                  className="block text-sm font-medium"
                >
                  Personel (Başkası Adına Talep)
                </label>
                <Controller
                  name="personnel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id="personnel"
                      options={personnelOptions}
                      isLoading={personnelLoading}
                      isClearable
                      placeholder={`${userInfo.personnel.fullName} (Kendi Adınıza)`}
                      className="mt-1"
                      classNamePrefix="react-select"
                      noOptionsMessage={() => "Personel bulunamadı"}
                    />
                  )}
                />
                <p className="text-xs text-text-light mt-1">
                  Bu alanı boş bırakırsanız, talep kendi adınıza oluşturulur.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium">
                İzin Türü
              </label>
              <div className="relative mt-1">
                <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                <select
                  id="leaveType"
                  {...register("leaveType", {
                    required: "İzin türü seçmek zorunludur.",
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                >
                  <option value="">Lütfen bir izin türü seçin...</option>
                  <option value="Yıllık İzin">Yıllık İzin</option>
                  <option value="Hastalık">Hastalık Raporu</option>
                  <option value="Mazeret">Mazeret İzni</option>
                  <option value="Doğum">Doğum İzni</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              {errors.leaveType && (
                <p className="text-danger text-xs mt-1">
                  {errors.leaveType.message}
                </p>
              )}
            </div>

            <div />

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium">
                Başlangıç Tarihi
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  id="startDate"
                  {...register("startDate", {
                    required: "Başlangıç tarihi zorunludur.",
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              </div>
              {errors.startDate && (
                <p className="text-danger text-xs mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium">
                Bitiş Tarihi
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  id="endDate"
                  {...register("endDate", {
                    required: "Bitiş tarihi zorunludur.",
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                />
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              </div>
              {errors.endDate && (
                <p className="text-danger text-xs mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="reason" className="block text-sm font-medium">
              Açıklama
            </label>
            <div className="relative mt-1">
              <FaAlignLeft className="absolute left-3 top-3 text-text-light" />
              <textarea
                id="reason"
                {...register("reason", {
                  required: "Açıklama alanı zorunludur.",
                })}
                className="w-full min-h-[80px] pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                rows="3"
                placeholder="İzin talebinizin nedenini kısaca açıklayınız..."
              ></textarea>
            </div>
            {errors.reason && (
              <p className="text-danger text-xs mt-1">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Dosya Yükleme Alanı */}
          <div className="md:col-span-2">
            <label
              htmlFor="leaveFormFile"
              className="block text-sm font-medium"
            >
              İmzalı Formu Yükle
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FaUpload className="mx-auto h-12 w-12 text-text-light" />
                <div className="flex text-sm text-text-main">
                  <label
                    htmlFor="leaveFormFile"
                    className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                  >
                    <span>Bir dosya seçin</span>
                    <input
                      id="leaveFormFile"
                      name="leaveFormFile"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="pl-1">veya sürükleyip bırakın</p>
                </div>
                <p className="text-xs text-text-light">
                  {leaveFormFile
                    ? `Seçilen dosya: ${leaveFormFile.name}`
                    : "PDF, PNG, JPG (MAX. 5MB)"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handlePrint}>
              <FaPrint className="mr-2" />
              Formu Yazdır
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={createLeaveMutation.isLoading}>
                <FaPaperPlane className="mr-2" />
                {createLeaveMutation.isLoading
                  ? "Gönderiliyor..."
                  : "Talebi Gönder"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default LeavesPage;
