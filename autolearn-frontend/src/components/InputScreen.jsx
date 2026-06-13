import { useState } from 'react';

const Field = ({ label, type = 'text', value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      onFocus={e => { e.target.style.borderColor = '#4f8ef7'; e.target.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.15)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

const platformMeta = {
  gforms:      { name: 'Google Forms',         color: '#4285F4' },
  quizizz:     { name: 'Quizizz',              color: '#8C52FF' },
  springboard: { name: 'Infosys Springboard',  color: '#00A86B' },
};

const InputScreen = ({ platform, onStart, onBack }) => {
  const [url, setUrl] = useState('');
  const [userInfo, setUserInfo] = useState({ name: '', email: '', roll: '', gmail: '', password: '' });
  const meta = platformMeta[platform] || {};
  const isGForms      = platform === 'gforms';
  const isSpringboard = platform === 'springboard';
  const canStart = url.trim().startsWith('http');

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-sm transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        ← Back
      </button>

      <div className="mb-2 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full inline-block"
        style={{ background: `${meta.color}22`, color: meta.color }}>
        {meta.name}
      </div>
      <h2 className="text-2xl font-extrabold text-white mt-3 mb-1">Configure automation</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Paste the URL and hit Start. The bot handles everything else.
      </p>

      <div className="flex flex-col gap-5 p-6 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Field label="Target URL *" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />

        {isGForms && (
          <>
            <Field label="Full Name" value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} placeholder="John Doe" />
            <Field label="Email Address" type="email" value={userInfo.email} onChange={e => setUserInfo({...userInfo, email: e.target.value})} placeholder="john@example.com" />
            <Field label="Roll Number" value={userInfo.roll} onChange={e => setUserInfo({...userInfo, roll: e.target.value})} placeholder="2023CS001" />
            <Field label="Google Account (Gmail)" type="email" value={userInfo.gmail} onChange={e => setUserInfo({...userInfo, gmail: e.target.value})} placeholder="john@gmail.com" />
            <Field label="Google Password" type="password" value={userInfo.password} onChange={e => setUserInfo({...userInfo, password: e.target.value})} placeholder="••••••••" />
          </>
        )}

        {isSpringboard && (
          <div className="flex gap-3 p-4 rounded-xl items-start"
            style={{ background: 'rgba(255,196,0,0.07)', border: '1px solid rgba(255,196,0,0.2)' }}>
            <span className="text-lg mt-0.5">⚠️</span>
            <p className="text-sm" style={{ color: '#f5c842' }}>
              A browser window will open the Springboard login page. Log in manually on the live stream — automation begins once login is detected.
            </p>
          </div>
        )}

        <button
          onClick={() => onStart(url, userInfo)}
          disabled={!canStart}
          className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200"
          style={{
            background:  canStart ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` : 'rgba(255,255,255,0.05)',
            color:       canStart ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor:      canStart ? 'pointer' : 'not-allowed',
            boxShadow:   canStart ? `0 4px 20px ${meta.color}44` : 'none',
          }}
        >
          {canStart ? '⚡ Start Automation' : 'Enter a valid URL to continue'}
        </button>
      </div>
    </div>
  );
};

export default InputScreen;
