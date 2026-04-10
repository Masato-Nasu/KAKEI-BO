const AUTH_KEY = 'kakei-bo-auth-ok-v1';
const AUTH_FALLBACK_PASSWORD = 'kakeibo';
const STORAGE_KEY = 'kakei-bo-ledger-v5';
const USER_DICT_KEY = 'kakei-bo-user-dict-v1';
const CATEGORY_CONFIG_KEY = 'kakei-bo-category-config-v1';
const FAMILY_CONFIG_KEY = 'kakei-bo-family-config-v1';

const DEFAULT_MEMBERS = ['家族共通', '夫', '妻', '子供'];

const DEFAULT_CATEGORIES = [
  '食費',
  '日用品',
  '外食',
  'ソフトドリンク',
  'お酒',
  'ノンアル',
  'おかし',
  'クーポン',
  '値引き',
  '交通',
  '医療',
  '趣味',
  '交際',
  '未分類',
];

const CATEGORY_KEYWORDS = [
  {
    category: 'クーポン',
    keywords: ['クーポン', 'coupon', 'アプリクーポン', 'レジクーポン', '値引クーポン', 'お買得クーポン'],
  },
  {
    category: '値引き',
    keywords: ['値引', '割引', '値下', '奉仕', '特売値引', 'お買得', 'まとめ値引', '調整額', '還元', 'ポイント充当'],
  },
  {
    category: 'ノンアル',
    keywords: ['ノンアル', 'ノンアルコール', 'ゼロアル', '0.00', '0%', 'オールフリー', 'ドライゼロ', 'のんある気分', 'よわない', '休肝日'],
  },
  {
    category: 'ソフトドリンク',
    keywords: ['ブレンド', 'コーヒー', '珈琲', 'カフェラテ', 'ラテ', 'エスプレッソ', 'カフェオレ', '紅茶', 'ミルクティー', 'ティー', 'お茶', '緑茶', '烏龍茶', 'ウーロン', '麦茶', '天然水', 'いろはす', '水', '炭酸水', 'コーラ', 'サイダー', 'ファンタ', 'ジュース', 'オレンジ', 'アップル', 'カルピス', 'ポカリ', 'アクエリ', 'モンスター', 'レッドブル'],
  },
  {
    category: 'お酒',
    keywords: ['ビール', '発泡酒', '第三のビール', '酎ハイ', 'チューハイ', 'サワー', 'ハイボール', 'ワイン', '日本酒', '焼酎', '梅酒', 'ウイスキー', 'ウィスキー', 'ジン', 'ウォッカ', 'ラム', 'テキーラ', 'シャンパン', 'スパークリング', 'レモンサワー', '角ハイ', '角瓶', 'トリス', '淡麗', 'グリーンラベル', '本麒麟', '金麦', '氷結', 'ほろよい', 'ストロング', 'プレモル', '一番搾り', 'スーパードライ', '麒麟', 'キリン', 'アサヒ', 'サントリー', 'クリアアサヒ'],
  },
  {
    category: 'おかし',
    keywords: ['ブラックサンダー', 'チョコ', 'チョコレート', 'ポテチ', 'ポテトチップ', 'じゃがりこ', 'じゃがビー', 'せんべい', '煎餅', 'クッキー', 'ビスケット', 'グミ', 'ガム', 'キャンディ', '飴', 'アメ', 'ラムネ', 'アイス', '最中', 'もなか', 'ケーキ', 'プリン', 'シュー', 'パイ', 'ドーナツ', 'まんじゅう', '饅頭', '大福', 'スナック'],
  },
  {
    category: '日用品',
    keywords: ['ティッシュ', 'トイレットペーパー', '洗剤', 'シャンプー', 'ボディソープ', '歯ブラシ', '歯みがき', '歯磨き', 'スポンジ', 'ラップ', '電池', 'ゴミ袋', 'マスク', '洗顔', '柔軟剤'],
  },
  {
    category: '医療',
    keywords: ['ロキソニン', 'イブ', 'バファリン', '正露丸', '絆創膏', 'ばんそうこう', '湿布', '目薬', '消毒', '体温計'],
  },
  {
    category: '交通',
    keywords: ['suica', 'pasmo', 'ic', '乗車券', '定期', '切符', '高速', '駐車場', 'ガソリン', '軽油', 'タクシー'],
  },
];

const MERCHANT_HINTS = [
  { match: ['スターバックス', 'starbucks'], category: 'ソフトドリンク' },
  { match: ['タリーズ', 'tully'], category: 'ソフトドリンク' },
  { match: ['ドトール', 'doutor'], category: 'ソフトドリンク' },
  { match: ['マクドナルド', 'マック', 'mcdonald'], category: '外食' },
  { match: ['すき家', '松屋', '吉野家', 'coco壱', 'ココイチ', 'はなまる', '丸亀'], category: '外食' },
  { match: ['セブン', '7-eleven', 'ローソン', 'ファミマ', 'ファミリーマート', 'ミニストップ'], category: '食費' },
  { match: ['マツモトキヨシ', 'ウエルシア', 'サンドラッグ', 'スギ薬局'], category: '日用品' },
];

const authGate = document.getElementById('authGate');
const appShell = document.getElementById('appShell');
const gatePasswordEl = document.getElementById('gatePassword');
const authForm = document.getElementById('authForm');
const unlockBtn = document.getElementById('unlockBtn');
const authStatusEl = document.getElementById('authStatus');

