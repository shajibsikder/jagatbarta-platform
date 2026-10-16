const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache storage for feeds
let feedCache = {
    data: [],
    lastFetched: 0
};
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

// Jagatbarta's Official Categories
const JAGATBARTA_CATEGORIES = [
    { id: 9, name: 'জাতীয়', slug: 'national' },
    { id: 10, name: 'সারাদেশ', slug: 'country' },
    { id: 11, name: 'রাজনীতি', slug: 'politics' },
    { id: 12, name: 'আন্তর্জাতিক', slug: 'international' },
    { id: 13, name: 'অর্থনীতি', slug: 'economy' },
    { id: 14, name: 'খেলাধুলা', slug: 'sports' },
    { id: 15, name: 'প্রযুক্তি', slug: 'technology' },
    { id: 16, name: 'শিক্ষা', slug: 'education' },
    { id: 17, name: 'স্বাস্থ্য', slug: 'health' },
    { id: 18, name: 'বিনোদন', slug: 'entertainment' },
    { id: 19, name: 'লাইফস্টাইল', slug: 'lifestyle' },
    { id: 20, name: 'তথ্যচিত্র', slug: 'documentary' },
    { id: 21, name: 'গল্প', slug: 'stories' },
    { id: 22, name: 'মতামত', slug: 'opinion' },
    { id: 23, name: 'ফিচার', slug: 'features' }
];

// Smart Category Auto-Detection based on headline keywords
function detectCategory(title, defaultCat = 'জাতীয়') {
    const t = (title || '').toLowerCase();

    // 1. Technology
    if (/প্রযুক্তি|মোবাইল|স্মার্টফোন|কম্পিউটার|এআই|\bai\b|ইন্টারনেট|সাইবার|সফটওয়্যার|অ্যাপল|গুগল|ফেসবুক|মেটা|অ্যাপ|রোবট|চিপ|ল্যাপটপ|ডিজিটাল|টেকনো|ড্রোন|টেলিযোগাযোগ/i.test(t)) {
        return 'প্রযুক্তি';
    }
    // 2. Economy & Business
    if (/অর্থনীতি|ব্যাংক|রিজার্ভ|টাকা|ডলার|শেয়ার|বাজার|বাণিজ্য|রপ্তানি|আমদানি|রাজস্ব|মুদ্রাস্ফীতি|মূল্যস্ফীতি|পোশাক|তৈরি পোশাক|বাজেট|ব্যবসায়ী|ঋণ|শিল্প|জিডিপি|ভোক্তা|দরপতন|দাম বাড়/i.test(t)) {
        return 'অর্থনীতি';
    }
    // 3. Health & Wellness
    if (/স্বাস্থ্য|রোগ|চিকিৎসা|ক্যানসার|হাসপাতাল|ওষুধ|টিকা|ডাক্তার|ডেঙ্গু|করোনা|পরামর্শ|পুষ্টি|খাদ্য|হৃদরোগ|মানসিক স্বাস্থ্য|অসুখ|অপারেশন|লক্ষণ|প্রতিকার/i.test(t)) {
        return 'স্বাস্থ্য';
    }
    // 4. Education & Careers
    if (/শিক্ষা|বিশ্ববিদ্যালয়|পরীক্ষা|স্কুল|কলেজ|ভর্তি|শিক্ষক|শিক্ষার্থী|বোর্ড|এইচএসসি|এসএসসি|প্রাথমিক|বৃত্তি|ক্লাস|বিসিএস|চাকরি|নিয়োগ/i.test(t)) {
        return 'শিক্ষা';
    }
    // 5. Sports
    if (/খেলা|ক্রিকেট|ফুটবল|বিশ্বকাপ|মেসি|রোনালদো|সাকিব|তামিম|লিটন|সিরিজ|ম্যাচ|রান|উইকেট|গোল|টুর্নামেন্ট|বিপিএল|আইপিএল|পেসার|স্পিনার|ব্যাটসম্যান/i.test(t)) {
        return 'খেলাধুলা';
    }
    // 6. Entertainment
    if (/সিনেমা|নাটক|গান|চলচ্চিত্র|অভিনেতা|অভিনেত্রী|তারকা|শাকিব|অপু|বুবলী|শাকিব খান|হলিউড|বলিউড|গায়ক|শিল্পী|ফিল্ম|ওটিটি|সিরিজ|মিউজিক/i.test(t)) {
        return 'বিনোদন';
    }
    // 7. International
    if (/আন্তর্জাতিক|যুক্তরাষ্ট্র|চীন|রাশিয়া|ইউক্রেন|ভারত|পাকিস্তান|ইসরায়েল|ফিলিস্তিন|গাজা|যুদ্ধ|ট্রাম্প|বাইডেন|জাতিসংঘ|ইউরোপ|মধ্যপ্রাচ্য|ইরান|লেবানন/i.test(t)) {
        return 'আন্তর্জাতিক';
    }
    // 8. Lifestyle & Travel
    if (/লাইফস্টাইল|ভ্রমণ|ট্যুর|রূপচর্চা|রেসিপি|রান্না|ফ্যাশন|শখ|পরিবেশ|আবহাওয়া|বৃষ্টি|বন্যা|ঝড়|ঘূর্ণিঝড়/i.test(t)) {
        return 'লাইফস্টাইল';
    }

    return defaultCat || 'জাতীয়';
}

