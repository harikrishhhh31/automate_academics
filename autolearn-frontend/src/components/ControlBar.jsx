const ControlBar = ({ onStop, onConfirm, requireConfirm }) => (
  <div
    className="w-full flex items-center justify-between px-6 py-4"
    style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}
  >
    <button
      onClick={onStop}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(239,68,68,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
      Stop
    </button>

    {requireConfirm && (
      <button
        onClick={onConfirm}
        className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#fff',
          boxShadow: '0 0 24px rgba(34,197,94,0.35)',
          animation: 'confirm-pulse 2s ease-in-out infinite',
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Confirm Submit
      </button>
    )}

    {!requireConfirm && (
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Confirm Submit will appear when automation is ready
      </span>
    )}
  </div>
);

export default ControlBar;
