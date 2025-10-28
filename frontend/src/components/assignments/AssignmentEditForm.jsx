import React from "react";
import { FaSave } from "react-icons/fa";

const AssignmentEditForm = ({
  assignment,
  status,
  setStatus,
  returnDate,
  setReturnDate,
  assignmentNotes,
  setAssignmentNotes,
  onSubmit,
  updateError,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="assignment-edit-info">
        <p>
          <strong>Personel:</strong> {assignment.personnelName}
        </p>
        <p>
          <strong>Eşya:</strong> {assignment.item.name} (SN:{" "}
          {assignment.item.serialNumber})
        </p>
      </div>
      <div className="form-group">
        <label>Zimmet Durumu</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Zimmetli">Zimmetli</option>
          <option value="İade Edildi">İade Edildi</option>
          <option value="Arızalı">Arızalı</option>
          <option value="Hurda">Hurda</option>
        </select>
      </div>
      {status === "İade Edildi" && (
        <div className="form-group">
          <label>İade Tarihi</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      )}
      <div className="form-group">
        <label>Açıklama / Notlar</label>
        <textarea
          rows="4"
          value={assignmentNotes}
          onChange={(e) => setAssignmentNotes(e.target.value)}
        ></textarea>
      </div>
      {updateError && <p style={{ color: "red" }}>{updateError}</p>}
      <button
        type="submit"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <FaSave /> Değişiklikleri Kaydet
      </button>
    </form>
  );
};

export default AssignmentEditForm;
