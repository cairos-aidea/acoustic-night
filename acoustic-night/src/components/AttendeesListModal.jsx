import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, Users, CheckCircle, Clock, XCircle, Search, RefreshCw } from 'lucide-react'

export default function AttendeesListModal({ isOpen, onClose }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('attending')
  const [search, setSearch] = useState('')

  const fetchGuests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('name', { ascending: true })

      if (!error && data) {
        setGuests(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchGuests()
    }
  }, [isOpen])

  if (!isOpen) return null

  const attendingCount = guests.filter((g) => g.status === 'attending').length
  const declinedCount = guests.filter((g) => g.status === 'declined').length
  const pendingCount = guests.filter((g) => g.status === 'pending').length

  const filtered = guests.filter((g) => {
    const matchesFilter = filter === 'all' || g.status === filter
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.dept && g.dept.toLowerCase().includes(search.toLowerCase())) ||
      (g.email && g.email.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-[#19231E] border border-[#2B3831] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2B3831] flex items-center justify-between bg-[#151D19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#23312A] border border-[#33463C] flex items-center justify-center text-[#ECA836]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Fraunces'] font-bold text-base text-[#FDFBF7]">
                Guest Directory
              </h3>
              <p className="text-[11px] text-[#A69F8E]">
                {attendingCount} Attending • {pendingCount} Pending • {declinedCount} Declined
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchGuests}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#23312A] hover:bg-[#2F4238] text-[#B8B2A1] hover:text-white transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#23312A] hover:bg-[#2F4238] text-[#B8B2A1] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-[#2B3831] bg-[#121915]/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8978]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, department, or email..."
              className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl pl-9 pr-4 py-2 text-xs text-[#FDFBF7] placeholder-[#66726A] outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilter('attending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                filter === 'attending'
                  ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-500/50'
                  : 'bg-[#23312A] text-[#B8B2A1] hover:text-white'
              }`}
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Attending ({attendingCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                filter === 'pending'
                  ? 'bg-amber-900/60 text-amber-200 border border-amber-500/50'
                  : 'bg-[#23312A] text-[#B8B2A1] hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('declined')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                filter === 'declined'
                  ? 'bg-red-950 text-red-200 border border-red-500/50'
                  : 'bg-[#23312A] text-[#B8B2A1] hover:text-white'
              }`}
            >
              <XCircle className="w-3 h-3 text-red-400" />
              Declined ({declinedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                filter === 'all'
                  ? 'bg-[#ECA836] text-black font-semibold'
                  : 'bg-[#23312A] text-[#B8B2A1] hover:text-white'
              }`}
            >
              All ({guests.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto divide-y divide-[#2B3831]/50 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#8F8978]">
              No guests found matching your criteria.
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#FDFBF7] truncate">
                      {g.name}
                    </span>
                    {g.dept && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#23312A] text-[#D5CEBD] border border-[#33463C]">
                        {g.dept}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#8F8978] truncate block">
                    {g.email || 'No email registered'}
                  </span>
                </div>

                <div className="shrink-0">
                  {g.status === 'attending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Attending
                    </span>
                  )}
                  {g.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#282116] text-amber-300 border border-amber-600/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Pending
                    </span>
                  )}
                  {g.status === 'declined' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-950/60 text-red-300 border border-red-800/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

