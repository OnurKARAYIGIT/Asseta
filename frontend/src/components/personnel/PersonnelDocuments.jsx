import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { FaUpload, FaFilePdf, FaFileImage, FaFileWord } from "react-icons/fa";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Button from "../../components/shared/Button";
import Loader from "../../components/Loader";

const PersonnelDocuments = ({ personnelId }) => {
  const queryClient = useQueryClient();
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const fileInputRef = useRef(null);

  // Personel detaylarını (ve evraklarını) çek
  const {
    data: personnel,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["personnelDetails", personnelId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/personnel/${personnelId}`);
      return data;
    },
  });

  // Evrak yükleme mutasyonu
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, type }) => {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", type);
      return axiosInstance.post(
        `/personnel/${personnelId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    },
    onSuccess: () => {
      toast.success("Evrak başarıyla yüklendi.");
      queryClient.invalidateQueries({
        queryKey: ["personnelDetails", personnelId],
      });
      // Formu temizle
      setDocumentFile(null);
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Evrak yüklenirken bir hata oluştu."
      );
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!documentFile || !documentType) {
      toast.warn("Lütfen evrak tipi seçin ve bir dosya yükleyin.");
      return;
    }
    uploadDocumentMutation.mutate({ file: documentFile, type: documentType });
  };

  if (isLoading) return <Loader />;
  if (isError) return <div className="text-danger">Evraklar yüklenemedi.</div>;

  return (
    <div className="space-y-6">
      {/* Evrak Yükleme Formu */}
      <div className="p-4 bg-background rounded-lg shadow border border-border">
        <h3 className="font-semibold text-lg text-primary border-b border-border pb-2 mb-4">
          Yeni Evrak Yükle
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          {/* Evrak Tipi */}
          <div>
            <label
              htmlFor="documentType"
              className="block text-sm font-medium mb-1"
            >
              Evrak Tipi
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
            >
              <option value="">Seçiniz...</option>
              <option value="CV">CV</option>
              <option value="Kimlik Fotokopisi">Kimlik Fotokopisi</option>
              <option value="İkametgah">İkametgah</option>
              <option value="Sağlık Raporu">Sağlık Raporu</option>
              <option value="Sözleşme">Sözleşme</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Dosya Seçimi */}
          <div className="md:col-span-1">
            <label
              htmlFor="documentFile"
              className="block text-sm font-medium mb-1"
            >
              Dosya Seç
            </label>
            <div className="relative">
              <input
                type="file"
                id="documentFile"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="absolute w-0 h-0 opacity-0"
              />
              <label
                htmlFor="documentFile"
                className="input w-full flex items-center justify-between cursor-pointer px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              >
                <span className="truncate text-text-light">
                  {documentFile ? documentFile.name : "Bir dosya seçin..."}
                </span>
                <FaUpload className="text-primary" />
              </label>
            </div>
          </div>

          {/* Yükle Butonu */}
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={uploadDocumentMutation.isLoading}>
              {uploadDocumentMutation.isLoading ? "Yükleniyor..." : "Yükle"}
            </Button>
          </div>
        </form>
      </div>

      {/* Yüklenmiş Evraklar Tablosu */}
      <div className="overflow-x-auto bg-background rounded-lg shadow border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-light-gray">
            <tr>
              <th className="th-cell">Evrak Adı</th>
              <th className="th-cell text-center">Yüklenme Tarihi</th>
              <th className="th-cell text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {personnel.documents?.length > 0 ? (
              personnel.documents.map((doc) => (
                <tr
                  key={doc._id}
                  className="hover:bg-background-soft transition-colors"
                >
                  <td className="td-cell font-medium">{doc.fileName}</td>
                  <td className="td-cell text-center">
                    {format(new Date(doc.uploadDate), "dd MMM yyyy", {
                      locale: tr,
                    })}
                  </td>
                  <td className="td-cell text-center">
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}/${
                        doc.filePath
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Görüntüle
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-8 text-center text-text-light">
                  Bu personele ait evrak bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonnelDocuments;
