export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const suppliedPassword = request.headers.get('x-app-password') || '';
    const appPassword = env.APP_PASSWORD || 'kakeibo';

    if (request.headers.get('x-app-password-check') === '1') {
      if (suppliedPassword !== appPassword) {
        return json({ ok: false, error: 'パスワードが違います。' }, 401);
      }
      return json({ ok: true });
    }

    if (suppliedPassword !== appPassword) {
      return json({ error: 'パスワードが違います。' }, 401);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY が未設定です。' }, 500);
    }

    const formData = await request.formData();
    const files = formData.getAll('receipt').filter((value) => value instanceof File);
    const requestedCategories = parseRequestedCategories(formData.get('categories'));

    if (!files.length) {
      return json({ error: '画像ファイルが見つかりません。' }, 400);
    }

    const imageParts = [];
    for (const file of files.slice(0, 2)) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      const mime = file.type || 'image/jpeg';
      imageParts.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } });
    }

    const availableCategories = requestedCategories.length ? requestedCategories : DEFAULT_CATEGORIES;
    const prompt = buildPrompt(availableCategories, imageParts.length);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageParts,
            ],
          },
        ],
      }),
    });

    const openaiData = await openaiRes.json();
    if (!openaiRes.ok) {
      return json({ error: openaiData.error?.message || 'OpenAI API error' }, 500);
    }

    const text = openaiData.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = extractFirstJsonObject(text);
    }

    if (!parsed || typeof parsed !== 'object') {
      return json({ error: 'AI応答をJSONとして解釈できませんでした。' }, 500);
    }

    const items = normalizeItems(parsed.items);
    const category = normalizeCategory(parsed.category, availableCategories) || inferCategoryFromItems(items, parsed.merchant, availableCategories) || '未分類';

    return json({
      merchant: normalizeString(parsed.merchant),
      date: normalizeDate(parsed.date),
      total: normalizeTotal(parsed.total),
      category,
      items,
      note: normalizeString(parsed.note),
    });
  } catch (error) {
    return json({ error: error?.message || 'Unknown error' }, 500);
  }
}

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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function buildPrompt(categories, imageCount = 1) {
  return `You extract structured information from Japanese receipts. Return JSON only with this exact shape:
{
  "merchant": string,
  "date": "YYYY-MM-DD" or "",
  "total": number,
  "category": string,
  "items": [{"name": string, "price": number, "category": string}],
  "note": string
}
Rules:
- Use Japanese for category.
- Available categories: ${categories.join(', ')}.
- Always choose categories from the available list only.
- Prefer the user's category list over generic labels like 食料品 or 飲料.
- Prioritize item meaning over generic store category.
- Coupon or discount lines must be included in the items array, not only in note, categorized as クーポン or 値引き, and their price should be negative when visible.
- Do NOT treat leading codes, quantities, or SKU-like numbers as discounts unless the text explicitly contains 値引, 割引, 値下, クーポン, coupon, 還元, or 充当.
- If a line already has a visible item name and a visible price at the right edge, keep it as one item and do not merge it with neighboring priced lines.
- Only join consecutive lines when the first line clearly continues a product name and does not already have its own visible price.
- Examples: ブレンド, コーヒー, ラテ, お茶, 水, コーラ => ソフトドリンク.
- Examples: オールフリー, ドライゼロ, のんある気分, 0.00 => ノンアル.
- Examples: ビール, ハイボール, 酎ハイ, ワイン, 日本酒 => お酒. ハイボール is お酒 unless explicitly marked ノンアル.
- Examples: ブラックサンダー, チョコ, ポテチ, アイス, クッキー, グミ => おかし.
- total must be the final billed amount if visible.
- items should be an array of objects with name, price, and category when visible.
- price should be the item price in yen when visible, otherwise 0.
- If uncertain, keep values conservative and use empty string instead of guessing.
- Preserve natural product names such as ペヤング ソース焼そば as a single item when they appear split across wrapped lines.
- If ${imageCount} images are attached, they are consecutive photos of the same single receipt from top to bottom. Merge them into one receipt result.
- Avoid duplicate items when the two photos overlap slightly.
- Do not include markdown or commentary.`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function parseRequestedCategories(value) {
  try {
    const parsed = JSON.parse(String(value || '[]'));
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((v) => String(v || '').trim()).filter(Boolean))].slice(0, 40);
  } catch {
    return [];
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeItemName(value) {
  const name = normalizeString(value).replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!name) return '';
  const target = normalizeForSearch(name);
  if (/(値引|割引|値下|クーポン|coupon|還元|充当)/.test(target)) return name;
  return name.replace(/^[-−ー]?\d{2,4}\s+/, '').trim();
}

