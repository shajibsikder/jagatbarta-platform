# 📡 Jagatbarta REST API Specification

This document details the public and authenticated REST API endpoints exposed by the platform ecosystem.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new citizen journalist or reader account.

#### Request Body
```json
{
  "name": "Md Shajib Sikder",
  "email": "shajib@example.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 142,
    "name": "Md Shajib Sikder",
    "email": "shajib@example.com",
    "role": "contributor"
  }
}
```

---

## 2. Content & Publishing Endpoints

### `POST /api/v1/articles`
Submits a new article for editorial moderation.

#### Request Body
```json
{
  "title": "Renewable Energy Transition in South Asia",
  "category_id": 3,
  "summary": "An in-depth analysis of solar grid modernization in Bangladesh and neighboring nations.",
  "content_html": "<p>Recent initiatives have accelerated renewable adoption...</p>",
  "tags": ["Technology", "Renewable Energy", "Economy"],
  "seo_keywords": "renewable energy, solar grid bangladesh, clean tech 2026",
  "seo_description": "Comprehensive report on solar energy infrastructure expansion in South Asia."
}
```

#### Response (`202 Accepted`)
```json
{
  "success": true,
  "article_id": 9812,
  "status": "pending_review",
  "slug": "renewable-energy-transition-in-south-asia",
  "message": "Article queued for editorial review."
}
```

---

## 3. News Engine Microservice Endpoints (`:3000`)

### `GET /api/news`
Fetches live curated RSS feeds with automated AdSense safety tagging.

#### Query Parameters
* `category` *(optional)*: Filter by category (e.g. `জাতীয়`, `প্রযুক্তি`, `অর্থনীতি`).
* `source` *(optional)*: Filter by publisher (e.g. `প্রথম আলো`, `The Daily Star`).
* `date` *(optional)*: ISO date filter `YYYY-MM-DD`.

#### Response (`200 OK`)
```json
{
  "success": true,
  "totalCount": 140,
  "filteredCount": 24,
  "news": [
    {
      "id": "eW1kLTIwMjYtMTAtMTY...",
      "title": "জাতীয় গ্রিডে যুক্ত হচ্ছে নতুন ৫০০ মেগাওয়াট সৌর বিদ্যুৎ",
      "source": "প্রথম আলো",
      "category": "প্রযুক্তি",
      "isAdSenseHighValue": true,
      "formattedDate": "১৬ অক্টোবর ২০২৬",
      "masterPrompt": "JAGATBARTA.COM — MASTER NEWS REPORTING, SEO & ADSENSE PROMPT..."
    }
  ]
}
```

### `POST /api/custom-prompt`
Generates an on-demand AdSense-compliant Master Prompt for any custom news article.

#### Request Body
```json
{
  "title": "ডিজিটাল স্বাস্থ্যসেবায় এআই বিপ্লব",
  "source": "বাংলাদেশ সংবাদ",
  "category": "স্বাস্থ্য",
  "link": "https://example.com/health-ai"
}
```
