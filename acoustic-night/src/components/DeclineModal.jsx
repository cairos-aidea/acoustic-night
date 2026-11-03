import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Loader2, HeartHandshake, Undo2, X } from 'lucide-react'

export default function DeclineModal({ guest, isOpen, onClose, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasDeclined, setHasDeclined] = useState(false)

  if (!isOpen) return null

  const handleConfirmDecline = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const { data: updatedGuest, error } = await supabase
        .from('guests')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', guest.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setHasDeclined(true)
      onUpdateSuccess(updatedGuest)
    } catch (err) {
      console.error('Error declining RSVP:', err)
      setErrorMsg(err.message || 'Failed to update RSVP.')
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const { data: updatedGuest, error } = await supabase
        .from('guests')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', guest.id)
        .select()
        .single()

      if (error) throw new Error(error.message)

      setHasDeclined(false)
      onUpdateSuccess(updatedGuest)
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to reset status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#19231E] border border-[#2B3831] rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8F8978] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {hasDeclined ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#ECA836] flex items-center justify-center mx-auto">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-['Fraunces'] text-xl font-bold text-[#FDFBF7]">
                We'll Miss You!
              </h3>
              <p className="text-xs text-[#B8B2A1] mt-2 leading-relaxed">
                Thanks for letting us know, <strong>{guest.name}</strong>. Your slot has been released so others on standby can attend.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRevert}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#2B3831] hover:border-[#ECA836] hover:bg-[#23312A] text-xs font-medium text-[#ECA836] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Changed your mind? Click here to attend
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-[#23312A] hover:bg-[#2F4238] text-xs text-[#FDFBF7] font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Fraunces'] text-lg font-bold text-[#FDFBF7]">
                  Are you sure?
                </h3>
                <p className="text-xs text-[#8F8978]">
                  Confirming your decline
                </p>
              </div>
            </div>

            <p className="text-xs text-[#B8B2A1] leading-relaxed bg-[#121915] p-3.5 rounded-xl border border-[#2B3831]">
              Confirming that you cannot make it means your slot will be released and you will be removed from the attendee list.
            </p>

            {errorMsg && (
              <p className="text-xs text-red-400">{errorMsg}</p>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#2B3831] hover:bg-[#23312A] text-xs font-semibold text-[#B8B2A1] hover:text-white transition-colors cursor-pointer"
              >
                Cancel / Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600/50 text-red-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Decline</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

