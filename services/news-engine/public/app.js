// Jagatbarta News Engine Frontend Controller
let allNewsData = [];
let activeFilters = {
    date: '', // default today YMD
    category: 'all', // Show all by default
    source: 'all',
    safeOnly: false, // Don't hide news by default
    search: ''
};

let currentModalPrompt = '';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupTabSwitching();
    setupFilters();
    setupCustomPrompt();
    loadDirectory();

    // Fetch initial news
    await fetchNews();
}

// Tab Switching
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });

            const target = document.getElementById(tabId);
            if (target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
        });
    });
}

// Setup Filters & Event Listeners
function setupFilters() {
    const dateInput = document.getElementById('dateFilterInput');
    const btnToday = document.getElementById('btnDateToday');
    const btnYesterday = document.getElementById('btnDateYesterday');
    const btnAll = document.getElementById('btnDateAll');
    const safeToggle = document.getElementById('safeOnlyToggle');
    const sourceSelect = document.getElementById('sourceSelect');
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');

    // Default safe toggle to false
    if (safeToggle) {
        safeToggle.checked = false;
    }

    // Quick Date: Today
    btnToday.addEventListener('click', () => {
        setDateQuickActive(btnToday);
        const todayYmd = getTodayYmd();
        dateInput.value = todayYmd;
        activeFilters.date = todayYmd;
        document.getElementById('sectionHeadingText').textContent = 'আজকের ফ্রেশ সংবাদ তালিকা';
        renderNews();
    });

    // Quick Date: Yesterday
    btnYesterday.addEventListener('click', () => {
        setDateQuickActive(btnYesterday);
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestYmd = yest.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
        dateInput.value = yestYmd;
        activeFilters.date = yestYmd;
        document.getElementById('sectionHeadingText').textContent = 'গতকালের সংবাদ তালিকা (' + yestYmd + ')';
        renderNews();
    });

    // Quick Date: All
    btnAll.addEventListener('click', () => {
        setDateQuickActive(btnAll);
        dateInput.value = '';
        activeFilters.date = 'all';
        document.getElementById('sectionHeadingText').textContent = 'সকল সংবাদ তালিকা';
        renderNews();
    });

    // Date Input Manual Change
    dateInput.addEventListener('change', (e) => {
        clearDateQuickActive();
        activeFilters.date = e.target.value;
        document.getElementById('sectionHeadingText').textContent = activeFilters.date ? `সংবাদ তালিকা (${activeFilters.date})` : 'সকল সংবাদ তালিকা';
        renderNews();
    });

    // Safe Only Toggle
    safeToggle.addEventListener('change', (e) => {
        activeFilters.safeOnly = e.target.checked;
        renderNews();
    });

    // Source Selector
    sourceSelect.addEventListener('change', (e) => {
        activeFilters.source = e.target.value;
        renderNews();
    });

    // Search Input with Debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            activeFilters.search = e.target.value.trim().toLowerCase();
            renderNews();
        }, 250);
    });

    // Category Pills
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            activeFilters.category = pill.getAttribute('data-cat');
            renderNews();
        });
    });

    // Refresh Button
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>রিফ্রেশ হচ্ছে...</span>';
        await fetchNews(true);
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>রিফ্রেশ</span>';
        showToast('ফিড সফলভাবে আপডেট হয়েছে!');
    });

    // Modal Copy Button
    document.getElementById('modalCopyBtn').addEventListener('click', () => {
        copyTextToClipboard(currentModalPrompt);
    });
}

function setDateQuickActive(button) {
    document.querySelectorAll('.btn-date-quick').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
}

function clearDateQuickActive() {
    document.querySelectorAll('.btn-date-quick').forEach(b => b.classList.remove('active'));
}

function getTodayYmd() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
}

// Fetch News Data from Backend
async function fetchNews(force = false) {
    const loader = document.getElementById('loader');
    const newsGrid = document.getElementById('newsGrid');
    const emptyState = document.getElementById('emptyState');

    loader.style.display = 'block';
    newsGrid.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const res = await fetch('/api/news');
        const data = await res.json();

        if (data.success) {
            allNewsData = data.news;

            // Set default date to today
            if (!activeFilters.date) {
                activeFilters.date = data.todayYmd;
                const dateInput = document.getElementById('dateFilterInput');
                if (dateInput) dateInput.value = data.todayYmd;
            }

            // Update Header Date
            document.getElementById('currentDateDisplay').textContent = 'আজ ' + data.todayFormatted;

            // Update Stats & Pill counters
            updateStats(data);

            // Render News List
            renderNews();
        }
    } catch (err) {
        console.error('Failed to load news:', err);
        loader.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'সংবাদ লোড করতে সমস্যা হয়েছে';
        emptyState.querySelector('p').textContent = 'অনুগ্রহ করে সার্ভার চালু আছে কিনা দেখে আবার রিফ্রেশ করুন।';
    }
}

