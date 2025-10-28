import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import LocationsToolbar from "../components/locations/LocationsToolbar";
import LocationsTable from "../components/locations/LocationsTable";

const LocationsPage = () => {
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { userInfo } = useAuth();
  const queryClient = useQueryClient();

  // --- React Query ile Veri Çekme ---
  const {
    data: locations = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/locations");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika boyunca veriyi taze kabul et
  });

  // --- React Query ile Veri Ekleme ---
  const addLocationMutation = useMutation({
    mutationFn: (newLocationName) =>
      axiosInstance.post("/locations", { name: newLocationName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setName("");
      toast.success("Yeni konum başarıyla eklendi.");
      setSubmitError("");
    },
    onError: (err) => {
      setSubmitError(
        err.response?.data?.message || "Konum eklenirken bir hata oluştu."
      );
    },
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!name) {
      setSubmitError("Konum adı boş olamaz.");
      return;
    }
    addLocationMutation.mutate(name);
  };

  return (
    <div className="page-container">
      <LocationsToolbar
        name={name}
        setName={setName}
        submitHandler={submitHandler}
        submitError={submitError}
        userInfo={userInfo}
      />
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p style={{ color: "red" }}>{error.message}</p>
      ) : (
        <LocationsTable locations={locations} />
      )}
    </div>
  );
};

export default LocationsPage;
