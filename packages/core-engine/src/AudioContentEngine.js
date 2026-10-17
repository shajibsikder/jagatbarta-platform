/**
 * Jagatbarta Core Engine - Audio & Speech Synthesis Content Engine
 * 
 * Provides accessibility and engaged dwell-time processing for audio readers.
 * Handles automatic language classification, content sanitation to protect
 * AdSense compliance, and bulletproof sentence chunking for speech synthesis.
 */
class AudioContentEngine {
    constructor() {
        this.bengaliRegex = /[\u0980-\u09FF]/;
        this.adStripPatterns = [
            /<div[^>]*class="[^"]*ads-wrapper[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*class="[^"]*ad-responsive-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*class="[^"]*premium-inline-read-more[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*class="[^"]*inline-related-box[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
            /<div[^>]*id="toc-container"[^>]*>[\s\S]*?<\/div>/gi,
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
        ];
    }

    /**
     * Classifies text language into standard BCP-47 locale
     * @param {string} text - Raw input text
     * @returns {'bn-BD' | 'en-US'}
     */
    detectLanguage(text) {
        if (!text || typeof text !== 'string') return 'en-US';
        return this.bengaliRegex.test(text) ? 'bn-BD' : 'en-US';
    }

    /**
     * Strips non-journalistic content, advertisements, and widgets
     * to ensure clean TTS without reading sponsor tags or scripts.
     * @param {string} rawHtml 
     * @returns {string} Plain sanitized text
     */
    sanitizeContent(rawHtml) {
        if (!rawHtml || typeof rawHtml !== 'string') return '';

        let sanitized = rawHtml;
        for (const pattern of this.adStripPatterns) {
            sanitized = sanitized.replace(pattern, ' ');
        }

        // Strip remaining HTML tags
        sanitized = sanitized.replace(/<[^>]+>/g, ' ');

        // Clean redundant whitespaces
        return sanitized
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Splits text into short, natural speech utterances based on language punctuation.
     * Prevents browser SpeechSynthesis buffer timeouts (e.g. Chrome 14-second cut-off).
     * @param {string} text 
     * @param {'bn-BD' | 'en-US'} [lang]
     * @returns {string[]} Array of spoken sentence chunks
     */
    chunkSentences(text, lang) {
        if (!text || typeof text !== 'string') return [];
        const detectedLang = lang || this.detectLanguage(text);
        const isBengali = detectedLang === 'bn-BD';

        const pattern = isBengali ? /[^।!?\n]+[।!?\n]?/g : /[^.!?\n]+[.!?\n]?/g;
        const matches = text.match(pattern);

        if (!matches) {
            const trimmed = text.trim();
            return trimmed.length > 0 ? [trimmed] : [];
        }

        return matches
            .map(s => s.trim())
            .filter(s => s.length > 1);
    }

    /**
     * Estimates listening duration in minutes and seconds
     * (Bengali speech rate ~120 words/min; English speech rate ~140 words/min)
     * @param {string} text 
     * @param {'bn-BD' | 'en-US'} [lang]
     * @returns {{ totalWords: number, minutes: number, seconds: number, formatted: string }}
     */
    estimateListeningDuration(text, lang) {
        if (!text || typeof text !== 'string') {
            return { totalWords: 0, minutes: 0, seconds: 0, formatted: '0s' };
        }

        const detectedLang = lang || this.detectLanguage(text);
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const wordsPerMinute = detectedLang === 'bn-BD' ? 120 : 140;

        const totalSeconds = Math.ceil((words / wordsPerMinute) * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formatted = minutes > 0 
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;

        return {
            totalWords: words,
            minutes,
            seconds,
            formatted
        };
    }
}

module.exports = AudioContentEngine;
