import React from "react";
import ActivityItem from "./ActivityItem"; // Yeni bileşeni import ediyoruz

const RecentActivity = ({ assignments }) => {
  const hasAssignments = assignments && assignments.length > 0;

  return (
    <div className="recent-activity">
      <h2>Son Hareketler</h2>
      {hasAssignments ? (
        <ul className="recent-activity-list">
          {assignments.map((assignment) => (
            // Her bir zimmet için ActivityItem bileşenini render ediyoruz
            <ActivityItem key={assignment._id} assignment={assignment} />
          ))}
        </ul>
      ) : (
        <p>Henüz bir zimmet hareketi bulunmuyor.</p>
      )}
    </div>
  );
};

export default RecentActivity;