// Filter and Render News Cards
function renderNews() {
    const loader = document.getElementById('loader');
    const newsGrid = document.getElementById('newsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsBadge = document.getElementById('resultsBadge');

    loader.style.display = 'none';

    let filtered = allNewsData;

    // 1. Date Filter
    if (activeFilters.date && activeFilters.date !== 'all') {
        filtered = filtered.filter(item => item.dateYmd === activeFilters.date);
    }

    // 2. Category Filter
    if (activeFilters.category && activeFilters.category !== 'all') {
        if (activeFilters.category === 'safe_high_value') {
            filtered = filtered.filter(item => item.isAdSenseHighValue);
        } else {
            filtered = filtered.filter(item => item.category === activeFilters.category);
        }
    }

    // 3. AdSense Safe Toggle
    if (activeFilters.safeOnly && activeFilters.category !== 'safe_high_value') {
        filtered = filtered.filter(item => item.isAdSenseHighValue);
    }

    // 4. Source Filter
    if (activeFilters.source && activeFilters.source !== 'all') {
        filtered = filtered.filter(item => item.source.toLowerCase().includes(activeFilters.source.toLowerCase()));
    }

    // 5. Search Filter
    if (activeFilters.search) {
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(activeFilters.search) || 
            item.source.toLowerCase().includes(activeFilters.search) ||
            item.category.toLowerCase().includes(activeFilters.search)
        );
    }

    resultsBadge.textContent = `${filtered.length}টি সংবাদ`;

    if (filtered.length === 0) {
        newsGrid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Build Cards HTML
    let html = '';
    filtered.forEach((item) => {
        const timeAgo = formatTimeAgo(item.timestamp);

        html += `
            <article class="news-card">
                <div>
                    <div class="card-top-meta">
                        <span class="source-badge">
                            <i class="far fa-newspaper"></i> ${escapeHtml(item.source)}
                        </span>
                        <span class="time-badge"><i class="far fa-clock mr-1"></i> ${timeAgo}</span>
                    </div>

                    <div class="badges-row">
                        <span class="cat-tag">${escapeHtml(item.category)}</span>
                        ${item.isAdSenseHighValue ? '<span class="gold-star-badge"><i class="fas fa-gem mr-1"></i> AdSense Safe</span>' : '<span class="cat-tag" style="background:rgba(239,68,68,0.15);color:#f87171;"><i class="fas fa-exclamation-circle mr-1"></i> স্পর্শকাতর</span>'}
                    </div>

                    <h3 class="news-title">
                        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(item.title)}
                        </a>
                    </h3>

                    ${item.snippet ? `<p class="news-snippet">${escapeHtml(item.snippet)}</p>` : ''}
                </div>

                <div class="card-actions">
                    <button class="btn-prompt-main" onclick="copyPromptDirect('${item.id}', this)" title="1 ক্লিকে মাস্টার প্রম্পট কপি করুন">
                        <i class="fas fa-bolt"></i> 1-Click Master Prompt
                    </button>
                    <button class="btn-action-icon" onclick="openPromptModal('${item.id}')" title="প্রম্পট প্রিভিউ ও কাস্টমাইজ">
                        <i class="fas fa-eye"></i>
                    </button>
                    <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="btn-action-icon" title="মূল সংবাদে যান">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </article>
        `;
    });

    newsGrid.innerHTML = html;
}

// Update Top Statistics
function updateStats(data) {
    const total = data.totalCount || 0;
    const todayYmd = getTodayYmd();
    const todayNews = (data.news || []).filter(n => n.dateYmd === todayYmd);
    const todayCount = todayNews.length;
    const highValueCount = (data.news || []).filter(n => n.isAdSenseHighValue).length;

    document.getElementById('statTotalCount').textContent = total + 'টি';
    document.getElementById('statTodayCount').textContent = todayCount + 'টি';
    document.getElementById('statHighValueCount').textContent = highValueCount + 'টি';
}

// 1-Click Copy Master Prompt Directly
function copyPromptDirect(itemId, buttonElement) {
    const item = allNewsData.find(n => n.id === itemId);
    if (!item) return;

    copyTextToClipboard(item.masterPrompt);

    // Visual button feedback
    if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.classList.add('copied');
        buttonElement.innerHTML = '<i class="fas fa-check"></i> প্রম্পট কপি হয়েছে!';

        setTimeout(() => {
            buttonElement.classList.remove('copied');
            buttonElement.innerHTML = originalText;
        }, 2000);
    }
}

