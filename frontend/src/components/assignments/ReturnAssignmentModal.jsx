import React, { useState, useEffect, useMemo } from "react";
import Modal from "../shared/Modal.jsx";
import Button from "../shared/Button.jsx";
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import {
  FaTimes,
  FaLaptop,
  FaDesktop,
  FaMobileAlt,
  FaPrint,
  FaHdd,
  FaQuestionCircle,
  FaSearch,
  FaAngleRight,
  FaAngleDoubleRight,
} from "react-icons/fa";
import axiosInstance from "../../api/axiosInstance.js";
import Loader from "../Loader.jsx";

// Eşya türüne göre ikon döndüren yardımcı fonksiyon
const getAssetTypeIcon = (assetType) => {
  const iconMap = {
    Laptop: <FaLaptop className="text-blue-400" />,
    Monitör: <FaDesktop className="text-green-400" />,
    Telefon: <FaMobileAlt className="text-purple-400" />,
    Yazıcı: <FaPrint className="text-red-400" />,
    "Network Cihazı": <FaHdd className="text-yellow-400" />,
  };
  return iconMap[assetType] || <FaQuestionCircle className="text-gray-400" />;
};

const ReturnAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  personnelList,
}) => {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [personnelAssignments, setPersonnelAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [printOnSubmit, setPrintOnSubmit] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPersonnelId("");
      setPersonnelAssignments([]);
      setItemsToReturn([]);
      setPrintOnSubmit(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPersonnelId) {
      setLoading(true);
      axiosInstance
        .get(`/assignments/search?personnelId=${selectedPersonnelId}`)
        .then(({ data }) => {
          // Sadece "Zimmetli" olanları filtrele
          const activeAssignments =
            data[0]?.assignments.filter((a) => a.status === "Zimmetli") || [];
          setPersonnelAssignments(activeAssignments);
        })
        .catch((err) => console.error("Personel zimmetleri çekilemedi:", err))
        .finally(() => setLoading(false));
    } else {
      setPersonnelAssignments([]);
    }
    setItemsToReturn([]); // Personel değiştiğinde iade listesini sıfırla
  }, [selectedPersonnelId]);

  const handleAddItem = (assignmentId) => {
    if (assignmentId && !itemsToReturn.includes(assignmentId)) {
      setItemsToReturn((prev) => [...prev, assignmentId]);
    }
  };

  const handleRemoveItem = (assignmentId) => {
    setItemsToReturn((prev) => prev.filter((id) => id !== assignmentId));
  };

  const handleAddAll = () => {
    const allIds = personnelAssignments.map((a) => a._id);
    setItemsToReturn(allIds);
  };

  const handleRemoveAll = () => {
    setItemsToReturn([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (itemsToReturn.length === 0) {
      alert("Lütfen iade edilecek en az bir zimmet seçin.");
      return;
    }
    onSubmit({ assignmentIds: itemsToReturn, printForm: printOnSubmit });
  };

  const availableAssignments = useMemo(() => {
    return personnelAssignments.filter((a) => !itemsToReturn.includes(a._id));
  }, [personnelAssignments, itemsToReturn]);

  const selectedAssignmentsDetails = useMemo(() => {
    return itemsToReturn
      .map((id) => personnelAssignments.find((a) => a._id === id))
      .filter(Boolean);
  }, [itemsToReturn, personnelAssignments]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zimmet İade İşlemi"
      size="xlarge"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sol Sütun: Personel Seçimi */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Personel Seçimi *
              </label>
              <select
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card-background"
              >
                <option value="">Personel Seçiniz...</option>
                {personnelList.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedPersonnelId && loading && <Loader />}
          </div>

          {/* Sağ Sütun: Eşya Transfer Listesi */}
          <div className="lg:col-span-3 grid grid-cols-11 gap-2 h-[450px]">
            {/* Kaynak Liste (Personelin Zimmetleri) */}
            <div className="col-span-5 grid grid-rows-[auto_1fr] bg-background rounded-lg border border-border/50 max-h-[450px]">
              <div className="p-3 border-b border-border/50">
                <h3 className="font-semibold text-text-main">
                  Personelin Zimmetleri ({availableAssignments.length})
                </h3>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
                {availableAssignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    onDoubleClick={() => handleAddItem(assignment._id)}
                    className="flex items-center p-2 rounded-md cursor-pointer hover:bg-card-hover"
                  >
                    <div className="mr-3 text-xl">
                      {getAssetTypeIcon(assignment.item?.assetType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-main truncate text-sm">
                        {assignment.item?.name}
                      </p>
                      <p className="text-xs text-text-light truncate">
                        {assignment.item?.assetTag}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer Butonları */}
            <div className="col-span-1 flex flex-col items-center justify-center gap-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddAll}
                disabled={availableAssignments.length === 0}
                className="!p-2"
                title="Tümünü İade Listesine Ekle"
              >
                <FaAngleDoubleRight />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemoveAll}
                disabled={itemsToReturn.length === 0}
                className="!p-2 rotate-180"
                title="Tümünü İade Listesinden Çıkar"
              >
                <FaAngleDoubleRight />
              </Button>
            </div>

            {/* Hedef Liste (İade Edilecekler) */}
            <div className="col-span-5 flex flex-col bg-background rounded-lg border border-primary/50 h-full">
              <div className="p-3 border-b border-border/50 flex-shrink-0">
                <h3 className="font-semibold text-text-main">
                  İade Edilecekler ({selectedAssignmentsDetails.length})
                </h3>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
                {selectedAssignmentsDetails.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="bg-card-background rounded-lg shadow-sm flex items-center p-2"
                  >
                    <div className="mr-3 text-xl">
                      {getAssetTypeIcon(assignment.item?.assetType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-main truncate text-sm">
                        {assignment.item?.name}
                      </p>
                      <p className="text-xs text-text-light truncate">
                        {assignment.item?.assetTag}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(assignment._id)}
                      className="ml-2 p-1.5 rounded-full text-text-light hover:bg-danger/10 hover:text-danger"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Butonları */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={() => setPrintOnSubmit(true)}
            disabled={itemsToReturn.length === 0}
          >
            İade Al ve Tutanak Yazdır
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={() => setPrintOnSubmit(false)}
            disabled={itemsToReturn.length === 0}
          >
            İade Al
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnAssignmentModal;
