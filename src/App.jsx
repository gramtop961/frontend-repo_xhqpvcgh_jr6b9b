import React, { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { ThemeProvider } from './components/DesignSystem'
import { BottomNav } from './components/Navigation'
import { Onboarding, Chats, Discover, Creator, Automations, Profile } from './components/Screens'

function App() {
  const [authed, setAuthed] = useState(null)
  const [tab, setTab] = useState('chats')
  const [fabOpen, setFabOpen] = useState(false)

  const content = () => {
    if (!authed) return <Onboarding onDone={setAuthed} />
    switch (tab) {
      case 'chats': return <Chats user={authed} />
      case 'discover': return <Discover />
      case 'creator': return <Creator />
      case 'automations': return <Automations />
      case 'profile': return <Profile />
      default: return null
    }
  }

  return (
    <ThemeProvider>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 h-64">
          <Spline scene="https://prod.spline.design/8nsoLg1te84JZcE9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F7]/0 via-[#FAF9F7]/60 to-[#FAF9F7] pointer-events-none" />
        </div>
        <div className="relative pt-48">
          {content()}
        </div>
        {authed && (
          <BottomNav current={tab} onChange={setTab} onFab={() => setFabOpen(v => !v)} />
        )}
        {fabOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)}>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-md w-full px-6">
              <div className="bg-white rounded-3xl shadow-2xl border border-black/10 p-3 grid grid-cols-3 gap-3">
                <button className="rounded-2xl p-4 bg-[#E7E1F9]">
                  <div className="text-sm font-medium">New Chat</div>
                </button>
                <button className="rounded-2xl p-4 bg-[#DFF5EC]">
                  <div className="text-sm font-medium">New Post</div>
                </button>
                <button className="rounded-2xl p-4 bg-[#F5DDE4]">
                  <div className="text-sm font-medium">New Automation</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App