// Open Prompt Preview Modal
function openPromptModal(itemId) {
    const item = allNewsData.find(n => n.id === itemId);
    if (!item) return;

    currentModalPrompt = item.masterPrompt;

    document.getElementById('modalNewsTitle').textContent = item.title;
    document.getElementById('modalNewsMeta').textContent = `${item.source} • ${item.category} • ${item.formattedDate}`;
    document.getElementById('modalPromptText').value = item.masterPrompt;

    document.getElementById('promptModal').classList.add('active');
}

function closePromptModal() {
    document.getElementById('promptModal').classList.remove('active');
}

// Custom Prompt Generator Tab
function setupCustomPrompt() {
    const btn = document.getElementById('btnGenCustomPrompt');
    const copyBtn = document.getElementById('btnCopyCustomPrompt');
    const outputArea = document.getElementById('customPromptOutputArea');
    const textarea = document.getElementById('customPromptTextarea');

    btn.addEventListener('click', async () => {
        const title = document.getElementById('customTitle').value.trim();
        const source = document.getElementById('customSource').value.trim();
        const category = document.getElementById('customCategory').value;
        const link = document.getElementById('customLink').value.trim();

        if (!title) {
            alert('অনুগ্রহ করে সংবাদের মূল শিরোনাম লিখুন।');
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রম্পট তৈরি হচ্ছে...';

        try {
            const res = await fetch('/api/custom-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, source, category, link })
            });
            const data = await res.json();

            if (data.success) {
                textarea.value = data.prompt;
                outputArea.style.display = 'block';
                outputArea.scrollIntoView({ behavior: 'smooth' });
                showToast('মাস্টার প্রম্পট তৈরি সম্পন্ন!');
            }
        } catch (err) {
            alert('প্রম্পট তৈরিতে সমস্যা হয়েছে: ' + err.message);
        } finally {
            btn.innerHTML = '<i class="fas fa-magic"></i> মাস্টার প্রম্পট জেনারেট করুন';
        }
    });

    copyBtn.addEventListener('click', () => {
        copyTextToClipboard(textarea.value);
    });
}

// Load Directory Tab from w3newspapers
async function loadDirectory() {
    const container = document.getElementById('directoryGrid');
    try {
        const res = await fetch('/api/directory');
        const data = await res.json();

        if (data.success) {
            let html = '';
            data.newspapers.forEach(p => {
                html += `
                    <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="directory-card">
                        <div>
                            <div class="directory-name">${escapeHtml(p.name)}</div>
                            <div class="directory-tag"><i class="fas fa-tag mr-1"></i> ${escapeHtml(p.type)} • ${escapeHtml(p.tag)}</div>
                        </div>
                        <i class="fas fa-external-link-alt directory-icon"></i>
                    </a>
                `;
            });
            container.innerHTML = html;
        }
    } catch (err) {
        console.error('Directory fetch error:', err);
    }
}

// Reset Filters
function resetFilters() {
    activeFilters = {
        date: getTodayYmd(),
        category: 'all',
        source: 'all',
        safeOnly: false,
        search: ''
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('sourceSelect').value = 'all';
    document.getElementById('safeOnlyToggle').checked = false;
    document.getElementById('dateFilterInput').value = activeFilters.date;
    setDateQuickActive(document.getElementById('btnDateToday'));

    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.cat-pill[data-cat="all"]').classList.add('active');

    renderNews();
}

// Copy to Clipboard with Toast
function copyTextToClipboard(text) {
    if (!text) return;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('মাস্টার প্রম্পট সফলভাবে ক্লিপবোর্ডে কপি হয়েছে!');
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast('মাস্টার প্রম্পট সফলভাবে ক্লিপবোর্ডে কপি হয়েছে!');
}

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (msgEl) msgEl.textContent = message;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// Helpers
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'আজ';
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${Math.max(1, diffMins)} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} দিন আগে`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
