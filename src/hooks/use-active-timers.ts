import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveTask {
  id: string;
  taskId: number;
  secondsRemaining: number;
  startedAt: string;
}

/**
 * Hook to manage active task timers across the entire app.
 * Fetches active tasks from DB and keeps countdown synced with server time.
 * Persists timers across page navigation.
 */
export const useActiveTimers = () => {
  const [activeTasks, setActiveTasks] = useState<Map<string, ActiveTask>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active tasks from database
  const fetchActiveTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_tasks")
        .select("id, task_id, started_at, status")
        .eq("user_id", user.id)
        .eq("status", "verifying")
        .order("started_at", { ascending: false });

      if (error) {
        console.error("Error fetching active tasks:", error);
        setIsLoading(false);
        return;
      }

      // Convert to map
      const tasksMap = new Map<string, ActiveTask>();
      if (data) {
        data.forEach((task) => {
          tasksMap.set(task.id, {
            id: task.id,
            taskId: task.task_id,
            secondsRemaining: 10, // Will be recalculated in loop
            startedAt: task.started_at,
          });
        });
      }

      setActiveTasks(tasksMap);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch active tasks:", err);
      setIsLoading(false);
    }
  }, []);

  // Load active tasks on mount
  useEffect(() => {
    fetchActiveTasks();
  }, [fetchActiveTasks]);

  // Countdown loop: update remaining seconds every second
  useEffect(() => {
    if (activeTasks.size === 0) return;

    const interval = setInterval(() => {
      setActiveTasks((prev) => {
        const updated = new Map(prev);
        const now = Date.now();

        updated.forEach((task) => {
          const startTime = new Date(task.startedAt).getTime();
          const elapsed = (now - startTime) / 1000;
          const remaining = Math.max(0, 10 - elapsed);

          task.secondsRemaining = Math.ceil(remaining);

          // Remove task if timer expired
          if (remaining <= 0) {
            updated.delete(task.id);
          }
        });

        return updated;
      });
    }, 100); // Update frequently for smooth countdown

    return () => clearInterval(interval);
  }, [activeTasks.size]);

  return {
    activeTasks,
    isLoading,
    refetchActiveTasks: fetchActiveTasks,
  };
};
