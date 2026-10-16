const { describe, it } = require('node:test');
const assert = require('node:assert');

const CpmCalculator = require('../src/CpmCalculator');
const FraudDetector = require('../src/FraudDetector');
const EeatSchemaBuilder = require('../src/EeatSchemaBuilder');

describe('Jagatbarta Core Engine Unit Tests', () => {
    describe('CpmCalculator', () => {
        const calculator = new CpmCalculator();

        it('should resolve correct tiers for different country codes', () => {
            assert.strictEqual(calculator.resolveTier('US'), 'TIER_1');
            assert.strictEqual(calculator.resolveTier('GB'), 'TIER_1');
            assert.strictEqual(calculator.resolveTier('AE'), 'TIER_2');
            assert.strictEqual(calculator.resolveTier('SG'), 'TIER_2');
            assert.strictEqual(calculator.resolveTier('BD'), 'TIER_3');
            assert.strictEqual(calculator.resolveTier('IN'), 'TIER_3');
        });

        it('should accurately calculate earnings for Tier 1 desktop impressions', () => {
            const result = calculator.calculateEarnings(5000, 'US', 'desktop');
            assert.strictEqual(result.tier, 'TIER_1');
            assert.strictEqual(result.verifiedImpressions, 5000);
            assert.ok(result.earnings > 0);
            assert.strictEqual(result.cpm, 4.50 * 1.15);
        });

        it('should return 0 earnings for zero or negative impressions', () => {
            const result = calculator.calculateEarnings(0, 'BD', 'mobile');
            assert.strictEqual(result.earnings, 0);
        });
    });

    describe('FraudDetector', () => {
        const detector = new FraudDetector({ minDwellTimeSeconds: 10 });

        it('should detect automated scrapers and bots', () => {
            assert.strictEqual(detector.isBot('Googlebot/2.1'), true);
            assert.strictEqual(detector.isBot('python-requests/2.28'), true);
            assert.strictEqual(detector.isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'), false);
        });

        it('should reject impressions with insufficient reading dwell time', () => {
            const result = detector.validateImpression({
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                dwellTimeSeconds: 4,
                scrollDepthPercent: 50
            });
            assert.strictEqual(result.isValid, false);
            assert.strictEqual(result.reason, 'INSUFFICIENT_DWELL_TIME');
        });

        it('should accept verified human reading session', () => {
            const result = detector.validateImpression({
                ip: '103.205.180.12',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
                dwellTimeSeconds: 25,
                scrollDepthPercent: 70
            });
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.reason, null);
        });

        it('should hash IP addresses with HMAC-SHA256 for GDPR compliance', () => {
            const hash = detector.hashIp('103.205.180.12');
            assert.strictEqual(hash.length, 64);
            assert.notStrictEqual(hash, '103.205.180.12');
        });
    });

    describe('EeatSchemaBuilder', () => {
        const builder = new EeatSchemaBuilder({
            siteName: 'Jagatbarta',
            siteUrl: 'https://jagatbarta.com'
        });

        it('should build valid NewsArticle schema with author sameAs links', () => {
            const schema = builder.buildNewsArticleSchema({
                title: 'Tech Innovation in Bangladesh',
                url: 'https://jagatbarta.com/articles/tech-innovation',
                imageUrl: 'https://jagatbarta.com/media/banner.jpg',
                datePublished: '2026-10-16T10:00:00Z'
            }, {
                name: 'Md Shajib Sikder',
                url: 'https://jagatbarta.com/author/shajib-sikder',
                socialLinks: ['https://github.com/shajibsikder', 'https://facebook.com/shajib']
            });

            assert.strictEqual(schema['@type'], 'NewsArticle');
            assert.strictEqual(schema.headline, 'Tech Innovation in Bangladesh');
            assert.strictEqual(schema.author.name, 'Md Shajib Sikder');
            assert.deepStrictEqual(schema.author.sameAs, ['https://github.com/shajibsikder', 'https://facebook.com/shajib']);
            assert.strictEqual(schema.publisher.name, 'Jagatbarta');
        });
    });
});
