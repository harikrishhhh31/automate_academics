const StatusBar = ({ status }) => (
  <div
    className="w-full flex items-center gap-3 px-5 py-3"
    style={{ background: 'rgba(79,142,247,0.06)', borderBottom: '1px solid rgba(79,142,247,0.12)' }}
  >
    {/* Spinner dot */}
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: '#4f8ef7' }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ background: '#4f8ef7' }} />
    </span>
    <p
      className="text-sm font-mono truncate"
      style={{ color: 'rgba(255,255,255,0.75)' }}
    >
      {status || 'Idle — waiting for automation to start'}
    </p>
  </div>
);

export default StatusBar;
