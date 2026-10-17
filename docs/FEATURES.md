# Jagatbarta Feature Specification

An exhaustive breakdown of production features engineered across the Jagatbarta platform.

---

## 1. Content Consumption & Accessibility
* **Bilingual Smart Audio Reader:** Native Web Speech API integration supporting Bengali (`bn-BD`) and English (`en-US`) with auto-language detection and sentence chunking.
* **Semantic Schema.org Integration:** Automatic injection of `NewsArticle`, `BreadcrumbList`, and `FAQPage` JSON-LD schemas.
* **Auto Table of Contents (TOC):** Dynamic anchor linking based on semantic `<h2>` and `<h3>` tags.
* **Dynamic Reading Progress & Time:** Dwell-time estimation based on Bengali/English word density.
* **Social Engagement Suite:** Native Share popup, bookmarking, and liking with live counters.
* **Standardized Typography:** Cross-platform Bengali typography powered by `Hind Siliguri`.

---

## 2. Monetization & Anti-Fraud Infrastructure
* **Country-Tiered CPM Engine:** Dynamic CPM calculation supporting Tier 1 (US/UK/CA), Tier 2 (EU/Gulf), and Tier 3 (BD/IN).
* **Proxy & Datacenter IP Filter:** Real-time lookup with 24-hour persistent cache and 5-second HTTP timeout guard to mitigate SMM panel spoofing.
* **Google reCAPTCHA v3:** Score-based risk evaluation (minimum 0.5 threshold) preventing automated form submissions.
* **AdBlocker Detection & Shield:** Zero-revenue flags for traffic with blocked advertisements.
* **Universal Ads Protector:** Centralized ad slot isolation via `Elements::ads()` with responsive wrapper containers.
* **GDPR IP Anonymization:** HMAC-SHA256 one-way hashing for secure, privacy-compliant unique visitor tracking.

---

## 3. Automated News Aggregation & Editorial Compiler
* **Multi-Wire RSS Ingestion:** Continuous feed parsing from national dailies (Google News BD, Prothom Alo, Daily Star).
* **AdSense Safe Topic Filter:** Proactive exclusion of violence, adult, or policy-violating sensitive terms.
* **Master Editorial Prompt Generator:** 1-click structured prompt creating human-journalistic articles with TOC and FAQ anchors.
* **Zero-Hallucination Policy:** Strict prompt guardrails barring AI-invented quotes, dates, or non-verified claims.

---

## 4. Creator Platform & Workflow
* **Contributor Publishing Pipeline:** Draft saving, editorial moderation, and publication workflows.
* **Video Submission Hub:** Clean submission interface for multimedia reporters.
* **Creator Referral Engine:** Unique referral codes and tiered revenue sharing.
* **Transparent Withdrawal System:** Automated payout requests with administrator approval controls.
