import React, { createContext, useContext } from 'react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const colors = {
  primary: '#E7E1F9', // lavender
  secondary: '#DFF5EC', // mint
  accent: '#F5DDE4', // rose
  cream: '#FAF9F7',
  text: '#1A1A1A',
  mutedBlack: '#111111',
};

export function ThemeProvider({ children }) {
  const theme = { colors };
  return (
    <ThemeContext.Provider value={theme}>
      <div className="min-h-screen bg-[#FAF9F7] text-[#1A1A1A] font-inter">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const Card = ({ className = '', children }) => (
  <div className={clsx('rounded-2xl bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/[0.04] p-4', className)}>
    {children}
  </div>
);

export const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#E7E1F9] text-[#1A1A1A] hover:shadow-lg focus:ring-[#E7E1F9] shadow-[0_6px_20px_rgba(131,114,225,0.35)]',
    secondary: 'bg-[#DFF5EC] text-[#1A1A1A] hover:shadow-lg focus:ring-[#DFF5EC] shadow-[0_6px_20px_rgba(90,196,172,0.25)]',
    ghost: 'bg-transparent border border-black/10 hover:bg-black/[0.03] focus:ring-black/10',
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ className = '', ...props }) => (
  <input className={clsx('w-full rounded-xl bg-white/70 border border-black/10 px-4 py-3 placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-[#E7E1F9]', className)} {...props} />
);

export const SearchBar = (props) => (
  <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-black/10 px-3 py-2">
    <span className="text-black/40">🔎</span>
    <input className="w-full bg-transparent outline-none placeholder-black/40" {...props} />
  </div>
);

export const Chip = ({ active, children, onClick }) => (
  <button onClick={onClick} className={clsx('px-4 py-2 rounded-full text-sm transition shadow-sm', active ? 'bg-[#DFF5EC] text-black' : 'bg-white/70 border border-black/10 text-black/70 hover:bg-white')}>{children}</button>
);

export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div className={clsx('w-11 h-6 rounded-full p-0.5 transition', checked ? 'bg-[#E7E1F9]' : 'bg-black/10')}>
      <div className={clsx('h-5 w-5 rounded-full bg-white shadow transition transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </div>
    {label && <span className="text-sm text-black/70">{label}</span>}
    <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange?.(e.target.checked)} />
  </label>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex items-center gap-2 bg-white/60 p-1 rounded-xl border border-black/10">
    {tabs.map(t => (
      <button key={t} onClick={() => onChange?.(t)} className={clsx('px-4 py-2 rounded-lg text-sm', active === t ? 'bg-[#E7E1F9]' : 'text-black/60')}>
        {t}
      </button>
    ))}
  </div>
);

export const Avatar = ({ src, name, size = 40 }) => {
  const initials = (name || 'T 2').split(' ').map(n => n[0]).slice(0, 2).join('');
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-2xl bg-[#F5DDE4] border border-black/10 overflow-hidden">
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span className="text-sm font-semibold text-[#1A1A1A]">{initials}</span>}
    </div>
  );
};

export const ListTile = ({ title, subtitle, trailing, leading, onClick }) => (
  <button onClick={onClick} className="w-full text-left flex items-center gap-3 p-3 rounded-2xl hover:bg-black/[0.03] transition">
    {leading}
    <div className="flex-1">
      <div className="font-medium">{title}</div>
      {subtitle && <div className="text-sm text-black/60">{subtitle}</div>}
    </div>
    {trailing}
  </button>
);

export const SectionTitle = ({ children }) => (
  <div className="text-sm uppercase tracking-wide text-black/50 mb-2">{children}</div>
);

export const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:w-[520px] bg-white rounded-3xl p-6 shadow-2xl m-4">
        {children}
      </div>
    </div>
  );
};

export const BottomSheet = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export const LineChart = ({ data = [] }) => {
  // very simple SVG chart
  const w = 280; const h = 80; const pad = 8;
  const max = Math.max(1, ...data);
  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E7E1F9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F5DDE4" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="url(#grad)" strokeWidth="3" points={points} strokeLinecap="round" />
    </svg>
  );
};

export const PastelDivider = () => <div className="h-px bg-gradient-to-r from-[#E7E1F9] via-[#DFF5EC] to-[#F5DDE4]" />;

export default ThemeProvider;