const receiptInput = document.getElementById('receiptInput');
const receiptInputExtra = document.getElementById('receiptInputExtra');
const previewImage = document.getElementById('previewImage');
const previewImageExtra = document.getElementById('previewImageExtra');
const extraPreviewWrap = document.getElementById('extraPreviewWrap');
const addMoreImageBtn = document.getElementById('addMoreImageBtn');
const removeExtraImageBtn = document.getElementById('removeExtraImageBtn');
const uploadPrompt = document.getElementById('uploadPrompt');
const analyzeBtn = document.getElementById('analyzeBtn');
const manualEntryBtn = document.getElementById('manualEntryBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const installBtn = document.getElementById('installBtn');
const importBtn = document.getElementById('importBtn');
const importJsonInput = document.getElementById('importJsonInput');
const exportBtn = document.getElementById('exportBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const deleteMonthBtn = document.getElementById('deleteMonthBtn');
const exportNotice = document.getElementById('exportNotice');

const merchantEl = document.getElementById('merchant');
const dateEl = document.getElementById('date');
const totalEl = document.getElementById('total');
const categoryEl = document.getElementById('category');
const ownersEl = document.getElementById('owners');
const ownerPickerEl = document.getElementById('ownerPicker');
const categoryOptionsEl = document.getElementById('categoryOptions');
const itemsEl = document.getElementById('items');
const noteEl = document.getElementById('note');
const historyList = document.getElementById('historyList');
const historyScope = document.getElementById('historyScope');
const entryCount = document.getElementById('entryCount');
const monthTotal = document.getElementById('monthTotal');
const summaryScope = document.getElementById('summaryScope');
const categoryList = document.getElementById('categoryList');
const dictList = document.getElementById('dictList');
const monthFilterEl = document.getElementById('monthFilter');
const monthNowBtn = document.getElementById('monthNowBtn');
const monthClearBtn = document.getElementById('monthClearBtn');
const categoryConfigEl = document.getElementById('categoryConfig');
const saveCategoryConfigBtn = document.getElementById('saveCategoryConfigBtn');
const resetCategoryConfigBtn = document.getElementById('resetCategoryConfigBtn');
const categoryConfigStatus = document.getElementById('categoryConfigStatus');
const ownerFilterList = document.getElementById('ownerFilterList');
const ownerScopeEl = document.getElementById('ownerScope');
const ownerFilterAllBtn = document.getElementById('ownerFilterAllBtn');
const ownerFilterSharedBtn = document.getElementById('ownerFilterSharedBtn');
const pruneImageBeforeDateEl = document.getElementById('pruneImageBeforeDate');
const pruneImageBeforeBtn = document.getElementById('pruneImageBeforeBtn');
const familyConfigEl = document.getElementById('familyConfig');
const saveFamilyConfigBtn = document.getElementById('saveFamilyConfigBtn');
const resetFamilyConfigBtn = document.getElementById('resetFamilyConfigBtn');
const familyConfigStatus = document.getElementById('familyConfigStatus');

let selectedFile = null;
let selectedFileExtra = null;
let previewDataUrl = '';
let previewDataUrlExtra = '';
let deferredPrompt = null;
let currentAnalyzedItemDetails = [];
let activeOwnerFilters = [];

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

function getCurrentMonthValue() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

function dedupeNames(values) {
  const seen = new Set();
  const result = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    const name = String(value || '').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    result.push(name);
  });
  return result.slice(0, 20);
}

function sanitizeMemberList(values) {
  const result = dedupeNames(values);
  if (!result.includes('家族共通')) result.unshift('家族共通');
  return result.slice(0, 20);
}

function loadMembers() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAMILY_CONFIG_KEY) || '[]');
    if (Array.isArray(raw) && raw.length) return sanitizeMemberList(raw);
  } catch {}
  return [...DEFAULT_MEMBERS];
}

function saveMembers(members) {
  localStorage.setItem(FAMILY_CONFIG_KEY, JSON.stringify(sanitizeMemberList(members)));
}

function getMemberOrder() {
  return loadMembers();
}

function fillFamilyConfig() {
  if (!familyConfigEl) return;
  familyConfigEl.value = getMemberOrder().join('\n');
}

function parseOwnersInput(value) {
  const text = Array.isArray(value) ? value.join(',') : String(value || '');
  const parts = text.split(/[\n,、/／]+/).map((v) => String(v || '').trim()).filter(Boolean);
  return dedupeNames(parts);
}

function formatOwners(owners) {
  const normalized = parseOwnersInput(owners);
  return normalized.length ? normalized.join(', ') : '未設定';
}

function getFormOwners() {
  return parseOwnersInput(ownersEl?.value || '');
}

function setFormOwners(owners) {
  const normalized = parseOwnersInput(owners);
  if (ownersEl) ownersEl.value = normalized.join(', ');
  if (ownerPickerEl) {
    ownerPickerEl.querySelectorAll('.owner-picker-checkbox').forEach((node) => {
      node.checked = normalized.includes(node.value);
    });
  }
  return normalized;
}

function renderOwnerPicker(selectedOwners) {
  if (!ownerPickerEl) return;
  const selected = new Set(parseOwnersInput(selectedOwners));
  ownerPickerEl.innerHTML = getMemberOrder().map((name) => `
    <label class="owner-filter-pill">
      <input type="checkbox" class="owner-picker-checkbox" value="${escapeHtml(name)}" ${selected.has(name) ? 'checked' : ''} />
      <span>${escapeHtml(name)}</span>
    </label>
  `).join('');
}

function isAllOwnersSelected() {
  const members = getMemberOrder();
  return !activeOwnerFilters.length || activeOwnerFilters.length >= members.length;
}

function refreshOwnerUi() {
  const members = getMemberOrder();

  renderOwnerPicker(getFormOwners());

  if (ownerPickerEl) {
  ownerPickerEl.addEventListener('change', () => {
    const checked = [...ownerPickerEl.querySelectorAll('.owner-picker-checkbox:checked')].map((node) => node.value);
    setFormOwners(checked);
  });
}

if (ownerFilterList) {
    const selectedSet = isAllOwnersSelected() ? new Set(members) : new Set(activeOwnerFilters);
    ownerFilterList.innerHTML = members.map((name) => `
      <label class="owner-filter-pill">
        <input type="checkbox" class="owner-filter-checkbox" value="${escapeHtml(name)}" ${selectedSet.has(name) ? 'checked' : ''} />
        <span>${escapeHtml(name)}</span>
      </label>
    `).join('');
  }

  if (ownerScopeEl) {
    ownerScopeEl.textContent = isAllOwnersSelected() ? '全員' : activeOwnerFilters.join(' + ');
  }
}

function persistEntryOwners(entryId, ownerValue) {
  const entries = loadEntries();
  const target = entries.find((entry) => entry.id === entryId);
  if (!target) return null;
  target.owners = parseOwnersInput(ownerValue);
  saveEntries(entries);
  return target.owners;
}

function sanitizeCategoryList(values) {
  const seen = new Set();
  const result = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    const name = String(value || '').trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    result.push(name);
  });
  if (!result.includes('未分類')) result.push('未分類');
  return result.slice(0, 40);
}

function loadCategories() {
  try {
    const raw = JSON.parse(localStorage.getItem(CATEGORY_CONFIG_KEY) || '[]');
    if (Array.isArray(raw) && raw.length) {
      return sanitizeCategoryList(raw);
    }
  } catch {}
  return [...DEFAULT_CATEGORIES];
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORY_CONFIG_KEY, JSON.stringify(sanitizeCategoryList(categories)));
}

function getCategoryOrder() {
  return loadCategories();
}

function fillCategoryConfig() {
  if (!categoryConfigEl) return;
  categoryConfigEl.value = getCategoryOrder().join('\n');
}

