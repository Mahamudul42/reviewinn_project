import React from 'react';
import MissionItem from '../atoms/MissionItem';

interface DailyTask {
  label: string;
  complete: boolean;
}

interface ApiDailyTask {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  points_reward: number;
}

interface DailyMissionsProps {
  dailyTasks: DailyTask[] | ApiDailyTask[];
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";

const DailyMissions: React.FC<DailyMissionsProps> = ({ dailyTasks }) => {
  // Convert API format to component format
  const normalizedTasks = (dailyTasks || []).map((task, index) => {
    if ('label' in task) {
      // Already in correct format
      return task;
    }
    // Convert from API format
    const apiTask = task as ApiDailyTask;
    return {
      label: apiTask.title || `Task ${index + 1}`,
      complete: apiTask.completed || false
    };
  });

  return (
    <div className={`p-5 shadow-lg rounded-xl ${cardBg}`}>
      <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
        🎯 Daily Missions
      </h3>
      <div className="space-y-4">
        {normalizedTasks.map((task, index) => (
          <MissionItem key={index} label={task.label} complete={task.complete} />
        ))}
      </div>
    </div>
  );
};

export default DailyMissions; 