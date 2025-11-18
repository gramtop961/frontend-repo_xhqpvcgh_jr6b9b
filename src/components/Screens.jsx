import React, { useMemo, useState, useEffect } from 'react';
import { Card, Button, Input, SearchBar, Avatar, ListTile, SectionTitle, Chip, Tabs, Toggle, Modal, BottomSheet, LineChart, PastelDivider } from './DesignSystem';
import { Image, File, Mic, Camera, Smile, Pin, Clock, ArrowRight, ChevronRight, Settings, BarChart3, Users, Hash, Play, Zap } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  return res.json();
}

export const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState(null);

  const next = () => setStep(s => s + 1);

  const requestOtp = async () => {
    await api('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
    next();
  };

  const verifyOtp = async () => {
    const res = await api('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) });
    if (res.user_id) {
      setUserId(res.user_id);
      next();
    }
  };

  useEffect(() => {
    if (step === 3 && userId) {
      onDone({ userId });
    }
  }, [step, userId]);

  return (
    <div className="max-w-md mx-auto pb-32 pt-10 px-4">
      <Card className="p-6 text-center bg-gradient-to-b from-[#E7E1F9]/60 to-white">
        <div className="text-2xl font-semibold mb-2">Telegram 2.0</div>
        <div className="text-black/60 mb-6">A pastel, modern messaging + creator platform</div>
        {step === 0 && (
          <div className="space-y-4">
            <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
            <Button onClick={requestOtp} className="w-full">Send code</Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <Input placeholder="Enter 123456" value={code} onChange={e => setCode(e.target.value)} />
            <Button onClick={verifyOtp} className="w-full">Verify</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-black/60">Permissions</div>
            <div className="flex items-center justify-between">
              <span>Contacts</span>
              <Toggle checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span>Notifications</span>
              <Toggle checked={true} onChange={() => {}} />
            </div>
            <Button onClick={next} className="w-full">Continue</Button>
          </div>
        )}
        {step >= 3 && (
          <div className="space-y-4">
            <div className="text-black/60">You're in. Welcome!</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export const Chats = ({ user }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);

  const chatId = 'demo'; // simplified single chat demo id

  useEffect(() => {
    (async () => {
      const list = await api(`/api/chats/${chatId}/messages`);
      setMessages(list);
    })();
    const socket = new WebSocket(`${API.replace('http', 'ws')}/ws/chats/${chatId}`);
    socket.onmessage = (e) => {
      try { const d = JSON.parse(e.data); if (d.type === 'message') setMessages(m => [...m, d]); } catch {}
    };
    setWs(socket);
    return () => socket.close();
  }, []);

  const send = async () => {
    if (!input) return;
    await api(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ text: input }), headers: { 'X-User-Id': user?.userId || '' } });
    setInput('');
  };

  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4">
      <div className="mb-3"><SearchBar placeholder="Search chats" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <Card className="p-0">
        <div className="p-4 border-b border-black/5 flex items-center gap-3">
          <Avatar name="Demo" />
          <div>
            <div className="font-semibold">Smart Chat</div>
            <div className="text-xs text-black/50">AI summary: calm, focused conversation</div>
          </div>
        </div>
        <div className="p-4 space-y-2 min-h-[380px] bg-[#FFF]">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.sender_id ? 'bg-[#DFF5EC] ml-auto' : 'bg-[#E7E1F9]'}`}>
              <div className="text-sm">{m.text || m.content_text}</div>
            </div>
          ))}
        </div>
        <div className="p-3 flex items-center gap-2 border-t border-black/5 bg-white rounded-b-2xl">
          <button className="text-black/50"><Smile size={20} /></button>
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Message" />
          <button onClick={send} className="text-black/70"><ArrowRight /></button>
        </div>
      </Card>
    </div>
  );
};

export const Discover = () => {
  const cats = ['Tech', 'News', 'Business', 'Gaming', 'Design', 'AI'];
  const [active, setActive] = useState('Tech');
  const [channels, setChannels] = useState([]);
  useEffect(() => { (async () => { const data = await api('/api/channels'); setChannels(data); })(); }, []);
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {cats.map(c => <Chip key={c} active={c===active} onClick={() => setActive(c)}>{c}</Chip>)}
      </div>
      <div className="mt-4 space-y-3">
        {channels.map(ch => (
          <Card key={ch._id} className="p-4 flex items-center gap-3">
            <Avatar name={ch.title} />
            <div className="flex-1">
              <div className="font-medium">{ch.title}</div>
              <div className="text-sm text-black/60">{ch.description}</div>
            </div>
            <Button variant="secondary">Join</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Creator = () => {
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4 space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Audience Growth</div>
            <div className="text-xs text-black/60">Last 7 days</div>
          </div>
          <BarChart3 className="text-black/40" />
        </div>
        <div className="mt-2"><LineChart data={[2,4,3,6,8,7,10]} /></div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Scheduled Posts</div>
        <ListTile title="How to build pastel UIs" subtitle="Tomorrow 10:00" trailing={<ChevronRight />} />
        <ListTile title="Creator income report" subtitle="Fri 14:00" trailing={<ChevronRight />} />
      </Card>
      <Card>
        <div className="font-semibold mb-2">Earnings</div>
        <div className="text-2xl font-bold">$2,430</div>
        <div className="text-xs text-black/60">This month</div>
      </Card>
    </div>
  );
};

export const Automations = () => {
  const [logs, setLogs] = useState([]);
  const run = async () => {
    const payload = {
      nodes: [
        { id: 'n1', type: 'trigger', config: { name: 'New Subscriber' } },
        { id: 'n2', type: 'condition', config: { expr: 'ctx.amount > 10' } },
        { id: 'n3', type: 'action', config: { name: 'send_message', text: 'Welcome!' } },
      ],
      edges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }],
      payload: { amount: 15 }
    };
    const res = await api('/api/automation/execute', { method: 'POST', body: JSON.stringify(payload) });
    setLogs(res.logs || []);
  };
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4 space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Automation Builder</div>
          <Zap className="text-black/40" />
        </div>
        <div className="text-sm text-black/60">Simulated nodes and execution. Press Test Flow to see logs.</div>
        <div className="mt-3"><Button onClick={run}>Test Flow</Button></div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Logs</div>
        <div className="text-xs text-black/70 space-y-1">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </Card>
    </div>
  );
};

export const Profile = () => {
  const [privacy, setPrivacy] = useState(false);
  const [creator, setCreator] = useState(true);
  const [notif, setNotif] = useState(true);
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4 space-y-4">
      <Card className="flex items-center gap-4">
        <Avatar name="You" size={56} />
        <div className="flex-1">
          <div className="font-semibold">Alex Morgan</div>
          <div className="text-sm text-black/60">@alex</div>
        </div>
        <Settings className="text-black/40" />
      </Card>
      <Card>
        <SectionTitle>Preferences</SectionTitle>
        <div className="space-y-3">
          <Toggle checked={privacy} onChange={setPrivacy} label="Privacy Mode" />
          <Toggle checked={creator} onChange={setCreator} label="Creator Mode" />
          <Toggle checked={notif} onChange={setNotif} label="Notifications" />
        </div>
      </Card>
      <Card>
        <SectionTitle>About</SectionTitle>
        <div className="text-sm text-black/60">Soft, modern, pastel fintech aesthetic. Built for creators and communities.</div>
      </Card>
    </div>
  );
};