function refreshCategoryUi() {
  const categories = getCategoryOrder();

  if (categoryOptionsEl) {
    categoryOptionsEl.innerHTML = categories.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
  }

  if (document.activeElement && document.activeElement.classList?.contains('item-category-select')) {
    return;
  }

  renderHistory();
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

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeCompareString(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s　]+/g, '')
    .replace(/[()（）\[\]［］{}｛｝<>＜＞「」『』【】.,，、。:：;；!！?？'"'"'`´＾^~〜‐‑–—―ｰ－＿_\/\|]/g, '');
}

function normalizeCompareMoney(value) {
  return Number(parseMoney(value || 0).toFixed(2));
}

function buildItemSignature(entry, options = {}) {
  const normalized = normalizeStoredEntry(entry || {});
  const includeCategory = options.includeCategory === true;
  const sortItems = options.sort !== false;

  const parts = (normalized.itemDetails || []).map((detail) => {
    const name = normalizeCompareString(detail?.name || '');
    const price = normalizeCompareMoney(
      ensureSignedAmount(detail?.name || '', detail?.category || '', detail?.price ?? detail?.amount ?? 0)
    );
    const category = includeCategory ? normalizeCompareString(normalizeCategory(detail?.category) || '') : '';
    return includeCategory ? `${name}|${price}|${category}` : `${name}|${price}`;
  }).filter(Boolean);

  return (sortItems ? parts.sort() : parts).join('||');
}

function buildEntryFingerprints(entry) {
  const normalized = normalizeStoredEntry(entry || {});
  const merchant = normalizeCompareString(normalized.merchant || '');
  const date = normalizeDate(normalized.date || '');
  const total = normalizeCompareMoney(normalized.total || 0);
  const note = normalizeCompareString(normalized.note || '');
  const itemExact = buildItemSignature(normalized, { includeCategory: true, sort: false });
  const itemLoose = buildItemSignature(normalized, { includeCategory: false, sort: true });

  return [
    `exact:${merchant}|${date}|${total}|${itemExact}|${note}`,
    `same-items:${merchant}|${date}|${total}|${itemLoose}`,
    itemLoose ? `items-only:${date}|${total}|${itemLoose}` : '',
  ].filter(Boolean);
}

function chooseBetterString(a, b) {
  return String(b || '').trim().length > String(a || '').trim().length ? String(b || '') : String(a || '');
}

function mergeItemDetails(baseDetails, incomingDetails) {
  const result = Array.isArray(baseDetails) ? baseDetails.map((detail) => ({ ...detail })) : [];
  const indexMap = new Map();

  result.forEach((detail, index) => {
    const key = `${normalizeCompareString(detail?.name || '')}|${normalizeCompareMoney(detail?.price ?? detail?.amount ?? 0)}`;
    if (!indexMap.has(key)) indexMap.set(key, []);
    indexMap.get(key).push(index);
  });

  (Array.isArray(incomingDetails) ? incomingDetails : []).forEach((detail) => {
    const normalizedDetail = {
      name: String(detail?.name || '').trim(),
      category: normalizeCategory(detail?.category) || classifyItemName(detail?.name || '') || '未分類',
      price: ensureSignedAmount(detail?.name || '', detail?.category || '', detail?.price ?? detail?.amount ?? 0),
    };

    const key = `${normalizeCompareString(normalizedDetail.name)}|${normalizeCompareMoney(normalizedDetail.price)}`;
    const matches = indexMap.get(key) || [];
    const matchIndex = matches.find((idx) => {
      const current = result[idx];
      const currentCategory = normalizeCategory(current?.category) || '未分類';
      return currentCategory === '未分類' || currentCategory === normalizedDetail.category;
    });

    if (typeof matchIndex === 'number') {
      const current = result[matchIndex];
      const currentCategory = normalizeCategory(current?.category) || '未分類';
      if (currentCategory === '未分類' && normalizedDetail.category !== '未分類') {
        current.category = normalizedDetail.category;
      }
      if (!parseMoney(current?.price) && parseMoney(normalizedDetail.price)) {
        current.price = normalizedDetail.price;
      }
      if (!current.name && normalizedDetail.name) {
        current.name = normalizedDetail.name;
      }
      return;
    }

    result.push(normalizedDetail);
    if (!indexMap.has(key)) indexMap.set(key, []);
    indexMap.get(key).push(result.length - 1);
  });

  return result.filter((detail) => detail?.name);
}

function mergeEntries(baseEntry, incomingEntry) {
  const base = normalizeStoredEntry(baseEntry || {});
  const incoming = normalizeStoredEntry(incomingEntry || {});

  const merged = {
    ...base,
    merchant: chooseBetterString(base.merchant, incoming.merchant),
    date: base.date || incoming.date,
    total: parseMoney(base.total || 0) || parseMoney(incoming.total || 0),
    note: chooseBetterString(base.note, incoming.note),
    imageDataUrl: chooseBetterString(base.imageDataUrl, incoming.imageDataUrl),
    createdAt: base.createdAt || incoming.createdAt,
    owners: dedupeNames([...(base.owners || []), ...(incoming.owners || [])]),
  };

  merged.itemDetails = mergeItemDetails(base.itemDetails, incoming.itemDetails);
  merged.items = merged.itemDetails.map((detail) => detail.name);
  merged.category = normalizeCategory(base.category)
    || normalizeCategory(incoming.category)
    || inferEntryCategory(merged.itemDetails, merged.merchant)
    || '未分類';

  return normalizeStoredEntry(merged);
}

function dedupeEntries(entries) {
  const seen = new Map();
  const result = [];

  for (const entry of entries) {
    const normalized = normalizeStoredEntry(entry);
    const fingerprints = buildEntryFingerprints(normalized);
    const existingIndex = fingerprints.find((fingerprint) => seen.has(fingerprint));

    if (existingIndex) {
      const index = seen.get(existingIndex);
      result[index] = mergeEntries(result[index], normalized);
      buildEntryFingerprints(result[index]).forEach((fingerprint) => seen.set(fingerprint, index));
      continue;
    }

    const index = result.length;
    result.push(normalized);
    fingerprints.forEach((fingerprint) => seen.set(fingerprint, index));
  }

  return result;
}

async function importEntriesFromJsonFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error('JSONの形式が正しくありません。');
  }

  const currentEntries = loadEntries();
  const beforeCount = currentEntries.length;
  const mergedEntries = dedupeEntries([...currentEntries, ...parsed]);
  const addedCount = Math.max(0, mergedEntries.length - beforeCount);
  const duplicateCount = Math.max(0, parsed.length - addedCount);

  saveEntries(mergedEntries);
  renderHistory();

  return {
    importedCount: parsed.length,
    addedCount,
    duplicateCount,
    totalCount: mergedEntries.length,
  };
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

function normalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const s = String(value).trim().replaceAll('/', '-').replaceAll('.', '-');
  const match = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatYen(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeForSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[ーｰ‐-]/g, 'ー');
}

function normalizeCategory(value) {
  const s = String(value || '').trim();
  if (!s) return '';

  const categories = getCategoryOrder();
  if (categories.includes(s)) return s;

  const lower = s.toLowerCase();
  if (['drink', 'softdrink', 'beverage', '飲み物', '飲料'].includes(lower) || s === 'ソフトドリンク') return 'ソフトドリンク';
  if (['nonalcohol', 'non-alcohol', 'ノンアルコール'].includes(lower) || s === 'ノンアル') return 'ノンアル';
  if (['alcohol', 'liquor', '酒'].includes(lower) || s === 'お酒') return 'お酒';
  if (['snack', 'sweets', 'dessert', 'お菓子', '菓子'].includes(lower) || s === 'おかし') return 'おかし';
  if (['食品', '食料品'].includes(s) || ['food', 'groceries', 'grocery'].includes(lower)) return '食費';
  if (['coupon'].includes(lower) || s === 'クーポン') return 'クーポン';
  if (['discount', 'sale', 'markdown'].includes(lower) || s === '値引き') return '値引き';

  return s;
}

