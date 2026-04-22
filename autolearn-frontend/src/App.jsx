import { useState } from 'react';
import PlatformSelect from './components/PlatformSelect';
import InputScreen from './components/InputScreen';
import LiveStream from './components/LiveStream';
import StatusBar from './components/StatusBar';
import ControlBar from './components/ControlBar';
import LogDrawer from './components/LogDrawer';
import { useAutoLearn } from './hooks/useAutoLearn';

// ─── Hero landing screen ──────────────────────────────────────────────────────
const Hero = ({ onBegin }) => (
  <div className="flex flex-col items-center justify-center text-center px-4 py-20 w-full max-w-3xl mx-auto">
    {/* Glow orb behind heading */}
    <div className="relative mb-8">
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #4f8ef7 0%, transparent 70%)', transform: 'scale(2)' }}
      />
      <div className="relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-6"
        style={{ background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)', color: '#4f8ef7' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        Fully Autonomous · Zero Manual Input
      </div>
    </div>

    <h1 className="text-5xl md:text-7xl font-black mb-5 leading-tight">
      <span className="text-white">Auto</span>
      <span style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Learn
      </span>
    </h1>

    <p className="text-lg md:text-xl mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
      Drop a URL. Watch it run. Press Submit.
    </p>
    <p className="text-sm max-w-md mb-12" style={{ color: 'rgba(255,255,255,0.35)' }}>
      AutoLearn autonomously navigates, fills, and completes online quizzes and courses —
      no clicks required from you after Start.
    </p>

    {/* Feature pills */}
    <div className="flex flex-wrap justify-center gap-2 mb-12">
      {['Google Forms', 'Quizizz', 'Infosys Springboard', 'Live Screen Stream', 'Human-like Delays', 'Manual Submit Gate'].map(f => (
        <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {f}
        </span>
      ))}
    </div>

    <button
      onClick={onBegin}
      className="px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(79,142,247,0.35)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(79,142,247,0.45)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,142,247,0.35)'; }}
    >
      Get Started →
    </button>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('hero'); // 'hero' | 'select' | 'input' | 'running'
  const [platform, setPlatform] = useState(null);

  const {
    status, logs, image,
    requireConfirmation,
    startAutomation, stopAutomation, confirmSubmit,
  } = useAutoLearn('ws://localhost:3001');

  const handlePlatformSelect = (p) => {
    setPlatform(p);
    setScreen('input');
  };

  const handleStart = (url, userInfo) => {
    setScreen('running');
    startAutomation(platform, url, userInfo);
  };

  const handleStop = () => {
    stopAutomation();
    setScreen('hero');
    setPlatform(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-40"
        style={{ background: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={() => { if (screen !== 'running') setScreen('hero'); }}
          className="text-2xl font-black tracking-tight text-white transition-opacity"
          style={{ opacity: screen === 'running' ? 0.6 : 1 }}
        >
          Auto<span style={{ background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Learn</span>
        </button>

        <div className="flex items-center gap-3">
          {screen === 'running' && (
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
            v1.0
          </span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-grow flex flex-col items-center" style={{ paddingBottom: screen === 'running' ? '48px' : '0' }}>

        {screen === 'hero' && <Hero onBegin={() => setScreen('select')} />}

        {screen === 'select' && (
          <PlatformSelect onSelect={handlePlatformSelect} />
        )}

        {screen === 'input' && (
          <InputScreen
            platform={platform}
            onStart={handleStart}
            onBack={() => setScreen('select')}
          />
        )}

        {screen === 'running' && (
          <div className="w-full flex flex-col flex-grow">
            <StatusBar status={status} />

            <div className="flex-grow flex items-start justify-center p-4 md:p-8">
              <LiveStream imageSrc={image} />
            </div>

            <ControlBar
              onStop={handleStop}
              onConfirm={confirmSubmit}
              requireConfirm={requireConfirmation}
            />
          </div>
        )}
      </main>

      {/* ── Session log drawer (only while running) ── */}
      {screen === 'running' && <LogDrawer logs={logs} />}

      {/* Global animation for confirm button pulse */}
      <style>{`
        @keyframes confirm-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(34,197,94,0.35); }
          50%       { box-shadow: 0 0 40px rgba(34,197,94,0.6); }
        }
      `}</style>
    </div>
  );
}

export default App;
