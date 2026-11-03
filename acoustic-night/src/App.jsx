import React, { useState, useEffect } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import LoginGate from './components/LoginGate'
import InviteCard from './components/InviteCard'
import PaymentModal from './components/PaymentModal'
import DeclineModal from './components/DeclineModal'
import AdminPortal from './components/AdminPortal'
import { Lock } from 'lucide-react'

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin' ||
      window.location.search.includes('admin=true')
    )
  })

  const [guest, setGuest] = useState(null)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)

  // Listen for browser URL changes (e.g. back button or entering /admin)
  useEffect(() => {
    const handleLocationChange = () => {
      const isNowAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin=true')
      setIsAdminRoute(isNowAdmin)
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  // Restore guest session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const stored = localStorage.getItem('acoustic_night_guest')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setGuest(parsed)

          if (isConfigured && parsed.id) {
            const { data, error } = await supabase
              .from('guests')
              .select('*')
              .eq('id', parsed.id)
              .maybeSingle()

            if (!error && data) {
              setGuest(data)
              localStorage.setItem('acoustic_night_guest', JSON.stringify(data))
            }
          }
        } catch (err) {
          console.error('Session restore failed:', err)
          localStorage.removeItem('acoustic_night_guest')
        }
      }
      setLoadingInitial(false)
    }

    restoreSession()
  }, [])

  const handleNavigateToAdmin = () => {
    window.history.pushState({}, '', '/admin')
    setIsAdminRoute(true)
  }

  const handleBackToGuestView = () => {
    window.history.pushState({}, '', '/')
    setIsAdminRoute(false)
  }

  const handleLoginSuccess = (guestData) => {
    setGuest(guestData)
  }

  const handleLogout = () => {
    localStorage.removeItem('acoustic_night_guest')
    setGuest(null)
  }

  const handleGuestUpdated = (updatedGuest) => {
    setGuest(updatedGuest)
    localStorage.setItem('acoustic_night_guest', JSON.stringify(updatedGuest))
  }

  // 1. Secret Admin View
  if (isAdminRoute) {
    return <AdminPortal onBackToGuestView={handleBackToGuestView} />
  }

  // 2. Loading State
  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#121915] flex items-center justify-center text-[#ECA836]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#ECA836] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-['Fraunces'] text-sm tracking-wider uppercase text-[#FDFBF7]">
            Loading Acoustic Night...
          </span>
        </div>
      </div>
    )
  }

  // 3. Clean Guest-Facing RSVP Page (Zero technical banners/keys exposed)
  return (
    <div className="min-h-screen bg-[#121915] text-[#FDFBF7] flex flex-col justify-between selection:bg-[#ECA836]/30 selection:text-[#FFF5DC] relative overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ECA836]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-[#3D6B4F]/10 blur-[140px] rounded-full pointer-events-none"></div>

      <main className="flex-1 flex items-center justify-center relative z-10 py-6">
        {!guest ? (
          <LoginGate onLoginSuccess={handleLoginSuccess} />
        ) : (
          <InviteCard
            guest={guest}
            onAttendClick={() => setShowPaymentModal(true)}
            onDeclineClick={() => setShowDeclineModal(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Guest Modals */}
      {guest && (
        <>
          <PaymentModal
            guest={guest}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onUpdateSuccess={(updated) => {
              handleGuestUpdated(updated)
            }}
          />

          <DeclineModal
            guest={guest}
            isOpen={showDeclineModal}
            onClose={() => setShowDeclineModal(false)}
            onUpdateSuccess={(updated) => {
              handleGuestUpdated(updated)
            }}
          />
        </>
      )}

      {/* Discrete footer with secret admin link */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-[#636C65] flex items-center justify-center gap-3">
        <span>Acoustic Night RSVP • Aidea Ringgos Bar</span>
        <button
          onClick={handleNavigateToAdmin}
          className="text-[#3A453F] hover:text-[#8F8978] transition-colors p-1"
          title="Organizer portal"
        >
          <Lock className="w-3 h-3" />
        </button>
      </footer>
    </div>
  )
}