function ensureSignedAmount(name, category, price) {
  const amount = parseMoney(price);
  const cat = normalizeCategory(category);
  const text = normalizeForSearch(name);
  const isDiscountLike = cat === 'クーポン' || cat === '値引き' || /(値引|割引|値下|クーポン|coupon|還元|充当)/.test(text);
  if (isDiscountLike && amount > 0) return -amount;
  return amount;
}

function classifyItemName(name) {
  const target = normalizeForSearch(name);
  if (!target) return '';

  const userDict = loadUserDict();
  for (const [dictName, dictCategory] of Object.entries(userDict)) {
    if (normalizeForSearch(dictName) === target) {
      return normalizeCategory(dictCategory) || dictCategory;
    }
  }

  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some((keyword) => target.includes(normalizeForSearch(keyword)))) {
      return rule.category;
    }
  }

  if (/(弁当|おにぎり|パン|サンド|寿司|惣菜|牛乳|たまご|卵|豆腐|サラダ|納豆|パスタ)/.test(target)) return '食費';
  return '';
}

function inferMerchantCategory(merchant) {
  const target = normalizeForSearch(merchant);
  if (!target) return '';
  for (const hint of MERCHANT_HINTS) {
    if (hint.match.some((keyword) => target.includes(normalizeForSearch(keyword)))) {
      return hint.category;
    }
  }
  return '';
}

function categoryFromNoteLabel(label) {
  const text = normalizeForSearch(label);
  if (!text) return '';
  if (text.includes('クーポン')) return 'クーポン';
  if (text.includes('値引') || text.includes('割引') || text.includes('値下')) return '値引き';
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
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((name) => results.push({ name, category, price: 0 }));
    }
  });

  text.split(/\r?\n+/).forEach((line) => {
    const clean = String(line || '').replace(/^メモ[:：]?/, '').trim();
    if (!clean) return;

    const category = categoryFromNoteLabel(clean) || classifyItemName(clean);
    if (!category) return;

    const priceMatch = clean.match(/([\-−ー]?\s*[¥￥]?\s*\d[\d,]*)\s*円?$/);
    const parsedAmount = priceMatch ? parseMoney(String(priceMatch[1] || '').replace(/[−ー]/g, '-')) : 0;
    const name = (priceMatch ? clean.slice(0, priceMatch.index) : clean)
      .replace(/[：:、,，／/]+$/, '')
      .trim();

    results.push({
      name: name || clean,
      category,
      price: ensureSignedAmount(name || clean, category, parsedAmount),
    });
  });

  const merged = new Map();
  results.forEach((item) => {
    const key = normalizeForSearch(item.name);
    if (!key) return;
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, {
        name: item.name,
        category: normalizeCategory(item.category) || '',
        price: ensureSignedAmount(item.name, item.category, item.price || 0),
      });
      return;
    }

    if (!prev.category && item.category) prev.category = normalizeCategory(item.category) || item.category;
    if ((!prev.price || prev.price === 0) && item.price) prev.price = ensureSignedAmount(item.name, item.category, item.price);
  });

  return [...merged.values()];
}


function buildSeedPriceMap(seedDetails = []) {
  const map = new Map();
  (Array.isArray(seedDetails) ? seedDetails : []).forEach((detail) => {
    const name = String(detail?.name || '').trim();
    if (!name) return;
    const key = normalizeForSearch(name);
    if (!map.has(key)) {
      map.set(key, {
        category: normalizeCategory(detail?.category) || '',
        price: ensureSignedAmount(name, detail?.category, detail?.price ?? detail?.amount ?? 0),
      });
    }
  });
  return map;
}

function deriveItemDetails(items, note = '', seedDetails = []) {
  const noteDerivedMap = new Map();
  extractCategorizedItemsFromNote(note).forEach((detail) => {
    const key = normalizeForSearch(detail.name);
    if (!key) return;
    const prev = noteDerivedMap.get(key) || { category: '', price: 0, name: detail.name };
    noteDerivedMap.set(key, {
      name: detail.name,
      category: prev.category || normalizeCategory(detail.category) || '',
      price: prev.price || ensureSignedAmount(detail.name, detail.category, detail.price || 0),
    });
  });

  const seedMap = buildSeedPriceMap(seedDetails);
  const detailMap = new Map();

  (Array.isArray(items) ? items : [])
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .forEach((name) => {
      const key = normalizeForSearch(name);
      const seeded = seedMap.get(key) || {};
      const noted = noteDerivedMap.get(key) || {};
      const category = normalizeCategory(noted.category) || normalizeCategory(seeded.category) || classifyItemName(name) || '';
      const basePrice = noted.price || seeded.price || 0;
      const price = ensureSignedAmount(name, category, basePrice);
      detailMap.set(key, { name, category, price });
    });

  noteDerivedMap.forEach((detail, key) => {
    if (detailMap.has(key)) return;
    const category = normalizeCategory(detail.category) || classifyItemName(detail.name) || '';
    const price = ensureSignedAmount(detail.name, category, detail.price || 0);
    if (!category && !price) return;
    detailMap.set(key, { name: detail.name, category, price });
  });

  return [...detailMap.values()];
}


function inferEntryCategory(itemDetails, merchant = '') {
  const counts = new Map();
  (Array.isArray(itemDetails) ? itemDetails : []).forEach((detail) => {
    const category = normalizeCategory(detail?.category);
    if (!category || category === 'クーポン' || category === '値引き') return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const order = getCategoryOrder();
  if (counts.size) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]))[0][0];
  }

  return inferMerchantCategory(merchant) || '';
}

function normalizeAnalyzedItems(items, note = '') {
  const rawItems = Array.isArray(items) ? items : [];
  const normalized = rawItems
    .map((item) => {
      if (typeof item === 'string') {
        const category = classifyItemName(item) || '';
        return { name: item.trim(), category, price: ensureSignedAmount(item, category, 0) };
      }
      if (item && typeof item === 'object') {
        const name = String(item.name || item.item || '').trim();
        const category = normalizeCategory(item.category) || classifyItemName(name) || '';
        return {
          name,
          category,
          price: ensureSignedAmount(name, category, item.price ?? item.amount ?? 0),
        };
      }
      return { name: '', category: '', price: 0 };
    })
    .filter((item) => item.name);

  return deriveItemDetails(normalized.map((item) => item.name), note, normalized);
}

