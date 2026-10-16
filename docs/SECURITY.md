# 🔐 Jagatbarta Security Protocols

Security, privacy, and editorial integrity are foundational pillars of the Jagatbarta platform.

---

## 1. Authentication & Authorization (RBAC)

* **Role-Based Access Control:** Strict segregation between `Super Admin`, `Editorial Moderator`, `Verified Journalist`, and `Standard Contributor`.
* **Session Protection:** Encrypted HTTP-only, SameSite cookies with CSRF tokens on all mutating requests.
* **Password Hashing:** Argon2id / Bcrypt password hashing algorithms.

---

## 2. Privacy & GDPR Compliance

* **IP Anonymization:** Raw visitor IP addresses are never permanently written to database records. All IPs are processed through HMAC-SHA256 one-way hashing with dynamic salt.
* **Minimal PII Storage:** User profiles only retain user-submitted data (Name, email, public social handles).

---

## 3. Threat Mitigation & Rate Limiting

| Attack Vector | Defense Mechanism |
| :--- | :--- |
| **DDoS & Layer 7 Flooding** | Cloudflare Edge Protection with Web Application Firewall (WAF). |
| **SQL Injection** | Parameterized queries with Eloquent ORM / PDO prepared statements. |
| **Cross-Site Scripting (XSS)** | HTML Purifier & DOM sanitization on all rich-text user inputs. |
| **Brute Force & Credential Stuffing** | IP-level exponential backoff rate limiters on `/auth/login` endpoints. |
| **Click Fraud & Bot Scrapers** | User-Agent heuristics and engaged dwell-time verification filters. |

---

## 4. Google AdSense & Publisher Policy Safeguards

* **Automated Sensitive Word Blocking:** Real-time filtering against violent, hateful, adult, and prohibited categories (`isAdSenseHighValue` flag).
* **Anti-Hallucination Editorial Standards:** Master prompts explicitly prohibit LLM fabrication of quotes, dates, or non-existent statistics.
* **Table of Contents & FAQ Schema:** Enforces semantic `<h2>`/`<h3>` tags and valid Schema.org markup.
