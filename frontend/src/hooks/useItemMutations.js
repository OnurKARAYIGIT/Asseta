import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";

export const useItemMutations = ({ onSuccessCallback }) => {
  const queryClient = useQueryClient();

  const invalidateItemsQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  // Ekleme ve Güncelleme Mutation'ı
  const saveItemMutation = useMutation({
    mutationFn: async ({ mode, data }) => {
      if (mode === "add") {
        return axiosInstance.post("/items", data);
      }
      return axiosInstance.put(`/items/${data._id}`, data);
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Eşya başarıyla ${
          variables.mode === "add" ? "eklendi" : "güncellendi"
        }.`
      );
      invalidateItemsQuery();
      onSuccessCallback?.(); // Modal kapatma gibi işlemler için
    },
    onError: (err) => {
      // Hata yönetimi burada merkezi hale getirildi.
      throw new Error(err.response?.data?.message || "Bir hata oluştu.");
    },
  });

  // Silme Mutation'ı
  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => axiosInstance.delete(`/items/${itemId}`),
    onSuccess: () => {
      toast.success("Eşya başarıyla silindi.");
      invalidateItemsQuery();
      onSuccessCallback?.(); // State temizleme gibi işlemler için
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Eşya silinirken bir hata oluştu."
      );
    },
  });

  return {
    saveItem: saveItemMutation.mutateAsync, // mutateAsync kullanarak Promise tabanlı çalışalım
    deleteItem: deleteItemMutation.mutate,
  };
};
