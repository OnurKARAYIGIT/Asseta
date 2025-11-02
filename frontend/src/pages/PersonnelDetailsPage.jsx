import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaUser,
  FaIdCard,
  FaClipboardList,
  FaHistory,
  FaCalendarAlt,
  FaPencilAlt,
  FaPrint,
  FaMoneyBillWave,
  FaUserClock,
} from "react-icons/fa";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Button from "../components/shared/Button";
import PersonnelFormModal from "../components/personnel/PersonnelFormModal";
import PersonnelDocuments from "../components/personnel/PersonnelDocuments";
import SalaryInfoModal from "../components/personnel/SalaryInfoModal"; // YENİ
import { toast } from "react-toastify";

const AssignmentStatusBadge = ({ status }) => {
  const statusMap = {
    Zimmetli: "status-success",
    "İade Edildi": "status-info",
    Arızalı: "status-danger",
    Hurda: "status-dark",
    Beklemede: "status-warning",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const LeaveStatusBadge = ({ status }) => {
  const statusMap = {
    Beklemede: "status-warning",
    Onaylandı: "status-success",
    Reddedildi: "status-danger",
  };
  return <span className={`status-badge ${statusMap[status]}`}>{status}</span>;
};

const PersonnelDetailsPage = () => {
  const { personnelId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info"); // Varsayılan olarak personel bilgilerini göster
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false); // YENİ

  // Personel bilgilerini çek
  const {
    data: personnel,
    isLoading: isLoadingPersonnel,
    isError: isErrorPersonnel,
  } = useQuery({
    queryKey: ["personnelDetails", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/personnel/${personnelId}`);
      return data; // Bu sorgu artık 'documents' alanını da içeriyor
    },
  });

  // Personele ait zimmetleri çek
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["personnelAssignments", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/assignments?personnel=${personnelId}&status=all`
      );
      return data;
    },
    enabled: !!personnelId,
  });

  // Personele ait izinleri çek
  const { data: leavesData, isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["personnelLeaves", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/leaves?personnelId=${personnelId}`
      );
      return data;
    },
    enabled: !!personnelId,
  });

  // YENİ: Personele ait işlem geçmişini (audit logs) çek
  const { data: auditLogsData, isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ["personnelAuditLogs", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/audit-logs?personnelId=${personnelId}`
      );
      return data;
    },
    enabled: activeTab === "actions", // Sadece ilgili sekme aktifken çalıştır
  });

  // YENİ: Personele ait mesai kayıtlarını çek
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["personnelAttendance", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `/attendance?personnelId=${personnelId}`
      );
      return data;
    },
    enabled: activeTab === "attendance", // Sadece ilgili sekme aktifken çalıştır
  });

  // Yönetici seçimi için tüm personelleri çek
  const { data: allPersonnelForSelect = [] } = useQuery({
    queryKey: ["personnelForSelection"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/personnel/for-selection");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  // Personel güncelleme mutasyonu
  const updatePersonnelMutation = useMutation({
    mutationFn: (personnelData) => {
      const { _id, ...data } = personnelData;
      return axiosInstance.put(`/personnel/${_id}`, data);
    },
    onSuccess: () => {
      toast.success("Personel bilgileri başarıyla güncellendi.");
      queryClient.invalidateQueries({
        queryKey: ["personnelDetails", personnelId],
      });
      queryClient.invalidateQueries({ queryKey: ["personnelList"] });
      setIsEditModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Güncelleme sırasında bir hata oluştu."
      );
    },
  });

  // YENİ: Maaş bilgilerini güncelleme mutasyonu
  const updateSalaryMutation = useMutation({
    mutationFn: (salaryData) => {
      return axiosInstance.put(`/personnel/${personnelId}/salary`, salaryData);
    },
    onSuccess: () => {
      toast.success("Maaş bilgileri başarıyla güncellendi.");
      queryClient.invalidateQueries({
        queryKey: ["personnelDetails", personnelId],
      });
      setIsSalaryModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Maaş güncellenirken bir hata oluştu."
      );
    },
  });

  if (isLoadingPersonnel) return <Loader />;
  if (isErrorPersonnel)
    return <div className="text-danger">Personel bilgileri yüklenemedi.</div>;

  // YENİ: Zimmet formu yazdırma fonksiyonu
  const handlePrintAssignment = async (assignmentId) => {
    try {
      const response = await axiosInstance.get(
        `/assignments/${assignmentId}/print`,
        { responseType: "blob" }
      );
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Zimmet formu oluşturulurken bir hata oluştu.");
      console.error("PDF Print Error:", error);
    }
  };

  const TABS = [
    { id: "info", label: "Personel Bilgileri", icon: <FaIdCard /> },
    { id: "assignments", label: "Zimmet Geçmişi", icon: <FaClipboardList /> },
    { id: "leaves", label: "İzin Geçmişi", icon: <FaCalendarAlt /> },
    { id: "attendance", label: "Mesai Geçmişi", icon: <FaUserClock /> },
    { id: "documents", label: "Evraklar", icon: <FaHistory /> },
    { id: "actions", label: "İşlem Geçmişi", icon: <FaHistory /> },
  ];

  // Bilgi kartı için yardımcı bileşen
  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs text-text-light font-medium">{label}</p>
      <p className="text-base text-text-main">{value || "-"}</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-background rounded-lg shadow border border-border">
            {/* İş Bilgileri */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-background-soft">
              <h3 className="font-semibold text-lg text-primary border-b border-border pb-2">
                İş Bilgileri
              </h3>
              <InfoField label="Sicil Numarası" value={personnel.employeeId} />
              <InfoField
                label="Departman"
                value={personnel.jobInfo?.department}
              />
              <InfoField label="Pozisyon" value={personnel.jobInfo?.position} />
              <InfoField
                label="İşe Başlangıç Tarihi"
                value={
                  personnel.jobInfo?.startDate
                    ? format(
                        new Date(personnel.jobInfo.startDate),
                        "dd MMMM yyyy",
                        { locale: tr }
                      )
                    : "-"
                }
              />
              <InfoField
                label="Yöneticisi"
                value={personnel.manager?.fullName}
              />
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-background-soft">
              <h3 className="font-semibold text-lg text-primary border-b border-border pb-2">
                İletişim Bilgileri
              </h3>
              <InfoField label="E-posta Adresi" value={personnel.email} />
              <InfoField
                label="Telefon Numarası"
                value={personnel.contactInfo?.phone}
              />
              <InfoField label="Adres" value={personnel.contactInfo?.address} />
            </div>

            {/* Kişisel Bilgiler */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-background-soft">
              <h3 className="font-semibold text-lg text-primary border-b border-border pb-2">
                Kişisel Bilgiler
              </h3>
              <InfoField
                label="T.C. Kimlik No"
                value={personnel.personalInfo?.tcNo}
              />
              <InfoField
                label="Doğum Tarihi"
                value={
                  personnel.personalInfo?.birthDate
                    ? format(
                        new Date(personnel.personalInfo.birthDate),
                        "dd MMMM yyyy",
                        { locale: tr }
                      )
                    : "-"
                }
              />
              <InfoField
                label="Cinsiyet"
                value={personnel.personalInfo?.gender}
              />
            </div>

            {/* YENİ: Maaş Bilgileri Kartı */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-background-soft md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="font-semibold text-lg text-primary">
                  Maaş Bilgileri
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSalaryModalOpen(true)} // Bu satırda bir değişiklik yok, sorun burada değil.
                >
                  <FaPencilAlt className="mr-2" /> Düzenle
                </Button>
              </div>
              <InfoField
                label="Brüt Maaş"
                value={`${
                  personnel.salaryInfo?.grossSalary?.toLocaleString("tr-TR") ||
                  "0"
                } ${personnel.salaryInfo?.currency || "TRY"}`}
              />
            </div>
          </div>
        );
      case "assignments":
        return isLoadingAssignments ? (
          <Loader />
        ) : assignmentsData?.assignments?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignmentsData.assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="bg-background-soft p-4 rounded-lg shadow border border-border flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/50"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-text-main pr-2">
                      {assignment.item?.name || "Silinmiş Eşya"}
                    </h4>
                    <AssignmentStatusBadge status={assignment.status} />
                  </div>
                  <p className="text-sm text-text-light">
                    {assignment.item?.brand || "Marka Bilgisi Yok"}
                  </p>
                </div>
                <div className="flex flex-col justify-between flex-grow">
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-light">Demirbaş No:</span>
                      <span className="font-mono text-text-main">
                        {assignment.item?.assetTag || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-light">Zimmet Tarihi:</span>
                      <span className="text-text-main">
                        {format(
                          new Date(assignment.assignmentDate),
                          "dd MMM yyyy",
                          { locale: tr }
                        )}
                      </span>
                    </div>
                  </div>
                  {/* YAZDIR BUTONU */}
                  <div className="mt-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Kartın tıklanma olayını engelle
                        handlePrintAssignment(assignment._id);
                      }}
                    >
                      <FaPrint className="mr-2" /> Yazdır
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-text-light">
            Bu personele ait zimmet kaydı bulunmuyor.
          </p>
        );
      case "leaves":
        return (
          <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-light-gray">
                <tr>
                  <th className="th-cell">İzin Türü</th>
                  <th className="th-cell text-center">Başlangıç</th>
                  <th className="th-cell text-center">Bitiş</th>
                  <th className="th-cell text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingLeaves ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center">
                      <Loader />
                    </td>
                  </tr>
                ) : leavesData?.length > 0 ? (
                  leavesData.map((leave) => (
                    <tr
                      key={leave._id}
                      className="hover:bg-background-soft transition-colors"
                    >
                      <td className="td-cell font-medium">{leave.leaveType}</td>
                      <td className="td-cell text-center">
                        {format(new Date(leave.startDate), "dd MMM yyyy", {
                          locale: tr,
                        })}
                      </td>
                      <td className="td-cell text-center">
                        {format(new Date(leave.endDate), "dd MMM yyyy", {
                          locale: tr,
                        })}
                      </td>
                      <td className="td-cell text-center">
                        <LeaveStatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-text-light">
                      Bu personele ait izin kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "documents":
        return <PersonnelDocuments personnelId={personnelId} />;
      case "attendance":
        return (
          <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-light-gray">
                <tr>
                  <th className="th-cell">Giriş Tarihi</th>
                  <th className="th-cell text-center">Çıkış Tarihi</th>
                  <th className="th-cell text-center">Çalışma Süresi</th>
                  <th className="th-cell text-center">Fazla Mesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingAttendance ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center">
                      <Loader />
                    </td>
                  </tr>
                ) : attendanceData?.length > 0 ? (
                  attendanceData.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-background-soft transition-colors"
                    >
                      <td className="td-cell font-medium">
                        {format(
                          new Date(record.checkIn),
                          "dd MMM yyyy, HH:mm",
                          { locale: tr }
                        )}
                      </td>
                      <td className="td-cell text-center">
                        {record.checkOut
                          ? format(
                              new Date(record.checkOut),
                              "dd MMM yyyy, HH:mm",
                              { locale: tr }
                            )
                          : "Çıkış Yapılmadı"}
                      </td>
                      <td className="td-cell text-center">
                        {record.workDuration
                          ? `${record.workDuration} dk`
                          : "-"}
                      </td>
                      <td className="td-cell text-center font-semibold text-primary">
                        {record.overtime > 0 ? `${record.overtime} dk` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-text-light">
                      Bu personele ait mesai kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case "actions":
        return (
          <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-light-gray">
                <tr>
                  <th className="th-cell">İşlem</th>
                  <th className="th-cell">Detay</th>
                  <th className="th-cell text-center">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingAuditLogs ? (
                  <tr>
                    <td colSpan="3" className="p-4 text-center">
                      <Loader />
                    </td>
                  </tr>
                ) : auditLogsData?.length > 0 ? (
                  auditLogsData.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-background-soft transition-colors"
                    >
                      <td className="td-cell font-medium text-primary">
                        {log.action}
                      </td>
                      <td className="td-cell">{log.details}</td>
                      <td className="td-cell text-center text-text-light">
                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: tr,
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-text-light">
                      Bu personelle ilgili bir işlem kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FaUser className="text-secondary text-2xl" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
              {personnel.fullName}
            </h1>
            <p className="text-sm text-text-light">
              {personnel.jobInfo?.position} • {personnel.jobInfo?.department}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
          <FaPencilAlt className="mr-2" /> Düzenle
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="mb-6">
        <div className="inline-flex items-center p-1 space-x-1 bg-background-soft rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow"
                  : "text-text-light hover:bg-background-light hover:text-text-main"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab İçeriği */}
      {renderContent()}

      {/* Düzenleme Modalı */}
      <PersonnelFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => updatePersonnelMutation.mutate(data)}
        mode="edit"
        currentItem={personnel}
        personnelList={allPersonnelForSelect}
      />

      {/* YENİ: Maaş Düzenleme Modalı */}
      <SalaryInfoModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        onSubmit={(data) => updateSalaryMutation.mutate(data)}
        personnel={personnel}
      />
    </div>
  );
};

export default PersonnelDetailsPage;
