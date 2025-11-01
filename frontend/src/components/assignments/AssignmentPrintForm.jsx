import React, { forwardRef } from "react";

// Bu bileşen sadece yazdırma amacıyla tasarlanmıştır.
// Normal görünümde gizli kalacaktır.
const AssignmentPrintForm = forwardRef(
  ({ formData, selectedItems, personnel, company }, ref) => {
    const today = new Date().toLocaleDateString("tr-TR");

    return (
      <div ref={ref} className="print-container p-8 text-black">
        <style type="text/css" media="print">
          {`
          @page { size: A4; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; }
          .print-container { font-family: 'Arial', sans-serif; }
          .print-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 40px; }
          .print-header h1 { font-size: 24px; margin: 0; }
          .print-section { margin-bottom: 30px; }
          .print-section h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .print-table th, .print-table td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
          .print-table th { background-color: #f2f2f2; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 60px; }
          .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; }
        `}
        </style>

        <div className="print-header">
          <h1>ZİMMET TESLİM FORMU</h1>
        </div>

        <div className="print-section">
          <h2>Personel Bilgileri</h2>
          <table className="print-table">
            <tbody>
              <tr>
                <th>Adı Soyadı</th>
                <td>{personnel?.fullName || ""}</td>
                <th>Sicil No</th>
                <td>{personnel?.employeeId || ""}</td>
              </tr>
              <tr>
                <th>Departman / Birim</th>
                <td>{formData.unit}</td>
                <th>Tarih</th>
                <td>{today}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <h2>Zimmetlenen Eşyalar</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Eşya Adı</th>
                <th>Marka</th>
                <th>Demirbaş No</th>
                <th>Seri No</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{item.brand}</td>
                  <td>{item.assetTag}</td>
                  <td>{item.serialNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="print-section">
          <p className="text-sm">
            Yukarıda bilgileri listelenen malzemeleri sağlam, çalışır ve
            eksiksiz olarak teslim aldım. Bu malzemelerin kullanımından ve
            muhafazasından sorumlu olduğumu, görevimden ayrılmam durumunda
            eksiksiz olarak iade edeceğimi kabul ve beyan ederim.
          </p>
        </div>

        <div className="signatures">
          <div className="signature-box">
            <p className="font-semibold">Teslim Eden</p>
            <p className="mt-8">(İsim / İmza)</p>
          </div>
          <div className="signature-box">
            <p className="font-semibold">Teslim Alan</p>
            <p className="mt-8">(İsim / İmza)</p>
          </div>
        </div>
      </div>
    );
  }
);

export default AssignmentPrintForm;
