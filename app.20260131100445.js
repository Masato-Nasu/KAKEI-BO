window.__KAKEIBO_APP_LOADED = true;
// Receipt Book (Prototype)
// Focus: UI flow, local storage, sorting/filter, category suggestion (Plan 1), store learning.
// OCR: demo via pasted text.

// ---------- OCR (Tesseract.js v5, CDN) ----------
// ---------- OCR (Tesseract.js v5, CDN) ----------
let captureImageDataUrl = null;
let _lastPickedFileMeta = null;
let _currentObjectUrl = null;

let _ocrWorker = null;
let _ocrWorkerLang = null;
let _ocrCdnBase = null;

function setOcrStatus(text){
  const s = el("ocrStatus");
  if(s) s.textContent = text;
}
function setOcrDiag(text){
  const d = el("ocrDiag");
  if(d) d.textContent = "診断： " + text;
}

async function waitForTesseract(timeoutMs=8000){
  const t0 = Date.now();
  while(Date.now() - t0 < timeoutMs){
    if(window.Tesseract) return true;
    await new Promise(r=>setTimeout(r, 120));
  }
  return false;
}

function getCdnBase(){
  // choose the base that matches loaded script if available
  const bases = window.__tessCdnBaseList || [
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist",
    "https://unpkg.com/tesseract.js@5/dist"
  ];
  if(_ocrCdnBase) return _ocrCdnBase;
  // If loaded-from is known, map to base
  const loaded = window.__tessLoadedFrom || "";
  if(loaded.includes("unpkg.com")) _ocrCdnBase = bases.find(b=>b.includes("unpkg.com")) || bases[1];
  else _ocrCdnBase = bases[0];
  return _ocrCdnBase;
}

async function fetchWithTimeout(url, ms=8000){
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort(), ms);
  try{
    const res = await fetch(url, { mode: "cors", cache: "no-store", signal: ctl.signal });
    return res;
  }finally{
    clearTimeout(t);
  }
}

async function quickFetchTest(url){

  // best-effort: may fail due to CORS/network, but helpful as hint
  try{
    const res = await fetch(url, { mode: "cors" });
    return res && res.ok;
  }catch(e){
    return false;
  }
}

function withTimeout(promise, ms, message){
  let t;
  const timeout = new Promise((_, reject)=>{ t=setTimeout(()=>reject(new Error(message)), ms); });
  return Promise.race([promise.finally(()=>clearTimeout(t)), timeout]);
}

async function ensureWorker(lang){
  const ok = await waitForTesseract(9000);
  if(!ok){
    throw new Error("Tesseract.js が読み込めませんでした（ネットワーク/拡張機能/社内フィルタの可能性）。");
  }

  const base = getCdnBase();
  const workerPath = `${base}/worker.min.js`;
  const corePath = `${base}/tesseract-core.wasm.js`;

  const langPathCandidates = [
    "https://tessdata.projectnaptha.com/4.0.0_fast",
    "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast",
    "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0_fast"
  ];

  async function pickLangPath(testLang){
    for(const cand of langPathCandidates){
      const probeUrl = `${cand}/${testLang}.traineddata.gz`;
      const ok = await quickFetchTest(probeUrl);
      if(ok) return cand;
    }
    return langPathCandidates[0];
  }

  // 1) pick best langPath by probing the first language (lightest)
  const firstLang = (String(lang||"eng").split("+")[0] || "eng");
  let langPath = await pickLangPath(firstLang);

  setOcrDiag(`lib=${(window.__tessLoadedFrom||"auto").split("/").slice(0,3).join("/")} / worker=${base.includes("unpkg")?"unpkg":"jsdelivr"} / lang=${langPath.split("/").slice(0,3).join("/")}`);

  // 2) probe all needed languages explicitly with timeout (detect block early)
  const needLangs = String(lang || "eng").split("+").filter(Boolean);
  for(const one of needLangs){
    const url = `${langPath}/${one}.traineddata.gz`;
    try{
      const res = await fetchWithTimeout(url, 9000);
      if(!(res && res.ok)) throw new Error(`status ${res ? res.status : "nores"}`);
    }catch(e){
      // auto fallback if Japanese is blocked
      if(String(lang||"").includes("jpn")){
        setOcrStatus("日本語OCRの言語データ取得に失敗 → 英語OCRに切替えます");
        if(el("ocrLang")) el("ocrLang").value = "eng";
        lang = "eng";
        // repick langPath using eng
        langPath = await pickLangPath("eng");
        setOcrDiag(`日本語言語データ取得NG / fallback=eng / lang=${langPath.split("/").slice(0,3).join("/")}`);
        break;
      }else{
        setOcrDiag(`言語データ取得NG: ${one}`);
        throw new Error("言語データ（traineddata.gz）の取得に失敗しました。回線/フィルタの可能性があります。");
      }
    }
  }

  // 3) (non-blocking) worker fetch hint
  const canWorker = await quickFetchTest(workerPath);
  if(!canWorker) setOcrDiag("worker.min.js 取得に失敗（CDNブロックの可能性）");

  if(_ocrWorker && _ocrWorkerLang === lang) return _ocrWorker;

  if(_ocrWorker && _ocrWorkerLang && _ocrWorkerLang !== lang){
    try{ await _ocrWorker.terminate(); }catch(e){}
    _ocrWorker = null;
    _ocrWorkerLang = null;
  }

  if(!_ocrWorker){
    setOcrStatus(`OCR初期化中（${lang}）…`);
    _ocrWorker = await window.Tesseract.createWorker({
      workerPath,
      corePath,
      langPath,
      logger: (m)=>{
        if(!m) return;
        if(typeof m.progress === "number"){
          const p = Math.round(m.progress * 100);
          setOcrStatus(`OCR: ${m.status}… ${p}%`);
        }else if(m.status){
          setOcrStatus(`OCR: ${m.status}`);
        }
      }
    });
  }

  // Multi-lang: load each language then initialize combined
  const langs = String(lang || "eng").split("+").filter(Boolean);
  for(const one of langs){
    setOcrStatus(`言語ロード中（${one}）…`);
    await withTimeout(_ocrWorker.loadLanguage(one), 60000, "言語ロードがタイムアウトしました（言語データ取得が詰まっている可能性）");
  }
  setOcrStatus(`言語初期化中（${lang}）…`);
  await withTimeout(_ocrWorker.initialize(lang), 60000, "言語初期化がタイムアウトしました（環境/回線の可能性）");

  _ocrWorkerLang = lang;
  setOcrStatus("OCR準備完了");
  return _ocrWorker;
}



async function runOcrFromImage(dataUrl, lang){
  const worker = await withTimeout(ensureWorker(lang), 90000, "OCR初期化がタイムアウトしました（初回言語DLがブロック/遅延の可能性）。英語のみで確認してください。");
  setOcrStatus("OCR解析中…");
  const ret = await withTimeout(worker.recognize(dataUrl), 120000, "OCRがタイムアウトしました（言語データ取得が詰まっている可能性）。英語のみで確認してください。");
  const text = (ret && ret.data && ret.data.text) ? ret.data.text : "";
  setOcrStatus("OCR完了（テキスト欄に反映しました）");
  return text;
}