function normalizeStoredEntry(entry = {}) {
  const items = Array.isArray(entry.items) ? entry.items.map((v) => String(v || '').trim()).filter(Boolean) : [];
  const itemDetails = Array.isArray(entry.itemDetails) && entry.itemDetails.length
    ? entry.itemDetails
        .map((detail) => {
          const name = String(detail?.name || '').trim();
          const category = normalizeCategory(detail?.category) || classifyItemName(name) || '未分類';
          return {
            name,
            category,
            price: ensureSignedAmount(name, category, detail?.price ?? detail?.amount ?? 0),
          };
        })
        .filter((detail) => detail.name)
    : deriveItemDetails(items, entry.note);

  const category = normalizeCategory(entry.category) || inferEntryCategory(itemDetails, entry.merchant) || '未分類';
  const owners = parseOwnersInput(entry.owners || entry.owner || []);

  return {
    ...entry,
    merchant: String(entry.merchant || '').trim(),
    date: normalizeDate(entry.date),
    total: parseMoney(entry.total || 0),
    category,
    owners,
    items,
    itemDetails,
    note: String(entry.note || '').trim(),
    imageDataUrl: String(entry.imageDataUrl || ''),
    createdAt: String(entry.createdAt || ''),
  };
}

function resetForm() {
  merchantEl.value = '';
  dateEl.value = '';
  totalEl.value = '';
  categoryEl.value = '';
  setFormOwners([]);
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
  clearExtraImage();
  analyzeBtn.disabled = true;
  statusEl.textContent = '画像を選択してください。';
}

function startManualEntryMode() {
  resetImage();
  resetForm();
  const today = new Date();
  const yyyy = String(today.getFullYear());
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateEl.value = `${yyyy}-${mm}-${dd}`;
  saveBtn.disabled = false;
  statusEl.textContent = 'レシートなしの直接入力モードです。必要事項を入力して保存してください。';
}

function setPreviewImage(imgEl, file) {
  if (!imgEl || !file) return;
  const objectUrl = URL.createObjectURL(file);
  imgEl.onload = () => URL.revokeObjectURL(objectUrl);
  imgEl.src = objectUrl;
  imgEl.classList.remove('hidden');
}

function refreshExtraPreviewUi() {
  if (selectedFileExtra && previewImageExtra) {
    extraPreviewWrap?.classList.remove('hidden');
    removeExtraImageBtn?.classList.remove('hidden');
    if (addMoreImageBtn) addMoreImageBtn.textContent = '続き画像を撮り直す';
  } else {
    extraPreviewWrap?.classList.add('hidden');
    if (previewImageExtra) {
      previewImageExtra.src = '';
      previewImageExtra.classList.add('hidden');
    }
    removeExtraImageBtn?.classList.add('hidden');
    if (addMoreImageBtn) addMoreImageBtn.textContent = '長いレシートの続き画像を追加';
  }
}

function clearExtraImage() {
  selectedFileExtra = null;
  previewDataUrlExtra = '';
  if (receiptInputExtra) receiptInputExtra.value = '';
  refreshExtraPreviewUi();
}

async function handleReceiptSelection(file, { extra = false } = {}) {
  if (!file) return;

  if (extra) {
    selectedFileExtra = file;
    setPreviewImage(previewImageExtra, file);
    previewDataUrlExtra = await compressImageFileToDataUrl(file);
    refreshExtraPreviewUi();
  } else {
    selectedFile = file;
    setPreviewImage(previewImage, file);
    uploadPrompt.classList.add('hidden');
    previewDataUrl = await compressImageFileToDataUrl(file);
  }

  analyzeBtn.disabled = !selectedFile;
  resetForm();
  statusEl.textContent = selectedFileExtra
    ? '画像を2枚読み込みました。2枚をまとめてAIで整理できます。'
    : '画像を読み込みました。AIで整理できます。';
}

function getSelectedFiles() {
  return [selectedFile, selectedFileExtra].filter(Boolean);
}

function formatDateLabel(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return '日付なし';
  const [y, m, d] = normalized.split('-');
  return `${y}/${m}/${d}`;
}

function matchesMonth(entry, monthValue) {
  if (!monthValue) return true;
  return String(entry.date || '').startsWith(monthValue);
}

