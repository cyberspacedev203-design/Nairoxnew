// Start a task timer for a user. Records the start time in the database.
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, task_id } = req.body || {};
  if (!user_id || task_id === undefined) return res.status(400).json({ error: 'Missing user_id or task_id' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const sbHeaders = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
    apikey: SUPABASE_SERVICE_ROLE,
  };

  try {
    const now = new Date().toISOString();

    // Check if there's already an active task within the last 15 seconds
    const listRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_tasks?user_id=eq.${user_id}&task_id=eq.${task_id}&status=eq.verifying&order=started_at.desc&limit=1`,
      {
        headers: sbHeaders,
      }
    );

    const existingTasks = await listRes.json();
    if (Array.isArray(existingTasks) && existingTasks.length > 0) {
      const lastTask = existingTasks[0];
      const startedAt = new Date(lastTask.started_at).getTime();
      const elapsed = (new Date(now).getTime() - startedAt) / 1000;

      // If less than 15 seconds have passed, return the existing task
      if (elapsed < 15) {
        const secondsRemaining = Math.max(0, 10 - elapsed);
        return res.status(200).json({
          success: true,
          message: 'Task already started',
          task_id: lastTask.id,
          started_at: lastTask.started_at,
          seconds_remaining: Math.ceil(secondsRemaining),
        });
      }
    }

    // Insert new task start record
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...sbHeaders,
      },
      body: JSON.stringify({
        user_id,
        task_id,
        started_at: now,
        status: 'verifying',
      }),
    });

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => '');
      console.error('Failed to insert user_task', insertRes.status, text);
      return res.status(502).json({ error: 'Failed to start task', details: text });
    }

    const records = await insertRes.json();
    console.log('Insert response records:', records);
    const taskRecord = Array.isArray(records) ? records[0] : records;

    if (!taskRecord) {
      console.error('No record returned from insert');
      return res.status(502).json({ error: 'No record returned from insert' });
    }

    console.log('Returning task record:', taskRecord);

    return res.status(200).json({
      success: true,
      task_id: taskRecord.id,
      started_at: taskRecord.started_at,
      seconds_remaining: 10,
    });
  } catch (err) {
    console.error('start-task error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
