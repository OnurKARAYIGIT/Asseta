import React, { useState, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { createPortal } from "react-dom";
import Button from "./Button";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "default",
  variant = "default", // 'default' | 'form' | 'confirmation' | 'info'
  footer,
  showCloseButton = true,
  preventClose = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    // Modal açıldığında pozisyonu sıfırla
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    // Sadece sol tıklama ile sürüklemeyi başlat
    if (e.button !== 0) return;
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    // Sürüklerken metin seçilmesini engelle
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  // Backdrop'a tıklandığında modalı kapatma
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  // Modal boyutları
  const sizeClasses =
    {
      small: "max-w-md",
      default: "max-w-2xl",
      large: "max-w-4xl",
      xlarge: "max-w-6xl",
      full: "max-w-[95vw]",
    }[size] || "max-w-2xl";

  // Modal varyantları
  const variantClasses =
    {
      default: "",
      form: "sm:min-w-[600px]",
      confirmation: "max-w-md",
      info: "max-w-lg",
    }[variant] || "";

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[2000] overflow-y-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackdropClick}
    >
      {/* Arkaplan overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity" />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 relative">
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses} ${variantClasses} 
            bg-card-background rounded-xl shadow-2xl 
            transform transition-transform duration-300 ease-out
            flex flex-col max-h-[calc(100vh-2rem)]
            ring-1 ring-border/10`}
          style={{
            transform: isDragging
              ? `translate(${position.x}px, ${position.y}px)`
              : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b border-border/75
              ${isDragging ? "cursor-grabbing" : "cursor-grab"}
              select-none`}
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-lg font-semibold text-text-main flex-1 pr-4">
              {title}
            </h2>
            {showCloseButton && (
              <Button
                variant="text"
                size="sm"
                onClick={onClose}
                className="!p-2 text-text-light hover:text-text-main"
                aria-label="Close modal"
              >
                <FaTimes className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 relative">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className="px-6 py-4 border-t border-border/75 
              flex justify-end gap-3 bg-background/30"
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
