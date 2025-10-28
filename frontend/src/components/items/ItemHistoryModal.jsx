import React from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "../Modal";
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
        <div className="table-container" style={{ maxHeight: "60vh" }}>
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
              {historyData.length > 0 ? (
                historyData
                  .sort(
                    (a, b) =>
                      new Date(b.assignmentDate) - new Date(a.assignmentDate)
                  )
                  .map((assign) => (
                    <tr key={assign._id}>
                      <td>{assign.personnelName}</td>
                      <td>{assign.status}</td>
                      <td>
                        {new Date(assign.assignmentDate).toLocaleDateString()}
                      </td>
                      <td>
                        {assign.returnDate
                          ? new Date(assign.returnDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
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
