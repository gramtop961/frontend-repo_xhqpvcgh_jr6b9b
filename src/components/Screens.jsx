import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, Button, Input, SearchBar, Avatar, ListTile, SectionTitle, Chip, Tabs, Toggle, Modal, BottomSheet, LineChart, PastelDivider } from './DesignSystem';
import { Image, File, Mic, Camera, Smile, Pin, Clock, ArrowRight, ChevronRight, Settings, BarChart3, Users, Hash, Play, Zap, Reply, Heart, ThumbsUp, Laugh, PlusCircle, X, ArrowLeft } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  return res.json();
}

// Utility: fake waveform samples
const makeWave = (len = 42) => Array.from({ length: len }, () => Math.round(Math.random() * 100));
const Wave = ({ samples = [] }) => (
  <div className="flex items-end gap-[2px] h-8">
    {samples.map((v, i) => (
      <div key={i} style={{ height: `${8 + (v / 100) * 24}px` }} className="w-[2px] bg-black/40 rounded" />
    ))}
  </div>
);

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

const EmojiPicker = ({ onPick }) => {
  const emojis = ['👍','❤️','😂','🔥','🙏','🎉'];
  return (
    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-black/10 shadow">
      {emojis.map(e => (
        <button key={e} onClick={() => onPick(e)} className="text-lg">{e}</button>
      ))}
    </div>
  );
};

const AttachmentPreview = ({ a }) => {
  if (a.type === 'image') return <img src={a.url} className="max-h-40 rounded-xl" />;
  if (a.type === 'voice') return <div className="flex items-center gap-2"><Play size={16} className="text-black/60" /><Wave samples={a.wave || makeWave()} /></div>;
  return <div className="text-xs text-black/60">{a.type}</div>;
};

