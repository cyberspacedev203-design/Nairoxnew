import React, { useEffect, useState } from 'react';

type Props = {
  endsAt: string | null; // ISO timestamp
  onComplete?: () => void;
};

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hours}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
};

export default function CountdownTimer({ endsAt, onComplete }: Props) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!endsAt) return 0;
    return Math.max(0, new Date(endsAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const rem = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setRemaining(rem);
      if (rem <= 0 && onComplete) onComplete();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;
  if (remaining <= 0) return <div className="text-sm text-muted-foreground">Countdown completed</div>;

  return (
    <div className="inline-flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-md">
      <div className="text-sm font-semibold">Withdrawal Processing:</div>
      <div className="text-sm text-primary font-mono">{formatRemaining(remaining)}</div>
    </div>
  );
}
