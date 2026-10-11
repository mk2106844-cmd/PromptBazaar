import React from 'react';
import { X, ShieldAlert, FileText, Lock, RefreshCcw } from 'lucide-react';
import { APP_CONFIG } from '../config';

export type LegalTab = 'refund' | 'terms' | 'privacy' | 'disclaimer';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold mb-4 pr-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'terms' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Terms of Use
          </button>
          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'refund' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Refund Policy
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'privacy' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'disclaimer' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Photo Notice
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-zinc-300 leading-relaxed">
          {activeTab === 'disclaimer' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-red-300">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-300">Important Photo Privacy Notice (Dhyan Dein)</h4>
                  <p className="mt-1">
                    Users must not upload photos of others without explicit prior permission.
                  </p>
                </div>
              </div>
              <p>
                PromptBazaar community guidelines strictly prohibit using photos of third parties, celebrities, minors, or private individuals without verified legal consent.
              </p>
              <p>
                Bina ijazat kisi doosre insaan ki photo upload ya AI me recreate karna Bharat ke IT Rules aur Privacy laws ke khilaf hai. Prompts are intended for creative stock, self-portraits, and permitted commercial mockups only.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4 text-lime-400" />
                <span>Digital Products & UPI Refund Policy</span>
              </h3>
              <p>
                PromptBazaar par bikne wale AI Prompts digital downloadable secrets hain. Once an order is approved by our team and the secret text is revealed to your account, payment cannot be reversed.
              </p>
              <p>
                <strong>Duplicate / Erroneous Payments:</strong> Agar aapka UPI payment kat gaya aur order reject ho gaya ya prompt unlock nahi hua, kripya transaction screenshot ke sath humare WhatsApp support par sampark karein. Verified duplicate transactions 24-48 hours me reverse kar diye jaate hain.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-lime-400" />
                <span>Terms of Service</span>
              </h3>
              <p>
                PromptBazaar provides tested generative AI prompt blueprints for Midjourney, Flux, Stable Diffusion, and Bing Image Creator.
              </p>
              <p>
                <strong>License:</strong> Once you purchase or copy a prompt, you are free to generate images for personal, client, or commercial purposes. You may not re-sell the raw prompt text on competing prompt marketplaces.
              </p>
              <p>
                <strong>Verification:</strong> Manual UPI payments are verified by our team within 10-15 minutes during standard operational hours.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-lime-400" />
                <span>Privacy & Security</span>
              </h3>
              <p>
                Hum aapki email ID aur UPI verification screenshot ko sirf order status check karne aur unlock rights maintain karne ke liye store karte hain.
              </p>
              <p>
                Row Level Security (RLS) ensures only verified buyers can read the secret prompt text from our database.
              </p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
