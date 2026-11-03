import React, { useState } from 'react'
import { isConfigured, saveAnonKey, clearAnonKey } from '../lib/supabase'
import { KeyRound, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'

export default function ConfigBanner() {
  const [open, setOpen] = useState(!isConfigured)
  const [keyInput, setKeyInput] = useState('')

  const handleSave = (e) => {
    e.preventDefault()
    if (!keyInput.trim()) return
    saveAnonKey(keyInput.trim())
  }

  // If already configured and collapsed, show small subtle status badge
  if (isConfigured && !open) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-1 text-center">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400/80 hover:text-emerald-300 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Supabase Connected (mxmepnntyatisdmuwkcm)
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <div className={`p-3.5 rounded-xl border backdrop-blur-md text-sm transition-all shadow-lg ${
        isConfigured
          ? 'bg-[#19241F]/90 border-emerald-500/30 text-emerald-100'
          : 'bg-[#281c15]/95 border-amber-500/50 text-amber-100'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-semibold text-xs tracking-wide uppercase">
              {isConfigured ? 'Supabase Connected' : 'Supabase Anon Key Required'}
            </span>
          </div>
          {isConfigured && (
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-[#B8B2A1] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {!isConfigured && (
          <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
            Project: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">mxmepnntyatisdmuwkcm</code>.
            Paste your <strong>anon public API key</strong> below to connect to your Supabase project live:
          </p>
        )}

        <form onSubmit={handleSave} className="mt-2.5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={isConfigured ? 'Replace anon key...' : 'Paste your Supabase anon key (eyJh...)'}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Save Key
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[#A69F8E]">
          <a
            href="https://supabase.com/dashboard/project/mxmepnntyatisdmuwkcm/settings/api"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-amber-300"
          >
            Find anon key in Supabase Dashboard <ExternalLink className="w-2.5 h-2.5" />
          </a>
          {isConfigured && (
            <button
              onClick={clearAnonKey}
              className="text-red-400/80 hover:text-red-300 underline"
            >
              Reset Key
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

