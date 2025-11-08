import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../api/axiosInstance";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Loader from "../Loader";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  FaEnvelope,
  FaPhone,
  FaFileAlt,
  FaUser,
  FaGlobe,
  FaUsers,
  FaLinkedin,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const sourceIcons = {
  LinkedIn: <FaLinkedin className="text-blue-500" />,
  "Web Sitesi": <FaGlobe className="text-green-500" />,
  Referans: <FaUsers className="text-purple-500" />,
  "Kariyer.net": <FaFileAlt className="text-orange-500" />,
  "İş-Kur": <FaFileAlt className="text-red-500" />,
  Diğer: <FaFileAlt className="text-gray-500" />,
};

const CandidateDetailModal = ({
  isOpen,
  onClose,
  application,
  onScheduleInterview,
  onMakeOffer,
}) => {
  if (!application) return null;

  const { candidate } = application;

  // YENİ: Adaya ait mülakatları çekmek için sorgu
  const {
    data: interviews = [],
    isLoading: isLoadingInterviews,
    isError,
  } = useQuery({
    queryKey: ["interviewsForApplication", application._id],
    queryFn: () =>
      axiosInstance
        .get(`/applications/${application._id}/interviews`)
        .then((res) => res.data),
    enabled: !!isOpen && !!application._id, // Sadece modal açıkken ve ID varken çalış
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aday Detayları" size="xl">
      <div className="space-y-4">
        {/* Başlık */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FaUser className="text-3xl text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main">
              {candidate.fullName}
            </h2>
            <p className="text-sm text-text-light">{candidate.email}</p>
          </div>
        </div>

        {/* İletişim ve Kaynak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <FaPhone className="text-text-light" />
            <span className="text-text-main">
              {application.candidate.phone || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {sourceIcons[application.candidate.source] || <FaFileAlt />}
            <span className="text-text-main">
              {application.candidate.source}
            </span>
          </div>
        </div>

        {/* Etiketler */}
        {candidate.tags && candidate.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Yetenekler</h4>
            <div className="flex flex-wrap gap-2">
              {candidate.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold bg-primary/10 text-primary-dark px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Belgeler */}
        {application.candidate.resumePaths &&
          application.candidate.resumePaths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Belgeler</h4>
              <ul className="space-y-2">
                {application.candidate.resumePaths.map((path, index) => (
                  <li key={index}>
                    <a
                      href={path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <FaFileAlt />
                      <span>{path.split("/").pop()}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* YENİ: Teklif Detayları Bölümü */}
      {application.offer && (
        <div className="pt-4 mt-4 border-t border-border">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <FaMoneyBillWave className="text-success" />
            Yapılan İş Teklifi
          </h3>
          <div className="grid grid-cols-2 gap-4 p-3 bg-background-soft rounded-lg">
            <div>
              <p className="text-xs text-text-light">Teklif Edilen Maaş</p>
              <p className="font-semibold text-text-main">
                {application.offer.offeredSalary.toLocaleString("tr-TR")}{" "}
                {application.offer.currency}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-light">İşe Başlangıç Tarihi</p>
              <p className="font-semibold text-text-main">
                {format(new Date(application.offer.startDate), "dd MMMM yyyy", {
                  locale: tr,
                })}
              </p>
            </div>
            {application.offer.notes && (
              <div className="col-span-2">
                <p className="text-xs text-text-light">Notlar</p>
                <p className="text-sm text-text-main">
                  {application.offer.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YENİ: Planlanmış Mülakatlar Bölümü */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <FaCalendarAlt className="text-secondary" />
          Planlanmış Mülakatlar
        </h3>
        {isLoadingInterviews ? (
          <Loader />
        ) : isError ? (
          <p className="text-danger text-sm">Mülakatlar yüklenemedi.</p>
        ) : interviews.length > 0 ? (
          <ul className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {interviews.map((interview) => (
              <li
                key={interview._id}
                className="p-3 bg-background-soft rounded-lg border border-border/50"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-text-main">
                    {interview.interviewType}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {format(
                      new Date(interview.scheduledDate),
                      "dd MMM yyyy, HH:mm",
                      { locale: tr }
                    )}
                  </p>
                </div>
                <p className="text-xs text-text-light mt-1">
                  <span className="font-medium">Mülakatçılar:</span>{" "}
                  {interview.interviewers
                    .map((interviewer) => interviewer.fullName)
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-light">
            Bu aday için planlanmış bir mülakat bulunmuyor.
          </p>
        )}
      </div>

      <div className="pt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Kapat
        </Button>
        {/* Koşullu Butonlar */}
        {!application.offer && (
          <Button variant="success" onClick={() => onMakeOffer(candidate)}>
            Teklif Yap
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => onScheduleInterview(candidate)}
        >
          Mülakat Planla
        </Button>
      </div>
    </Modal>
  );
};

export default CandidateDetailModal;
