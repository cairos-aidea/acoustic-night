import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StatusDropdown from './StatusDropdown'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  RefreshCw,
  Download,
  Copy,
  Check,
  Lock,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  X,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

const ADMIN_PASSCODE = 'acoustic2026'

export default function AdminPortal({ onBackToGuestView }) {
  // Passcode gate state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('acoustic_admin_authenticated') === 'true'
  })
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState('')

  // Guests & Dashboard data
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [activeReceiptGuest, setActiveReceiptGuest] = useState(null)
  const [showAddGuestModal, setShowAddGuestModal] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [guestToDelete, setGuestToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Add guest form state
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestEmail, setNewGuestEmail] = useState('')
  const [newGuestDept, setNewGuestDept] = useState('DES')
  const [newGuestStatus, setNewGuestStatus] = useState('pending')
  const [addGuestLoading, setAddGuestLoading] = useState(false)
  const [addGuestError, setAddGuestError] = useState('')

  // Fetch guests from Supabase
  const fetchGuests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching guests:', error)
      } else if (data) {
        setGuests(data)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchGuests()
    }
  }, [isAuthenticated])

  // Passcode handler
  const handlePasscodeSubmit = (e) => {
    e.preventDefault()
    if (passcodeInput.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem('acoustic_admin_authenticated', 'true')
      setIsAuthenticated(true)
      setPasscodeError('')
    } else {
      setPasscodeError('Invalid organizer passcode. Please try again.')
    }
  }

  const handleAdminLogout = () => {
    sessionStorage.removeItem('acoustic_admin_authenticated')
    setIsAuthenticated(false)
  }

  // Quick status update for a guest
  const handleUpdateStatus = async (guestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)

      if (error) throw error

      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, status: newStatus } : g))
      )
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  // Delete guest
  const handleDeleteGuest = async () => {
    if (!guestToDelete) return
    const guestId = guestToDelete.id
    setDeleting(true)

    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId)

      if (error) throw error

      setGuests((prev) => prev.filter((g) => g.id !== guestId))
      setGuestToDelete(null)
    } catch (err) {
      alert(`Failed to delete guest: ${err.message}. Ensure delete policy is applied in Supabase.`)
    } finally {
      setDeleting(false)
    }
  }

  // Add additional invite handler
  const handleAddGuest = async (e) => {
    e.preventDefault()
    setAddGuestError('')

    const cleanName = newGuestName.trim()
    const cleanEmail = newGuestEmail.trim().toLowerCase()
    const cleanDept = newGuestDept.trim().toUpperCase()

    if (!cleanName) {
      setAddGuestError('Please enter the guest name.')
      return
    }
    if (!cleanEmail) {
      setAddGuestError('Please enter a valid email address.')
      return
    }

    // Check duplicate in local state
    if (guests.some((g) => g.email && g.email.toLowerCase() === cleanEmail)) {
      setAddGuestError('A guest with this email already exists on the invite list.')
      return
    }

    setAddGuestLoading(true)

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          name: cleanName,
          email: cleanEmail,
          dept: cleanDept || null,
          status: newGuestStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setGuests((prev) => [...prev, data])
      setShowAddGuestModal(false)
      setNewGuestName('')
      setNewGuestEmail('')
      setNewGuestDept('DES')
    } catch (err) {
      console.error('Error adding guest:', err)
      setAddGuestError(err.message || 'Failed to add guest. Check Supabase INSERT policy.')
    } finally {
      setAddGuestLoading(false)
    }
  }

  // Copy attending list to clipboard
  const handleCopyAttending = () => {
    const attending = guests.filter((g) => g.status === 'attending')
    const text = attending
      .map((g, i) => `${i + 1}. ${g.name} (${g.dept || 'Guest'}) - ${g.payment_method ? g.payment_method.toUpperCase() : 'Paid'}${g.reference_no ? ' - Ref: ' + g.reference_no : ''}`)
      .join('\n')

    navigator.clipboard.writeText(`🎵 Acoustic Night — Attending List (${attending.length} Total):\n\n${text}`)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Department', 'Status', 'Payment Method', 'Reference No', 'Receipt URL', 'Updated At']
    const rows = guests.map((g) => [
      `"${g.name}"`,
      `"${g.email || ''}"`,
      `"${g.dept || ''}"`,
      `"${g.status}"`,
      `"${g.payment_method || ''}"`,
      `"${g.reference_no || ''}"`,
      `"${g.payment_receipt_url || ''}"`,
      `"${g.updated_at || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `acoustic_night_attendees_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered guests
  const attendingList = guests.filter((g) => g.status === 'attending')
  const declinedList = guests.filter((g) => g.status === 'declined')
  const pendingList = guests.filter((g) => g.status === 'pending')
  const withReceiptList = guests.filter((g) => Boolean(g.payment_receipt_url))

  const filteredGuests = guests.filter((g) => {
    const matchesFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'attending'
        ? g.status === 'attending'
        : statusFilter === 'declined'
        ? g.status === 'declined'
        : statusFilter === 'pending'
        ? g.status === 'pending'
        : statusFilter === 'receipt'
        ? Boolean(g.payment_receipt_url)
        : true

    const q = search.toLowerCase()
    const matchesSearch =
      g.name.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.dept && g.dept.toLowerCase().includes(q)) ||
      (g.reference_no && g.reference_no.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  // 1. Passcode Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121915] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#19231E] border border-[#2B3831] rounded-2xl p-6 shadow-2xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ECA836]/10 border border-[#ECA836]/30 text-[#ECA836] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="font-['Fraunces'] text-xl font-bold text-[#FDFBF7]">
              Organizers Admin Portal
            </h2>
            <p className="text-xs text-[#B8B2A1] mt-1">
              Enter the admin passcode to manage RSVPs, check payment photos, and add guests.
            </p>
          </div>

          {passcodeError && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handlePasscodeSubmit} className="space-y-3">
            <input
              type="password"
              autoFocus
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Enter admin passcode..."
              className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl px-4 py-2.5 text-sm text-[#FDFBF7] text-center outline-none"
            />

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ECA836] to-[#E09825] hover:from-[#F0B348] hover:to-[#ECA836] text-[#121915] font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="pt-2 border-t border-[#2B3831]/50 flex items-center justify-center text-[11px] text-[#8F8978]">
            <button
              onClick={onBackToGuestView}
              className="hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Guest View
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Full Admin Dashboard
  return (
    <div className="min-h-screen bg-[#121915] text-[#FDFBF7] p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B3831]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Caveat'] text-2xl text-[#ECA836] rotate-[-2deg]">
                Acoustic Night
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#ECA836]/15 text-[#ECA836] border border-[#ECA836]/30">
                Organizer Admin
              </span>
            </div>
            <h1 className="font-['Fraunces'] text-xl sm:text-3xl font-extrabold text-[#FDFBF7] mt-0.5">
              Attendee & Payment Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onBackToGuestView}
              className="px-3 py-2 rounded-xl bg-[#19231E] hover:bg-[#23312A] border border-[#2B3831] text-xs font-medium text-[#B8B2A1] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Guest View</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-xs font-medium text-red-200 transition-colors cursor-pointer sm:ml-0 ml-auto"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Invites */}
          <div className="bg-[#19231E] border border-[#2B3831] rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-[#8F8978] uppercase tracking-wider block">
              Total Invites
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-3xl font-bold text-[#FDFBF7]">
                {guests.length}
              </span>
              <span className="text-xs text-[#8F8978]">guests</span>
            </div>
          </div>

          {/* Attending */}
          <div className="bg-[#19231E] border border-emerald-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-[#19231E] to-emerald-950/20">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Attending
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-3xl font-bold text-emerald-400">
                {attendingList.length}
              </span>
              <span className="text-xs text-emerald-300/70">
                ({guests.length ? Math.round((attendingList.length / guests.length) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-[#19231E] border border-amber-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-[#19231E] to-amber-950/20">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pending
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-3xl font-bold text-amber-400">
                {pendingList.length}
              </span>
              <span className="text-xs text-amber-300/70">awaiting</span>
            </div>
          </div>

          {/* Declined */}
          <div className="bg-[#19231E] border border-red-500/30 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-[#19231E] to-red-950/20">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Declined
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-3xl font-bold text-red-400">
                {declinedList.length}
              </span>
              <span className="text-xs text-red-300/70">released</span>
            </div>
          </div>

          {/* Estimated Fund (₱300 * Attending) */}
          <div className="col-span-2 sm:col-span-1 bg-[#19231E] border border-[#ECA836]/40 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-[#19231E] to-[#ECA836]/10">
            <span className="text-[11px] font-semibold text-[#ECA836] uppercase tracking-wider block flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Total Fund
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Fraunces'] text-3xl font-bold text-[#ECA836]">
                ₱{(attendingList.length * 300).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8F8978]">collected</span>
            </div>
          </div>
        </div>

        {/* Actions Bar & Controls */}
        <div className="bg-[#19231E] border border-[#2B3831] rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F8978]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, dept, or ref no..."
                className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#FDFBF7] placeholder-[#66726A] outline-none"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-[1fr_1fr_auto] sm:flex sm:flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddGuestModal(true)}
                className="col-span-3 justify-center px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#ECA836] to-[#E09825] hover:from-[#F0B348] hover:to-[#ECA836] text-[#121915] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#ECA836]/10 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Invite</span>
              </button>

              <button
                onClick={handleCopyAttending}
                className="justify-center px-3 py-2.5 rounded-xl bg-[#23312A] hover:bg-[#2F4238] border border-[#33463C] text-xs font-semibold text-[#D5CEBD] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy list of attending names"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Attending</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                className="justify-center px-3 py-2.5 rounded-xl bg-[#23312A] hover:bg-[#2F4238] border border-[#33463C] text-xs font-semibold text-[#D5CEBD] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download attendee list as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchGuests}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#23312A] hover:bg-[#2F4238] border border-[#33463C] text-[#B8B2A1] hover:text-white transition-colors cursor-pointer"
                title="Refresh table"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs border-t border-[#2B3831]/60 pt-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#ECA836] text-[#121915]'
                  : 'bg-[#121915] text-[#B8B2A1] hover:text-white'
              }`}
            >
              All Guests ({guests.length})
            </button>
            <button
              onClick={() => setStatusFilter('attending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'attending'
                  ? 'bg-emerald-700/80 text-white border border-emerald-500/50'
                  : 'bg-[#121915] text-emerald-300/80 hover:text-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Attending ({attendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-800/80 text-white border border-amber-500/50'
                  : 'bg-[#121915] text-amber-300/80 hover:text-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setStatusFilter('declined')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'declined'
                  ? 'bg-red-900/80 text-white border border-red-500/50'
                  : 'bg-[#121915] text-red-300/80 hover:text-red-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Declined ({declinedList.length})
            </button>
            <button
              onClick={() => setStatusFilter('receipt')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'receipt'
                  ? 'bg-sky-800/80 text-white border border-sky-500/50'
                  : 'bg-[#121915] text-sky-300/80 hover:text-sky-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              With Payment Photo ({withReceiptList.length})
            </button>
          </div>
        </div>

        {/* Guests: cards on mobile, table on md+ */}
        <div className="md:hidden space-y-3">
          {filteredGuests.length === 0 ? (
            <div className="bg-[#19231E] border border-[#2B3831] rounded-2xl py-10 text-center text-xs text-[#8F8978]">
              {loading ? 'Loading guests...' : 'No guests found matching your criteria.'}
            </div>
          ) : (
            filteredGuests.map((g) => (
              <div key={g.id} className="bg-[#19231E] border border-[#2B3831] rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#FDFBF7] text-sm">{g.name}</span>
                      {g.dept && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#23312A] text-[#D5CEBD] border border-[#33463C]">
                          {g.dept}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-[#A69F8E] truncate mt-0.5">
                      {g.email || 'No email'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestToDelete(g)}
                    className="p-2 rounded-lg text-[#8F8978] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                    title="Delete guest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2B3831]/60">
                  <StatusDropdown
                    value={g.status}
                    onChange={(next) => handleUpdateStatus(g.id, next)}
                  />
                  <div className="text-right text-[11px] leading-tight">
                    <span className="font-semibold text-[#D5CEBD] uppercase block">
                      {g.payment_method || <span className="text-[#636C65]">No method</span>}
                    </span>
                    {g.reference_no && (
                      <span className="font-mono text-[#A69F8E] block mt-0.5">Ref: {g.reference_no}</span>
                    )}
                  </div>
                </div>

                {g.payment_receipt_url && (
                  <button
                    type="button"
                    onClick={() => setActiveReceiptGuest(g)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#121915] border border-[#2B3831] hover:border-[#ECA836]/60 transition-colors cursor-pointer text-left"
                  >
                    <img
                      src={g.payment_receipt_url}
                      alt="Receipt"
                      className="w-12 h-12 object-cover rounded-lg border border-[#33463C]"
                    />
                    <span className="flex-1 text-xs text-[#ECA836] font-medium">View payment photo</span>
                    <Eye className="w-4 h-4 text-[#ECA836] mr-1" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block bg-[#19231E] border border-[#2B3831] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#151D19] border-b border-[#2B3831] text-[#8F8978] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Invitee</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Method</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Photo / Proof</th>
                  <th className="py-3.5 px-4 font-semibold">Ref No.</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3831]/60">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8F8978]">
                      {loading ? 'Loading guests...' : 'No guests found matching your criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((g) => (
                    <tr key={g.id} className="hover:bg-[#1C2722] transition-colors">
                      {/* Name & Dept */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#FDFBF7] text-sm">
                            {g.name}
                          </span>
                          {g.dept && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#23312A] text-[#D5CEBD] border border-[#33463C]">
                              {g.dept}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#A69F8E]">
                        {g.email || <span className="text-[#636C65] italic">No email</span>}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <StatusDropdown
                          value={g.status}
                          onChange={(next) => handleUpdateStatus(g.id, next)}
                        />
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 text-[11px] font-semibold text-[#D5CEBD] uppercase">
                        {g.payment_method || <span className="text-[#636C65]">-</span>}
                      </td>

                      {/* Payment Photo Proof */}
                      <td className="py-3 px-4">
                        {g.payment_receipt_url ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReceiptGuest(g)}
                              className="relative group rounded-lg overflow-hidden border border-[#33463C] hover:border-[#ECA836] transition-colors cursor-pointer"
                              title="Click to view full photo"
                            >
                              <img
                                src={g.payment_receipt_url}
                                alt="Receipt"
                                className="w-10 h-10 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveReceiptGuest(g)}
                              className="text-[11px] text-[#ECA836] hover:underline font-medium cursor-pointer"
                            >
                              View Photo
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#636C65] italic">
                            No photo yet
                          </span>
                        )}
                      </td>

                      {/* Reference No */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#D5CEBD]">
                        {g.reference_no || <span className="text-[#636C65]">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setGuestToDelete(g)}
                          className="p-1.5 rounded-lg text-[#8F8978] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Delete guest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Add Guest Modal */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#19231E] border border-[#2B3831] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B3831]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#ECA836]/15 text-[#ECA836] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-['Fraunces'] text-lg font-bold text-[#FDFBF7]">
                  Add Additional Invite
                </h3>
              </div>
              <button
                onClick={() => setShowAddGuestModal(false)}
                className="text-[#8F8978] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addGuestError && (
              <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addGuestError}</span>
              </div>
            )}

            <form onSubmit={handleAddGuest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#D5CEBD] mb-1">
                  Full Name <span className="text-[#ECA836]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl px-3.5 py-2.5 text-xs text-[#FDFBF7] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D5CEBD] mb-1">
                  Email Address <span className="text-[#ECA836]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newGuestEmail}
                  onChange={(e) => setNewGuestEmail(e.target.value)}
                  placeholder="e.g. j.doe@aidea.co"
                  className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl px-3.5 py-2.5 text-xs text-[#FDFBF7] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#D5CEBD] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newGuestDept}
                    onChange={(e) => setNewGuestDept(e.target.value)}
                    placeholder="e.g. DES, EO, ST5"
                    className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] rounded-xl px-3.5 py-2.5 text-xs text-[#FDFBF7] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D5CEBD] mb-1">
                    Initial Status
                  </label>
                  <StatusDropdown
                    block
                    value={newGuestStatus}
                    onChange={setNewGuestStatus}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGuestModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#2B3831] hover:bg-[#23312A] text-xs font-semibold text-[#B8B2A1] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addGuestLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ECA836] to-[#E09825] text-[#121915] font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {addGuestLoading ? 'Adding...' : 'Add Invitee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Guest Confirmation */}
      {guestToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => !deleting && setGuestToDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-guest-title"
            className="w-full max-w-sm bg-[#19231E] border border-[#2B3831] rounded-2xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 id="delete-guest-title" className="font-['Fraunces'] text-lg font-bold text-[#FDFBF7]">
                Remove from invite list?
              </h3>
              <p className="text-xs text-[#B8B2A1] leading-relaxed">
                <strong className="text-[#FDFBF7]">{guestToDelete.name}</strong>
                {guestToDelete.email ? ` (${guestToDelete.email})` : ''} will be permanently removed, including any RSVP and payment details. This can't be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                autoFocus
                onClick={() => setGuestToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#2B3831] hover:bg-[#23312A] text-xs font-semibold text-[#B8B2A1] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGuest}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Photo Lightbox Modal */}
      {activeReceiptGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#19231E] border border-[#2B3831] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#2B3831] flex items-center justify-between bg-[#151D19]">
              <div>
                <h3 className="font-['Fraunces'] text-base font-bold text-[#FDFBF7]">
                  Payment Photo: {activeReceiptGuest.name}
                </h3>
                <p className="text-xs text-[#A69F8E]">
                  {activeReceiptGuest.dept || 'Guest'} • Ref: {activeReceiptGuest.reference_no || 'None'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeReceiptGuest.payment_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-[#23312A] hover:bg-[#2F4238] text-[#ECA836] hover:text-white transition-colors"
                  title="Open original image in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActiveReceiptGuest(null)}
                  className="p-1.5 rounded-lg bg-[#23312A] hover:bg-[#2F4238] text-[#B8B2A1] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/80 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              <img
                src={activeReceiptGuest.payment_receipt_url}
                alt={`Payment receipt from ${activeReceiptGuest.name}`}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

