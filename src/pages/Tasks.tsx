import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Trophy, Zap, Star } from "lucide-react";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TaskProgressBar from "@/components/TaskProgressBar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTimers } from "@/hooks/use-active-timers";

// ── Claim Counter Visual ────────────────────────────────────────────────────
const ClaimCounter = ({ totalClaims }: { totalClaims: number }) => {
  const MAX = 100;
  const pct = Math.min((totalClaims / MAX) * 100, 100);
  const isAlmostThere = totalClaims >= 75;
  const isComplete = totalClaims >= MAX;

  return (
    <Card
      style={{
        background: isComplete
          ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)"
          : isAlmostThere
            ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
        border: isComplete
          ? "1.5px solid rgba(251,191,36,0.8)"
          : "1.5px solid rgba(139,92,246,0.4)",
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: isComplete
            ? "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isComplete ? (
            <Trophy style={{ width: 20, height: 20, color: "#fbbf24" }} />
          ) : (
            <Zap style={{ width: 20, height: 20, color: "#a78bfa" }} />
          )}
          <span
            style={{
              color: "#f1f5f9",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
            }}
          >
            {isComplete ? "🎉 UPGRADED!" : "Progress to Upgrade"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span
            style={{
              fontSize: "1.6rem",
              fontWeight: 900,
              color: isComplete ? "#fbbf24" : "#a78bfa",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {totalClaims}
          </span>
          <span
            style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600 }}
          >
            /{MAX}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "10px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          marginBottom: "0.6rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "999px",
            background: isComplete
              ? "linear-gradient(90deg, #fbbf24, #ef4444, #8b5cf6)"
              : "linear-gradient(90deg, #6d28d9, #a78bfa, #7c3aed)",
            boxShadow: isComplete
              ? "0 0 10px rgba(251,191,36,0.7)"
              : "0 0 10px rgba(139,92,246,0.6)",
            transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>

      {/* Milestone dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {[25, 50, 75, 100].map((milestone) => {
          const reached = totalClaims >= milestone;
          return (
            <div
              key={milestone}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: reached
                    ? isComplete
                      ? "#fbbf24"
                      : "#a78bfa"
                    : "rgba(255,255,255,0.15)",
                  boxShadow: reached
                    ? `0 0 6px ${isComplete ? "#fbbf24" : "#a78bfa"}`
                    : "none",
                  transition: "all 0.3s ease",
                }}
              />
              <span
                style={{
                  fontSize: "0.6rem",
                  color: reached ? "#94a3b8" : "#475569",
                  fontWeight: 600,
                }}
              >
                {milestone}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status text */}
      <p
        style={{
          marginTop: "0.65rem",
          fontSize: "0.75rem",
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        {isComplete
          ? "You've reached 100 claims — account upgraded! 🚀"
          : isAlmostThere
            ? `🔥 Almost there! ${MAX - totalClaims} more claim${MAX - totalClaims !== 1 ? "s" : ""} to unlock upgrade`
            : `Complete ${MAX - totalClaims} more task${MAX - totalClaims !== 1 ? "s" : ""} to unlock your account upgrade`}
      </p>
    </Card>
  );
};
// ────────────────────────────────────────────────────────────────────────────

interface ActiveTimer {
  taskId: number;
  userTaskId: string;
  startedAt: number;
  secondsRemaining: number;
}

const Tasks = () => {
  const navigate = useNavigate();
  const [claimedTasks, setClaimedTasks] = useState<Set<number>>(new Set());
  const [pendingVerification, setPendingVerification] = useState<Set<number>>(
    new Set(),
  );
  const [verifyingTasks, setVerifyingTasks] = useState<Set<number>>(new Set());
  const [totalClaims, setTotalClaims] = useState<number>(0);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const tasks = [
    {
      id: 1,
      title: "Join Telegram Channel",
      description: "Join our official Telegram channel for updates",
      reward: "₦5,000",
      link: "https://t.me/Nairox9janews",
    },
    {
      id: 2,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
    {
      id: 4,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
    {
      id: 6,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://www.effectivegatecpm.com/zrq0krqr7?key=6bbc08a6b74b2538ceb2703f68d77926",
    },
    {
      id: 3,
      title: "Join WhatsApp Community",
      description:
        "Join our WhatsApp channel for community updates and support",
      reward: "₦5,000",
      link: "https://whatsapp.com/channel/0029Vb7JLVT8F2p6NI4EMJ01",
    },
    {
      id: 5,
      title: "Daily Check-in",
      description: "Come back every day and claim your reward!",
      reward: "₦10,000",
    },
    {
      id: 7,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
    {
      id: 8,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
    {
      id: 9,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
    {
      id: 10,
      title: "Visit Sponsor Site",
      description: "Visit our sponsor site and complete the offer",
      reward: "₦3,000",
      link: "https://otieu.com/4/10572515",
    },
  ];

  // ── Total claim counter helpers ──────────────────────────────────────────
  const getTotalClaims = () => {
    const stored = localStorage.getItem("total_claims_count");
    return stored ? parseInt(stored, 10) : 0;
  };

  const incrementTotalClaims = () => {
    const current = getTotalClaims();
    const next = current + 1;
    localStorage.setItem("total_claims_count", String(next));
    setTotalClaims(next);
    return next;
  };
  // ────────────────────────────────────────────────────────────────────────

  // Check if task was claimed today
  const isTaskClaimedToday = (taskId: number) => {
    const lastClaim = localStorage.getItem(`task_${taskId}_claimed`);
    if (!lastClaim) return false;
    const today = new Date().toDateString();
    const lastClaimDate = new Date(lastClaim).toDateString();
    return today === lastClaimDate;
  };

  // Mark task as claimed for today
  const markTaskAsClaimed = (taskId: number) => {
    localStorage.setItem(`task_${taskId}_claimed`, new Date().toISOString());
  };

  // Load pending tasks & total claims from localStorage on mount
  useEffect(() => {
    const pending = new Set<number>();
    tasks.forEach((task) => {
      const pendingKey = `task_${task.id}_pending`;
      if (localStorage.getItem(pendingKey)) {
        pending.add(task.id);
      }
    });
    setPendingVerification(pending);
    setTotalClaims(getTotalClaims());

    // fetch current user's task_progress
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('task_progress, task_completed')
          .eq('id', user.id)
          .single();
        if (!error && profile) {
          setTaskProgress(profile.task_progress || 0);
          setTaskCompleted(!!profile.task_completed);
        }
      } catch (err) {
        console.warn('Could not load task progress', err);
      }
    })();
  }, []);

  // Fetch active timers from user_tasks table and update every second
  useEffect(() => {
    const fetchActiveTimers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all active tasks (status = 'verifying')
        const { data: activeTasks, error } = await supabase
          .from('user_tasks')
          .select('id, task_id, started_at')
          .eq('user_id', user.id)
          .eq('status', 'verifying')
          .gt('started_at', new Date(Date.now() - 15000).toISOString()); // Tasks started in last 15 seconds

        if (error) {
          console.warn('Could not fetch active timers:', error);
          return;
        }

        const timersMap = new Map<number, ActiveTimer>();
        const now = Date.now();

        activeTasks.forEach((task) => {
          const startedTime = new Date(task.started_at).getTime();
          const elapsedSeconds = (now - startedTime) / 1000;
          const remaining = Math.max(0, 10 - elapsedSeconds);

          timersMap.set(task.task_id, {
            id: task.id,
            taskId: task.task_id,
            startedAt: task.started_at,
            secondsRemaining: Math.ceil(remaining),
          });
        });

        setActiveTimers(timersMap);
      } catch (err) {
        console.error('Error fetching timers:', err);
      }
    };

    // Fetch immediately on mount
    fetchActiveTimers();

    // Then set interval to refetch every second (strict server-side accuracy)
    const interval = setInterval(fetchActiveTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown loop for active tasks
  useEffect(() => {
    if (activeTasks.size === 0) return;

    const interval = setInterval(() => {
      activeTasks.forEach((task) => {
        // If timer just expired, auto-verify
        if (task.secondsRemaining <= 0) {
          const taskDef = tasks.find((t) => t.id === task.taskId);
          if (taskDef) {
            handleVerify(task.id, taskDef);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTasks, tasks]);

  const handleClaim = async (task: any) => {
    if (isTaskClaimedToday(task.id)) {
      toast.error("Already claimed today! Come back tomorrow.");
      return;
    }

    setClaimedTasks((prev) => new Set(prev).add(task.id));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        return;
      }

      // Call /api/start-task to begin the 10-second timer
      const response = await fetch("/api/start-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, task_id: task.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start task");
      }

      const data = await response.json();
      toast.success("Task started! Waiting 10 seconds for verification...");

      // Refetch active tasks from DB so global banner updates
      await refetchActiveTasks();

      // Open link if provided
        const data = await response.json();
        toast.success("Task started! Waiting 10 seconds for verification...");
        // Timers will auto-update from DB every second via useEffect

        // Open link if provided
      if (task.link) {
          toast.success("Task started! Waiting 10 seconds for verification...");
          // Timers auto-update from DB every second via useEffect

          if (task.link) {
        window.open(task.link, "_blank");
      }
    } catch (error: any) {
      console.error("Error starting task:", error);
      toast.error(error.message || "Failed to start task");
    } finally {
      setClaimedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const handleVerify = async (userTaskId: string, task: any) => {
    setVerifyingTasks((prev) => new Set(prev).add(task.id));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setVerifyingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
      toast.error("Please login first");
      return;
    }

    try {
      // Call /api/verify-task to verify and get reward
      const response = await fetch("/api/verify-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_task_id: userTaskId, user_id: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify task");
      }

      const data = await response.json();
      const { success, reward_added, reward_amount, new_balance, new_task_progress } = data;

      if (!success) {
        throw new Error(data.message || "Task verification failed");
      }

      if (reward_added) {
        // Update local state with new balances
        markTaskAsClaimed(task.id);
        
        // Refetch active tasks to update global timer
        await refetchActiveTasks();

        // Mark as completed
        setCompletedTasks((prev) => new Set(prev).add(task.id));

        // Update task progress
        setTaskProgress(new_task_progress);
        if (new_task_progress >= 75000) setTaskCompleted(true);

        // Increment total claims counter
        const newTotal = incrementTotalClaims();

        // Check if just upgraded
        if (newTotal === 100) {
          await supabase
            .from("profiles")
            .update({ is_upgraded: true } as any)
            .eq("id", user.id);

          toast.success("🎉 ACCOUNT UPGRADED! You've reached 100 claims!", {
            duration: 6000,
          });
        } else {
          toast.success(`₦${reward_amount?.toLocaleString()} added to your balance!`);
        }
      } else {
        // Still verifying, show how long to wait
        const secondsWait = data.seconds_remaining || 10;
        toast.info(`Please wait ${secondsWait} more seconds...`);
      }
    } catch (error: any) {
      console.error("Error verifying task:", error);
      toast.error(error.message || "Failed to verify task");
    } finally {
      setVerifyingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen liquid-bg pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground hover:bg-background/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Daily Tasks</h1>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <Card className="bg-gradient-to-br from-card to-card/80 backdrop-blur-lg border-border/50 p-6">
          <h2 className="text-xl font-bold mb-2">Earn Extra Rewards</h2>
          <p className="text-sm text-muted-foreground">
            Complete tasks to earn bonus credits and boost your earnings
          </p>
        </Card>

        {/* ── Task Earnings Progress (current cycle) ── */}
        <TaskProgressBar progress={taskProgress} />

        {/* ── Claim Counter Visual ── */}
        <ClaimCounter totalClaims={totalClaims} />

        {tasks.map((task) => {
          const isClaimed = isTaskClaimedToday(task.id);
          const isProcessing = claimedTasks.has(task.id);
          const isPending = pendingVerification.has(task.id);
          const isVerifying = verifyingTasks.has(task.id);
          const isCompleted = completedTasks.has(task.id);
          
          // Find active timer from global hook by taskId
          const activeTimer = Array.from(activeTasks.values()).find(
            (t) => t.taskId === task.id,
          );
          const hasActiveTimer = !!activeTimer;

          return (
            <div key={task.id}>
              <Card className="bg-card/80 backdrop-blur-lg border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-primary">
                        {task.reward}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        reward
                      </span>
                      {hasActiveTimer && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full font-semibold">
                          ⏳ Verifying... {activeTimer?.secondsRemaining || 10}s
                        </span>
                      )}
                      {isCompleted && !hasActiveTimer && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          ✅ Verified
                        </span>
                      )}
                      {isClaimed && !isCompleted && !hasActiveTimer && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          ✓ Claimed Today
                        </span>
                      )}
                      {isProcessing && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                          Processing...
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (hasActiveTimer && activeTimer?.id) {
                        handleVerify(activeTimer.id, task);
                      } else {
                        handleClaim(task);
                      }
                    }}
                    disabled={isClaimed || isProcessing || isVerifying || isCompleted}
                    className={`px-6 py-3 font-bold whitespace-nowrap ${
                      isCompleted
                        ? "bg-green-500 cursor-not-allowed"
                        : isClaimed && !hasActiveTimer
                          ? "bg-gray-400 cursor-not-allowed"
                          : hasActiveTimer
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : isProcessing || isVerifying
                              ? "bg-blue-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    }`}
                  >
                    {isProcessing
                      ? "Processing..."
                      : isVerifying
                        ? `Verifying...`
                        : hasActiveTimer
                          ? `Complete & Verify`
                          : isCompleted
                            ? "✅ Completed"
                            : isClaimed
                              ? "Claimed Today"
                              : "Claim Now"}
                  </Button>
                </div>
              </Card>

              {task.id === 2 && (
                <Card className="bg-yellow-500/10 border-yellow-500/30 p-3 mt-2">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    ⚠️ <strong>Important:</strong> Allow the page to load
                    completely before closing to receive your full reward.
                  </p>
                </Card>
              )}
            </div>
          );
        })}

        <Card className="bg-muted/50 border-border/50 p-4">
          <p className="text-sm text-center text-muted-foreground">
            Tasks reset every day at midnight. Check back tomorrow for more
            rewards!
          </p>
        </Card>
      </div>

      <FloatingActionButton />
    </div>
  );
};

export default Tasks;

  // Auto-verify tasks when timer expires (10 seconds = 0)
  useEffect(() => {
    activeTimers.forEach((timer) => {
      if (timer.secondsRemaining === 0 && !verifyingTasks.has(timer.taskId)) {
        const task = tasks.find((t) => t.id === timer.taskId);
        if (task) {
          handleVerify(timer.id, task);
        }
      }
    });
  }, [activeTimers]);

  const [activeTimers, setActiveTimers] = useState<Map<number, ActiveTimer>>(new Map());
