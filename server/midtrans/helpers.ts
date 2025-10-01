import { createHash, timingSafeEqual } from 'crypto';

/**
 * Verifies the signature from Midtrans notification by computing SHA512 hash
 * Computes hash from: orderId + statusCode + grossAmount + serverKey
 * @param orderId - The order ID from the transaction
 * @param statusCode - The status code from Midtrans (e.g., "200")
 * @param grossAmount - The gross amount of the transaction as string
 * @param serverKey - The Midtrans server key
 * @param providedSignature - The signature provided by Midtrans webhook
 * @returns True if the provided signature matches the computed signature, false otherwise
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  providedSignature: string
): boolean {
  if (!orderId || !statusCode || !grossAmount || !serverKey || !providedSignature) {
    return false;
  }

  const signatureString = orderId + statusCode + grossAmount + serverKey;
  const expectedSignature = createHash('sha512').update(signatureString).digest('hex');
  
  // Timing-safe comparison
  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Computes the down payment (DP) amount based on total price and percentage
 * @param totalPrice - The total price of the order
 * @param dpPercent - The down payment percentage (0-100)
 * @returns The calculated down payment amount, rounded to nearest integer
 */
export function computeDpAmount(totalPrice: number, dpPercent: number): number {
  if (totalPrice < 0 || dpPercent < 0 || dpPercent > 100) {
    throw new Error('Invalid input: totalPrice must be >= 0 and dpPercent must be between 0 and 100');
  }
  
  return Math.round(totalPrice * dpPercent / 100);
}

/**
 * Generates a Midtrans-compatible order ID with consistent format
 * @param orderId - The base order ID
 * @returns The formatted order ID with "order_" prefix
 */
export function generateOrderId(orderId: string): string {
  if (!orderId) {
    throw new Error('Order ID cannot be empty');
  }
  
  return "order_" + orderId;
}
