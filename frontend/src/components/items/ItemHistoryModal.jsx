import React from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "../shared/Modal.jsx";
import Loader from "../Loader";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const ItemHistoryModal = ({ isOpen, onClose, item }) => {
  const {
    data: historyData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["itemHistory", item?.assetTag],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/assignments", {
        params: {
          assetTag: item.assetTag,
          limit: 1000,
          status: "all",
        },
      });
      return data.assignments;
    },
    enabled: isOpen && !!item, // Sadece modal açıkken ve bir 'item' varken sorguyu çalıştır
    staleTime: 1000 * 60 * 5, // 5 dakika boyunca veriyi taze kabul et
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${item?.name || "Eşya"} - Zimmet Geçmişi`}
      size="large"
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border-color">
                <th className="p-2">Personel</th>
                <th className="p-2">Durum</th>
                <th className="p-2">Zimmet Tarihi</th>
                <th className="p-2">İade Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length > 0 ? (
                historyData
                  .sort(
                    (a, b) =>
                      new Date(b.assignmentDate) - new Date(a.assignmentDate) // Bu sıralama backend'e taşınabilir.
                  )
                  .map((assign) => (
                    <tr
                      key={assign._id}
                      className="border-b border-border-color last:border-b-0"
                    >
                      <td className="p-2">{assign.personnelName}</td>
                      <td className="p-2">{assign.status}</td>
                      <td className="p-2">
                        {new Date(assign.assignmentDate).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {assign.returnDate
                          ? new Date(assign.returnDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-4">
                    Bu eşyaya ait zimmet geçmişi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default ItemHistoryModal;