function isEntryDateBefore(entry, cutoffDate) {
  const entryDate = String(entry?.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return false;
  return entryDate < cutoffDate;
}

function getVisibleEntries() {
  const entries = loadEntries().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const monthValue = String(monthFilterEl?.value || '');
  const selected = isAllOwnersSelected() ? [] : activeOwnerFilters;
  return entries.filter((entry) => {
    if (!matchesMonth(entry, monthValue)) return false;
    if (!selected.length) return true;
    const owners = Array.isArray(entry.owners) && entry.owners.length ? entry.owners : ['家族共通'];
    return owners.some((name) => selected.includes(name));
  });
}

function getCategoryBreakdown(entry) {
  const itemDetails = Array.isArray(entry.itemDetails)
    ? entry.itemDetails.filter((detail) => detail?.name)
    : [];

  if (!itemDetails.length) return [];

  const receiptTotal = parseMoney(entry.total || 0);
  const normalized = itemDetails.map((detail) => {
    const category =
      normalizeCategory(detail.category) ||
      classifyItemName(detail.name) ||
      inferEntryCategory(itemDetails, entry.merchant) ||
      '未分類';

    return {
      name: detail.name,
      category,
      price: ensureSignedAmount(detail.name, category, detail.price ?? detail.amount ?? 0),
    };
  });

  const knownTotal = normalized.reduce((sum, detail) => sum + detail.price, 0);
  const fallbackShare = normalized.length && knownTotal === 0 && receiptTotal !== 0 ? receiptTotal / normalized.length : 0;

  const grouped = new Map();

  normalized.forEach((detail) => {
    const amount = detail.price !== 0 ? detail.price : fallbackShare;
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

function renderSummary(entries) {
  entryCount.textContent = entries.length;
  const total = entries.reduce((sum, entry) => sum + parseMoney(entry.total || 0), 0);
  monthTotal.textContent = formatYen(total);

  const byCategory = new Map();

  entries.forEach((entry) => {
    const breakdown = getCategoryBreakdown(entry);
    if (breakdown.length) {
      breakdown.forEach((part) => {
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

  const order = getCategoryOrder();
  const sorted = [...byCategory.entries()].sort((a, b) => {
    const amountDiff = b[1].amount - a[1].amount;
    if (amountDiff) return amountDiff;
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  categoryList.innerHTML = sorted.length
    ? sorted
        .map(([name, meta]) => `<li><span>${escapeHtml(name)} <small>${meta.count}件</small></span><strong>${formatYen(meta.amount)}</strong></li>`)
        .join('')
    : '<li><span>まだデータがありません</span><strong>—</strong></li>';

  const monthValue = String(monthFilterEl?.value || '');
  const ownerLabel = isAllOwnersSelected() ? '全員' : activeOwnerFilters.join(' + ');
  summaryScope.textContent = monthValue ? `${monthValue} ・ ${ownerLabel}` : `全期間 ・ ${ownerLabel}`;
  historyScope.textContent = monthValue ? `${monthValue} ・ ${ownerLabel}` : `画像は端末内に保存されます / ${ownerLabel}`;
  if (ownerScopeEl) ownerScopeEl.textContent = ownerLabel;
  if (deleteMonthBtn) deleteMonthBtn.disabled = !monthValue;
}

function buildCategoryOptions(selectedCategory) {
  const base = getCategoryOrder();
  const options = base.includes(selectedCategory) || !selectedCategory ? base : [...base, selectedCategory];
  return options
    .map((cat) => `<option value="${escapeHtml(cat)}" ${normalizeCategory(selectedCategory) === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`)
    .join('');
}

function renderHistory() {
  const entries = getVisibleEntries();
  renderSummary(entries);
  renderDictionary();

  if (!entries.length) {
    historyList.innerHTML = '<div class="history-item"><div class="history-meta">まだ保存履歴がありません。</div></div>';
    return;
  }

  historyList.innerHTML = entries
    .map((entry) => {
      const chips = [...new Set(getCategoryBreakdown(entry).map((item) => item.category))];
      const chipHtml = chips.length
        ? chips.map((name) => `<span class="history-chip">${escapeHtml(name)}</span>`).join('')
        : '<span class="history-chip">未分類</span>';
      const ownerChipHtml = parseOwnersInput(entry.owners).map((name) => `<span class="history-chip owner-chip">${escapeHtml(name)}</span>`).join('');

      const itemHtml = (entry.itemDetails || []).length
        ? entry.itemDetails
            .map((detail, idx) => `
              <div class="item-row" data-entry-id="${entry.id}" data-item-index="${idx}">
                <div class="item-row-name">${escapeHtml(detail.name)}${parseMoney(detail.price) ? ` <small>${formatYen(detail.price)}</small>` : ''}</div>
                <select class="item-category-select" data-entry-id="${entry.id}" data-item-index="${idx}">
                  ${buildCategoryOptions(detail.category)}
                </select>
                <div class="item-row-actions">
                  <button class="ghost mini item-register" data-entry-id="${entry.id}" data-item-index="${idx}" type="button">辞書登録</button>
                </div>
              </div>
            `)
            .join('')
        : `<div class="history-items">${escapeHtml((entry.items || []).join('\n') || '品目なし')}</div>`;

      return `
        <article class="history-item">
          <div class="history-top">
            <div>
              <h4 class="history-merchant">${escapeHtml(entry.merchant || '店名なし')}</h4>
              <div class="history-meta">${escapeHtml(formatDateLabel(entry.date))}</div>
            </div>
            <div class="history-top-right">
              <div class="history-total">${formatYen(entry.total)}</div>
              <div class="history-chip-row">${chipHtml}${ownerChipHtml}</div>
            </div>
          </div>
          <div class="history-owner-line" data-entry-id="${entry.id}">
            ${getMemberOrder().map((name) => `
              <label class="owner-filter-pill history-owner-pill">
                <input type="checkbox" class="history-owner-checkbox" data-entry-id="${entry.id}" value="${escapeHtml(name)}" ${parseOwnersInput(entry.owners).includes(name) ? 'checked' : ''} />
                <span>${escapeHtml(name)}</span>
              </label>
            `).join('')}
          </div>
          <div class="history-body">
            ${entry.imageDataUrl ? `<img class="thumb" src="${entry.imageDataUrl}" alt="receipt" />` : ''}
            <div class="history-items-wrap">
              <div class="history-items-title">品目ごとの修正</div>
              <div class="history-item-list">${itemHtml}</div>
            </div>
          </div>
          ${entry.note ? `<div class="history-meta">メモ: ${escapeHtml(entry.note)}</div>` : ''}
          <button class="ghost history-delete" data-id="${entry.id}" type="button">この記録を削除</button>
        </article>
      `;
    })
    .join('');
}

function renderDictionary() {
  if (!dictList) return;
  const dict = loadUserDict();
  const rows = Object.entries(dict).sort((a, b) => a[0].localeCompare(b[0], 'ja'));
  dictList.innerHTML = rows.length
    ? rows
        .map(
          ([name, category]) => `
      <div class="dict-row">
        <div>
          <strong>${escapeHtml(name)}</strong>
          <div class="history-meta">${escapeHtml(category)}</div>
        </div>
        <button class="ghost mini dict-delete" data-dict-name="${escapeHtml(name)}" type="button">削除</button>
      </div>
    `
        )
        .join('')
    : '<div class="history-meta">まだ辞書登録がありません。</div>';
}

function showExportNotice(message) {
  exportNotice.textContent = message;
  exportNotice.classList.remove('hidden');
  window.clearTimeout(showExportNotice._timer);
  showExportNotice._timer = window.setTimeout(() => {
    exportNotice.classList.add('hidden');
  }, 4000);
}

function persistItemCategory(entryId, itemIndex, category, { registerDict = false } = {}) {
  const entries = loadEntries();
  const target = entries.find((entry) => entry.id === entryId);
  if (!target || !target.itemDetails?.[itemIndex]) return null;

  const safeCategory = normalizeCategory(category) || '未分類';
  const detail = target.itemDetails[itemIndex];
  detail.category = safeCategory;
  detail.price = ensureSignedAmount(detail.name, safeCategory, detail.price || 0);
  target.category = inferEntryCategory(target.itemDetails, target.merchant) || target.category || '未分類';
  saveEntries(entries);

  if (registerDict) {
    const dict = loadUserDict();
    dict[detail.name] = safeCategory;
    saveUserDict(dict);
  }

  return { name: detail.name, category: safeCategory };
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImageFileToDataUrl(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.78 } = {}) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return fileToDataUrl(file);
  }

  const originalDataUrl = await fileToDataUrl(file);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(originalDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed && compressed.length < originalDataUrl.length ? compressed : originalDataUrl);
      } catch (_) {
        resolve(originalDataUrl);
      }
    };
    img.onerror = () => resolve(originalDataUrl);
    img.src = originalDataUrl;
  });
}

function isQuotaExceededError(error) {
  return !!error && (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

function getEntriesForJsonExport() {
  const entries = loadEntries();
  if (isAllOwnersSelected()) return entries;
  const selected = activeOwnerFilters;
  return entries.filter((entry) => {
    const owners = Array.isArray(entry.owners) && entry.owners.length ? entry.owners : ['家族共通'];
    return owners.some((name) => selected.includes(name));
  });
}

function buildJsonFileName() {
  const label = isAllOwnersSelected() ? '全員' : (activeOwnerFilters.length ? activeOwnerFilters.join('_') : '全員');
  const safeLabel = String(label).replace(/[\/:*?"<>|\s]+/g, '_');
  return `kakei-bo-${safeLabel}-latest.json`;
}

function buildCsvFileName() {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `kakei-bo-${yyyy}${mm}${dd}-${hh}${mi}${ss}.csv`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function entriesToCsv(entries) {
  const rows = [['date', 'merchant', 'owners', 'receipt_total', 'item_name', 'item_category', 'item_price', 'note', 'created_at']];

  entries.forEach((entry) => {
    const items = Array.isArray(entry.itemDetails) && entry.itemDetails.length
      ? entry.itemDetails
      : [{ name: '', category: normalizeCategory(entry.category) || '', price: parseMoney(entry.total || 0) }];

    items.forEach((item) => {
      rows.push([
        entry.date || '',
        entry.merchant || '',
        formatOwners(entry.owners),
        parseMoney(entry.total || 0),
        item.name || '',
        normalizeCategory(item.category) || '',
        ensureSignedAmount(item.name, item.category, item.price || 0),
        entry.note || '',
        entry.createdAt || '',
      ]);
    });
  });

  return '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

receiptInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    await handleReceiptSelection(file);
  } catch (_) {
    previewDataUrl = '';
    statusEl.textContent = '画像の読み込みに失敗しました。別の画像で試してください。';
  }
});

if (addMoreImageBtn && receiptInputExtra) {
  addMoreImageBtn.addEventListener('click', () => {
    receiptInputExtra.click();
  });
}

if (receiptInputExtra) {
  receiptInputExtra.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await handleReceiptSelection(file, { extra: true });
    } catch (_) {
      previewDataUrlExtra = '';
      statusEl.textContent = '続き画像の読み込みに失敗しました。別の画像で試してください。';
    }
  });
}

if (removeExtraImageBtn) {
  removeExtraImageBtn.addEventListener('click', () => {
    clearExtraImage();
    statusEl.textContent = selectedFile
      ? '1枚目の画像でAI整理できます。'
      : '画像を選択してください。';
  });
}

analyzeBtn.addEventListener('click', async () => {
  if (!getSelectedFiles().length) return;
  analyzeBtn.disabled = true;
  saveBtn.disabled = true;
  statusEl.textContent = getSelectedFiles().length > 1 ? '2枚の画像をまとめてAIで解析中です…' : 'AIで解析中です…';

  try {
    const formData = new FormData();
    getSelectedFiles().forEach((file, index) => {
      formData.append('receipt', file, file.name || `receipt-${index + 1}.jpg`);
    });
    formData.append('categories', JSON.stringify(getCategoryOrder()));

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'x-app-password': localStorage.getItem(AUTH_KEY) === '1' ? (sessionStorage.getItem('kakei-bo-password') || AUTH_FALLBACK_PASSWORD) : '',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '解析に失敗しました。');
    }

    currentAnalyzedItemDetails = normalizeAnalyzedItems(data.items, data.note);
    const normalizedItems = currentAnalyzedItemDetails.map((v) => v.name);
    const inferredCategory = normalizeCategory(data.category) || inferEntryCategory(currentAnalyzedItemDetails, data.merchant) || '未分類';

    merchantEl.value = data.merchant || '';
    dateEl.value = normalizeDate(data.date) || '';
    totalEl.value = data.total ?? '';
    categoryEl.value = inferredCategory;
    if (!ownersEl || !ownersEl.value.trim()) setFormOwners([]);
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

saveBtn.addEventListener('click', async () => {
  const items = itemsEl.value.split('\n').map((v) => v.trim()).filter(Boolean);
  const itemDetails = deriveItemDetails(items, noteEl.value, currentAnalyzedItemDetails);
  const merchant = merchantEl.value.trim();
  const owners = parseOwnersInput(ownersEl?.value || '');
  const category = normalizeCategory(categoryEl.value) || inferEntryCategory(itemDetails, merchant) || '未分類';

  if (!items.length && !merchant && !Number(totalEl.value || 0)) {
    statusEl.textContent = '保存するデータがありません。';
    return;
  }

  saveBtn.disabled = true;

  try {
    const storedImageDataUrl = selectedFile
      ? await compressImageFileToDataUrl(selectedFile)
      : previewDataUrl;

    const entry = {
      id: crypto.randomUUID(),
      merchant,
      date: normalizeDate(dateEl.value),
      total: parseMoney(totalEl.value || 0),
      category,
      owners,
      items,
      itemDetails: itemDetails.map((detail) => ({
        name: detail.name,
        category: normalizeCategory(detail.category) || category,
        price: ensureSignedAmount(detail.name, detail.category || category, detail.price || 0),
      })),
      note: noteEl.value.trim(),
      imageDataUrl: storedImageDataUrl,
      createdAt: new Date().toISOString(),
    };

    const entries = loadEntries();
    entries.push(entry);
    saveEntries(entries);
    renderHistory();
    resetForm();
    resetImage();
    statusEl.textContent = `保存しました。${entry.itemDetails.length ? '品目カテゴリで集計します。' : ''}`;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      statusEl.textContent = '画像容量が大きく、端末内に保存できませんでした。古い記録を削除するか、JSON/CSVを書き出してください。';
    } else {
      statusEl.textContent = error?.message || '保存に失敗しました。';
    }
  } finally {
    saveBtn.disabled = false;
  }
});

if (manualEntryBtn) {
  manualEntryBtn.addEventListener('click', () => {
    startManualEntryMode();
  });
}

clearBtn.addEventListener('click', () => {
  resetForm();
  resetImage();
});


if (importBtn && importJsonInput) {
  importBtn.addEventListener('click', () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importEntriesFromJsonFile(file);
      const message = `JSONを読み込みました。追加 ${result.addedCount}件 / 重複スキップ ${result.duplicateCount}件 / 合計 ${result.totalCount}件`;
      statusEl.textContent = message;
      showExportNotice(message);
    } catch (error) {
      statusEl.textContent = error?.message || 'JSONの読み込みに失敗しました。';
      showExportNotice(statusEl.textContent);
    } finally {
      importJsonInput.value = '';
    }
  });
}

exportBtn.addEventListener('click', () => {
  const entries = getEntriesForJsonExport();
  if (!entries.length) {
    statusEl.textContent = '書き出すデータがありません。';
    return;
  }

  const fileName = buildJsonFileName();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, fileName);
  statusEl.textContent = `JSONを書き出しました。${entries.length}件を保存しました。`;
  showExportNotice(`JSON保存完了: ${fileName} ・ ${entries.length}件`);
});

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    const entries = loadEntries();
    if (!entries.length) {
      statusEl.textContent = '書き出すデータがありません。';
      return;
    }
    const fileName = buildCsvFileName();
    const csv = entriesToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, fileName);
    statusEl.textContent = `CSVを書き出しました。${entries.length}件を保存しました。`;
    showExportNotice(`CSV保存完了: ${fileName} ・ ${entries.length}件`);
  });
}

