import React from "react";
import Modal from "../Modal";
import Button from "../shared/Button";

const SummaryModal = ({
  isOpen,
  onClose,
  title,
  loading,
  data = [],
  type = "personnel",
  onGoToDetails,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      variant="info"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          {type === "personnel" && (
            <Button variant="primary" onClick={onGoToDetails}>
              Detaylara Git
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {data.length === 0 ? (
              <p>Gösterilecek veri yok.</p>
            ) : (
              <ul className="list-disc pl-5">
                {data.map((item, idx) => (
                  <li key={item._id || idx} className="py-1">
                    {type === "personnel" ? (
                      <div>
                        <strong>
                          {item.personnelName || item.name || "-"}
                        </strong>
                        {item.assignments && (
                          <div className="text-sm text-text-light">
                            {item.assignments.length} kayıt
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <strong>
                          {item.item?.name || item.name || item.assetTag || "-"}
                        </strong>
                        <div className="text-sm text-text-light">
                          {item.assignments?.length || 0} kayıt
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SummaryModal;
