import React from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Loader from "../Loader";
import { FaPrint } from "react-icons/fa";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const PayrollRecordDetailModal = ({ isOpen, onClose, record, isLoading }) => {
  const handlePrint = async () => {
    if (!record?._id) return;
    try {
      const response = await axiosInstance.get(
        `/payroll/records/${record._id}/print`,
        { responseType: "blob" }
      );
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Bordro PDF'i oluşturulurken bir hata oluştu.");
    }
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const InfoRow = ({ label, value, isBold = false, className = "" }) => (
    <div className={`flex justify-between items-center py-2 px-3 ${className}`}>
      <span className="text-sm text-text-light">{label}</span>
      <span
        className={`text-sm font-mono ${
          isBold ? "font-bold text-text-main" : "text-text-main"
        }`}
      >
        {value}
      </span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <h4 className="font-semibold text-primary bg-background-soft p-2 rounded-t-md">
        {title}
      </h4>
      <div className="bg-background-soft/50 rounded-b-md divide-y divide-border/50">
        {children}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bordro Detayı" size="xl">
      {isLoading ? (
        <Loader />
      ) : !record ? (
        <div className="text-center p-8 text-text-light">
          Bu personele ait hesaplanmış bir bordro bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-background-soft rounded-lg text-center">
            <h3 className="font-bold text-lg text-text-main">
              {record.personnel.fullName}
            </h3>
            <p className="text-sm text-text-light">
              {record.personnel.employeeId}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sol Sütun: Kazançlar ve Kesintiler */}
            <div className="space-y-4">
              <Section title="Kazançlar">
                <InfoRow
                  label="Brüt Maaş"
                  value={formatCurrency(record.grossSalary)}
                />
                {record.earnings.map((e, i) => (
                  <InfoRow
                    key={i}
                    label={e.name}
                    value={formatCurrency(e.amount)}
                  />
                ))}
                <InfoRow
                  label="Toplam Kazanç (A)"
                  value={formatCurrency(record.totalEarnings)}
                  isBold
                  className="bg-green-500/10"
                />
              </Section>

              <Section title="Ek Kesintiler">
                {record.deductions.map((d, i) => (
                  <InfoRow
                    key={i}
                    label={d.name}
                    value={formatCurrency(d.amount)}
                  />
                ))}
                <InfoRow
                  label="Toplam Ek Kesinti (B)"
                  value={formatCurrency(record.totalDeductions)}
                  isBold
                  className="bg-orange-500/10"
                />
              </Section>
            </div>

            {/* Sağ Sütun: Yasal Kesintiler ve Özet */}
            <div className="space-y-4">
              <Section title="Yasal Kesintiler">
                <InfoRow
                  label="SGK İşçi Payı (%14)"
                  value={formatCurrency(record.sgkWorkerShare)}
                />
                <InfoRow
                  label="İşsizlik Sig. İşçi Payı (%1)"
                  value={formatCurrency(record.unemploymentWorkerShare)}
                />
                <InfoRow
                  label="Gelir Vergisi"
                  value={formatCurrency(record.incomeTax)}
                />
                <InfoRow
                  label="Damga Vergisi"
                  value={formatCurrency(record.stampDuty)}
                />
                <InfoRow
                  label="Toplam Yasal Kesinti (C)"
                  value={formatCurrency(record.totalLegalDeductions)}
                  isBold
                  className="bg-red-500/10"
                />
              </Section>

              <Section title="Özet">
                <InfoRow
                  label="Net Maaş (A - B - C)"
                  value={`${formatCurrency(record.netSalary)} ${
                    record.currency
                  }`}
                  isBold
                  className="bg-primary/20 text-lg"
                />
              </Section>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <FaPrint className="mr-2" /> Yazdır
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PayrollRecordDetailModal;
