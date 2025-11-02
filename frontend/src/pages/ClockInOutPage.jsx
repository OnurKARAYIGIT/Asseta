import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import { FaPlay, FaStop, FaClock } from "react-icons/fa";
import Loader from "../components/Loader";
import Button from "../components/shared/Button";

const ClockInOutPage = () => {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Her saniye saati güncelle
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kullanıcının mevcut mesai durumunu çeken sorgu
  const { data: attendanceStatus, isLoading } = useQuery({
    queryKey: ["myAttendanceStatus"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/attendance/status");
      return data;
    },
    refetchOnWindowFocus: true, // Başka sekmeye geçip gelince durumu yenile
  });

  const invalidateStatus = () => {
    queryClient.invalidateQueries({ queryKey: ["myAttendanceStatus"] });
  };

  // Mesai başlatma (Clock In) mutasyonu
  const clockInMutation = useMutation({
    mutationFn: () => axiosInstance.post("/attendance/clock-in"),
    onSuccess: () => {
      toast.success("Mesai başarıyla başlatıldı!");
      invalidateStatus();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || "Mesai başlatılırken bir hata oluştu."
      ),
  });

  // Mesai bitirme (Clock Out) mutasyonu
  const clockOutMutation = useMutation({
    mutationFn: () => axiosInstance.post("/attendance/clock-out"),
    onSuccess: () => {
      toast.info("Mesai başarıyla sonlandırıldı.");
      invalidateStatus();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || "Mesai bitirilirken bir hata oluştu."
      ),
  });

  const isWorking = attendanceStatus?.status === "Çalışıyor";

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-card-background p-8 rounded-xl shadow-lg">
      <div className="text-center">
        <FaClock className="text-5xl text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-text-main mb-2">Mesai Takibi</h1>
        <p className="text-lg text-text-light mb-8">
          Mevcut saatiniz:{" "}
          <span className="font-semibold text-text-main">
            {currentTime.toLocaleTimeString("tr-TR")}
          </span>
        </p>
      </div>

      <div className="w-full max-w-sm p-8 bg-background rounded-2xl shadow-inner-strong">
        {isWorking ? (
          <div className="text-center">
            <p className="text-lg text-green-500 font-semibold mb-4 animate-pulse">
              Şu anda mesainiz devam ediyor.
            </p>
            <p className="text-sm text-text-light mb-6">
              Başlangıç:{" "}
              <span className="font-mono">
                {new Date(attendanceStatus.checkIn).toLocaleTimeString("tr-TR")}
              </span>
            </p>
            <Button
              variant="danger"
              size="lg"
              className="w-full"
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isLoading}
            >
              <FaStop className="mr-2" />
              {clockOutMutation.isLoading ? "Bitiriliyor..." : "Mesaiyi Bitir"}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-text-light mb-6">
              Mesaiye başlamak için butona tıklayın.
            </p>
            <Button
              variant="success"
              size="lg"
              className="w-full"
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isLoading}
            >
              <FaPlay className="mr-2" />
              {clockInMutation.isLoading ? "Başlatılıyor..." : "Mesaiye Başla"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockInOutPage;
