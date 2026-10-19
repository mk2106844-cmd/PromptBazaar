import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Upload, QrCode, ShieldCheck, ArrowRight, ExternalLink, AlertCircle } from 'lucide-react';
import { PhotoItem, VideoItem, Order } from '../types';
import { APP_CONFIG } from '../config';
import { getUpiPaymentUrl, getUpiQrImageUrl } from '../lib/qr';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataApi, getPersistedGuestId } from '../lib/supabase';
import { useAppSettings } from '../lib/settings';

export interface UnlockTarget {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  thumbnail_url?: string;
  item_type?: string;
  itemType?: 'photo' | 'video';
  category?: string;
}

interface UnlockModalProps {
  item: PhotoItem | VideoItem | UnlockTarget | null;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onOpenMyUnlocks: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  item,
  onClose,
  onOrderCreated,
  onOpenMyUnlocks,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const settings = useAppSettings();

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.email) {
      setBuyerEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (item) {
      setCopiedUpi(false);
      setUtrNumber('');
      setScreenshotPreview(null);
      setScreenshotFileName('');
      setScreenshotFile(null);
      setIsSuccess(false);
      setErrorMessage('');
    }
  }, [item?.id]);

  if (!item) return null;

  // Determine item type ('photo' or 'video')
  const itemType: 'photo' | 'video' =
    (item as any).itemType === 'video' ||
    'thumbnail_url' in item ||
    'video_url' in item ||
    item.id.startsWith('v-')
      ? 'video'
      : 'photo';

  const itemImageUrl =
    (item as any).image_url ||
    (item as any).thumbnail_url ||
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80';

  const upiId = settings.upiId || '9718936211@ibl';
  const payeeName = settings.payeeName || 'PromptBazaar';
  const price = item.price || 29;
  const upiPaymentUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${price}&cu=INR&tn=${encodeURIComponent(`${APP_CONFIG.name} #${item.id.slice(0, 6)}`)}`;
  const qrImageUrl = settings.qrImageUrl || getUpiQrImageUrl(upiId, payeeName, price);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Kripya sirf photo ya image file (JPG, PNG, WEBP) upload karein.');
        e.target.value = '';
        return;
      }

      setErrorMessage('');
      setScreenshotFileName(file.name);
      setScreenshotFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const emailToUse = user?.email || buyerEmail;
    if (!emailToUse || !emailToUse.includes('@')) {
      setErrorMessage('Kripya valid email ID enter karein taaki prompt aapke account me unlock ho sake.');
      return;
    }

    if (!utrNumber.trim() && !screenshotFile && !screenshotPreview) {
      setErrorMessage('Payment verify karne ke liye 12-digit UTR number dalein ya Screenshot upload karein.');
      return;
    }

    setIsSubmitting(true);
    try {
      let storedScreenshotPath: string | undefined = undefined;
      const effectiveUserId = user?.id || getPersistedGuestId();

      // Upload screenshot to private bucket "payment-screenshots"
      // Path format: "<user_id>/<timestamp>.jpg"
      // Compresses to under 1 MB first, images only
      // Stores ONLY the file path in the orders table, NOT a public URL!
      if (screenshotFile) {
        storedScreenshotPath = await dataApi.uploadPaymentScreenshot(screenshotFile, effectiveUserId);
      }

      const order = await dataApi.createOrder({
        userId: effectiveUserId,
        userEmail: emailToUse,
        itemType: itemType,
        itemId: item.id,
        amount: price,
        upiRef: utrNumber.trim() || `UPI-TXN-${Date.now().toString().slice(-6)}`,
        screenshotUrl: storedScreenshotPath, // ONLY the file path inside payment-screenshots bucket
      });

      onOrderCreated(order);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Order submit karne me dikkat aayi. Kripya dobara try karein.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-5 my-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        {!isSuccess ? (
          <div>
            {/* Header / Item Preview */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-800">
              <img
                src={itemImageUrl}
                alt={item.title}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-700"
              />
              <div className="pr-6">
                <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">
                  Unlock Premium {itemType === 'video' ? 'Video Ad' : 'Photo Prompt'}
                </span>
                <h3 className="text-base font-extrabold text-white leading-tight">
                  {item.title}
                </h3>
                <p className="text-sm font-black text-lime-400 mt-0.5">
                  ₹{price} Only
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: SCAN & PAY */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-300">
                  <QrCode className="w-4 h-4 text-lime-400" />
                  <span>Step 1: Scan QR ya UPI se Pay Karein (₹{price})</span>
                </div>

                {/* QR Code Container */}
                <div className="inline-block p-2.5 bg-white rounded-2xl shadow-md my-1">
                  <img
                    src={qrImageUrl}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 object-contain rounded-lg mx-auto"
                  />
                </div>

                {/* Prominent "Pay with UPI" button */}
                <a
                  href={upiPaymentUri}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-300 hover:brightness-105 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <span>Pay with UPI (GPay / PhonePe / Paytm)</span>
                </a>

                {/* Copy UPI ID */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-left">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">UPI ID</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-lime-400 truncate block">
                      {upiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-lime-400 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 border border-zinc-700"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STEP 2: UPLOAD PROOF */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <Upload className="w-4 h-4 text-lime-400" />
                  <span>Step 2: Upload Payment Screenshot & Details</span>
                </div>

                {/* Buyer email (if not already logged in) */}
                {!user && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Aapka Email (Prompt unlock notification ke liye) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="creator@example.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>
                )}

                {/* UTR / Transaction reference */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    12-Digit UPI Ref / UTR No. (Passbook / Receipt se)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 409218291048"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>

                {/* Screenshot file picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Payment Screenshot (Upload Photo)
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-colors text-xs text-zinc-300">
                    <Upload className="w-4 h-4 text-lime-400" />
                    <span className="truncate max-w-[200px]">
                      {screenshotFileName || t('uploadProofLabel')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {screenshotPreview && (
                    <div className="mt-2 text-center">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        className="max-h-24 rounded-lg mx-auto border border-zinc-700 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 rounded-2xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verifying & Submitting...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{t('submitPaymentBtn')}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-zinc-500 text-center">
                ⏱️ Verification timeframe: {APP_CONFIG.upi.verificationTimeEstimate}. Instant unlock once approved.
              </p>
            </form>
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <h3 className="text-xl font-extrabold text-white">
              Payment Request Submitted! 🎉
            </h3>

            <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
              Aapka payment request receive ho gaya hai. Humaari team verify karke agle{' '}
              <span className="text-lime-400 font-bold">{APP_CONFIG.upi.verificationTimeEstimate}</span> me prompt unlock kar degi.
            </p>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 text-left max-w-xs mx-auto">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Item:</span>
                <span className="text-white font-medium truncate max-w-[150px]">{item.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span>Amount:</span>
                <span className="text-lime-400 font-bold">₹{price}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Status:</span>
                <span className="text-amber-400 font-bold">Pending Approval</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => {
                  onClose();
                  onOpenMyUnlocks();
                }}
                className="w-full h-12 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-lime-300 transition-colors"
              >
                <span>My Unlocks Me Status Dekho</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors"
              >
                Browse Aur Prompts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
