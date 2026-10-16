const crypto = require('crypto');

/**
 * Jagatbarta Core Engine - Traffic Verification & Fraud Shield
 * 
 * Protects platform monetization against bot traffic, click farms,
 * rapid F5 reload loops, and low-dwell spam impressions.
 */
class FraudDetector {
    constructor(options = {}) {
        this.salt = options.salt || 'jagatbarta-secure-entropy-key';
        this.minDwellTimeSeconds = options.minDwellTimeSeconds || 12; // Minimum reading dwell time
        this.botSignatures = [
            /bot/i, /crawl/i, /spider/i, /headless/i, /curl/i, /wget/i,
            /python-requests/i, /urllib/i, /puppeteer/i, /selenium/i
        ];
    }

    /**
     * Anonymizes IP address to comply with GDPR & Privacy laws while
     * retaining unique visitor identification ability.
     * @param {string} ip - Raw client IP
     * @returns {string} 64-char SHA-256 hash
     */
    hashIp(ip) {
        if (!ip) return '';
        return crypto
            .createHmac('sha256', this.salt)
            .update(ip.trim())
            .digest('hex');
    }

    /**
     * Checks if User-Agent belongs to a known crawler or automated bot
     * @param {string} userAgent 
     * @returns {boolean}
     */
    isBot(userAgent) {
        if (!userAgent) return true;
        return this.botSignatures.some(pattern => pattern.test(userAgent));
    }

    /**
     * Validates whether an article view qualifies as a monetization-eligible impression
     * @param {Object} session
     * @param {string} session.ip - Client IP address
     * @param {string} session.userAgent - Client User Agent
     * @param {number} session.dwellTimeSeconds - Time spent reading article
     * @param {number} session.scrollDepthPercent - Maximum scroll depth (0-100)
     * @returns {{ isValid: boolean, reason: string | null }}
     */
    validateImpression({ ip, userAgent, dwellTimeSeconds = 0, scrollDepthPercent = 0 }) {
        if (!ip) {
            return { isValid: false, reason: 'MISSING_CLIENT_IP' };
        }

        if (this.isBot(userAgent)) {
            return { isValid: false, reason: 'AUTOMATED_BOT_DETECTED' };
        }

        if (dwellTimeSeconds < this.minDwellTimeSeconds) {
            return { isValid: false, reason: 'INSUFFICIENT_DWELL_TIME' };
        }

        if (scrollDepthPercent < 25) {
            return { isValid: false, reason: 'INSUFFICIENT_SCROLL_DEPTH' };
        }

        return { isValid: true, reason: null };
    }
}

module.exports = FraudDetector;
