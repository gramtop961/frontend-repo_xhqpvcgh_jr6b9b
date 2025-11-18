import React from 'react';
import { Home, Compass, PenSquare, Workflow, User, Plus } from 'lucide-react';
import { Button } from './DesignSystem';

export const BottomNav = ({ current, onChange, onFab }) => {
  const tabs = [
    { key: 'chats', icon: <Home size={22} />, label: 'Chats' },
    { key: 'discover', icon: <Compass size={22} />, label: 'Discover' },
    { key: 'creator', icon: <PenSquare size={22} />, label: 'Creator' },
    { key: 'automations', icon: <Workflow size={22} />, label: 'Automations' },
    { key: 'profile', icon: <User size={22} />, label: 'Profile' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md pb-4">
      <div className="relative">
        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <button onClick={onFab} className="rounded-full p-4 bg-[#E7E1F9] shadow-[0_10px_30px_rgba(131,114,225,0.35)] border border-black/10">
            <Plus />
          </button>
        </div>
        <div className="mx-4 rounded-3xl bg-white/80 backdrop-blur-sm border border-black/10 shadow-lg py-3 px-2 flex items-center justify-around">
          {tabs.map(t => (
            <button key={t.key} onClick={() => onChange(t.key)} className={`flex flex-col items-center gap-1 text-xs ${current === t.key ? 'text-black' : 'text-black/50'}`}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
