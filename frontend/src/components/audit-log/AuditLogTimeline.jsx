import React from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimesCircle,
  FaHistory,
} from "react-icons/fa";

const AuditLogTimeline = ({ groupedLogs }) => {
  const getActionInfo = (action) => {
    const actionMap = {
      ZİMMET_OLUŞTURULDU: {
        Icon: FaPlus,
        classes: "bg-green-100 text-green-600 border-green-200",
      },
      ZİMMET_GÜNCELLENDİ: {
        Icon: FaEdit,
        classes: "bg-blue-100 text-blue-600 border-blue-200",
      },
      ZİMMET_SİLİNDİ: {
        Icon: FaTrash,
        classes: "bg-red-100 text-red-600 border-red-200",
      },
      ZİMMET_ONAYLANDI: {
        Icon: FaCheck,
        classes: "bg-teal-100 text-teal-600 border-teal-200",
      },
      ZİMMET_REDDEDİLDİ: {
        Icon: FaTimesCircle,
        classes: "bg-orange-100 text-orange-600 border-orange-200",
      },
      default: {
        Icon: FaHistory,
        classes: "bg-light-gray text-text-light border-border",
      },
    };

    return actionMap[action] || actionMap.default;
  };

  return (
    <div className="space-y-8">
      {Object.keys(groupedLogs).map((date) => (
        <div key={date}>
          <h3 className="text-lg font-semibold text-text-main mb-4 pb-2 border-b border-border">
            {date}
          </h3>
          <div className="space-y-6">
            {groupedLogs[date].map((log) => {
              const { Icon, classes } = getActionInfo(log.action);
              return (
                <div key={log._id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 text-right">
                    <span className="text-sm text-text-light">
                      {new Date(log.createdAt).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="relative flex-shrink-0">
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 -left-2.5 h-5 w-5 flex items-center justify-center rounded-full border-2 ${classes}`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="w-px h-full bg-border ml-0"></div>
                  </div>
                  <div className="flex-grow pb-6">
                    <p className="text-sm text-text-main">
                      <strong className="font-semibold text-primary">
                        {log.user?.username || "Sistem"}
                      </strong>{" "}
                      - {log.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditLogTimeline;
