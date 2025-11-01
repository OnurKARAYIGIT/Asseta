import React from "react";
import Modal from "../shared/Modal.jsx";
import Button from "../shared/Button"; // Button bileşenini import ediyoruz

const AssignmentDetailModal = ({
  isOpen,
  onClose,
  assignment,
  companies, // Şirket adlarını göstermek için kullanılabilir
  onEdit, // Düzenleme için yeni prop
  onDelete,
  userInfo,
}) => {
  if (!isOpen || !assignment) return null;

  const getCompanyName = (companyId) => {
    const company = companies.find((c) => c._id === companyId);
    return company ? company.name : "Bilinmiyor";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const isAdminOrDeveloper =
    userInfo.role === "admin" || userInfo.role === "developer";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Zimmet Detayları: ${assignment.personnelName}`}
      size="large"
      footer={
        <div className="flex justify-end gap-2">
          {isAdminOrDeveloper && (
            <>
              <Button variant="danger" onClick={() => onDelete(assignment)}>
                Sil
              </Button>
              <Button variant="primary" onClick={() => onEdit(assignment._id)}>
                Düzenle
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Zimmet Bilgileri */}
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-3">
            Zimmet Bilgileri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-light">
                Kullanıcı Adı
              </label>
              <p className="text-text-main font-semibold">
                {assignment.personnelName || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Sicil No
              </label>
              <p className="text-text-main font-semibold">
                {assignment.personnelId || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Şirket
              </label>
              <p className="text-text-main font-semibold">
                {assignment.company?.name || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Birim
              </label>
              <p className="text-text-main font-semibold">
                {assignment.unit || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Kayıtlı Bölüm
              </label>
              <p className="text-text-main font-semibold">
                {assignment.registeredSection || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Bulunduğu Yer
              </label>
              <p className="text-text-main font-semibold">
                {assignment.location || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Zimmet Tarihi
              </label>
              <p className="text-text-main font-semibold">
                {formatDate(assignment.assignmentDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-light">
                Durum
              </label>
              <p className="text-text-main font-semibold">
                {assignment.status || "-"}
              </p>
            </div>
            {assignment.returnDate && (
              <div>
                <label className="block text-sm font-medium text-text-light">
                  İade Tarihi
                </label>
                <p className="text-text-main font-semibold">
                  {formatDate(assignment.returnDate)}
                </p>
              </div>
            )}
            {assignment.previousUser && (
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Önceki Kullanıcı
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.previousUser}
                </p>
              </div>
            )}
            {assignment.assignmentNotes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-light">
                  Açıklama
                </label>
                <p className="text-text-main font-semibold whitespace-pre-wrap">
                  {assignment.assignmentNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Eşya Bilgileri */}
        {assignment.item && (
          <div className="bg-background p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-text-main mb-3">
              Eşya Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Eşya Adı
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.name || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Demirbaş No
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.assetTag || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Seri No
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.serialNumber || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Marka
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.brand || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Model Yılı
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.modelYear || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Varlık Cinsi
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.assetType || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Varlık Alt Kategori
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.assetSubType || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-light">
                  Sabit Kıymet Cinsi
                </label>
                <p className="text-text-main font-semibold">
                  {assignment.item.fixedAssetType || "-"}
                </p>
              </div>
              {assignment.item.networkInfo && (
                <div>
                  <label className="block text-sm font-medium text-text-light">
                    Mac/IP Adresi
                  </label>
                  <p className="text-text-main font-semibold">
                    {assignment.item.networkInfo}
                  </p>
                </div>
              )}
              {assignment.item.softwareInfo && (
                <div>
                  <label className="block text-sm font-medium text-text-light">
                    Kurulu Programlar
                  </label>
                  <p className="text-text-main font-semibold">
                    {assignment.item.softwareInfo}
                  </p>
                </div>
              )}
              {assignment.item.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-light">
                    Eşya Açıklaması
                  </label>
                  <p className="text-text-main font-semibold whitespace-pre-wrap">
                    {assignment.item.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zimmet Formu */}
        {assignment.formPath && (
          <div className="bg-background p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-text-main mb-3">
              Zimmet Formu
            </h3>
            <a
              href={`http://localhost:5001${assignment.formPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 10.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Zimmet Formunu Görüntüle
            </a>
          </div>
        )}

        {/* Zimmet Geçmişi */}
        {assignment.history && assignment.history.length > 0 && (
          <div className="bg-background p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-text-main mb-3">
              Zimmet Geçmişi
            </h3>
            <ul className="space-y-2">
              {assignment.history.map((entry, index) => (
                <li
                  key={index}
                  className="text-sm text-text-main border-b border-border/50 pb-2 last:border-b-0"
                >
                  <span className="font-semibold">
                    {formatDate(entry.timestamp)}
                  </span>{" "}
                  - {entry.username}:
                  <ul className="list-disc list-inside ml-4 text-text-light">
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex}>
                        {change.field}:{" "}
                        <span className="font-medium text-danger">
                          {change.from || "Boş"}
                        </span>{" "}
                        {"->"}{" "}
                        <span className="font-medium text-primary">
                          {change.to || "Boş"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AssignmentDetailModal;
