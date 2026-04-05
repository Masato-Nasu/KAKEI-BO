const AUTH_KEY = 'kakei-bo-auth-ok-v1';
const AUTH_FALLBACK_PASSWORD = 'kakeibo';
const authGate = document.getElementById('authGate');
const appShell = document.getElementById('appShell');
const gatePasswordEl = document.getElementById('gatePassword');
const authForm = document.getElementById('authForm');
const unlockBtn = document.getElementById('unlockBtn');
const authStatusEl = document.getElementById('authStatus');

const receiptInput = document.getElementById('receiptInput');
const previewImage = document.getElementById('previewImage');
const uploadPrompt = document.getElementById('uploadPrompt');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const installBtn = document.getElementById('installBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const exportNotice = document.getElementById('exportNotice');

const merchantEl = document.getElementById('merchant');
const dateEl = document.getElementById('date');
const totalEl = document.getElementById('total');
const categoryEl = document.getElementById('category');
const itemsEl = document.getElementById('items');
const noteEl = document.getElementById('note');
const historyList = document.getElementById('historyList');
const entryCount = document.getElementById('entryCount');
const monthTotal = document.getElementById('monthTotal');
const categoryList = document.getElementById('categoryList');
const dictList = document.getElementById('dictList');

const STORAGE_KEY = 'kakei-bo-ledger-v4';
const USER_DICT_KEY = 'kakei-bo-user-dict-v1';
const CATEGORY_ORDER = ['食費', '日用品', '外食', 'ソフトドリンク', 'お酒', 'ノンアル', 'おかし', '交通', '医療', '趣味', '交際', '未分類'];
const CATEGORY_KEYWORDS = [
  {
    category: 'ノンアル',
    keywords: ['ノンアル', 'ノンアルコール', 'ゼロアル', '0.00', '0%', 'オールフリー', 'ドライゼロ', 'のんある気分', 'よわない', '休肝日']
  },
  {
    category: 'ソフトドリンク',
    keywords: ['ブレンド', 'コーヒー', '珈琲', 'カフェラテ', 'ラテ', 'エスプレッソ', 'カフェオレ', '紅茶', 'ミルクティー', 'ティー', 'お茶', '緑茶', '烏龍茶', 'ウーロン', '麦茶', '天然水', 'いろはす', '水', '炭酸水', 'コーラ', 'サイダー', 'ファンタ', 'ジュース', 'オレンジ', 'アップル', 'カルピス', 'ポカリ', 'アクエリ', 'モンスター', 'レッドブル']
  },
  {
    category: 'お酒',
    keywords: ['ビール', '発泡酒', '第三のビール', '酎ハイ', 'チューハイ', 'サワー', 'ハイボール', 'ワイン', '日本酒', '焼酎', '梅酒', 'ウイスキー', 'ウィスキー', 'ジン', 'ウォッカ', 'ラム', 'テキーラ', 'シャンパン', 'スパークリング', 'レモンサワー', '角ハイ', '角瓶', 'トリス', '淡麗', 'グリーンラベル', '本麒麟', '金麦', '氷結', 'ほろよい', 'ストロング', 'プレモル', '一番搾り', 'スーパードライ', '麒麟', 'キリン', 'アサヒ', 'サントリー', 'クリアアサヒ']
  },
  {
    category: 'おかし',
    keywords: ['ブラックサンダー', 'チョコ', 'チョコレート', 'ポテチ', 'ポテトチップ', 'じゃがりこ', 'じゃがビー', 'せんべい', '煎餅', 'クッキー', 'ビスケット', 'グミ', 'ガム', 'キャンディ', '飴', 'アメ', 'ラムネ', 'アイス', '最中', 'もなか', 'ケーキ', 'プリン', 'シュー', 'パイ', 'ドーナツ', 'まんじゅう', '饅頭', '大福', 'スナック']
  },
  {
    category: '日用品',
    keywords: ['ティッシュ', 'トイレットペーパー', '洗剤', 'シャンプー', 'ボディソープ', '歯ブラシ', '歯みがき', '歯磨き', 'スポンジ', 'ラップ', '電池', 'ゴミ袋', 'マスク', '洗顔', '柔軟剤']
  },
  {
    category: '医療',
    keywords: ['ロキソニン', 'イブ', 'バファリン', '正露丸', '絆創膏', 'ばんそうこう', '湿布', '目薬', 'マスク', '消毒', '体温計']
  },
  {
    category: '交通',
    keywords: ['suica', 'pasmo', 'ic', '乗車券', '定期', '切符', '高速', '駐車場', 'ガソリン', '軽油', 'タクシー']
  }
];
const MERCHANT_HINTS = [
  { match: ['スターバックス', 'starbucks'], category: 'ソフトドリンク' },
  { match: ['タリーズ', 'tully'], category: 'ソフトドリンク' },
  { match: ['ドトール', 'doutor'], category: 'ソフトドリンク' },
  { match: ['マクドナルド', 'マック', 'mcdonald'], category: '外食' },
  { match: ['すき家', '松屋', '吉野家', 'coco壱', 'ココイチ', 'はなまる', '丸亀'], category: '外食' },
  { match: ['セブン', '7-eleven', 'ローソン', 'ファミマ', 'ファミリーマート', 'ミニストップ'], category: '食費' },
  { match: ['マツモトキヨシ', 'ウエルシア', 'サンドラッグ', 'スギ薬局'], category: '日用品' }
];

let selectedFile = null;
let previewDataUrl = '';
let deferredPrompt = null;
let currentAnalyzedItemDetails = [];

function isAuthorized() {
  return localStorage.getItem(AUTH_KEY) === '1';
}

function showApp() {
  authGate?.classList.add('hidden');
  appShell?.classList.remove('hidden');
}

function showGate(message = 'パスワード未入力です。') {
  authGate?.classList.remove('hidden');
  appShell?.classList.add('hidden');
  if (authStatusEl) authStatusEl.textContent = message;
}

async function verifyPassword(password) {
  const trimmed = String(password || '').trim();
  if (!trimmed) return { ok: false, error: 'パスワードを入力してください。' };

  if (trimmed === AUTH_FALLBACK_PASSWORD) {
    return { ok: true, fallback: true };
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'x-app-password-check': '1', 'x-app-password': trimmed },
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.ok) return { ok: true };
    return { ok: false, error: data?.error || 'パスワードが違います。' };
  } catch (_) {
    return { ok: false, error: 'パスワード確認に失敗しました。' };
  }
}