// Clean HTML & Entity Decoder for News Snippets
function cleanSnippetText(rawHtml) {
    if (!rawHtml) return '';
    let decoded = rawHtml
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ');

    // Extract links text if Google News formatted list
    const linkMatches = [...decoded.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)];
    if (linkMatches.length > 0) {
        const textParts = linkMatches.map(m => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
        if (textParts.length > 0) {
            return textParts.slice(0, 2).join(' • ');
        }
    }

    return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper: Parse XML Item
function parseXmlItems(xml, defaultCategory = 'জাতীয়', defaultSource = 'বাংলাদেশ সংবাদ') {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    const sensitiveWords = [
        'খুন', 'হত্যা', 'ধর্ষণ', 'লাশ', 'জুয়া', 'সুইসাইড', 'আত্মহত্যা', 'যৌন', 
        'আপত্তিকর', 'পর্নো', 'মার্ডার', 'গণপিটুনি', 'ছিনতাই', 'কুপিয়ে', 'গৃহবধূ হত্যা', 
        'মরদেহ', 'বিষপান', 'বধু হত্যা'
    ];

    while ((match = itemRegex.exec(xml)) !== null) {
        const raw = match[1];

        const getTag = (tag) => {
            const m = raw.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i'));
            return m ? (m[1] || m[2] || '').trim() : '';
        };

        let title = getTag('title');
        let link = getTag('link');
        let pubDateStr = getTag('pubDate');
        let rawDescription = getTag('description');

        // Clean Snippet
        let snippet = cleanSnippetText(rawDescription);

        // Source detection
        const sourceMatch = raw.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/i);
        let sourceName = sourceMatch ? sourceMatch[2].trim() : defaultSource;
        let sourceUrl = sourceMatch ? sourceMatch[1].trim() : '';

        // If title ends with " - Newspaper Name", separate them
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            if (parts.length > 1) {
                if (!sourceMatch || sourceName === defaultSource) {
                    sourceName = parts[parts.length - 1].trim();
                }
                title = parts.slice(0, parts.length - 1).join(' - ').trim();
            }
        }

        // Clean link
        if (!link && raw.includes('<link>')) {
            const linkMatch = raw.match(/<link>([^<]+)<\/link>/i);
            if (linkMatch) link = linkMatch[1].trim();
        }

        const dateObj = pubDateStr ? new Date(pubDateStr) : new Date();
        const dateIso = dateObj.toISOString();
        const dateYmd = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // YYYY-MM-DD
        const formattedDate = dateObj.toLocaleDateString('bn-BD', {
            timeZone: 'Asia/Dhaka',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        // Auto-detect realistic category from title
        const detectedCategory = detectCategory(title, defaultCategory);

        // AdSense Safe & High-Value Logic:
        // Any informative news that is NOT violent/crime/sensitive is AdSense Safe!
        const isSensitive = sensitiveWords.some(kw => title.includes(kw));
        const isAdSenseHighValue = !isSensitive;

        if (title && title.length > 10) {
            items.push({
                id: Buffer.from(title + (link || '')).toString('base64').slice(0, 24),
                title,
                link: link || sourceUrl,
                snippet: snippet.slice(0, 220),
                source: sourceName,
                sourceUrl,
                category: detectedCategory,
                pubDate: dateIso,
                dateYmd,
                formattedDate,
                timestamp: dateObj.getTime(),
                isAdSenseHighValue,
                isSensitive
            });
        }
    }
    return items;
}

// Master Prompt Builder Function (Permanent Production Edition — Jagatbarta News Engine)
function generateMasterPrompt(news) {
    const title = news.title || '';
    const source = news.source || 'জাতীয় গণমাধ্যম';
    const link = news.link || '';
    const category = news.category || 'তথ্য ও সংবাদ';
    const date = news.formattedDate || new Date().toLocaleDateString('bn-BD');

    return `JAGATBARTA.COM — MASTER NEWS REPORTING, SEO & ADSENSE PROMPT

[ভূমিকা ও দায়িত্ব]:
তুমি জগৎবার্তা (jagatbarta.com)-এর একজন অভিজ্ঞ বাংলা সংবাদ সম্পাদক, সিনিয়র তথ্য-যাচাইকারী (Fact-Checker) এবং এসইও এডিটর হিসেবে কাজ করবে। তোমার লক্ষ্য হলো নির্ভুল, পাঠকবান্ধব, মৌলিক ও তথ্যসমৃদ্ধ সংবাদ প্রতিবেদন তৈরি করা।
কোনোভাবেই শুধু সার্চ ইঞ্জিনে র্যাঙ্ক করার জন্য বা শব্দসংখ্যা বাড়ানোর জন্য লেখা কৃত্রিমভাবে বড় করবে না। পাঠকের তথ্যের প্রয়োজন, ঘটনার গুরুত্ব এবং সংবাদটির প্রকৃত তথ্যগত মূল্যকে (Real Value-Addition) সর্বোচ্চ অগ্রাধিকার দেবে।

==================================================
১. মূল সংবাদ ও রেফারেন্স:
- সংবাদের শিরোনাম: ${title}
- মূল সোর্স: ${source}
- সোর্স লিংক: ${link}
- ক্যাটাগরি: ${category}
- প্রকাশের তারিখ: ${date}
- প্রতিবেদনের ধরন: তথ্যভিত্তিক সংবাদ প্রতিবেদন
==================================================

২. সোর্স অ্যাক্সেস, তথ্য-যাচাই ও সম্পাদকীয় সততা (Strict Fact-Checking & Source Access):
- মূল সংবাদের প্রতিটি গুরুত্বপূর্ণ তথ্যকে (বিশেষ করে নাম, পদবি, তারিখ, স্থান, সংখ্যা, সরাসরি উদ্ধৃতি এবং অভিযোগ) সতর্কতার সাথে যাচাই করবে।
- মূল সোর্সের সম্পূর্ণ প্রতিবেদন বা নির্ভরযোগ্য বিকল্প উৎস যাচাই করতে না পারলে সেই সীমাবদ্ধতা স্পষ্ট করবে। শুধু শিরোনাম বা অসম্পূর্ণ তথ্যের ভিত্তিতে কাল্পনিক তথ্য যোগ করে প্রতিবেদন বড় করবে না।
- তথ্যের অনুপস্থিতি পূরণ করার জন্য কোনো অনুমান, মনগড়া উদ্ধৃতি, কল্পিত বিশেষজ্ঞের বক্তব্য বা কাল্পনিক পরিসংখ্যান তৈরি করবে না।
- মূল সংবাদে নেই এমন অতিরিক্ত তথ্য ব্যবহার করলে তা সর্বজনীন নির্ভরযোগ্য উৎস থেকে যাচাইযোগ্য হতে হবে। বাস্তবে উৎস যাচাই করার সুযোগ না থাকলে সেই তথ্যকে যাচাইকৃত বলে উপস্থাপন করবে না।
- মূল উৎসের তথ্য ব্যবহার করা এবং মূল উৎসের ভাষা বা কাঠামো নকল করা এক বিষয় নয়। অন্যের স্বতন্ত্র লেখা হুবহু বা সামান্য শব্দ পরিবর্তন করে প্রকাশ করবে না; সম্পূর্ণ নিজের ভাষায় নতুন মান ও তথ্য বিশ্লেষণ যোগ করবে।
- অভিযোগ, দাবি, প্রমাণিত তথ্য এবং প্রতিবেদকের বিশ্লেষণের মধ্যে স্পষ্ট পার্থক্য রাখবে।
- পরস্পরবিরোধী তথ্য পাওয়া গেলে নিজে থেকে কোনো একটি সংস্করণ বেছে নেবে না; প্রয়োজনীয় প্রেক্ষাপটসহ বিরোধটি সম্পাদকীয় নোটে জানাবে।
- কোনো তথ্যের নির্ভুলতা নিশ্চিত করা সম্ভব না হলে সেটি বাদ দেবে অথবা স্পষ্টভাবে অনিশ্চিত হিসেবে চিহ্নিত করবে।
- মূল উৎসের নাম (${source}) ও রেফারেন্স শালীনভাবে সংবাদের মধ্যে বা শেষে রাখবে।
- Editorial Verification Notes কেবল সম্পাদকীয় পর্যালোচনার জন্য থাকবে; এটি কোনোভাবেই প্রকাশিত আর্টিকেলের HTML Content-এর ভেতরে ঢুকবে না।

৩. মৌলিকতা ও Low-Value Content প্রতিরোধ (Real Value Addition):
- শুধুমাত্র খবরের অনুবাদ বা সাধারণ প্যারাফ্রেজ (শব্দ পরিবর্তন) করবে না।
- বিষয় অনুযায়ী নতুন ও কার্যকর মূল্য যোগ করো: ঘটনার প্রাসঙ্গিক পটভূমি, সংশ্লিষ্ট খাতের ওপর এর প্রভাব বা জনসাধারণের জন্য এর গুরুত্ব—কেবল তখনই অন্তর্ভুক্ত করবে যখন সেগুলো প্রাসঙ্গিক এবং নির্ভরযোগ্য তথ্য দিয়ে সমর্থিত।
- প্রতিবেদনের দৈর্ঘ্য ও পরিধি সংবাদের গুরুত্ব ও তথ্যের পরিমাণের ওপর নির্ভর করবে। জোর করে শব্দসংখ্যা বাড়ানোর জন্য অপ্রয়োজনীয় পুনরাবৃত্তি করবে না।

৪. স্বাভাবিক বাংলা সংবাদভাষা (১০০% Human Voice):
- বাংলাদেশের পাঠকদের উপযোগী সহজ, সাবলীল, প্রাঞ্জল ও নিরপেক্ষ বাংলা ব্যবহার করো।
- তথাকথিত এআই-মার্কা রোবোটিক শব্দাবলী পুরোপুরি বর্জনীয়: যেমন— "ভূমিকা", "পরিশেষে", "আলোকপাত করা যাক", "একটি যুগান্তকারী পদক্ষেপ", "সুতরাং বলা যায়", "বর্তমান প্রেক্ষাপটে"।
- খবরের গুরুত্ব অনুযায়ী বাক্যের দৈর্ঘ্য ও গঠন পরিবর্তন করবে। একই তথ্য বারবার ভিন্ন বাক্যে পুনরাবৃত্তি করবে না।
- কৃত্রিম আবেগ, অতিরঞ্জিত দাবি, ক্লিকবেইট ও চটকদার অতিরঞ্জন পরিহার করবে।

৫. প্রকাশনা ও ফরম্যাটিং নিয়ম (Jagatbarta Engine Standards):
- প্রতিবেদনের ধরন, দৈর্ঘ্য ও সাব-হেডিংয়ের সংখ্যা সংবাদটির প্রকৃত গুরুত্ব ও তথ্যের পরিমাণ অনুযায়ী নির্ধারণ করবে। পর্যাপ্ত তথ্য থাকলে ২ থেকে ৩টি প্রাসঙ্গিক সাব-হেডিং (<h2> বা <h3>) ব্যবহার করবে (যা জগৎবার্তার সূচিপত্র ট্রিগার করবে); কিন্তু ছোট সংবাদে জোর করে অপ্রয়োজনীয় বিভাগ তৈরি করবে না।
- অনুচ্ছেদগুলো সাধারণত ২ থেকে ৩ বাক্যের মধ্যে রাখবে, যাতে মোবাইলে পড়ার চমৎকার অভিজ্ঞতা নিশ্চিত হয়।
- গুরুত্বপূর্ণ পয়েন্টের জন্য <ul><li> এবং বিশেষ তথ্যের জন্য <blockquote> ব্যবহার করবে।
- পুরো প্রতিবেদনটি পিওর সিম্যান্টিক HTML-এ প্রদান করবে (কোনো ব্যাকটিক ছাড়া)।

৬. FAQ সেকশন (বাস্তব পাঠকের জিজ্ঞাসা):
- সংবাদটির ক্ষেত্রে পাঠকের বাস্তব ও প্রাসঙ্গিক কোনো প্রশ্ন উদয় হওয়ার সুযোগ থাকলে তবেই ১-২টি প্রশ্ন <h3> এবং তার উত্তর <p> ট্যাগে যোগ করবে। কৃত্রিম প্রশ্ন তৈরির প্রয়োজন নেই।

==================================================
[আউটপুট ফরম্যাট - হুবহু নিচের ক্রম অনুযায়ী আলাদা সেকশনে দিবে]:

১. SEO Title:
(৫০-৬০ অক্ষরের লক্ষ্যমাত্রা রেখে আকর্ষণীয়, তথ্যবহুল ও সার্চ-বান্ধব বাংলা শিরোনাম; অক্ষরের চেয়ে তথ্যের স্পষ্টতাকে অগ্রাধিকার দিবে)

২. English Slug:
(ছোট হাতের ইংরেজি অক্ষরে হাইফেন যুক্ত এসইও ফ্রেন্ডলি URL কী, যেমন: ${generateSampleSlug(title)})

৩. Summary:
(সংবাদের মূল আকর্ষণীয় সারসংক্ষেপ, সর্বোচ্চ ১৫০-১৬০ অক্ষর)

৪. Category:
(${category})

৫. Tags:
(৪ থেকে ৬টি অত্যন্ত প্রাসঙ্গিক বাংলা ট্যাগ, কমা দিয়ে আলাদা করা)

৬. SEO Keywords:
(৪ থেকে ৮টি প্রাসঙ্গিক লং-টেইল কীওয়ার্ড। কোনো ভুয়া সার্চ ভলিউমের দাবি ছাড়া পাঠকের সার্চ ইনটেন্টের সাথে সামঞ্জস্যপূর্ণ)

৭. SEO Description:
(গুগল মেটা ডেসক্রিপশনের জন্য ১৪০-১৬০ অক্ষরের আকর্ষণীয় সারসংক্ষেপ)

৮. Content (Clean Semantic HTML):
(এখানে সম্পূর্ণ আর্টিকেলের পিওর HTML কোড দিবে। প্রতিটি প্যারাগ্রাফ <p> ট্যাগে, সাব-হেডিংগুলো <h2> বা <h3> ট্যাগে, গুরুত্বপূর্ণ উদ্ধৃতি <blockquote>-এ, পয়েন্টগুলো <ul><li>-এ এবং প্রাসঙ্গিক হলে শেষাংশে FAQ সেকশন থাকবে। সতর্কতা: কোনো মেটাডেটা, স্ল্যাগ বা সম্পাদকীয় নোট এই HTML-এর ভেতরে ঢুকবে না।)

৯. Editorial Verification Notes:
(সম্পাদকীয় পর্যালোচনার জন্য সংক্ষিপ্ত নোট: যাচাইকৃত মূল তথ্য, ব্যবহৃত সোর্স এবং কোনো অমীমাংসিত তথ্য থাকলে তার বিবরণ — এটি আর্টিকেলের বাইরে থাকবে)`;
}

function generateSampleSlug(title) {
    if (!title) return 'bangladesh-news-update';
    return 'bangladesh-news-' + Math.floor(1000 + Math.random() * 9000);
}

// Feeds Configuration
const TOPIC_FEEDS = [
    { category: 'জাতীয়', feed: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'প্রযুক্তি', feed: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'অর্থনীতি', feed: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'স্বাস্থ্য', feed: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'শিক্ষা', feed: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'আন্তর্জাতিক', feed: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'খেলাধুলা', feed: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=bn&gl=BD&ceid=BD:bn' },
    { category: 'বিনোদন', feed: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=bn&gl=BD&ceid=BD:bn' }
];

const TOP_SOURCES = [
    { name: 'প্রথম আলো', q: 'source:প্রথম+আলো' },
    { name: 'দ্য ডেইলি স্টার', q: 'source:The+Daily+Star+Bangladesh' },
    { name: 'দৈনিক যুগান্তর', q: 'source:যুগান্তর' },
    { name: 'দৈনিক ইত্তেফাক', q: 'source:ইত্তেফাক' },
    { name: 'কালের কণ্ঠ', q: 'source:কালের+কণ্ঠ' },
    { name: 'সময় সংবাদ', q: 'source:সময়+টিভি' },
    { name: 'যমুনা টিভি', q: 'source:যমুনা+টিভি' },
    { name: 'বিডিনিউজ২৪', q: 'source:বিডিনিউজ' },
    { name: 'সমকাল', q: 'source:সমকাল' },
    { name: 'জাগো নিউজ', q: 'source:জাগো+নিউজ' }
];

// Core Feed Fetcher with Timeout & Fallbacks
async function fetchAllNewsFeeds() {
    const now = Date.now();
    if (feedCache.data.length > 0 && (now - feedCache.lastFetched) < CACHE_DURATION_MS) {
        return feedCache.data;
    }

    const allItems = [];
    const fetchPromises = [];

    // 1. Fetch Prothom Alo Feed
    fetchPromises.push(
        fetch('https://www.prothomalo.com/feed', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: AbortSignal.timeout(6000)
        })
        .then(res => res.text())
        .then(xml => {
            const items = parseXmlItems(xml, 'জাতীয়', 'প্রথম আলো');
            allItems.push(...items);
        })
        .catch(err => console.log('Prothom Alo Feed Notice:', err.message))
    );

    // 2. Fetch Topic Feeds
    for (const topic of TOPIC_FEEDS) {
        fetchPromises.push(
            fetch(topic.feed, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(6000)
            })
            .then(res => res.text())
            .then(xml => {
                const items = parseXmlItems(xml, topic.category, 'বাংলাদেশ সংবাদ');
                allItems.push(...items);
            })
            .catch(err => console.log(`Topic Feed (${topic.category}) Notice:`, err.message))
        );
    }

    // 3. Fetch Top Source Searches
    for (const src of TOP_SOURCES) {
        fetchPromises.push(
            fetch(`https://news.google.com/rss/search?q=${src.q}&hl=bn&gl=BD&ceid=BD:bn`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(6000)
            })
            .then(res => res.text())
            .then(xml => {
                const items = parseXmlItems(xml, 'জাতীয়', src.name);
                allItems.push(...items);
            })
            .catch(err => console.log(`Source (${src.name}) Notice:`, err.message))
        );
    }

    await Promise.allSettled(fetchPromises);

    // Deduplicate by normalized title
    const seenTitles = new Set();
    const uniqueItems = [];

    for (const item of allItems) {
        const norm = item.title.replace(/\s+/g, '').toLowerCase().slice(0, 30);
        if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            item.masterPrompt = generateMasterPrompt(item);
            uniqueItems.push(item);
        }
    }

    // Sort by latest timestamp
    uniqueItems.sort((a, b) => b.timestamp - a.timestamp);

    feedCache.data = uniqueItems;
    feedCache.lastFetched = Date.now();

    return uniqueItems;
}

