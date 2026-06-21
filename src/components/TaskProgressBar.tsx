import React from 'react';

type Props = {
  progress: number; // in currency (e.g., 10000)
  target?: number; // default 75000
};

const formatCurrency = (n: number) => `₦${n.toLocaleString()}`;

export const TaskProgressBar: React.FC<Props> = ({ progress, target = 75000 }) => {
  const pct = Math.max(0, Math.min(100, Math.round((progress / target) * 100)));
  const completed = progress >= target;

  return (
    <div style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6eef8' }}>Task Earnings Progress</div>
        <div style={{ fontSize: 13, color: completed ? '#bbf7d0' : '#94a3b8', fontWeight: 700 }}>{formatCurrency(progress)} / {formatCurrency(target)}</div>
      </div>

      <div style={{ height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)', background: completed ? 'linear-gradient(90deg, #12b886, #16a34a)' : 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{pct}%</div>
        {completed && <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 700 }}>Target reached ✅</div>}
      </div>
    </div>
  );
};

export default TaskProgressBar;
