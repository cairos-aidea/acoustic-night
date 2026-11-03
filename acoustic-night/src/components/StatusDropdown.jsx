import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, CheckCircle2, XCircle, ChevronDown, Check } from 'lucide-react'

const OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    Icon: Clock,
    trigger: 'bg-[#282116] text-amber-300 border-amber-600/30 hover:border-amber-500/60',
    text: 'text-amber-300'
  },
  {
    value: 'attending',
    label: 'Attending',
    Icon: CheckCircle2,
    trigger: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40 hover:border-emerald-500/70',
    text: 'text-emerald-300'
  },
  {
    value: 'declined',
    label: 'Declined',
    Icon: XCircle,
    trigger: 'bg-red-950/80 text-red-300 border-red-700/40 hover:border-red-500/70',
    text: 'text-red-300'
  }
]

export default function StatusDropdown({ value, onChange, block = false }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const current = OPTIONS.find((o) => o.value === value) || OPTIONS[0]

  useEffect(() => {
    if (!open) return

    const close = () => setOpen(false)
    const onPointerDown = (e) => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      close()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 border outline-none cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-[#ECA836] ${
          block
            ? 'w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-[#121915] border-[#2B3831] hover:border-[#ECA836]/60 ' + current.text
            : 'rounded-lg pl-2 pr-1.5 py-1 text-xs font-semibold ' + current.trigger
        }`}
      >
        <current.Icon className="w-3.5 h-3.5" />
        <span className={block ? 'flex-1 text-left' : ''}>{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: block ? pos.width : undefined }}
            className="z-50 min-w-[150px] p-1 rounded-xl bg-[#19231E] border border-[#2B3831] shadow-2xl shadow-black/60 animate-fadeIn"
          >
            {OPTIONS.map(({ value: optValue, label, Icon, text }) => (
              <button
                key={optValue}
                type="button"
                role="option"
                aria-selected={optValue === value}
                onClick={() => {
                  setOpen(false)
                  if (optValue !== value) onChange(optValue)
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[#23312A] ${text} ${
                  optValue === value ? 'bg-[#1F2C25]' : ''
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="flex-1">{label}</span>
                {optValue === value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