// API: Get Curated News List
app.get('/api/news', async (req, res) => {
    try {
        const items = await fetchAllNewsFeeds();
        const { date, category, source, safe_only, search } = req.query;

        let filtered = items;

        // Date filter
        if (date && date !== 'all') {
            filtered = filtered.filter(item => item.dateYmd === date);
        }

        // Category filter
        if (category && category !== 'all') {
            if (category === 'safe_high_value') {
                filtered = filtered.filter(item => item.isAdSenseHighValue);
            } else {
                filtered = filtered.filter(item => item.category === category);
            }
        }

        // Safe Only filter
        if (safe_only === 'true' || safe_only === '1') {
            filtered = filtered.filter(item => item.isAdSenseHighValue);
        }

        // Source filter
        if (source && source !== 'all') {
            filtered = filtered.filter(item => item.source.toLowerCase().includes(source.toLowerCase()));
        }

        // Search filter
        if (search) {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(q) || 
                item.source.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
            );
        }

        res.json({
            success: true,
            totalCount: items.length,
            filteredCount: filtered.length,
            todayYmd: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }),
            todayFormatted: new Date().toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric' }),
            news: filtered
        });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Custom Prompt Generator
app.post('/api/custom-prompt', (req, res) => {
    const { title, source, link, category } = req.body;
    if (!title) {
        return res.status(400).json({ success: false, error: 'সংবাদের শিরোনাম আবশ্যক।' });
    }

    const newsObj = {
        title: title.trim(),
        source: source ? source.trim() : 'শীর্ষ গণমাধ্যম',
        link: link ? link.trim() : 'https://jagatbarta.com',
        category: category || 'জাতীয়',
        formattedDate: new Date().toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric' })
    };

    const prompt = generateMasterPrompt(newsObj);
    res.json({
        success: true,
        news: newsObj,
        prompt
    });
});