async function unlockApp(event) {
  event?.preventDefault();

  const password = String(gatePasswordEl?.value || '').trim();
  if (!password) {
    showGate('パスワードを入力してください。');
    return;
  }

  if (authStatusEl) authStatusEl.textContent = '確認しています…';
  if (unlockBtn) {
    unlockBtn.disabled = true;
    unlockBtn.textContent = '確認中…';
  }

  try {
    const result = await verifyPassword(password);
    if (!result.ok) {
      showGate(result.error || 'パスワードが違います。');
      return;
    }

    localStorage.setItem(AUTH_KEY, '1');
    sessionStorage.setItem('kakei-bo-password', password);

    if (gatePasswordEl) gatePasswordEl.value = '';
    showApp();
  } finally {
    if (unlockBtn) {
      unlockBtn.disabled = false;
      unlockBtn.textContent = '利用開始';
    }
  }
}


function loadEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(normalizeStoredEntry) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadUserDict() {
  try {
    const raw = JSON.parse(localStorage.getItem(USER_DICT_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function saveUserDict(dict) {
  localStorage.setItem(USER_DICT_KEY, JSON.stringify(dict));
}

function normalizeStoredEntry(entry = {}) {
  const items = Array.isArray(entry.items) ? entry.items.map(v => String(v || '').trim()).filter(Boolean) : [];
  const itemDetails = Array.isArray(entry.itemDetails) && entry.itemDetails.length
    ? entry.itemDetails
        .map(detail => ({
          name: String(detail?.name || '').trim(),
          category: normalizeCategory(detail?.category) || classifyItemName(detail?.name) || '未分類',
          price: parseMoney(detail?.price ?? detail?.amount ?? 0),
        }))
        .filter(detail => detail.name)
    : deriveItemDetails(items, entry.note);

  const category = normalizeCategory(entry.category) || inferEntryCategory(itemDetails, entry.merchant) || '未分類';

  return {
    ...entry,
    merchant: String(entry.merchant || '').trim(),
    date: String(entry.date || '').trim(),
    total: parseMoney(entry.total || 0),
    category,
    items,
    itemDetails,
    note: String(entry.note || '').trim(),
    imageDataUrl: String(entry.imageDataUrl || ''),
    createdAt: String(entry.createdAt || ''),
  };
}

function parseMoney(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const s = String(value ?? '')
    .replace(/[￥¥,\s]/g, '')
    .replace(/[^0-9.\-]/g, '');

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatYen(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(n);
}

function resetForm() {
  merchantEl.value = '';
  dateEl.value = '';
  totalEl.value = '';
  categoryEl.value = '';
  itemsEl.value = '';
  noteEl.value = '';
  currentAnalyzedItemDetails = [];
  saveBtn.disabled = true;
}

function resetImage() {
  selectedFile = null;
  previewDataUrl = '';
  receiptInput.value = '';
  previewImage.src = '';
  previewImage.classList.add('hidden');
  uploadPrompt.classList.remove('hidden');
  analyzeBtn.disabled = true;
  statusEl.textContent = '画像を選択してください。';
}

function renderSummary(entries) {
  entryCount.textContent = entries.length;

  const total = entries.reduce((sum, entry) => sum + parseMoney(entry.total || 0), 0);
  monthTotal.textContent = formatYen(total);

  const byCategory = new Map();

  entries.forEach(entry => {
    const breakdown = getCategoryBreakdown(entry);

    if (breakdown.length) {
      breakdown.forEach(part => {
        const key = normalizeCategory(part.category) || '未分類';
        const prev = byCategory.get(key) || { amount: 0, count: 0 };
        byCategory.set(key, {
          amount: prev.amount + parseMoney(part.amount || 0),
          count: prev.count + Number(part.count || 0),
        });
      });
      return;
    }

    const fallbackKey = inferEntryCategory(entry.itemDetails, entry.merchant) || '未分類';
    const prev = byCategory.get(fallbackKey) || { amount: 0, count: 0 };
    byCategory.set(fallbackKey, {
      amount: prev.amount + parseMoney(entry.total || 0),
      count: prev.count + 1,
    });
  });

  const sorted = [...byCategory.entries()]
    .sort((a, b) => b[1].amount - a[1].amount || CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]));

  categoryList.innerHTML = sorted.length
    ? sorted.map(([name, meta]) => `<li><span>${escapeHtml(name)} <small>${meta.count}件</small></span><strong>${formatYen(meta.amount)}</strong></li>`).join('')
    : '<li><span>まだデータがありません</span><strong>—</strong></li>';
}

function getCategoryBreakdown(entry) {
  const itemDetails = Array.isArray(entry.itemDetails)
    ? entry.itemDetails.filter(detail => detail?.name)
    : [];

  if (!itemDetails.length) return [];

  const receiptTotal = parseMoney(entry.total || 0);
  const normalized = itemDetails.map(detail => ({
    name: detail.name,
    category:
      normalizeCategory(detail.category) ||
      classifyItemName(detail.name) ||
      inferEntryCategory(itemDetails, entry.merchant) ||
      '未分類',
    price: parseMoney(detail.price ?? detail.amount ?? 0),
  }));

  const knownTotal = normalized.reduce((sum, detail) => sum + detail.price, 0);
  const fallbackShare = normalized.length && knownTotal <= 0 && receiptTotal > 0 ? receiptTotal / normalized.length : 0;

  const grouped = new Map();

  normalized.forEach(detail => {
    const amount = detail.price > 0 ? detail.price : fallbackShare;
    const prev = grouped.get(detail.category) || { amount: 0, count: 0 };
    grouped.set(detail.category, {
      amount: prev.amount + amount,
      count: prev.count + 1,
    });
  });

  return [...grouped.entries()].map(([category, meta]) => ({
    category,
    amount: meta.amount,
    count: meta.count,
  }));
}

function escapeHtml(str = '') {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


function showExportNotice(message) {
  exportNotice.textContent = message;
  exportNotice.classList.remove('hidden');
  window.clearTimeout(showExportNotice._timer);
  showExportNotice._timer = window.setTimeout(() => {
    exportNotice.classList.add('hidden');
  }, 4000);
}

function formatDateLabel(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return '日付なし';
  const [y, m, d] = normalized.split('-');
  return `${y}/${m}/${d}`;
}

function groupEntriesByCategory(entries) {
  const groups = new Map();
  entries.forEach(entry => {
    const key = normalizeCategory(entry.category) || inferEntryCategory(entry.itemDetails, entry.merchant) || '未分類';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  return [...groups.entries()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a[0]);
    const bi = CATEGORY_ORDER.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

function renderHistory() {
  const entries = loadEntries().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  renderSummary(entries);
  renderDictionary();

  if (!entries.length) {
    historyList.innerHTML = '<div class="history-item"><div class="history-meta">まだ保存履歴がありません。</div></div>';
    return;
  }

  historyList.innerHTML = entries.map(entry => `
    <article class="history-item">
      <div class="history-top">
        <div>
          <h4 class="history-merchant">${escapeHtml(entry.merchant || '店名なし')}</h4>
          <div class="history-meta">${escapeHtml(formatDateLabel(entry.date))}</div>
        </div>
        <div class="history-top-right">
          <div class="history-total">${formatYen(entry.total)}</div>
          <div class="history-chip-row">${[...new Set(getCategoryBreakdown(entry).map(item => item.category))].map(name => `<span class="history-chip">${escapeHtml(name)}</span>`).join('') || `<span class="history-chip">未分類</span>`}</div>
        </div>
      </div>
      <div class="history-body">
        ${entry.imageDataUrl ? `<img class="thumb" src="${entry.imageDataUrl}" alt="receipt" />` : ''}
        <div class="history-items-wrap">
          <div class="history-items-title">品目ごとの修正</div>
          <div class="history-item-list">
            ${(entry.itemDetails || []).length ? entry.itemDetails.map((detail, idx) => `
              <div class="item-row" data-entry-id="${entry.id}" data-item-index="${idx}">
                <div class="item-row-name">${escapeHtml(detail.name)}${parseMoney(detail.price) ? ` <small>${formatYen(detail.price)}</small>` : ''}</div>
                <select class="item-category-select" data-entry-id="${entry.id}" data-item-index="${idx}">
                  ${CATEGORY_ORDER.map(cat => `<option value="${escapeHtml(cat)}" ${normalizeCategory(detail.category) === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                </select>
                <div class="item-row-actions">
                  <button class="ghost mini item-register" data-entry-id="${entry.id}" data-item-index="${idx}" type="button">辞書登録</button>
                </div>
              </div>
            `).join('') : `<div class="history-items">${escapeHtml((entry.items || []).join('\n') || '品目なし')}</div>`}
          </div>
        </div>
      </div>
      ${entry.note ? `<div class="history-meta">メモ: ${escapeHtml(entry.note)}</div>` : ''}
      <button class="ghost history-delete" data-id="${entry.id}" type="button">この記録を削除</button>
    </article>
  `).join('');
}

function renderDictionary() {
  if (!dictList) return;
  const dict = loadUserDict();
  const rows = Object.entries(dict).sort((a, b) => a[0].localeCompare(b[0], 'ja'));
  dictList.innerHTML = rows.length
    ? rows.map(([name, category]) => `
      <div class="dict-row">
        <div>
          <strong>${escapeHtml(name)}</strong>
          <div class="history-meta">${escapeHtml(category)}</div>
        </div>
        <button class="ghost mini dict-delete" data-dict-name="${escapeHtml(name)}" type="button">削除</button>
      </div>
    `).join('')
    : '<div class="history-meta">まだ辞書登録がありません。</div>';
}

historyList.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.history-delete');
  if (deleteBtn) {
    const next = loadEntries().filter(entry => entry.id !== deleteBtn.dataset.id);
    saveEntries(next);
    renderHistory();
    statusEl.textContent = '記録を削除しました。';
    return;
  }

  const registerBtn = event.target.closest('.item-register');
  if (registerBtn) {
    const row = registerBtn.closest('.item-row');
    const select = row?.querySelector('.item-category-select');
    const entryId = row?.dataset.entryId || registerBtn.dataset.entryId;
    const itemIndex = Number(row?.dataset.itemIndex ?? registerBtn.dataset.itemIndex);
    if (!select || !entryId || Number.isNaN(itemIndex)) return;

    const result = persistItemCategory(entryId, itemIndex, select.value, { registerDict: true });
    if (!result) return;
    renderHistory();
    statusEl.textContent = `辞書登録しました。${result.name} → ${result.category}`;
  }
});

historyList.addEventListener('change', (event) => {
  const select = event.target.closest('.item-category-select');
  if (!select) return;

  const row = select.closest('.item-row');
  const entryId = row?.dataset.entryId || select.dataset.entryId;
  const itemIndex = Number(row?.dataset.itemIndex ?? select.dataset.itemIndex);
  if (!entryId || Number.isNaN(itemIndex)) return;

  const result = persistItemCategory(entryId, itemIndex, select.value);
  if (!result) return;
  renderHistory();
  statusEl.textContent = `カテゴリを自動更新しました。${result.name} → ${result.category}`;
});


function persistItemCategory(entryId, itemIndex, category, { registerDict = false } = {}) {
  const entries = loadEntries();
  const target = entries.find(entry => entry.id === entryId);
  if (!target || !target.itemDetails?.[itemIndex]) return null;

  const safeCategory = normalizeCategory(category) || '未分類';
  target.itemDetails[itemIndex].category = safeCategory;
  target.category = inferEntryCategory(target.itemDetails, target.merchant) || target.category || '未分類';
  saveEntries(entries);

  if (registerDict) {
    const dict = loadUserDict();
    dict[target.itemDetails[itemIndex].name] = safeCategory;
    saveUserDict(dict);
  }

  return { name: target.itemDetails[itemIndex].name, category: safeCategory };
}

if (dictList) {
  dictList.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.dict-delete');
    if (!deleteBtn) return;
    const name = deleteBtn.dataset.dictName;
    const dict = loadUserDict();
    delete dict[name];
    saveUserDict(dict);
    renderHistory();
    statusEl.textContent = `辞書から削除しました。${name}`;
  });
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

receiptInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  selectedFile = file;
  const objectUrl = URL.createObjectURL(file);
  previewImage.onload = () => URL.revokeObjectURL(objectUrl);
  previewImage.src = objectUrl;
  previewImage.classList.remove('hidden');
  uploadPrompt.classList.add('hidden');
  analyzeBtn.disabled = false;
  try {
    previewDataUrl = await fileToDataUrl(file);
    statusEl.textContent = '画像を読み込みました。AIで整理できます。';
  } catch (_) {
    previewDataUrl = '';
    statusEl.textContent = '画像の読み込みに失敗しました。別の画像で試してください。';
  }
  resetForm();
});

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  analyzeBtn.disabled = true;
  saveBtn.disabled = true;
  statusEl.textContent = 'AIで解析中です…';

  try {
    const formData = new FormData();
    formData.append('receipt', selectedFile, selectedFile.name || 'receipt.jpg');

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'x-app-password': localStorage.getItem(AUTH_KEY) === '1' ? (sessionStorage.getItem('kakei-bo-password') || AUTH_FALLBACK_PASSWORD) : '' },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '解析に失敗しました。');
    }

    currentAnalyzedItemDetails = normalizeAnalyzedItems(data.items, data.note);
    const normalizedItems = currentAnalyzedItemDetails.map(v => v.name);
    const inferredCategory = normalizeCategory(data.category) || inferEntryCategory(currentAnalyzedItemDetails, data.merchant) || '未分類';

    merchantEl.value = data.merchant || '';
    dateEl.value = normalizeDate(data.date) || '';
    totalEl.value = data.total ?? '';
    categoryEl.value = inferredCategory;
    itemsEl.value = normalizedItems.join('\n');
    noteEl.value = data.note || '';
    saveBtn.disabled = false;
    statusEl.textContent = '抽出できました。カテゴリ変更は自動で反映されます。';
  } catch (error) {
    statusEl.textContent = error.message || '解析に失敗しました。';
  } finally {
    analyzeBtn.disabled = false;
  }
});

function normalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeCategory(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (CATEGORY_ORDER.includes(s)) return s;
  const lower = s.toLowerCase();
  if (['drink', 'softdrink', 'beverage', 'ソフトドリンク', '飲み物', '飲料'].includes(lower)) return 'ソフトドリンク';
  if (['nonalcohol', 'non-alcohol', 'ノンアル', 'ノンアルコール'].includes(lower)) return 'ノンアル';
  if (['alcohol', 'liquor', '酒', 'お酒'].includes(lower)) return 'お酒';
  if (['snack', 'sweets', 'dessert', 'お菓子', '菓子'].includes(lower)) return 'おかし';
  return s;
}

function normalizeForSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[ーｰ‐-]/g, 'ー');
}

function classifyItemName(name) {
  const target = normalizeForSearch(name);
  if (!target) return '';

  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some(keyword => target.includes(normalizeForSearch(keyword)))) {
      return rule.category;
    }
  }

  if (/(弁当|おにぎり|パン|サンド|寿司|惣菜|牛乳|たまご|卵|豆腐|サラダ)/.test(target)) return '食費';
  return '';
}

function inferMerchantCategory(merchant) {
  const target = normalizeForSearch(merchant);
  if (!target) return '';
  for (const hint of MERCHANT_HINTS) {
    if (hint.match.some(keyword => target.includes(normalizeForSearch(keyword)))) {
      return hint.category;
    }
  }
  return '';
}


function categoryFromNoteLabel(label) {
  const text = normalizeForSearch(label);
  if (!text) return '';
  if (text.includes('ノンアル') || text.includes('ノンアルコール')) return 'ノンアル';
  if (text.includes('お酒') || text.includes('酒類') || text.includes('アルコール')) return 'お酒';
  if (text.includes('ソフトドリンク') || text.includes('飲料') || text.includes('飲み物')) return 'ソフトドリンク';
  if (text.includes('おかし') || text.includes('菓子') || text.includes('スイーツ')) return 'おかし';
  if (text.includes('食費') || text.includes('食品')) return '食費';
  return '';
}

function extractCategorizedItemsFromNote(note) {
  const text = String(note || '').trim();
  if (!text) return [];

  const results = [];
  const patterns = [
    /([^\n。]+?)は([^\n。]+?)(?:です|です。|です\.|。|$)/g,
    /([^\n。]+?)を([^\n。]+?)として扱う/g,
  ];

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      const namesPart = String(match[1] || '').replace(/^メモ[:：]?/, '').trim();
      const labelPart = String(match[2] || '').trim();
      const category = categoryFromNoteLabel(labelPart);
      if (!category || !namesPart) continue;

      namesPart
        .split(/[、,，\/]\s*/)
        .map(v => v.trim())
        .filter(Boolean)
        .forEach(name => results.push({ name, category }));
    }
  });

  return results;
}

function buildSeedPriceMap(seedDetails = []) {
  const map = new Map();
  (Array.isArray(seedDetails) ? seedDetails : []).forEach(detail => {
    const name = String(detail?.name || '').trim();
    if (!name) return;
    const key = normalizeForSearch(name);
    if (!map.has(key)) {
      map.set(key, {
        category: normalizeCategory(detail?.category) || '',
        price: parseMoney(detail?.price ?? detail?.amount ?? 0),
      });
    }
  });
  return map;
}

function deriveItemDetails(items, note = '', seedDetails = []) {
  const noteDerivedMap = new Map();
  extractCategorizedItemsFromNote(note).forEach(detail => {
    const key = normalizeForSearch(detail.name);
    if (!noteDerivedMap.has(key)) {
      noteDerivedMap.set(key, normalizeCategory(detail.category) || '');
    }
  });

  const seedMap = buildSeedPriceMap(seedDetails);

  return (Array.isArray(items) ? items : [])
    .map(name => String(name || '').trim())
    .filter(Boolean)
    .map(name => {
      const key = normalizeForSearch(name);
      const seeded = seedMap.get(key) || {};
      return {
        name,
        category: noteDerivedMap.get(key) || normalizeCategory(seeded.category) || classifyItemName(name) || '',
        price: parseMoney(seeded.price || 0),
      };
    });
}

function inferEntryCategory(itemDetails, merchant = '') {
  const counts = new Map();
  (Array.isArray(itemDetails) ? itemDetails : []).forEach(detail => {
    const category = normalizeCategory(detail?.category);
    if (!category) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  if (counts.size) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]))[0][0];
  }

  return inferMerchantCategory(merchant) || '';
}

function normalizeAnalyzedItems(items, note = '') {
  const rawItems = Array.isArray(items) ? items : [];
  const normalized = rawItems
    .map(item => {
      if (typeof item === 'string') {
        return { name: item.trim(), category: classifyItemName(item) || '', price: 0 };
      }
      if (item && typeof item === 'object') {
        const name = String(item.name || item.item || '').trim();
        return {
          name,
          category: normalizeCategory(item.category) || classifyItemName(name) || '',
          price: parseMoney(item.price ?? item.amount ?? 0),
        };
      }
      return { name: '', category: '', price: 0 };
    })
    .filter(item => item.name);

  return deriveItemDetails(normalized.map(item => item.name), note, normalized);
}

saveBtn.addEventListener('click', () => {
  const items = itemsEl.value.split('\n').map(v => v.trim()).filter(Boolean);
  const itemDetails = deriveItemDetails(items, noteEl.value, currentAnalyzedItemDetails);
  const merchant = merchantEl.value.trim();
  const category = normalizeCategory(categoryEl.value) || inferEntryCategory(itemDetails, merchant) || '未分類';

  if (!items.length && !merchant && !Number(totalEl.value || 0)) {
    statusEl.textContent = '保存するデータがありません。';
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    merchant,
    date: dateEl.value,
    total: parseMoney(totalEl.value || 0),
    category,
    items,
    itemDetails: itemDetails.map(detail => ({
      name: detail.name,
      category: normalizeCategory(detail.category) || category,
      price: parseMoney(detail.price || 0),
    })),
    note: noteEl.value.trim(),
    imageDataUrl: previewDataUrl,
    createdAt: new Date().toISOString(),
  };

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  renderHistory();
  resetForm();
  resetImage();
  statusEl.textContent = `保存しました。${entry.itemDetails.length ? '品目カテゴリで集計します。' : ''}`;
});

clearBtn.addEventListener('click', () => {
  resetForm();
  resetImage();
});

exportBtn.addEventListener('click', () => {
  const entries = loadEntries();

  if (!entries.length) {
    statusEl.textContent = '書き出すデータがありません。';
    return;
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const fileName = `kakei-bo-${yyyy}${mm}${dd}-${hh}${mi}${ss}.json`;

  const blob = new Blob(
    [JSON.stringify(entries, null, 2)],
    { type: 'application/json;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  statusEl.textContent = `JSONを書き出しました。${entries.length}件を保存しました。`;
  showExportNotice(`JSON保存完了: ${fileName} ・ ${entries.length}件 ・ ${hh}:${mi}`);
});

deleteAllBtn.addEventListener('click', () => {
  if (!confirm('保存履歴をすべて削除しますか？')) return;
  saveEntries([]);
  renderHistory();
  statusEl.textContent = '保存履歴を削除しました。';
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});


if (authForm) {
  authForm.addEventListener('submit', unlockApp);
}

if (gatePasswordEl) {
  gatePasswordEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      unlockApp(event);
    }
  });
}

if (isAuthorized()) {
  showApp();
} else {
  showGate('パスワードを入力してください。');
}

renderHistory();
