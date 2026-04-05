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
    const file = formData.get('receipt');
    if (!(file instanceof File)) {
      return json({ error: '画像ファイルが見つかりません。' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const mime = file.type || 'image/jpeg';
    const imageUrl = `data:${mime};base64,${base64}`;

    const prompt = `You extract structured information from Japanese receipts. Return JSON only with this exact shape:
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
- Available categories: 食費, 日用品, 外食, ソフトドリンク, お酒, ノンアル, おかし, 交通, 医療, 趣味, 交際, 未分類.
- Prioritize item meaning over generic store category.
- Examples: ブレンド, コーヒー, ラテ, お茶, 水, コーラ => ソフトドリンク.
- Examples: オールフリー, ドライゼロ, のんある気分, 0.00 => ノンアル.
- Examples: ビール, ハイボール, 酎ハイ, ワイン, 日本酒 => お酒.
- Examples: ブラックサンダー, チョコ, ポテチ, アイス, クッキー, グミ => おかし.
- total must be the final billed amount if visible.
- items should be an array of objects with name and price when visible.\n- price should be the item price in yen when visible, otherwise 0.
- If uncertain, keep values conservative and use empty string instead of guessing.
- Do not include markdown or commentary.`;

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
              { type: 'image_url', image_url: { url: imageUrl } },
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
    const category = normalizeCategory(parsed.category) || inferCategoryFromItems(items, parsed.merchant) || '未分類';

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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
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

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}


function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') {
      return { name: normalizeString(item), price: 0, category: '' };
    }
    if (item && typeof item === 'object') {
      const name = normalizeString(item.name || item.item);
      return {
        name,
        price: normalizeTotal(item.price ?? item.amount ?? 0),
        category: normalizeCategory(item.category) || '',
      };
    }
    return { name: '', price: 0, category: '' };
  }).filter(item => item.name);
}

function normalizeTotal(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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

function normalizeCategory(value) {
  const s = normalizeString(value);
  if (!s) return '';
  const lower = s.toLowerCase();
  if (['ソフトドリンク', '飲み物', '飲料', 'drink', 'softdrink', 'beverage'].includes(s) || ['drink', 'softdrink', 'beverage'].includes(lower)) return 'ソフトドリンク';
  if (['ノンアル', 'ノンアルコール'].includes(s) || ['nonalcohol', 'non-alcohol'].includes(lower)) return 'ノンアル';
  if (['お酒', '酒'].includes(s) || ['alcohol', 'liquor'].includes(lower)) return 'お酒';
  if (['おかし', 'お菓子', '菓子'].includes(s) || ['snack', 'sweets', 'dessert'].includes(lower)) return 'おかし';
  return s;
}

function inferCategoryFromItems(items, merchant = '') {
  const rules = [
    { category: 'ノンアル', keywords: ['ノンアル', 'ノンアルコール', 'ゼロアル', '0.00', '0%', 'オールフリー', 'ドライゼロ', 'のんある気分', 'よわない'] },
    { category: 'ソフトドリンク', keywords: ['ブレンド', 'コーヒー', '珈琲', 'ラテ', '紅茶', 'お茶', '緑茶', '天然水', 'コーラ', 'ジュース'] },
    { category: 'お酒', keywords: ['ビール', 'ハイボール', '酎ハイ', 'チューハイ', 'ワイン', '日本酒', '焼酎'] },
    { category: 'おかし', keywords: ['ブラックサンダー', 'チョコ', 'ポテチ', 'アイス', 'クッキー', 'グミ', 'ガム', 'キャンディ'] },
  ];

  const names = Array.isArray(items) ? items.map(normalizeForSearch) : [];
  for (const rule of rules) {
    if (rule.keywords.some(keyword => names.some(name => name.includes(normalizeForSearch(keyword))))) {
      return rule.category;
    }
  }

  const merchantName = normalizeForSearch(merchant);
  if (['スターバックス', 'starbucks', 'ドトール', 'doutor', 'タリーズ', 'tully'].some(word => merchantName.includes(normalizeForSearch(word)))) {
    return 'ソフトドリンク';
  }
  return '';
}
