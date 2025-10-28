import React, { useState } from "react";
import Modal from "../Modal";
import { FaSave, FaPrint } from "react-icons/fa";

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
              <tr><th>Demirbaş No</th><th>Malzeme Cinsi</th><th>Marka / Model</th><th>Seri Numarası</th></tr>
            </thead>
            <tbody>
              ${selectedItems
                .map(
                  (item) =>
                    `<tr><td>${item.assetTag || "-"}</td><td>${
                      item.assetType || "-"
                    }</td><td>${item.brand || "-"}</td><td>${
                      item.serialNumber || "-"
                    }</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
          <h2>TESLİM ALAN PERSONEL BİLGİLERİ</h2>
          <table><tr><th>Adı Soyadı</th><td>${
            personnelName || ""
          }</td></tr><tr><th>Birim / Departman</th><td>${
      unit || ""
    }</td></tr><tr><th>Çalıştığı Firma</th><td>${
      selectedCompany.name || ""
    }</td></tr></table>
          <p style="margin-top: 20px;">Yukarıda bilgileri yazılı demirbaş/malzemeyi sağlam ve çalışır durumda teslim aldım. Malzemenin kullanımından ve muhafazasından sorumlu olduğumu, görevimden ayrılmam veya görev yerimin değişmesi durumunda malzemeyi ilgili birime teslim etmeyi kabul ve taahhüt ederim.</p>
          <div class="signatures"><div class="signature-box"><strong>Teslim Eden</strong><p>Adı Soyadı / İmza</p></div><div class="signature-box"><strong>Teslim Alan</strong><p>Adı Soyadı / İmza</p></div></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Zimmet Oluştur">
      {submitError && <p style={{ color: "red" }}>{submitError}</p>}
      <form onSubmit={handleFormSubmit}>
        <div className="form-grid">
          <input
            type="text"
            placeholder="* Kullanıcı Adı"
            name="personnelName"
            value={newAssignmentData.personnelName}
            onChange={handleFormChange}
            required
          />
          <input
            type="text"
            placeholder="* Bulunduğu Birim"
            name="unit"
            value={newAssignmentData.unit}
            onChange={handleFormChange}
            required
          />
          <input
            type="text"
            placeholder="Kayıtlı Bölüm"
            name="registeredSection"
            value={newAssignmentData.registeredSection}
            onChange={handleFormChange}
          />
          <input
            type="text"
            placeholder="Eski Kullanıcı Adı"
            name="previousUser"
            value={newAssignmentData.previousUser}
            onChange={handleFormChange}
          />
          <input
            type="text"
            placeholder="Personel Sicil No"
            name="personnelId"
            value={newAssignmentData.personnelId}
            onChange={handleFormChange}
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
                            checked={newAssignmentData.items.includes(item._id)}
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
            onChange={handleFormChange}
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
          onChange={handleFormChange}
          rows="3"
        ></textarea>
        <div className="modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => handlePrintForm(true)}
            style={{ backgroundColor: "var(--secondary-color)" }}
          >
            <FaPrint style={{ marginRight: "0.5rem" }} /> Boş Form Yazdır
          </button>
          <button type="submit" title="İmzalı formu daha sonra yüklemek için">
            <FaSave style={{ marginRight: "0.5rem" }} /> Kaydet ve Beklemeye Al
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAssignmentModal;
