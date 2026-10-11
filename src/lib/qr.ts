/**
 * Helper to generate a reliable UPI payment QR code URL or SVG
 */
export function getUpiPaymentUrl(upiId: string, payeeName: string, amount: number, note = 'PromptBazaar Unlock'): string {
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(note);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Returns a high-contrast QR image URL for UPI apps
 */
export function getUpiQrImageUrl(upiId: string, payeeName: string, amount: number): string {
  const upiUrl = getUpiPaymentUrl(upiId, payeeName, amount);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}&margin=10`;
}