const CATEGORIES = [
  { key: "food", label: "食費" },
  { key: "dine", label: "外食" },
  { key: "drink", label: "飲み代" },
  { key: "daily", label: "日用品" },
  { key: "clothes", label: "洋服" },
  { key: "beauty", label: "美容" },
  { key: "transport", label: "交通" },
  { key: "hobby", label: "趣味" },
  { key: "medical", label: "医療" },
  { key: "gift", label: "ギフト" },
  { key: "other", label: "その他" },
  { key: "uncat", label: "未分類" },
];

const STORE_HINTS = {
  // Strong: convenience/super => FOOD (Plan 1)
  food_store: [
    "セブン", "セブンイレブン", "ローソン", "ファミマ", "ファミリーマート",
    "ミニストップ", "デイリーヤマザキ",
    "イオン", "マルエツ", "西友", "ライフ", "OK", "オーケー", "イトーヨーカドー",
    "業務スーパー", "まいばすけっと",
    "スギ薬局", "マツキヨ", "マツモトキヨシ", "ウエルシア", "ツルハ", "サンドラッグ"
  ],
  // Strong: izakaya/bar => DRINK (Plan 1)
  drink_store: ["居酒屋", "酒場", "BAR", "バー", "バル", "PUB", "パブ", "立呑", "立ち飲み", "焼鳥", "やきとり", "串", "ホルモン", "大衆酒場"],
  // Soft: restaurants => DINE
  dine_store: ["レストラン", "食堂", "カフェ", "珈琲", "ラーメン", "そば", "うどん", "定食", "寿司", "焼肉", "中華", "マクドナルド", "吉野家", "すき家", "松屋"],
};

const ITEM_HINTS = {
  drink_words: ["ビール", "生ビール", "ハイボール", "サワー", "ワイン", "日本酒", "焼酎", "ボトル", "酎ハイ", "チューハイ", "カクテル"],
};

const EXCLUDE_LINE_WORDS = [
  "小計", "合計", "税込", "税", "外税", "内税", "釣銭", "お預り", "お釣り", "ポイント", "領収", "レシート", "店舗", "TEL", "電話", "レジ", "担当", "会員"
];

const STORAGE_KEY = "receipt_book_v1";

function nowYMD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function yen(n){
  const v = Math.max(0, Math.round(Number(n)||0));
  return "¥" + v.toLocaleString("ja-JP");
}

function normalizeStoreKey(name){
  return (name||"").toString()
    .trim()
    .replace(/[\s　]+/g,"")
    .replace(/[‐‑–—−]/g,"-")
    .toUpperCase();
}

function loadDB(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return { receipts: [], learning: {} };
  try{
    const obj = JSON.parse(raw);
    return { receipts: obj.receipts||[], learning: obj.learning||{} };
  }catch(e){
    return { receipts: [], learning: {} };
  }
}

function saveDB(db){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function uuid(){
  return "r_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// ---------- Parsing ----------
function parseReceiptText(text){
  const lines = (text||"")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let store = "";
  let date = "";
  let totals = [];

  // date patterns
  const reYMD1 = /(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
  const reYMD2 = /(\d{1,2})[\/\-\.](\d{1,2})/;

  // money patterns
  const reMoney = /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,7})\s*円?/;

  // heuristic: first non-numeric-ish line as store
  for(const l of lines){
    if(!store){
      if(l.length >= 2 && !/^\d/.test(l) && !l.includes("http") && !l.includes("www")){
        store = l.replace(/[*·•]+/g,"").trim();
      }
    }
    if(!date){
      const m = l.match(reYMD1);
      if(m){
        const y = m[1];
        const mo = String(parseInt(m[2],10)).padStart(2,"0");
        const da = String(parseInt(m[3],10)).padStart(2,"0");
        date = `${y}-${mo}-${da}`;
      }else{
        const mm = l.match(reYMD2);
        if(mm && lines.some(x=>x.includes("20"))===false){
          // only if no year elsewhere, keep as fallback with current year
          const y = new Date().getFullYear();
          const mo = String(parseInt(mm[1],10)).padStart(2,"0");
          const da = String(parseInt(mm[2],10)).padStart(2,"0");
          date = `${y}-${mo}-${da}`;
        }
      }
    }

    // total candidates
    if(/合計|TOTAL|お買上|ご利用金額|支払|お支払い/i.test(l)){
      const m = l.match(reMoney);
      if(m) totals.push(toNumber(m[1]));
    }
    // also consider any money lines as candidates
    const m2 = l.match(reMoney);
    if(m2) totals.push(toNumber(m2[1]));
  }

  totals = totals.filter(n=>Number.isFinite(n) && n>0);
  const total = totals.length ? Math.max(...totals) : 0;

  // items: lines ending with a money value
  const items = [];
  for(const l of lines){
    if(EXCLUDE_LINE_WORDS.some(w => l.includes(w))) continue;

    // common receipt line: name ... price
    const m = l.match(/^(.*?)(?:\s+|\t+)([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,7})\s*円?$/);
    if(m){
      const name = cleanItemName(m[1]);
      const price = toNumber(m[2]);
      if(name && price>0){
        items.push({ name, price, categoryKey: "uncat" });
      }
      continue;
    }

    // alternative: name + price without spaces (rare) -> skip for MVP
  }

  return {
    store: store || "",
    date: date || nowYMD(),
    total,
    items
  };
}

function cleanItemName(s){
  return (s||"")
    .replace(/[\s　]+/g," ")
    .replace(/[*·•]+/g,"")
    .trim();
}

function toNumber(s){
  return Number(String(s).replace(/[^0-9]/g,"")) || 0;
}

// ---------- Suggestion (Plan 1) ----------
function suggestCategory(storeName, items, learning){
  const storeKey = normalizeStoreKey(storeName);
  if(storeKey && learning[storeKey]){
    return { key: learning[storeKey], level: "high", reason: "学習（店）" };
  }

  const s = (storeName||"").toString();

  // Strong: convenience/super/drug -> FOOD
  if(STORE_HINTS.food_store.some(k => s.includes(k))){
    return { key: "food", level: "high", reason: "店名（コンビニ/スーパー等）" };
  }

  // Strong: izakaya/bar -> DRINK
  if(STORE_HINTS.drink_store.some(k => s.includes(k))){
    return { key: "drink", level: "high", reason: "店名（居酒屋/バー等）" };
  }

  // Soft: dine
  if(STORE_HINTS.dine_store.some(k => s.includes(k))){
    // If drink words exist -> drink (mid), else dine (mid)
    const hasDrink = (items||[]).some(it => ITEM_HINTS.drink_words.some(w => (it.name||"").includes(w)));
    if(hasDrink) return { key: "drink", level: "mid", reason: "品目（酒）" };
    return { key: "dine", level: "mid", reason: "店名（飲食）" };
  }

  // Items hint: drink words (but NOT if convenience/super already handled)
  const hasDrink = (items||[]).some(it => ITEM_HINTS.drink_words.some(w => (it.name||"").includes(w)));
  if(hasDrink){
    return { key: "drink", level: "mid", reason: "品目（酒）" };
  }

  return { key: "uncat", level: "low", reason: "根拠不足" };
}

// ---------- App State ----------
const el = (id)=>document.getElementById(id);

const pages = {
  capture: el("pageCapture"),
  confirm: el("pageConfirm"),
  list: el("pageList"),
  settings: el("pageSettings"),
};

let navStack = ["capture"]; // simple
let currentReceiptDraft = null; // in-memory draft
let lastUndo = null;

function setTitle(t){ el("topTitle").textContent = t; }

function showPage(name){
  Object.entries(pages).forEach(([k,v]) => v.classList.toggle("hidden", k!==name));
  const titleMap = { capture:"レシート", confirm:"確認", list:"一覧", settings:"設定" };
  setTitle(titleMap[name]||"");
  // back button enabled if stack > 1
  el("btnBack").disabled = navStack.length<=1;
  // mini bar hidden except confirm
  el("miniBar").classList.toggle("hidden", name!=="confirm");
}

function pushPage(name){
  navStack.push(name);
  showPage(name);
}

function popPage(){
  if(navStack.length>1){
    navStack.pop();
    showPage(navStack[navStack.length-1]);
  }
}

function openSettings(){
  pushPage("settings");
}

function gotoList(){
  pushPage("list");
  renderList();
}

function gotoCapture(){
  navStack = ["capture"];
  showPage("capture");
  dbg("init: binding listeners");
  window.__KAKEIBO_FILE_BIND = true;

try{
  const pickBtn = el("btnPickImage");
  const fi = el("fileInput");
  if(pickBtn && fi){
    pickBtn.addEventListener("click", ()=>{
      dbg("btnPickImage click");
      try{ fi.click(); }catch(e){ dbg("fileInput.click failed: " + (e.message||String(e))); }
    });
  }
}catch(e){}

  try{ const c = el("btnCancelOcr"); if(c) c.disabled = true; }catch(e){}
}

function gotoConfirm(){
  pushPage("confirm");
  renderConfirm();
}

function toast(msg, undoFn){
  lastUndo = undoFn || null;
  el("toastMsg").textContent = msg;
  el("toast").classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el("toast").classList.add("hidden"), 3000);
}

