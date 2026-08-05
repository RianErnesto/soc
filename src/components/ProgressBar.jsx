import React from 'react';

function ProgressBar({ value, max = 100, color, height = 8, showLabel, label }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = color || (percent >= 70 ? 'var(--accent-green)' : percent >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)');

  return (
    <div>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{label || ''}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{percent.toFixed(0)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: `${height}px`,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: barColor,
          borderRadius: '10px',
          transition: 'width 0.8s ease',
          boxShadow: `0 0 10px ${barColor}40`,
        }} />
      </div>
    </div>
  );
}

export default ProgressBar;