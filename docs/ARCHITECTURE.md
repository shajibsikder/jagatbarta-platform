# 🧠 Jagatbarta System Architecture

This document provides a comprehensive technical overview of the **Jagatbarta** digital news and content monetization ecosystem.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client & Ingress Layer"]
        A1["Desktop & Mobile Readers"] --> B1["Cloudflare CDN & DDoS Protection"]
        A2["Citizen Journalists & Authors"] --> B1
        B1 --> B2["Nginx Reverse Proxy & SSL Termination"]
    end

    subgraph AppLayer ["Application & Microservices"]
        B2 --> C1["Blade SSR & Dynamic Presentation Layer"]
        B2 --> C2["Laravel Core Platform API"]
        B2 --> C3["Node.js News Engine Microservice (:3000)"]
        
        C3 -->|RSS Stream Ingestion| D1["Prothom Alo / Google News Feeds"]
        C3 -->|Prompt Pipeline| D2["AdSense AI Prompt Generator"]
    end

    subgraph CoreEngine ["@jagatbarta/core-engine"]
        C2 --> E1["FraudDetector (Anti-Bot & IP Hash)"]
        C2 --> E2["CpmCalculator (Tiered Revenue Engine)"]
        C2 --> E3["EeatSchemaBuilder (NewsArticle JSON-LD)"]
    end

    subgraph StorageLayer ["Data & Persistence Layer"]
        C2 --> F1[("MySQL 8.0 Primary DB")]
        C2 --> F2[("Redis Caching & Session Store")]
    end

    subgraph ExternalServices ["External Search & Ad Ecosystem"]
        C1 --> G1["Google Search Engine (Sitemaps & Indexing)"]
        C1 --> G2["Google AdSense (High-Value Ad Placements)"]
    end
```

---

## 2. Component Breakdown

### A. Ingress & Delivery Layer
* **Cloudflare CDN:** Edge caching for static assets, DDoS mitigation, and global SSL termination.
* **Nginx Reverse Proxy:** Routes public traffic to the Laravel application (`PHP-FPM`) and proxies microservice calls to the internal Node.js News Engine (`127.0.0.1:3000`).

### B. Core Application (Laravel & Blade SSR)
* **Author E-E-A-T Framework:** Dynamically links author profiles with social media verification (`sameAs` schema) and verified journalist biographies.
* **Multi-Sitemap Generator:** Automatically produces chunked XML sitemaps:
  * `sitemap-main.xml` (Index)
  * `sitemap-a.xml` (Articles)
  * `sitemap.xml` (Core Pages)
  * `sitemap-1.xml` (Categories, Authors, Tags)
* **Table of Contents (TOC) & FAQ Engine:** Automatically renders in-article navigational anchor trees (`<h2>`/`<h3>`) and interactive FAQ accordions.

### C. News Engine Microservice (`services/news-engine`)
* **Real-time Feed Streaming:** Parses multi-source national and international RSS feeds.
* **AdSense Content Safety Guard:** Filters sensitive, violent, or policy-violating topics using automated keyword heuristics (`isAdSenseHighValue`).
* **Zero-Hallucination Prompt Builder:** Emits structured prompts for LLMs enforcing human journalistic voice, strict source attribution, and table-of-contents formatting.

### D. Core Business Engine (`packages/core-engine`)
* **`FraudDetector`:** Validates engaged human reading sessions using dwell-time thresholds (>= 12s), scroll depth (>= 25%), and bot user-agent filtering.
* **`CpmCalculator`:** Computes weighted CPM revenue based on geographical tiers (Tier 1: US/UK/CA; Tier 2: EU/Gulf; Tier 3: BD/IN) and device modifiers.
* **`EeatSchemaBuilder`:** Emits Google Search Central-compliant `NewsArticle` JSON-LD schemas with dynamic author credentials.

---

## 3. Data Flow: Article Publishing to Google Indexing

```mermaid
sequenceDiagram
    autonumber
    actor Reporter as Citizen Journalist / Editor
    participant Engine as News Engine Microservice
    participant Core as Jagatbarta Core API
    participant DB as MySQL Database
    participant Google as Google Search / AdSense

    Reporter->>Engine: Fetch daily curated news & generate Master Prompt
    Engine-->>Reporter: AdSense-Safe, E-E-A-T formatted content
    Reporter->>Core: Submit article (Draft / Pending Review)
    Core->>DB: Store with SEO metadata & slug
    Note over Core: Admin editorial approval & fact-checking
    Core->>DB: Update status to 'Published'
    Core->>Google: Ping Sitemaps (sitemap-a.xml)
    Google->>Core: Crawl page & parse NewsArticle JSON-LD schema
    Google-->>Reporter: Index and serve high-value AdSense ads
```