// API: Jagatbarta Categories
app.get('/api/categories', (req, res) => {
    res.json({ success: true, categories: JAGATBARTA_CATEGORIES });
});

// API: Top Bangladeshi Newspapers Directory (from w3newspapers)
app.get('/api/directory', (req, res) => {
    res.json({
        success: true,
        reference: 'https://www.w3newspapers.com/bangladesh/',
        newspapers: [
            { name: 'প্রথম আলো (Prothom Alo)', url: 'https://www.prothomalo.com', type: 'দৈনিক সংবাদপত্র', tag: 'শীর্ষ জাতীয়' },
            { name: 'দ্য ডেইলি স্টার (The Daily Star)', url: 'https://bangla.thedailystar.net', type: 'ইংরেজি ও বাংলা', tag: 'শীর্ষ জাতীয়' },
            { name: 'দৈনিক ইত্তেফাক (Daily Ittefaq)', url: 'https://www.ittefaq.com.bd', type: 'দৈনিক সংবাদপত্র', tag: 'ঐতিহ্যবাহী' },
            { name: 'দৈনিক যুগান্তর (Daily Jugantor)', url: 'https://www.jugantor.com', type: 'দৈনিক সংবাদপত্র', tag: 'জনপ্রিয়' },
            { name: 'কালের কণ্ঠ (Kaler Kantho)', url: 'https://www.kalerkantho.com', type: 'দৈনিক সংবাদপত্র', tag: 'বসুন্ধরা গ্রুপ' },
            { name: 'সমকাল (Samakal)', url: 'https://samakal.com', type: 'দৈনিক সংবাদপত্র', tag: 'জনপ্রিয়' },
            { name: 'বিডিনিউজ টোয়েন্টিফোর (bdnews24)', url: 'https://bangla.bdnews24.com', type: 'অনলাইন নিউজ পোর্টাল', tag: 'প্রথম অনলাইন' },
            { name: 'সময় সংবাদ (Somoy News)', url: 'https://www.somoynews.tv', type: 'টিভি নিউজ পোর্টাল', tag: 'শীর্ষ টিভি' },
            { name: 'যমুনা টিভি (Jamuna TV)', url: 'https://www.jamuna.tv', type: 'টিভি নিউজ পোর্টাল', tag: 'শীর্ষ টিভি' },
            { name: 'জাগো নিউজ (Jago News 24)', url: 'https://www.jagonews24.com', type: 'অনলাইন নিউজ পোর্টাল', tag: 'জনপ্রিয়' },
            { name: 'বাংলানিউজ২৪ (Banglanews24)', url: 'https://www.banglanews24.com', type: 'অনলাইন নিউজ পোর্টাল', tag: 'জনপ্রিয়' },
            { name: 'ঢাকা ট্রিবিউন (Dhaka Tribune)', url: 'https://bangla.dhakatribune.com', type: 'জাতীয় সংবাদপত্র', tag: 'ইংরেজি ও বাংলা' },
            { name: 'বাংলাদেশ প্রতিদিন (Bangladesh Pratidin)', url: 'https://www.bd-pratidin.com', type: 'সর্বাধিক প্রচারিত', tag: 'জাতীয়' },
            { name: 'নয়া দিগন্ত (Naya Diganta)', url: 'https://www.dailynayadiganta.com', type: 'দৈনিক সংবাদপত্র', tag: 'জাতীয়' },
            { name: 'মানবজমিন (Manab Zamin)', url: 'https://mzamin.com', type: 'ট্যাবলেয়েড দৈনিক', tag: 'জনপ্রিয়' },
            { name: 'চ্যানেল আই অনলাইন (Channel i)', url: 'https://www.channelionline.com', type: 'টিভি নিউজ পোর্টাল', tag: 'জনপ্রিয় টিভি' },
            { name: 'এনটিভি অনলাইন (NTV Online)', url: 'https://www.ntvbd.com', type: 'টিভি নিউজ পোর্টাল', tag: 'জনপ্রিয় টিভি' }
        ]
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Jagatbarta News Engine is actively running!`);
    console.log(`🌐 Local Web Dashboard: http://localhost:${PORT}`);
    console.log(`====================================================`);
});