export const Chats = ({ user }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [recording, setRecording] = useState(false);
  const [thread, setThread] = useState(null); // root msg id
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [reactTarget, setReactTarget] = useState(null);

  const chatId = 'demo'; // simplified single chat demo id

  useEffect(() => {
    (async () => {
      const list = await api(`/api/chats/${chatId}/messages`);
      setMessages(list);
    })();
    const socket = new WebSocket(`${API.replace('http', 'ws')}/ws/chats/${chatId}`);
    socket.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'message') setMessages(m => [...m, d]);
        if (d.type === 'reaction') {
          setMessages(m => m.map(mm => mm._id === d.message_id || mm.message_id === d.message_id ? { ...mm, reactions: { ...(mm.reactions||{}), [d.emoji]: d.users } } : mm));
        }
      } catch {}
    };
    setWs(socket);
    return () => socket.close();
  }, []);

  const grouped = useMemo(() => {
    // cluster by sender and time window
    const out = [];
    let bucket = null;
    messages.forEach(m => {
      const isMine = m.sender_id === (user?.userId || '');
      const prev = bucket && bucket.isMine === isMine;
      if (!bucket || !prev) {
        bucket = { isMine, items: [] };
        out.push(bucket);
      }
      bucket.items.push(m);
    });
    return out;
  }, [messages, user]);

  const pickEmoji = async (emoji, msg) => {
    setReactTarget(null);
    const id = msg._id || msg.message_id;
    await api(`/api/messages/${id}/reactions`, { method: 'PATCH', body: JSON.stringify({ emoji, action: 'add' }), headers: { 'X-User-Id': user?.userId || '' } });
  };

  const openThread = async (msg) => {
    const root = msg.thread_root_id || msg._id || msg.message_id;
    setThread(root);
    const data = await api(`/api/chats/${chatId}/threads/${root}`);
    setThreadMsgs(data);
  };

  const send = async (override = {}) => {
    const body = { text: input, attachments: [], ...override };
    if (!body.text && (!body.attachments || body.attachments.length === 0)) return;
    await api(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify(body), headers: { 'X-User-Id': user?.userId || '' } });
    setInput('');
  };

  const sendVoice = async () => {
    setRecording(false);
    await send({ text: '', attachments: [{ type: 'voice', url: 'voice://demo', wave: makeWave() }] });
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
          {grouped.map((g, gi) => (
            <div key={gi} className={g.isMine ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
              {g.items.map((m, i) => (
                <div key={i} className={`max-w-[82%] mb-1 ${g.isMine ? 'ml-auto' : ''}`}>
                  <div className={`rounded-2xl px-3 py-2 ${g.isMine ? 'bg-[#DFF5EC]' : 'bg-[#E7E1F9]'}`} onClick={() => openThread(m)} onContextMenu={(e) => { e.preventDefault(); setReactTarget(m); }}>
                    {m.text && <div className="text-sm leading-snug">{m.text}</div>}
                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {m.attachments.map((a, idx) => <AttachmentPreview key={idx} a={a} />)}
                      </div>
                    )}
                  </div>
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {Object.entries(m.reactions).map(([em, users]) => (
                        <div key={em} className="text-xs bg-white border border-black/10 rounded-full px-2 py-0.5">{em} {users.length}</div>
                      ))}
                    </div>
                  )}
                  <button className="mt-1 text-xs text-black/50 flex items-center gap-1" onClick={() => openThread(m)}><Reply size={14}/> Reply</button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="p-3 flex items-center gap-2 border-t border-black/5 bg-white rounded-b-2xl relative">
          <button className="text-black/50" onClick={() => setDrawer(true)}><PlusCircle size={22} /></button>
          <button className="text-black/50"><Smile size={20} /></button>
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Message" />
          <button onClick={() => send()} className="text-black/70"><ArrowRight /></button>
        </div>
      </Card>

      {/* Reactions */}
      {reactTarget && (
        <div className="fixed inset-0 z-40" onClick={() => setReactTarget(null)}>
          <div className="absolute inset-0" />
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2"><EmojiPicker onPick={(e) => pickEmoji(e, reactTarget)} /></div>
        </div>
      )}

      {/* Media Drawer */}
      <BottomSheet open={drawer} onClose={() => setDrawer(false)}>
        <div className="grid grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2" onClick={() => { setDrawer(false); send({ attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600' }] }); }}>
            <div className="p-3 rounded-2xl bg-[#E7E1F9]"><Image /></div>
            <div className="text-xs">Image</div>
          </button>
          <button className="flex flex-col items-center gap-2" onClick={() => { setDrawer(false); send({ attachments: [{ type: 'file', url: 'file:///demo.pdf' }] }); }}>
            <div className="p-3 rounded-2xl bg-[#DFF5EC]"><File /></div>
            <div className="text-xs">File</div>
          </button>
          {!recording && (
            <button className="flex flex-col items-center gap-2" onClick={() => setRecording(true)}>
              <div className="p-3 rounded-2xl bg-[#F5DDE4]"><Mic /></div>
              <div className="text-xs">Voice</div>
            </button>
          )}
          <button className="flex flex-col items-center gap-2" onClick={() => { setDrawer(false); send({ attachments: [{ type: 'image', url: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600' }] }); }}>
            <div className="p-3 rounded-2xl bg-[#FAF9F7]"><Camera /></div>
            <div className="text-xs">Camera</div>
          </button>
        </div>
        {recording && (
          <div className="mt-4 p-3 rounded-2xl bg-[#FFF] border border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-3"><Mic className="text-black/60" /><Wave samples={makeWave(60)} /></div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setRecording(false)}>Cancel</Button>
              <Button onClick={sendVoice}>Send</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Thread Modal */}
      <Modal open={!!thread} onClose={() => setThread(null)}>
        <div className="flex items-center gap-2 mb-3"><ArrowLeft className="text-black/60" /><div className="font-semibold">Thread</div></div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {threadMsgs.map((m, i) => (
            <div key={i} className={`max-w-[82%] ${m.sender_id===user?.userId?'ml-auto':''}`}>
              <div className={`rounded-2xl px-3 py-2 ${m.sender_id===user?.userId?'bg-[#DFF5EC]':'bg-[#E7E1F9]'}`}>
                {m.text && <div className="text-sm">{m.text}</div>}
                {Array.isArray(m.attachments) && m.attachments.length>0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">{m.attachments.map((a, idx) => <AttachmentPreview key={idx} a={a} />)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="Reply" onKeyDown={async (e)=>{ if(e.key==='Enter'){ const txt=e.currentTarget.value; e.currentTarget.value=''; await send({ text: txt, thread_root_id: thread }); const data = await api(`/api/chats/${chatId}/threads/${thread}`); setThreadMsgs(data);} }} />
          <Button onClick={async ()=>{ const el=document.getElementById('thread-input'); }}>Send</Button>
        </div>
      </Modal>
    </div>
  );
};

export const Discover = () => {
  const cats = ['Tech', 'News', 'Business', 'Gaming', 'Design', 'AI'];
  const [active, setActive] = useState('Tech');
  const [channels, setChannels] = useState([]);
  useEffect(() => { (async () => { const data = await api(`/api/channels${active?`?tag=${encodeURIComponent(active)}`:''}`); setChannels(data); })(); }, [active]);
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {cats.map(c => <Chip key={c} active={c===active} onClick={() => setActive(c)}>{c}</Chip>)}
      </div>
      <div className="mt-4 space-y-3">
        <SectionTitle>Trending</SectionTitle>
        {channels.slice(0,3).map(ch => (
          <Card key={ch._id} className="p-4 flex items-center gap-3 bg-gradient-to-r from-[#E7E1F9]/40 to-[#F5DDE4]/40">
            <Avatar name={ch.title} />
            <div className="flex-1">
              <div className="font-medium">{ch.title}</div>
              <div className="text-sm text-black/60">{ch.description}</div>
            </div>
            <Button variant="secondary">Join</Button>
          </Card>
        ))}
        <SectionTitle>All</SectionTitle>
        {channels.map(ch => (
          <Card key={ch._id} className="p-4 flex items-center gap-3">
            <Avatar name={ch.title} />
            <div className="flex-1">
              <div className="font-medium">{ch.title}</div>
              <div className="text-sm text-black/60">{ch.description}</div>
            </div>
            <Button variant="ghost">Preview</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Creator = ({ onOpenPostEditor, onOpenStoryBuilder }) => {
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
        <div className="font-semibold mb-3">Create</div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onOpenPostEditor}>New Post</Button>
          <Button variant="secondary" onClick={onOpenStoryBuilder}>New Story</Button>
        </div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Earnings</div>
        <div className="text-2xl font-bold">$2,430</div>
        <div className="text-xs text-black/60">This month</div>
      </Card>
    </div>
  );
};

export const PostEditor = ({ user, onClose }) => {
  const [text, setText] = useState('Soft pastel UI tips...');
  const [when, setWhen] = useState('');
  const [preview, setPreview] = useState(true);
  const save = async () => {
    // for demo, create a channel if none and post
    const channels = await api('/api/channels');
    let ch = channels[0];
    if (!ch) {
      const c = await api('/api/channels', { method: 'POST', body: JSON.stringify({ title: 'My Channel', description: 'Creator updates', tags: ['Design'] }), headers: { 'X-User-Id': user?.userId || '' } });
      ch = { _id: c.channel_id };
    }
    const scheduled_at = when ? new Date(when).toISOString() : null;
    await api(`/api/channels/${ch._id}/posts`, { method: 'POST', body: JSON.stringify({ content_text: text, media: [], scheduled_at }), headers: { 'X-User-Id': user?.userId || '' } });
    onClose?.();
  };
  return (
    <Modal open={true} onClose={onClose}>
      <div className="space-y-3">
        <div className="font-semibold">New Post</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} className="w-full rounded-xl border border-black/10 p-3" placeholder="Write something..." />
        <div className="flex items-center gap-2">
          <input type="datetime-local" className="border rounded-lg px-3 py-2" value={when} onChange={e=>setWhen(e.target.value)} />
          <span className="text-sm text-black/60">Schedule (optional)</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-black/60">Inline Preview</div>
          <Toggle checked={preview} onChange={setPreview} />
        </div>
        {preview && (
          <Card className="p-4 bg-gradient-to-r from-[#E7E1F9]/40 to-[#DFF5EC]/40">
            <div className="text-sm whitespace-pre-wrap">{text}</div>
          </Card>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Publish</Button>
        </div>
      </div>
    </Modal>
  );
};

export const StoryBuilder = ({ user, onClose }) => {
  const [bg, setBg] = useState('#FAF9F7');
  const [text, setText] = useState('Hello, pastel world');
  const save = async () => {
    await api('/api/stories', { method: 'POST', body: JSON.stringify({ background: bg, text }), headers: { 'X-User-Id': user?.userId || '' } });
    onClose?.();
  };
  return (
    <Modal open={true} onClose={onClose}>
      <div className="space-y-3">
        <div className="font-semibold">Story Builder</div>
        <div className="rounded-3xl h-64 flex items-center justify-center" style={{ background: bg }}>
          <div className="text-xl font-semibold" style={{ color: '#1A1A1A' }}>{text}</div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {['#FAF9F7','#E7E1F9','#DFF5EC','#F5DDE4','#FFFFFF'].map(c => (
            <button key={c} onClick={()=>setBg(c)} style={{ background: c }} className="h-8 rounded-xl border border-black/10" />
          ))}
        </div>
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Text" />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Publish</Button>
        </div>
      </div>
    </Modal>
  );
};

export const Automations = ({ onOpenBuilder }) => {
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
        <div className="mt-3 flex gap-2"><Button onClick={run}>Test Flow</Button><Button variant="secondary" onClick={onOpenBuilder}>Open Canvas</Button></div>
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

export const AutomationCanvas = ({ onClose }) => {
  const [nodes, setNodes] = useState([
    { id: 't1', type: 'trigger', x: 40, y: 40, label: 'Trigger' },
    { id: 'c1', type: 'condition', x: 180, y: 160, label: 'Condition' },
    { id: 'a1', type: 'action', x: 320, y: 280, label: 'Action' },
  ]);
  const [edges, setEdges] = useState([{ from: 't1', to: 'c1' }, { from: 'c1', to: 'a1' }]);
  const [drag, setDrag] = useState(null);
  const ref = useRef(null);

  const onDown = (e, id) => {
    setDrag({ id, ox: e.clientX, oy: e.clientY });
  };
  const onMove = (e) => {
    if (!drag) return;
    setNodes(ns => ns.map(n => n.id === drag.id ? { ...n, x: n.x + (e.clientX - drag.ox), y: n.y + (e.clientY - drag.oy) } : n));
    setDrag({ ...drag, ox: e.clientX, oy: e.clientY });
  };
  const onUp = () => setDrag(null);

  return (
    <Modal open={true} onClose={onClose}>
      <div className="font-semibold mb-2">Automation Canvas</div>
      <div ref={ref} onMouseMove={onMove} onMouseUp={onUp} className="relative h-96 rounded-2xl bg-[linear-gradient(0deg,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"><
        svg className="absolute inset-0 w-full h-full">
          {edges.map((e, i) => {
            const a = nodes.find(n => n.id === e.from);
            const b = nodes.find(n => n.id === e.to);
            if (!a || !b) return null;
            const d = `M ${a.x+80} ${a.y+24} C ${a.x+160} ${a.y+24}, ${b.x-80} ${b.y+24}, ${b.x} ${b.y+24}`;
            return <path key={i} d={d} stroke="#E7E1F9" strokeWidth="3" fill="none" />;
          })}
        </svg>
        {nodes.map(n => (
          <div key={n.id} onMouseDown={(e)=>onDown(e,n.id)} className={`absolute w-40 rounded-2xl p-3 border shadow bg-white select-none cursor-move`} style={{ left: n.x, top: n.y }}>
            <div className="text-xs uppercase tracking-wide text-black/50">{n.type}</div>
            <div className="font-semibold">{n.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end"><Button onClick={onClose}>Done</Button></div>
    </Modal>
  );
};

export const MiniApps = ({ onOpen }) => {
  const [apps, setApps] = useState([]);
  useEffect(()=>{ (async ()=>{ setApps(await api('/api/miniapps')); })(); },[]);
  return (
    <div className="max-w-md mx-auto pb-32 pt-6 px-4">
      <SectionTitle>Mini-apps</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {apps.map(a => (
          <Card key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-xs text-black/60">{a.pages.length} pages</div>
            </div>
            <Button onClick={()=>onOpen(a)}>Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const MiniAppContainer = ({ app, onClose }) => {
  const [page, setPage] = useState(app.pages[0]);
  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{app.name}</div>
        <button onClick={onClose}><X /></button>
      </div>
      <Card className="h-72 flex items-center justify-center">{page} page</Card>
      <div className="mt-3 flex items-center justify-around">
        {app.pages.map(p => <button key={p} onClick={()=>setPage(p)} className={`px-3 py-1 rounded-lg ${p===page?'bg-[#E7E1F9]':''}`}>{p}</button>)}
      </div>
    </Modal>
  );
};

export const Profile = ({ onOpenSettings }) => {
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
        <button onClick={onOpenSettings}><Settings className="text-black/40" /></button>
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

export const SettingsPages = ({ onClose }) => {
  const [tab, setTab] = useState('Devices');
  const pages = ['Devices','Storage','Security','Appearance'];
  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Settings</div>
        <Tabs tabs={pages} active={tab} onChange={setTab} />
      </div>
      {tab==='Devices' && (
        <div className="space-y-2 text-sm">
          <ListTile title="iPhone 15 Pro" subtitle="Active now" />
          <ListTile title="MacBook Pro" subtitle="Last seen 2h ago" />
        </div>
      )}
      {tab==='Storage' && (
        <div className="space-y-3">
          <SectionTitle>Usage</SectionTitle>
          <Card><div className="text-sm">Media cache: 124 MB</div></Card>
          <Button variant="secondary">Clear Cache</Button>
        </div>
      )}
      {tab==='Security' && (
        <div className="space-y-3">
          <Toggle checked={true} onChange={()=>{}} label="Two-factor authentication" />
          <Toggle checked={true} onChange={()=>{}} label="Biometrics" />
        </div>
      )}
      {tab==='Appearance' && (
        <div className="space-y-3">
          <SectionTitle>Themes</SectionTitle>
          <div className="flex gap-2">
            <button className="w-16 h-10 rounded-xl bg-[#FAF9F7] border" />
            <button className="w-16 h-10 rounded-xl bg-[#E7E1F9] border" />
            <button className="w-16 h-10 rounded-xl bg-[#111111] border" />
          </div>
        </div>
      )}
    </Modal>
  );
};