deleteAllBtn.addEventListener('click', () => {
  const entries = loadEntries();
  const targetCount = entries.length;
  if (!targetCount) {
    statusEl.textContent = '削除する保存履歴がありません。';
    return;
  }
  const ok = confirm(`この端末の保存履歴 ${targetCount} 件をすべて削除します。
JSON/CSVとして書き出したファイルは消えません。
元に戻せません。続けますか？`);
  if (!ok) return;
  const keyword = prompt('確認のため「削除」と入力してください。');
  if (keyword !== '削除') {
    statusEl.textContent = '全削除を中止しました。';
    return;
  }
  saveEntries([]);
  renderHistory();
  statusEl.textContent = `保存履歴 ${targetCount} 件を削除しました。`;
});

if (deleteMonthBtn) {
  deleteMonthBtn.addEventListener('click', () => {
    const monthValue = String(monthFilterEl?.value || '');
    if (!monthValue) {
      statusEl.textContent = '削除する月を選んでください。';
      return;
    }
    const entries = loadEntries();
    const targetCount = entries.filter((entry) => matchesMonth(entry, monthValue)).length;
    if (!targetCount) {
      statusEl.textContent = `${monthValue} のデータはありません。`;
      return;
    }
    if (!confirm(`${monthValue} の記録 ${targetCount} 件を削除しますか？`)) return;
    saveEntries(entries.filter((entry) => !matchesMonth(entry, monthValue)));
    renderHistory();
    statusEl.textContent = `${monthValue} の記録を削除しました。`;
  });
}

