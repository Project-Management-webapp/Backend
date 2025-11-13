const crypto = require('crypto');

class TwoFactorService {
  /**
   * Generate a 6-digit OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store OTP with expiry (5 minutes)
   * Returns the OTP and expiry timestamp
   */
  createOTP() {
    const otp = this.generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    
    return {
      otp,
      expiryTime,
      hashedOTP: this.hashOTP(otp)
    };
  }

  /**
   * Hash OTP for secure storage
   */
  hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify OTP
   */
  verifyOTP(inputOTP, hashedOTP, expiryTime) {
    // Check if OTP has expired
    if (Date.now() > expiryTime) {
      return {
        valid: false,
        message: 'OTP has expired'
      };
    }

    // Verify OTP
    const hashedInput = this.hashOTP(inputOTP);
    if (hashedInput === hashedOTP) {
      return {
        valid: true,
        message: 'OTP verified successfully'
      };
    }

    return {
      valid: false,
      message: 'Invalid OTP'
    };
  }
}

module.exports = new TwoFactorService();
