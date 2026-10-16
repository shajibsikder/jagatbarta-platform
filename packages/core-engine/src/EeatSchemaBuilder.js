/**
 * Jagatbarta Core Engine - Google E-E-A-T Structured Data Schema Builder
 * 
 * Generates Schema.org compliant JSON-LD structured data for NewsArticle
 * entities, embedding dynamic author profiles and publisher authority.
 */
class EeatSchemaBuilder {
    constructor(siteConfig = {}) {
        this.siteName = siteConfig.siteName || 'Jagatbarta';
        this.siteUrl = siteConfig.siteUrl || 'https://jagatbarta.com';
        this.logoUrl = siteConfig.logoUrl || 'https://jagatbarta.com/assets/images/logo.png';
    }

    /**
     * Builds NewsArticle Schema with strict Google Search guidelines compliance
     * @param {Object} article
     * @param {string} article.title
     * @param {string} article.description
     * @param {string} article.url
     * @param {string} article.imageUrl
     * @param {string} article.datePublished - ISO-8601 string
     * @param {string} article.dateModified - ISO-8601 string
     * @param {Object} author
     * @param {string} author.name
     * @param {string} author.url - Author profile permalink
     * @param {string[]} [author.socialLinks] - Array of verified author URLs (Facebook, GitHub, etc.)
     * @returns {Object} JSON-LD Schema Object
     */
    buildNewsArticleSchema(article, author) {
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': article.url || this.siteUrl
            },
            'headline': article.title,
            'description': article.description || '',
            'image': article.imageUrl ? [article.imageUrl] : [],
            'datePublished': article.datePublished || new Date().toISOString(),
            'dateModified': article.dateModified || article.datePublished || new Date().toISOString(),
            'author': {
                '@type': 'Person',
                'name': author.name || 'Jagatbarta Reporter',
                'url': author.url || `${this.siteUrl}/authors`,
                ...(author.socialLinks && author.socialLinks.length > 0 ? { 'sameAs': author.socialLinks } : {})
            },
            'publisher': {
                '@type': 'NewsMediaOrganization',
                'name': this.siteName,
                'url': this.siteUrl,
                'logo': {
                    '@type': 'ImageObject',
                    'url': this.logoUrl
                }
            }
        };

        return schema;
    }

    /**
     * Formats schema object into an embeddable HTML script tag
     * @param {Object} schemaObject 
     * @returns {string} <script type="application/ld+json">...</script>
     */
    toScriptTag(schemaObject) {
        return `<script type="application/ld+json">\n${JSON.stringify(schemaObject, null, 2)}\n</script>`;
    }
}

module.exports = EeatSchemaBuilder;
