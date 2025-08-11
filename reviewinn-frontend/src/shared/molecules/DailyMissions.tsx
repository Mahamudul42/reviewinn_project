import React from 'react';
import MissionItem from '../atoms/MissionItem';

interface DailyTask {
  label: string;
  complete: boolean;
}

interface DailyMissionsProps {
  dailyTasks: DailyTask[];
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const DailyMissions: React.FC<DailyMissionsProps> = ({ dailyTasks }) => (
  <div className={`p-5 shadow-lg rounded-xl ${cardBg}`}>
    <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
      🎯 Daily Missions
    </h3>
    <div className="space-y-4">
      {dailyTasks.map((task: DailyTask, index: number) => (
        <MissionItem key={index} label={task.label} complete={task.complete} />
      ))}
    </div>
  </div>
);

export default DailyMissions; 