if (pruneImageBeforeBtn) {
  pruneImageBeforeBtn.addEventListener('click', () => {
    const cutoffDate = String(pruneImageBeforeDateEl?.value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) {
      statusEl.textContent = '画像を削除する基準日を選んでください。';
      return;
    }

    const entries = loadEntries();
    let affectedCount = 0;

    const next = entries.map((entry) => {
      if (!entry?.imageDataUrl) return entry;
      if (!isEntryDateBefore(entry, cutoffDate)) return entry;
      affectedCount += 1;
      return { ...entry, imageDataUrl: '' };
    });

    if (!affectedCount) {
      statusEl.textContent = `${cutoffDate} より前に削除対象の画像はありません。`;
      return;
    }

    if (!confirm(`${cutoffDate} より前の画像 ${affectedCount} 件を削除しますか？\n記録自体は残ります。`)) return;

    saveEntries(next);
    renderHistory();
    statusEl.textContent = `${cutoffDate} より前の画像を ${affectedCount} 件削除しました。`;
  });
}

historyList.addEventListener('click', (event) => {
  const deleteBtn = event.target.closest('.history-delete');
  if (deleteBtn) {
    const next = loadEntries().filter((entry) => entry.id !== deleteBtn.dataset.id);
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
  const ownerCheckbox = event.target.closest('.history-owner-checkbox');
  if (ownerCheckbox) {
    const line = ownerCheckbox.closest('.history-owner-line');
    const entryId = ownerCheckbox.dataset.entryId || line?.dataset.entryId;
    if (!entryId) return;
    const checked = [...line.querySelectorAll('.history-owner-checkbox:checked')].map((node) => node.value);
    const owners = persistEntryOwners(entryId, checked);
    if (!owners) return;
    renderHistory();
    statusEl.textContent = `対象者を更新しました。${owners.join(' / ')}`;
    return;
  }

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

if (saveCategoryConfigBtn) {
  saveCategoryConfigBtn.addEventListener('click', () => {
    const lines = String(categoryConfigEl?.value || '').split('\n');
    const categories = sanitizeCategoryList(lines);
    saveCategories(categories);
    fillCategoryConfig();
    refreshCategoryUi();
    categoryConfigStatus.textContent = `カテゴリ設定を保存しました。${categories.length}件`; 
    statusEl.textContent = '独自カテゴリ設定を保存しました。';
  });
}

if (resetCategoryConfigBtn) {
  resetCategoryConfigBtn.addEventListener('click', () => {
    saveCategories(DEFAULT_CATEGORIES);
    fillCategoryConfig();
    refreshCategoryUi();
    categoryConfigStatus.textContent = '初期カテゴリに戻しました。';
    statusEl.textContent = 'カテゴリ設定を初期状態に戻しました。';
  });
}

if (monthFilterEl) {
  monthFilterEl.addEventListener('change', () => {
    renderHistory();
  });
}

if (monthNowBtn) {
  monthNowBtn.addEventListener('click', () => {
    if (monthFilterEl) monthFilterEl.value = getCurrentMonthValue();
    renderHistory();
  });
}

if (monthClearBtn) {
  monthClearBtn.addEventListener('click', () => {
    if (monthFilterEl) monthFilterEl.value = '';
    renderHistory();
  });
}

if (ownerFilterList) {
  ownerFilterList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.owner-filter-checkbox');
    if (!checkbox) return;
    const checked = [...ownerFilterList.querySelectorAll('.owner-filter-checkbox:checked')].map((node) => node.value);
    const members = getMemberOrder();
    activeOwnerFilters = checked.length >= members.length ? [] : checked;
    renderHistory();
    refreshOwnerUi();
  });
}

if (ownerFilterAllBtn) {
  ownerFilterAllBtn.addEventListener('click', () => {
    activeOwnerFilters = [];
    renderHistory();
    refreshOwnerUi();
  });
}

if (ownerFilterSharedBtn) {
  ownerFilterSharedBtn.addEventListener('click', () => {
    activeOwnerFilters = ['家族共通'];
    renderHistory();
    refreshOwnerUi();
  });
}

if (saveFamilyConfigBtn) {
  saveFamilyConfigBtn.addEventListener('click', () => {
    const lines = String(familyConfigEl?.value || '').split('\n');
    const members = sanitizeMemberList(lines);
    saveMembers(members);
    fillFamilyConfig();
    activeOwnerFilters = [];
    refreshOwnerUi();
    renderHistory();
    familyConfigStatus.textContent = `家族設定を保存しました。${members.length}件`;
    statusEl.textContent = '家族メンバー設定を保存しました。';
  });
}

if (resetFamilyConfigBtn) {
  resetFamilyConfigBtn.addEventListener('click', () => {
    saveMembers(DEFAULT_MEMBERS);
    fillFamilyConfig();
    activeOwnerFilters = [];
    refreshOwnerUi();
    renderHistory();
    familyConfigStatus.textContent = '初期メンバーに戻しました。';
    statusEl.textContent = '家族メンバー設定を初期状態に戻しました。';
  });
}

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

fillCategoryConfig();
fillFamilyConfig();
refreshOwnerUi();
refreshCategoryUi();
if (!ownersEl || !ownersEl.value.trim()) setFormOwners([]);
if (monthFilterEl) monthFilterEl.value = '';

if (isAuthorized()) {
  showApp();
} else {
  showGate('パスワードを入力してください。');
}

renderHistory();
