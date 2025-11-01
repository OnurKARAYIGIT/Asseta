import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaClipboardList } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import { usePendingCount } from "../contexts/PendingCountContext";
import { useSettings } from "../hooks/SettingsContext";
// Yeni oluşturduğumuz bileşenleri import edelim
import AssignmentsToolbar from "../components/assignments/AssignmentsToolbar";
import AssignmentsTable from "../components/assignments/AssignmentsTable";
import AssignmentsPagination from "../components/assignments/AssignmentsPagination";
import AddAssignmentModal from "../components/assignments/AddAssignmentModal";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import * as XLSX from "xlsx"; // XLSX hala handleExport için gerekli
import AssignmentDetailModal from "../components/assignments/AssignmentDetailModal";
import SummaryModal from "../components/assignments/SummaryModal";
const AssignmentsPage = () => {
  // Modal state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  // Özet Modalı için state'ler
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const [summaryType, setSummaryType] = useState("personnel"); // 'personnel' veya 'item'
  const [summaryPersonnelId, setSummaryPersonnelId] = useState(null); // Özet modalı için personel ID'si
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Arama ve Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = useState(1);

  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  const { settings } = useSettings();
  const [itemsPerPage, setItemsPerPage] = useState(settings.itemsPerPage || 15);

  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useAuth();
  const { refetchPendingCount } = usePendingCount();
  const queryClient = useQueryClient();

  // Arama terimini gecikmeli olarak güncellemek için (her tuşa basıldığında API isteği yapmamak için)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
    }, 500); // 500ms bekle

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // URL'den gelen arama terimini dinle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword") || "";
    // Eğer URL'deki arama terimi mevcut state'ten farklıysa, state'i güncelle
    if (keyword !== searchTerm) {
      setSearchTerm(keyword);
    }

    // URL'den gelen filtreleri state'e ata
    const statusFromUrl = params.get("status");
    if (statusFromUrl) {
      // Bu sayfa sadece "Beklemede" olmayanları gösterdiği için,
      // bu filtreyi şimdilik uygulamıyoruz ama altyapı hazır.
    }
    const locationFromUrl = params.get("location");
    if (locationFromUrl) setFilterLocation(locationFromUrl);
  }, [location.search, searchTerm]);

  // URL'den gelen modal açma isteğini dinle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modalId = params.get("openModal");

    if (modalId) {
      // React Query cache'inden veriyi bulmaya çalış
      const allAssignments = queryClient.getQueriesData(["assignments"]);
      let assignmentToOpen = null;
      allAssignments.forEach((query) => {
        const data = query[1];
        const found = data?.assignments?.find((a) => a._id === modalId);
        if (found) {
          assignmentToOpen = found;
        }
      });

      if (assignmentToOpen) {
        handleRowClick(assignmentToOpen);
      }
    }
  }, [location.search, queryClient]); // queryClient'ı bağımlılıklara ekle

  // --- React Query ile Veri Çekme ---

  // 1. Ana Zimmet Listesi
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    isError: assignmentsIsError,
    error: assignmentsError,
  } = useQuery({
    queryKey: [
      "assignments",
      {
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        filterLocation,
        sortConfig,
      },
    ],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        keyword: debouncedSearchTerm,
        location: filterLocation,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      const { data } = await axiosInstance.get("/assignments", { params });
      return data;
    },
    keepPreviousData: true, // Sayfalar arası geçişte eski veriyi tut, daha akıcı bir deneyim için
  });

  // 2. Şirket/Konum Listesi
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika boyunca veriyi taze kabul et
  });

  // 3. Boştaki Eşya Listesi
  const { data: availableItems = [] } = useQuery({
    queryKey: ["availableItems"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        "/items?status=Boşta&limit=1000"
      );
      return data.items;
    },
    staleTime: 1000 * 60, // 1 dakika boyunca veriyi taze kabul et
  });

  // React Query'den gelen verileri bileşenin kullanacağı değişkenlere ata
  const assignments = assignmentsData?.assignments || [];
  const totalPages = assignmentsData?.pages || 1;

  // --- React Query ile Veri Değiştirme (Mutations) ---

  const invalidateAssignments = () => {
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    refetchPendingCount();
  };

  // Esc tuşu ile modalları kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (isAddModalOpen) setIsAddModalOpen(false); // AddAssignmentModal'ı da kapat
        if (assignmentToDelete) setAssignmentToDelete(null);
        if (isSummaryModalOpen) setIsSummaryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isModalOpen, isAddModalOpen, assignmentToDelete, isSummaryModalOpen]);

  const addAssignmentMutation = useMutation({
    mutationFn: (newAssignmentData) =>
      axiosInstance.post("/assignments", newAssignmentData),
    onSuccess: () => {
      invalidateAssignments();
      toast.success("Yeni zimmet başarıyla oluşturuldu ve beklemeye alındı.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Zimmet oluşturulurken bir hata oluştu."
      );
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, updatedData }) => {
      return axiosInstance.put(`/assignments/${assignmentId}`, updatedData);
    },
    onSuccess: () => {
      invalidateAssignments();
      setIsModalOpen(false);
      toast.success("Zimmet başarıyla güncellendi!");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Güncelleme sırasında bir hata oluştu."
      );
    },
  });

  const handleUpdateAssignment = async (formData, formFile) => {
    if (!selectedAssignment) return;

    let updatedData = { ...formData };

    // Eşya verilerini ayır
    const assignmentData = {};
    const itemData = {};
    Object.keys(updatedData).forEach((key) => {
      if (key.startsWith("item.")) {
        itemData[key.replace("item.", "")] = updatedData[key];
      } else {
        assignmentData[key] = updatedData[key];
      }
    });

    updatedData = assignmentData;
    updatedData.itemData = itemData;

    if (formFile) {
      const fileFormData = new FormData();
      fileFormData.append("form", formFile);
      try {
        const { data } = await axiosInstance.post("/upload", fileFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedData.formPath = data.filePath;
      } catch (err) {
        toast.error("Dosya yüklenirken bir hata oluştu.");
        return;
      }
    }

    updateAssignmentMutation.mutate({
      assignmentId: selectedAssignment._id,
      updatedData,
    });
  };

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId) =>
      axiosInstance.delete(`/assignments/${assignmentId}`),
    onSuccess: () => {
      invalidateAssignments();
      setAssignmentToDelete(null); // Modalı kapat ve listeyi yenile
      toast.success("Zimmet başarıyla silindi.");
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Silme işlemi sırasında bir hata oluştu."
      );
      setAssignmentToDelete(null);
    },
  });

  const confirmDeleteHandler = () => {
    if (assignmentToDelete) {
      deleteAssignmentMutation.mutate(assignmentToDelete._id);
    }
  };

  const handleExport = () => {
    const dataToExport = assignments.map((assignment) => ({
      "Çalıştığı Firma": assignment.company.name,
      "Varlık Alt Kategori": assignment.item.assetSubType,
      "Varlık Cinsi": assignment.item.assetType,
      "Kayıtlı Bölüm": assignment.registeredSection,
      "Demirbaş No": assignment.item.assetTag,
      "Bulunduğu Birim": assignment.unit,
      "Bulunduğu Yer": assignment.location,
      "Kullanıcı Adı": assignment.personnelName,
      "Sabit Kıymet Cinsi": assignment.item.fixedAssetType,
      Marka: assignment.item.brand,
      Özellik: assignment.item.description,
      "Model Yılı": assignment.item.modelYear,
      "Seri No": assignment.item.serialNumber,
      "Mac/IP Adresi": assignment.item.networkInfo,
      "Kurulu Programlar": assignment.item.softwareInfo,
      "Eski Kullanıcı": assignment.previousUser,
      Açıklama: assignment.assignmentNotes,
      Tarih: new Date(assignment.assignmentDate).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "0056B3" } },
    };
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }
    ws["!freeze"] = { y: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Zimmetler");
    XLSX.writeFile(wb, "Zimmet_Listesi.xlsx");
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Sıralama değiştiğinde ilk sayfaya dön
  };

  // Ayarlardan gelen sütunları ve sıralamalarını tanımla
  const allColumns = [
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

  const handleRowClick = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSummaryClick = async (type, value) => {
    setSummaryTitle(
      `${value} için ${
        type === "personnel" ? "Personel Özeti" : "Eşya Geçmişi"
      }`
    );
    setIsSummaryModalOpen(true);
    setSummaryLoading(true);
    setSummaryData([]);

    try {
      let params = {};
      if (type === "personnel") {
        setSummaryType("personnel");
        params.personnelName = value;
        const { data } = await axiosInstance.get("/assignments/search", {
          params,
        });
        // Backend gruplanmış veri döndürüyor
        if (data && data.length > 0) {
          setSummaryData(data[0].assignments);
          // Detaylı rapora git butonu için personel ID'sini sakla
          setSummaryPersonnelId(data[0].personnelId);
        }
      } else if (type === "item") {
        setSummaryType("item");
        // Eşyanın demirbaş numarasına göre tüm zimmetlerini getiren yeni bir yol kullanabiliriz.
        // Şimdilik, mevcut endpoint'i keyword ile kullanarak bir çözüm üretiyoruz.
        const { data: itemAssignments } = await axiosInstance.get(
          "/assignments/search",
          {
            params: { itemAssetTag: value }, // Yeni parametreyi kullan
          }
        );
        setSummaryData(
          itemAssignments.length > 0 ? itemAssignments[0].assignments : []
        );
      }
    } catch (err) {
      console.error("Özet verisi çekilirken hata oluştu:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      {assignmentsLoading ? (
        <Loader />
      ) : assignmentsIsError ? (
        <p style={{ color: "red" }}>{assignmentsError.message}</p>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <FaClipboardList className="text-secondary text-2xl" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
              Zimmet Yönetimi
            </h1>
          </div>
          <AssignmentsToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            companies={companies}
            handleExport={handleExport}
            onAddNew={() => setIsAddModalOpen(true)}
          />
          <AssignmentsTable
            assignments={assignments}
            columns={allColumns}
            visibleColumns={settings.visibleColumns?.assignments || []}
            sortConfig={sortConfig}
            handleSort={handleSort}
            handleRowClick={handleRowClick}
            handleSummaryClick={handleSummaryClick}
            handleDelete={(assignment) => setAssignmentToDelete(assignment)}
            userInfo={userInfo}
          />
          <AssignmentsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            assignments={assignments}
          />
        </>
      )}

      {/* MODALLAR */}
      <AddAssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data) => {
          try {
            await addAssignmentMutation.mutateAsync(data);
            return true; // Başarılı olursa modal'a true döndür
          } catch (error) {
            return false; // Başarısız olursa false döndür
          }
        }}
        availableItems={availableItems}
        companies={companies}
      />

      <AssignmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        companies={companies}
        onUpdate={handleUpdateAssignment}
        onDelete={() => {
          setAssignmentToDelete(selectedAssignment);
          setIsModalOpen(false);
        }}
        userInfo={userInfo}
      />

      <ConfirmationModal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={confirmDeleteHandler}
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
        title="Zimmet Kaydını Silme Onayı"
      >
        <p>
          <strong>{assignmentToDelete?.personnelName}</strong> personeline ait{" "}
          <strong>{assignmentToDelete?.item?.name}</strong> zimmet kaydını
          kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri
          alınamaz.
        </p>
      </ConfirmationModal>

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title={summaryTitle}
        loading={summaryLoading}
        data={summaryData}
        type={summaryType}
        onGoToDetails={() => {
          setIsSummaryModalOpen(false);
          if (summaryPersonnelId) {
            navigate(`/personnel/${summaryPersonnelId}/details`);
          }
        }}
      />
    </div>
  );
};

export default AssignmentsPage;
