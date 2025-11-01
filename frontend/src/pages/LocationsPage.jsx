import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import {
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import Button from "../components/shared/Button";
import ConfirmationModal from "../components/shared/ConfirmationModal";
import LocationModal from "../components/locations/LocationModal";

const LocationsPage = () => {
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  const queryClient = useQueryClient();

  const {
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsIsError,
    error: locationsError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  const createLocationMutation = useMutation({
    mutationFn: (newLocation) => axiosInstance.post("/locations", newLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Yeni konum başarıyla eklendi!");
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Konum eklenirken bir hata oluştu."
      );
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, ...updatedData }) =>
      axiosInstance.put(`/locations/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Konum başarıyla güncellendi!");
      setIsModalOpen(false);
      setEditingLocation(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Konum güncellenirken bir hata oluştu."
      );
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Konum başarıyla silindi.");
      setLocationToDelete(null);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Konum silinirken bir hata oluştu."
      );
    },
  });

  const handleOpenModal = (location = null) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleSaveLocation = (data) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation._id, ...data });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const handleDelete = (location) => {
    setLocationToDelete(location);
  };

  const confirmDeleteHandler = () => {
    if (locationToDelete) {
      deleteLocationMutation.mutate(locationToDelete._id);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon" />;
    if (sortConfig.direction === "asc")
      return <FaSortUp className="sort-icon active" />;
    return <FaSortDown className="sort-icon active" />;
  };

  const sortedLocations = useMemo(() => {
    let sortableItems = [...locations];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [locations, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FaMapMarkerAlt className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            Konum Yönetimi
          </h1>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          variant="primary"
          icon={<FaPlus />}
        >
          Yeni Konum Ekle
        </Button>
      </div>

      {locationsLoading ? (
        <Loader />
      ) : locationsIsError ? (
        <p className="text-danger">{locationsError.message}</p>
      ) : (
        <div className="table-container ">
          <table className="min-w-full divide-y divide-border text-center">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-xs text-center font-medium text-text-light uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Konum Adı {getSortIcon("name")}
                </th>
                <th
                  className="px-4 py-3 text-xs text-center font-medium text-text-light uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("address")}
                >
                  Adres {getSortIcon("address")}
                </th>
                <th className="px-4 py-3 text-xs text-center font-medium text-text-light uppercase tracking-wider">
                  İletişim
                </th>
                <th
                  className="px-4 py-3 text-xs text-center font-medium text-text-light uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("personnelCount")}
                >
                  Personel Sayısı {getSortIcon("personnelCount")}
                </th>
                <th
                  className="px-4 py-3 text-xs text-center font-medium text-text-light uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("assignedItemsCount")}
                >
                  Zimmetli Eşya {getSortIcon("assignedItemsCount")}
                </th>
                <th className="no-sort">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-card-background divide-y divide-border">
              {sortedLocations.map((location) => (
                <tr
                  key={location._id}
                  className="transition-colors w-full hover:bg-table-row-hover"
                >
                  <td className="px-4 py-3 max-w-full whitespace-nowrap text-sm font-medium text-text-main">
                    {location.name}
                  </td>
                  <td className="px-4 py-3 max-w-full whitespace-nowrap text-sm text-text-main">
                    {location.address}
                  </td>
                  <td className="px-4 py-3 max-w-full whitespace-nowrap text-sm text-text-main">
                    {location.contact}
                  </td>
                  <td className="px-4 py-3 max-w-full whitespace-nowrap text-sm text-text-main text-center">
                    {location.personnelCount}
                  </td>
                  <td className="px-4 py-3 max-w-full whitespace-nowrap text-sm text-text-main text-center">
                    {location.assignedItemsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center  text-sm font-medium">
                    <div className="flex justify-center items-center gap-4">
                      <button
                        onClick={() => handleOpenModal(location)}
                        className="text-primary hover:text-primary-dark"
                        title="Düzenle"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="text-danger hover:text-danger-dark"
                        title="Sil"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSaveLocation}
        location={editingLocation}
      />

      <ConfirmationModal
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        onConfirm={confirmDeleteHandler}
        title="Konum Silme Onayı"
        confirmText="Evet, Sil"
        confirmButtonVariant="danger"
      >
        <p>
          <strong>{locationToDelete?.name}</strong> konumunu kalıcı olarak
          silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default LocationsPage;
