import { useActiveTimers } from "@/hooks/use-active-timers";
import { AlertCircle, Clock } from "lucide-react";

export const ActiveTaskBanner = () => {
  const { activeTasks } = useActiveTimers();

  if (activeTasks.size === 0) return null;

  // Get first active task (most recent)
  const firstTask = Array.from(activeTasks.values())[0];
  if (!firstTask) return null;

  const { taskId, secondsRemaining } = firstTask;
  const isUrgent = secondsRemaining <= 3;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between ${
        isUrgent
          ? "bg-red-600/90 border-b-2 border-red-400 shadow-lg"
          : "bg-yellow-500/90 border-b-2 border-yellow-400 shadow-lg"
      } backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Clock className="w-5 h-5 text-white animate-pulse" />
        <div className="text-sm font-semibold text-white">
          <p>Task {taskId} in progress</p>
          <p className="text-xs opacity-90">
            Please wait {secondsRemaining} second{secondsRemaining !== 1 ? "s" : ""} for verification
          </p>
        </div>
      </div>

      <div
        className={`text-center ${
          isUrgent ? "text-red-100 font-bold text-lg" : "text-white font-bold"
        }`}
      >
        {secondsRemaining}s
      </div>
    </div>
  );
};
