import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import Select from "react-select";

import Header from "../components/shared/Header";
import Button from "../components/shared/Button";
import Loader from "../components/Loader";
import JobOpeningModal from "../components/recruitment/JobOpeningModal";
import CandidateModal from "../components/recruitment/CandidateModal";
import CandidateDetailModal from "../components/recruitment/CandidateDetailModal"; // YENİ
import InterviewModal from "../components/recruitment/InterviewModal"; // YENİ
import OfferModal from "../components/recruitment/OfferModal"; // YENİ
import RecruitmentPipeline from "../components/recruitment/RecruitmentPipeline";
import { FaUserPlus, FaBriefcase, FaPlus } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const RecruitmentPage = () => {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState(null);
  const location = useLocation(); // YENİ: URL bilgilerini almak için

  // YENİ: URL'den 'status' parametresini al
  const searchParams = new URLSearchParams(location.search);
  const statusHighlight = searchParams.get("status");
  const jobIdFromUrl = searchParams.get("jobId"); // YENİ: URL'den jobId'yi al

  // Modal States
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [isCandidateModalOpen, setCandidateModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState("add");
  const [currentJobItem, setCurrentJobItem] = useState(null);
  // YENİ: Aday detay modalı için state'ler
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] =
    useState(null);
  // YENİ: Mülakat modalı için state'ler
  const [isInterviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedApplicationForInterview, setSelectedApplicationForInterview] =
    useState(null);
  // YENİ: Teklif modalı için state'ler
  const [isOfferModalOpen, setOfferModalOpen] = useState(false);
  const [selectedApplicationForOffer, setSelectedApplicationForOffer] =
    useState(null);

  // İş ilanlarını çek
  const { data: jobOpenings, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["jobOpeningsForRecruitment"],
    queryFn: () => axiosInstance.get("/job-openings").then((res) => res.data),
  });

  // Seçili iş ilanına ait başvuruları çek
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["applicationsForJob", selectedJob?._id],
    queryFn: () =>
      axiosInstance
        .get(`/applications/job/${selectedJob._id}`)
        .then((res) => res.data),
    enabled: !!selectedJob, // Sadece bir iş ilanı seçildiğinde çalış
  });

  // YENİ: URL'den gelen jobId'ye göre ilk iş ilanını seçme (Optimize Edildi)
  useEffect(() => {
    // Sadece URL'den bir jobId geldiğinde ve iş ilanları yüklendiğinde çalış.
    // `selectedJob` kontrolünü kaldırarak, sayfa yenilendiğinde de doğru ilanın seçilmesini sağlıyoruz.
    if (jobIdFromUrl && jobOpenings?.length > 0) {
      const jobToSelect = jobOpenings.find((j) => j._id === jobIdFromUrl);
      // Eğer seçili ilan zaten doğru ilansa, gereksiz state güncellemesini önle.
      if (jobToSelect && selectedJob?._id !== jobToSelect._id) {
        setSelectedJob(jobToSelect);
      }
    }
  }, [jobIdFromUrl, jobOpenings]); // Bağımlılıklardan 'selectedJob' kaldırıldı.

  // İş ilanı oluşturma/güncelleme
  const { mutate: submitJobOpening } = useMutation({
    mutationFn: (jobData) =>
      jobData._id
        ? axiosInstance.put(`/job-openings/${jobData._id}`, jobData)
        : axiosInstance.post("/job-openings", jobData),
    onSuccess: () => {
      toast.success("İş ilanı başarıyla kaydedildi.");
      queryClient.invalidateQueries(["jobOpeningsForRecruitment"]);
      setJobModalOpen(false);
    },
    onError: () => toast.error("İş ilanı kaydedilirken bir hata oluştu."),
  });

  // Aday oluşturma
  const { mutate: submitCandidate } = useMutation({
    mutationFn: (candidateData) =>
      axiosInstance.post("/candidates", candidateData),
    onSuccess: () => {
      toast.success("Aday başarıyla havuza eklendi.");
      queryClient.invalidateQueries(["candidates"]); // Aday havuzu sayfasını etkiler
      setCandidateModalOpen(false);
    },
    onError: () => toast.error("Aday eklenirken bir hata oluştu."),
  });

  // Başvuru durumunu güncelleme
  const { mutate: updateApplicationStatus } = useMutation({
    mutationFn: async ({ applicationId, newStatus }) =>
      axiosInstance.put(`/applications/${applicationId}/status`, {
        status: newStatus,
      }),
    // İyimser Güncelleme Mantığı
    onMutate: async ({ applicationId, newStatus }) => {
      // Devam eden veri çekme işlemlerini iptal et (eski verinin üzerine yazmasını engelle)
      await queryClient.cancelQueries({
        queryKey: ["applicationsForJob", selectedJob?._id],
      });

      // Önceki state'in bir anlık görüntüsünü al
      const previousApplications = queryClient.getQueryData([
        "applicationsForJob",
        selectedJob?._id,
      ]);

      // State'i yeni durumla iyimser bir şekilde güncelle
      queryClient.setQueryData(
        ["applicationsForJob", selectedJob?._id],
        (oldData) =>
          oldData.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
      );

      // Hata durumunda geri dönebilmek için önceki state'i döndür
      return { previousApplications };
    },
    onError: (err, variables, context) => {
      // Hata olursa, onMutate'den dönen önceki state'e geri dön
      if (context.previousApplications) {
        queryClient.setQueryData(
          ["applicationsForJob", selectedJob?._id],
          context.previousApplications
        );
      }
      toast.error("Durum güncellenirken bir hata oluştu.");
    },
    onSettled: (data, error, variables) => {
      // İşlem başarılı veya hatalı olsun, sonunda veriyi sunucuyla senkronize et
      queryClient.invalidateQueries({
        queryKey: ["applicationsForJob", selectedJob?._id],
      });
      // YENİ: İşe alım durumuna özel bildirim
      if (!error && variables.newStatus === "İşe Alındı") {
        toast.success("Aday işe alındı ve personel kaydı oluşturuldu!");
      } else if (!error) {
        toast.info("Adayın durumu güncellendi.");
      }
    },
  });

  // YENİ: Mülakat oluşturma
  const { mutate: scheduleInterview } = useMutation({
    mutationFn: (interviewData) =>
      axiosInstance.post("/interviews", interviewData),
    onSuccess: () => {
      toast.success("Mülakat başarıyla planlandı.");
      // İlgili listeleri veya detayları yenilemek için query invalidation eklenebilir.
      setInterviewModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Mülakat planlanırken bir hata oluştu."
      );
    },
  });

  // YENİ: Teklif yapma
  const { mutate: makeOffer } = useMutation({
    mutationFn: (offerData) =>
      axiosInstance.post(
        `/applications/${offerData.applicationId}/offer`,
        offerData
      ),
    onSuccess: () => {
      toast.success(
        "İş teklifi başarıyla yapıldı ve adayın durumu güncellendi."
      );
      queryClient.invalidateQueries(["applicationsForJob", selectedJob?._id]);
      setOfferModalOpen(false);
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Teklif yapılırken bir hata oluştu."
      );
    },
  });

  const jobOptions = useMemo(
    () =>
      jobOpenings
        ?.filter((job) => job.status === "Açık")
        .map((job) => ({
          value: job,
          label: `${job.title} (${job.department})`, // Departman bilgisi eklendi
        })) || [],
    [jobOpenings]
  );

  // YENİ: Kart tıklandığında çalışacak fonksiyon
  const handleViewCandidateDetails = (candidate) => {
    setSelectedCandidateForDetail(candidate);
    setDetailModalOpen(true);
  };

  // YENİ: Mülakat modalını açan fonksiyon
  const handleOpenInterviewModal = (candidate) => {
    const application = applications.find(
      (app) => app.candidate._id === candidate._id
    );
    setSelectedApplicationForInterview(application);
    setDetailModalOpen(false); // Detay modalını kapat
    setInterviewModalOpen(true); // Mülakat modalını aç
  };

  // YENİ: Teklif modalını açan fonksiyon
  const handleOpenOfferModal = (candidate) => {
    const application = applications.find(
      (app) => app.candidate._id === candidate._id
    );
    setSelectedApplicationForOffer(application);
    setDetailModalOpen(false); // Detay modalını kapat
    setOfferModalOpen(true); // Teklif modalını aç
  };

  // MODAL PROPLARINI STABİLİZE ETME
  const handleCloseDetailModal = React.useCallback(() => {
    setDetailModalOpen(false);
  }, []);

  const selectedApplicationForDetail = useMemo(
    () =>
      applications?.find(
        (app) => app.candidate._id === selectedCandidateForDetail?._id
      ),
    [applications, selectedCandidateForDetail]
  );
  return (
    <>
      <div className="bg-card-background p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <FaBriefcase className="text-secondary text-2xl" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
            İşe Alım Yönetimi
          </h1>
        </div>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          <div className="lg:col-span-1">
            <Select
              options={jobOptions}
              isLoading={isLoadingJobs}
              value={
                selectedJob
                  ? {
                      value: selectedJob,
                      label: `${selectedJob.title} (${selectedJob.department})`,
                    }
                  : null
              }
              onChange={(option) => setSelectedJob(option.value)}
              placeholder="Bir iş ilanı seçin..."
              classNamePrefix="react-select"
            />
          </div>
          <div className="flex gap-2 justify-start md:justify-end md:col-span-1 lg:col-span-2">
            {/* YENİ: İlanı Düzenle Butonu */}
            {selectedJob && (
              <Button
                variant="outline"
                onClick={() => {
                  setJobModalMode("edit");
                  setCurrentJobItem(selectedJob);
                  setJobModalOpen(true);
                }}
              >
                İlanı Düzenle
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => {
                setJobModalMode("add");
                setCurrentJobItem(null);
                setJobModalOpen(true);
              }}
            >
              <FaPlus /> Yeni İlan
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCandidateModalOpen(true)}
            >
              <FaUserPlus /> Yeni Aday
            </Button>
          </div>
        </div>

        {isLoadingApplications && selectedJob && <Loader />}

        {selectedJob && !isLoadingApplications && (
          <RecruitmentPipeline
            applications={applications || []}
            onUpdateStatus={updateApplicationStatus}
            onViewDetails={handleViewCandidateDetails} // YENİ: Fonksiyonu prop olarak geçir
            highlightColumn={statusHighlight} // YENİ: Vurgulanacak sütunu prop olarak geçir
          />
        )}
      </div>

      <JobOpeningModal
        isOpen={isJobModalOpen}
        onClose={() => setJobModalOpen(false)}
        onSubmit={submitJobOpening}
        mode={jobModalMode}
        currentItem={currentJobItem}
      />
      <CandidateModal
        isOpen={isCandidateModalOpen}
        onClose={() => setCandidateModalOpen(false)}
        onSubmit={submitCandidate}
        mode="add"
      />
      {/* YENİ: Aday Detay Modalı */}
      <CandidateDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        application={selectedApplicationForDetail}
        onScheduleInterview={handleOpenInterviewModal} // YENİ
        onMakeOffer={handleOpenOfferModal} // YENİ
      />

      {/* YENİ: Mülakat Planlama Modalı */}
      <InterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        onSubmit={scheduleInterview}
        application={selectedApplicationForInterview}
      />

      {/* YENİ: Teklif Yapma Modalı */}
      <OfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setOfferModalOpen(false)}
        onSubmit={makeOffer}
        application={selectedApplicationForOffer}
      />
    </>
  );
};

export default RecruitmentPage;
