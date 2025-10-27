import { useEffect, useRef, useState, useCallback } from "react";

const useInactivityTimeout = (onTimeout, timeout = 5 * 60 * 1000) => {
  const timeoutRef = useRef(null);
  const [remainingTime, setRemainingTime] = useState(timeout);
  const [isWarning, setIsWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Dinlenecek kullanıcı aktivitesi olayları
  const events = ["click", "keydown", "visibilitychange", "focus"];

  // Zamanlayıcıyı sıfırlayan fonksiyon
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(onTimeout, timeout);
  }, [onTimeout, timeout]);

  useEffect(() => {
    // Her saniye kalan süreyi hesapla
    const interval = setInterval(() => {
      // Bu, tarayıcı sekmesi aktif olmadığında bile doğru çalışır
      const newRemainingTime = Math.max(
        0,
        timeout - (Date.now() - lastActivityRef.current)
      );
      setRemainingTime(newRemainingTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout]);

  useEffect(() => {
    // Kullanıcı aktivitesini dinle ve son aktivite zamanını güncelle
    const handleActivity = (e) => {
      // Eğer olay bir tıklama ise, "anlamlı" bir tıklama olup olmadığını kontrol et
      if (e.type === "click") {
        // Tıklanan elemanın bir buton, link, input, select, textarea veya özel bir kart olup olmadığını kontrol et
        const interactiveElement = e.target.closest(
          "button, a, input, select, textarea, [role='button'], .card, .accordion-header, .modal-content"
        );
        if (!interactiveElement) {
          return; // Anlamlı bir tıklama değilse, sayacı sıfırlama
        }
      }

      lastActivityRef.current = Date.now();
      resetTimeout();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimeout();

    // Bileşen kaldırıldığında olay dinleyicilerini ve zamanlayıcıyı temizle
    return () => {
      clearTimeout(timeoutRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimeout]);

  useEffect(() => {
    if (remainingTime <= 60 * 1000) {
      setIsWarning(true);
    } else {
      setIsWarning(false);
    }
  }, [remainingTime]);

  return { remainingTime, isWarning };
};

export default useInactivityTimeout;
