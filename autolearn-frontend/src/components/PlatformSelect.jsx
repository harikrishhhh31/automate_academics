const platforms = [
  {
    id: 'gforms',
    name: 'Google Forms',
    tagline: 'Fill & submit forms automatically',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#4285F4" fillOpacity="0.15"/>
        <path d="M14 12h14l8 8v18a2 2 0 01-2 2H14a2 2 0 01-2-2V14a2 2 0 012-2z" stroke="#4285F4" strokeWidth="2" fill="none"/>
        <path d="M28 12v8h8" stroke="#4285F4" strokeWidth="2"/>
        <path d="M18 28h12M18 22h8" stroke="#4285F4" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    accent: '#4285F4',
    glow: 'rgba(66,133,244,0.25)',
  },
  {
    id: 'quizizz',
    name: 'Quizizz',
    tagline: 'Answer quiz questions intelligently',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#8C52FF" fillOpacity="0.15"/>
        <circle cx="24" cy="24" r="12" stroke="#8C52FF" strokeWidth="2"/>
        <path d="M20 20c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2-1.5 3.5-3.5 4v2" stroke="#8C52FF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="33" r="1.5" fill="#8C52FF"/>
      </svg>
    ),
    accent: '#8C52FF',
    glow: 'rgba(140,82,255,0.25)',
  },
  {
    id: 'springboard',
    name: 'Infosys Springboard',
    tagline: 'Auto-complete video modules & assessments',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#00A86B" fillOpacity="0.15"/>
        <rect x="10" y="14" width="28" height="20" rx="3" stroke="#00A86B" strokeWidth="2"/>
        <path d="M21 20l7 4-7 4V20z" fill="#00A86B"/>
        <path d="M16 38h16" stroke="#00A86B" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    accent: '#00A86B',
    glow: 'rgba(0,168,107,0.25)',
  },
];

const PlatformCard = ({ platform, onSelect }) => (
  <button
    onClick={() => onSelect(platform.id)}
    className="group relative flex flex-col gap-4 p-7 rounded-2xl border text-left transition-all duration-300"
    style={{
      background: 'rgba(255,255,255,0.03)',
      borderColor: 'rgba(255,255,255,0.08)',
      boxShadow: 'none',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = platform.accent;
      e.currentTarget.style.boxShadow = `0 0 32px ${platform.glow}, 0 4px 24px rgba(0,0,0,0.4)`;
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.background = `rgba(255,255,255,0.05)`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
    }}
  >
    {platform.icon}
    <div>
      <h3 className="text-lg font-bold text-white mb-1">{platform.name}</h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{platform.tagline}</p>
    </div>
    <span className="text-xs font-semibold px-3 py-1 rounded-full self-start" style={{ background: `${platform.accent}22`, color: platform.accent }}>
      Select →
    </span>
  </button>
);

const PlatformSelect = ({ onSelect }) => (
  <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 py-12">
    <div className="mb-3 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7' }}>
      Step 1 of 2
    </div>
    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 text-center">
      Choose your platform
    </h2>
    <p className="text-center mb-10" style={{ color: 'var(--text-muted)' }}>
      AutoLearn will take full control. You only press Submit at the end.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {platforms.map(p => <PlatformCard key={p.id} platform={p} onSelect={onSelect} />)}
    </div>
  </div>
);

export default PlatformSelect;
