import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import "./AssignmentsPage.css";
import * as XLSX from "xlsx";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import {
  FaClipboardList,
  FaEdit,
  FaTrash,
  FaFileExcel,
  FaFileDownload,
  FaSave,
  FaHistory,
  FaCheck,
  FaUpload,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import { usePendingCount } from "../contexts/PendingCountContext";
import { useSettings } from "../hooks/SettingsContext";

const AssignmentsPage = () => {
  // Data states
  const [assignments, setAssignments] = useState([]);
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Yeni Zimmet Formu için birleşik state
  const initialFormState = {
    personnelName: "",
    personnelId: "",
    items: [], // Tekil 'item' yerine 'items' dizisi
    unit: "",
    registeredSection: "",
    company: "",
    previousUser: "",
    assignmentNotes: "",
  };
  const [newAssignmentData, setNewAssignmentData] = useState(initialFormState);
  const [availableItems, setAvailableItems] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [formFile, setFormFile] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

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
  const [modalFormData, setModalFormData] = useState({});
  const [editFormFile, setEditFormFile] = useState(null);
  // Detay modalındaki geçmiş listesi için sıralama state'i
  const [historySortDirection, setHistorySortDirection] = useState("desc");

  // Arama ve Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Sayfalama state'leri
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sıralama state'i
  const [sortConfig, setSortConfig] = useState({
    key: "updatedAt",
    direction: "desc",
  });

  const { settings } = useSettings();
  const [itemsPerPage, setItemsPerPage] = useState(settings.itemsPerPage || 15);

  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useAuth();
  const { refetchPendingCount } = usePendingCount();

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
  }, [location.search]);

  // URL'den gelen modal açma isteğini dinle
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modalId = params.get("openModal");

    if (modalId) {
      const openModalForAssignment = async () => {
        try {
          // Önce tüm zimmetlerin yüklenmesini bekle veya direkt API'den çek
          const { data: assignmentToOpen } = await axiosInstance.get(
            `/assignments/${modalId}`
          );
          if (assignmentToOpen) {
            handleRowClick(assignmentToOpen);
          }
        } catch (error) {
          console.error("Modal açılırken zimmet bulunamadı:", error);
        }
      };
      openModalForAssignment();
    }
  }, [location.search]); // Sadece location.search değiştiğinde çalışsın

  // Statik verileri (eşyalar, konumlar) sadece bir kere çek
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [itemsRes, companiesRes] = await Promise.all([
          // Tüm eşyaları getirmek için limiti yüksek tutuyoruz
          axiosInstance.get("/items", { params: { limit: 10000 } }),
          axiosInstance.get("/locations"),
        ]);
        // Gelen nesnenin içindeki 'items' dizisini al
        setItems(itemsRes.data.items);
        setCompanies(companiesRes.data); // Bu endpoint zaten bir dizi döndürüyor
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Yardımcı veriler getirilirken bir hata oluştu."
        );
      }
    };
    if (userInfo?.token) {
      fetchStaticData();
    }
  }, [userInfo?.token]);

  // Sadece boştaki eşyaları çekmek için
  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/items?status=Boşta&limit=1000"
        );
        setAvailableItems(data.items);
      } catch (err) {
        console.error("Boştaki eşyalar getirilemedi:", err);
      }
    };
    fetchAvailableItems();
  }, []);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        keyword: debouncedSearchTerm,
        location: filterLocation,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      const { data } = await axiosInstance.get("/assignments", { params });

      setAssignments(data.assignments || []);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Zimmetler getirilemedi.");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchTerm,
    filterLocation,
    sortConfig,
  ]);

  // Dinamik zimmet verilerini filtreler değiştikçe çek
  useEffect(() => {
    if (userInfo?.token) {
      fetchAssignments();
    }
  }, [userInfo?.token, fetchAssignments]);

  // Esc tuşu ile modalları kapatma
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (assignmentToDelete) setAssignmentToDelete(null);
        if (isSummaryModalOpen) setIsSummaryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isModalOpen, isAddModalOpen, assignmentToDelete, isSummaryModalOpen]);

  // ... (diğer kodlar)

  const submitHandler = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitError("");
      const { personnelName, items, company, unit } = newAssignmentData;
      if (!personnelName || items.length === 0 || !company || !unit) {
        setSubmitError(
          "Kullanıcı Adı, Eşya, Çalıştığı Firma, Bulunduğu Birim ve Bulunduğu Yer alanları zorunludur."
        );
        return;
      }

      try {
        await axiosInstance.post("/assignments", {
          ...newAssignmentData, // Backend varsayılan olarak "Beklemede" atayacak
        });
        // Tablo zaten useEffect tarafından yenilenecek, ancak anında geri bildirim için ilk sayfaya dönebiliriz.
        fetchAssignments(); // Listeyi anında yenile
        // Formu sıfırla
        setNewAssignmentData(initialFormState);
        setItemSearch("");
        setFormFile(null);
        setIsAddModalOpen(false); // Form gönderildikten sonra modalı kapat
        refetchPendingCount(); // Rozeti güncelle
      } catch (err) {
        setSubmitError(
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message
        );
      }
    },
    [newAssignmentData, fetchAssignments, initialFormState, refetchPendingCount]
  );

  // Yeni zimmet formu için genel state güncelleme fonksiyonu
  const handleNewAssignmentChange = (e) => {
    const { name, value } = e.target;
    setNewAssignmentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Toplu zimmet için eşya seçme/kaldırma
  const handleItemSelection = (itemId) => {
    setNewAssignmentData((prev) => {
      const newItems = prev.items.includes(itemId)
        ? prev.items.filter((id) => id !== itemId)
        : [...prev.items, itemId];
      return { ...prev, items: newItems };
    });
  };

  const handlePrintForm = (isTemplate = false) => {
    const {
      personnelName,
      unit,
      items: itemIds,
      company: companyId,
    } = newAssignmentData;

    // Seçilen tüm eşyaların bilgilerini al
    const selectedItems = availableItems.filter((i) => itemIds.includes(i._id));
    const selectedCompany = companies.find((c) => c._id === companyId) || {};

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Zimmet Teslim Tutanağı</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1, h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            .signatures { margin-top: 80px; display: flex; justify-content: space-between; }
            .signature-box { text-align: center; width: 45%; }
            .signature-box p { margin-top: 60px; border-top: 1px solid #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <h1>ZİMMET TESLİM TUTANAĞI</h1>
          <p><strong>Tarih:</strong> ${
            isTemplate
              ? "..... / ..... / ......"
              : new Date().toLocaleDateString("tr-TR")
          }</p>
          <h2>TESLİM EDİLEN MALZEME(LER)</h2>
          <table>
            <thead>
              <tr>
                <th>Demirbaş No</th>
                <th>Malzeme Cinsi</th>
                <th>Marka / Model</th>
                <th>Seri Numarası</th>
              </tr>
            </thead>
            <tbody>
              ${selectedItems
                .map(
                  (item) => `
                <tr><td>${item.assetTag || "-"}</td><td>${
                    item.assetType || "-"
                  }</td><td>${item.brand || "-"}</td><td>${
                    item.serialNumber || "-"
                  }</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
          <h2>TESLİM ALAN PERSONEL BİLGİLERİ</h2>
          <table>
            <tr><th>Adı Soyadı</th><td>${personnelName || ""}</td></tr>
            <tr><th>Birim / Departman</th><td>${unit || ""}</td></tr>
            <tr><th>Çalıştığı Firma</th><td>${
              selectedCompany.name || ""
            }</td></tr>
          </table>
          <p style="margin-top: 20px;">Yukarıda bilgileri yazılı demirbaş/malzemeyi sağlam ve çalışır durumda teslim aldım. Malzemenin kullanımından ve muhafazasından sorumlu olduğumu, görevimden ayrılmam veya görev yerimin değişmesi durumunda malzemeyi ilgili birime teslim etmeyi kabul ve taahhüt ederim.</p>
          <div class="signatures">
            <div class="signature-box"><strong>Teslim Eden</strong><p>Adı Soyadı / İmza</p></div>
            <div class="signature-box"><strong>Teslim Alan</strong><p>Adı Soyadı / İmza</p></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleFileChange = (e) => {
    setFormFile(e.target.files[0]);
  };

  const confirmDeleteHandler = async () => {
    if (!assignmentToDelete) return;
    try {
      await axiosInstance.delete(`/assignments/${assignmentToDelete._id}`);
      setAssignmentToDelete(null); // Modalı kapat ve listeyi yenile
      fetchAssignments();
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : "Silme işlemi sırasında bir hata oluştu."
      );
      setAssignmentToDelete(null);
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="sort-icon" />;
    }
    if (sortConfig.direction === "asc") {
      return <FaSortUp className="sort-icon active" />;
    }
    return <FaSortDown className="sort-icon active" />;
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

  const handleModalFormChange = (e) => {
    if (e.target.name === "formFile") {
      setEditFormFile(e.target.files[0]);
      return;
    }
    setModalFormData({
      ...modalFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleModalUpdate = async () => {
    if (!selectedAssignment) return;

    let updatedData = { ...modalFormData };

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

    if (editFormFile) {
      const fileFormData = new FormData();
      fileFormData.append("form", editFormFile);
      try {
        const { data } = await axiosInstance.post("/upload", fileFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedData.formPath = data.filePath;
      } catch (err) {
        console.error("Dosya yüklenirken hata oluştu:", err);
        // Hata mesajı gösterilebilir
        return;
      }
    }

    try {
      await axiosInstance.put(
        `/assignments/${selectedAssignment._id}`,
        updatedData
      );
      setIsModalOpen(false);
      fetchAssignments(); // Güncelleme sonrası listeyi anında yenile
      toast.success("Zimmet başarıyla güncellendi!");
    } catch (err) {
      // Hata yönetimi eklenebilir
      console.error("Modal üzerinden güncelleme başarısız oldu", err);
      // Kullanıcıya bir toast bildirimi ile hata gösterilebilir.
      toast.error("Güncelleme sırasında bir hata oluştu.");
    }
  };

  const currentAssignments = assignments;

  const handleRowClick = (assignment) => {
    setSelectedAssignment(assignment);
    // Modal açıldığında, form verilerini seçilen zimmetle doldur
    setModalFormData({
      personnelName: assignment.personnelName,
      unit: assignment.unit,
      location: assignment.location,
      registeredSection: assignment.registeredSection,
      previousUser: assignment.previousUser,
      assignmentNotes: assignment.assignmentNotes,
      status: assignment.status,
      company: assignment.company?._id,
      assignmentDate: new Date(assignment.assignmentDate)
        .toISOString()
        .split("T")[0],
      // Eşya bilgilerini de forma ekle
      "item.assetSubType": assignment.item?.assetSubType,
      "item.fixedAssetType": assignment.item?.fixedAssetType,
      "item.brand": assignment.item?.brand,
      "item.description": assignment.item?.description,
      "item.modelYear": assignment.item?.modelYear,
      "item.serialNumber": assignment.item?.serialNumber,
      "item.networkInfo": assignment.item?.networkInfo,
      "item.softwareInfo": assignment.item?.softwareInfo,
      // Demirbaş No ve Eşya Adı gibi kritik alanlar düzenlenemez olmalı
      returnDate: assignment.returnDate
        ? new Date(assignment.returnDate).toISOString().split("T")[0]
        : "",
    });
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

  // Geçmiş kayıtlarını kullanıcı dostu bir formata çeviren fonksiyon
  const formatHistoryChange = (change) => {
    const fieldTranslations = {
      status: "Durum",
      returnDate: "İade Tarihi",
      assignmentNotes: "Açıklama",
      personnelName: "Kullanıcı Adı",
      unit: "Birim",
      location: "Konum",
      registeredSection: "Kayıtlı Bölüm",
      previousUser: "Eski Kullanıcı",
      formPath: "Zimmet Formu",
      company: "Çalıştığı Firma",
      assignmentDate: "Zimmet Tarihi",
      "item.brand": "Marka",
      "item.modelYear": "Model Yılı",
      "item.serialNumber": "Seri No",
      "item.fixedAssetType": "Sabit Kıymet Cinsi",
      "item.assetSubType": "Varlık Alt Kategori",
      "item.networkInfo": "Mac/IP Adresi",
      "item.softwareInfo": "Kurulu Programlar",
    };

    const formatValue = (field, value) => {
      if (value === null || value === undefined || value === "")
        return <span className="change-value empty">Boş</span>;
      if (field === "company") {
        const company = companies.find((c) => c._id === value);
        return <span className="change-value">{company?.name || value}</span>;
      }
      if (field.includes("Date")) {
        return (
          <span className="change-value date">
            {new Date(value).toLocaleDateString("tr-TR")}
          </span>
        );
      }
      return <span className="change-value">{value}</span>;
    };

    const fieldName = fieldTranslations[change.field] || change.field;

    if (change.field === "formPath" && !change.from) {
      return (
        <li key={change.field} className="change-item">
          <strong className="change-field">{fieldName}:</strong>
          <span className="change-value new">Yeni form eklendi</span>
        </li>
      );
    }

    return (
      <li key={change.field} className="change-item">
        <strong className="change-field">{fieldName}:</strong>
        <div className="change-values">
          {formatValue(change.field, change.from)}
          <span className="change-arrow">→</span>
          {formatValue(change.field, change.to)}
        </div>
      </li>
    );
  };

  // Sayfalama için gösterilecek sayfa aralığını hesaplayan fonksiyon
  const getPaginationRange = () => {
    const maxVisibleButtons = 5;
    if (totalPages <= maxVisibleButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisibleButtons / 2)
    );
    let endPage = startPage + maxVisibleButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisibleButtons + 1;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };
  return (
    <div className="page-container">
      {loading ? (
        <Loader />
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div className="table-container">
            <div className="page-header no-print">
              <h1>
                <FaClipboardList style={{ color: "var(--secondary-color)" }} />{" "}
                Zimmet Yönetimi
              </h1>
              {userInfo &&
                (userInfo.role === "admin" ||
                  userInfo.role === "developer") && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FaPlus />
                    Yeni Zimmet Ekle
                  </button>
                )}
            </div>

            {/* Filtreleme ve Aksiyon Araç Çubuğu */}
            <div className="filter-toolbar no-print">
              <div className="toolbar-group">
                <input
                  type="text"
                  placeholder="Ara (Personel, Eşya, Seri No...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ minWidth: "250px" }}
                />
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  <option value="">Tüm Konumlar</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExport}
                style={{
                  backgroundColor: "#1D6F42",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaFileExcel style={{ fontSize: "1.2rem" }} />
                Excele Aktar
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
              className="no-print"
            >
              <h2 style={{ margin: 0, flexGrow: 1 }}>Mevcut Zimmetler</h2>
            </div>
            <table>
              <thead>
                <tr>
                  {allColumns
                    .filter((col) =>
                      settings.visibleColumns?.assignments.includes(col.key)
                    )
                    .map((col) => (
                      <th
                        key={col.key}
                        className="sortable"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.name}
                        {getSortIcon(col.key)}
                      </th>
                    ))}
                  <th className="no-sort">Form</th>
                  <th className="no-sort">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {currentAssignments.map((assignment) => (
                  <tr
                    key={assignment._id}
                    onClick={() => handleRowClick(assignment)}
                    style={{ cursor: "pointer" }}
                  >
                    {allColumns
                      .filter((col) =>
                        settings.visibleColumns?.assignments.includes(col.key)
                      )
                      .map((col) => {
                        // Nested property access (e.g., 'item.name')
                        const getNestedValue = (obj, path) => {
                          const keys = path.split(".");
                          let result = obj;
                          for (const key of keys) {
                            if (result && typeof result === "object") {
                              result = result[key];
                            } else {
                              return undefined;
                            }
                          }
                          return result;
                        };
                        const value = getNestedValue(assignment, col.key);

                        if (col.key.includes("Date")) {
                          return (
                            <td key={col.key}>
                              {value
                                ? new Date(value).toLocaleDateString("tr-TR")
                                : "-"}
                            </td>
                          );
                        }
                        if (col.key === "item.assetTag") {
                          return <td key={col.key}>{value || "-"}</td>;
                        }
                        if (col.key === "personnelName") {
                          return (
                            <td key={col.key}>
                              <span
                                className="link-button"
                                onClick={(e) => {
                                  // Personel adına tıklayınca özet modalı açılır
                                  e.stopPropagation();
                                  handleSummaryClick("personnel", value);
                                }}
                              >
                                {value}
                              </span>
                            </td>
                          );
                        }
                        if (col.key === "item.assetTag") {
                          return (
                            <td key={col.key}>
                              <span
                                className="link-button"
                                onClick={(e) => {
                                  // Demirbaş No'ya tıklayınca eşya geçmişi özet modalı açılır
                                  e.stopPropagation();
                                  handleSummaryClick("item", value);
                                }}
                              >
                                {value || "-"}
                              </span>
                            </td>
                          );
                        }
                        return <td key={col.key}>{value || "-"}</td>;
                      })}
                    <td>
                      {assignment.formPath && (
                        <a
                          href={`http://localhost:5001${assignment.formPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Zimmet Formunu Görüntüle"
                        >
                          <FaFileDownload
                            style={{
                              color: "var(--primary-color)",
                              fontSize: "1.2rem",
                            }}
                          />
                        </a>
                      )}
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", gap: "0.5rem" }}
                    >
                      {(userInfo.role === "admin" ||
                        userInfo.role === "developer") && (
                        <>
                          <button
                            title="Sil"
                            onClick={() => setAssignmentToDelete(assignment)}
                            style={{
                              backgroundColor: "var(--danger-color)",
                              padding: "8px 12px",
                            }}
                          >
                            <FaTrash />
                          </button>
                          <button
                            title="Geçmişi Görüntüle"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(assignment);
                            }}
                            style={{ padding: "8px 12px" }}
                          >
                            <FaHistory />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination no-print">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                &laquo;&laquo;
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Geri
              </button>
              {getPaginationRange().map((number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={currentPage === number ? "active" : ""}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage === totalPages || assignments.length === 0
                }
              >
                İleri &raquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={
                  currentPage === totalPages || assignments.length === 0
                }
              >
                &raquo;&raquo;
              </button>
            </div>
          )}
        </>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedAssignment
            ? `${selectedAssignment.item?.name || "Eşya"} (Demirbaş: ${
                selectedAssignment.item?.assetTag
              }) - Zimmet Detayı`
            : "Zimmet Detayı"
        }
      >
        {selectedAssignment && (
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleModalUpdate();
              }}
            >
              <div className="detail-grid">
                <strong>Çalıştığı Firma:</strong>
                <select
                  name="company"
                  value={modalFormData.company || ""}
                  onChange={handleModalFormChange}
                >
                  <option value="">Firma Seçin...</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <strong>Zimmet Tarihi:</strong>
                <input
                  type="date"
                  name="assignmentDate"
                  value={modalFormData.assignmentDate || ""}
                  max={new Date().toISOString().split("T")[0]} // En fazla bugünün tarihini seçtir
                  onChange={handleModalFormChange}
                />
                <strong
                  style={{
                    gridColumn: "1 / -1",
                    marginTop: "1rem",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "1rem",
                  }}
                >
                  Eşya Bilgileri (Bu Eşyaya Ait Tüm Zimmetleri Etkiler)
                </strong>
                <strong>Marka:</strong>
                <input
                  type="text"
                  name="item.brand"
                  value={modalFormData["item.brand"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Model Yılı:</strong>
                <input
                  type="text"
                  name="item.modelYear"
                  value={modalFormData["item.modelYear"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Seri No:</strong>
                <input
                  type="text"
                  name="item.serialNumber"
                  value={modalFormData["item.serialNumber"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Sabit Kıymet Cinsi:</strong>
                <input
                  type="text"
                  name="item.fixedAssetType"
                  value={modalFormData["item.fixedAssetType"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Varlık Alt Kategori:</strong>
                <input
                  type="text"
                  name="item.assetSubType"
                  value={modalFormData["item.assetSubType"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Mac/IP Adresi:</strong>
                <input
                  type="text"
                  name="item.networkInfo"
                  value={modalFormData["item.networkInfo"] || ""}
                  onChange={handleModalFormChange}
                />
                <strong style={{ alignSelf: "start" }}>
                  Kurulu Programlar:
                </strong>
                <textarea
                  name="item.softwareInfo"
                  value={modalFormData["item.softwareInfo"] || ""}
                  onChange={handleModalFormChange}
                  rows="3"
                />
                <strong>Kullanıcı Adı:</strong>
                <input
                  type="text"
                  name="personnelName"
                  value={modalFormData.personnelName || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Bulunduğu Birim:</strong>
                <input
                  type="text"
                  name="unit"
                  value={modalFormData.unit || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Bulunduğu Yer:</strong>
                <input
                  type="text"
                  name="location"
                  value={modalFormData.location || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Kayıtlı Bölüm:</strong>
                <input
                  type="text"
                  name="registeredSection"
                  value={modalFormData.registeredSection || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Eski Kullanıcı:</strong>
                <input
                  type="text"
                  name="previousUser"
                  value={modalFormData.previousUser || ""}
                  onChange={handleModalFormChange}
                />
                <strong>Durum:</strong>
                <select
                  name="status"
                  value={modalFormData.status}
                  onChange={handleModalFormChange}
                >
                  <option value="Beklemede">Beklemede</option>
                  <option value="Zimmetli">Zimmetli</option>
                  <option value="İade Edildi">İade Edildi</option>
                  <option value="Arızalı">Arızalı</option>
                  <option value="Hurda">Hurda</option>
                </select>

                {modalFormData.status === "İade Edildi" && (
                  <>
                    <strong>İade Tarihi:</strong>
                    <input
                      type="date"
                      name="returnDate"
                      value={modalFormData.returnDate || ""}
                      max={new Date().toISOString().split("T")[0]} // En fazla bugünün tarihini seçtir
                      onChange={handleModalFormChange}
                    />
                  </>
                )}
                <strong style={{ alignSelf: "start" }}>Açıklama:</strong>
                <textarea
                  name="assignmentNotes"
                  value={modalFormData.assignmentNotes || ""}
                  onChange={handleModalFormChange}
                  rows="3"
                />
                <strong>Zimmet Formu:</strong>
                <span>
                  {selectedAssignment.formPath ? (
                    <a
                      href={`http://localhost:5001${selectedAssignment.formPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Formu Görüntüle
                    </a>
                  ) : (
                    "Yüklenmemiş"
                  )}
                </span>
                <div className="history-log-header">
                  <strong>Zimmet Geçmişi:</strong>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      setHistorySortDirection(
                        historySortDirection === "asc" ? "desc" : "asc"
                      )
                    }
                  >
                    Tarihe Göre Sırala{" "}
                    {historySortDirection === "asc" ? (
                      <FaSortUp />
                    ) : (
                      <FaSortDown />
                    )}
                  </button>
                </div>
                <div className="history-log">
                  {selectedAssignment.history &&
                  selectedAssignment.history.length > 0 ? (
                    <ul>
                      {[...selectedAssignment.history]
                        .sort((a, b) =>
                          historySortDirection === "asc"
                            ? new Date(a.timestamp) - new Date(b.timestamp)
                            : new Date(b.timestamp) - new Date(a.timestamp)
                        )
                        .map((h) => (
                          <div key={h._id} className="history-item">
                            <div className="history-item-header">
                              <span className="history-user">{h.username}</span>
                              <span className="history-date">
                                {new Date(h.timestamp).toLocaleString("tr-TR")}
                              </span>
                            </div>
                            <ul className="history-changes-list">
                              {h.changes.map(formatHistoryChange)}
                            </ul>
                          </div>
                        ))}
                    </ul>
                  ) : (
                    <span>Geçmiş kaydı bulunmuyor.</span>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                {(userInfo.role === "admin" ||
                  userInfo.role === "developer") && (
                  <button
                    type="submit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FaSave /> Değişiklikleri Kaydet
                  </button>
                )}
                {(userInfo.role === "admin" ||
                  userInfo.role === "developer") && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentToDelete(selectedAssignment);
                      setIsModalOpen(false);
                    }}
                    style={{
                      backgroundColor: "var(--danger-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FaTrash /> Sil
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </Modal>
      {/* Yeni Zimmet Ekleme Modalı */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Zimmet Oluştur"
      >
        {submitError && <p style={{ color: "red" }}>{submitError}</p>}
        <form onSubmit={submitHandler}>
          <div className="form-grid">
            <input
              type="text"
              placeholder="* Kullanıcı Adı"
              name="personnelName"
              value={newAssignmentData.personnelName}
              onChange={handleNewAssignmentChange}
              required
            />
            <input
              type="text"
              placeholder="* Bulunduğu Birim"
              name="unit"
              value={newAssignmentData.unit}
              onChange={handleNewAssignmentChange}
              required
            />
            <input
              type="text"
              placeholder="Kayıtlı Bölüm"
              name="registeredSection"
              value={newAssignmentData.registeredSection}
              onChange={handleNewAssignmentChange}
            />
            <input
              type="text"
              placeholder="Eski Kullanıcı Adı"
              name="previousUser"
              value={newAssignmentData.previousUser}
              onChange={handleNewAssignmentChange}
            />
            <input
              type="text"
              placeholder="Personel Sicil No"
              name="personnelId"
              value={newAssignmentData.personnelId}
              onChange={handleNewAssignmentChange}
            />
          </div>
          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <div className="item-selection-container">
              <input
                type="text"
                placeholder="Eşya ara (Demirbaş No, Seri No...)"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
              <div className="item-table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Seç</th>
                      <th>Eşya Adı</th>
                      <th>Demirbaş No</th>
                      <th>Seri No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableItems
                      .filter(
                        (item) =>
                          item.assetTag
                            .toLowerCase()
                            .includes(itemSearch.toLowerCase()) ||
                          item.serialNumber
                            .toLowerCase()
                            .includes(itemSearch.toLowerCase()) ||
                          item.name
                            .toLowerCase()
                            .includes(itemSearch.toLowerCase())
                      )
                      .map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => handleItemSelection(item._id)}
                        >
                          <td>
                            <input
                              type="checkbox"
                              readOnly
                              checked={newAssignmentData.items.includes(
                                item._id
                              )}
                            />
                          </td>
                          <td>{item.name}</td>
                          <td>{item.assetTag}</td>
                          <td>{item.serialNumber || "N/A"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <select
              name="company"
              value={newAssignmentData.company}
              onChange={handleNewAssignmentChange}
              required
            >
              <option value="">* Konum Seçin...</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Açıklama"
            name="assignmentNotes"
            value={newAssignmentData.assignmentNotes}
            onChange={handleNewAssignmentChange}
            rows="3"
          ></textarea>
          <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => handlePrintForm(true)}
              style={{ backgroundColor: "var(--secondary-color)" }}
            >
              Boş Form Yazdır
            </button>
            <button type="submit" title="İmzalı formu daha sonra yüklemek için">
              <FaSave style={{ marginRight: "0.5rem" }} /> Kaydet ve Beklemeye
              Al
            </button>
          </div>
        </form>
      </Modal>
      {/* Silme Onay Modalı */}
      <Modal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        title="Zimmet Kaydını Sil"
      >
        <p>
          <strong>{assignmentToDelete?.personnelName}</strong> personeline ait{" "}
          <strong>{assignmentToDelete?.item?.name}</strong> zimmet kaydını
          kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri
          alınamaz.
        </p>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            onClick={() => setAssignmentToDelete(null)}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            İptal
          </button>
          <button
            onClick={confirmDeleteHandler}
            style={{ backgroundColor: "var(--danger-color)" }}
          >
            Evet, Sil
          </button>
        </div>
      </Modal>
      {/* Özet Modalı */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title={summaryTitle}
        size="large" // Modal'ı daha geniş yapalım
      >
        {summaryLoading ? (
          <Loader />
        ) : (
          (() => {
            const activeAssignments = summaryData.filter(
              (a) => a.status === "Zimmetli" || a.status === "Arızalı"
            );
            const pastAssignments = summaryData.filter(
              (a) => a.status === "İade Edildi" || a.status === "Hurda"
            );

            if (summaryType === "personnel") {
              return (
                <div className="summary-modal-card">
                  <div className="summary-avatar">
                    <FaUser />
                  </div>
                  <div className="summary-details">
                    <div className="summary-stats">
                      <div className="summary-stat-item">
                        <span className="summary-stat-value">
                          {activeAssignments.length}
                        </span>
                        <span className="summary-stat-label">
                          Mevcut Zimmet
                        </span>
                      </div>
                      <div className="summary-stat-item">
                        <span className="summary-stat-value">
                          {pastAssignments.length}
                        </span>
                        <span className="summary-stat-label">
                          Geçmiş Zimmet
                        </span>
                      </div>
                    </div>
                    <div className="summary-locations">
                      <span className="summary-stat-label">
                        Bulunduğu Konumlar
                      </span>
                      <div className="summary-location-tags">
                        {[
                          ...new Set(summaryData.map((r) => r.company.name)),
                        ].map((loc) => (
                          <span key={loc} className="summary-location-tag">
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {summaryData.length === 0 && (
                    <p>Bu personele ait zimmet kaydı bulunamadı.</p>
                  )}
                </div>
              );
            } else {
              // Eşya geçmişi için tablo göster
              return (
                <div className="table-container" style={{ maxHeight: "50vh" }}>
                  <table className="summary-item-history-table">
                    <thead>
                      <tr>
                        <th>Personel</th>
                        <th>Durum</th>
                        <th>Zimmet Tarihi</th>
                        <th>İade Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map((assign) => (
                        <tr key={assign._id}>
                          <td>{assign.personnelName}</td>
                          <td>{assign.status}</td>
                          <td>
                            {new Date(
                              assign.assignmentDate
                            ).toLocaleDateString()}
                          </td>
                          <td>
                            {assign.returnDate
                              ? new Date(assign.returnDate).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {summaryData.length === 0 && (
                    <p>Bu eşyaya ait zimmet geçmişi bulunamadı.</p>
                  )}
                </div>
              );
            }
          })()
        )}
        {summaryType === "personnel" && (
          <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setIsSummaryModalOpen(false);
                if (summaryPersonnelId) {
                  navigate(`/personnel/${summaryPersonnelId}/details`);
                }
              }}
              className="primary"
              disabled={!summaryPersonnelId}
            >
              Detaylı Rapora Git
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssignmentsPage;
