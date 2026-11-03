import React from 'react'
import { CheckCircle2, XCircle, LogOut, ExternalLink } from 'lucide-react'

// Poster is 1122x1402; hotspot rects are percentages of that artwork.
const ATTEND_RECT = { left: '15.95%', top: '77.7%', width: '32.9%', height: '6.3%' }
const DECLINE_RECT = { left: '50.98%', top: '77.7%', width: '32.9%', height: '6.3%' }
const PANEL_RECT = { left: '4.9%', top: '73.4%', width: '90.1%', height: '12%' }

const PAYMENT_LABELS = { gcash: 'GCash', cash: 'Cash' }

export default function InviteCard({ guest, onAttendClick, onDeclineClick, onLogout }) {
  const isAttending = guest.status === 'attending'
  const isDeclined = guest.status === 'declined'
  const isPending = !isAttending && !isDeclined

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 animate-fadeIn pb-16">
      {/* Top Navbar */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-[#2B3831]/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#ECA836]/20 border border-[#ECA836]/40 flex items-center justify-center text-[#ECA836] font-bold text-xs">
            {guest.name.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-[#FDFBF7] block leading-tight">{guest.name}</span>
            <span className="text-[10px] text-[#A69F8E]">
              {guest.dept ? `${guest.dept} Dept` : 'Guest'} • {guest.email}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg bg-[#19231E] hover:bg-[#23312A] border border-[#2B3831] text-[#A69F8E] hover:text-red-300 transition-colors cursor-pointer"
          title="Log out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Poster as the invitation, with RSVP hotspots over the artwork's buttons */}
      <div
        className="relative w-full rounded-3xl overflow-hidden border border-[#2B3831] shadow-2xl bg-[#121915]"
        style={{ containerType: 'inline-size' }}
      >
        <img
          src="/image.png"
          alt="Acoustic Night — Fri, Nov 13, 2026, 5:30 PM onwards at Aidea Ringgos Bar. Entrance fee ₱300 includes beer and food."
          className="block w-full h-auto select-none"
          draggable={false}
        />

        {isPending && (
          <>
            <button
              type="button"
              onClick={onAttendClick}
              aria-label="Attending"
              style={{ position: 'absolute', ...ATTEND_RECT }}
              className="rounded-full cursor-pointer hover:bg-white/10 active:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#ECA836] transition-colors"
            />
            <button
              type="button"
              onClick={onDeclineClick}
              aria-label="Not Attending"
              style={{ position: 'absolute', ...DECLINE_RECT }}
              className="rounded-full cursor-pointer hover:bg-white/10 active:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#ECA836] transition-colors"
            />
          </>
        )}

        {isAttending && (
          <div
            style={{ position: 'absolute', ...PANEL_RECT }}
            className="rounded-[3cqw] bg-[#1b241e] border border-emerald-500/40 flex items-center justify-between gap-[2cqw] px-[3cqw]"
          >
            <div className="flex items-center gap-[2cqw] min-w-0">
              <CheckCircle2 className="text-emerald-400 shrink-0" style={{ width: '6cqw', height: '6cqw' }} />
              <div className="min-w-0">
                <p className="font-bold text-white leading-tight" style={{ fontSize: '3.8cqw' }}>
                  You're attending!
                </p>
                <p className="text-emerald-300/80 leading-tight" style={{ fontSize: '2.6cqw' }}>
                  See you on Nov 13
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-[0.8cqw]" style={{ fontSize: '2.6cqw' }}>
              <button onClick={onAttendClick} className="text-[#ECA836] hover:underline cursor-pointer">
                Update payment
              </button>
              <button onClick={onDeclineClick} className="text-red-300/80 hover:underline cursor-pointer">
                Change RSVP
              </button>
            </div>
          </div>
        )}

        {isDeclined && (
          <div
            style={{ position: 'absolute', ...PANEL_RECT }}
            className="rounded-[3cqw] bg-[#241b1a] border border-red-500/40 flex items-center justify-between gap-[2cqw] px-[3cqw]"
          >
            <div className="flex items-center gap-[2cqw] min-w-0">
              <XCircle className="text-red-400 shrink-0" style={{ width: '6cqw', height: '6cqw' }} />
              <div className="min-w-0">
                <p className="font-bold text-white leading-tight" style={{ fontSize: '3.8cqw' }}>
                  You declined
                </p>
                <p className="text-red-200/80 leading-tight" style={{ fontSize: '2.6cqw' }}>
                  We'll miss you!
                </p>
              </div>
            </div>
            <button
              onClick={onAttendClick}
              className="text-[#ECA836] hover:underline cursor-pointer text-right"
              style={{ fontSize: '2.8cqw' }}
            >
              Changed your mind?
              <br />
              Click to attend
            </button>
          </div>
        )}
      </div>

      {/* Payment summary for confirmed guests */}
      {isAttending && (guest.payment_method || guest.reference_no || guest.payment_receipt_url) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {guest.payment_method && (
            <div className="p-2.5 rounded-lg bg-[#19231E] border border-[#2B3831]">
              <span className="text-[10px] text-[#A69F8E] block">Payment Method</span>
              <span className="font-semibold text-[#FDFBF7]">
                {PAYMENT_LABELS[guest.payment_method] || guest.payment_method}
              </span>
            </div>
          )}
          {guest.reference_no && (
            <div className="p-2.5 rounded-lg bg-[#19231E] border border-[#2B3831]">
              <span className="text-[10px] text-[#A69F8E] block">Reference No.</span>
              <span className="font-mono font-semibold text-[#FDFBF7]">{guest.reference_no}</span>
            </div>
          )}
          {guest.payment_receipt_url && (
            <div className="p-2.5 rounded-lg bg-[#19231E] border border-[#2B3831] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A69F8E] block">Payment Receipt</span>
                <span className="text-[11px] text-emerald-300">Uploaded</span>
              </div>
              <a
                href={guest.payment_receipt_url}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-[#23312A] hover:bg-[#2F4238] text-white transition-colors"
                title="View receipt"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
