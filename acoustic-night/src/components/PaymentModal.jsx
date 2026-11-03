import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageUtils'
import confetti from 'canvas-confetti'
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  PartyPopper,
  Camera,
  Smartphone,
  Banknote
} from 'lucide-react'

const GCASH_NUMBER = '09566852220'
const GCASH_DISPLAY = '0956-685-2220'

export default function PaymentModal({ guest, isOpen, onClose, onUpdateSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState(guest?.payment_method || null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [referenceNo, setReferenceNo] = useState(guest?.reference_no || '')
  const [uploading, setUploading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [copiedText, setCopiedText] = useState('')
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    setErrorMsg('')
    if (!selected) return

    // Allow all image formats (JPEG, PNG, WEBP, HEIC, camera photos)
    if (!selected.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(selected.name)) {
      setErrorMsg('Please select an image file (.png, .jpg, .jpeg, .webp, camera photo)')
      return
    }

    // Allow large photos up to 25MB (our client-side compressor will optimize it)
    if (selected.size > 25 * 1024 * 1024) {
      setErrorMsg('Photo is unusually large (over 25MB). Please choose a smaller photo.')
      return
    }

    setPreparing(true)
    try {
      // Downscale big camera photos now so the upload on submit is small and fast
      const optimized = await compressImage(selected, 1600, 1600, 0.85)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(optimized)
      setPreviewUrl(URL.createObjectURL(optimized))
    } finally {
      setPreparing(false)
    }
  }

  const handleRemoveImage = () => {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!paymentMethod) {
      setErrorMsg('Please choose a mode of payment.')
      return
    }

    const isGcash = paymentMethod === 'gcash'

    if (isGcash && !file && !guest.payment_receipt_url) {
      setErrorMsg('Please upload your payment receipt or photo before submitting.')
      return
    }

    setUploading(true)

    try {
      let receiptUrl = isGcash ? guest.payment_receipt_url || null : null

      if (isGcash && file) {
        setProcessingStatus('Uploading receipt photo...')
        const optimizedFile = file
        const fileExt = optimizedFile.name.split('.').pop() || 'jpg'
        const filePath = `${guest.id}-${Date.now()}.${fileExt}`

        // Upload to 'receipts' bucket
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, optimizedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: optimizedFile.type || 'image/jpeg'
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`Receipt upload failed: ${uploadError.message}. Make sure the 'receipts' bucket exists in Supabase.`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)

        receiptUrl = publicUrlData.publicUrl
      }

      setProcessingStatus('Confirming RSVP...')
      // Update guest in Supabase
      const { data: updatedGuest, error: updateError } = await supabase
        .from('guests')
        .update({
          status: 'attending',
          payment_method: paymentMethod,
          payment_receipt_url: receiptUrl,
          reference_no: isGcash ? referenceNo.trim() || null : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', guest.id)
        .select()
        .single()

      if (updateError) {
        console.error('Guest update error:', updateError)
        throw new Error(`Failed to update RSVP: ${updateError.message}`)
      }

      // Confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ECA836', '#4E8664', '#FDFBF7', '#F9CA65']
      })

      setIsSuccess(true)
      onUpdateSuccess(updatedGuest)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Something went wrong while confirming your attendance.')
    } finally {
      setUploading(false)
      setProcessingStatus('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 bg-[#19231E] border border-[#2B3831] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#2B3831] flex items-center justify-between bg-[#151D19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3D6B4F]/30 border border-[#3D6B4F]/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#FDFBF7] font-['Fraunces']">
                Confirm Your Attendance
              </h3>
              <p className="text-xs text-[#B8B2A1]">
                Mode of payment & details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#23312A] hover:bg-[#2F4238] text-[#B8B2A1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <PartyPopper className="w-8 h-8" />
              </div>
              <h4 className="font-['Fraunces'] text-2xl text-[#FDFBF7] font-bold">
                You're On The List!
              </h4>
              <p className="text-sm text-[#B8B2A1] max-w-xs mx-auto leading-relaxed">
                Thank you, <strong>{guest.name}</strong>! Your reservation has been recorded. See you at Aidea Ringgos Bar on Nov 13!
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ECA836] to-[#E09825] text-[#121915] font-bold text-sm shadow-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Back to Invitation
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Info Card */}
              <div className="bg-[#121915] rounded-xl border border-[#2B3831] p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#23312A]">
                  <div>
                    <span className="text-[11px] font-semibold text-[#8F8978] uppercase tracking-wider block">
                      Entrance Fee
                    </span>
                    <span className="font-['Fraunces'] text-2xl font-bold text-[#ECA836]">
                      ₱300.00
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#A69F8E] block">Inclusions</span>
                    <span className="text-xs font-medium text-emerald-400">
                      Food, Cold Beer & Live Sets
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#D5CEBD] leading-relaxed">
                  <strong className="text-[#ECA836]">GCash payment is preferred.</strong> If paying in cash, kindly approach <strong>Cairos Magno</strong> or <strong>Baxti Vasquez</strong>.
                </p>

                {/* Mode of payment */}
                <div>
                  <span className="block text-xs font-medium text-[#D5CEBD] mb-1.5">
                    Mode of Payment <span className="text-[#ECA836]">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'gcash', label: 'GCash', Icon: Smartphone },
                      { id: 'cash', label: 'Cash', Icon: Banknote }
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(id)
                          setErrorMsg('')
                        }}
                        aria-pressed={paymentMethod === id}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          paymentMethod === id
                            ? 'bg-[#3D6B4F] border-[#5AA074] text-white'
                            : 'bg-[#19241F] border-[#2B3831] text-[#B8B2A1] hover:text-white hover:border-[#4A5E53]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'gcash' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#19241F] border border-[#2B3831] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400">GCash Number</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(GCASH_NUMBER)}
                          className="text-[10px] text-[#A69F8E] hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedText === GCASH_NUMBER ? (
                            <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <p className="font-mono text-base text-[#FDFBF7] font-semibold">{GCASH_DISPLAY}</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <img
                        src="/qr_payment.png"
                        alt="GCash QR code for ₱300"
                        className="w-44 h-auto rounded-xl border border-[#33463C]"
                      />
                      <span className="text-[11px] text-[#B8B2A1]">Scan with GCash, or send to the number above.</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-3 rounded-lg bg-[#151D19] border border-dashed border-[#33463C] flex items-start gap-3 text-xs text-[#B8B2A1]">
                    <Banknote className="w-5 h-5 text-[#ECA836] shrink-0" />
                    <span>
                      Please hand over the ₱300 to <strong className="text-[#FDFBF7]">Cairos Magno</strong> or <strong className="text-[#FDFBF7]">Baxti Vasquez</strong>. No receipt upload needed.
                    </span>
                  </div>
                )}
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Optional Reference Number */}
                {paymentMethod === 'gcash' && (
                <>
                <div>
                  <label htmlFor="ref-no" className="block text-xs font-medium text-[#D5CEBD] mb-1">
                    Transaction Reference No. <span className="text-[#8F8978]">(Optional)</span>
                  </label>
                  <input
                    id="ref-no"
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. 10029384729"
                    className="w-full bg-[#121915] border border-[#2B3831] focus:border-[#ECA836] focus:ring-1 focus:ring-[#ECA836] rounded-xl px-3.5 py-2.5 text-xs text-[#FDFBF7] placeholder-[#66726A] outline-none"
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-xs font-medium text-[#D5CEBD] mb-1">
                    Upload Payment Photo or Screenshot <span className="text-[#ECA836]">*</span>
                  </label>

                  {/* File preview if present */}
                  {preparing ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border border-[#2B3831] bg-[#121915] p-6 flex flex-col items-center justify-center gap-2.5"
                    >
                      <Loader2 className="w-6 h-6 text-[#ECA836] animate-spin" />
                      <p className="text-xs font-semibold text-[#ECA836]">Processing photo...</p>
                      <div className="w-2/3 h-1 rounded-full bg-[#23312A] overflow-hidden">
                        <div className="h-full w-full bg-[#ECA836] animate-pulse"></div>
                      </div>
                    </div>
                  ) : previewUrl || guest.payment_receipt_url ? (
                    <div className="relative rounded-xl border border-[#2B3831] bg-[#121915] p-2.5 flex items-center gap-3">
                      <img
                        src={previewUrl || guest.payment_receipt_url}
                        alt="Receipt preview"
                        className="w-16 h-16 object-cover rounded-lg border border-[#33463C]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#FDFBF7] truncate">
                          {file ? file.name : 'Current uploaded receipt'}
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-0.5">
                          {file ? `${(file.size / 1024).toFixed(0)} KB • Photo ready to submit` : 'Already on file'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {uploading && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="absolute inset-0 rounded-xl bg-[#121915]/85 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#ECA836]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{processingStatus || 'Uploading...'}</span>
                          </div>
                          <div className="w-2/3 h-1 rounded-full bg-[#23312A] overflow-hidden">
                            <div className="h-full w-full bg-[#ECA836] animate-pulse"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#2B3831] hover:border-[#ECA836]/60 rounded-xl p-6 text-center bg-[#121915]/60 hover:bg-[#121915] transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#23312A] text-[#ECA836] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-[#FDFBF7]">
                        Tap to take a photo or upload receipt
                      </p>
                      <p className="text-[11px] text-[#8F8978] mt-1">
                        Camera photos, screenshots, JPEG, PNG, WEBP (Auto-optimized)
                      </p>
                    </div>
                  )}

                  {/* Native image file input accepting camera and gallery photos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                </>
                )}

                {/* Submit Action */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={uploading}
                    className="flex-1 py-3 px-4 rounded-xl border border-[#2B3831] hover:bg-[#23312A] text-xs font-semibold text-[#B8B2A1] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      uploading ||
                      preparing ||
                      !paymentMethod ||
                      (paymentMethod === 'gcash' && !file && !guest.payment_receipt_url)
                    }
                    className="flex-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#3D6B4F] to-[#2D533D] hover:from-[#4E8664] hover:to-[#3D6B4F] text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{processingStatus || 'Uploading...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{paymentMethod === 'cash' ? 'Confirm Attendance' : 'Confirm & Submit ₱300'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
