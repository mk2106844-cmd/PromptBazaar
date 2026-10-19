import React, { useEffect, useState } from 'react';
import { Unlock, Clock, XCircle, Copy, Check, MessageCircle, Sparkles, RefreshCw, Video, Camera, Film, ExternalLink } from 'lucide-react';
import { Order, PhotoItem, VideoItem } from '../types';
import { APP_CONFIG } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dataApi } from '../lib/supabase';
import { useAppSettings } from '../lib/settings';

interface MyUnlocksViewProps {
  onBrowsePhotos: () => void;
  onBrowseVideos?: () => void;
  onCopySuccess: (text: string) => void;
  photoItems: PhotoItem[];
  videoItems?: VideoItem[];
}

export const MyUnlocksView: React.FC<MyUnlocksViewProps> = ({
  onBrowsePhotos,
  onBrowseVideos,
  onCopySuccess,
  photoItems,
  videoItems = [],
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const settings = useAppSettings();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedSecrets, setUnlockedSecrets] = useState<Record<string, string>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video'>('all');

  const fetchOrdersAndSecrets = async () => {
    setLoading(true);
    try {
      const userOrders = await dataApi.getUserOrders(user?.id, user?.email);
      setOrders(userOrders);

      // For every approved order (photo or video), fetch the unlocked secret
      const secretsMap: Record<string, string> = {};
      for (const order of userOrders) {
        if (order.status === 'approved') {
          if (order.item_type === 'video') {
            const secret = await dataApi.getVideoSecret(order.item_id, user?.email, false, order.user_id);
            if (secret) secretsMap[order.item_id] = secret;
          } else {
            const secret = await dataApi.getSecretPrompt(order.item_id, user?.email, false, order.user_id);
            if (secret) secretsMap[order.item_id] = secret;
          }
        }
      }
      setUnlockedSecrets(secretsMap);
    } catch (err) {
      console.error('Failed to load unlocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndSecrets();
  }, [user]);

  const handleCopy = (orderId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(orderId);
    onCopySuccess(text);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const getAssociatedItem = (order: Order) => {
    if (order.item_type === 'video') {
      const video = videoItems.find((v) => v.id === order.item_id);
      if (video) {
        return {
          title: video.title,
          image_url: video.thumbnail_url,
          category: video.category,
          is_video: true,
          duration: video.duration,
          item_type: video.item_type,
        };
      }
    }

    const photo = photoItems.find((p) => p.id === order.item_id);
    if (photo) {
      return {
        title: photo.title,
        image_url: photo.image_url,
        category: photo.category,
        is_video: false,
      };
    }

    return null;
  };

  const filteredOrders = orders.filter((o) => {
    if (typeFilter === 'all') return true;
    return o.item_type === typeFilter;
  });

  const currentWhatsapp = settings.whatsappNumber || APP_CONFIG.whatsapp.number;
  const whatsappSupportUrl = `https://wa.me/${currentWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    APP_CONFIG.whatsapp.supportMessage
  )}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Unlock className="w-6 h-6 text-lime-400" />
            <span>{t('myUnlocksTitle')}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {user ? `Logged in: ${user.email}` : 'Guest session (Log in to sync across devices)'}
          </p>
        </div>

        <button
          onClick={fetchOrdersAndSecrets}
          title="Refresh orders"
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs: All | Photos | Video Ads */}
      {orders.length > 0 && (
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold w-fit">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'all' ? 'bg-lime-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setTypeFilter('photo')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'photo' ? 'bg-lime-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos ({orders.filter((o) => o.item_type === 'photo').length})</span>
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'video' ? 'bg-lime-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Ads ({orders.filter((o) => o.item_type === 'video').length})</span>
          </button>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-lime-400/30 border-t-lime-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading your unlocked items...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Unlock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              No Unlocked Items Yet
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {t('noUnlocksYet')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={onBrowsePhotos}
              className="px-5 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Explore Photo Prompts</span>
            </button>
            {onBrowseVideos && (
              <button
                onClick={onBrowseVideos}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-2 active:scale-95 transition-all"
              >
                <Video className="w-4 h-4 text-lime-400" />
                <span>Explore Video Ads</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const item = getAssociatedItem(order);
            const secretContent = unlockedSecrets[order.item_id];
            const isApproved = order.status === 'approved';
            const isPending = order.status === 'pending';
            const isRejected = order.status === 'rejected';
            const isVideo = order.item_type === 'video';

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 bg-zinc-900 transition-all ${
                  isApproved
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : isPending
                    ? 'border-amber-500/40'
                    : 'border-red-500/30'
                }`}
              >
                {/* Top status & date */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    {/* Item type badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isVideo
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                    }`}>
                      {isVideo ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                      <span>{isVideo ? 'Video Ad' : 'Photo Prompt'}</span>
                    </span>

                    {/* Status Pill */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Check className="w-3 h-3" />
                        <span>{t('statusApproved')}</span>
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>{t('statusPending')}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                        <XCircle className="w-3 h-3" />
                        <span>{t('statusRejected')}</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Item Details */}
                <div className="flex items-start gap-3">
                  {item?.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {item?.title || `Item #${order.item_id.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-lime-400 font-bold">
                        Paid: ₹{order.amount}
                      </span>
                      {item?.duration && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1 rounded">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                      UTR: {order.upi_ref}
                    </p>
                  </div>
                </div>

                {/* UNLOCKED CONTENT (when approved) */}
                {isApproved && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isVideo ? 'Unlocked Video Prompt & Assets:' : 'Full Unlocked Prompt Text:'}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-950/60 font-mono text-xs text-emerald-200 select-all leading-relaxed max-h-40 overflow-y-auto">
                      {secretContent || 'Please contact support if your prompt is empty.'}
                    </div>

                    <button
                      onClick={() => handleCopy(order.id, secretContent || '')}
                      className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        copiedOrderId === order.id
                          ? 'bg-emerald-400 text-zinc-950 shadow'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {copiedOrderId === order.id ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Copied to Clipboard! ✨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{isVideo ? 'Copy Video Prompt / Assets' : 'Copy Unlocked Prompt'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* PENDING NOTICE */}
                {isPending && (
                  <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Payment verification in progress. Jaise hi approve hoga, prompt yahan unlock ho jayega.
                    </span>
                  </div>
                )}

                {/* REJECTED NOTICE & SUPPORT */}
                {isRejected && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-xs text-red-300 flex items-center justify-between gap-2">
                    <span>Payment match nahi hua. WhatsApp support se contact karein.</span>
                    <a
                      href={whatsappSupportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Help
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
