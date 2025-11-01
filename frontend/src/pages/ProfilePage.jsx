import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import Loader from "../components/Loader";
import {
  FaUserCircle,
  FaEnvelope,
  FaUserTag,
  FaSignInAlt,
  FaBoxOpen,
  FaHistory,
} from "react-icons/fa";

const ProfilePage = () => {
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/users/profile");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 dakika
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("tr-TR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-danger">
        Profil bilgileri yüklenirken bir hata oluştu: {error.message}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8 text-text-light">
        Profil bilgileri bulunamadı.
      </div>
    );
  }

  const { personnel, email, role, lastLogin, assignments, actions } = profile;

  return (
    <div className="space-y-8">
      {/* Profil Başlığı */}
      <div className="bg-card-background p-6 rounded-xl shadow-lg flex items-center gap-6">
        <FaUserCircle className="text-6xl text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-text-main">
            {personnel?.fullName || "Kullanıcı"}
          </h1>
          <p className="text-lg text-text-light">
            {personnel?.position || "Pozisyon Belirtilmemiş"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Sütun: Kişisel Bilgiler ve Zimmetler */}
        <div className="lg:col-span-2 space-y-8">
          {/* Kişisel Bilgiler Kartı */}
          <div className="bg-card-background p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-text-main mb-4">
              Kullanıcı Bilgileri
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-text-light" />
                <div>
                  <p className="text-sm text-text-light">E-posta</p>
                  <p className="font-medium text-text-main">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaUserTag className="text-text-light" />
                <div>
                  <p className="text-sm text-text-light">Rol</p>
                  <p className="font-medium text-text-main capitalize">
                    {role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <FaSignInAlt className="text-text-light" />
                <div>
                  <p className="text-sm text-text-light">Son Giriş</p>
                  <p className="font-medium text-text-main">
                    {formatDate(lastLogin)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Zimmetli Eşyalar Kartı */}
          <div className="bg-card-background p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-text-main mb-4 flex items-center gap-3">
              <FaBoxOpen /> Zimmetli Eşyalar ({assignments?.length || 0})
            </h2>
            <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {assignments && assignments.length > 0 ? (
                <ul className="space-y-3">
                  {assignments.map((assignment) => (
                    <li
                      key={assignment._id}
                      className="flex justify-between items-center p-3 bg-background rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-text-main">
                          {assignment.item?.name || "Bilinmeyen Eşya"}
                        </p>
                        <p className="text-sm text-text-light">
                          {assignment.item?.assetTag || "Demirbaş No Yok"}
                        </p>
                      </div>
                      <p className="text-sm text-text-light">
                        {formatDate(assignment.assignmentDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-light">
                  Üzerinize kayıtlı zimmet bulunmamaktadır.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Son İşlemler */}
        <div className="lg:col-span-1 bg-card-background p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-text-main mb-4 flex items-center gap-3">
            <FaHistory /> Son İşlemler
          </h2>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
            {actions && actions.length > 0 ? (
              <ul className="space-y-4">
                {actions.map((action) => (
                  <li
                    key={action._id}
                    className="border-l-2 border-primary pl-4"
                  >
                    <p className="font-semibold text-sm text-text-main">
                      {action.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-text-light mt-1">
                      {action.details}
                    </p>
                    <p className="text-xs text-text-light mt-2">
                      {formatDate(action.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-light">
                Herhangi bir işlem kaydı bulunamadı.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