function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const name = sanitizeItemName(item);
        const category = classifyName(name);
        return { name, price: ensureSignedAmount(name, category, 0), category };
      }
      if (item && typeof item === 'object') {
        const name = sanitizeItemName(item.name || item.item);
        const category = normalizeCategory(item.category, DEFAULT_CATEGORIES) || classifyName(name) || '';
        return {
          name,
          price: ensureSignedAmount(name, category, item.price ?? item.amount ?? 0),
          category,
        };
      }
      return { name: '', price: 0, category: '' };
    })
    .filter((item) => item.name);
}

function normalizeTotal(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function ensureSignedAmount(name, category, value) {
  const amount = normalizeTotal(value);
  const cat = normalizeCategory(category, DEFAULT_CATEGORIES);
  const text = normalizeForSearch(name);
  const isDiscountLike = cat === 'クーポン' || cat === '値引き' || /(値引|割引|値下|クーポン|coupon|還元|充当)/.test(text);
  if (isDiscountLike && amount > 0) return -amount;
  return amount;
}

function normalizeDate(value) {
  if (typeof value !== 'string') return '';
  const s = value.trim().replaceAll('/', '-').replaceAll('.', '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const match = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

function extractFirstJsonObject(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeForSearch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s　]+/g, '')
    .replace(/[ーｰ‐-]/g, 'ー');
}

function normalizeCategory(value, categories) {
  const s = normalizeString(value);
  if (!s) return '';
  if (categories.includes(s)) return s;
  const lower = s.toLowerCase();
  if (['ソフトドリンク', '飲み物', '飲料'].includes(s) || ['drink', 'softdrink', 'beverage'].includes(lower)) return 'ソフトドリンク';
  if (['ノンアル', 'ノンアルコール'].includes(s) || ['nonalcohol', 'non-alcohol'].includes(lower)) return 'ノンアル';
  if (['お酒', '酒'].includes(s) || ['alcohol', 'liquor'].includes(lower)) return 'お酒';
  if (['おかし', 'お菓子', '菓子'].includes(s) || ['snack', 'sweets', 'dessert'].includes(lower)) return 'おかし';
  if (['食品', '食料品'].includes(s) || ['food', 'groceries', 'grocery'].includes(lower)) return '食費';
  if (s === 'クーポン' || lower === 'coupon') return 'クーポン';
  if (s === '値引き' || ['discount', 'sale', 'markdown'].includes(lower)) return '値引き';
  return s;
}

function classifyName(name) {
  const target = normalizeForSearch(name);
  if (!target) return '';
  if (/(クーポン|coupon)/.test(target)) return 'クーポン';
  if (/(値引|割引|値下|還元|充当)/.test(target)) return '値引き';
  if (/(ノンアル|ノンアルコール|ゼロアル|0\.00|0%|オールフリー|ドライゼロ|のんある気分|よわない)/.test(target)) return 'ノンアル';
  if (/(ブレンド|コーヒー|珈琲|ラテ|紅茶|お茶|緑茶|天然水|コーラ|ジュース)/.test(target)) return 'ソフトドリンク';
  if (/(ビール|ハイボール|酎ハイ|チューハイ|ワイン|日本酒|焼酎|梅酒|ウイスキー|氷結|ほろよい)/.test(target)) return 'お酒';
  if (/(ブラックサンダー|チョコ|ポテチ|アイス|クッキー|グミ|ガム|キャンディ|じゃがりこ)/.test(target)) return 'おかし';
  return '';
}

function inferCategoryFromItems(items, merchant = '', categories = DEFAULT_CATEGORIES) {
  const names = Array.isArray(items) ? items.map((item) => normalizeForSearch(item?.name || '')) : [];
  const rules = [
    { category: 'クーポン', keywords: ['クーポン', 'coupon'] },
    { category: '値引き', keywords: ['値引', '割引', '値下', '還元'] },
    { category: 'ノンアル', keywords: ['ノンアル', 'ノンアルコール', 'ゼロアル', '0.00', '0%', 'オールフリー', 'ドライゼロ', 'のんある気分', 'よわない'] },
    { category: 'ソフトドリンク', keywords: ['ブレンド', 'コーヒー', '珈琲', 'ラテ', '紅茶', 'お茶', '緑茶', '天然水', 'コーラ', 'ジュース'] },
    { category: 'お酒', keywords: ['ビール', 'ハイボール', '酎ハイ', 'チューハイ', 'ワイン', '日本酒', '焼酎'] },
    { category: 'おかし', keywords: ['ブラックサンダー', 'チョコ', 'ポテチ', 'アイス', 'クッキー', 'グミ', 'ガム', 'キャンディ'] },
  ];

  for (const rule of rules) {
    if (!categories.includes(rule.category)) continue;
    if (rule.keywords.some((keyword) => names.some((name) => name.includes(normalizeForSearch(keyword))))) {
      return rule.category;
    }
  }

  const merchantName = normalizeForSearch(merchant);
  if (categories.includes('ソフトドリンク') && ['スターバックス', 'starbucks', 'ドトール', 'doutor', 'タリーズ', 'tully'].some((word) => merchantName.includes(normalizeForSearch(word)))) {
    return 'ソフトドリンク';
  }
  return '';
}
