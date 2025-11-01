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

// Sürüklenebilir eşya bileşeni
function DraggableItem({ item, children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item._id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100, // Sürüklenirken en üstte görünmesi için
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

// Üzerine bırakılabilir alan bileşeni
function DroppableArea({ id, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`col-span-5 flex flex-col bg-background rounded-lg border ${
        isOver ? "border-primary ring-2 ring-primary/50" : "border-border/50"
      } h-full transition-all`}
    >
      {children}
    </div>
  );
}

const AddAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableItems,
  companies,
  personnelList,
  allPersonnel,
}) => {
  const initialFormData = {
    items: [],
    personnelId: "",
    company: "",
    unit: "",
    registeredSection: "",
    assignmentNotes: "",
  };
  const [printOnSubmit, setPrintOnSubmit] = useState(false);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedItem, setHighlightedItem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setSearchTerm("");
      setHighlightedItem(null);
      setPrintOnSubmit(false);
    }
  }, [isOpen]);

  const selectedPersonnelDetails = useMemo(() => {
    if (!formData.personnelId) return null;
    // Artık tam personel verisinden doğru bilgiyi buluyoruz.
    return allPersonnel.find((p) => p._id === formData.personnelId);
  }, [formData.personnelId, allPersonnel]);

  const validateForm = () => {
    const newErrors = {};
    if (formData.items.length === 0)
      newErrors.items = "En az bir eşya seçilmelidir.";
    if (!formData.personnelId) newErrors.personnelId = "Personel seçilmelidir.";
    if (!formData.company) newErrors.company = "Şirket seçilmelidir.";
    if (!formData.unit) newErrors.unit = "Birim girilmelidir.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Backend'e sadece ilgili alanları gönder, printForm'u ayır.
    const { printForm, ...assignmentData } = {
      ...formData,
      printForm: printOnSubmit,
    };
    const dataToSubmit = { ...assignmentData, printForm: printOnSubmit };

    onSubmit(dataToSubmit); // Artık async değil ve dönüş değeri beklemiyor
  };

  const handleAddItem = (itemId) => {
    if (itemId && !formData.items.includes(itemId)) {
      setFormData((prev) => ({ ...prev, items: [...prev.items, itemId] }));
    }
  };

  const handleRemoveItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((id) => id !== itemId),
    }));
    if (highlightedItem === itemId) {
      setHighlightedItem(null);
    }
  };

  const handleAddAll = () => {
    const allVisibleItemIds = filteredAvailableItems.map((item) => item._id);
    setFormData((prev) => ({
      ...prev,
      items: [...new Set([...prev.items, ...allVisibleItemIds])],
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && over.id === "selected-items-droppable") {
      handleAddItem(active.id);
    }
  };

  const filteredAvailableItems = useMemo(() => {
    return availableItems.filter(
      (item) =>
        !formData.items.includes(item._id) &&
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableItems, formData.items, searchTerm]);

  const selectedItemsDetails = useMemo(() => {
    return formData.items
      .map((itemId) => availableItems.find((item) => item._id === itemId))
      .filter(Boolean);
  }, [formData.items, availableItems]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Zimmet Oluştur"
      size="xlarge"
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sol Sütun: Form Alanları */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto custom-scrollbar max-h-[450px] p-1 border border-transparent">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Personel *
                </label>
                <select
                  value={formData.personnelId}
                  onChange={(e) =>
                    setFormData({ ...formData, personnelId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card-background"
                >
                  <option value="">Seçiniz...</option>
                  {personnelList.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.personnelId && (
                  <p className="text-danger text-sm mt-1">
                    {errors.personnelId}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Şirket / Konum *
                  </label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card-background"
                  >
                    <option value="">Seçiniz...</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.company && (
                    <p className="text-danger text-sm mt-1">{errors.company}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Birim *
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card-background"
                  />
                  {errors.unit && (
                    <p className="text-danger text-sm mt-1">{errors.unit}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Zimmet Notları
                </label>
                <textarea
                  name="assignmentNotes"
                  value={formData.assignmentNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignmentNotes: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card-background"
                ></textarea>
              </div>
            </div>

            {/* Sağ Sütun: Eşya Transfer Listesi */}
            <div className="lg:col-span-3 grid grid-cols-11 gap-2 h-[450px]">
              {/* Kaynak Liste (Boştaki Eşyalar) - YENİ YAPI */}
              <div className="col-span-5 grid grid-rows-[auto_1fr] bg-background rounded-lg border border-border/50 max-h-[450px]">
                <div className="p-3 border-b border-border/50">
                  <h3 className="font-semibold text-text-main">
                    Boştaki Eşyalar
                  </h3>
                  <div className="relative mt-2">
                    <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-text-light" />
                    <input
                      type="text"
                      placeholder="Eşya adı veya demirbaş no..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-card-background border border-border rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
                  {filteredAvailableItems.map((item) => (
                    <DraggableItem key={item._id} item={item}>
                      <div
                        onDoubleClick={() => handleAddItem(item._id)}
                        onClick={() => setHighlightedItem(item._id)}
                        className={`flex items-center p-2 rounded-md cursor-grab transition-colors ${
                          highlightedItem === item._id
                            ? "bg-primary/20 ring-1 ring-primary"
                            : "hover:bg-card-hover"
                        }`}
                      >
                        <div className="mr-3 text-xl">
                          {getAssetTypeIcon(item.assetType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-main truncate text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-text-light truncate">
                            {item.assetTag}
                          </p>
                        </div>
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              </div>

              {/* Transfer Butonları */}
              <div className="col-span-1 flex flex-col items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddItem(highlightedItem)}
                  disabled={!highlightedItem}
                  className="!p-2"
                >
                  <FaAngleRight />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAll}
                  disabled={filteredAvailableItems.length === 0}
                  className="!p-2"
                >
                  <FaAngleDoubleRight />
                </Button>
              </div>

              {/* Hedef Liste (Seçilen Eşyalar) */}
              <DroppableArea id="selected-items-droppable">
                <div className="p-3 border-b border-border/50 flex-shrink-0">
                  <h3 className="font-semibold text-text-main">
                    Seçilen Eşyalar ({selectedItemsDetails.length})
                  </h3>
                  {errors.items && (
                    <p className="text-danger text-xs mt-1">{errors.items}</p>
                  )}
                </div>
                <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
                  {selectedItemsDetails.map((item) => (
                    <div
                      key={item._id}
                      className="bg-card-background rounded-lg shadow-sm flex items-center p-2"
                    >
                      <div className="mr-3 text-xl">
                        {getAssetTypeIcon(item.assetType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-main truncate text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-text-light truncate">
                          {item.assetTag}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item._id)}
                        className="ml-2 p-1.5 rounded-full text-text-light hover:bg-danger/10 hover:text-danger"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </DroppableArea>
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
            >
              Oluştur ve Yazdır
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={() => setPrintOnSubmit(false)}
            >
              Oluştur
            </Button>
          </div>
        </form>
      </DndContext>
    </Modal>
  );
};

export default AddAssignmentModal;
