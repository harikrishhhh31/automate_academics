import { useState, useRef, useEffect } from 'react';

const typeColors = {
  status: { text: '#4f8ef7', bg: 'rgba(79,142,247,0.08)' },
  log:    { text: '#a3a3a3', bg: 'transparent' },
  error:  { text: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
};

const typeIcons = {
  status: '›',
  log:    '·',
  error:  '✕',
};

const LogDrawer = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300"
      style={{ transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 44px))' }}
    >
      {/* Handle */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full h-11 flex items-center justify-between px-5 text-sm font-medium transition-colors"
        style={{
          background: 'rgba(18,18,24,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h12M3 18h8" />
          </svg>
          Session Logs
          {logs.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(79,142,247,0.2)', color: '#4f8ef7' }}>
              {logs.length}
            </span>
          )}
        </span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
          ▲
        </span>
      </button>

      {/* Log content */}
      <div
        className="h-60 overflow-y-auto"
        style={{ background: 'rgba(10,10,14,0.97)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
            No logs yet — start automation to see activity
          </div>
        ) : (
          <div className="p-4 space-y-0.5 font-mono text-xs">
            {logs.map((log, i) => {
              const c = typeColors[log.type] || typeColors.log;
              const icon = typeIcons[log.type] || '·';
              return (
                <div key={i} className="flex items-start gap-3 px-2 py-1.5 rounded-lg" style={{ background: c.bg }}>
                  <span className="shrink-0 w-4 text-center font-bold" style={{ color: c.text }}>{icon}</span>
                  <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{log.time}</span>
                  <span style={{ color: c.text }}>{log.text}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogDrawer;
