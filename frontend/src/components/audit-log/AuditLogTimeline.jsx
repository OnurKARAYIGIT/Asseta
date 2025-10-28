import React from "react";
import AuditLogItem from "./AuditLogItem";

const AuditLogTimeline = ({ groupedLogs }) => {
  return (
    <div className="timeline-container">
      {Object.keys(groupedLogs).length > 0 ? (
        Object.keys(groupedLogs).map((date) => (
          <div key={date} className="timeline-group">
            <h2 className="timeline-date-header">{date}</h2>
            <div className="timeline">
              {groupedLogs[date].map((log) => (
                <AuditLogItem key={log._id} log={log} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>Filtre kriterlerine uygun denetim kaydı bulunamadı.</p>
      )}
    </div>
  );
};

export default AuditLogTimeline;
