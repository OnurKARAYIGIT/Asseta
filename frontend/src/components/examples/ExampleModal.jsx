import React, { useState } from "react";
import Modal from "../Modal";
import Button from "../shared/Button";

const ExampleModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    // Kaydetme işlemleri
    setIsOpen(false);
  };

  const handleDraft = () => {
    // Taslak kaydetme işlemleri
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Modal'ı Aç</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Zimmet Ekle"
        variant="form"
        size="default"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleDraft}>
              Beklemeye Al
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Zimmet Adı
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Zimmet adını giriniz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Açıklama
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              rows="4"
              placeholder="Açıklama giriniz"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExampleModal;
