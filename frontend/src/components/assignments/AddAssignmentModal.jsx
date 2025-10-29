import React, { useState } from "react";
import Modal from "../Modal";
import Button from "../shared/Button";
import { FaSave, FaPrint, FaSearch } from "react-icons/fa";

const AddAssignmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableItems,
  companies,
}) => {
  const initialFormState = {
    personnelName: "",
    personnelId: "",
    items: [],
    unit: "",
    registeredSection: "",
    company: "",
    previousUser: "",
    assignmentNotes: "",
  };

  const [newAssignmentData, setNewAssignmentData] = useState(initialFormState);
  const [itemSearch, setItemSearch] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const { personnelName, items, company, unit } = newAssignmentData;

    if (!personnelName || items.length === 0 || !company || !unit) {
      setSubmitError(
        "Kullanıcı Adı, Eşya, Konum ve Birim alanları zorunludur."
      );
      return;
    }

    try {
      const success = await onSubmit(newAssignmentData);
      if (success) {
        setNewAssignmentData(initialFormState);
        setItemSearch("");
        onClose();
      } else {
        setSubmitError(
          "Zimmet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewAssignmentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

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
                <tr>
                  <td>${item.assetTag || "-"}</td>
                  <td>${item.assetType || "-"}</td>
                  <td>${item.brand || "-"}</td>
                  <td>${item.serialNumber || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <h2>TESLİM ALAN PERSONEL BİLGİLERİ</h2>
          <table>
            <tr>
              <th>Adı Soyadı</th>
              <td>${personnelName || ""}</td>
            </tr>
            <tr>
              <th>Birim / Departman</th>
              <td>${unit || ""}</td>
            </tr>
            <tr>
              <th>Çalıştığı Firma</th>
              <td>${selectedCompany.name || ""}</td>
            </tr>
          </table>

          <p style="margin-top: 20px;">
            Yukarıda bilgileri yazılı demirbaş/malzemeyi sağlam ve çalışır durumda teslim aldım. 
            Malzemenin kullanımından ve muhafazasından sorumlu olduğumu, görevimden ayrılmam veya 
            görev yerimin değişmesi durumunda malzemeyi ilgili birime teslim etmeyi kabul ve taahhüt ederim.
          </p>

          <div class="signatures">
            <div class="signature-box">
              <strong>Teslim Eden</strong>
              <p>Adı Soyadı / İmza</p>
            </div>
            <div class="signature-box">
              <strong>Teslim Alan</strong>
              <p>Adı Soyadı / İmza</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredItems = availableItems.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(itemSearch.toLowerCase()) ||
      (item.serialNumber &&
        item.serialNumber.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Zimmet Oluştur"
      size="xlarge"
      variant="form"
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handlePrintForm(true)}
            className="flex items-center gap-2"
          >
            <FaPrint /> Boş Form Yazdır
          </Button>
          <Button
            variant="primary"
            onClick={handleFormSubmit}
            className="flex items-center gap-2"
          >
            <FaSave /> Kaydet ve Beklemeye Al
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {submitError && (
          <div className="text-danger text-sm bg-danger/10 p-3 rounded-lg">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="personnelName"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Kullanıcı Adı *
              </label>
              <input
                type="text"
                id="personnelName"
                name="personnelName"
                value={newAssignmentData.personnelName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Şirket *
              </label>
              <select
                id="company"
                name="company"
                value={newAssignmentData.company}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Şirket Seçin</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Birim *
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={newAssignmentData.unit}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="personnelId"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Sicil No
              </label>
              <input
                type="text"
                id="personnelId"
                name="personnelId"
                value={newAssignmentData.personnelId}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="registeredSection"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Kayıtlı Olduğu Bölüm
              </label>
              <input
                type="text"
                id="registeredSection"
                name="registeredSection"
                value={newAssignmentData.registeredSection}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="previousUser"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Önceki Kullanıcı
              </label>
              <input
                type="text"
                id="previousUser"
                name="previousUser"
                value={newAssignmentData.previousUser}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="itemSearch"
                className="block text-sm font-medium text-text-main mb-1"
              >
                Ürün Ara
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="itemSearch"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Ürün adı, etiket veya seri no ile arayın..."
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-y-auto max-h-72">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-light-gray">
                <tr>
                  <th className="sticky top-0 bg-light-gray px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider w-10 z-10">
                    Seç
                  </th>
                  <th className="sticky top-0 bg-light-gray px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider z-10">
                    Ürün Adı
                  </th>
                  <th className="sticky top-0 bg-light-gray px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider z-10">
                    Etiket No
                  </th>
                  <th className="sticky top-0 bg-light-gray px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider z-10">
                    Seri No
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-light-gray cursor-pointer ${
                      newAssignmentData.items.includes(item._id)
                        ? "bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleItemSelection(item._id)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={newAssignmentData.items.includes(item._id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.assetTag}</td>
                    <td className="px-4 py-3">{item.serialNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddAssignmentModal;