function dbg(msg){
  try{
    const pre = document.getElementById("debugLog");
    if(!pre) return;
    const t = new Date().toISOString().slice(11,19);
    pre.textContent += `[${t}] ${msg}\n`;
  }catch(e){}
}

function dumpState(tag){
  try{
    const fi = el("fileInput");
    const btn = el("btnRunOcr");
    const files = fi && fi.files ? fi.files.length : 0;
    const name = (fi && fi.files && fi.files[0]) ? (fi.files[0].name || "(no name)") : "";
    const type = (fi && fi.files && fi.files[0]) ? (fi.files[0].type || "") : "";
    const size = (fi && fi.files && fi.files[0]) ? fi.files[0].size : 0;
    dbg(`[state ${tag}] files=${files} ${name} ${type} ${size} captureSet=${!!captureImageDataUrl} btnDisabled=${btn ? btn.disabled : "na"}`);
  }catch(e){}
}

/* --- SW diagnostics (safe) --- */
function setSwStatus(text){
  try{ const s=document.getElementById("swStatus"); if(s) s.textContent=text; }catch(e){}
}
function swCheckStatus(){
  try{
    if(!("serviceWorker" in navigator)){ setSwStatus("SW: 未対応"); return; }
    navigator.serviceWorker.getRegistration().then(reg=>{
      const ctrl = !!navigator.serviceWorker.controller;
      if(!reg){ setSwStatus(`SW: 未登録（controller=${ctrl?"yes":"no"}）`); return; }
      const st = (reg.active && reg.active.state) || "unknown";
      setSwStatus(`SW: 登録済 / state=${st} / controller=${ctrl?"yes":"no"} / scope=${reg.scope}`);
    });
  }catch(e){}
}
function swReset(){
  try{
    if(!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations()
      .then(rs => Promise.all(rs.map(r => r.unregister())))
      .then(()=>navigator.serviceWorker.register("./sw.js",{scope:"./"}))
      .then(()=>setTimeout(()=>location.reload(),250));
  }catch(e){}
}
/* --- /SW diagnostics --- */

window.addEventListener("error", (e)=>{
  dbg("ERROR: " + (e && e.message ? e.message : String(e)));
});

window.addEventListener("unhandledrejection", (e)=>{
  dbg("PROMISE: " + (e && e.reason ? (e.reason.message || String(e.reason)) : "unknown"));


function setSwStatus(text){
  const s = document.getElementById("swStatus");
  if(s) s.textContent = text;
}

async function (typeof swCheckStatus==="function"?swCheckStatus():void 0){
  try{
    if(!('serviceWorker' in navigator)){
      setSwStatus("SW: このブラウザは未対応");
      return { supported:false };
    }
    const reg = await navigator.serviceWorker.getRegistration();
    const ctrl = !!navigator.serviceWorker.controller;
    if(!reg){
      setSwStatus(`SW: 未登録（controller=${ctrl ? "yes":"no"}）`);
      return { supported:true, registered:false, controller:ctrl };
    }
    const state = reg.active ? reg.active.state : (reg.installing ? reg.installing.state : (reg.waiting ? reg.waiting.state : "unknown"));
    const scriptURL = (reg.active && reg.active.scriptURL) || (reg.installing && reg.installing.scriptURL) || (reg.waiting && reg.waiting.scriptURL) || "";
    setSwStatus(`SW: 登録済 / state=${state} / controller=${ctrl ? "yes":"no"} / scope=${reg.scope}`);
    dbg(`sw: script=${scriptURL}`);
    return { supported:true, registered:true, controller:ctrl, scope:reg.scope, state, scriptURL };
  }catch(e){
    setSwStatus("SW: エラー（Console/デバッグ参照）");
    dbg("swCheck error: " + (e && e.message ? e.message : String(e)));
    return { supported:true, error:true };
  }
}

async function (typeof swReset==="function"?swReset():void 0){
  if(!('serviceWorker' in navigator)){
    setSwStatus("SW: 未対応");
    return;
  }
  try{
    setSwStatus("SW: 再登録中…");
    const regs = await navigator.serviceWorker.getRegistrations();
    for(const r of regs){
      try{ await r.unregister(); }catch(e){}
    }
    // hard reload to purge SW-controlled cache
    const reg2 = await navigator.serviceWorker.register('./sw.js', { scope:'./' });
    dbg("sw reset: registered " + reg2.scope);
    await (typeof swCheckStatus==="function"?swCheckStatus():void 0);
    // force reload to attach controller
    setTimeout(()=>location.reload(), 400);
  }catch(e){
    setSwStatus("SW: 再登録失敗（https/パス/キャッシュの可能性）");
    dbg("swReset error: " + (e && e.message ? e.message : String(e)));
  }
}

});



function closeToast(){
  el("toast").classList.add("hidden");
}

// ---------- Modal ----------
const modal = el("modal");
let modalResolve = null;

function openModal(title, bodyNode, { okText="OK" }={}){
  el("modalTitle").textContent = title;
  const body = el("modalBody");
  body.innerHTML = "";
  body.appendChild(bodyNode);
  el("modalOk").textContent = okText;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  return new Promise(resolve => { modalResolve = resolve; });
}

function closeModal(result){
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  const r = modalResolve;
  modalResolve = null;
  if(r) r(result);
}

el("modalCancel").addEventListener("click", ()=> closeModal(null));
el("modalOk").addEventListener("click", ()=> closeModal(true));
modal.addEventListener("keydown", (e)=>{
  if(e.key==="Escape") closeModal(null);
});

// ---------- Rendering: Confirm ----------
function renderChips(){
  const row = el("chipRowAll");
  row.innerHTML = "";
  CATEGORIES.forEach(c=>{
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = c.label;
    b.dataset.key = c.key;
    b.addEventListener("click", ()=>{
      setDraftCategory(c.key, "manual");
    });
    row.appendChild(b);
  });
}

function setDraftCategory(catKey, source="manual"){
  if(!currentReceiptDraft) return;
  const prev = currentReceiptDraft.categoryKey;
  currentReceiptDraft.categoryKey = catKey;
  // apply to items that were following previous draft category OR were uncat (MVP rule)
  currentReceiptDraft.items = currentReceiptDraft.items.map(it=>{
    if(it.categoryKey === prev || it.categoryKey === "uncat"){
      return { ...it, categoryKey: catKey };
    }
    return it;
  });
  renderConfirm();
  toast("カテゴリを更新しました", ()=>{
    currentReceiptDraft.categoryKey = prev;
    renderConfirm();
  });
}

function renderConfirm(){
  if(!currentReceiptDraft){
    gotoCapture();
    return;
  }
  const draft = currentReceiptDraft;

  // summary
  el("sumStore").textContent = draft.store || "—";
  el("sumDate").textContent = draft.date || "—";
  el("sumTotal").textContent = draft.total ? yen(draft.total) : "—";

  // mini bar
  el("miniStore").textContent = (draft.store||"—").slice(0, 24);
  el("miniTotal").textContent = draft.total ? yen(draft.total) : "—";

  // suggestion
  const db = loadDB();
  const sug = suggestCategory(draft.store, draft.items, db.learning);
  el("chipSuggested").textContent = labelOf(sug.key);
  el("suggestMeta").textContent = sug.level==="high" ? `✓ ${sug.reason}` : (sug.level==="mid" ? `候補：${sug.reason}` : `未確定：${sug.reason}`);

  // default draft category if empty
  if(!draft.categoryKey || draft.categoryKey==="__unset__"){
    draft.categoryKey = sug.key;
    // apply to items
    draft.items = draft.items.map(it => ({ ...it, categoryKey: sug.key }));
  }

  renderChips();
  // highlight selected
  document.querySelectorAll("#chipRowAll .chip").forEach(ch=>{
    ch.classList.toggle("on", ch.dataset.key === draft.categoryKey);
  });

  // suggested chip acts as quick apply
  el("chipSuggested").onclick = ()=> setDraftCategory(sug.key, "suggest");

  // items list
  const list = el("itemsList");
  list.innerHTML = "";
  if(!draft.items.length){
    const div = document.createElement("div");
    div.className = "note";
    div.textContent = "品目が抽出できませんでした。下の「品目を追加」で手入力できます。";
    list.appendChild(div);
  } else {
    draft.items.forEach((it, idx)=>{
      const row = document.createElement("div");
      row.className = "itemRow";
      row.dataset.idx = idx;

      const main = document.createElement("div");
      main.className = "itemMain";
      const name = document.createElement("div");
      name.className = "itemName";
      name.textContent = it.name || "（不明）";
      const cat = document.createElement("div");
      cat.className = "itemCat";
      cat.textContent = labelOf(it.categoryKey || "uncat");
      main.appendChild(name);
      main.appendChild(cat);

      const price = document.createElement("div");
      price.className = "itemPrice";
      price.textContent = yen(it.price||0);

      const swipe = document.createElement("div");
      swipe.className = "swipeHint";
      swipe.textContent = "↔";

      // Tap row => category tray
      row.addEventListener("click", (e)=>{
        if(e.target === swipe) return; // swipe area handled separately
        openCategoryTray(idx);
      });

      // Swipe area: pointer events for quick cycling
      attachSwipeCycler(swipe, idx);

      row.appendChild(main);
      row.appendChild(price);
      row.appendChild(swipe);
      list.appendChild(row);
    });
  }

  // mini bar tap scroll top
  el("miniBar").onclick = ()=>{
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

// Swipe cycler (limited area)
function attachSwipeCycler(node, itemIdx){
  let startX = 0, startY = 0, active = false;
  node.addEventListener("pointerdown", (e)=>{
    active = true;
    startX = e.clientX; startY = e.clientY;
    node.setPointerCapture(e.pointerId);
  });
  node.addEventListener("pointermove", (e)=>{
    if(!active) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if(Math.abs(dy) > 18) { active = false; return; } // vertical cancel
    if(Math.abs(dx) > 26){
      active = false;
      const dir = dx>0 ? -1 : 1; // right = prev, left = next
      cycleItemCategory(itemIdx, dir);
    }
  });
  node.addEventListener("pointerup", ()=> active = false);
  node.addEventListener("pointercancel", ()=> active = false);
}

function cycleItemCategory(idx, dir){
  const draft = currentReceiptDraft;
  if(!draft) return;
  const keys = CATEGORIES.map(c=>c.key);
  const cur = draft.items[idx].categoryKey || "uncat";
  let i = keys.indexOf(cur);
  if(i<0) i = keys.length-1;
  const next = keys[(i + dir + keys.length) % keys.length];
  const prev = draft.items[idx].categoryKey;
  draft.items[idx].categoryKey = next;
  renderConfirm();
  toast(`品目カテゴリ：${labelOf(next)}`, ()=>{
    draft.items[idx].categoryKey = prev;
    renderConfirm();
  });
}

function openCategoryTray(itemIdx){
  const tray = document.createElement("div");
  tray.style.display = "grid";
  tray.style.gap = "10px";

  const info = document.createElement("div");
  info.className = "note";
  const it = currentReceiptDraft.items[itemIdx];
  info.textContent = `この品目：${it.name}（${yen(it.price)}）`;
  tray.appendChild(info);

  // Quick (recent + uncat)
  const db = loadDB();
  const recent = getRecentCategories(db);
  const quick = document.createElement("div");
  quick.className = "chipRow";
  // suggestion (temporary) as first in quick
  const sug = suggestCategory(currentReceiptDraft.store, currentReceiptDraft.items, db.learning);
  const quickKeys = [];
  if(sug.level !== "low") quickKeys.push(sug.key);
  recent.forEach(k => { if(!quickKeys.includes(k)) quickKeys.push(k); });
  while(quickKeys.length < 3) quickKeys.push("food");
  const quickFinal = [...quickKeys.slice(0,3), "uncat"];
  quickFinal.forEach(k=>{
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = labelOf(k);
    if(k===it.categoryKey) b.classList.add("on");
    b.onclick = ()=>{
      const prev = it.categoryKey;
      it.categoryKey = k;
      closeModal(true);
      renderConfirm();
      bumpRecentCategory(k);
      toast("品目カテゴリを更新しました", ()=>{
        it.categoryKey = prev;
        renderConfirm();
      });
    };
    quick.appendChild(b);
  });
  tray.appendChild(quick);

  // Main grid 2x4
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(4, 1fr)";
  grid.style.gap = "8px";

  const mainKeys = ["food","daily","clothes","dine","drink","beauty","transport","hobby"];
  mainKeys.forEach(k=>{
    const b = document.createElement("button");
    b.className = "btn";
    b.style.height = "44px";
    b.textContent = labelOf(k);
    b.onclick = ()=>{
      const prev = it.categoryKey;
      it.categoryKey = k;
      closeModal(true);
      renderConfirm();
      bumpRecentCategory(k);
      toast("品目カテゴリを更新しました", ()=>{
        it.categoryKey = prev;
        renderConfirm();
      });
    };
    grid.appendChild(b);
  });
  tray.appendChild(grid);

  // Details (collapsed by default)
  const details = document.createElement("details");
  const sum = document.createElement("summary");
  sum.textContent = "詳細…";
  sum.style.cursor = "pointer";
  sum.style.color = "var(--muted)";
  sum.style.fontSize = "13px";
  details.appendChild(sum);

  const more = document.createElement("div");
  more.style.display = "grid";
  more.style.gridTemplateColumns = "repeat(4, 1fr)";
  more.style.gap = "8px";
  ["medical","gift","other"].forEach(k=>{
    const b = document.createElement("button");
    b.className = "btn";
    b.style.height = "44px";
    b.textContent = labelOf(k);
    b.onclick = ()=>{
      const prev = it.categoryKey;
      it.categoryKey = k;
      closeModal(true);
      renderConfirm();
      bumpRecentCategory(k);
      toast("品目カテゴリを更新しました", ()=>{
        it.categoryKey = prev;
        renderConfirm();
      });
    };
    more.appendChild(b);
  });
  details.appendChild(more);
  tray.appendChild(details);

  openModal("カテゴリ変更", tray, { okText: "閉じる" }).then(()=>{});
}

function labelOf(key){
  const c = CATEGORIES.find(x=>x.key===key);
  return c ? c.label : "未分類";
}

// recent categories stored in localStorage
function getRecentCategories(db){
  const raw = localStorage.getItem("rb_recentCats") || "[]";
  try{
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }catch(e){ return []; }
}
function bumpRecentCategory(key){
  const raw = localStorage.getItem("rb_recentCats") || "[]";
  let arr = [];
  try{ arr = JSON.parse(raw); }catch(e){}
  arr = [key, ...(arr||[]).filter(k=>k!==key)];
  arr = arr.slice(0,6);
  localStorage.setItem("rb_recentCats", JSON.stringify(arr));
}

// ---------- Capture / draft creation ----------
function setCapturePreviewFromDataUrl(dataUrl){
  const box = el("capturePreview");
  if(!box) return;
  box.innerHTML = "";

  const img = document.createElement("img");
  img.alt = "receipt preview";
  img.loading = "eager";
  img.onerror = ()=>{
    const meta = _lastPickedFileMeta ? `${_lastPickedFileMeta.type || "unknown"} / ${Math.round((_lastPickedFileMeta.size||0)/1024)}KB` : "";
    box.innerHTML = `<div class="captureBox__hint">プレビュー表示に失敗しました。<br>${meta}<br>（HEIC/HEIF等の形式だと表示できない環境があります。iPhoneなら「設定→カメラ→フォーマット→互換性優先(JPEG)」で改善することがあります）</div>`;
    setOcrStatus("画像形式が未対応の可能性があります（プレビュー失敗）");
    dbg("preview img.onerror");
  };
  img.onload = ()=>{
    dbg("preview img.onload");
  };
  img.src = dataUrl;

  box.appendChild(img);
  captureImageDataUrl = dataUrl;

  const btn = el("btnRunOcr");
  if(btn) btn.disabled = false;
  setOcrStatus("OCR待機中（「画像からOCR」ボタンで実行できます）");
}


function createDraftFromText(text, imageDataUrl=null){
  const parsed = parseReceiptText(text);
  const db = loadDB();
  const sug = suggestCategory(parsed.store, parsed.items, db.learning);
  const draft = {
    id: uuid(),
    createdAt: Date.now(),
    store: parsed.store || "",
    date: parsed.date || nowYMD(),
    total: parsed.total || 0,
    categoryKey: "__unset__",
    items: parsed.items || [],
    imageThumb: imageDataUrl || null,
    sourceText: text || ""
  };
  currentReceiptDraft = draft;
  // stay on capture
}

function createDraftEmpty(imageDataUrl=null){
  currentReceiptDraft = {
    id: uuid(),
    createdAt: Date.now(),
    store: "",
    date: nowYMD(),
    total: 0,
    categoryKey: "__unset__",
    items: [],
    imageThumb: imageDataUrl || null,
    sourceText: ""
  };
  // stay on capture
}

// ---------- List ----------
let listState = {
  range: "this", // this|last|all
  sort: { key:"date", dir:"desc" }, // date|total|store|category
  filterCat: "all"
};

function renderList(){
  const db = loadDB();
  // filter by range
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLast = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const endLast = new Date(now.getFullYear(), now.getMonth(), 1);

  let receipts = [...db.receipts];

  if(listState.range==="this"){
    receipts = receipts.filter(r => r.date >= fmt(start) && r.date <= fmtEndMonth(start));
  }else if(listState.range==="last"){
    receipts = receipts.filter(r => r.date >= fmt(startLast) && r.date < fmt(endLast));
  }

  if(listState.filterCat!=="all"){
    receipts = receipts.filter(r => r.categoryKey === listState.filterCat);
  }

  // sort
  receipts.sort((a,b)=>{
    const k = listState.sort.key;
    let av, bv;
    if(k==="date"){ av=a.date||""; bv=b.date||""; }
    if(k==="total"){ av=Number(a.total||0); bv=Number(b.total||0); }
    if(k==="store"){ av=(a.store||""); bv=(b.store||""); }
    if(k==="category"){ av=labelOf(a.categoryKey||"uncat"); bv=labelOf(b.categoryKey||"uncat"); }
    if(av<bv) return listState.sort.dir==="asc" ? -1 : 1;
    if(av>bv) return listState.sort.dir==="asc" ? 1 : -1;
    return 0;
  });

  // totals
  const totals = {};
  receipts.forEach(r=>{
    const k = r.categoryKey || "uncat";
    totals[k] = (totals[k]||0) + Number(r.total||0);
  });

  const totalsBox = el("totalsBox");
  totalsBox.innerHTML = "";
  const grand = receipts.reduce((s,r)=>s+Number(r.total||0),0);
  totalsBox.appendChild(totalRow("合計", yen(grand), true));
  // emphasize drink & clothes
  ["drink","clothes"].forEach(k=>{
    const v = totals[k]||0;
    totalsBox.appendChild(totalRow(labelOf(k), yen(v), false));
  });

  // list
  const list = el("receiptList");
  list.innerHTML = "";
  if(!receipts.length){
    const n = document.createElement("div");
    n.className = "note";
    n.textContent = "データがありません。右下の「新規（撮影）」から追加できます。";
    list.appendChild(n);
  } else {
    receipts.forEach(r=>{
      const row = document.createElement("div");
      row.className = "receiptRow";
      row.onclick = ()=>{
        // open as draft for edit
        currentReceiptDraft = JSON.parse(JSON.stringify(r));
        gotoConfirm();
      };
      const top = document.createElement("div");
      top.className = "receiptTop";
      const left = document.createElement("div");
      const store = document.createElement("div");
      store.className = "receiptStore";
      store.textContent = r.store || "（店名なし）";
      const meta = document.createElement("div");
      meta.className = "receiptMeta";
      meta.textContent = `${r.date || "—"} / ${labelOf(r.categoryKey||"uncat")}`;
      left.appendChild(store);
      left.appendChild(meta);

      const total = document.createElement("div");
      total.className = "receiptTotal";
      total.textContent = yen(r.total||0);

      top.appendChild(left);
      top.appendChild(total);

      row.appendChild(top);
      list.appendChild(row);
    });
  }

  // filter dropdown
  const sel = el("filterCategory");
  sel.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "カテゴリ：すべて";
  sel.appendChild(optAll);
  CATEGORIES.forEach(c=>{
    const o = document.createElement("option");
    o.value = c.key;
    o.textContent = `カテゴリ：${c.label}`;
    sel.appendChild(o);
  });
  sel.value = listState.filterCat;

  // segment buttons state
  document.querySelectorAll('[data-range]').forEach(b=>{
    b.classList.toggle("on", b.dataset.range===listState.range);
  });
  document.querySelectorAll('[data-sort]').forEach(b=>{
    b.classList.toggle("on", b.dataset.sort===listState.sort.key);
  });
}

function totalRow(label, value, strong=false){
  const row = document.createElement("div");
  row.className = "totalRow";
  const l = document.createElement("div");
  l.textContent = label;
  const v = document.createElement("div");
  v.innerHTML = strong ? `<strong>${value}</strong>` : value;
  row.appendChild(l);
  row.appendChild(v);
  return row;
}

function fmt(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function fmtEndMonth(start){
  const d = new Date(start.getFullYear(), start.getMonth()+1, 0);
  return fmt(d);
}

// ---------- Save / Discard ----------
function saveDraft(){
  const draft = currentReceiptDraft;
  if(!draft) return;

  // learn store -> category
  const db = loadDB();
  const storeKey = normalizeStoreKey(draft.store);
  if(storeKey && draft.categoryKey && draft.categoryKey!=="uncat"){
    db.learning[storeKey] = draft.categoryKey;
  }

  // if exists update
  const idx = db.receipts.findIndex(r=>r.id===draft.id);
  if(idx>=0) db.receipts[idx] = draft;
  else db.receipts.unshift(draft);

  saveDB(db);
  bumpRecentCategory(draft.categoryKey||"uncat");
  currentReceiptDraft = null;
  toast("保存しました");
  gotoList();
}

function discardDraft(){
  currentReceiptDraft = null;
  toast("破棄しました");
  gotoCapture();
}

// ---------- Editing summary fields ----------
function editField(field){
  const draft = currentReceiptDraft;
  if(!draft) return;

  if(field==="store"){
    const wrap = document.createElement("div");
    const input = document.createElement("input");
    input.className = "input";
    input.value = draft.store || "";
    input.placeholder = "例）ユニクロ / セブン-イレブン / ○○酒場";
    wrap.appendChild(input);

    openModal("店名を編集", wrap).then(ok=>{
      if(!ok) return closeModal(null);
      const prev = draft.store;
      draft.store = (input.value||"").trim();
      renderConfirm();
      toast("店名を更新しました", ()=>{
        draft.store = prev;
        renderConfirm();
      });
      closeModal(null);
    });
  }

  if(field==="date"){
    const wrap = document.createElement("div");
    const input = document.createElement("input");
    input.className = "input";
    input.inputMode = "numeric";
    input.placeholder = "YYYY-MM-DD / YYYY/MM/DD";
    input.value = draft.date || nowYMD();
    wrap.appendChild(input);

    openModal("日付を編集", wrap).then(ok=>{
      if(!ok) return closeModal(null);
      const prev = draft.date;
      const v = normalizeDate(input.value);
      if(v){
        draft.date = v;
        renderConfirm();
        toast("日付を更新しました", ()=>{
          draft.date = prev;
          renderConfirm();
        });
      }
      closeModal(null);
    });
  }

  if(field==="total"){
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "10px";

    const input = document.createElement("input");
    input.className = "input";
    input.inputMode = "numeric";
    input.placeholder = "例）3280";
    input.value = String(draft.total||"").replace(/[^0-9]/g,"");
    wrap.appendChild(input);

    // candidate buttons
    const cand = detectTotalCandidates(draft.sourceText||"");
    if(cand.length){
      const row = document.createElement("div");
      row.className = "chipRow";
      cand.slice(0,4).forEach(n=>{
        const b = document.createElement("button");
        b.className = "chip";
        b.textContent = yen(n);
        b.onclick = ()=> { input.value = String(n); };
        row.appendChild(b);
      });
      wrap.appendChild(row);
    }

    openModal("合計を編集", wrap).then(ok=>{
      if(!ok) return closeModal(null);
      const prev = draft.total;
      const n = toNumber(input.value);
      if(n>0){
        draft.total = n;
        renderConfirm();
        toast("合計を更新しました", ()=>{
          draft.total = prev;
          renderConfirm();
        });
      }
      closeModal(null);
    });
  }
}

function normalizeDate(s){
  const t = (s||"").trim();
  const m1 = t.match(/^(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if(m1){
    const y = m1[1];
    const mo = String(parseInt(m1[2],10)).padStart(2,"0");
    const da = String(parseInt(m1[3],10)).padStart(2,"0");
    return `${y}-${mo}-${da}`;
  }
  const m2 = t.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
  if(m2){
    const y = new Date().getFullYear();
    const mo = String(parseInt(m2[1],10)).padStart(2,"0");
    const da = String(parseInt(m2[2],10)).padStart(2,"0");
    return `${y}-${mo}-${da}`;
  }
  const m3 = t.match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if(m3) return t;
  return null;
}

function detectTotalCandidates(text){
  const lines = (text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const reMoney = /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,7})\s*円?/;
  const cand = [];
  for(const l of lines){
    if(/合計|TOTAL|お買上|ご利用金額|支払|お支払い/i.test(l)){
      const m = l.match(reMoney);
      if(m) cand.push(toNumber(m[1]));
    }
  }
  // fallback: top 3 largest
  const all = [];
  for(const l of lines){
    const m = l.match(reMoney);
    if(m) all.push(toNumber(m[1]));
  }
  all.sort((a,b)=>b-a);
  const merged = [...new Set([...cand, ...all.slice(0,3)])].filter(n=>n>0);
  return merged;
}

// ---------- Item editing ----------
function addItem(){
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "10px";
  const name = document.createElement("input");
  name.className = "input";
  name.placeholder = "品目名（例：Tシャツ）";
  const price = document.createElement("input");
  price.className = "input";
  price.inputMode = "numeric";
  price.placeholder = "金額（円）";
  wrap.appendChild(name);
  wrap.appendChild(price);

  openModal("品目を追加", wrap).then(ok=>{
    if(!ok) return closeModal(null);
    const n = (name.value||"").trim();
    const p = toNumber(price.value);
    if(n && p>0){
      currentReceiptDraft.items.push({ name:n, price:p, categoryKey: currentReceiptDraft.categoryKey || "uncat" });
      // recompute total if missing
      if(!currentReceiptDraft.total){
        currentReceiptDraft.total = currentReceiptDraft.items.reduce((s,it)=>s+(it.price||0),0);
      }
      renderConfirm();
      toast("品目を追加しました");
    }
    closeModal(null);
  });
}

function reparseFromText(){
  const t = (currentReceiptDraft && currentReceiptDraft.sourceText) ? currentReceiptDraft.sourceText : el("ocrText").value;
  const parsed = parseReceiptText(t);
  const prevItems = currentReceiptDraft.items;
  currentReceiptDraft.store = parsed.store || currentReceiptDraft.store;
  currentReceiptDraft.date = parsed.date || currentReceiptDraft.date;
  if(parsed.total) currentReceiptDraft.total = parsed.total;
  // replace items (keep categoryKey if same name+price exists)
  const map = new Map(prevItems.map(it=>[it.name+"|"+it.price, it.categoryKey]));
  currentReceiptDraft.items = parsed.items.map(it=>({
    ...it,
    categoryKey: map.get(it.name+"|"+it.price) || currentReceiptDraft.categoryKey || "uncat"
  }));
  currentReceiptDraft.sourceText = t;
  renderConfirm();
  toast("再解析しました");
}

// ---------- Export ----------
function exportCSV(){
  const db = loadDB();
  const rows = [["date","store","category","total","items_count"]];
  db.receipts.forEach(r=>{
    rows.push([r.date||"", (r.store||"").replaceAll(",", " "), labelOf(r.categoryKey||"uncat"), String(r.total||0), String((r.items||[]).length)]);
  });
  const csv = rows.map(r=>r.map(x => `"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt_book_${nowYMD()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Events ----------
el("btnBack").addEventListener("click", ()=> popPage());
el("btnSettings").addEventListener("click", ()=> openSettings());

el("fileInput").addEventListener("change", async (e)=>{
  dbg("fileInput change fired");
  const file = e.target.files && e.target.files[0];
  if(!file){ dbg("no file"); return; }
  dbg(`file: ${file.name || "(no name)"} ${file.type} ${file.size}`);
  _lastPickedFileMeta = { name:file.name, type:file.type, size:file.size };

  // Revoke previous object URL to avoid memory leak
  try{
    if(_currentObjectUrl) URL.revokeObjectURL(_currentObjectUrl);
  }catch(e){}
  _currentObjectUrl = URL.createObjectURL(file);

  // 1) Show preview ASAP (no canvas, less memory)
  try{
    Promise.resolve().then(()=>setCapturePreviewFromDataUrl(_currentObjectUrl));
  }catch(err){
    console.error(err);
  }

  // 2) Keep the image source for OCR (objectURL is fine)
  captureImageDataUrl = _currentObjectUrl;
  dumpState('after-pick');
  // AUTO_OCR: start OCR automatically so it never stays at '待機中'
  try{
    setOcrStatus('画像選択完了 → 自動でOCRを開始します');
    const btnRun = el('btnRunOcr');
    if(btnRun){
      btnRun.disabled = false;
      setTimeout(()=>{ try{ dbg('AUTO_OCR: click btnRunOcr'); btnRun.click(); }catch(e){} }, 350);
    }
  }catch(e){}


  // 3) Create a small thumbnail for records (best effort)
  let thumb = null;
  try{
    thumb = await fileToDataUrl(file, 700);
  }catch(err){
    console.warn("thumbnail failed", err);
  }
  // Start as empty draft with image; user can paste text too
  createDraftEmpty(thumb);
  try{ e.target.value = ""; }catch(e){}
});

el("btnParseText").addEventListener("click", ()=>{
  const t = el("ocrText").value.trim();
  if(!t){
    toast("OCRテキストが空です。サンプルを使うか貼り付けてください。");
    return;
  }
  createDraftFromText(t, null);
});

el("btnClearText").addEventListener("click", ()=>{
  el("ocrText").value = "";
});

el("btnUseSample").addEventListener("click", ()=>{
  const sample = SAMPLE_TEXT();
  el("ocrText").value = sample;
  createDraftFromText(sample, null);
});

el("btnRunOcr").addEventListener("click", async ()=>{
  dbg("btnRunOcr click");
  dumpState('before-ocr');

  try{
    if(!captureImageDataUrl){
      toast("先に画像を選択してください。");
      return;
    }
    const lang = el("ocrLang") ? el("ocrLang").value : "jpn+eng";
    el("btnRunOcr").disabled = true;
    if(el("btnCancelOcr")) el("btnCancelOcr").disabled = false;
    setOcrStatus("OCR準備中…");
    setOcrDiag("実行中");
    const text = await runOcrFromImage(captureImageDataUrl, lang);
    el("ocrText").value = (text || "").trim();
    el("btnRunOcr").disabled = false;
    if(el("btnCancelOcr")) el("btnCancelOcr").disabled = true;
    if(!(text || "").trim()){
      toast("OCR結果が空でした。撮影条件（影/傾き/距離）を見直すか、言語を英語にして試してください。");
    }
  }catch(err){
    el("btnRunOcr").disabled = false;
    if(el("btnCancelOcr")) el("btnCancelOcr").disabled = true;
    setOcrStatus("OCRエラー");
    setOcrDiag((err && err.message) ? err.message : "unknown error");
    toast("OCRに失敗しました。①http(s)で開く ②別回線で試す ③言語を英語で試す（日本語は重い）④tessdata取得がブロックされている可能性");
    console.error(err);
  }
});

el("btnCancelOcr").addEventListener("click", async ()=>{
  try{
    if(_ocrWorker){
      setOcrStatus("OCRを中断しました");
      setOcrDiag("中断");
      try{ await _ocrWorker.terminate(); }catch(e){}
      _ocrWorker = null;
      _ocrWorkerLang = null;
    }
    if(el("btnCancelOcr")) el("btnCancelOcr").disabled = true;
    if(el("btnRunOcr")) el("btnRunOcr").disabled = false;
    if(el("btnCancelOcr")) el("btnCancelOcr").disabled = true;
  }catch(e){
    console.error(e);
  }
});


try{
  const b1 = el("btnSwRecheck");
  if(b1) b1.addEventListener("click", ()=>(typeof swCheckStatus==="function"?swCheckStatus():void 0));
  const b2 = el("btnSwReset");
  if(b2) b2.addEventListener("click", ()=>(typeof swReset==="function"?swReset():void 0));
}catch(e){}
setTimeout(()=>(typeof swCheckStatus==="function"?swCheckStatus():void 0), 600);

navigator.serviceWorker && navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener("controllerchange", ()=>{
  dbg("sw: controllerchange");
  (typeof swCheckStatus==="function"?swCheckStatus():void 0);
});


el("summaryCard").addEventListener("click", (e)=>{
  const b = e.target.closest("[data-edit]");
  if(!b) return;
  editField(b.dataset.edit);
});

el("btnDiscard").addEventListener("click", ()=> discardDraft());
el("btnSave").addEventListener("click", ()=> saveDraft());
el("btnAddItem").addEventListener("click", ()=> addItem());
el("btnReparse").addEventListener("click", ()=> reparseFromText());

el("toastUndo").addEventListener("click", ()=>{
  if(lastUndo) lastUndo();
  closeToast();
});

document.querySelectorAll("[data-range]").forEach(b=>{
  b.addEventListener("click", ()=>{
    listState.range = b.dataset.range;
    renderList();
  });
});
document.querySelectorAll("[data-sort]").forEach(b=>{
  b.addEventListener("click", ()=>{
    const k = b.dataset.sort;
    if(listState.sort.key === k){
      listState.sort.dir = listState.sort.dir==="asc" ? "desc" : "asc";
    }else{
      listState.sort.key = k;
      listState.sort.dir = (k==="date") ? "desc" : "asc";
    }
    renderList();
  });
});
el("filterCategory").addEventListener("change", (e)=>{
  listState.filterCat = e.target.value;
  renderList();
});

el("btnExport").addEventListener("click", ()=> exportCSV());
el("btnNew").addEventListener("click", ()=> gotoCapture());

el("btnResetLearning").addEventListener("click", ()=>{
  const db = loadDB();
  db.learning = {};
  saveDB(db);
  toast("学習をリセットしました");
});
el("btnDeleteAll").addEventListener("click", ()=>{
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("rb_recentCats");
  toast("全データ削除しました");
  gotoCapture();
});

// ---------- Helpers ----------
async function fileToDataUrl(file, maxSize=900){
  // Downscale for storage/preview thumbnails (OCR can use objectURL)
  let bmp = null;
  try{
    if("createImageBitmap" in window){
      bmp = await createImageBitmap(file);
    }
  }catch(e){
    bmp = null;
  }

  let w, h, drawSrc;
  if(bmp){
    w = bmp.width; h = bmp.height; drawSrc = bmp;
  }else{
    const img = await loadImage(URL.createObjectURL(file));
    w = img.width; h = img.height; drawSrc = img;
  }

  const fit = fitContain(w, h, maxSize, maxSize);
  const canvas = document.createElement("canvas");
  canvas.width = fit.w; canvas.height = fit.h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(drawSrc, 0, 0, fit.w, fit.h);

  // cleanup
  try{ if(drawSrc && drawSrc.src && String(drawSrc.src).startsWith("blob:")) URL.revokeObjectURL(drawSrc.src); }catch(e){}
  try{ if(bmp && bmp.close) bmp.close(); }catch(e){}

  return canvas.toDataURL("image/jpeg", 0.82);
}


function loadImage(src){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitContain(sw, sh, mw, mh){
  const r = Math.min(mw/sw, mh/sh, 1);
  return { w: Math.round(sw*r), h: Math.round(sh*r) };
}

function SAMPLE_TEXT(){
  // A simple Japanese-like receipt text for parsing demo
  return [
    "大衆酒場 まるまる",
    "2026/01/31 19:48",
    "生ビール  550",
    "ハイボール  480",
    "枝豆  380",
    "焼鳥盛合せ  980",
    "小計  2,390",
    "合計  2,629",
    "（内税） 239"
  ].join("\n");
}

// init
(function init(){
  showPage("capture");
  dbg("init: binding listeners");

try{
  const pickBtn = el("btnPickImage");
  const fi = el("fileInput");
  if(pickBtn && fi){
    pickBtn.addEventListener("click", ()=>{
      dbg("btnPickImage click");
      try{ fi.click(); }catch(e){ dbg("fileInput.click failed: " + (e.message||String(e))); }
    });
  }
}catch(e){}

  try{ const btn = el("btnRunOcr"); if(btn) btn.disabled = true; }catch(e){}
  setOcrStatus("待機中：まず「写真を撮る / 選ぶ」で画像を選択してください");
  // open list if existing
  const db = loadDB();
  if((db.receipts||[]).length){
    navStack = ["list"];
    showPage("list");
    renderList();
  }
})();


/* cameraFixWatchdog: if programmatic click is blocked, native overlay input should still work */
(function(){
  const btn = document.getElementById("btnPickImage");
  const fi = document.getElementById("fileInput");
  if(!btn || !fi) return;
  btn.addEventListener("click", ()=>{
    const t0 = Date.now();
    // If overlay input didn't receive tap (rare), attempt programmatic click
    try{ fi.click(); }catch(e){}
    setTimeout(()=>{
      // If no file selected and no focus, give hint
      if(!(fi.files && fi.files.length)){
        try{
          setOcrStatus("カメラが開かない場合：ブラウザの権限/別アプリのカメラ使用中/PCではファイル選択になります");
        }catch(e){}
      }
    }, 800);
  });
})();

