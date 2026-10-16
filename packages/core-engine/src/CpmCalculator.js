/**
 * Jagatbarta Core Engine - CPM Revenue Calculator
 * 
 * Computes tiered revenue based on visitor geo-location, device category,
 * and valid engaged impression counts.
 */
class CpmCalculator {
    constructor(customRates = {}) {
        // Default Base CPM Rates (USD per 1,000 verified impressions)
        this.rates = {
            TIER_1: 4.50, // US, CA, UK, AU, DE, FR
            TIER_2: 1.80, // UAE, SA, SG, MY, JP, IT, ES
            TIER_3: 0.65, // BD, IN, PK, NP, LK, Global Rest
            ...customRates
        };

        this.tierCountries = {
            TIER_1: new Set(['US', 'CA', 'GB', 'UK', 'AU', 'DE', 'FR']),
            TIER_2: new Set(['AE', 'SA', 'SG', 'MY', 'JP', 'IT', 'ES', 'NL', 'SE'])
        };
    }

    /**
     * Determines Country Tier by ISO-3166 2-letter country code
     * @param {string} countryCode 
     * @returns {'TIER_1' | 'TIER_2' | 'TIER_3'}
     */
    resolveTier(countryCode) {
        if (!countryCode) return 'TIER_3';
        const code = countryCode.toUpperCase();
        if (this.tierCountries.TIER_1.has(code)) return 'TIER_1';
        if (this.tierCountries.TIER_2.has(code)) return 'TIER_2';
        return 'TIER_3';
    }

    /**
     * Calculates earnings for a given batch of verified impressions
     * @param {number} impressions - Number of valid impressions
     * @param {string} countryCode - 2-letter ISO country code
     * @param {'desktop' | 'mobile' | 'tablet'} device - User device category
     * @returns {{ earnings: number, cpm: number, tier: string, verifiedImpressions: number }}
     */
    calculateEarnings(impressions, countryCode = 'BD', device = 'mobile') {
        if (impressions <= 0) {
            return { earnings: 0, cpm: 0, tier: 'TIER_3', verifiedImpressions: 0 };
        }

        const tier = this.resolveTier(countryCode);
        let baseCpm = this.rates[tier];

        // Device modifier: Desktop visitors typically yield slightly higher CPM
        const deviceMultiplier = device === 'desktop' ? 1.15 : 1.0;
        const effectiveCpm = Number((baseCpm * deviceMultiplier).toFixed(3));

        // Earnings Formula: (Impressions / 1000) * Effective CPM
        const earnings = Number(((impressions / 1000) * effectiveCpm).toFixed(5));

        return {
            earnings,
            cpm: effectiveCpm,
            tier,
            verifiedImpressions: impressions
        };
    }
}

module.exports = CpmCalculator;
