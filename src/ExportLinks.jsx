import React from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function ExportLinks() {
  const backendUrl = `${API}/export/backend`
  const frontendUrl = `/public/telegram2-frontend.tar.gz`
  return (
    <div className="fixed top-2 right-2 bg-white/90 border border-black/10 rounded-xl p-2 text-xs shadow">
      <div className="font-semibold mb-1">Export</div>
      <div><a className="text-blue-600 underline" href={frontendUrl} download>Frontend .tar.gz</a></div>
      <div><a className="text-blue-600 underline" href={backendUrl} target="_blank" rel="noreferrer">Backend .tar.gz</a></div>
    </div>
  )
}
