const LiveStream = ({ imageSrc }) => {
  return (
    <div
      className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden relative"
      style={{
        background: '#000',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        aspectRatio: '16/9',
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          className="w-full h-full object-contain"
          alt="Live browser stream"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(79,142,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Pulse rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full animate-ping opacity-20"
              style={{ background: '#4f8ef7' }} />
            <div className="absolute w-12 h-12 rounded-full opacity-30"
              style={{ background: 'rgba(79,142,247,0.3)' }} />
            <svg className="relative w-8 h-8" fill="none" stroke="#4f8ef7" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="relative text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Waiting for browser stream...
          </p>
        </div>
      )}

      {/* Live badge overlay */}
      {imageSrc && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#ef4444', backdropFilter: 'blur(8px)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          LIVE
        </div>
      )}
    </div>
  );
};

export default LiveStream;
