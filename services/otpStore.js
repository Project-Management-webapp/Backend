/**
 * In-memory OTP storage service
 * Stores OTPs temporarily with automatic expiration
 */
class OTPStore {
  constructor() {
    this.store = new Map();
    
    // Clean up expired OTPs every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Store OTP for a user
   */
  set(userId, otpData) {
    this.store.set(`otp_${userId}`, otpData);
  }

  /**
   * Get OTP data for a user
   */
  get(userId) {
    return this.store.get(`otp_${userId}`);
  }

  /**
   * Delete OTP data for a user
   */
  delete(userId) {
    this.store.delete(`otp_${userId}`);
  }

  /**
   * Check if OTP exists for a user
   */
  has(userId) {
    return this.store.has(`otp_${userId}`);
  }

  /**
   * Clean up expired OTPs
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expiryTime && data.expiryTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all OTPs (useful for testing)
   */
  clear() {
    this.store.clear();
  }
}

module.exports = new OTPStore();
