import React, { useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { Mail, Sparkles, AlertCircle, Loader2, Music, Wine, ArrowRight, Info } from 'lucide-react'

export default function LoginGate({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showHelpers, setShowHelpers] = useState(false)

  const handleVerifyEmail = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!isConfigured) {
      setErrorMessage('Invitation database is currently being synced. If you are an organizer, access /admin to verify the connection.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle()

      if (error) {
        console.error('Supabase query error:', error)
        setErrorMessage('Failed to verify email. Please check your Supabase connection and tables.')
        setLoading(false)
        return
      }

      if (!data) {
        setErrorMessage('Sorry, this email is not on the exclusive guest list. Please contact the organizers.')
        setLoading(false)
        return
      }

      // Guest found! Save to localStorage and transition
      localStorage.setItem('acoustic_night_guest', JSON.stringify(data))
      onLoginSuccess(data)
    } catch (err) {
      console.error('Unexpected error:', err)
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Decorative poster-like badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ECA836]/10 border border-[#ECA836]/30 text-[#ECA836] text-xs font-semibold tracking-wider uppercase mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          Exclusive Invitation Only
        </div>
        <p className="font-['Caveat'] text-2xl text-[#ECA836] tracking-wide rotate-[-1deg]">
          You're Invited to
        </p>
        <h1 className="font-['Fraunces'] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FDFBF7] mt-1 drop-shadow-md">
          Acoustic <span className="font-['Yellowtail'] text-[#ECA836] font-normal text-4xl sm:text-5xl">Night</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#B8B2A1] mt-2 flex items-center justify-center gap-2">
          <span>Good music</span>
          <span className="text-[#ECA836]">•</span>
          <span>Cold beer</span>
          <span className="text-[#ECA836]">•</span>
          <span>Great food</span>
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-[#19231E]/95 backdrop-blur-md rounded-2xl border border-[#2B3831] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#ECA836]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#3D6B4F]/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#23312A] border border-[#33463C] flex items-center justify-center text-[#ECA836] shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FDFBF7] font-['Fraunces']">
                Check Your Guest Pass
              </h2>
              <p className="text-xs text-[#B8B2A1]">
                Enter your company or registered email to continue
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div>
              <label htmlFor="guest-email" className="block text-xs font-medium text-[#D5CEBD] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="guest-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your aidea email"
                  className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] focus:ring-1 focus:ring-[#ECA836] rounded-xl px-4 py-3 text-sm text-[#FDFBF7] placeholder-[#66726A] transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#ECA836] to-[#E09825] hover:from-[#F0B348] hover:to-[#ECA836] text-[#121915] shadow-lg shadow-[#ECA836]/15 hover:shadow-[#ECA836]/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#121915]" />
                  <span>Verifying Guest List...</span>
                </>
              ) : (
                <>
                  <span>Access Invitation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Fallback & Sample hint pill list */}
          <div className="mt-6 pt-4 border-t border-[#2B3831]/60">
            <button
              type="button"
              onClick={() => setShowHelpers(!showHelpers)}
              className="text-[11px] text-[#A69F8E] hover:text-[#ECA836] flex items-center justify-between w-full transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Having trouble with your invitation email?
              </span>
              <span>{showHelpers ? 'Close' : 'Help'}</span>
            </button>

            {showHelpers && (
              <div className="mt-3 p-3 rounded-xl bg-[#121915]/80 border border-[#23312A] text-xs space-y-1.5 text-[#B8B2A1]">
                <p className="text-[11px] text-[#D5CEBD] leading-relaxed">
                  Please use your registered <strong>@aidea.co</strong> work email address as listed on the official Acoustic Night guest roster.
                </p>
                <p className="text-[11px] text-[#8F8978] leading-relaxed">
                  If your email is not recognized, please contact the Design Department organizers to add you to the guest list.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event highlights snippet */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#8F8978]">
        <span className="flex items-center gap-1.5">
          <Wine className="w-3.5 h-3.5 text-[#ECA836]" /> Aidea Ringgos Bar
        </span>
        <span className="flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[#ECA836]" /> Friday, Nov 13, 2026
        </span>
      </div>
    </div>
  )
}

