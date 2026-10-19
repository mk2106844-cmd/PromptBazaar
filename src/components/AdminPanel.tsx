import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Video,
  DollarSign,
  Database,
  Film,
  Sparkles,
  Star,
  Search,
  Filter,
  Layers,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Tag,
  AlertCircle,
  Sliders,
  QrCode,
  MessageCircle,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import { PhotoItem, VideoItem, Order } from '../types';
import { APP_CONFIG, PhotoCategory } from '../config';
import { useAuth } from '../context/AuthContext';
import { dataApi, isSupabaseConfigured, supabase } from '../lib/supabase';
import { compressImageTo500KB, validateVideoFile } from '../lib/compression';
import { StorageUsageBar } from './StorageUsageBar';
import { BulkPhotoModal } from './BulkPhotoModal';
import { ADMIN_UPGRADE_SQL } from '../lib/adminSqlMigration';
import { getAppSettings, saveAppSettings } from '../lib/settings';
import { getUpiQrImageUrl } from '../lib/qr';

interface AdminPanelProps {
  onPhotosUpdated: () => void;
  onVideosUpdated?: () => void;
  onOpenSqlModal: () => void;
  onOpenAuth?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onPhotosUpdated,
  onVideosUpdated,
  onOpenSqlModal,
  onOpenAuth,
}) => {
  const { user, isAdmin, setDemoUser } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'photos' | 'videos' | 'orders' | 'settings' | 'supabase'>('photos');

  // Storage Usage State (used vs 1 GB)
  const [storageUsage, setStorageUsage] = useState({
    usedBytes: 142606336,
    usedMB: 136,
    totalMB: 1024,
    percentage: 13.3,
    isWarning: false,
  });

  // Custom Categories
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Toast / Feedback state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // In-App Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    type: 'photo' | 'video';
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // --- PHOTO MANAGEMENT STATE ---
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isBulkPhotoModalOpen, setIsBulkPhotoModalOpen] = useState(false);

  // Photo filters & search
  const [photoSearch, setPhotoSearch] = useState('');
  const [photoStatusFilter, setPhotoStatusFilter] = useState<'all' | 'published' | 'draft' | 'featured' | 'free' | 'paid'>('all');
  const [photoCatFilter, setPhotoCatFilter] = useState<string>('all');

  // Photo form fields
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState<string>('Wedding / Dulhan');
  const [pIsPaid, setPIsPaid] = useState(false);
  const [pPrice, setPPrice] = useState(29);
  const [pImageUrl, setPImageUrl] = useState('');
  const [pPromptText, setPPromptText] = useState('');
  const [pIsPublished, setPIsPublished] = useState(true);
  const [pIsFeatured, setPIsFeatured] = useState(false);
  const [pCompressing, setPCompressing] = useState(false);
  const [pCompressInfo, setPCompressInfo] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // --- VIDEO MANAGEMENT STATE ---
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Video filters & search
  const [videoSearch, setVideoSearch] = useState('');
  const [videoStatusFilter, setVideoStatusFilter] = useState<'all' | 'published' | 'draft' | 'featured' | 'free' | 'paid'>('all');
  const [videoCatFilter, setVideoCatFilter] = useState<string>('all');

  // Video form fields
  const [vTitle, setVTitle] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vCategory, setVCategory] = useState<string>('Shop / Dukaan');
  const [vItemType, setVItemType] = useState<'prompt' | 'ready_video'>('prompt');
  const [vDuration, setVDuration] = useState('0:30');
  const [vThumbnailUrl, setVThumbnailUrl] = useState('');
  const [vVideoUrl, setVVideoUrl] = useState('');
  const [vExternalLink, setVExternalLink] = useState('');
  const [vIsPaid, setVIsPaid] = useState(true);
  const [vPrice, setVPrice] = useState(39);
  const [vContent, setVContent] = useState('');
  const [vIsPublished, setVIsPublished] = useState(true);
  const [vIsFeatured, setVIsFeatured] = useState(false);
  const [vThumbCompressing, setVThumbCompressing] = useState(false);
  const [vThumbCompressInfo, setVThumbCompressInfo] = useState<string | null>(null);
  const [vVideoWarning, setVVideoWarning] = useState<string | null>(null);
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // --- ORDERS STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [previewScreenshotPath, setPreviewScreenshotPath] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  // Exact user requirement: Show screenshot using supabase.storage.from('payment-screenshots').createSignedUrl(path, 300)
  const handleViewScreenshot = async (path: string) => {
    if (!path) return;
    setPreviewScreenshotPath(path);
    setLoadingScreenshot(true);
    setPreviewScreenshotUrl(null);

    try {
      // 1. If legacy full URL or data URL
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        setPreviewScreenshotUrl(path);
        return;
      }

      // 2. Fetch secure 300s signed URL from private bucket 'payment-screenshots'
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.storage
          .from('payment-screenshots')
          .createSignedUrl(path, 300);

        if (error || !data?.signedUrl) {
          showFeedback('Screenshot load nahi ho saka: ' + (error?.message || 'Signed URL error'), 'error');
          return;
        }

        setPreviewScreenshotUrl(data.signedUrl);
        return;
      }

      // 3. Local fallback for mock/offline testing
      const local = localStorage.getItem(`promptbazaar_screenshot_${path}`);
      if (local) {
        setPreviewScreenshotUrl(local);
      } else {
        showFeedback(`Screenshot "${path}" storage me nahi mila.`, 'error');
      }
    } catch (err: any) {
      showFeedback('Screenshot fetch error: ' + err.message, 'error');
    } finally {
      setLoadingScreenshot(false);
    }
  };

  // SQL Copy state
  const [copiedSql, setCopiedSql] = useState(false);

  // --- APP SETTINGS STATE ---
  const [settingUpiId, setSettingUpiId] = useState(APP_CONFIG.upi.id);
  const [settingPayeeName, setSettingPayeeName] = useState(APP_CONFIG.upi.payeeName);
  const [settingWhatsapp, setSettingWhatsapp] = useState(APP_CONFIG.whatsapp.number);
  const [settingQrUrl, setSettingQrUrl] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [storageRlsNotice, setStorageRlsNotice] = useState(false);

  useEffect(() => {
    // Single source of truth: Load from Supabase table app_settings (id = 'default')
    dataApi.getAppSettingsFromDb().then((dbSettings) => {
      if (dbSettings) {
        setSettingUpiId(dbSettings.upiId);
        setSettingPayeeName(dbSettings.payeeName);
        setSettingWhatsapp(dbSettings.whatsappNumber);
        setSettingQrUrl(dbSettings.qrImageUrl || '');
      } else {
        const current = getAppSettings();
        setSettingUpiId(current.upiId);
        setSettingPayeeName(current.payeeName);
        setSettingWhatsapp(current.whatsappNumber);
        setSettingQrUrl(current.qrImageUrl || '');
      }
    });
  }, []);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Kripya sirf valid image file (JPG, PNG, WEBP) upload karein.', 'error');
      return;
    }

    setIsUploadingQr(true);
    setStorageRlsNotice(false);
    try {
      showFeedback('QR image Supabase storage bucket "media" me upload ho rahi hai...');
      // Uploads directly to Supabase storage bucket 'media' and returns ONLY public URL (never base64)
      const uploadedPublicUrl = await dataApi.uploadPaymentQrImage(file);
      setSettingQrUrl(uploadedPublicUrl);
      showFeedback('QR code "media" bucket me upload ho gaya! "Save Settings" dabakar live save karein. ✅');
    } catch (err: any) {
      console.warn('QR upload notice:', err.message || err);
      const isRls = err.message?.toLowerCase().includes('row-level security') || 
                    err.message?.toLowerCase().includes('rls') || 
                    err.message?.toLowerCase().includes('policy');
      if (isRls) {
        setStorageRlsNotice(true);
      }
      showFeedback(
        isRls
          ? 'Storage RLS Policy Notice: "media" bucket me write policy missing hai. "SQL Setup" se updated SQL run karein.'
          : 'QR upload notice: ' + err.message,
        'error'
      );
    } finally {
      setIsUploadingQr(false);
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingUpiId.trim() || !settingUpiId.includes('@')) {
      showFeedback('Kripya valid UPI ID enter karein (e.g. 9718936211@ibl)', 'error');
      return;
    }
    if (!settingWhatsapp.trim()) {
      showFeedback('Kripya valid WhatsApp number enter karein', 'error');
      return;
    }

    // Strictly ensure no base64 text is saved in app_settings table
    if (settingQrUrl && settingQrUrl.startsWith('data:')) {
      showFeedback('Base64 image allowed nahi hai. Kripya image file upload karein taaki yeh "media" bucket me save ho sake.', 'error');
      return;
    }

    setIsSavingSettings(true);
    try {
      // Saves directly into Supabase table app_settings (id = 'default')
      await saveAppSettings({
        upiId: settingUpiId.trim(),
        payeeName: settingPayeeName.trim() || 'PromptBazaar',
        whatsappNumber: settingWhatsapp.trim(),
        qrImageUrl: settingQrUrl.trim(),
      });
      showFeedback('Settings Supabase table app_settings (id = "default") me safalta-purvak save ho gayi! 🎉');
    } catch (err: any) {
      showFeedback('Settings save karne me error: ' + err.message, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Drag-and-drop state
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);

  const fetchAdminData = async () => {
    setLoadingPhotos(true);
    setLoadingVideos(true);
    setLoadingOrders(true);
    try {
      const [photoData, videoData, orderData, usage] = await Promise.all([
        dataApi.getAllPhotoItemsAdmin(),
        dataApi.getAllVideoItemsAdmin(),
        dataApi.getAllOrdersAdmin(),
        dataApi.getStorageUsage(),
      ]);
      setPhotos(photoData);
      setVideos(videoData);
      setOrders(orderData);
      setStorageUsage(usage);
      setCustomCategories(dataApi.getCustomCategories());
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showFeedback('Data load karne me problem aayi: ' + err.message, 'error');
    } finally {
      setLoadingPhotos(false);
      setLoadingVideos(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // CATEGORIES LIST (combines config + custom created)
  const allPhotoCategories = Array.from(
    new Set([...APP_CONFIG.photoCategories.filter((c) => c !== 'All'), ...customCategories])
  );

  const allVideoCategories = Array.from(
    new Set([...APP_CONFIG.videoCategories, ...customCategories])
  );

  // --- PHOTO ACTIONS ---
  const openAddPhotoModal = () => {
    setEditingPhoto(null);
    setPTitle('');
    setPDesc('');
    setPCategory('Wedding / Dulhan');
    setPIsPaid(false);
    setPPrice(29);
    setPImageUrl('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80');
    setPPromptText('');
    setPIsPublished(true);
    setPIsFeatured(false);
    setPCompressInfo(null);
    setIsCreatingNewCat(false);
    setIsPhotoModalOpen(true);
  };

  const openEditPhotoModal = async (item: PhotoItem) => {
    setEditingPhoto(item);
    setPTitle(item.title);
    setPDesc(item.description);
    setPCategory(item.category || 'Trending');
    setPIsPaid(item.is_paid);
    setPPrice(item.price || 29);
    setPImageUrl(item.image_url);
    setPIsPublished(item.is_published);
    setPIsFeatured(item.is_featured ?? false);
    setPCompressInfo(null);
    setIsCreatingNewCat(false);

    if (item.is_paid) {
      const secret = await dataApi.getSecretPrompt(item.id, user?.email, true);
      setPPromptText(secret || '');
    } else {
      setPPromptText(item.free_prompt_text || '');
    }

    setIsPhotoModalOpen(true);
  };

  // Image Upload with Auto-compression to under 500 KB
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPCompressing(true);
    setPCompressInfo('Compressing image to < 500 KB...');

    try {
      const compressed = await compressImageTo500KB(file);
      const originalKB = Math.round(compressed.originalSizeBytes / 1024);
      const compressedKB = Math.round(compressed.compressedSizeBytes / 1024);
      setPCompressInfo(`Compressed: ${originalKB} KB ➔ ${compressedKB} KB (< 500 KB ✅)`);

      // Upload to storage bucket
      const uploadedUrl = await dataApi.uploadMediaFile(compressed.file);
      setPImageUrl(uploadedUrl);

      // Refresh storage usage
      const usage = await dataApi.getStorageUsage();
      setStorageUsage(usage);

      showFeedback(`Image auto-compress ho gayi (${compressedKB} KB) aur upload ho gayi! ✅`);
    } catch (err: any) {
      setPCompressInfo('Compression failed: ' + err.message);
      showFeedback('Image compression fail hua: ' + err.message, 'error');
    } finally {
      setPCompressing(false);
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim() || !pImageUrl.trim() || !pPromptText.trim()) {
      showFeedback('Kripya Title, Image URL aur Prompt text dalein!', 'error');
      return;
    }

    let finalCategory = pCategory;
    if (isCreatingNewCat && newCatInput.trim()) {
      dataApi.saveCustomCategory(newCatInput.trim());
      finalCategory = newCatInput.trim();
      setCustomCategories(dataApi.getCustomCategories());
    }

    setIsSavingPhoto(true);
    try {
      await dataApi.savePhotoItem(
        {
          id: editingPhoto?.id,
          title: pTitle.trim(),
          description: pDesc.trim(),
          category: finalCategory,
          is_paid: pIsPaid,
          price: pIsPaid ? Number(pPrice) : 0,
          image_url: pImageUrl.trim(),
          is_published: pIsPublished,
          is_featured: pIsFeatured,
        },
        pPromptText.trim()
      );

      setIsPhotoModalOpen(false);
      await fetchAdminData();
      onPhotosUpdated();
      showFeedback(
        editingPhoto
          ? 'Photo prompt successfully update ho gaya! ✅'
          : 'Naya photo prompt publish ho gaya! 🎉'
      );
    } catch (err: any) {
      showFeedback('Error saving photo: ' + err.message, 'error');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhoto = (id: string, title: string) => {
    setDeleteModal({
      type: 'photo',
      id,
      title,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    const { type, id, title } = deleteModal;
    setIsDeletingItem(true);

    try {
      if (type === 'photo') {
        // Deletes row from photo_secrets first, then deletes item from photo_items
        await dataApi.deletePhotoItem(id);
        await fetchAdminData();
        onPhotosUpdated();
        showFeedback(`"${title}" successfully delete ho gaya! 🗑️`, 'success');
      } else {
        // Deletes row from video_secrets first, then deletes item from video_items
        await dataApi.deleteVideoItem(id);
        await fetchAdminData();
        if (onVideosUpdated) onVideosUpdated();
        showFeedback(`Video "${title}" successfully delete ho gaya! 🗑️`, 'success');
      }
      setDeleteModal(null);
    } catch (err: any) {
      console.error('Delete item error:', err);
      const realErrMsg = err?.message || (typeof err === 'string' ? err : 'Unknown deletion error');
      showFeedback(`Delete failed: ${realErrMsg}`, 'error');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleTogglePhotoPublish = async (item: PhotoItem) => {
    const nextStatus = !item.is_published;
    await dataApi.togglePhotoPublish(item.id, nextStatus);
    setPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_published: nextStatus } : p))
    );
    onPhotosUpdated();
    showFeedback(
      nextStatus ? 'Item live publish ho gaya! 👁️' : 'Item unpublish (Draft) ho gaya. 🚫'
    );
  };

  const handleTogglePhotoFeatured = async (item: PhotoItem) => {
    const nextFeatured = !item.is_featured;
    await dataApi.togglePhotoFeatured(item.id, nextFeatured);
    setPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_featured: nextFeatured } : p))
    );
    onPhotosUpdated();
    showFeedback(
      nextFeatured
        ? 'Item Home page ke Featured me add ho gaya! ⭐'
        : 'Item Featured se hata diya gaya.'
    );
  };

  // Reorder Photos (Move Up / Down & Drag)
  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setPhotos(reordered);
    await dataApi.reorderPhotoItems(reordered);
    onPhotosUpdated();
    showFeedback('Photo order update ho gaya! ↕️');
  };

  const handleDropPhoto = async (targetIndex: number) => {
    if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) return;

    const reordered = [...photos];
    const [moved] = reordered.splice(draggedPhotoIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setPhotos(reordered);
    setDraggedPhotoIndex(null);
    await dataApi.reorderPhotoItems(reordered);
    onPhotosUpdated();
    showFeedback('Photo items reorder ho gaye! 🎯');
  };

  // --- VIDEO ACTIONS ---
  const openAddVideoModal = () => {
    setEditingVideo(null);
    setVTitle('');
    setVDesc('');
    setVCategory('Shop / Dukaan');
    setVItemType('prompt');
    setVDuration('0:30');
    setVThumbnailUrl('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80');
    setVVideoUrl('');
    setVExternalLink('');
    setVIsPaid(true);
    setVPrice(39);
    setVContent('');
    setVIsPublished(true);
    setVIsFeatured(false);
    setVThumbCompressInfo(null);
    setVVideoWarning(null);
    setIsCreatingNewCat(false);
    setIsVideoModalOpen(true);
  };

  const openEditVideoModal = async (item: VideoItem) => {
    setEditingVideo(item);
    setVTitle(item.title);
    setVDesc(item.description);
    setVCategory(item.category || 'Shop / Dukaan');
    setVItemType(item.item_type || 'prompt');
    setVDuration(item.duration || '0:30');
    setVThumbnailUrl(item.thumbnail_url);
    setVVideoUrl(item.video_url || '');
    setVExternalLink(item.external_video_url || '');
    setVIsPaid(item.is_paid);
    setVPrice(item.price || 39);
    setVIsPublished(item.is_published);
    setVIsFeatured(item.is_featured ?? false);
    setVThumbCompressInfo(null);
    setVVideoWarning(null);
    setIsCreatingNewCat(false);

    if (item.is_paid) {
      const secret = await dataApi.getVideoSecret(item.id, user?.email, true);
      setVContent(secret || '');
    } else {
      setVContent(item.free_content || '');
    }

    setIsVideoModalOpen(true);
  };

  // Video Thumbnail Upload (<500 KB)
  const handleVideoThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVThumbCompressing(true);
    setVThumbCompressInfo('Compressing thumbnail to < 500 KB...');

    try {
      const compressed = await compressImageTo500KB(file);
      const originalKB = Math.round(compressed.originalSizeBytes / 1024);
      const compressedKB = Math.round(compressed.compressedSizeBytes / 1024);
      setVThumbCompressInfo(`Compressed: ${originalKB} KB ➔ ${compressedKB} KB (< 500 KB ✅)`);

      const uploadedUrl = await dataApi.uploadMediaFile(compressed.file);
      setVThumbnailUrl(uploadedUrl);

      const usage = await dataApi.getStorageUsage();
      setStorageUsage(usage);
      showFeedback(`Thumbnail compress ho gayi (${compressedKB} KB)! ✅`);
    } catch (err: any) {
      setVThumbCompressInfo('Compression error: ' + err.message);
      showFeedback('Thumbnail compression fail hua: ' + err.message, 'error');
    } finally {
      setVThumbCompressing(false);
    }
  };

  // Preview Video Upload (Max 10 MB)
  const handlePreviewVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setVVideoWarning(validation.warning || 'Video 10 MB se badi hai!');
      showFeedback(validation.warning || 'Video size 10 MB se badi hai!', 'error');
      e.target.value = '';
      return;
    }

    setVVideoWarning(null);
    showFeedback(`Video size valid hai (${validation.sizeMB} MB). Uploading...`);

    try {
      const uploadedUrl = await dataApi.uploadMediaFile(file, 'media');
      setVVideoUrl(uploadedUrl);

      const usage = await dataApi.getStorageUsage();
      setStorageUsage(usage);
      showFeedback(`Preview video successfully upload ho gaya (${validation.sizeMB} MB)! ✅`);
    } catch (err: any) {
      showFeedback('Video upload failed: ' + err.message, 'error');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vTitle.trim() || !vThumbnailUrl.trim() || (!vContent.trim() && !vExternalLink.trim())) {
      showFeedback('Kripya Title, Thumbnail, aur Prompt ya Full Video Link bharein!', 'error');
      return;
    }

    let finalCategory = vCategory;
    if (isCreatingNewCat && newCatInput.trim()) {
      dataApi.saveCustomCategory(newCatInput.trim());
      finalCategory = newCatInput.trim();
      setCustomCategories(dataApi.getCustomCategories());
    }

    setIsSavingVideo(true);
    try {
      await dataApi.saveVideoItem(
        {
          id: editingVideo?.id,
          title: vTitle.trim(),
          description: vDesc.trim(),
          category: finalCategory,
          item_type: vItemType,
          duration: vDuration.trim(),
          thumbnail_url: vThumbnailUrl.trim(),
          video_url: vVideoUrl.trim() || undefined,
          external_video_url: vExternalLink.trim() || undefined,
          is_paid: vIsPaid,
          price: vIsPaid ? Number(vPrice) : 0,
          is_published: vIsPublished,
          is_featured: vIsFeatured,
        },
        vContent.trim()
      );

      setIsVideoModalOpen(false);
      await fetchAdminData();
      if (onVideosUpdated) onVideosUpdated();
      showFeedback(
        editingVideo
          ? 'Video ad successfully update ho gaya! ✅'
          : 'Naya video ad publish ho gaya! 🎉'
      );
    } catch (err: any) {
      showFeedback('Error saving video: ' + err.message, 'error');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleDeleteVideo = (id: string, title: string) => {
    setDeleteModal({
      type: 'video',
      id,
      title,
    });
  };

  const handleToggleVideoPublish = async (item: VideoItem) => {
    const nextStatus = !item.is_published;
    await dataApi.toggleVideoPublish(item.id, nextStatus);
    setVideos((prev) =>
      prev.map((v) => (v.id === item.id ? { ...v, is_published: nextStatus } : v))
    );
    if (onVideosUpdated) onVideosUpdated();
    showFeedback(
      nextStatus ? 'Video live publish ho gaya! 👁️' : 'Video unpublish (Draft) ho gaya. 🚫'
    );
  };

  const handleToggleVideoFeatured = async (item: VideoItem) => {
    const nextFeatured = !item.is_featured;
    await dataApi.toggleVideoFeatured(item.id, nextFeatured);
    setVideos((prev) =>
      prev.map((v) => (v.id === item.id ? { ...v, is_featured: nextFeatured } : v))
    );
    if (onVideosUpdated) onVideosUpdated();
    showFeedback(
      nextFeatured
        ? 'Video Home page ke Featured me add ho gaya! ⭐'
        : 'Video Featured se hata diya gaya.'
    );
  };

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const reordered = [...videos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setVideos(reordered);
    await dataApi.reorderVideoItems(reordered);
    if (onVideosUpdated) onVideosUpdated();
    showFeedback('Video order update ho gaya! ↕️');
  };

  const handleDropVideo = async (targetIndex: number) => {
    if (draggedVideoIndex === null || draggedVideoIndex === targetIndex) return;

    const reordered = [...videos];
    const [moved] = reordered.splice(draggedVideoIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setVideos(reordered);
    setDraggedVideoIndex(null);
    await dataApi.reorderVideoItems(reordered);
    if (onVideosUpdated) onVideosUpdated();
    showFeedback('Video items reorder ho gaye! 🎯');
  };

  // --- ORDER APPROVALS ---
  const handleOrderStatusChange = async (orderId: string, status: 'approved' | 'rejected') => {
    const success = await dataApi.updateOrderStatus(orderId, status);
    if (success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      showFeedback(
        status === 'approved'
          ? 'Order Approve ho gaya! Prompt unlock kar diya gaya hai. ✅'
          : 'Order Reject ho gaya.'
      );
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(ADMIN_UPGRADE_SQL);
    setCopiedSql(true);
    showFeedback('Updated SQL script copy ho gaya! 📋');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // If user is not admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Admin Access Restricted</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Yeh panel sirf authorized admin email ({APP_CONFIG.adminEmails.join(', ')}) ke liye protected hai.
        </p>
        <button
          onClick={() => setDemoUser(APP_CONFIG.adminEmails[0], true)}
          className="w-full h-11 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow"
        >
          <Shield className="w-4 h-4" />
          <span>Switch to Admin Account ({APP_CONFIG.adminEmails[0]})</span>
        </button>
      </div>
    );
  }

  // Filtered Photo Items
  const filteredPhotos = photos.filter((item) => {
    if (photoSearch.trim()) {
      const q = photoSearch.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchDesc) return false;
    }
    if (photoCatFilter !== 'all' && item.category !== photoCatFilter) return false;
    if (photoStatusFilter === 'published' && !item.is_published) return false;
    if (photoStatusFilter === 'draft' && item.is_published) return false;
    if (photoStatusFilter === 'featured' && !item.is_featured) return false;
    if (photoStatusFilter === 'free' && item.is_paid) return false;
    if (photoStatusFilter === 'paid' && !item.is_paid) return false;
    return true;
  });

  // Filtered Video Items
  const filteredVideos = videos.filter((item) => {
    if (videoSearch.trim()) {
      const q = videoSearch.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchDesc) return false;
    }
    if (videoCatFilter !== 'all' && item.category !== videoCatFilter) return false;
    if (videoStatusFilter === 'published' && !item.is_published) return false;
    if (videoStatusFilter === 'draft' && item.is_published) return false;
    if (videoStatusFilter === 'featured' && !item.is_featured) return false;
    if (videoStatusFilter === 'free' && item.is_paid) return false;
    if (videoStatusFilter === 'paid' && !item.is_paid) return false;
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xl animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">PromptBazaar Pro Admin</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Logged in as <span className="text-lime-400 font-mono font-bold">{user?.email}</span> (RLS Protected)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeAdminTab === 'photos' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBulkPhotoModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-lime-400 border border-zinc-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Bulk Add (Max 20)</span>
              </button>

              <button
                onClick={openAddPhotoModal}
                className="px-4 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-lime-300 transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Single</span>
              </button>
            </div>
          )}

          {activeAdminTab === 'videos' && (
            <button
              onClick={openAddVideoModal}
              className="px-4 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:bg-lime-300 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Naya Video Ad Add Karein</span>
            </button>
          )}
        </div>
      </div>

      {/* Session Verification Notice for Supabase Writes */}
      {isSupabaseConfigured && user && (user.id.startsWith('creator-') || user.id.startsWith('user-')) && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Supabase Sync Notice:</strong> Supabase cloud database me live photo prompts aur changes save karne ke liye verified admin email (<code className="text-lime-300 font-bold">mk2106844@gmail.com</code>) se login hona zaroori hai.
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs shrink-0 transition-colors shadow-sm"
            >
              Admin Sign In
            </button>
          )}
        </div>
      )}

      {/* STORAGE USAGE BAR (Used vs 1 GB) */}
      <StorageUsageBar
        usedMB={storageUsage.usedMB}
        totalMB={storageUsage.totalMB}
        percentage={storageUsage.percentage}
        isWarning={storageUsage.isWarning}
        onRefresh={fetchAdminData}
      />

      {/* Admin Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 text-xs font-bold">
        <button
          onClick={() => setActiveAdminTab('photos')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeAdminTab === 'photos'
              ? 'bg-lime-400 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photos ({photos.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('videos')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeAdminTab === 'videos'
              ? 'bg-lime-400 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Videos ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all relative ${
            activeAdminTab === 'orders'
              ? 'bg-lime-400 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-zinc-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeAdminTab === 'settings'
              ? 'bg-lime-400 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('supabase')}
          className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeAdminTab === 'supabase'
              ? 'bg-lime-400 text-zinc-950 shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>SQL</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PHOTO ITEMS MANAGER */}
      {/* ============================================================== */}
      {activeAdminTab === 'photos' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={photoSearch}
                onChange={(e) => setPhotoSearch(e.target.value)}
                placeholder="Search photo items by title, category..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={photoStatusFilter}
                onChange={(e) => setPhotoStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published Only</option>
                <option value="draft">Draft Only</option>
                <option value="featured">Featured (⭐ Home)</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>

              <select
                value={photoCatFilter}
                onChange={(e) => setPhotoCatFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                {allPhotoCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center justify-between px-1">
            <span>Showing {filteredPhotos.length} of {photos.length} items</span>
            <span className="text-zinc-500">💡 Drag items or use ⬆️⬇️ to reorder</span>
          </div>

          {/* Photos List */}
          {loadingPhotos ? (
            <div className="py-12 text-center text-zinc-400 text-xs">Loading photo items...</div>
          ) : filteredPhotos.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              Koi item match nahi hua. Filters reset karein ya naya item add karein.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPhotos.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedPhotoIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropPhoto(index)}
                  className={`bg-zinc-900 border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all ${
                    draggedPhotoIndex === index ? 'opacity-40 border-dashed border-lime-400' : 'border-zinc-800'
                  }`}
                >
                  {/* Left: Drag Handle, Thumbnail, Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder Buttons & Drag Handle */}
                    <div className="flex flex-col items-center justify-center gap-1 text-zinc-500 cursor-grab active:cursor-grabbing">
                      <button
                        onClick={() => handleMovePhoto(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="hover:text-lime-400 disabled:opacity-20 p-0.5"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-4 h-4 text-zinc-600" />
                      <button
                        onClick={() => handleMovePhoto(index, 'down')}
                        disabled={index === photos.length - 1}
                        title="Move Down"
                        className="hover:text-lime-400 disabled:opacity-20 p-0.5"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0 bg-black"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {/* Free / Paid */}
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            item.is_paid
                              ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {item.is_paid ? `PAID ₹${item.price}` : 'FREE'}
                        </span>

                        {/* Status: Published / Draft */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.is_published
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.is_published ? 'Published' : 'Draft'}
                        </span>

                        {/* Featured Badge */}
                        {item.is_featured && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            Featured
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-500 truncate">
                          {item.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    {/* Featured Toggle Button */}
                    <button
                      onClick={() => handleTogglePhotoFeatured(item)}
                      title={item.is_featured ? 'Remove from Home Featured' : 'Put on Home Page Featured'}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        item.is_featured
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-amber-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePhotoPublish(item)}
                      title={item.is_published ? 'Unpublish (Mark as Draft)' : 'Publish to Store'}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        item.is_published
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditPhotoModal(item)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeletePhoto(item.id, item.title)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: VIDEO ITEMS MANAGER */}
      {/* ============================================================== */}
      {activeAdminTab === 'videos' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                placeholder="Search video items by title, category..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={videoStatusFilter}
                onChange={(e) => setVideoStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published Only</option>
                <option value="draft">Draft Only</option>
                <option value="featured">Featured (⭐ Home)</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>

              <select
                value={videoCatFilter}
                onChange={(e) => setVideoCatFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                {allVideoCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center justify-between px-1">
            <span>Showing {filteredVideos.length} of {videos.length} videos</span>
            <span className="text-zinc-500">💡 Drag items or use ⬆️⬇️ to reorder</span>
          </div>

          {loadingVideos ? (
            <div className="py-12 text-center text-zinc-400 text-xs">Loading video items...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              Koi video ad match nahi hua. Naya video ad create karein!
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredVideos.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedVideoIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropVideo(index)}
                  className={`bg-zinc-900 border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all ${
                    draggedVideoIndex === index ? 'opacity-40 border-dashed border-lime-400' : 'border-zinc-800'
                  }`}
                >
                  {/* Left: Reorder, Thumbnail, Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center gap-1 text-zinc-500 cursor-grab active:cursor-grabbing">
                      <button
                        onClick={() => handleMoveVideo(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="hover:text-lime-400 disabled:opacity-20 p-0.5"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-4 h-4 text-zinc-600" />
                      <button
                        onClick={() => handleMoveVideo(index, 'down')}
                        disabled={index === videos.length - 1}
                        title="Move Down"
                        className="hover:text-lime-400 disabled:opacity-20 p-0.5"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 shrink-0 bg-black">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono px-1 rounded text-zinc-300">
                        {item.duration || '0:30'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            item.is_paid
                              ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {item.is_paid ? `PAID ₹${item.price}` : 'FREE'}
                        </span>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            item.item_type === 'prompt'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {item.item_type === 'prompt' ? 'Prompt' : 'Reel'}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.is_published ? 'bg-blue-500/20 text-blue-300' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.is_published ? 'Published' : 'Draft'}
                        </span>

                        {item.is_featured && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            Featured
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-500 truncate">{item.category}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <button
                      onClick={() => handleToggleVideoFeatured(item)}
                      title={item.is_featured ? 'Remove from Home Featured' : 'Put on Home Page Featured'}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        item.is_featured
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-amber-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${item.is_featured ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleToggleVideoPublish(item)}
                      title={item.is_published ? 'Unpublish (Mark as Draft)' : 'Publish to Store'}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        item.is_published
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => openEditVideoModal(item)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      title="Edit Video Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteVideo(item.id, item.title)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                      title="Delete Video Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ORDERS & APPROVALS */}
      {/* ============================================================== */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  orderFilter === status
                    ? 'bg-zinc-800 text-lime-400 border border-lime-400/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {status} ({orders.filter((o) => status === 'all' || o.status === status).length})
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              Is filter me koi orders nahi hain.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'pending';
                const isApproved = order.status === 'approved';
                const isRejected = order.status === 'rejected';
                const isVideo = order.item_type === 'video';

                return (
                  <div
                    key={order.id}
                    className={`bg-zinc-900 border rounded-2xl p-4 transition-all ${
                      isPending ? 'border-amber-500/40' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              isApproved
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              isVideo ? 'bg-purple-500/20 text-purple-300' : 'bg-lime-500/20 text-lime-400'
                            }`}
                          >
                            {isVideo ? 'Video Ad' : 'Photo'}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            {order.user_email}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Item ID: <span className="font-mono text-zinc-300">{order.item_id}</span> • UTR:{' '}
                          <span className="font-mono text-lime-400 font-bold">{order.upi_ref}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-lime-400">
                          ₹{order.amount}
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          {new Date(order.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3">
                      {order.screenshot_url ? (
                        <button
                          onClick={() => handleViewScreenshot(order.screenshot_url || '')}
                          className="flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 font-semibold cursor-pointer active:scale-95 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Payment Screenshot</span>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">No screenshot attached</span>
                      )}

                      <div className="flex items-center gap-2">
                        {order.status !== 'approved' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 shadow transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Approve & Unlock</span>
                          </button>
                        )}
                        {order.status !== 'rejected' && (
                          <button
                            onClick={() => handleOrderStatusChange(order.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-1 border border-zinc-700 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: APP SETTINGS (UPI ID, PAYMENT QR IMAGE, WHATSAPP) */}
      {/* ============================================================== */}
      {activeAdminTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="pb-4 border-b border-zinc-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-lime-400" />
              <span>Payment & Contact Settings</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Bina code change kiye apna payment QR code upload karein, UPI ID badlein, aur WhatsApp support number update karein.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. Payment QR Code Image Upload */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-lime-400" />
                    <span>Payment QR Code Image</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Apna real UPI payment QR code upload karein. Yeh seedha buyers ko unlock screen par dikhega.
                  </p>
                </div>
                {settingQrUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingQrUrl('');
                      showFeedback('Auto-generated QR code par reset ho gaya.');
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300 font-semibold transition-colors self-start sm:self-auto"
                  >
                    Reset to Default QR
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                {/* QR Preview Box */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200 shrink-0 text-center">
                  <img
                    src={settingQrUrl || getUpiQrImageUrl(settingUpiId || '9718936211@ibl', settingPayeeName || 'PromptBazaar', 29)}
                    alt="Payment QR Code Preview"
                    className="w-40 h-40 object-contain rounded-lg mx-auto"
                  />
                  <span className="block text-[10px] text-zinc-600 font-bold mt-1.5 uppercase tracking-wider">
                    {settingQrUrl ? 'Custom Uploaded QR' : 'Auto-Generated QR'}
                  </span>
                </div>

                {/* Upload Button & Info */}
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-lime-400 border border-zinc-700 hover:border-lime-400/50 text-xs font-bold cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingQr ? 'Uploading QR Code...' : 'Naya QR Code Image Upload Karein'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      disabled={isUploadingQr}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    JPG ya PNG image upload karein. File auto-compress ho kar secure storage me upload ho jayegi.
                  </p>
                  {settingQrUrl && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Custom QR Image Uploaded & Active</span>
                    </div>
                  )}

                  {storageRlsNotice && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 text-left">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Supabase Storage RLS Policy Notice</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Supabase "media" bucket me QR upload enable karne ke liye storage RLS policy allow karni hogi. Updated SQL script copy karke Supabase SQL Editor me run karein.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenSqlModal}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 text-zinc-950 font-bold text-xs hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5 shadow"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>SQL Setup Kholein & Script Copy Karein</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. UPI ID & Payee Name */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-lime-400" />
                <span>UPI ID & Payee Name</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    UPI ID (e.g. 9718936211@ibl) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9718936211@ibl"
                    value={settingUpiId}
                    onChange={(e) => setSettingUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-lime-400 font-mono font-bold focus:outline-none focus:border-lime-400"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Unlock modal me "Copy UPI ID" aur "Pay with UPI" button me yahi UPI ID use hoga.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Payee Name (Receiver Display Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PromptBazaar"
                    value={settingPayeeName}
                    onChange={(e) => setSettingPayeeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    UPI application (GPay/PhonePe) me yahi display name receiver ke roop me dikhega.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. WhatsApp Contact Number */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Support & Custom Ad Number</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  WhatsApp Number (with Country Code) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    placeholder="+919718936211"
                    value={settingWhatsapp}
                    onChange={(e) => setSettingWhatsapp(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <a
                    href={`https://wa.me/${settingWhatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Chat</span>
                  </a>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Footer support, Video Ads "Custom Ad Banwao" button aur orders support links par yahi number open hoga.
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving...' : 'Save Settings (Live Update)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SQL MIGRATION & RLS VERIFICATION */}
      {/* ============================================================== */}
      {activeAdminTab === 'supabase' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-lime-400" />
                <span>Supabase Admin Upgrade Migration SQL</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Is script ko Supabase SQL Editor me paste karke "Run" dabayein. Featured, reordering (`display_order`), aur strict Admin RLS write policies setup ho jayenge.
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="px-3.5 py-2 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all shrink-0"
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-zinc-300 max-h-72 overflow-y-auto select-all leading-relaxed">
            {ADMIN_UPGRADE_SQL}
          </div>
        </div>
      )}

      {/* SCREENSHOT LIGHTBOX (SECURE 300s SIGNED URL FROM 'payment-screenshots') */}
      {(previewScreenshotUrl || loadingScreenshot) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-xl w-full max-h-[90vh] bg-zinc-900 rounded-3xl p-4 border border-zinc-700 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => {
                setPreviewScreenshotUrl(null);
                setPreviewScreenshotPath(null);
                setLoadingScreenshot(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center shadow transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-full pb-3 mb-2 border-b border-zinc-800 text-left">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Payment Screenshot (Private Storage)</h4>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                Bucket: <span className="text-emerald-400 font-semibold">payment-screenshots</span> • Path:{' '}
                <span className="text-zinc-200">{previewScreenshotPath || 'Loading...'}</span>
              </p>
            </div>

            {loadingScreenshot ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
                <p className="text-xs text-zinc-400">
                  Private bucket se 300s temporary signed URL generate ho raha hai...
                </p>
              </div>
            ) : previewScreenshotUrl ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <img
                  src={previewScreenshotUrl}
                  alt="Payment Proof"
                  className="max-h-[68vh] w-auto rounded-2xl object-contain mx-auto border border-zinc-800 shadow"
                />
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>300s Temporary Signed URL Active</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* BULK ADD MODAL */}
      <BulkPhotoModal
        isOpen={isBulkPhotoModalOpen}
        onClose={() => setIsBulkPhotoModalOpen(false)}
        onSuccess={() => {
          fetchAdminData();
          onPhotosUpdated();
        }}
        existingCategories={allPhotoCategories}
        onNewCategoryCreated={(cat) => {
          dataApi.saveCustomCategory(cat);
          setCustomCategories(dataApi.getCustomCategories());
        }}
      />

      {/* ============================================================== */}
      {/* ADD / EDIT PHOTO MODAL (with auto-compression < 500 KB) */}
      {/* ============================================================== */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {editingPhoto ? 'Edit Photo Prompt' : 'Add New Photo Prompt'}
            </h3>

            <form onSubmit={handleSavePhoto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Prompt Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Rajputana Groom Portrait"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Category Selection with Custom Category creation */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Category *
                </label>
                {!isCreatingNewCat ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={pCategory}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingNewCat(true);
                        } else {
                          setPCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                    >
                      {allPhotoCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__new__">+ Create New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Naya category ka naam dalein..."
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewCat(false)}
                        className="px-3 py-2 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <span className="text-[11px] text-zinc-500 block">
                      Yeh category future prompts ke dropdown me save ho jayegi.
                    </span>
                  </div>
                )}
              </div>

              {/* Image Upload with Auto-compression to under 500 KB */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Photo Upload (Auto-compress &lt; 500 KB) *
                  </label>
                  {pCompressInfo && (
                    <span className="text-[10px] text-lime-400 font-mono font-bold">
                      {pCompressInfo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {pImageUrl && (
                    <img
                      src={pImageUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-700 bg-black shrink-0"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer text-xs text-zinc-300 transition-colors">
                    <Upload className="w-4 h-4 text-lime-400" />
                    <span>{pCompressing ? 'Compressing...' : 'Browse Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">
                    Ya direct Image URL paste karein:
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={pImageUrl}
                    onChange={(e) => setPImageUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Cinematic golden hour wedding portrait..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Free vs Paid Toggle */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Paid Prompt Hai?
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Paid prompt ka secret text photo_secrets table me RLS se locked rahega.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={pIsPaid}
                  onChange={(e) => setPIsPaid(e.target.checked)}
                  className="w-5 h-5 accent-lime-400 rounded cursor-pointer"
                />
              </div>

              {pIsPaid && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Price in ₹
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pPrice}
                    onChange={(e) => setPPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              )}

              {/* Prompt Text Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {pIsPaid ? 'Secret Prompt Text (RLS Protected) *' : 'Public Free Prompt Text *'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hyper-realistic 8k cinematic portrait..."
                  value={pPromptText}
                  onChange={(e) => setPPromptText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Toggles: Publish & Featured */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsPublished}
                    onChange={(e) => setPIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-lime-400 rounded"
                  />
                  <span className="text-xs font-medium text-zinc-200">
                    Live Publish
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsFeatured}
                    onChange={(e) => setPIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-lime-400 rounded"
                  />
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    Featured (Home)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPhoto}
                  className="px-5 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs hover:bg-lime-300 transition-colors shadow disabled:opacity-50"
                >
                  {isSavingPhoto ? 'Saving...' : 'Save Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT VIDEO MODAL (Preview upload <= 10 MB, External link) */}
      {/* ============================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {editingVideo ? 'Edit Video Ad Item' : 'Add New Video Ad Item'}
            </h3>

            <form onSubmit={handleSaveVideo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kirana Grand Opening 3D Reel"
                  value={vTitle}
                  onChange={(e) => setVTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  {!isCreatingNewCat ? (
                    <select
                      value={vCategory}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingNewCat(true);
                        } else {
                          setVCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                    >
                      {allVideoCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__new__">+ Create New Category...</option>
                    </select>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="New category..."
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewCat(false)}
                        className="text-[10px] text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Type (Prompt / Ready Reel) *
                  </label>
                  <select
                    value={vItemType}
                    onChange={(e) => setVItemType(e.target.value as 'prompt' | 'ready_video')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="prompt">AI Video Prompt</option>
                    <option value="ready_video">Ready Video Reel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Duration (e.g. 0:30, 0:20)
                  </label>
                  <input
                    type="text"
                    value={vDuration}
                    onChange={(e) => setVDuration(e.target.value)}
                    placeholder="0:30"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Price in ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vPrice}
                    onChange={(e) => setVPrice(Number(e.target.value))}
                    disabled={!vIsPaid}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Video Thumbnail Upload (Auto-compress < 500 KB) */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Thumbnail Image Upload (&lt; 500 KB) *
                  </label>
                  {vThumbCompressInfo && (
                    <span className="text-[10px] text-lime-400 font-mono">
                      {vThumbCompressInfo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {vThumbnailUrl && (
                    <img
                      src={vThumbnailUrl}
                      alt="Thumbnail"
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-700 bg-black shrink-0"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer text-xs text-zinc-300">
                    <Upload className="w-4 h-4 text-lime-400" />
                    <span>{vThumbCompressing ? 'Compressing...' : 'Upload Thumbnail File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVideoThumbUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="url"
                  required
                  placeholder="Or paste thumbnail URL: https://..."
                  value={vThumbnailUrl}
                  onChange={(e) => setVThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Preview Video Upload (Max 10 MB, with Warning) */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Preview Video Upload (Max 10 MB)
                </label>

                <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer text-xs text-zinc-300">
                  <Film className="w-4 h-4 text-lime-400" />
                  <span>Choose Preview MP4 (Max 10 MB)</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handlePreviewVideoUpload}
                    className="hidden"
                  />
                </label>

                {vVideoWarning && (
                  <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{vVideoWarning}</span>
                  </div>
                )}

                <input
                  type="url"
                  placeholder="Or paste sample preview video link (https://...)"
                  value={vVideoUrl}
                  onChange={(e) => setVVideoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* External Link for Full Video (Drive/YouTube) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-lime-400" />
                  <span>External Full Video Link (Google Drive / YouTube / Dropbox)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... or YouTube unlisted"
                  value={vExternalLink}
                  onChange={(e) => setVExternalLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-lime-400"
                />
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Paid hone par yeh link secret table me store hoga aur purchase ke baad hi reveal hoga.
                </span>
              </div>

              {/* Free / Paid toggle */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Paid Video Item Hai?
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Full video link aur prompt video_secrets table me RLS se locked rahega.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={vIsPaid}
                  onChange={(e) => setVIsPaid(e.target.checked)}
                  className="w-5 h-5 accent-lime-400 rounded cursor-pointer"
                />
              </div>

              {/* Prompt Text / Secret Content */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {vIsPaid
                    ? 'Secret Content (Prompt Text / Editing Instructions) *'
                    : 'Free Content (Prompt Text / Download Instructions) *'}
                </label>
                <textarea
                  rows={3}
                  placeholder="Runway Gen-3 / Kling Prompt with camera angles..."
                  value={vContent}
                  onChange={(e) => setVContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              {/* Publish & Featured Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vIsPublished}
                    onChange={(e) => setVIsPublished(e.target.checked)}
                    className="w-4 h-4 accent-lime-400 rounded"
                  />
                  <span className="text-xs font-medium text-zinc-200">
                    Live Publish
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vIsFeatured}
                    onChange={(e) => setVIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-lime-400 rounded"
                  />
                  <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    Featured (Home)
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="px-5 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs hover:bg-lime-300 transition-colors shadow disabled:opacity-50"
                >
                  {isSavingVideo ? 'Saving...' : 'Save Video Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ============================================================== */}
      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => !isDeletingItem && setDeleteModal(null)}
              disabled={isDeletingItem}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors disabled:opacity-40"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 pr-6">
                <h3 className="text-base font-bold text-white">
                  Delete {deleteModal.type === 'photo' ? 'Photo Prompt' : 'Video Ad'}?
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Kya aap <span className="text-white font-semibold">"{deleteModal.title}"</span> ko permanently delete karna chahte hain?
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Cascade Deletion Notice</span>
              </div>
              <p>
                Database se pehle{' '}
                <span className="font-mono text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">
                  {deleteModal.type === 'photo' ? 'photo_secrets' : 'video_secrets'}
                </span>{' '}
                row delete hogi, phir item delete hoga. Yeh action undo nahi kiya ja sakta.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={isDeletingItem}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingItem}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-950/50 disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
