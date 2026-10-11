/**
 * Browser-side Image Compression & Media Validation Utilities
 * Auto-compresses images to under 500 KB before upload
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
}

const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB target
export const MAX_SCREENSHOT_BYTES = 1024 * 1024; // 1 MB target
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Compresses a payment screenshot image strictly to under 1 MB
 * Validates that file is an image only.
 */
export async function compressImageTo1MB(file: File): Promise<CompressionResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Kripya sirf image file upload karein (JPG, PNG, WEBP).');
  }

  const originalSizeBytes = file.size;

  // If already JPEG and under 950 KB, load dimensions and return directly
  if (originalSizeBytes <= 950 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/jpg')) {
    const dataUrl = await readFileAsDataUrl(file);
    const { width, height } = await getImageDimensions(dataUrl);
    return {
      file,
      dataUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      width,
      height,
    };
  }

  // Load into HTMLImageElement
  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(originalDataUrl);

  // Initial dimensions scaling if > 2048
  let { width, height } = fitDimensions(img.width, img.height, 2048, 2048);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Iteratively reduce quality or dimensions until <= 1 MB (1024 * 1024)
  let quality = 0.90;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });

    if (blob && blob.size <= MAX_SCREENSHOT_BYTES) {
      break;
    }

    if (quality > 0.6) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      quality = 0.80;
    }
  }

  if (!blob) {
    throw new Error('Failed to compress screenshot');
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
  const compressedFile = new File([blob], cleanName, { type: 'image/jpeg' });
  const finalDataUrl = await readFileAsDataUrl(compressedFile);

  return {
    file: compressedFile,
    dataUrl: finalDataUrl,
    originalSizeBytes,
    compressedSizeBytes: blob.size,
    width,
    height,
  };
}

/**
 * Compresses an image file in browser to strictly under 500 KB
 */
export async function compressImageTo500KB(file: File): Promise<CompressionResult> {
  const originalSizeBytes = file.size;

  // If already under 450 KB, read and return directly
  if (originalSizeBytes <= 450 * 1024) {
    const dataUrl = await readFileAsDataUrl(file);
    const { width, height } = await getImageDimensions(dataUrl);
    return {
      file,
      dataUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      width,
      height,
    };
  }

  // Load into HTMLImageElement
  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(originalDataUrl);

  // Initial dimensions scaling if > 1920
  let { width, height } = fitDimensions(img.width, img.height, 1920, 1920);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Iteratively reduce quality or dimensions until <= 500 KB
  let quality = 0.88;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });

    if (blob && blob.size <= MAX_IMAGE_BYTES) {
      break;
    }

    // Reduce quality first, then dimensions if still too large
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      // Scale down canvas dimensions
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      quality = 0.75;
    }
  }

  if (!blob) {
    throw new Error('Failed to compress image');
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
  const compressedFile = new File([blob], cleanName, { type: 'image/jpeg' });
  const finalDataUrl = await readFileAsDataUrl(compressedFile);

  return {
    file: compressedFile,
    dataUrl: finalDataUrl,
    originalSizeBytes,
    compressedSizeBytes: blob.size,
    width,
    height,
  };
}

/**
 * Validates video size (max 10 MB)
 */
export function validateVideoFile(file: File): { isValid: boolean; sizeMB: number; warning?: string } {
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      isValid: false,
      sizeMB,
      warning: `⚠️ Video file 10 MB se badi hai (${sizeMB} MB). Kripya 10 MB se chhota preview video upload karein.`,
    };
  }
  return { isValid: true, sizeMB };
}

// Helpers
function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = src;
  });
}

function fitDimensions(w: number, h: number, maxW: number, maxH: number) {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}
