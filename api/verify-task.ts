import type { VercelRequest, VercelResponse } from '@vercel/node';

// Verify and complete a started task. Auto-awards the reward if 10+ seconds have passed.
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_task_id, user_id } = req.body || {};
  if (!user_task_id || !user_id) return res.status(400).json({ error: 'Missing user_task_id or user_id' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  try {
    // Fetch the user_task record
    const taskRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_tasks?id=eq.${user_task_id}&user_id=eq.${user_id}&select=*`,
      {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
      }
    );

    if (!taskRes.ok) {
      const text = await taskRes.text().catch(() => '');
      console.error('Failed to fetch user_task', taskRes.status, text);
      return res.status(502).json({ error: 'Task not found' });
    }

    const tasks = await taskRes.json();
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(404).json({ error: 'Task record not found' });
    }

    const userTask = tasks[0];

    // Check if already completed
    if (userTask.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Task already completed', reward_added: false });
    }

    // Check if more than 10 seconds have passed
    const startedAt = new Date(userTask.started_at).getTime();
    const nowMs = new Date().getTime();
    const elapsedSeconds = (nowMs - startedAt) / 1000;

    if (elapsedSeconds < 10) {
      const secondsRemaining = Math.ceil(10 - elapsedSeconds);
      return res.status(200).json({
        success: false,
        message: 'Task verification in progress',
        seconds_remaining: secondsRemaining,
      });
    }

    // Calculate reward based on task_id
    let rewardAmount = 0;
    const taskId = userTask.task_id;

    if (taskId === 1 || taskId === 3) rewardAmount = 5000; // Join channel tasks
    if (taskId === 2 || taskId === 4 || taskId === 6 || taskId === 7 || taskId === 8 || taskId === 9 || taskId === 10) {
      rewardAmount = 3000; // Sponsor tasks (reduced)
    }
    if (taskId === 5) rewardAmount = 10000; // Daily check-in

    // Fetch current profile
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=balance,task_progress`,
      {
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}` },
      }
    );

    if (!profileRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch profile' });
    }

    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profiles[0];
    const currentBalance = Number(profile.balance) || 0;
    const currentTaskProgress = Number(profile.task_progress) || 0;

    const newBalance = currentBalance + rewardAmount;
    const newTaskProgress = currentTaskProgress + rewardAmount;
    const taskCompleted = newTaskProgress >= 75000;

    // Update profile with new balance and task progress
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        balance: newBalance,
        task_progress: newTaskProgress,
        task_completed: taskCompleted,
      }),
    });

    if (!updateRes.ok) {
      const text = await updateRes.text().catch(() => '');
      console.error('Failed to update profile', updateRes.status, text);
      return res.status(502).json({ error: 'Failed to update balance' });
    }

    // Mark user_task as completed
    const completeRes = await fetch(`${SUPABASE_URL}/rest/v1/user_tasks?id=eq.${user_task_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        status: 'completed',
        verified_at: new Date().toISOString(),
        reward_amount: rewardAmount,
      }),
    });

    if (!completeRes.ok) {
      console.warn('Failed to mark task as completed, but reward was awarded');
    }

    return res.status(200).json({
      success: true,
      reward_added: true,
      reward_amount: rewardAmount,
      new_balance: newBalance,
      new_task_progress: newTaskProgress,
    });
  } catch (err) {
    console.error('verify-task error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
