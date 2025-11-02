import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { FaFilePdf, FaEye, FaReceipt } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../components/shared/Button";

const MyPayrollsPage = () => {
  const {
    data: payrolls = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["myPayrolls"],
    queryFn: () =>
      axiosInstance.get("/payroll/my-records").then((res) => res.data),
    retry: 1,
  });

  const handlePrint = async (recordId) => {
    try {
      const response = await axiosInstance.get(
        `/payroll/records/${recordId}/print`,
        {
          responseType: "blob", // PDF için blob olarak al
        }
      );
      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank"); // Yeni sekmede aç
    } catch (err) {
      toast.error("PDF indirilirken bir hata oluştu.");
      console.error(err);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="text-danger text-center p-8">
        <p>Bordrolarınız yüklenirken bir hata oluştu.</p>
        <p className="text-sm text-text-light mt-2">
          {error.response?.data?.message || error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaReceipt className="text-secondary text-2xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
          Bordrolarım
        </h1>
      </div>

      {payrolls.length === 0 ? (
        <div className="text-center py-10 bg-background-soft rounded-lg">
          <p className="text-text-light">
            Henüz görüntüleyebileceğiniz bir bordro bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background-soft rounded-lg">
            <thead className="bg-background-dark">
              <tr>
                <th className="th-class">Dönem</th>
                <th className="th-class text-right">Net Ödenecek</th>
                <th className="th-class text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrolls.map((record) => (
                <tr key={record._id}>
                  <td className="td-class">{record.payrollPeriod?.name}</td>
                  <td className="td-class text-right font-mono">
                    {record.netSalary.toFixed(2)} {record.currency}
                  </td>
                  <td className="td-class text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handlePrint(record._id)}
                    >
                      <FaFilePdf className="mr-2" /> PDF İndir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyPayrollsPage;
