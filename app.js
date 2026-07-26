(() => {
  // src/core/device.js
  function getDeviceTypeString() {
    const ua = typeof navigator !== "undefined" && navigator.userAgent || "";
    let os = "M\xE1y t\xEDnh";
    if (/iPhone|iPad|iPod/i.test(ua)) os = "\u{1F4F1} iOS";
    else if (/Android/i.test(ua)) os = "\u{1F4F1} Android";
    else if (/Macintosh|Mac OS X/i.test(ua)) os = "\u{1F4BB} Mac";
    else if (/Windows/i.test(ua)) os = "\u{1F4BB} Windows";
    else if (/Linux/i.test(ua)) os = "\u{1F4BB} Linux";
    let browser = "";
    if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = "Safari";
    else if (/Firefox|FxMo/i.test(ua)) browser = "Firefox";
    else if (/Edge|Edg/i.test(ua)) browser = "Edge";
    return browser ? `${os} \xB7 ${browser}` : os;
  }

  // src/student/subjects.js
  var SUBJECT_STORE = "learninghub_subject_code_merged_v1";
  function getSubjectCode() {
    return localStorage.getItem(SUBJECT_STORE) || "";
  }
  function syncUserSubjectToProfile(code, supabaseUser) {
    if (!supabaseUser) return;
    try {
      const md = supabaseUser.user_metadata || {};
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: md.full_name || md.name || "",
          avatar_url: md.avatar_url || md.picture || "",
          current_subject: code || getSubjectCode() || "",
          device_info: getDeviceTypeString()
        })
      }).catch((e) => console.warn("syncUserSubjectToProfile failed:", e));
    } catch (e) {
    }
  }
  function setSubject(code, supabaseUser) {
    if (code) {
      localStorage.setItem(SUBJECT_STORE, code);
    } else {
      localStorage.removeItem(SUBJECT_STORE);
    }
    syncUserSubjectToProfile(code, supabaseUser);
  }

  // src/student/api.js
  async function fetchApi(endpoint, options = {}) {
    const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json"
    };
    try {
      const session = window.HODSupabase?.getSession?.();
      if (session?.access_token) {
        defaultHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }
    } catch (e) {
    }
    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers || {}
      }
    };
    const response = await fetch(url, mergedOptions);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }
  async function fetchSubjects() {
    return fetchApi("/subjects?ts=" + Date.now(), { cache: "no-store" });
  }
  async function fetchQuestions(subjectCode) {
    return fetchApi(`/questions?subject_code=${encodeURIComponent(subjectCode)}&ts=${Date.now()}`, { cache: "no-store" });
  }

  // src/student/search.js
  function filterQuestions(questions, query = "", riskFilter = "all") {
    if (!Array.isArray(questions)) return [];
    const q = String(query || "").trim().toLowerCase();
    return questions.filter((item) => {
      if (riskFilter !== "all") {
        const risk = String(item.error_risk || "low").toLowerCase();
        if (risk !== riskFilter) return false;
      }
      if (!q) return true;
      if (q.startsWith("#")) {
        const numStr = q.slice(1);
        if (String(item.num) === numStr) return true;
      }
      const text = `${item.num || ""} ${item.question || ""} ${item.answer || ""} ${item.answer_text || ""} ${Object.values(item.options || {}).join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }

  // src/student/flashcards.js
  function shuffleQuestions(array) {
    const list = [...array || []];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function formatFlashcardFront(questionItem) {
    if (!questionItem) return "";
    return {
      num: questionItem.num,
      question: questionItem.question || "",
      options: questionItem.options || {},
      hasImages: Array.isArray(questionItem.images) && questionItem.images.length > 0
    };
  }
  function formatFlashcardBack(questionItem) {
    if (!questionItem) return "";
    const answer = String(questionItem.answer || "").trim();
    const options = questionItem.options || {};
    const optionText = options[answer] || "";
    const fullAnswerText = questionItem.answer_text || (optionText ? `${answer}. ${optionText}` : answer);
    return {
      answer,
      fullAnswerText
    };
  }

  // src/student/appCore.js
  if (location.hash && location.hash.includes("&amp;")) {
    history.replaceState(null, "", location.href.replace(/&amp;/g, "&"));
  }
  window.APP_CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: "https://kxyukiwhhorvxgxxxmfq.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f",
    LOGIN_NOTIFY_ENDPOINT: "https://kxyukiwhhorvxgxxxmfq.supabase.co/functions/v1/login-notify",
    CLOUDINARY_CLOUD_NAME: "ddc4uvm7m",
    CLOUDINARY_UPLOAD_PRESET: "learninghub_unsigned",
    CLOUDINARY_UPLOAD_FOLDER: "learninghub/questions",
    CLOUDINARY_UPLOAD_URL: "https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload"
  };
  (function() {
    const nativeSetInterval = window.setInterval;
    window.setInterval = function(fn, delay, ...args) {
      if (typeof fn !== "function") return nativeSetInterval(fn, delay, ...args);
      function wrapped() {
        if (document.hidden) return;
        return fn.apply(this, arguments);
      }
      return nativeSetInterval(wrapped, delay, ...args);
    };
  })();
  (function() {
    const KEY = "learninghub_subject_code_merged_v1";
    const nativeGet = Storage.prototype.getItem;
    const nativeSet = Storage.prototype.setItem;
    const nativeRemove = Storage.prototype.removeItem;
    Storage.prototype.getItem = function(key) {
      if (this === window.localStorage && key === KEY) {
        const tabVal = nativeGet.call(window.sessionStorage, KEY);
        if (tabVal !== null) return tabVal;
        return nativeGet.call(window.localStorage, KEY);
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function(key, value) {
      if (this === window.localStorage && key === KEY) {
        nativeSet.call(window.sessionStorage, KEY, value);
      }
      return nativeSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function(key) {
      if (this === window.localStorage && key === KEY) {
        nativeRemove.call(window.sessionStorage, KEY);
      }
      return nativeRemove.call(this, key);
    };
  })();
  (function() {
    if (window.__APP_API_DEDUPE_QUESTIONS_PROFILE_20260630) return;
    window.__APP_API_DEDUPE_QUESTIONS_PROFILE_20260630 = true;
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    const pending = /* @__PURE__ */ new Map();
    const shortCache = /* @__PURE__ */ new Map();
    const QUESTION_TTL = 6e4;
    const PROFILE_TTL = 3e4;
    function methodOf(init2) {
      return String(init2 && init2.method ? init2.method : "GET").toUpperCase();
    }
    function makeKey(input, init2) {
      let url;
      try {
        url = new URL(typeof input === "string" ? input : input.url, location.href);
      } catch (e) {
        return null;
      }
      const method = methodOf(init2);
      const path = url.pathname;
      if (path === "/api/questions" && method === "GET") {
        const subject = url.searchParams.get("subject_code") || "";
        if (!subject) return null;
        return { key: "GET:/api/questions:" + subject, ttl: QUESTION_TTL };
      }
      if (path === "/api/profile" && method === "POST") {
        let uid = "";
        try {
          uid = JSON.parse(String(init2 && init2.body || "{}")).id || "";
        } catch (e) {
        }
        return { key: "POST:/api/profile:" + uid, ttl: PROFILE_TTL };
      }
      return null;
    }
    async function packResponse(res) {
      const body = await res.clone().text();
      return {
        body,
        status: res.status,
        statusText: res.statusText,
        headers: Array.from(res.headers.entries()),
        exp: Date.now()
      };
    }
    function unpack(pack) {
      return new Response(pack.body, {
        status: pack.status,
        statusText: pack.statusText,
        headers: new Headers(pack.headers)
      });
    }
    window.fetch = async function(input, init2) {
      const info = makeKey(input, init2);
      if (!info) return nativeFetch(input, init2);
      const cached = shortCache.get(info.key);
      if (cached && Date.now() - cached.exp < info.ttl) {
        return unpack(cached);
      }
      if (pending.has(info.key)) {
        const pack2 = await pending.get(info.key);
        return unpack(pack2);
      }
      const job = nativeFetch(input, init2).then(async (res) => {
        const pack2 = await packResponse(res);
        shortCache.set(info.key, pack2);
        return pack2;
      }).finally(() => pending.delete(info.key));
      pending.set(info.key, job);
      const pack = await job;
      return unpack(pack);
    };
  })();
  window.HOD_DATA = [];
  (function() {
    var s = document.createElement("script");
    s.type = "application/json";
    s.id = "data";
    s.textContent = "[]";
    document.head.appendChild(s);
  })();
  if (location.protocol === "file:") {
    window.__LOCAL_DEV_MODE = true;
    document.addEventListener("DOMContentLoaded", function() {
      document.getElementById("hodLoginGate")?.classList.add("hidden");
      document.getElementById("hodPendingApproval")?.classList.add("hidden");
      document.body?.classList.remove("hod-locked");
      var sg = document.getElementById("subjectGate");
      if (sg) {
        sg.classList.remove("hidden");
        sg.setAttribute("aria-hidden", "false");
        document.body.classList.add("has-subject-gate");
      }
    });
  }
  (function() {
    if (window.__APP_F5_SUPABASE_CACHE_20260629) return;
    window.__APP_F5_SUPABASE_CACHE_20260629 = true;
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    const PREFIX = "lh_f5_cache:";
    const mem = /* @__PURE__ */ new Map();
    const pending = /* @__PURE__ */ new Map();
    const MAX_BODY = 900 * 1024;
    const profilePatchLast = /* @__PURE__ */ new Map();
    function methodOf(init2) {
      return String(init2 && init2.method ? init2.method : "GET").toUpperCase();
    }
    function isSupabaseRest(url) {
      return /\/rest\/v1\//.test(url.pathname);
    }
    function isCacheablePath(path) {
      return /\/(questions|subjects|profiles|site_settings)\b/.test(path);
    }
    function ttlFor(url) {
      const p = url.pathname;
      const q = url.search || "";
      if (/\/questions\b/.test(p)) return 10 * 60 * 1e3;
      if (/\/subjects\b/.test(p)) return 10 * 60 * 1e3;
      if (/\/profiles\b/.test(p) && /id=eq\./.test(q)) return 10 * 60 * 1e3;
      if (/\/site_settings\b/.test(p)) return 10 * 60 * 1e3;
      return 0;
    }
    function keyOf(url) {
      return url.origin + url.pathname + url.search;
    }
    function headersObj(headers) {
      const o = { "x-learninghub-cache": "1" };
      try {
        headers.forEach((v, k) => {
          if (k.toLowerCase() !== "content-length") o[k] = v;
        });
      } catch (e) {
      }
      return o;
    }
    function makeResponse(entry) {
      return new Response(entry.body, { status: entry.status || 200, statusText: entry.statusText || "OK", headers: entry.headers || { "x-learninghub-cache": "1" } });
    }
    function readStore(key) {
      try {
        const raw = sessionStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const e = JSON.parse(raw);
        if (!e || !e.exp || Date.now() > e.exp) return null;
        return e;
      } catch (err) {
        return null;
      }
    }
    function writeStore(key, entry) {
      try {
        sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
      } catch (err) {
      }
    }
    async function saveFromResponse(key, ttl, res) {
      try {
        const txt = await res.clone().text();
        if (txt.length > MAX_BODY) return;
        const entry = { body: txt, status: res.status, statusText: res.statusText, headers: headersObj(res.headers), exp: Date.now() + ttl };
        mem.set(key, entry);
        writeStore(key, entry);
      } catch (err) {
      }
    }
    function matchKind(text, kind) {
      if (!kind || kind === "all") return true;
      if (kind === "questions") return text.includes("/questions");
      if (kind === "subjects") return text.includes("/subjects");
      if (kind === "profiles") return text.includes("/profiles");
      return text.includes("/" + kind);
    }
    function clearCache(kind) {
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith(PREFIX) && matchKind(k, kind)) sessionStorage.removeItem(k);
        });
        Array.from(mem.keys()).forEach((k) => {
          if (matchKind(k, kind)) mem.delete(k);
        });
        Array.from(pending.keys()).forEach((k) => {
          if (matchKind(k, kind)) pending.delete(k);
        });
        window.__LH_LAST_CACHE_CLEAR = { kind: kind || "all", at: Date.now() };
      } catch (e) {
      }
    }
    function shouldSkipProfilePatch(url, init2) {
      const method = methodOf(init2);
      if (method !== "PATCH" && method !== "PUT") return false;
      if (!/\/profiles\b/.test(url.pathname)) return false;
      const body = String(init2 && init2.body ? init2.body : "");
      if (!/last_activity|last_login|avatar_url|email/.test(body)) return false;
      if (/last_login/.test(body)) return false;
      if (/role|approved|blocked|is_blocked|status/.test(body)) return false;
      const key = keyOf(url) + "|" + body.replace(/"last_activity"\s*:\s*"[^"]+"/g, '"last_activity":"TIME"');
      const last = profilePatchLast.get(key) || 0;
      if (Date.now() - last < 5 * 60 * 1e3) return true;
      profilePatchLast.set(key, Date.now());
      return false;
    }
    window.clearLearningHubQuestionCache = function() {
      clearCache("questions");
    };
    window.clearLearningHubSupabaseCache = clearCache;
    window.fetch = async function(input, init2) {
      let url;
      try {
        url = new URL(typeof input === "string" ? input : input.url, location.href);
      } catch (e) {
        return nativeFetch(input, init2);
      }
      if (isSupabaseRest(url) && shouldSkipProfilePatch(url, init2)) {
        return new Response(null, { status: 204, statusText: "No Content", headers: { "x-learninghub-skip": "profile-patch-duplicate" } });
      }
      if (methodOf(init2) !== "GET" || !isSupabaseRest(url) || !isCacheablePath(url.pathname)) return nativeFetch(input, init2);
      const ttl = ttlFor(url);
      if (!ttl) return nativeFetch(input, init2);
      const key = keyOf(url);
      const m = mem.get(key);
      if (m && Date.now() <= m.exp) return makeResponse(m);
      const s = readStore(key);
      if (s) {
        mem.set(key, s);
        return makeResponse(s);
      }
      if (pending.has(key)) {
        const entry = await pending.get(key).catch(() => null);
        if (entry) return makeResponse(entry);
      }
      const network = nativeFetch(input, init2).then(async (res) => {
        if (res && res.ok) await saveFromResponse(key, ttl, res);
        return res;
      }).finally(() => pending.delete(key));
      pending.set(key, network.then(() => mem.get(key) || null));
      return network;
    };
  })();
  var dataEl = document.getElementById("data");
  var BASE = [];
  var STORE = "hod102_user_edits_v1";
  var edits = {};
  try {
    edits = JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch (e) {
  }
  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  function notify(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.remove("hidden");
    t.classList.add("show");
    clearTimeout(t._tid);
    t._tid = setTimeout(() => {
      t.classList.add("hidden");
      t.classList.remove("show");
    }, 2200);
  }
  function showProgress(title, current, total, detail = "") {
    let el = document.getElementById("adminProgressOverlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "adminProgressOverlay";
      el.className = "adminProgressOverlay hidden";
      el.innerHTML = `
      <div class="adminProgressBox">
        <h3 id="adminProgressTitle">\u0110ang x\u1EED l\xFD...</h3>
        <div class="adminProgressTrack">
          <div id="adminProgressBar" class="adminProgressBar"></div>
        </div>
        <div class="adminProgressSub">
          <span id="adminProgressPercent" class="adminProgressPercent">0% (0/0)</span>
          <span id="adminProgressDetail" class="adminProgressDetail"></span>
        </div>
      </div>
    `;
      document.body.appendChild(el);
    }
    const pct = total > 0 ? Math.round(current / total * 100) : 0;
    document.getElementById("adminProgressTitle").textContent = title;
    document.getElementById("adminProgressBar").style.width = pct + "%";
    document.getElementById("adminProgressPercent").textContent = pct + "% (" + current + "/" + total + ")";
    document.getElementById("adminProgressDetail").textContent = detail;
    el.classList.remove("hidden");
  }
  function hideProgress() {
    const el = document.getElementById("adminProgressOverlay");
    if (el) el.classList.add("hidden");
  }
  var RAW = [];
  var pool = [];
  var ci = Math.max(0, Math.min(+localStorage.getItem("hod102_ci") || 0, BASE.length - 1));
  var flipped = false;
  var flipDir = "horizontal";
  var cardFontSize = localStorage.getItem("hod102_card_font_size_v3") || "1";
  var flipMode = localStorage.getItem("hod102_flip_mode") || "single";
  var hideOptions = false;
  var randomActive = localStorage.getItem("hod102_random_active") === "1";
  var qCnt = 20;
  var qSet = [];
  var qDone = {};
  var qSel = {};
  var quizMode = "practice";
  var examSubmitted = false;
  var editDraft = null;
  function rebuild() {
    RAW = BASE.map((c) => Object.assign(clone(c), edits[c.num] || {}));
    pool = pool.length ? pool.map((o) => RAW.find((c) => c.num === o.num) || o) : [...RAW];
  }
  rebuild();
  var $ = (id) => document.getElementById(id);
  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }
  function sortAns(s) {
    return (s || "").split("").sort().join("");
  }
  function answerText(c) {
    return (c.answer || "").split("").map((ch) => ch + ". " + (c.options?.[ch] || "")).join("; ");
  }
  function finalAnswerText(c) {
    const raw = String(c?.answer_text ?? "").trim();
    const ans = String(c?.answer ?? "").trim().toUpperCase();
    if (!raw || raw.toUpperCase() === ans || /^[A-E]+$/i.test(raw)) return answerText(c);
    return raw;
  }
  function optionsHTML(c) {
    return Object.entries(c.options || {}).map(([k, v]) => `<div class="opt"><div class="letter">${k}</div><div class="ot">${esc(v)}</div></div>`).join("");
  }
  function imgsHTML(c) {
    return (c.images || []).map((im) => `<img src="${esc(im.src)}" alt="" loading="lazy" decoding="async">`).join("");
  }
  function setv(k, v) {
    document.documentElement.style.setProperty(k, v);
  }
  function fit(c) {
    setv("--qfs", "1.08rem");
    setv("--ofs", ".92rem");
    setv("--qlh", "1.32");
    setv("--olh", "1.36");
    setv("--afs", "1rem");
    setv("--imgmax", c.images && c.images.length ? "380px" : "0px");
    setv("--imgcol", c.images && c.images.length ? "620px" : "0px");
    setv("--frontpad", "14px 18px");
    setv("--optgap", "6px");
    setv("--optpad", "7px 10px");
    setv("--qmb", "8px");
    setv("--imgmb", "7px");
    setv("--tagmb", "6px");
    setv("--letter", "25px");
    setv("--letterfs", ".76rem");
    setv("--tagfs", ".62rem");
    setv("--tagpad", "3px 10px");
    setv("--ogap", "8px");
  }
  function renderCard() {
    let c = pool[ci] || RAW[0];
    if (!c) return;
    fit(c);
    applyCardFontSize();
    $("idx").textContent = ci + 1;
    $("total").textContent = pool.length;
    $("bar").style.width = (ci + 1) / pool.length * 100 + "%";
    $("tag").textContent = "C\xC2U " + c.num;
    $("question").textContent = c.question;
    const __imgEl = $("images");
    const __imgKey = JSON.stringify((c.images || []).map((im) => String((im && typeof im === "object" ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url : im) || "")));
    if (__imgEl.dataset.imgKey !== __imgKey) {
      __imgEl.innerHTML = imgsHTML(c);
      __imgEl.dataset.imgKey = __imgKey;
    }
    __imgEl.style.display = c.images && c.images.length ? "flex" : "none";
    document.querySelector("#fc .front")?.classList.toggle("hasImg", !!(c.images && c.images.length));
    $("options").innerHTML = optionsHTML(c);
    $("options").classList.remove("hide");
    hideOptions = false;
    applyCardFontSize();
    updateCardTools();
    $("ansLetter").textContent = (c.answer || "").split("").join(", ");
    $("ansText").innerHTML = esc(c.answer_text || answerText(c)).replace(/; /g, "<br>");
    $("card").classList.remove("dir-horizontal", "dir-up", "dir-down");
    $("card").classList.add("dir-" + flipDir);
    $("card").classList.toggle("flip", flipped);
    $("mode").textContent = flipMode === "single" ? "1x" : "2x";
    var _sc = localStorage.getItem("learninghub_subject_code_merged_v1") || "";
    localStorage.setItem("hod102_ci", ci);
    if (_sc) localStorage.setItem("learninghub_progress_" + _sc, ci);
    localStorage.setItem("hod102_flip_mode", flipMode);
  }
  function flip(dir = "horizontal") {
    flipDir = dir;
    flipped = !flipped;
    renderCard();
  }
  function next() {
    ci = (ci + 1) % pool.length;
    flipped = false;
    flipDir = "horizontal";
    renderCard();
  }
  function prev() {
    ci = (ci - 1 + pool.length) % pool.length;
    flipped = false;
    flipDir = "horizontal";
    renderCard();
  }
  function shuffle() {
    for (let i = pool.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    ci = 0;
    flipped = false;
    flipDir = "horizontal";
    randomActive = false;
    localStorage.setItem("hod102_random_active", "0");
    renderCard();
    let sh = $("shuffle");
    if (sh) {
      sh.classList.add("flash");
      setTimeout(() => sh.classList.remove("flash"), 650);
    }
  }
  var __allowUserReset = false;
  function reset(force) {
    if (force !== true && __allowUserReset !== true) {
      try {
        renderCard();
      } catch (e) {
      }
      return;
    }
    __allowUserReset = false;
    pool = [...RAW];
    ci = 0;
    flipped = false;
    flipDir = "horizontal";
    randomActive = false;
    localStorage.setItem("hod102_random_active", "0");
    renderCard();
  }
  function triggerReset() {
    __allowUserReset = true;
    reset(true);
  }
  function switchTab(n, b) {
    try {
      localStorage.setItem("learninghub_last_tab_v1", n);
    } catch (e) {
    }
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
    if (b) b.classList.add("active");
    document.querySelectorAll(".pane").forEach((x) => x.classList.remove("active"));
    const targetPane = $(n);
    if (targetPane) targetPane.classList.add("active");
    const portal = document.getElementById("kizspyExamPortal");
    if (n !== "quiz") {
      document.body.classList.remove("kizspy-active");
      if (portal) portal.remove();
    }
    if (n === "study") renderStudy();
    if (n === "quiz") try {
      renderQuiz();
    } catch (e) {
    }
    if (typeof window.fixCounter === "function") window.fixCounter();
  }
  function sample(a, n) {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return n ? a.slice(0, n) : a;
  }
  function fmt(ms) {
    let s = Math.floor(ms / 1e3), m = Math.floor(s / 60);
    s %= 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function syncQuizSet() {
    if (qSet && qSet.length) {
      qSet = qSet.map((c) => RAW.find((x) => x.num === c.num) || c);
    }
  }
  function renderQuiz() {
    if (typeof window.__examOnlyRender === "function") return window.__examOnlyRender();
    const body = $("quizBody");
    if (body) body.innerHTML = "";
  }
  function smart(q) {
    q = q.trim().toLowerCase();
    if (!q) return RAW;
    let m = q.match(/^#(\d+)$/);
    if (m) return RAW.filter((c) => c.num === +m[1]);
    m = q.match(/^answer\s*:\s*([a-e]+)$/i);
    if (m) return RAW.filter((c) => sortAns(c.answer) === sortAns(m[1].toUpperCase()));
    if (["multi", "multiple", "ch\u1ECDn nhi\u1EC1u"].includes(q)) return RAW.filter((c) => c.answer.length > 1);
    return RAW.filter((c) => (String(c.num) + " " + c.question + " " + c.answer + " " + (c.answer_text || "") + " " + Object.values(c.options).join(" ")).toLowerCase().includes(q));
  }
  function renderStudy() {
    let arr = smart($("search").value || ""), max = arr.length;
    $("studyList").innerHTML = arr.slice(0, max).map((c) => `<div class="sitem"><div class="snum">C\xC2U ${c.num}</div><div class="sq">${esc(c.question)}</div><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${Object.entries(c.options).map(([k, v]) => `<div class="sopt ${c.answer.includes(k) ? "ans" : ""}"><div class="skey">${c.answer.includes(k) ? "\u2713" : k}</div><div>${esc(k + ". " + v)}</div></div>`).join("")}</div></div>`).join("") + (arr.length > max ? `<div class="more">\u0110ang hi\u1EC3n th\u1ECB ${max} / ${arr.length} k\u1EBFt qu\u1EA3.</div>` : arr.length ? "" : '<div class="more">Kh\xF4ng t\xECm th\u1EA5y k\u1EBFt qu\u1EA3.</div>');
  }
  function openEditor() {
    let c = pool[ci];
    editDraft = clone(c);
    let reporting = !!window.HODSupabase?.getUser?.() && !window.HODSupabase?.isAdmin?.();
    $("editTitle").textContent = (reporting ? "B\xE1o c\xE1o / \u0111\u1EC1 xu\u1EA5t s\u1EEDa c\xE2u " : "S\u1EEDa c\xE2u ") + c.num;
    if ($("saveEdit")) $("saveEdit").textContent = reporting ? "G\u1EEDi b\xE1o c\xE1o cho admin" : "L\u01B0u s\u1EEDa";
    if ($("restoreEdit")) $("restoreEdit").classList.toggle("hidden", reporting);
    $("editQuestion").value = c.question;
    $("editAnswer").value = c.answer;
    renderEditOptions();
    renderEditImages();
    $("editModal").classList.remove("hidden");
  }
  function renderEditOptions() {
    let ops = editDraft.options || {};
    let box = $("editOptions");
    if (!box) return;
    box.innerHTML = ["A", "B", "C", "D", "E"].map((k) => `<div class="field"><label>\u0110\xE1p \xE1n ${k}</label><textarea data-opt="${k}">${esc(ops[k] || "")}</textarea></div>`).join("");
  }
  function renderEditImages() {
    let box = $("editImgs");
    if (!box) {
      const input = $("imgUpload");
      if (!input) return;
      box = document.createElement("div");
      box.id = "editImgs";
      box.className = "editImgs";
      input.insertAdjacentElement("afterend", box);
    }
    box.innerHTML = (editDraft.images || []).map((im, i) => {
      const src = im && typeof im === "object" ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "" : im;
      return `<div class="editImg"><button class="rm" data-rm="${i}">\xD7</button><img src="${esc(src)}" loading="lazy" decoding="async"><input class="imgUrlBox" value="${esc(src)}" readonly onclick="this.select()" title="B\u1EA5m \u0111\u1EC3 ch\u1ECDn URL \u1EA3nh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`;
    }).join("") || '<p style="color:var(--mist)">Ch\u01B0a c\xF3 h\xECnh.</p>';
  }
  function saveEditor() {
    let oldQ = clone(RAW.find((c) => c.num === editDraft.num) || pool[ci] || editDraft);
    editDraft.question = $("editQuestion").value.trim();
    editDraft.answer = $("editAnswer").value.trim().toUpperCase();
    let ops = {};
    document.querySelectorAll("[data-opt]").forEach((t) => {
      if (t.value.trim()) ops[t.dataset.opt] = t.value.trim();
    });
    editDraft.options = ops;
    editDraft.answer_text = answerText(editDraft);
    if (window.HODSupabase && window.HODSupabase.isReady()) {
      window.HODSupabase.submitEditRequest(editDraft, oldQ);
      return;
    }
    if (window.HODSupabase?.getUser?.()) {
      alert("Ch\u01B0a k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u duy\u1EC7t. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i g\u1EEDi l\u1EA1i b\xE1o c\xE1o.");
      return;
    }
    edits[editDraft.num] = { question: editDraft.question, options: editDraft.options, answer: editDraft.answer, answer_text: editDraft.answer_text, images: editDraft.images || [] };
    localStorage.setItem(STORE, JSON.stringify(edits));
    rebuild();
    ci = pool.findIndex((c) => c.num === editDraft.num);
    if (ci < 0) ci = 0;
    flipped = false;
    renderCard();
    renderQuiz();
    renderStudy();
    $("editModal").classList.add("hidden");
    notify("\u0110\xE3 l\u01B0u s\u1EEDa local");
  }
  function restoreEditor() {
    delete edits[editDraft.num];
    localStorage.setItem(STORE, JSON.stringify(edits));
    rebuild();
    syncQuizSet();
    renderCard();
    renderQuiz();
    renderStudy();
    $("editModal").classList.add("hidden");
    notify("\u0110\xE3 kh\xF4i ph\u1EE5c");
  }
  function exportEdits() {
    let blob = new Blob([JSON.stringify(edits, null, 2)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hod102_user_edits.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importEditsFile(f) {
    let fr = new FileReader();
    fr.onload = () => {
      try {
        edits = JSON.parse(fr.result) || {};
        localStorage.setItem(STORE, JSON.stringify(edits));
        rebuild();
        renderCard();
        renderQuiz();
        renderStudy();
        notify("\u0110\xE3 nh\u1EADp file s\u1EEDa");
      } catch (e) {
        alert("File JSON kh\xF4ng h\u1EE3p l\u1EC7");
      }
    };
    fr.readAsText(f);
  }
  function applyCardFontSize() {
    let n = parseFloat(cardFontSize || "1");
    if (!isFinite(n)) n = 1;
    n = Math.max(0.8, Math.min(1.3, n));
    cardFontSize = String(n);
    let root = document.documentElement, fc = $("fc");
    let set = (k, v) => {
      root.style.setProperty(k, v);
      if (fc) fc.style.setProperty(k, v);
    };
    let base = 1.35 * n;
    set("--card-qfs", (1.08 * base).toFixed(3) + "rem");
    set("--card-ofs", (0.92 * base).toFixed(3) + "rem");
    set("--card-afs", (1 * base).toFixed(3) + "rem");
    set("--card-letter", (25 * Math.min(1.35, base)).toFixed(0) + "px");
    set("--card-letterfs", (0.76 * base).toFixed(3) + "rem");
    localStorage.setItem("hod102_card_font_size_v3", String(n));
    if ($("stCardFont")) $("stCardFont").value = Math.round(n * 100);
    if ($("stCardFontState")) $("stCardFontState").textContent = Math.round(n * 100) + "%";
  }
  function updateCardTools() {
    hideOptions = false;
    try {
      localStorage.removeItem("hod102_hide_options");
    } catch (e) {
    }
    let sh = $("shuffle"), eye = $("toggleOpts");
    if (sh) {
      sh.classList.remove("active");
      sh.title = "X\xE1o ng\u1EABu nhi\xEAn";
    }
    if (eye) eye.remove();
  }
  function setupGlobalHeader() {
    let top = document.querySelector("#fc .top");
    let tabs = document.querySelector(".tabs");
    if (top && !top.classList.contains("globalTop")) {
      top.classList.add("globalTop");
      document.body.insertBefore(top, tabs || document.body.firstChild);
    }
  }
  function setupCardTools() {
    let card = $("card");
    if (!card || $("cardTools")) return;
    let tools = document.createElement("div");
    tools.id = "cardTools";
    tools.className = "cardTools";
    let sh = $("shuffle"), eye = $("toggleOpts"), ed = $("editCard");
    if (eye) eye.remove();
    if (sh) {
      sh.textContent = "\u2682";
      sh.classList.add("cardToolBtn", "diceBtn");
      tools.appendChild(sh);
    }
    tools.addEventListener("click", (e) => e.stopPropagation());
    tools.addEventListener("mousedown", (e) => e.stopPropagation());
    card.insertBefore(tools, ed);
    updateCardTools();
  }
  function updateSettingsUI() {
    if (!$("stFlipState")) return;
    $("stFlipState").textContent = "\u0110ang d\xF9ng: " + (flipMode === "single" ? "1x - b\u1EA5m 1 l\u1EA7n \u0111\u1EC3 l\u1EADt" : "2x - h\u1EA1n ch\u1EBF l\u1EADt nh\u1EA7m");
    if ($("stOptState")) $("stOptState").textContent = "\u0110ang hi\u1EC7n l\u1EF1a ch\u1ECDn";
    if ($("stToggleOpts")) $("stToggleOpts").style.display = "none";
    if ($("stGoInput")) $("stGoInput").value = pool[ci]?.num || "";
    applyCardFontSize();
    updateCardTools();
  }
  function toggleFlipMode() {
    flipMode = flipMode === "single" ? "double" : "single";
    flipped = false;
    renderCard();
    updateSettingsUI();
  }
  function goToQuestionNum() {
    let n = +$("stGoInput").value;
    if (!n) {
      alert("Nh\u1EADp s\u1ED1 c\xE2u tr\u01B0\u1EDBc nha.");
      return;
    }
    let i = pool.findIndex((c) => c.num === n);
    if (i < 0) i = RAW.findIndex((c) => c.num === n);
    if (i < 0) {
      alert("Kh\xF4ng t\xECm th\u1EA5y c\xE2u " + n);
      return;
    }
    if (!pool.find((c) => c.num === n)) pool = [...RAW];
    ci = i;
    flipped = false;
    renderCard();
    updateSettingsUI();
    $("settingsModal").classList.add("hidden");
  }
  function init() {
    setupGlobalHeader();
    document.querySelectorAll(".tab").forEach((btn) => btn.onclick = () => switchTab(btn.dataset.tab, btn));
    $("shuffle").onclick = shuffle;
    $("reset").onclick = () => triggerReset();
    if ($("toggleOpts")) $("toggleOpts").remove();
    try {
      localStorage.removeItem("hod102_hide_options");
    } catch (e) {
    }
    $("openSettings").onclick = () => {
      $("settingsModal").classList.remove("hidden");
      updateSettingsUI();
    };
    $("closeSettings").onclick = () => $("settingsModal").classList.add("hidden");
    document.querySelectorAll(".modal,.overlay").forEach((m) => {
      m.addEventListener("mousedown", (e) => {
        if (e.target === m) m.classList.add("hidden");
      });
    });
    document.querySelectorAll(".modal .box,.overlay .box").forEach((box) => {
      if (!box.querySelector(".modalX")) {
        let x = document.createElement("button");
        x.className = "modalX";
        x.type = "button";
        x.textContent = "\xD7";
        x.title = "\u0110\xF3ng";
        x.onclick = (e) => {
          e.stopPropagation();
          box.closest(".modal,.overlay")?.classList.add("hidden");
        };
        box.prepend(x);
      }
    });
    setupCardTools();
    if ($("toggleGuide")) $("toggleGuide").onclick = () => {
      let g = $("guidePanel"), open = g.classList.toggle("hidden") === false;
      $("toggleGuide").textContent = open ? "\u1EA8n h\u01B0\u1EDBng d\u1EABn" : "M\u1EDF h\u01B0\u1EDBng d\u1EABn";
    };
    if ($("stCardFont")) $("stCardFont").oninput = (e) => {
      cardFontSize = (+e.target.value / 100).toFixed(2);
      applyCardFontSize();
      renderCard();
    };
    if ($("stCardFontReset")) $("stCardFontReset").onclick = () => {
      cardFontSize = "1";
      applyCardFontSize();
      renderCard();
      updateSettingsUI();
    };
    if ($("stToggleFlipMode")) $("stToggleFlipMode").onclick = toggleFlipMode;
    if ($("stToggleOpts")) $("stToggleOpts").style.display = "none";
    if ($("stShuffle")) $("stShuffle").onclick = () => {
      shuffle();
      updateSettingsUI();
    };
    if ($("stReset")) $("stReset").onclick = () => {
      triggerReset();
      updateSettingsUI();
    };
    if ($("stGo")) $("stGo").onclick = goToQuestionNum;
    if ($("stGoInput")) $("stGoInput").onkeydown = (e) => {
      if (e.key === "Enter") goToQuestionNum();
    };
    if ($("stEdit")) $("stEdit").onclick = () => {
      openEditor();
      $("settingsModal").classList.add("hidden");
    };
    $("editCard").title = "B\xE1o c\xE1o / \u0111\u1EC1 xu\u1EA5t s\u1EEDa c\xE2u";
    $("editCard").textContent = "!";
    $("editCard").onclick = (e) => {
      e.stopPropagation();
      openEditor();
    };
    $("prev").onclick = prev;
    $("next").onclick = next;
    $("mode").onclick = toggleFlipMode;
    const handleCardClick = (e) => {
      if (e.target.closest("#editCard") || e.target.closest("#cardTools") || e.target.closest(".modal")) return;
      if (flipMode === "single") {
        flip("horizontal");
      }
    };
    $("zone").onclick = (e) => {
      const cardNode = $("card");
      if (cardNode && !cardNode.contains(e.target)) {
        let r = cardNode.getBoundingClientRect();
        typeof slideChange === "function" ? slideChange(e.clientX < r.left ? "prev" : "next") : e.clientX < r.left ? prev() : next();
        return;
      }
    };
    const cardEl = $("card");
    if (cardEl) {
      cardEl.onclick = (e) => {
        e.stopPropagation();
        handleCardClick(e);
      };
      cardEl.ondblclick = (e) => {
        e.stopPropagation();
        if (flipMode === "double") {
          flip("horizontal");
        }
      };
    }
    $("search").oninput = renderStudy;
    $("studyList").onclick = (e) => {
      let it = e.target.closest(".sitem");
      if (it) it.classList.toggle("open");
    };
    $("closeEdit").onclick = () => $("editModal").classList.add("hidden");
    $("saveEdit").onclick = saveEditor;
    $("restoreEdit").onclick = restoreEditor;
    $("editImgs").onclick = (e) => {
      let b = e.target.closest("[data-rm]");
      if (b) {
        editDraft.images.splice(+b.dataset.rm, 1);
        renderEditImages();
      }
    };
    $("imgUpload").onchange = async (e) => {
      const files = [...e.target.files];
      if (!files.length) return;
      window.__LH_EDIT_IMAGE_UPLOADING = (window.__LH_EDIT_IMAGE_UPLOADING || 0) + files.length;
      const saveBtn = $("saveEdit");
      if (saveBtn) saveBtn.disabled = true;
      if (typeof notify === "function") notify("\u0110ang t\u1EA3i \u1EA3nh l\xEAn Cloudinary...");
      try {
        for (const file of files) {
          try {
            const config = window.APP_CONFIG;
            if (!config || !config.CLOUDINARY_UPLOAD_URL) throw new Error("Thi\u1EBFu c\u1EA5u h\xECnh Cloudinary trong config.js ho\u1EB7c app.js");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", config.CLOUDINARY_UPLOAD_PRESET);
            formData.append("folder", config.CLOUDINARY_UPLOAD_FOLDER);
            const res = await fetch(config.CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error?.message || "Upload Cloudinary th\u1EA5t b\u1EA1i");
            }
            const data = await res.json();
            editDraft.images = editDraft.images || [];
            editDraft.images.push({ id: data.public_id, src: data.secure_url, url: data.secure_url, secure_url: data.secure_url, source: "cloudinary", name: file.name });
            if (typeof window.__LHCleanImages === "function") editDraft.images = window.__LHCleanImages(editDraft.images);
            renderEditImages();
            if (typeof notify === "function") notify("\u0110\xE3 upload \u1EA3nh l\xEAn Cloudinary");
          } catch (err) {
            console.error("[Upload Error]:", err);
            alert("Kh\xF4ng th\u1EC3 t\u1EA3i \u1EA3nh l\xEAn: " + err.message);
          } finally {
            window.__LH_EDIT_IMAGE_UPLOADING = Math.max(0, (window.__LH_EDIT_IMAGE_UPLOADING || 1) - 1);
          }
        }
      } finally {
        e.target.value = "";
        if (saveBtn) saveBtn.disabled = window.__LH_EDIT_IMAGE_UPLOADING > 0;
      }
    };
    $("exportEdits").onclick = exportEdits;
    $("importEdits").onclick = () => $("importFile").click();
    $("importFile").onchange = (e) => {
      if (e.target.files[0]) importEditsFile(e.target.files[0]);
    };
    $("clearEdits").onclick = () => {
      if (confirm("X\xF3a t\u1EA5t c\u1EA3 ch\u1EC9nh s\u1EEDa \u0111\xE3 l\u01B0u?")) {
        edits = {};
        localStorage.removeItem(STORE);
        rebuild();
        renderCard();
        notify("\u0110\xE3 x\xF3a t\u1EA5t c\u1EA3 s\u1EEDa");
      }
    };
    window.onkeydown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ($("quiz") && $("quiz").classList.contains("active")) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        flip("horizontal");
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        flip("up");
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        flip("down");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        typeof slideChange === "function" ? slideChange("next") : next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        typeof slideChange === "function" ? slideChange("prev") : prev();
      }
      if (e.key.toLowerCase() === "r") triggerReset();
      if (e.key.toLowerCase() === "e") openEditor();
      if (e.key === "1") document.querySelector('[data-tab="fc"]').click();
      if (e.key === "2") document.querySelector('[data-tab="quiz"]').click();
      if (e.key === "3") document.querySelector('[data-tab="study"]').click();
    };
    applyCardFontSize();
    setupCardTools();
    renderCard();
    renderQuiz();
  }
  document.addEventListener("DOMContentLoaded", init);
  window.HODSupabase = (() => {
    const CONFIG = window.APP_CONFIG || {
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: ""
    };
    let client = null;
    let currentUser = null;
    let currentProfile = null;
    const configured = () => CONFIG.SUPABASE_URL.startsWith("https://") && !CONFIG.SUPABASE_ANON_KEY.startsWith("PASTE_");
    const isReady = () => !!client && !!currentUser;
    const isAdmin = () => currentProfile?.role === "admin" || currentUser?.email === "trongbm2004@gmail.com";
    const canOpenDashboard = () => ["admin", "editor"].includes(currentProfile?.role) || currentUser?.email === "trongbm2004@gmail.com";
    const $id = (id) => document.getElementById(id);
    function safeJson(obj) {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return String(obj);
      }
    }
    function questionToRow(q) {
      const imgs = q.images || [];
      return {
        question: q.question,
        options: q.options || {},
        answer: q.answer,
        answer_text: finalAnswerText(q),
        images: imgs,
        has_image: !!(q.has_image || imgs.length),
        error_risk: q.error_risk || "low",
        error_risk_reason: q.error_risk_reason || null
      };
    }
    function rowToQuestion(row) {
      return {
        id: row.id,
        subject_code: row.subject_code,
        num: row.num,
        question: row.question,
        options: row.options || {},
        answer: row.answer,
        answer_text: row.answer_text,
        images: row.images || [],
        has_image: !!(row.has_image || (row.images || []).length),
        error_risk: row.error_risk || "low",
        error_risk_reason: row.error_risk_reason || "",
        // Đánh dấu đã có đủ dữ liệu từ Turso, để các đoạn code cũ (fallback gọi
        // sang Supabase để "lazy load" ảnh/dữ liệu) không kích hoạt nữa - Supabase
        // giờ chỉ dùng cho Auth, mọi dữ liệu câu hỏi đều lấy từ Turso.
        __imagesChecked: true,
        __imagesLoaded: true
      };
    }
    function notify2(msg) {
      if (typeof notify === "function") notify(msg);
      else console.log("[HOD102]", msg);
    }
    function openAuth() {
      $id("authModal")?.classList.remove("hidden");
    }
    function closeAuth() {
      $id("authModal")?.classList.add("hidden");
    }
    function openAdmin() {
      if (!canOpenDashboard()) {
        alert("T\xE0i kho\u1EA3n Google n\xE0y ch\u01B0a c\xF3 quy\u1EC1n admin.");
        return;
      }
      window.open("admin.html", "_blank");
    }
    function closeAdmin() {
      $id("adminModal")?.classList.add("hidden");
    }
    function setupHeaderAuthUI() {
      const actions = document.querySelector(".globalTop .actions") || document.querySelector("#fc .actions") || document.querySelector(".actions");
      if (!actions || $id("authStatusBtn")) return;
      const adminBtn = document.createElement("button");
      adminBtn.id = "adminOpenBtn";
      adminBtn.className = "btn adminBtn hidden";
      adminBtn.title = "Dashboard qu\u1EA3n tr\u1ECB";
      adminBtn.textContent = "";
      adminBtn.style.display = "none";
      adminBtn.onclick = () => window.open("admin.html", "_blank");
      const authBtn = document.createElement("button");
      authBtn.id = "authStatusBtn";
      authBtn.className = "btn authBtn";
      authBtn.title = "\u0110\u0103ng nh\u1EADp / \u0110\u0103ng xu\u1EA5t";
      authBtn.textContent = configured() ? "\u0110\u0103ng nh\u1EADp" : "Local";
      authBtn.onclick = async () => {
        if (!configured()) return alert("B\u1EA1n c\u1EA7n \u0111i\u1EC1n SUPABASE_URL v\xE0 SUPABASE_ANON_KEY trong file HTML tr\u01B0\u1EDBc.");
        if (currentUser) await signOut();
        else openAuth();
      };
      actions.prepend(authBtn);
      actions.prepend(adminBtn);
    }
    function updateAuthUI() {
      const authBtn = $id("authStatusBtn");
      const adminBtn = $id("adminOpenBtn");
      if (!authBtn) return;
      if (!configured()) {
        authBtn.textContent = "Local";
        authBtn.classList.remove("userChip");
        adminBtn?.classList.add("hidden");
        return;
      }
      if (currentUser) {
        authBtn.textContent = currentProfile?.email || currentUser.email || "User";
        authBtn.classList.add("userChip");
        const admin = canOpenDashboard();
        adminBtn?.classList.toggle("hidden", !admin);
        if (adminBtn) adminBtn.style.display = admin ? "" : "none";
        const floatAdmin = $id("hodFloatAdmin");
        floatAdmin?.classList.toggle("hidden", !admin);
        if (floatAdmin) floatAdmin.style.display = admin ? "" : "none";
        if (!admin) $id("adminModal")?.classList.add("hidden");
      } else {
        authBtn.textContent = "\u0110\u0103ng nh\u1EADp";
        authBtn.classList.remove("userChip");
        adminBtn?.classList.add("hidden");
        if (adminBtn) adminBtn.style.display = "none";
        const floatAdmin = $id("hodFloatAdmin");
        floatAdmin?.classList.add("hidden");
        if (floatAdmin) floatAdmin.style.display = "none";
        $id("adminModal")?.classList.add("hidden");
      }
    }
    function showPendingApproval() {
      const el = $id("hodPendingApproval");
      if (el) el.classList.remove("hidden");
      const emailEl = $id("hodPendingEmail");
      if (emailEl) emailEl.textContent = currentUser?.email || "";
      $id("hodLoginGate")?.classList.add("hidden");
      document.body?.classList.add("hod-locked");
    }
    function hidePendingApproval() {
      const el = $id("hodPendingApproval");
      if (el) el.classList.add("hidden");
    }
    async function sendLoginToDiscord(email, role) {
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "login", user_id: currentUser?.id, email, role, source: "web" })
        });
        if (!res.ok) console.warn("Discord login notify failed:", res.status, await res.text().catch(() => ""));
      } catch (error) {
        console.warn("L\u1ED7i g\u1EEDi th\xF4ng b\xE1o login web:", error);
      }
    }
    async function notifyLoginToDiscordOnce() {
      if (!currentUser) return;
      const key = "hod_web_login_discord_notified_" + currentUser.id;
      if (sessionStorage.getItem(key)) return;
      await sendLoginToDiscord(currentProfile?.email || currentUser.email, currentProfile?.role || "user");
      sessionStorage.setItem(key, "true");
    }
    let activeProfilePromise = null;
    async function loadProfile() {
      if (!currentUser) {
        currentProfile = null;
        updateAuthUI();
        return null;
      }
      if (activeProfilePromise) return activeProfilePromise;
      activeProfilePromise = (async () => {
        try {
          const res = await fetch("/api/profile?turso=1&ts=" + Date.now(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              id: currentUser.id,
              email: currentUser.email || "",
              full_name: currentUser.user_metadata?.full_name || "",
              avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || "",
              last_login: (/* @__PURE__ */ new Date()).toISOString(),
              last_activity: (/* @__PURE__ */ new Date()).toISOString()
            })
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c profile t\u1EEB Turso");
          currentProfile = json.data || json.profile || json;
          if (currentUser?.email === "trongbm2004@gmail.com" && currentProfile) {
            currentProfile.role = "admin";
            currentProfile.approved = true;
          }
          if (json.force_logout || currentProfile?.force_logout) {
            location.reload();
            return null;
          }
          if (currentProfile?.blocked || currentProfile?.is_blocked || currentProfile?.status === "blocked") {
            alert("T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB kh\xF3a.");
            await signOut();
            return null;
          }
          await notifyLoginToDiscordOnce();
          if (currentProfile?.approved === false || currentProfile?.approved === 0 || currentProfile?.approved === "0") {
            showPendingApproval();
            updateAuthUI();
            return null;
          }
          hidePendingApproval();
          updateAuthUI();
          window.dispatchEvent(new CustomEvent("lh:profile-ready"));
          return currentProfile;
        } catch (e) {
          console.error("[Turso profile]", e);
          currentProfile = null;
          updateAuthUI();
          return null;
        } finally {
          activeProfilePromise = null;
        }
      })();
      return activeProfilePromise;
    }
    async function loadQuestionsFromSupabase() {
      if (!currentUser) return false;
      if (currentProfile && (currentProfile.approved === false || currentProfile.approved === 0 || currentProfile.approved === "0")) {
        showPendingApproval();
        return false;
      }
      const activeSubject = localStorage.getItem("learninghub_subject_code_merged_v1") || "";
      if (!activeSubject) return false;
      try {
        const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(activeSubject) + "&ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c questions t\u1EEB Turso");
        const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        RAW = rows.map(rowToQuestion);
        pool = [...RAW];
        var _sci = +localStorage.getItem("learninghub_progress_" + activeSubject) || 0;
        ci = Math.max(0, Math.min(_sci, Math.max(0, pool.length - 1)));
        flipped = false;
        if ($id("total")) $id("total").textContent = pool.length;
        try {
          renderCard();
        } catch (e) {
        }
        try {
          renderQuiz();
        } catch (e) {
        }
        try {
          renderStudy();
        } catch (e) {
        }
        notify2("\u0110\xE3 t\u1EA3i c\xE2u h\u1ECFi t\u1EEB Turso");
        return true;
      } catch (e) {
        console.warn("[Turso questions]", e);
        notify2("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c c\xE2u h\u1ECFi t\u1EEB Turso.");
        return false;
      }
    }
    async function signInGoogle() {
      if (!window.supabase) return alert("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c Supabase. Ki\u1EC3m tra m\u1EA1ng ho\u1EB7c CDN.");
      if (!client) return alert("Supabase ch\u01B0a s\u1EB5n s\xE0ng.");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href.split("#")[0] }
      });
      if (error) alert(error.message);
    }
    async function signIn() {
      if (!client) return;
      const email = $id("authEmail")?.value.trim();
      const password = $id("authPassword")?.value;
      if (!email || !password) return alert("Nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u nha.");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
      currentUser = data.user;
      await loadProfile();
      await loadQuestionsFromSupabase();
      closeAuth();
      notify2("\u0110\xE3 \u0111\u0103ng nh\u1EADp");
    }
    async function signUp() {
      if (!client) return;
      const email = $id("authEmail")?.value.trim();
      const password = $id("authPassword")?.value;
      if (!email || !password) return alert("Nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u nha.");
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return alert(error.message);
      alert("\u0110\xE3 t\u1EA1o t\xE0i kho\u1EA3n. N\u1EBFu Supabase y\xEAu c\u1EA7u x\xE1c nh\u1EADn email, h\xE3y x\xE1c nh\u1EADn r\u1ED3i \u0111\u0103ng nh\u1EADp.");
    }
    async function signOut() {
      if (!client) return;
      Object.keys(sessionStorage).filter((k) => k.startsWith("hod_web_login_discord_notified_")).forEach((k) => sessionStorage.removeItem(k));
      await client.auth.signOut();
      currentUser = null;
      currentProfile = null;
      updateAuthUI();
      notify2("\u0110\xE3 \u0111\u0103ng xu\u1EA5t");
    }
    async function submitEditRequest(newDraft, oldQ) {
      if (!client) return alert("Ch\u01B0a c\u1EA5u h\xECnh Supabase.");
      if (!currentUser) {
        openAuth();
        return;
      }
      if (!oldQ?.id) {
        alert("C\xE2u h\u1ECFi hi\u1EC7n \u0111ang l\u1EA5y t\u1EEB data local. H\xE3y \u0111\u0103ng nh\u1EADp v\xE0 t\u1EA3i questions t\u1EEB Supabase tr\u01B0\u1EDBc khi g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa.");
        return;
      }
      try {
        if (typeof window.__LHGetPendingImageUpload === "function") {
          const p = window.__LHGetPendingImageUpload();
          if (p) await p;
        }
        if (typeof window.__LHUploadPendingDataUrls === "function") await window.__LHUploadPendingDataUrls();
      } catch (e) {
        console.warn("Ch\u1EDD upload \u1EA3nh tr\u01B0\u1EDBc khi g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa th\u1EA5t b\u1EA1i:", e);
      }
      const payload = {
        question_id: oldQ.id,
        question_num: oldQ.num,
        subject_code: oldQ.subject_code || newDraft.subject_code || "",
        user_id: currentUser.id,
        user_email: currentUser.email || currentProfile?.email || "",
        old_data: questionToRow(oldQ),
        new_data: questionToRow(newDraft),
        reason: ""
      };
      const res = await fetch("/api/edit-requests", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(payload) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert("G\u1EEDi y\xEAu c\u1EA7u s\u1EEDa th\u1EA5t b\u1EA1i: " + (out.error || res.status));
      $id("editModal")?.classList.add("hidden");
      notify2("\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa, \u0111ang ch\u1EDD admin duy\u1EC7t");
    }
    async function loadPendingRequests() {
      if (!client || !isAdmin()) return;
      const list = $id("adminRequests");
      const count = $id("adminCount");
      if (list) list.innerHTML = '<div class="more">\u0110ang t\u1EA3i...</div>';
      let data = [];
      try {
        const res = await fetch("/api/admin-dashboard", { cache: "no-store" });
        const dash = await res.json().catch(() => ({}));
        if (!res.ok || dash.error) throw new Error(dash.error || res.status);
        data = (dash.requests || []).filter((r) => r.status === "pending").map((r) => ({ ...r, old_data: typeof r.old_data === "string" ? JSON.parse(r.old_data || "{}") : r.old_data, new_data: typeof r.new_data === "string" ? JSON.parse(r.new_data || "{}") : r.new_data }));
      } catch (e) {
        if (list) list.innerHTML = '<div class="more">' + esc(e.message || "L\u1ED7i t\u1EA3i") + "</div>";
        return;
      }
      if (count) count.textContent = `${data.length} y\xEAu c\u1EA7u`;
      if (!list) return;
      list.innerHTML = data.length ? data.map((r) => `
      <div class="adminReq" data-request-id="${r.id}">
        <div class="adminReqHead"><span>Request #${r.id} \xB7 C\xE2u ${r.question_num || r.question_id}</span><span>${new Date(r.created_at).toLocaleString()}</span></div>
        <div class="compareGrid">
          <div class="compareBox"><h4>N\u1ED9i dung c\u0169</h4><pre>${esc(safeJson(r.old_data))}</pre></div>
          <div class="compareBox"><h4>N\u1ED9i dung \u0111\u1EC1 xu\u1EA5t</h4><pre>${esc(safeJson(r.new_data))}</pre></div>
        </div>
        <div class="adminActions">
          <button class="btn approveBtn" data-approve="${r.id}">Duy\u1EC7t</button>
          <button class="btn rejectBtn" data-reject="${r.id}">T\u1EEB ch\u1ED1i</button>
        </div>
      </div>`).join("") : '<div class="more">Kh\xF4ng c\xF3 y\xEAu c\u1EA7u ch\u1EDD duy\u1EC7t.</div>';
      list.querySelectorAll("[data-approve]").forEach((btn) => btn.onclick = () => approveRequest(Number(btn.dataset.approve), data.find((x) => x.id === Number(btn.dataset.approve))));
      list.querySelectorAll("[data-reject]").forEach((btn) => btn.onclick = () => rejectRequest(Number(btn.dataset.reject)));
    }
    async function approveRequest(id, req) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi duy\u1EC7t \u0111\u01B0\u1EE3c.");
      const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: currentUser.id, action: "approve_request", payload: { request_id: id } }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert("Kh\xF4ng duy\u1EC7t \u0111\u01B0\u1EE3c: " + (out.error || res.status));
      if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
      notify2("\u0110\xE3 duy\u1EC7t y\xEAu c\u1EA7u");
      try {
        await loadPendingRequests();
      } catch (e) {
        console.warn("loadPendingRequests failed:", e);
      }
      try {
        await loadQuestionsFromSupabase();
      } catch (e) {
        console.warn("loadQuestions failed:", e);
      }
    }
    async function rejectRequest(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi t\u1EEB ch\u1ED1i \u0111\u01B0\u1EE3c.");
      const note = prompt("L\xFD do t\u1EEB ch\u1ED1i (tu\u1EF3 ch\u1ECDn):") || "";
      const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: currentUser.id, action: "reject_request", payload: { request_id: id, admin_note: note } }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert("Kh\xF4ng t\u1EEB ch\u1ED1i \u0111\u01B0\u1EE3c: " + (out.error || res.status));
      notify2("\u0110\xE3 t\u1EEB ch\u1ED1i y\xEAu c\u1EA7u");
      try {
        await loadPendingRequests();
      } catch (e) {
        console.warn("loadPendingRequests failed:", e);
      }
    }
    async function applyOAuthHashSession(supaClient) {
      try {
        let h = window.location.hash || "";
        if (!h) return false;
        h = h.replace(/^#/, "").replace(/&amp;/g, "&");
        const p = new URLSearchParams(h);
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");
        if (!access_token || !refresh_token) return false;
        const { error } = await supaClient.auth.setSession({ access_token, refresh_token });
        if (error) {
          console.warn("setSession from hash failed:", error);
          return false;
        }
        history.replaceState(null, "", window.location.pathname + window.location.search);
        return true;
      } catch (e) {
        console.warn("applyOAuthHashSession error:", e);
        return false;
      }
    }
    async function init2() {
      setupHeaderAuthUI();
      $id("authGoogle")?.addEventListener("click", signInGoogle);
      $id("authLogin")?.addEventListener("click", signIn);
      $id("authSignup")?.addEventListener("click", signUp);
      $id("authClose")?.addEventListener("click", closeAuth);
      $id("adminClose")?.addEventListener("click", closeAdmin);
      $id("adminReload")?.addEventListener("click", loadPendingRequests);
      $id("hodPendingRefresh")?.addEventListener("click", async () => {
        const btn = $id("hodPendingRefresh");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "\u0110ang ki\u1EC3m tra...";
        }
        await loadProfile();
        if (currentProfile?.approved !== false) await loadQuestionsFromSupabase();
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Ki\u1EC3m tra l\u1EA1i";
        }
      });
      $id("hodPendingLogout")?.addEventListener("click", async () => {
        await signOut();
        hidePendingApproval();
      });
      if (!configured()) {
        updateAuthUI();
        return;
      }
      client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      await applyOAuthHashSession(client);
      const { data } = await client.auth.getSession();
      currentUser = data.session?.user || null;
      if (currentUser) {
        const prof = await loadProfile();
        if (prof) {
          await loadQuestionsFromTurso();
          if (typeof window.__LHTriggerSubjectCheck === "function") window.__LHTriggerSubjectCheck();
        }
      } else updateAuthUI();
      client.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user || null;
        if (currentUser) {
          const prof = await loadProfile();
          if (prof) {
            await loadQuestionsFromTurso();
            if (typeof window.__LHTriggerSubjectCheck === "function") window.__LHTriggerSubjectCheck();
          }
        } else {
          currentProfile = null;
          updateAuthUI();
        }
      });
    }
    async function loadQuestionsFromTurso() {
      if (typeof window.loadCurrentSubjectOnly === "function") return window.loadCurrentSubjectOnly();
      return loadQuestionsFromSupabase();
    }
    document.addEventListener("DOMContentLoaded", init2);
    return { init: init2, isReady, isAdmin, canOpenDashboard, submitEditRequest, loadQuestionsFromSupabase, openAuth, openAdmin, signOut, signInGoogle, getUser: () => currentUser, getProfile: () => currentProfile, get __client() {
      return client;
    } };
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function hideLanding() {
      $2("hodLoginScreen")?.classList.add("hidden");
    }
    function openLogin() {
      hideLanding();
      if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
      else alert("Supabase UI ch\u01B0a s\u1EB5n s\xE0ng, h\xE3y t\u1EA3i l\u1EA1i trang.");
    }
    function openAdmin() {
      hideLanding();
      if (window.HODSupabase?.canOpenDashboard?.()) window.HODSupabase.openAdmin();
      else {
        if (window.HODSupabase?.openAuth) window.HODSupabase.openAuth();
        setTimeout(() => alert("\u0110\u0103ng nh\u1EADp t\xE0i kho\u1EA3n admin tr\u01B0\u1EDBc. Sau \u0111\xF3 b\u1EA5m n\xFAt Admin l\u1EA1i."), 80);
      }
    }
    function bind() {
      $2("hodGuestEnter")?.addEventListener("click", hideLanding);
      $2("hodOpenLogin")?.addEventListener("click", openLogin);
      $2("hodOpenAdmin")?.addEventListener("click", openAdmin);
      $2("hodFloatLogin")?.addEventListener("click", openLogin);
      $2("hodFloatAdmin")?.addEventListener("click", openAdmin);
      const box = document.querySelector("#authModal .box.authBox");
      if (box && !document.getElementById("hodAuthExtraHint")) {
        const hint = document.createElement("div");
        hint.id = "hodAuthExtraHint";
        hint.className = "hodAuthHint";
        hint.textContent = "Ng\u01B0\u1EDDi h\u1ECDc d\xF9ng \u0110\u0103ng nh\u1EADp/\u0110\u0103ng k\xFD. Admin \u0111\u0103ng nh\u1EADp b\u1EB1ng t\xE0i kho\u1EA3n \u0111\xE3 \u0111\u01B0\u1EE3c set role = admin trong Supabase.";
        box.appendChild(hint);
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();
  (function() {
    function applyAdminGuard() {
      const isAdmin = !!window.HODSupabase?.canOpenDashboard?.();
      document.body?.classList.toggle("hod-is-admin", isAdmin);
      ["adminOpenBtn", "hodFloatAdmin"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle("hidden", !isAdmin);
        el.style.display = isAdmin ? "" : "none";
      });
      const modal = document.getElementById("adminModal");
      if (modal && !isAdmin) modal.classList.add("hidden");
    }
    function patchOpenAdmin() {
      if (!window.HODSupabase || window.HODSupabase.__adminGuardPatched) return;
      const oldOpen = window.HODSupabase.openAdmin;
      window.HODSupabase.openAdmin = function() {
        if (!window.HODSupabase.canOpenDashboard?.()) {
          document.getElementById("adminModal")?.classList.add("hidden");
          alert("T\xE0i kho\u1EA3n Google n\xE0y ch\u01B0a c\xF3 quy\u1EC1n admin.");
          applyAdminGuard();
          return;
        }
        return oldOpen?.apply(this, arguments);
      };
      window.HODSupabase.__adminGuardPatched = true;
    }
    function tick() {
      patchOpenAdmin();
      applyAdminGuard();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
    else tick();
    setInterval(tick, 500);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function isAdmin() {
      return !!window.HODSupabase?.canOpenDashboard?.();
    }
    function email() {
      return profile()?.email || user()?.email || "";
    }
    function meta() {
      return user()?.user_metadata || {};
    }
    function avatarHTML() {
      const u = meta().avatar_url || meta().picture || "";
      const e = email();
      const l = (e || "U").trim().charAt(0).toUpperCase();
      return u ? '<img src="' + esc(u) + '" alt="avatar" loading="lazy" decoding="async">' : l;
    }
    function ensureAvatar() {
      const actions = document.querySelector(".globalTop .actions") || document.querySelector("#fc .actions") || document.querySelector(".actions");
      if (!actions || $2("hodTopAvatar")) return;
      const btn = document.createElement("button");
      btn.id = "hodTopAvatar";
      btn.className = "hodTopAvatar";
      btn.type = "button";
      btn.onclick = toggleMenu;
      actions.appendChild(btn);
    }
    function toggleMenu() {
      if (!user()) return showLogin();
      updateMenu();
      $2("hodAccountMenu")?.classList.toggle("hidden");
    }
    function showLogin() {
      if (window.__LOCAL_DEV_MODE) return;
      document.body?.classList.add("hod-locked");
      $2("hodLoginGate")?.classList.remove("hidden");
      $2("hodAccountMenu")?.classList.add("hidden");
      $2("hodPendingApproval")?.classList.add("hidden");
    }
    function hideLogin() {
      document.body?.classList.remove("hod-locked");
      $2("hodLoginGate")?.classList.add("hidden");
    }
    function login() {
      const api = window.HODSupabase;
      if (!api) {
        alert("Supabase ch\u01B0a s\u1EB5n s\xE0ng, h\xE3y t\u1EA3i l\u1EA1i trang.");
        return;
      }
      if (api.signInGoogle) {
        api.signInGoogle();
        return;
      }
      api.openAuth?.();
    }
    async function logout() {
      await window.HODSupabase?.signOut?.();
      showLogin();
      updateAll();
    }
    function openDash() {
      if (isAdmin()) window.open("admin.html", "_blank");
      else alert("T\xE0i kho\u1EA3n n\xE0y kh\xF4ng c\xF3 quy\u1EC1n admin.");
    }
    function updateMenu() {
      const admin = isAdmin();
      const pRole = profile()?.role || (email() === "trongbm2004@gmail.com" ? "admin" : "user");
      const rawRole = String(pRole).toLowerCase();
      const mail = $2("hodAccountEmail");
      if (mail) mail.textContent = email() || "Ch\u01B0a \u0111\u0103ng nh\u1EADp";
      const role = $2("hodAccountRole");
      if (role) role.textContent = rawRole === "admin" || email() === "trongbm2004@gmail.com" ? "Admin" : rawRole === "editor" ? "Editor" : "Ng\u01B0\u1EDDi h\u1ECDc";
      const av = $2("hodAccountAvatarBig");
      if (av) {
        const __avb = avatarHTML();
        if (av.dataset.av !== __avb) {
          av.innerHTML = __avb;
          av.dataset.av = __avb;
        }
      }
      $2("hodAccountDashboard")?.classList.toggle("hidden", !admin);
    }
    function updateAll() {
      ensureAvatar();
      const u = user();
      const p = profile();
      const admin = isAdmin();
      const pending = u && p && p.approved === false;
      document.body?.classList.toggle("hod-is-admin-final", admin);
      if (pending) {
        $2("hodLoginGate")?.classList.add("hidden");
        $2("hodPendingApproval")?.classList.remove("hidden");
        document.body?.classList.add("hod-locked");
        const emailEl = $2("hodPendingEmail");
        if (emailEl) emailEl.textContent = p.email || u.email || "";
      } else if (u) {
        hideLogin();
        $2("hodPendingApproval")?.classList.add("hidden");
      } else {
        showLogin();
      }
      const top = $2("hodTopAvatar");
      if (top) {
        const __ah = avatarHTML();
        if (top.dataset.av !== __ah) {
          top.innerHTML = __ah;
          top.dataset.av = __ah;
        }
        top.style.display = u && !pending ? "grid" : "none";
      }
      const headerAdmin = $2("adminOpenBtn");
      if (headerAdmin) {
        headerAdmin.remove();
      }
      if (!admin) $2("adminModal")?.classList.add("hidden");
      updateMenu();
    }
    function patchAdmin() {
      if (!window.HODSupabase || window.HODSupabase.__avatarCleanPatch) return;
      const old = window.HODSupabase.openAdmin;
      window.HODSupabase.openAdmin = function() {
        if (!window.HODSupabase.canOpenDashboard?.()) {
          $2("adminModal")?.classList.add("hidden");
          alert("T\xE0i kho\u1EA3n n\xE0y kh\xF4ng c\xF3 quy\u1EC1n admin.");
          return;
        }
        return old?.apply(this, arguments);
      };
      window.HODSupabase.__avatarCleanPatch = true;
    }
    function bind() {
      $2("hodGateLoginBtn")?.addEventListener("click", login);
      $2("hodLogoutBtn")?.addEventListener("click", logout);
      $2("hodAccountDashboard")?.addEventListener("click", openDash);
      document.addEventListener("click", (e) => {
        const m = $2("hodAccountMenu"), a = $2("hodTopAvatar");
        if (m && !m.contains(e.target) && a && !a.contains(e.target)) m.classList.add("hidden");
      });
      setInterval(() => {
        patchAdmin();
        updateAll();
      }, 500);
      setTimeout(() => {
        patchAdmin();
        updateAll();
      }, 250);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();
  (function() {
    const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || "";
    const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || "";
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    let subjectClient = null, subjectsCache = [], pickedCode = localStorage.getItem(SUBJECT_STORE2) || "", lock = false;
    function c() {
      if (window.HODSupabase?.__client) return window.HODSupabase.__client;
      if (!window.supabase) return null;
      if (!subjectClient) subjectClient = window.supabase.createClient(HUB_URL, HUB_KEY);
      return subjectClient;
    }
    function $2(id) {
      return document.getElementById(id);
    }
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c2) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c2]);
    }
    function displayCode(code) {
      return String(code || "");
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function logged() {
      return !!user();
    }
    function subjectCode() {
      return localStorage.getItem(SUBJECT_STORE2) || "";
    }
    function getDeviceTypeString2() {
      const ua = navigator.userAgent || "";
      let os = "M\xE1y t\xEDnh";
      if (/iPhone|iPad|iPod/i.test(ua)) os = "\u{1F4F1} iOS";
      else if (/Android/i.test(ua)) os = "\u{1F4F1} Android";
      else if (/Macintosh|Mac OS X/i.test(ua)) os = "\u{1F4BB} Mac";
      else if (/Windows/i.test(ua)) os = "\u{1F4BB} Windows";
      else if (/Linux/i.test(ua)) os = "\u{1F4BB} Linux";
      let browser = "";
      if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = "Chrome";
      else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) browser = "Safari";
      else if (/Firefox|FxMo/i.test(ua)) browser = "Firefox";
      else if (/Edge|Edg/i.test(ua)) browser = "Edge";
      return browser ? `${os} \xB7 ${browser}` : os;
    }
    function syncUserSubjectToProfile2(code) {
      const u = user();
      if (!u) return;
      try {
        const md = u.user_metadata || {};
        fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: u.id,
            email: u.email,
            full_name: md.full_name || md.name || "",
            avatar_url: md.avatar_url || md.picture || "",
            current_subject: code || subjectCode() || "",
            device_info: getDeviceTypeString2()
          })
        }).catch((e) => console.warn("syncUserSubjectToProfile failed:", e));
      } catch (e) {
      }
    }
    function setSubject2(code) {
      if (code) localStorage.setItem(SUBJECT_STORE2, code);
      else localStorage.removeItem(SUBJECT_STORE2);
      pickedCode = code || "";
      syncSubjectTexts2();
      syncUserSubjectToProfile2(code);
    }
    function meta(code) {
      return subjectsCache.find((x) => x.code === code) || null;
    }
    function label(code) {
      const m = meta(code);
      return m ? `${displayCode(m.code)} \xB7 ${m.name || ""}` : displayCode(code) || "Ch\u01B0a ch\u1ECDn m\xF4n";
    }
    function notifyUX2(msg) {
      if (typeof notify === "function") notify(msg);
      else console.log(msg);
    }
    function syncSubjectTexts2() {
      const code = subjectCode();
      if ($2("subjectInlineText")) $2("subjectInlineText").textContent = code ? label(code) : "Ch\u01B0a ch\u1ECDn m\xF4n";
      if ($2("hodAccountSubjectText")) $2("hodAccountSubjectText").textContent = code ? label(code) : "Ch\u01B0a ch\u1ECDn m\xF4n";
      ensureChip();
      const chip = $2("subjectTopChip");
      if (chip) {
        chip.textContent = code ? label(code) : "Ch\u1ECDn m\xF4n";
        chip.classList.toggle("hidden", !logged());
      }
    }
    function ensureChip() {
      const actions = document.querySelector("#fc .actions") || document.querySelector(".actions");
      if (!actions || $2("subjectTopChip")) return;
      const b = document.createElement("button");
      b.id = "subjectTopChip";
      b.type = "button";
      b.className = "subjectChip hidden";
      b.onclick = () => openGate();
      actions.prepend(b);
    }
    function updateBrand(code) {
      if (typeof fixBrand === "function") fixBrand();
    }
    function closeAccountMenu() {
      $2("hodAccountMenu")?.classList.add("hidden");
    }
    function gateOn(on) {
      document.body.classList.toggle("has-subject-gate", !!on);
      $2("subjectGate")?.classList.toggle("hidden", !on);
      $2("subjectGate")?.setAttribute("aria-hidden", on ? "false" : "true");
    }
    function showErr(msg) {
      const e = $2("subjectError");
      if (e) {
        e.textContent = msg;
        e.classList.remove("hidden");
      }
    }
    function clearErr() {
      $2("subjectError")?.classList.add("hidden");
    }
    function showLoading(on, msg = "\u0110ang t\u1EA3i danh s\xE1ch m\xF4n h\u1ECDc...") {
      const e = $2("subjectLoading");
      if (e) {
        e.textContent = msg;
        e.classList.toggle("hidden", !on);
      }
    }
    function fallbackSubjects() {
      return [{ code: "HOD102", name: "HOD102 Learning", description: "M\xF4n m\u1EB7c \u0111\u1ECBnh \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u h\u1ECDc.", cover: "", is_active: true, question_count: 0 }, { code: "MLN111", name: "MLN111 Learning", description: "B\u1ED9 c\xE2u h\u1ECFi v\xE0 t\xE0i li\u1EC7u MLN111.", cover: "", is_active: true, question_count: 0 }];
    }
    async function addQuestionCounts(subjects) {
      const list = subjects || [];
      let store = { counts: {}, confirmed: {} };
      try {
        store = JSON.parse(localStorage.getItem("learninghub_subject_counts_cache_v3") || "{}") || store;
      } catch (e) {
      }
      store.counts = store.counts || {};
      store.confirmed = store.confirmed || {};
      const active = localStorage.getItem("learninghub_subject_code_merged_v1") || "";
      const current = {};
      try {
        (RAW || []).forEach((q) => {
          const code = q.subject_code || active || "";
          if (code) current[code] = (current[code] || 0) + 1;
        });
      } catch (e) {
      }
      return list.map((s) => {
        const code = s.code || "";
        let n = s.question_count ?? s.questions_count ?? s.count;
        if (n === void 0 || n === null || Number(n) === 0) n = current[code] ?? store.counts[code] ?? 0;
        n = Number(n);
        if (!Number.isFinite(n)) n = 0;
        return { ...s, question_count: n };
      });
    }
    async function getSubjects() {
      if (!logged()) return fallbackSubjects();
      try {
        const res = await fetch("/api/subjects?ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c subjects t\u1EEB Turso");
        const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (!rows.length) return fallbackSubjects();
        rows.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.code || "").localeCompare(String(b.code || "")));
        return await addQuestionCounts(rows);
      } catch (e) {
        console.warn("[Turso subjects]", e);
        showErr("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c danh s\xE1ch m\xF4n h\u1ECDc t\u1EEB Turso. \u0110ang d\xF9ng m\xF4n m\u1EB7c \u0111\u1ECBnh.");
        return fallbackSubjects();
      }
    }
    function card(s) {
      const rawCode = String(s.code || "");
      const code = esc2(displayCode(rawCode));
      const name = esc2(s.name || displayCode(rawCode) || "Ch\u01B0a c\xF3 t\xEAn m\xF4n");
      const desc = esc2(s.description || "M\xF4n h\u1ECDc ch\u01B0a c\xF3 m\xF4 t\u1EA3.");
      const rawCount = Number(s.question_count ?? s.questions_count ?? s.count);
      const countText = Number.isFinite(rawCount) ? `${rawCount} c\xE2u` : "\u2014 c\xE2u";
      const status = s.is_active === false ? "T\u1EA1m \u1EA9n" : countText;
      const chosen = pickedCode === s.code;
      let coverMeta = {};
      try {
        coverMeta = typeof s.cover === "string" ? JSON.parse(s.cover || "{}") : s.cover || {};
      } catch (e) {
        coverMeta = {};
      }
      const isNew = !!(s.new_badge || s.newBadge || s.is_new || s.isNew || coverMeta.new_badge || coverMeta.newBadge || coverMeta.is_new);
      const newBadge = isNew ? '<span class="subjectNewBadge">NEW</span>' : "";
      return `<button class="subjectCard ${chosen ? "active" : ""} ${isNew ? "hasNewBadge" : ""}" data-code="${esc2(rawCode)}" type="button" title="${code} - ${name} - ${countText}">
      ${newBadge}
      <span class="subjectCardCode"><span>${code}</span></span>
      <span class="subjectCardTitle">${name}</span>
      <span class="subjectCardDesc">${desc}</span>
      <span class="subjectMeta">
        <span>${status}</span>
        <span class="subjectChoose">${chosen ? "\u0110\xE3 ch\u1ECDn" : "Ch\u1ECDn m\xF4n"}</span>
      </span>
    </button>`;
    }
    function applyPicked() {
      if ($2("subjectPickedText")) $2("subjectPickedText").textContent = pickedCode ? label(pickedCode) : "Ch\u01B0a ch\u1ECDn m\xF4n";
      if ($2("subjectEnter")) $2("subjectEnter").disabled = !pickedCode;
      document.querySelectorAll(".subjectCard").forEach((x) => {
        const active = x.dataset.code === pickedCode;
        x.classList.toggle("active", active);
        x.setAttribute("aria-pressed", active ? "true" : "false");
        const choose = x.querySelector(".subjectChoose");
        if (choose) choose.textContent = active ? "\u0110\xE3 ch\u1ECDn" : "Ch\u1ECDn m\xF4n";
      });
    }
    function renderSubjects2() {
      const list = $2("subjectList");
      if (!list) return;
      const q = ($2("subjectSearch")?.value || "").trim().toLowerCase();
      const arr = subjectsCache.filter((s) => !q || `${s.code || ""} ${s.name || ""} ${s.description || ""}`.toLowerCase().includes(q));
      list.innerHTML = arr.map(card).join("");
      $2("subjectEmpty")?.classList.toggle("hidden", !!arr.length);
      list.querySelectorAll(".subjectCard").forEach((x) => x.onclick = () => {
        pickedCode = x.dataset.code;
        applyPicked();
      });
      applyPicked();
    }
    let lastRefreshTime = 0;
    async function refreshSubjects(force = false) {
      const now = Date.now();
      if (!force && now - lastRefreshTime < 2e3) {
        return;
      }
      lastRefreshTime = now;
      if (!logged()) return;
      clearErr();
      showLoading(true);
      try {
        subjectsCache = await getSubjects();
        if (!pickedCode && subjectCode()) pickedCode = subjectCode();
        if (!pickedCode && subjectsCache[0]) pickedCode = subjectsCache[0].code;
        renderSubjects2();
        syncSubjectTexts2();
      } finally {
        showLoading(false);
      }
    }
    let lastOpenGateTime = 0;
    function openGate(force = false) {
      const now = Date.now();
      if (!force && now - lastOpenGateTime < 1e3) {
        return;
      }
      lastOpenGateTime = now;
      if (!logged()) return;
      localStorage.setItem("learninghub_subject_gate_open_v1", "true");
      if ($2("subjectUserEmail")) $2("subjectUserEmail").textContent = user()?.email || "Ch\u01B0a \u0111\u0103ng nh\u1EADp";
      gateOn(true);
      closeAccountMenu();
      refreshSubjects(true);
    }
    function closeGate() {
      localStorage.setItem("learninghub_subject_gate_open_v1", "false");
      gateOn(false);
    }
    async function loadBySubject(code) {
      if (!code) return false;
      syncUserSubjectToProfile2(code);
      const p = window.HODSupabase?.getProfile?.() || null;
      if (p && (p.approved === false || p.approved === 0 || p.approved === "0")) return false;
      try {
        const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(code) + "&ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c questions t\u1EEB Turso");
        const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        RAW = data.map((r) => ({ id: r.id, subject_code: r.subject_code || code, num: r.num, question: r.question, options: r.options || {}, answer: r.answer, answer_text: r.answer_text, images: typeof cleanImages === "function" ? cleanImages(r.images || []) : r.images || [], has_image: !!(r.has_image || (r.images || []).length), error_risk: r.error_risk || "low", error_risk_reason: r.error_risk_reason || "", __imagesChecked: true, __imagesLoaded: true }));
        pool = [...RAW];
        var _saved = +localStorage.getItem("learninghub_progress_" + code) || 0;
        ci = Math.max(0, Math.min(_saved, Math.max(0, pool.length - 1)));
        flipped = false;
        if ($2("idx")) $2("idx").textContent = pool.length ? String(ci + 1) : "0";
        if ($2("total")) $2("total").textContent = String(pool.length);
        updateBrand(code);
        syncSubjectTexts2();
        try {
          if (typeof window.__examResetForSubjectChange === "function") window.__examResetForSubjectChange();
        } catch (e) {
        }
        try {
          renderCard();
        } catch (e) {
        }
        try {
          renderQuiz();
        } catch (e) {
        }
        try {
          renderStudy();
        } catch (e) {
        }
        notifyUX2("\u0110\xE3 t\u1EA3i " + label(code));
        return true;
      } catch (e) {
        console.warn("[Turso loadBySubject]", e);
        notifyUX2("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u m\xF4n h\u1ECDc t\u1EEB Turso.");
        return false;
      }
    }
    async function enterSubject() {
      if (!pickedCode) return;
      const btn = $2("subjectEnter");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang t\u1EA3i...";
      }
      try {
        setSubject2(pickedCode);
        closeGate();
        let ok = false;
        if (typeof window.loadCurrentSubjectOnly === "function") {
          ok = await window.loadCurrentSubjectOnly(true);
        }
        if (!ok) {
          ok = await loadBySubject(pickedCode);
        }
      } catch (e) {
        console.error("[enterSubject]", e);
        notifyUX2("Kh\xF4ng th\u1EC3 chuy\u1EC3n m\xF4n: " + (e.message || e));
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "B\u1EAFt \u0111\u1EA7u \u2192";
        }
      }
    }
    async function logoutGate() {
      closeGate();
      setSubject2("");
      await window.HODSupabase?.signOut?.();
    }
    function patchSubmit() {
      if (window.__hubPatchSubmitMerged || !window.HODSupabase?.submitEditRequest) return;
      window.__hubPatchSubmitMerged = true;
      const old = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
      window.HODSupabase.submitEditRequest = async function(newDraft, oldQ) {
        if (oldQ?.id) return old(newDraft, oldQ);
        const supa = c();
        const code = oldQ?.subject_code || subjectCode();
        const num = oldQ?.num;
        if (supa && code && num) {
          const { data, error } = await supa.from("questions").select("id,subject_code").eq("subject_code", code).eq("num", num).maybeSingle();
          if (!error && data) oldQ = { ...oldQ, id: data.id, subject_code: data.subject_code || code };
        }
        return old(newDraft, oldQ);
      };
    }
    function patchSave() {
      if (window.__hubPatchSaveMerged || typeof saveEditor !== "function") return;
      window.__hubPatchSaveMerged = true;
      const old = saveEditor;
      saveEditor = async function() {
        let oldQ = clone(RAW.find((c2) => c2.num === editDraft.num) || pool[ci] || editDraft);
        editDraft.question = $2("editQuestion").value.trim();
        editDraft.answer = $2("editAnswer").value.trim().toUpperCase();
        let ops = {};
        document.querySelectorAll("[data-opt]").forEach((t) => {
          if (t.value.trim()) ops[t.dataset.opt] = t.value.trim();
        });
        editDraft.options = ops;
        editDraft.answer_text = answerText(editDraft);
        editDraft.subject_code = subjectCode();
        if (window.HODSupabase && window.HODSupabase.isReady()) {
          const _role = String(window.HODSupabase?.getProfile?.()?.role || "").trim().toLowerCase();
          if (["admin", "editor"].includes(_role)) {
            const _qid = oldQ?.id || editDraft?.id;
            if (!_qid) {
              alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
              return;
            }
            const _u = window.HODSupabase?.getUser?.();
            if (!_u?.id) {
              alert("Ch\u01B0a \u0111\u0103ng nh\u1EADp. H\xE3y \u0111\u0103ng nh\u1EADp l\u1EA1i.");
              return;
            }
            const _list = editDraft.images || [];
            const _text = editDraft.question + " " + Object.values(editDraft.options || {}).join(" ");
            const _needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(_text);
            const _hasImg = !!(_list.length || oldQ?.has_image);
            const _risk = (editDraft.answer?.length || 0) > 1 ? "medium" : "low";
            const _newData = { question: editDraft.question, options: editDraft.options || {}, answer: editDraft.answer, answer_text: editDraft.answer_text, images: _list, has_image: _hasImg || _needsImg, error_risk: _risk, error_risk_reason: null };
            const _oldData = { question: oldQ.question, options: oldQ.options || {}, answer: oldQ.answer, answer_text: oldQ.answer_text, images: oldQ.images || [] };
            if (typeof notify === "function") notify("\u0110ang l\u01B0u...");
            try {
              const _res = await fetch("/api/admin-action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user_id: _u.id, action: "save_question_direct", payload: { question_id: _qid, new_data: _newData, old_data: _oldData } }) });
              const _json = await _res.json().catch(() => ({}));
              if (!_res.ok || _json.error) {
                alert("L\u01B0u tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + (_json.error || _res.status));
                return;
              }
            } catch (_err) {
              alert("L\u1ED7i k\u1EBFt n\u1ED1i khi l\u01B0u: " + _err.message);
              return;
            }
            if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
            $2("editModal")?.classList.add("hidden");
            if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u tr\u1EF1c ti\u1EBFp \u2713");
            if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly(true);
            else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase(true);
            return;
          }
          await window.HODSupabase.submitEditRequest(editDraft, oldQ);
          return;
        }
        return old();
      };
      const _saveBtn = $2("saveEdit");
      if (_saveBtn) _saveBtn.onclick = saveEditor;
    }
    function patchSignOut() {
      if (window.__hubPatchSignoutMerged || !window.HODSupabase?.signOut) return;
      window.__hubPatchSignoutMerged = true;
      const old = window.HODSupabase.signOut.bind(window.HODSupabase);
      window.HODSupabase.signOut = async function() {
        setSubject2("");
        return old();
      };
    }
    function ensureChangeBtn() {
      if (!$2("hodChangeSubjectBtn")) return;
      $2("hodChangeSubjectBtn").onclick = (e) => {
        e?.preventDefault?.();
        openGate(true);
      };
    }
    function isApproved() {
      const p = window.HODSupabase?.getProfile?.() || null;
      return !p || p.approved !== false;
    }
    function bind() {
      ensureChip();
      ensureChangeBtn();
      patchSubmit();
      patchSave();
      patchSignOut();
      syncSubjectTexts2();
      $2("subjectRefresh")?.addEventListener("click", () => refreshSubjects(true));
      $2("subjectSearch")?.addEventListener("input", renderSubjects2);
      $2("subjectEnter")?.addEventListener("click", enterSubject);
      $2("subjectLogout")?.addEventListener("click", logoutGate);
      const runSubjectCheckOnce = () => {
        if (window.__LHCheckedOnce) return;
        if (!logged() || !isApproved()) return;
        window.__LHCheckedOnce = true;
        syncSubjectTexts2();
        const isGateOpen = localStorage.getItem("learninghub_subject_gate_open_v1") === "true";
        if (subjectCode() && !isGateOpen) {
          syncUserSubjectToProfile2(subjectCode());
          loadBySubject(subjectCode());
        } else {
          openGate();
        }
      };
      window.__LHTriggerSubjectCheck = runSubjectCheckOnce;
      runSubjectCheckOnce();
      setTimeout(runSubjectCheckOnce, 800);
    }
    window.getSubjectsCache = () => subjectsCache;
    window.loadBySubject = loadBySubject;
    window.setSubject = setSubject2;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();
  (function() {
    const HUB_URL = window.APP_CONFIG?.SUPABASE_URL || "";
    const HUB_KEY = window.APP_CONFIG?.SUPABASE_ANON_KEY || "";
    const $2 = (id) => document.getElementById(id);
    let supa = null;
    function client() {
      if (!window.supabase) return null;
      if (!supa) supa = window.supabase.createClient(HUB_URL, HUB_KEY);
      return supa;
    }
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function isLoggedIn() {
      return !!window.HODSupabase?.getUser?.();
    }
    function isAdminOrEditor() {
      const p = window.HODSupabase?.getProfile?.() || null;
      const role = String(p?.role || "").toLowerCase();
      return isLoggedIn() && (role === "admin" || role === "editor") && !(p?.blocked || p?.is_blocked || p?.status === "blocked");
    }
    function canAdd() {
      const p = window.HODSupabase?.getProfile?.() || null;
      return isLoggedIn() && !(p?.blocked || p?.is_blocked || p?.status === "blocked");
    }
    function injectStyles() {
      if ($2("subjectTabsStyle")) return;
      const style = document.createElement("style");
      style.id = "subjectTabsStyle";
      style.textContent = `
      .subjectGateTabs {
        display: flex;
        gap: 6px;
        margin: -5px 0 15px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 0;
      }
      .subjectGateTab {
        background: none;
        border: none;
        color: var(--mist, #a0aec0);
        padding: 10px 18px;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .subjectGateTab.active {
        color: var(--gold, #e8d4a8);
        border-bottom: 2px solid var(--gold, #e8d4a8);
      }
      .userAddSubjectWrap {
        animation: fadeInPane 0.25s ease-out;
        padding-top: 5px;
      }
      @keyframes fadeInPane {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
      document.head.appendChild(style);
    }
    window.__switchSubjectGateTab = function(mode) {
      const isAdd = mode === "add";
      localStorage.setItem("learninghub_subject_gate_tab_v1", mode);
      document.querySelectorAll(".subjectGateTab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.sgtab === mode);
      });
      const listElements = [
        document.querySelector(".subjectGateSubline"),
        document.querySelector(".subjectGateTools"),
        $2("subjectList"),
        $2("subjectLoading"),
        $2("subjectError"),
        $2("subjectEmpty"),
        document.querySelector(".subjectGateFooter")
      ];
      listElements.forEach((el) => {
        if (el) el.style.setProperty("display", isAdd ? "none" : "", isAdd ? "important" : "");
      });
      const form = $2("addSubjectForm");
      if (form) {
        form.classList.toggle("hidden", !isAdd);
        if (isAdd) {
          form.innerHTML = getAddSubjectHTML();
          parsedQuestions = [];
          restoreAddSubjectState();
        }
      }
    };
    function ensureSubjectGateTabs() {
      const panel = document.querySelector(".polishedSubjectPanel");
      const header = document.querySelector(".subjectGateHeader");
      if (!panel || !header || $2("subjectGateTabsBar")) return;
      injectStyles();
      const tabsBar = document.createElement("div");
      tabsBar.id = "subjectGateTabsBar";
      tabsBar.className = "subjectGateTabs";
      tabsBar.innerHTML = `
      <button type="button" class="subjectGateTab active" data-sgtab="list">Danh s\xE1ch m\xF4n h\u1ECDc</button>
      <button type="button" class="subjectGateTab" id="subjectGateTabAdd" data-sgtab="add" style="display:none;">Th\xEAm m\xF4n m\u1EDBi</button>
    `;
      header.insertAdjacentElement("afterend", tabsBar);
      tabsBar.querySelectorAll(".subjectGateTab").forEach((btn) => {
        btn.onclick = () => window.__switchSubjectGateTab(btn.dataset.sgtab);
      });
      const savedTab = localStorage.getItem("learninghub_subject_gate_tab_v1") || "list";
      if (savedTab === "add" && canAdd()) {
        window.__switchSubjectGateTab("add");
      } else {
        window.__switchSubjectGateTab("list");
      }
    }
    function showAddBtn() {
      ensureSubjectGateTabs();
      const btn = $2("addSubjectBtn");
      const tabBtn = $2("subjectGateTabAdd");
      const allowed = canAdd();
      if (btn) btn.classList.toggle("hidden", !allowed);
      const note = $2("userApprovalNote");
      if (note) {
        note.style.setProperty("display", allowed && !isAdminOrEditor() ? "block" : "none", "important");
      }
      if (tabBtn) {
        const wasHidden = tabBtn.style.display === "none";
        tabBtn.style.display = allowed ? "block" : "none";
        if (allowed && wasHidden) {
          const savedTab = localStorage.getItem("learninghub_subject_gate_tab_v1") || "list";
          if (savedTab === "add") {
            window.__switchSubjectGateTab("add");
          }
        }
      }
    }
    const AI_PROMPT = `B\u1EA1n l\xE0 tr\u1EE3 l\xFD chuy\u1EC3n \u0111\u1ED5i ng\xE2n h\xE0ng c\xE2u h\u1ECFi tr\u1EAFc nghi\u1EC7m sang JSON trong file Markdown.

\u0110\u1ECCC FILE v\xE0 chuy\u1EC3n \u0111\u1ED5i NGUY\xCAN V\u1EB8N (KH\xD4NG t\u1EF1 bi\xEAn th\xEAm, KH\xD4NG b\u1ECF b\u1EDBt).

QUY T\u1EAEC BATCH:

- Sau m\u1ED7i batch D\u1EEANG v\xE0 n\xF3i: "G\xF5 'ti\u1EBFp' \u0111\u1EC3 xu\u1EA5t c\xE2u X-Y."
- Khi nh\u1EADn "ti\u1EBFp", xu\u1EA5t batch ti\u1EBFp theo, \u0111\xE1nh s\u1ED1 "num" li\xEAn t\u1EE5c.
- M\u1ED7i batch xu\u1EA5t 1 file .md ho\xE0n ch\u1EC9nh, t\u1EA3i \u0111\u01B0\u1EE3c ngay.

QUY T\u1EAEC CHUY\u1EC2N \u0110\u1ED4I:
- \u0110\xE1p \xE1n: ch\u1EC9 l\u1EA5y k\xFD t\u1EF1 ch\u1EEF c\xE1i \u0111\u1EA7u ti\xEAn sau "**\u0110\xE1p \xE1n:**" (b\u1ECF m\u1ECDi ch\xFA th\xEDch ph\xEDa sau).
- N\u1EBFu c\xE2u ch\u1EC9 c\xF3 A/B/C (kh\xF4ng c\xF3 D): b\u1ECF key "D" kh\u1ECFi object options.
- Gi\u1EEF NGUY\xCAN n\u1ED9i dung c\xE2u h\u1ECFi v\xE0 l\u1EF1a ch\u1ECDn, KH\xD4NG paraphrase.
- "has_image": false (tr\u1EEB khi c\xE2u \u0111\u1EC1 c\u1EADp h\xECnh \u1EA3nh/bi\u1EC3u \u0111\u1ED3).
- "error_risk": "low" (c\xE2u ng\u1EAFn, r\xF5) | "medium" (c\xE2u trung b\xECnh) | "high" (c\xE2u d\xE0i, ph\u1EE9c t\u1EA1p, d\u1EC5 nh\u1EA7m).

FORMAT FILE .MD OUTPUT:
---
# [T\xEAn m\xF4n] - Batch [N] (C\xE2u [X]-[Y])
> Xu\u1EA5t ng\xE0y: [ng\xE0y h\xF4m nay] | T\u1ED5ng: [s\u1ED1 c\xE2u trong batch] c\xE2u
---

\`\`\`json
[
  {
    "num": 1,
    "question": "\u2026?",
    "options": {
      "A": "\u2026",
      "B": "\u2026",
      "C": "\u2026",
      "D": "\u2026"
    },
    "answer": "B",
    "images": [],
    "has_image": false,
    "error_risk": "low"
  }
]
\`\`\`
---

KH\xD4NG th\xEAm b\u1EA5t k\u1EF3 text gi\u1EA3i th\xEDch n\xE0o b\xEAn ngo\xE0i c\u1EA5u tr\xFAc tr\xEAn.
B\u1EAFt \u0111\u1EA7u ngay t\u1EEB c\xE2u 1.`;
    window.__ADD_SUBJECT_AI_PROMPT = AI_PROMPT;
    let parsedQuestions = [];
    function clearAddSubjectLocalStorage() {
      localStorage.removeItem("learninghub_add_subject_code_v1");
      localStorage.removeItem("learninghub_add_subject_name_v1");
      localStorage.removeItem("learninghub_add_subject_desc_v1");
      localStorage.removeItem("learninghub_add_subject_step_v1");
      localStorage.removeItem("learninghub_add_subject_file_name_v1");
      localStorage.removeItem("learninghub_add_subject_file_size_v1");
      localStorage.removeItem("learninghub_add_subject_file_data_v1");
      localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
    }
    function restoreAddSubjectState() {
      const code = localStorage.getItem("learninghub_add_subject_code_v1") || "";
      const name = localStorage.getItem("learninghub_add_subject_name_v1") || "";
      const desc = localStorage.getItem("learninghub_add_subject_desc_v1") || "";
      const savedStep = parseInt(localStorage.getItem("learninghub_add_subject_step_v1") || "1");
      const codeInp = $2("addSubjectCode");
      const nameInp = $2("addSubjectName");
      const descInp = $2("addSubjectDesc");
      if (codeInp) codeInp.value = code;
      if (nameInp) nameInp.value = name;
      if (descInp) descInp.value = desc;
      codeInp?.addEventListener("input", function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
        localStorage.setItem("learninghub_add_subject_code_v1", this.value);
      });
      nameInp?.addEventListener("input", function() {
        localStorage.setItem("learninghub_add_subject_name_v1", this.value);
      });
      descInp?.addEventListener("input", function() {
        localStorage.setItem("learninghub_add_subject_desc_v1", this.value);
      });
      const fileName = localStorage.getItem("learninghub_add_subject_file_name_v1");
      const fileSize = localStorage.getItem("learninghub_add_subject_file_size_v1");
      const fileData = localStorage.getItem("learninghub_add_subject_file_data_v1");
      if (fileName && fileData) {
        if ($2("userImportData")) $2("userImportData").value = fileData;
        const dropZone = $2("importDropZone");
        const card = $2("userImportFileCard");
        const nameEl = $2("userImportFileName");
        const metaEl = $2("userImportFileMeta");
        if (dropZone) dropZone.classList.add("hidden");
        if (card) card.classList.remove("hidden");
        if (nameEl) nameEl.textContent = fileName;
        if (metaEl) metaEl.textContent = Math.max(1, Math.round(parseInt(fileSize || "0") / 1024)) + " KB \xB7 S\u1EB5n s\xE0ng xem tr\u01B0\u1EDBc";
        const pv = $2("previewImportBtn");
        if (pv) {
          pv.classList.remove("hidden");
          pv.disabled = false;
        }
        const wasPreviewed = localStorage.getItem("learninghub_add_subject_file_previewed_v1") === "true";
        if (wasPreviewed) {
          setTimeout(() => {
            if (typeof window.__previewUserImport === "function") {
              window.__previewUserImport();
            }
          }, 100);
        }
      }
      $2("userImportFile")?.addEventListener("change", handleFileImport);
      if (savedStep > 1 && code && name) {
        setTimeout(() => {
          window.__switchStep(savedStep);
        }, 50);
      }
    }
    function getAddSubjectHTML() {
      return `<div class="userAddSubjectWrap">
      <div class="subject-stepper" id="subjectStepper">
        <div class="step active" data-step="1"><span>1</span> Th\xF4ng tin</div>
        <div class="step-line"></div>
        <div class="step" data-step="2"><span>2</span> L\u1EA5y Prompt</div>
        <div class="step-line"></div>
        <div class="step" data-step="3"><span>3</span> Import</div>
      </div>

      <div id="addStep1" class="add-step-content active">
        <div class="addSubjectFields">
          <div class="addSubjectField">
            <label>M\xE3 m\xF4n <span class="req">*</span></label>
            <input id="addSubjectCode" type="text" placeholder="VD: ABC123" maxlength="20">
          </div>
          <div class="addSubjectField">
            <label>T\xEAn m\xF4n <span class="req">*</span></label>
            <input id="addSubjectName" type="text" placeholder="VD: T\xEAn m\xF4n h\u1ECDc" maxlength="100">
          </div>
          <div class="addSubjectField full">
            <label>M\xF4 t\u1EA3 ng\u1EAFn</label>
            <textarea id="addSubjectDesc" placeholder="M\xF4 t\u1EA3 m\xF4n h\u1ECDc..." rows="2" maxlength="300"></textarea>
          </div>
        </div>
        <div class="step-actions right">
          <button class="primary" type="button" onclick="window.__switchStep(2)">Ti\u1EBFp t\u1EE5c \u2794</button>
        </div>
      </div>

      <div id="addStep2" class="add-step-content">
        <div class="aiStepCard" style="margin-bottom:0;">
          <p>Copy prompt d\u01B0\u1EDBi \u0111\xE2y v\xE0 d\xE1n v\xE0o AI (Gemini/ChatGPT/Claude) k\xE8m theo t\xE0i li\u1EC7u m\xF4n h\u1ECDc c\u1EE7a b\u1EA1n.</p>
        </div>
        
        <div class="aiPromptActions">
          <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">\u{1F4CB} Sao ch\xE9p prompt</button>
          <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">\u{1F441} Xem prompt</button>
        </div>

        <div class="aiToolLinks" style="margin-bottom: 25px;">
          <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">\u2726 Gemini</a>
          <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">\u25C9 ChatGPT</a>
          <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">\u25C8 Claude</a>
        </div>

        <div class="step-actions">
          <button class="btn" type="button" onclick="window.__switchStep(1)">\u2B05 Quay l\u1EA1i</button>
          <button class="primary" type="button" onclick="window.__switchStep(3)">\u0110\xE3 c\xF3 file, Ti\u1EBFp t\u1EE5c \u2794</button>
        </div>
      </div>

      <div id="addStep3" class="add-step-content">
        <div class="importUnifiedBox">
          <div class="userFileInputWrap" id="importDropZone" onclick="document.getElementById('userImportFile').click()">
            <span class="icon">\u2601\uFE0F</span>
            <p><b>K\xE9o th\u1EA3 file .md ho\u1EB7c .txt v\xE0o \u0111\xE2y</b><br><span style="font-size:0.85rem; opacity:0.6;">Ho\u1EB7c b\u1EA5m \u0111\u1EC3 ch\u1ECDn file t\u1EEB m\xE1y</span></p>
            <input type="file" id="userImportFile" accept=".md,.txt,.json" style="display:none;">
          </div>

          <textarea id="userImportData" class="hiddenImportData" aria-hidden="true"></textarea>
          <div id="userImportFileCard" class="userImportFileCard hidden">
            <div class="fileIcon">\u{1F4C4}</div>
            <div class="fileInfo">
              <b id="userImportFileName">Ch\u01B0a ch\u1ECDn file</b>
              <span id="userImportFileMeta">File import c\xE2u h\u1ECFi</span>
            </div>
            <button class="removeFileBtn" type="button" onclick="window.__clearUserImportFile()">X\xF3a file</button>
          </div>

          <div class="step-actions importStepActions">
            <button class="btn" type="button" onclick="window.__switchStep(2)">\u2B05 Quay l\u1EA1i</button>
            <div>
              <button class="btn previewImportBtn hidden" type="button" id="previewImportBtn" onclick="window.__previewUserImport()">Xem tr\u01B0\u1EDBc</button>
              <button class="primary" type="button" id="userImportBtn" onclick="window.__submitSubjectRequest()" disabled>L\u01B0u M\xF4n H\u1ECDc</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="userApprovalNote" id="userApprovalNote" style="margin-top:15px; display:none;">\u23F3 Y\xEAu c\u1EA7u s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi cho admin duy\u1EC7t tr\u01B0\u1EDBc.</div>
    </div>`;
    }
    window.__switchStep = function(step) {
      if (step >= 2) {
        const code = (document.getElementById("addSubjectCode")?.value || "").trim();
        const name = (document.getElementById("addSubjectName")?.value || "").trim();
        if (!code) {
          alert("Vui l\xF2ng nh\u1EADp m\xE3 m\xF4n tr\u01B0\u1EDBc khi ti\u1EBFp t\u1EE5c.");
          document.getElementById("addSubjectCode")?.focus();
          return;
        }
        if (!name) {
          alert("Vui l\xF2ng nh\u1EADp t\xEAn m\xF4n tr\u01B0\u1EDBc khi ti\u1EBFp t\u1EE5c.");
          document.getElementById("addSubjectName")?.focus();
          return;
        }
      }
      localStorage.setItem("learninghub_add_subject_step_v1", step);
      document.querySelectorAll(".add-step-content").forEach((el) => el.classList.remove("active"));
      const target = document.getElementById("addStep" + step);
      if (target) target.classList.add("active");
      document.querySelectorAll(".subject-stepper .step").forEach((el) => {
        const s = parseInt(el.getAttribute("data-step"));
        if (s <= step) el.classList.add("active");
        else el.classList.remove("active");
      });
      if (step === 3 && !window._dropZoneInit) {
        const dropZone = document.getElementById("importDropZone");
        const fileInput = document.getElementById("userImportFile");
        if (dropZone && fileInput) {
          ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) => {
            dropZone.addEventListener(evt, (e) => {
              e.preventDefault();
              e.stopPropagation();
            }, false);
          });
          ["dragenter", "dragover"].forEach((evt) => {
            dropZone.addEventListener(evt, () => dropZone.classList.add("dragover"), false);
          });
          ["dragleave", "drop"].forEach((evt) => {
            dropZone.addEventListener(evt, () => dropZone.classList.remove("dragover"), false);
          });
          dropZone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length) {
              const one = new DataTransfer();
              one.items.add(dt.files[0]);
              fileInput.files = one.files;
              fileInput.dispatchEvent(new Event("change"));
            }
          }, false);
          window._dropZoneInit = true;
        }
      }
    };
    function handleFileImport(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function() {
        const text = reader.result;
        let jsonStr = text;
        const mdMatch = text.match(/```json\s*([\s\S]*?)```/);
        if (mdMatch) jsonStr = mdMatch[1];
        else {
          const jsonMatch = text.match(/```\s*([\s\S]*?)```/);
          if (jsonMatch) jsonStr = jsonMatch[1];
        }
        const cleanedData = jsonStr.trim();
        if ($2("userImportData")) $2("userImportData").value = cleanedData;
        localStorage.setItem("learninghub_add_subject_file_name_v1", file.name);
        localStorage.setItem("learninghub_add_subject_file_size_v1", String(file.size));
        localStorage.setItem("learninghub_add_subject_file_data_v1", cleanedData);
        localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
        const dropZone = $2("importDropZone");
        const card = $2("userImportFileCard");
        const nameEl = $2("userImportFileName");
        const metaEl = $2("userImportFileMeta");
        if (dropZone) dropZone.classList.add("hidden");
        if (card) card.classList.remove("hidden");
        if (nameEl) nameEl.textContent = file.name;
        if (metaEl) metaEl.textContent = Math.max(1, Math.round(file.size / 1024)) + " KB \xB7 S\u1EB5n s\xE0ng xem tr\u01B0\u1EDBc";
        const pv = $2("previewImportBtn");
        if (pv) {
          pv.classList.remove("hidden");
          pv.disabled = false;
        }
        const saveBtn = $2("userImportBtn");
        if (saveBtn) saveBtn.disabled = true;
        parsedQuestions = [];
        notify("\u0110\xE3 \u0111\u1ECDc file " + file.name + ". B\u1EA5m Xem tr\u01B0\u1EDBc \u0111\u1EC3 ki\u1EC3m tra.");
      };
      reader.readAsText(file);
    }
    window.__LHConvertQuizlet = function(raw) {
      function scanNeedsImage(t) {
        return /(hình vẽ|hình bên|hình sau|đồ thị|bảng biến thiên|sơ đồ|xem hình|picture shows|shows an image|this (picture|image|figure)|the (image|figure|picture|diagram) (below|above)|following (image|figure|picture|diagram)|shown below|pictured|in the (picture|image|figure))/i.test(String(t || ""));
      }
      function parseTerm(term, def) {
        var re = /([A-Fa-f])\.(?=\s|[A-Z])/g, m, marks = [];
        while ((m = re.exec(term)) !== null) marks.push({ L: m[1].toUpperCase(), idx: m.index, end: m.index + 2 });
        var seq = [], expect = 65;
        marks.forEach(function(mk) {
          if (mk.L === String.fromCharCode(expect)) {
            seq.push(mk);
            expect++;
          }
        });
        if (seq.length < 2) return null;
        var question = term.slice(0, seq[0].idx).trim(), options = {};
        for (var i = 0; i < seq.length; i++) {
          var s = seq[i].end, e = i + 1 < seq.length ? seq[i + 1].idx : term.length;
          options[seq[i].L] = term.slice(s, e).trim().replace(/\s+/g, " ").replace(/\.$/, "").trim();
        }
        var ams = (String(def || "").match(/(?:^|\s)([A-Fa-f])\.(?=\s|[A-Z]|$)/g) || []).map(function(x) {
          return x.trim()[0].toUpperCase();
        });
        var answer = ams.length ? Array.from(new Set(ams)).join("") : String(def || "").toUpperCase().replace(/[^A-F]/g, "");
        answer = Array.from(answer).filter(function(a) {
          return options[a];
        }).join("");
        if (!question || !answer) return null;
        return { question, options, answer };
      }
      var terms = null;
      try {
        var j = JSON.parse(raw);
        if (j && Array.isArray(j.terms)) terms = j.terms.map(function(t) {
          return { term: t.term, def: t.definition };
        });
        else if (Array.isArray(j) && j.length && j[0] && "term" in j[0] && "definition" in j[0]) terms = j.map(function(t) {
          return { term: t.term, def: t.definition };
        });
      } catch (e) {
      }
      if (!terms) {
        var rows = [];
        raw.split(/\r?\n/).forEach(function(ln) {
          if (!ln.trim().startsWith("|")) return;
          var c = ln.split("|").map(function(s) {
            return s.trim();
          });
          if (!c[1] || c[1] === "Term" || /^-+$/.test(c[1])) return;
          rows.push({ term: c[1], def: c[2] });
        });
        if (rows.length) terms = rows;
      }
      if (!terms || !terms.length) return null;
      var out = [], seen = {};
      terms.forEach(function(t) {
        var p = parseTerm(String(t.term || ""), String(t.def || ""));
        if (!p) return;
        var key = p.question.toLowerCase().replace(/\s+/g, " ").slice(0, 90);
        if (seen[key]) return;
        seen[key] = 1;
        var needImg = scanNeedsImage(p.question + " " + Object.values(p.options).join(" "));
        out.push({ question: p.question, options: p.options, answer: p.answer, images: [], has_image: needImg, error_risk: "low", error_risk_reason: "" });
      });
      return out.length ? out : null;
    };
    window.__previewUserImport = function() {
      const raw = ($2("userImportData")?.value || "").trim();
      const btn = $2("userImportBtn");
      if (!raw) {
        alert("B\u1EA1n h\xE3y ch\u1ECDn file .md / .txt / .json tr\u01B0\u1EDBc.");
        return;
      }
      let data;
      try {
        var quizletData = window.__LHConvertQuizlet ? window.__LHConvertQuizlet(raw) : null;
        if (quizletData && quizletData.length) {
          data = quizletData;
        } else {
          var jsonBlocks = raw.match(/```json\s*([\s\S]*?)```/g);
          if (jsonBlocks && jsonBlocks.length > 0) {
            data = [];
            jsonBlocks.forEach(function(block) {
              var cleaned2 = block.replace(/^```json\s*/, "").replace(/```\s*$/, "");
              var parsed = JSON.parse(cleaned2);
              if (Array.isArray(parsed)) data = data.concat(parsed);
              else if (parsed.questions && Array.isArray(parsed.questions)) data = data.concat(parsed.questions);
            });
          } else {
            var cleaned = raw;
            if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\w*\s*/, "").replace(/```\s*$/, "");
            data = JSON.parse(cleaned);
          }
        }
      } catch (e) {
        localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
        alert("JSON kh\xF4ng h\u1EE3p l\u1EC7. H\xE3y ki\u1EC3m tra l\u1EA1i format.\n\nL\u1ED7i: " + e.message);
        return;
      }
      if (!Array.isArray(data)) {
        if (data.questions && Array.isArray(data.questions)) data = data.questions;
        else {
          localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
          alert("D\u1EEF li\u1EC7u ph\u1EA3i l\xE0 m\u1EA3ng JSON [...]");
          return;
        }
      }
      const errors = [];
      data.forEach((q, i) => {
        if (!q.question) errors.push("C\xE2u " + (i + 1) + ': thi\u1EBFu "question"');
        if (!q.options || typeof q.options !== "object") errors.push("C\xE2u " + (i + 1) + ': thi\u1EBFu "options"');
        if (!q.answer) errors.push("C\xE2u " + (i + 1) + ': thi\u1EBFu "answer"');
      });
      if (errors.length) {
        localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
        alert("D\u1EEF li\u1EC7u c\xF3 l\u1ED7i:\n\n" + errors.slice(0, 10).join("\n"));
        return;
      }
      localStorage.setItem("learninghub_add_subject_file_previewed_v1", "true");
      parsedQuestions = data;
      window.__previewSelections = {};
      const metaEl = $2("userImportFileMeta");
      if (metaEl) metaEl.textContent = data.length + " c\xE2u h\u1ECFi \u0111\xE3 ki\u1EC3m tra \xB7 C\xF3 th\u1EC3 l\u01B0u";
      if (btn) btn.disabled = false;
      window.__openImportPreviewModal(data);
      notify("OK! " + data.length + " c\xE2u h\u1ECFi s\u1EB5n s\xE0ng");
    };
    window.__closeImportPreviewModal = function() {
      document.getElementById("importPreviewModal")?.classList.add("hidden");
    };
    window.__submitSubjectRequest = async function() {
      const code = ($2("addSubjectCode")?.value || "").trim().toUpperCase();
      const name = ($2("addSubjectName")?.value || "").trim();
      const desc = ($2("addSubjectDesc")?.value || "").trim();
      if (!code) {
        alert("Vui l\xF2ng nh\u1EADp m\xE3 m\xF4n");
        $2("addSubjectCode")?.focus();
        return;
      }
      if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
        alert("M\xE3 m\xF4n ch\u1EC9 g\u1ED3m ch\u1EEF, s\u1ED1, g\u1EA1ch d\u01B0\u1EDBi (2-20 k\xFD t\u1EF1)");
        $2("addSubjectCode")?.focus();
        return;
      }
      if (!name) {
        alert("Vui l\xF2ng nh\u1EADp t\xEAn m\xF4n");
        $2("addSubjectName")?.focus();
        return;
      }
      if (!parsedQuestions.length) {
        alert("B\u1EA1n c\u1EA7n ch\u1ECDn file v\xE0 b\u1EA5m Xem tr\u01B0\u1EDBc tr\u01B0\u1EDBc khi l\u01B0u m\xF4n h\u1ECDc.");
        return;
      }
      const c = client();
      if (!c) {
        alert("Ch\u01B0a k\u1EBFt n\u1ED1i Supabase");
        return;
      }
      const btn = $2("userImportBtn");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang l\u01B0u...";
      }
      showProgress("B\u1EAFt \u0111\u1EA7u kh\u1EDFi t\u1EA1o m\xF4n h\u1ECDc...", 0, 100, "\u0110ang chu\u1EA9n b\u1ECB d\u1EEF li\u1EC7u...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        let successMsg = "";
        if (isAdminOrEditor()) {
          showProgress("\u0110ang l\u01B0u m\xF4n h\u1ECDc...", 50, 100, "\u0110ang t\u1EA1o m\xF4n v\xE0 nh\u1EADp c\xE2u h\u1ECFi l\xEAn m\xE1y ch\u1EE7...");
          const u0 = window.HODSupabase?.getUser?.();
          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: u0?.id, action: "add_subject", payload: { code, name: name || code, description: desc || "", questions: parsedQuestions || [] } }) });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || out.error) {
            alert("L\u1ED7i t\u1EA1o m\xF4n: " + (out.error || res.status));
            return;
          }
          const finalCode = out.code || code;
          const success = (parsedQuestions || []).length;
          successMsg = "\u0110\xE3 th\xEAm m\xF4n " + finalCode + " v\u1EDBi " + success + " c\xE2u h\u1ECFi";
          try {
            const key = "learninghub_subject_counts_cache_v3";
            const store = JSON.parse(localStorage.getItem(key) || "{}") || {};
            store.counts = store.counts || {};
            store.confirmed = store.confirmed || {};
            store.counts[finalCode] = success;
            store.confirmed[finalCode] = true;
            store.updated_at = (/* @__PURE__ */ new Date()).toISOString();
            localStorage.setItem(key, JSON.stringify(store));
            localStorage.setItem("learninghub_subjects_dirty_v3", String(Date.now()));
            localStorage.removeItem("learninghub_subjects_cache_v1");
            sessionStorage.removeItem("learninghub_subject_counts_cache_v1");
            window.clearLearningHubSupabaseCache?.("subjects");
            window.clearLearningHubSupabaseCache?.("questions");
          } catch (e) {
          }
          alert(successMsg);
          notify(successMsg);
          window.__switchSubjectGateTab("list");
          try {
            $2("subjectRefresh")?.click();
            setTimeout(() => $2("subjectRefresh")?.click(), 5600);
            setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
          } catch (e) {
          }
        } else {
          showProgress("\u0110ang g\u1EEDi y\xEAu c\u1EA7u t\u1EA1o m\xF4n h\u1ECDc...", 50, 100, "\u0110ang t\u1EA3i d\u1EEF li\u1EC7u c\xE2u h\u1ECFi l\xEAn m\xE1y ch\u1EE7...");
          await new Promise((resolve) => setTimeout(resolve, 100));
          const u = window.HODSupabase?.getUser?.();
          const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: u?.id, action: "add_subject_request", payload: { code, name, description: desc || "", questions_data: parsedQuestions || [] } }) });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || out.error) {
            alert("L\u1ED7i g\u1EEDi y\xEAu c\u1EA7u: " + (out.error || res.status));
            return;
          }
          successMsg = "\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u th\xEAm m\xF4n " + code + ". Vui l\xF2ng ch\u1EDD admin duy\u1EC7t.";
          alert(successMsg);
          notify(successMsg);
          window.__switchSubjectGateTab("list");
        }
        parsedQuestions = [];
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        clearAddSubjectLocalStorage();
      } catch (e) {
        console.warn("Add subject error:", e);
        alert("L\u1ED7i khi l\u01B0u m\xF4n h\u1ECDc: " + (e?.message || e));
        notify("L\u1ED7i khi l\u01B0u m\xF4n h\u1ECDc");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "L\u01B0u M\xF4n H\u1ECDc";
        }
        hideProgress();
      }
    };
    window.__closeAddSubject = function() {
      window.__switchSubjectGateTab("list");
    };
    function bind() {
      $2("addSubjectBtn")?.addEventListener("click", () => window.__switchSubjectGateTab("add"));
      showAddBtn();
      setInterval(showAddBtn, 2e3);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();
  (function() {
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    const $2 = (id) => document.getElementById(id);
    const code = () => localStorage.getItem(SUBJECT_STORE2) || "";
    const supa = () => window.HODSupabase?.__client || null;
    const logged = () => !!window.HODSupabase?.getUser?.();
    function empty(msg) {
      try {
        RAW = [];
        pool = [];
        ci = 0;
        flipped = false;
        randomActive = false;
        localStorage.setItem("hod102_random_active", "0");
      } catch (e) {
      }
      try {
        if ($2("idx")) $2("idx").textContent = "0";
        if ($2("total")) $2("total").textContent = "0";
        if ($2("bar")) $2("bar").style.width = "0%";
        if ($2("question")) $2("question").textContent = msg || "Ch\u01B0a t\u1EA3i d\u1EEF li\u1EC7u t\u1EEB Supabase";
        if ($2("options")) $2("options").innerHTML = "";
        if ($2("images")) $2("images").innerHTML = "";
        renderQuiz?.();
        renderStudy?.();
      } catch (e) {
      }
    }
    async function loadSubjectOnly() {
      const subject = code();
      if (!logged()) {
        empty("\u0110\u0103ng nh\u1EADp \u0111\u1EC3 t\u1EA3i d\u1EEF li\u1EC7u t\u1EEB Turso");
        return false;
      }
      if (!subject) {
        empty("Ch\u1ECDn m\xF4n \u0111\u1EC3 t\u1EA3i d\u1EEF li\u1EC7u t\u1EEB Turso");
        return false;
      }
      const p = window.HODSupabase?.getProfile?.() || null;
      if (p && (p.approved === false || p.approved === 0 || p.approved === "0")) {
        empty("T\xE0i kho\u1EA3n \u0111ang ch\u1EDD duy\u1EC7t");
        return false;
      }
      try {
        const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(subject) + "&ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c questions t\u1EEB Turso");
        const data = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        RAW = data.map((r) => ({ id: r.id, subject_code: r.subject_code || subject, num: r.num, question: r.question, options: r.options || {}, answer: r.answer, answer_text: r.answer_text, images: typeof cleanImages === "function" ? cleanImages(r.images || []) : r.images || [], has_image: !!(r.has_image || (r.images || []).length), error_risk: r.error_risk || "low", error_risk_reason: r.error_risk_reason || "", __imagesChecked: true, __imagesLoaded: true }));
        pool = [...RAW];
        var _saved2 = +localStorage.getItem("learninghub_progress_" + subject) || 0;
        ci = Math.max(0, Math.min(_saved2, Math.max(0, pool.length - 1)));
        flipped = false;
        randomActive = false;
        localStorage.setItem("hod102_random_active", "0");
        try {
          if ($2("total")) $2("total").textContent = String(RAW.length);
          renderCard();
          renderQuiz();
          renderStudy();
          syncSubjectTexts?.();
          updateCardTools?.();
        } catch (e) {
          console.warn("[Turso render]", e);
        }
        return true;
      } catch (e) {
        console.warn("[Turso current subject]", e);
        empty("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u Turso");
        return false;
      }
    }
    window.loadCurrentSubjectOnly = loadSubjectOnly;
    function patchLoaders() {
      try {
        window.rebuild = function() {
          RAW = [];
          pool = [];
          return RAW;
        };
      } catch (e) {
      }
      if (window.HODSupabase) {
        window.HODSupabase.loadQuestionsFromSupabase = loadSubjectOnly;
      }
    }
    function enforceNoLocal() {
      patchLoaders();
      const subject = code();
      try {
        if (!Array.isArray(RAW) || !RAW.length) {
          if (logged() && subject) loadSubjectOnly();
          return;
        }
        if (RAW.some((q) => !q.id || !q.subject_code || q.subject_code !== subject)) loadSubjectOnly();
      } catch (e) {
      }
    }
    document.addEventListener("DOMContentLoaded", () => {
      empty("\u0110ang t\u1EA3i d\u1EEF li\u1EC7u t\u1EEB Turso...");
      patchLoaders();
    });
    patchLoaders();
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function hide() {
      ["shuffle", "stShuffle"].forEach((id) => {
        let e = $2(id);
        if (e) {
          e.style.display = "none";
          e.disabled = true;
          e.onclick = () => false;
        }
      });
      try {
        randomActive = false;
        localStorage.setItem("hod102_random_active", "0");
      } catch (e) {
      }
    }
    window.shuffle = shuffle = function() {
      hide();
      return false;
    };
    document.addEventListener("DOMContentLoaded", () => {
      hide();
      setTimeout(hide, 300);
      setTimeout(hide, 1e3);
    });
    hide();
  })();
  (function() {
    try {
      window.HOD_DATA = [];
    } catch (e) {
    }
    try {
      const dataNode = document.getElementById("data");
      if (dataNode) dataNode.textContent = "[]";
    } catch (e) {
    }
  })();
  if (typeof finalAnswerText !== "function") {
    let finalAnswerText2 = function(c) {
      const raw = String(c?.answer_text ?? "").trim();
      const ans = String(c?.answer ?? "").trim().toUpperCase();
      if (!raw || raw.toUpperCase() === ans || /^[A-E]+$/i.test(raw)) return answerText(c);
      return raw;
    };
  }
  (function() {
    let canvas, ctx, w = 0, h = 0, dpr = 1, parts = [], raf = 0, uxInterval = 0, resizeT = 0, running = false;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function gateActive() {
      const gate = document.getElementById("hodLoginGate");
      return !!gate && !gate.classList.contains("hidden") && getComputedStyle(gate).display !== "none";
    }
    function ensureCanvas() {
      const gate = document.getElementById("hodLoginGate");
      if (!gate || reduce) return null;
      canvas = document.getElementById("landingParticles");
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "landingParticles";
        gate.prepend(canvas);
      }
      ctx = canvas.getContext("2d");
      return gate;
    }
    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init2();
    }
    function resizeDebounced() {
      clearTimeout(resizeT);
      resizeT = setTimeout(resize, 150);
    }
    function init2() {
      const floorCount = w <= 480 ? 26 : w <= 860 ? 40 : 55;
      const count = Math.min(140, Math.max(floorCount, Math.floor(w * h / 14e3)));
      parts = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.7 + Math.random() * 2.4, vx: (Math.random() - 0.5) * 0.22, vy: -0.1 - Math.random() * 0.42, a: 0.18 + Math.random() * 0.55, p: Math.random() * Math.PI * 2, hue: Math.random() < 0.55 ? "255,255,255" : Math.random() < 0.5 ? "255,226,170" : "135,225,255" }));
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      if (uxInterval) {
        clearInterval(uxInterval);
        uxInterval = 0;
      }
    }
    function draw() {
      if (!running) return;
      if (!gateActive()) {
        stop();
        return;
      }
      if (!ctx || document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.p += 0.012;
        p.x += p.vx + Math.sin(p.p) * 0.1;
        p.y += p.vy;
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
        glow.addColorStop(0, `rgba(${p.hue},${p.a})`);
        glow.addColorStop(0.45, `rgba(${p.hue},${p.a * 0.22})`);
        glow.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${p.hue},${Math.min(1, p.a + 0.15)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    function ux() {
      if (!gateActive()) {
        stop();
        return;
      }
      const b = document.getElementById("subjectEnter");
      if (b) b.textContent = "B\u1EAFt \u0111\u1EA7u";
      const i = document.getElementById("subjectSearch");
      if (i) i.placeholder = "T\xECm m\xF4n h\u1ECDc...";
      const l = document.getElementById("subjectLoading"), r = document.getElementById("subjectRefresh");
      if (l && r) {
        const on = !l.classList.contains("hidden");
        r.classList.toggle("is-loading", on);
        r.setAttribute("aria-busy", on ? "true" : "false");
      }
    }
    function parallax() {
      const g = document.getElementById("hodLoginGate");
      if (!g || g.__particles3d) return;
      g.__particles3d = true;
      g.addEventListener("pointermove", (e) => {
        const r = g.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
        const y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
        g.style.setProperty("--mx", x.toFixed(1) + "%");
        g.style.setProperty("--my", y.toFixed(1) + "%");
      }, { passive: true });
    }
    function boot() {
      ux();
      parallax();
      if (ensureCanvas()) {
        resize();
        cancelAnimationFrame(raf);
        running = true;
        draw();
        if (!uxInterval) uxInterval = setInterval(ux, 150);
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    window.addEventListener("resize", resizeDebounced, { passive: true });
  })();
  (function() {
    const $2 = (id) => document.getElementById(id);
    function prof() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function can() {
      const p = prof();
      return !!p && ["admin", "editor"].includes(p.role) && !(p.blocked || p.is_blocked || p.status === "blocked");
    }
    function cli() {
      return window.HODSupabase?.__client || null;
    }
    function sc() {
      return localStorage.getItem("learninghub_subject_code_merged_v1") || "";
    }
    function build() {
      editDraft.question = ($2("editQuestion")?.value || "").trim();
      editDraft.answer = ($2("editAnswer")?.value || "").trim().toUpperCase();
      const ops = {};
      document.querySelectorAll("[data-opt]").forEach((t) => {
        if ((t.value || "").trim()) ops[t.dataset.opt] = t.value.trim();
      });
      editDraft.options = ops;
      editDraft.answer_text = typeof answerText === "function" ? answerText(editDraft) : "";
      editDraft.subject_code = sc() || editDraft.subject_code || "";
      editDraft.images = editDraft.images || [];
      return editDraft;
    }
    async function qid(oldQ, draft) {
      if (oldQ?.id) return oldQ.id;
      const c = cli();
      if (!c) return null;
      const code = oldQ?.subject_code || draft?.subject_code || sc(), num = oldQ?.num || draft?.num;
      if (!code || !num) return null;
      const { data, error } = await c.from("questions").select("id").eq("subject_code", code).eq("num", num).maybeSingle();
      return error || !data ? null : data.id;
    }
    async function direct() {
      if (window.__LH_EDIT_IMAGE_UPLOADING > 0) {
        alert("\u1EA2nh \u0111ang upload, ch\u1EDD xong r\u1ED3i b\u1EA5m L\u01B0u.");
        return true;
      }
      if (!window.HODSupabase?.isReady?.()) {
        alert("B\u1EA1n c\u1EA7n \u0111\u0103ng nh\u1EADp tr\u01B0\u1EDBc.");
        return false;
      }
      if (!can()) return false;
      const u = window.HODSupabase?.getUser?.();
      const oldQ = clone(RAW.find((x) => x.num === editDraft.num) || pool[ci] || editDraft);
      const d = build();
      const id = oldQ?.id || await qid(oldQ, d);
      if (!id) {
        alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi tr\xEAn Turso. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
        return true;
      }
      let list = d.images || [];
      if (typeof window.__LHCleanImages === "function") list = window.__LHCleanImages(list);
      list = list.map((im) => {
        if (typeof im === "string") return { src: im, url: im, secure_url: im, source: im.includes("cloudinary.com") ? "cloudinary" : "url" };
        const src = im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "";
        return { ...im, src, url: im.url || src, secure_url: im.secure_url || src };
      }).filter((im) => im && im.src && !String(im.src).startsWith("data:image/"));
      d.images = list;
      const localHasImg = !!(list.length || oldQ.has_image);
      const contentText = d.question + " " + Object.values(d.options || {}).join(" ");
      const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(contentText);
      const hasPlaceholder = list.some((im) => {
        const src = typeof im === "string" ? im : im.src || im.url || im.secure_url || "";
        return !src || src.includes("URL_") || src.includes("M\xD4_T\u1EA2") || src.includes("PLACEHOLDER");
      });
      let risk = "low";
      let reason = "";
      if (localHasImg && hasPlaceholder || needsImg && list.length === 0) {
        risk = "high";
        reason = "C\u1EA7n h\xECnh v\u1EBD/\u1EA3nh minh h\u1ECDa nh\u01B0ng ch\u01B0a c\xF3 \u1EA3nh th\u1EF1c t\u1EBF";
      } else if (d.answer.length > 1) {
        risk = "medium";
        reason = "C\xE2u ch\u1ECDn nhi\u1EC1u \u0111\xE1p \xE1n \u0111\xFAng, c\u1EA7n r\xE0 so\xE1t k\u1EF9";
      }
      const payload = { id, subject_code: d.subject_code || oldQ.subject_code || sc(), num: d.num || oldQ.num, question: d.question, options: d.options || {}, answer: d.answer, answer_text: d.answer_text, images: list, updated_at: (/* @__PURE__ */ new Date()).toISOString(), has_image: localHasImg || needsImg, error_risk: risk, error_risk_reason: reason || null };
      try {
        const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: u?.id, action: "save_question_direct", payload: { question_id: id, new_data: payload, old_data: oldQ } }) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c v\xE0o Turso");
      } catch (error) {
        alert("S\u1EEDa tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + error.message);
        return true;
      }
      if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
      if (typeof window.clearLearningHubSupabaseCache === "function") window.clearLearningHubSupabaseCache("questions");
      try {
        RAW = (RAW || []).map((q) => Number(q.id) === Number(id) || q.subject_code === payload.subject_code && Number(q.num) === Number(payload.num) ? { ...q, ...payload } : q);
        pool = (pool || []).map((q) => Number(q.id) === Number(id) || q.subject_code === payload.subject_code && Number(q.num) === Number(payload.num) ? { ...q, ...payload } : q);
      } catch (e) {
      }
      $2("editModal")?.classList.add("hidden");
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u \u1EA3nh v\xE0o Turso");
      if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly();
      else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
      return true;
    }
    const oldSave = typeof saveEditor === "function" ? saveEditor : null;
    saveEditor = async function() {
      if (can()) {
        const h = await direct();
        if (h) return;
      }
      return oldSave ? oldSave.apply(this, arguments) : void 0;
    };
    window.saveEditor = saveEditor;
    const oldOpen = typeof openEditor === "function" ? openEditor : null;
    openEditor = function() {
      if (oldOpen) oldOpen.apply(this, arguments);
      setTimeout(() => {
        if (can()) {
          if ($2("editTitle")) $2("editTitle").textContent = "S\u1EEDa tr\u1EF1c ti\u1EBFp c\xE2u " + (pool && pool[ci]?.num || "");
          if ($2("saveEdit")) $2("saveEdit").textContent = "L\u01B0u tr\u1EF1c ti\u1EBFp";
          if ($2("restoreEdit")) $2("restoreEdit").classList.remove("hidden");
        }
      }, 0);
    };
    window.openEditor = openEditor;
  })();
  (function() {
    const $2 = (id) => document.getElementById(id);
    const esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const supa = () => window.HODSupabase?.__client || null;
    const user = () => window.HODSupabase?.getUser?.() || null;
    function ensureReportModal() {
      if ($2("hodReportModal")) return;
      const modal = document.createElement("div");
      modal.id = "hodReportModal";
      modal.className = "modal hidden hodReportModal";
      modal.innerHTML = `
      <div class="box hodReportModalBox">
        <button class="modalX" id="hodReportModalClose" type="button" title="\u0110\xF3ng">\xD7</button>
        <div class="hodReportModalHead">
          <div>
            <div class="hodReportModalLabel">B\xC1O C\xC1O \u0110\xC3 G\u1EECI</div>
            <h2>Danh s\xE1ch b\xE1o c\xE1o</h2>
            <p>Xem tr\u1EA1ng th\xE1i c\xE1c b\xE1o c\xE1o/ch\u1EC9nh s\u1EEDa b\u1EA1n \u0111\xE3 g\u1EEDi cho admin.</p>
          </div>
          <button id="hodReportModalReload" class="btn" type="button">T\u1EA3i l\u1EA1i</button>
        </div>
        <div id="hodReportModalList" class="hodReportModalList">Ch\u01B0a t\u1EA3i.</div>
      </div>`;
      document.body.appendChild(modal);
      $2("hodReportModalClose")?.addEventListener("click", () => modal.classList.add("hidden"));
      $2("hodReportModalReload")?.addEventListener("click", loadReportModalList);
      modal.addEventListener("mousedown", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }
    function ensureReportButton() {
      const menu = $2("hodAccountMenu");
      if (!menu) return;
      let box = $2("hodReportBox");
      if (!box) {
        box = document.createElement("div");
        box.id = "hodReportBox";
        box.className = "hodReportBox";
        const logout = $2("hodLogoutBtn");
        logout ? menu.insertBefore(box, logout) : menu.appendChild(box);
      }
      box.innerHTML = `
      <button id="hodOpenReportsBtn" class="hodOpenReportsBtn" type="button">
        <span>B\xE1o c\xE1o \u0111\xE3 g\u1EEDi</span>
        <b>Xem</b>
      </button>`;
      $2("hodOpenReportsBtn")?.addEventListener("click", openReportsTab);
    }
    function statusText(s) {
      return { pending: "\u0110ang ch\u1EDD", approved: "\u0110\xE3 duy\u1EC7t", rejected: "T\u1EEB ch\u1ED1i" }[s] || s || "Kh\xF4ng r\xF5";
    }
    function statusClass(s) {
      return s === "approved" ? "approved" : s === "rejected" ? "rejected" : "pending";
    }
    async function loadReportModalList() {
      ensureReportModal();
      const list = $2("hodReportModalList");
      const c = supa();
      const u = user();
      if (!list) return;
      if (!c || !u) {
        list.innerHTML = '<div class="hodReportEmpty">\u0110\u0103ng nh\u1EADp \u0111\u1EC3 xem b\xE1o c\xE1o.</div>';
        return;
      }
      list.innerHTML = '<div class="hodReportEmpty">\u0110ang t\u1EA3i...</div>';
      const { data, error } = await c.from("edit_requests").select("id,question_num,status,admin_note,created_at").eq("user_id", u.id).order("created_at", { ascending: false }).limit(50);
      if (error) {
        list.innerHTML = '<div class="hodReportEmpty">Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c b\xE1o c\xE1o.</div>';
        return;
      }
      if (!data || !data.length) {
        list.innerHTML = '<div class="hodReportEmpty">B\u1EA1n ch\u01B0a g\u1EEDi b\xE1o c\xE1o n\xE0o.</div>';
        return;
      }
      list.innerHTML = data.map((r) => `
      <div class="hodReportRow">
        <div class="hodReportRowTop">
          <b>C\xE2u ${esc2(r.question_num || "?")}</b>
          <span class="hodReportStatus ${statusClass(r.status)}">${esc2(statusText(r.status))}</span>
        </div>
        <div class="hodReportTime">G\u1EEDi: ${esc2(new Date(r.created_at).toLocaleString("vi-VN"))}</div>
        ${r.admin_note ? `<div class="hodReportNote">Ghi ch\xFA admin: ${esc2(r.admin_note)}</div>` : ""}
      </div>`).join("");
    }
    async function openReportsTab() {
      ensureReportModal();
      $2("hodAccountMenu")?.classList.add("hidden");
      $2("hodReportModal")?.classList.remove("hidden");
      await loadReportModalList();
    }
    function boot() {
      ensureReportModal();
      ensureReportButton();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setInterval(ensureReportButton, 700);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function goPrev() {
      if (typeof prev === "function") prev();
    }
    function goNext() {
      if (typeof next === "function") next();
    }
    const isMobile = () => window.matchMedia("(max-width:760px)").matches;
    function ensureSlideWrap() {
      let wrap = $2("cardSlideWrap");
      if (wrap) return wrap;
      const card = $2("card");
      if (!card || !card.parentNode) return null;
      wrap = document.createElement("div");
      wrap.id = "cardSlideWrap";
      wrap.style.cssText = "position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;min-height:0;flex:1;max-width:100%;margin:0 auto;";
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      return wrap;
    }
    let __sliding = false;
    function slideChange2(dir) {
      const zone = $2("zone");
      if (!zone) {
        dir === "next" ? goNext() : goPrev();
        return;
      }
      const wrap = ensureSlideWrap();
      if (!wrap) {
        dir === "next" ? goNext() : goPrev();
        return;
      }
      if (__sliding) return;
      __sliding = true;
      window.__lhSuppressFlip = true;
      const zr = zone.getBoundingClientRect();
      const r = wrap.getBoundingClientRect();
      const ghost = wrap.cloneNode(true);
      ghost.removeAttribute("id");
      ghost.classList.add("lhGhost");
      ghost.style.cssText += ";position:absolute;margin:0;pointer-events:none;z-index:6;left:" + (r.left - zr.left) + "px;top:" + (r.top - zr.top) + "px;width:" + r.width + "px;height:" + r.height + "px;transform:none;opacity:1;transition:none;";
      zone.appendChild(ghost);
      wrap.classList.remove("lhDragging");
      wrap.classList.add("lhSliding");
      wrap.style.transition = "none";
      dir === "next" ? goNext() : goPrev();
      const fromX = dir === "next" ? "100%" : "-100%";
      const toX = dir === "next" ? "-100%" : "100%";
      wrap.style.transform = "translateX(" + fromX + ")";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!__sliding) return;
          const ease = "transform .26s cubic-bezier(.22,.61,.36,1)";
          wrap.style.transition = ease;
          ghost.style.transition = ease + ", opacity .26s ease";
          wrap.style.transform = "translateX(0)";
          ghost.style.transform = "translateX(" + toX + ")";
          ghost.style.opacity = ".35";
        });
      });
      let __slideDone = false;
      function finishSlide() {
        if (__slideDone) return;
        __slideDone = true;
        wrap.removeEventListener("transitionend", finishSlide);
        ghost.remove();
        wrap.style.transition = "";
        wrap.style.transform = "";
        wrap.classList.remove("lhSliding");
        __sliding = false;
        window.__lhSuppressFlip = false;
      }
      wrap.addEventListener("transitionend", finishSlide);
      setTimeout(finishSlide, 480);
    }
    function bindHoldRepeat(btn, dir) {
      if (!btn) return;
      const REPEAT_DELAY = 420;
      const REPEAT_INTERVAL = 130;
      let startTimer = null, repeatTimer = null, repeated = false, touchActive = false;
      function stepOnce() {
        dir === "next" ? goNext() : goPrev();
      }
      function clearTimers() {
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = null;
        }
        if (repeatTimer) {
          clearInterval(repeatTimer);
          repeatTimer = null;
        }
      }
      function startHold() {
        repeated = false;
        clearTimers();
        startTimer = setTimeout(() => {
          repeated = true;
          stepOnce();
          repeatTimer = setInterval(stepOnce, REPEAT_INTERVAL);
        }, REPEAT_DELAY);
      }
      function endHold() {
        clearTimers();
      }
      btn.addEventListener("touchstart", (e) => {
        touchActive = true;
        e.stopPropagation();
        startHold();
      }, { passive: true });
      btn.addEventListener("touchend", (e) => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      }, { passive: true });
      btn.addEventListener("touchcancel", (e) => {
        e.stopPropagation();
        endHold();
        setTimeout(() => {
          touchActive = false;
        }, 400);
      }, { passive: true });
      btn.addEventListener("mousedown", (e) => {
        if (touchActive) return;
        e.stopPropagation();
        startHold();
      });
      btn.addEventListener("mouseup", (e) => {
        if (touchActive) return;
        e.stopPropagation();
        endHold();
      });
      btn.addEventListener("mouseleave", () => {
        if (!touchActive) endHold();
      });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (repeated) {
          repeated = false;
          return;
        }
        slideChange2(dir);
      });
    }
    function ensureMobileNav() {
      const zone = $2("zone");
      if (!zone || $2("mobileCardNav")) return;
      const nav = document.createElement("div");
      nav.id = "mobileCardNav";
      nav.className = "mobileCardNav";
      nav.innerHTML = `
      <button id="mobilePrev" type="button" aria-label="C\xE2u tr\u01B0\u1EDBc">\u2039</button>
      <div class="mobileSwipeHint">Vu\u1ED1t tr\xE1i / ph\u1EA3i \u0111\u1EC3 \u0111\u1ED5i c\xE2u</div>
      <button id="mobileNext" type="button" aria-label="C\xE2u sau">\u203A</button>`;
      zone.appendChild(nav);
      try {
        if (localStorage.getItem("learninghub_swipe_hint_seen_v1") === "1") zone.classList.add("swiped");
      } catch (e) {
      }
      bindHoldRepeat($2("mobilePrev"), "prev");
      bindHoldRepeat($2("mobileNext"), "next");
    }
    function bindDrag() {
      const zone = $2("zone");
      if (!zone || zone.__mobileDragBound) return;
      zone.__mobileDragBound = true;
      let sx = 0, sy = 0, st = 0, dragging = false, decided = false, axis = null, moved = false;
      let ignoreTouch = false;
      const W = () => zone.getBoundingClientRect().width || window.innerWidth || 360;
      function markSeen() {
        zone.classList.add("swiped");
        try {
          localStorage.setItem("learninghub_swipe_hint_seen_v1", "1");
        } catch (e) {
        }
      }
      zone.addEventListener("touchstart", (e) => {
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        ignoreTouch = !isMobile() || __sliding || !!e.target.closest("#cardTools, #editCard, .edit, .mobileCardNav");
        if (ignoreTouch) return;
        sx = t.clientX;
        sy = t.clientY;
        st = Date.now();
        dragging = false;
        decided = false;
        axis = null;
        moved = false;
      }, { passive: true });
      zone.addEventListener("touchmove", (e) => {
        if (ignoreTouch || !isMobile() || __sliding) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - sx, dy = t.clientY - sy;
        if (!decided) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          decided = true;
          axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
          if (axis === "x") {
            const w = ensureSlideWrap();
            if (w) {
              w.style.transition = "none";
              w.classList.add("lhDragging");
            }
          }
        }
        if (dragging || axis === "x") {
          dragging = true;
          e.preventDefault();
          if (Math.abs(dx) > 6) moved = true;
          const w = ensureSlideWrap();
          if (w) {
            w.style.transform = "translateX(" + dx + "px)";
            w.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / (W() * 1.1)));
          }
        }
      }, { passive: false });
      function endDrag(e) {
        if (ignoreTouch || !dragging) return;
        dragging = false;
        const w = ensureSlideWrap();
        if (w) w.classList.remove("lhDragging");
        const t = e.changedTouches && e.changedTouches[0];
        const dx = t ? t.clientX - sx : 0;
        const dt = Date.now() - st;
        const commit = Math.abs(dx) > W() * 0.3 || dt < 320 && Math.abs(dx) > 56;
        if (!w) return;
        if (commit) {
          markSeen();
          slideChange2(dx < 0 ? "next" : "prev");
        } else {
          window.__lhSuppressFlip = moved;
          w.style.transition = "transform .2s cubic-bezier(.22,.61,.36,1), opacity .2s ease";
          w.style.transform = "translateX(0)";
          w.style.opacity = "1";
          setTimeout(() => {
            w.style.transition = "";
            w.style.transform = "";
            w.style.opacity = "";
            window.__lhSuppressFlip = false;
          }, 220);
        }
      }
      zone.addEventListener("touchend", endDrag, { passive: false });
      zone.addEventListener("touchcancel", endDrag, { passive: false });
      zone.addEventListener("click", (e) => {
        if (window.__lhSuppressFlip) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);
    }
    function boot() {
      ensureSlideWrap();
      ensureMobileNav();
      bindHoldRepeat($2("prev"), "prev");
      bindHoldRepeat($2("next"), "next");
      bindHoldRepeat(document.querySelector(".arrow.left"), "prev");
      bindHoldRepeat(document.querySelector(".arrow.right"), "next");
      bindDrag();
    }
    window.slideChange = slideChange2;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1e3);
  })();
  (function() {
    if (window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613) return;
    window.__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613 = true;
    const MIN_GAP = 60 * 1e3;
    const GLOBAL_KEY = "__LH_LAST_ACTIVITY_SENT_AT_20260613";
    let sending = false;
    function client() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function lastSent() {
      return Number(window[GLOBAL_KEY] || 0);
    }
    function markSent(t) {
      window[GLOBAL_KEY] = t || Date.now();
    }
    async function touchActivity(force = false) {
      const u = user();
      if (!u || sending) return;
      const nowMs = Date.now();
      if (!force && nowMs - lastSent() < MIN_GAP) return;
      sending = true;
      markSent(nowMs);
      try {
        const md = u?.user_metadata || {};
        const res = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ id: u.id, email: u.email || "", full_name: md.full_name || md.name || "", avatar_url: md.avatar_url || md.picture || "" }) });
        const json = await res.json().catch(() => ({}));
        if (json && (json.force_logout || json.data?.force_logout)) {
          location.reload();
        }
      } catch (e) {
        console.warn("[last_activity]", e);
      } finally {
        sending = false;
      }
    }
    function bindActivityEvents() {
      ["click", "touchstart", "keydown"].forEach((ev) => {
        window.addEventListener(ev, () => touchActivity(false), { passive: true });
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindActivityEvents);
    else bindActivityEvents();
    setTimeout(() => touchActivity(true), 2500);
    setInterval(async () => {
      const u = user();
      if (!u) return;
      try {
        const md = u?.user_metadata || {};
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ id: u.id, email: u.email || "", full_name: md.full_name || md.name || "", avatar_url: md.avatar_url || md.picture || "" })
        });
        const json = await res.json().catch(() => ({}));
        if (json && (json.force_logout || json.data?.force_logout)) {
          location.reload();
        }
      } catch (e) {
      }
    }, 6e4);
  })();
  (function() {
    const STORE2 = "learninghub_subject_code_merged_v1";
    let _lastCounterHTML = "", _lastBrandHTML = "";
    function $2(id) {
      return document.getElementById(id);
    }
    function escStr(s) {
      return String(s ?? "").replace(/[\&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function currentCode() {
      return localStorage.getItem(STORE2) || "MLN122_3";
    }
    function fixCounter() {
      const counter = document.querySelector(".globalTop .counter") || document.querySelector("#fc .top .counter") || document.querySelector(".counter");
      if (!counter) return;
      const tab = document.querySelector(".tab.active")?.dataset?.tab || "fc";
      const rawLen = typeof RAW !== "undefined" && Array.isArray(RAW) ? String(RAW.length) : "637";
      let html;
      if (tab === "fc") {
        const idx = $2("idx")?.textContent || "1";
        const total = $2("total")?.textContent || rawLen;
        html = 'C\xE2u <b id="idx">' + idx + '</b> / <b id="total">' + total + "</b>";
      } else {
        html = '<b id="subjectTotalCount">' + rawLen + "</b> c\xE2u";
      }
      if (_lastCounterHTML !== html) {
        counter.innerHTML = html;
        _lastCounterHTML = html;
      }
    }
    function fixBrand2() {
      const brand = document.querySelector(".globalTop .brand") || document.querySelector("#fc .top .brand") || document.querySelector(".brand");
      if (!brand) return;
      const code = currentCode();
      const html = `<div class="brandSubjectBox"><span class="brandCodeTitle">${escStr(code)}</span></div>`;
      if (_lastBrandHTML !== html) {
        brand.innerHTML = html;
        _lastBrandHTML = html;
      }
    }
    window.fixCounter = fixCounter;
    window.fixBrand = fixBrand2;
    function run() {
      fixCounter();
      fixBrand2();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
    document.addEventListener("click", (e) => {
      if (e.target.closest(".tab")) setTimeout(run, 0);
    });
    setTimeout(run, 50);
    setTimeout(run, 300);
    setInterval(run, 500);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function moveSubjectButton() {
      const actions = document.querySelector(".globalTop .actions") || document.querySelector("#fc .actions") || document.querySelector(".actions");
      if (!actions) return;
      let btn = $2("subjectTopChip");
      if (!btn) {
        btn = document.createElement("button");
        btn.id = "subjectTopChip";
        btn.type = "button";
        btn.className = "subjectChip";
        btn.onclick = function() {
          $2("hodChangeSubjectBtn")?.click();
        };
      }
      btn.textContent = "\u0110\u1ED5i m\xF4n";
      btn.classList.remove("hidden");
      btn.style.display = "inline-flex";
      const settings = $2("openSettings");
      if (settings && settings.parentNode === actions) {
        if (settings.previousElementSibling !== btn) actions.insertBefore(btn, settings);
      } else if (!actions.contains(btn)) {
        actions.prepend(btn);
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", moveSubjectButton);
    else moveSubjectButton();
    setTimeout(moveSubjectButton, 200);
    setTimeout(moveSubjectButton, 800);
    setInterval(moveSubjectButton, 700);
  })();
  (function() {
    function getQuestionByNum(num) {
      num = Number(num);
      return (RAW || []).find((c) => Number(c.num) === num) || (pool || []).find((c) => Number(c.num) === num) || null;
    }
    function setCurrentQuestionByNum(num) {
      num = Number(num);
      let idx = (pool || []).findIndex((c) => Number(c.num) === num);
      if (idx < 0) {
        const rawIdx = (RAW || []).findIndex((c) => Number(c.num) === num);
        if (rawIdx >= 0) {
          pool = [...RAW];
          idx = rawIdx;
        }
      }
      if (idx >= 0) {
        ci = idx;
        flipped = false;
        flipDir = "horizontal";
        try {
          renderCard();
        } catch (e) {
        }
        return true;
      }
      return false;
    }
    window.openStudyReport = function(num, ev) {
      if (ev) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();
      }
      const q = getQuestionByNum(num);
      if (!q) return alert("Kh\xF4ng t\xECm th\u1EA5y c\xE2u " + num);
      if (!setCurrentQuestionByNum(num)) return alert("Kh\xF4ng m\u1EDF \u0111\u01B0\u1EE3c c\xE2u " + num);
      try {
        openEditor();
      } catch (e) {
        alert("Kh\xF4ng m\u1EDF \u0111\u01B0\u1EE3c b\xE1o c\xE1o c\xE2u " + num);
      }
      return false;
    };
    function hardBindReportButtons() {
      const list = document.getElementById("studyList");
      if (!list) return;
      if (!document.__studyReportNoToggleDoc) {
        document.__studyReportNoToggleDoc = true;
        document.addEventListener("click", function(e) {
          const btn = e.target.closest && e.target.closest(".studyReportBtn,[data-report-num]");
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.openStudyReport(btn.dataset.reportNum, e);
          return false;
        }, true);
        document.addEventListener("pointerdown", function(e) {
          const btn = e.target.closest && e.target.closest(".studyReportBtn,[data-report-num]");
          if (!btn) return;
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, true);
        document.addEventListener("mousedown", function(e) {
          const btn = e.target.closest && e.target.closest(".studyReportBtn,[data-report-num]");
          if (!btn) return;
          e.stopPropagation();
          e.stopImmediatePropagation();
        }, true);
      }
      list.querySelectorAll(".studyReportBtn,[data-report-num]").forEach((btn) => {
        btn.setAttribute("type", "button");
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return window.openStudyReport(this.dataset.reportNum, e);
        };
        btn.onmousedown = function(e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        btn.onpointerdown = function(e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        btn.ontouchstart = function(e) {
          e.stopPropagation();
        };
      });
    }
    const oldRenderStudy = typeof renderStudy === "function" ? renderStudy : null;
    if (oldRenderStudy && !window.__studyReportRenderPatched) {
      window.__studyReportRenderPatched = true;
      renderStudy = function() {
        const result = oldRenderStudy.apply(this, arguments);
        setTimeout(hardBindReportButtons, 0);
        return result;
      };
      window.renderStudy = renderStudy;
    }
    document.addEventListener("DOMContentLoaded", function() {
      hardBindReportButtons();
      setTimeout(hardBindReportButtons, 100);
      setTimeout(hardBindReportButtons, 500);
      setInterval(hardBindReportButtons, 1e3);
    });
  })();
  (function() {
    let raf = 0, running = false, bootT = 0;
    function injectStyle() {
      let st = document.getElementById("landingBgMoverRuntimeStyle");
      if (!st) {
        st = document.createElement("style");
        st.id = "landingBgMoverRuntimeStyle";
        document.head.appendChild(st);
      }
      st.textContent = `
      #hodLoginGate{
        position:fixed!important;
        inset:0!important;
        overflow:hidden!important;
        background:#03070d!important;
        isolation:isolate!important;
      }
      #hodLoginGate::before,#hodLoginGate:before,
      #hodLoginGate::after,#hodLoginGate:after{
        display:none!important;
        content:none!important;
        animation:none!important;
        background:none!important;
      }
      #landingBgMover{
        position:absolute!important;
        left:-9vw!important;
        top:-9vh!important;
        width:118vw!important;
        height:118vh!important;
        z-index:0!important;
        pointer-events:none!important;
        background-image:linear-gradient(180deg,rgba(3,7,13,.08),rgba(3,7,13,.42)),url('background.webp')!important;
        background-repeat:no-repeat!important;
        background-position:center center!important;
        background-size:cover!important;
        transform-origin:center center!important;
        will-change:transform,filter!important;
      }
      #landingBgShade{
        position:absolute!important;
        inset:0!important;
        z-index:1!important;
        pointer-events:none!important;
        background:linear-gradient(90deg,rgba(3,10,20,.22),rgba(3,10,20,.04),rgba(3,10,20,.14))!important;
        opacity:.18!important;
      }
      #landingParticles{z-index:2!important;}
      .hodLoginGatePanel.simpleLanding{position:relative!important;z-index:3!important;}
    `;
    }
    function ensureLayer() {
      const gate = document.getElementById("hodLoginGate");
      if (!gate) return null;
      injectStyle();
      let bg = document.getElementById("landingBgMover");
      if (!bg) {
        bg = document.createElement("div");
        bg.id = "landingBgMover";
        gate.insertBefore(bg, gate.firstChild);
      }
      let shade = document.getElementById("landingBgShade");
      if (!shade) {
        shade = document.createElement("div");
        shade.id = "landingBgShade";
        gate.insertBefore(shade, bg.nextSibling);
      }
      return bg;
    }
    function isVisible() {
      const gate = document.getElementById("hodLoginGate");
      return !!gate && !gate.classList.contains("hidden") && getComputedStyle(gate).display !== "none";
    }
    function frame(t) {
      if (!running) return;
      const gateOn = isVisible();
      if (!gateOn) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      const bg = ensureLayer();
      if (bg) {
        const x = Math.sin(t / 4200) * 12;
        const y = Math.cos(t / 5200) * 8;
        const r = Math.sin(t / 6800) * 0.08;
        const s = 1.048 + Math.sin(t / 7600) * 8e-3;
        bg.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(3)}deg)`;
        bg.style.filter = `saturate(${(1.04 + Math.sin(t / 6200) * 0.018).toFixed(3)}) contrast(1.02) brightness(${(1 + Math.cos(t / 7e3) * 8e-3).toFixed(3)})`;
      }
      raf = requestAnimationFrame(frame);
    }
    function boot() {
      if (!isVisible()) return;
      cancelAnimationFrame(raf);
      ensureLayer();
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function bootDebounced() {
      clearTimeout(bootT);
      bootT = setTimeout(boot, 150);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    window.addEventListener("focus", bootDebounced);
    window.addEventListener("resize", bootDebounced, { passive: true });
  })();
  (function() {
    const STOPWORDS = /* @__PURE__ */ new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "where",
      "why",
      "how",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "is",
      "am",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "do",
      "does",
      "did",
      "done",
      "have",
      "has",
      "had",
      "having",
      "can",
      "could",
      "should",
      "would",
      "will",
      "shall",
      "may",
      "might",
      "must",
      "in",
      "on",
      "at",
      "by",
      "for",
      "from",
      "to",
      "of",
      "with",
      "without",
      "into",
      "onto",
      "over",
      "under",
      "between",
      "among",
      "about",
      "as",
      "than",
      "that",
      "this",
      "these",
      "those",
      "it",
      "its",
      "their",
      "there",
      "here",
      "two",
      "three",
      "four",
      "five",
      "one",
      "option",
      "options",
      "choose",
      "check",
      "select",
      "following",
      "main",
      "la",
      "l\xE0",
      "cua",
      "c\u1EE7a",
      "va",
      "v\xE0",
      "cac",
      "c\xE1c",
      "nhung",
      "nh\u1EEFng",
      "mot",
      "m\u1ED9t",
      "cho",
      "voi",
      "v\u1EDBi",
      "trong",
      "ngoai",
      "ngo\xE0i",
      "duoc",
      "\u0111\u01B0\u1EE3c",
      "khong",
      "kh\xF4ng",
      "nao",
      "n\xE0o",
      "gi",
      "g\xEC",
      "hay",
      "hoac",
      "ho\u1EB7c",
      "dap",
      "an",
      "dapan",
      "dap\xE1n",
      "cau",
      "c\xE2u"
    ]);
    function normText(s) {
      return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9#:\s]/g, " ").replace(/\s+/g, " ").trim();
    }
    function splitTokens(s) {
      return normText(s).split(/\s+/).filter(Boolean);
    }
    function meaningfulTokens(q) {
      const raw = splitTokens(q);
      return raw.filter((t) => {
        if (!t) return false;
        if (STOPWORDS.has(t)) return false;
        if (t.length < 3 && !/^\d+$/.test(t)) return false;
        if (/^(answer|ans|multi|multiple|chon|nhieu|lua|dap|an|dapan)$/.test(t)) return false;
        if (t.includes(":")) return false;
        return true;
      });
    }
    function parseQuery(q) {
      const raw = String(q ?? "").trim();
      const n = normText(raw);
      const p = { raw, norm: n, num: null, answer: null, multi: false, tokens: [], numericOnly: false, phrase: "" };
      p.numericOnly = /^\d+$/.test(n);
      let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
      if (m) p.num = Number(m[1]);
      if (p.numericOnly) p.num = Number(n);
      m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
      if (m) p.answer = m[1].toUpperCase().split("").sort().join("");
      p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
      p.tokens = meaningfulTokens(raw).filter((t) => {
        if (/^#?\d+$/.test(t) && p.num !== null) return false;
        if (/^[a-e]+$/.test(t) && p.answer) return false;
        return true;
      });
      p.phrase = p.tokens.join(" ");
      return p;
    }
    function optionText(c) {
      return Object.values(c?.options || {}).join(" ");
    }
    function correctAnswerText(c) {
      const ans = String(c?.answer || "").toUpperCase();
      const opts = c?.options || {};
      return ans.split("").map((k) => opts[k] || "").join(" ");
    }
    function hasWholeNumber(text, num) {
      return new RegExp("(^|\\D)" + String(num).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=\\D|$)").test(String(text ?? ""));
    }
    function editDistanceOne(a, b) {
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      let i = 0, j = 0, ed = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
          i++;
          j++;
          continue;
        }
        ed++;
        if (ed > 1) return false;
        if (a.length > b.length) i++;
        else if (a.length < b.length) j++;
        else {
          i++;
          j++;
        }
      }
      return ed + (i < a.length ? 1 : 0) + (j < b.length ? 1 : 0) <= 1;
    }
    function tokenInText(token, textNorm) {
      if (!token) return true;
      if (textNorm.includes(token)) return true;
      if (token.length < 5) return false;
      const words = textNorm.split(/\s+/).filter((w) => Math.abs(w.length - token.length) <= 1);
      return words.some((w) => editDistanceOne(token, w));
    }
    function countMatches(tokens, textNorm) {
      let n = 0;
      for (const t of tokens) if (tokenInText(t, textNorm)) n++;
      return n;
    }
    function scoreQuestion(c, p) {
      if (!p.raw) return { ok: true, score: 0, auto: false };
      const ansSorted = sortAns(String(c.answer || "").toUpperCase());
      if (p.answer && ansSorted !== p.answer) return { ok: false, score: -1, auto: false };
      if (p.multi && String(c.answer || "").length <= 1) return { ok: false, score: -1, auto: false };
      const qNorm = normText(c.question || "");
      const optNorm = normText(optionText(c));
      const corNorm = normText(correctAnswerText(c));
      const ansLineNorm = normText([c.answer, c.answer_text, correctAnswerText(c)].join(" "));
      const allNorm = normText([c.num, c.question, c.answer, c.answer_text, optionText(c)].join(" "));
      let score = 0, auto = false;
      if (p.num !== null) {
        const exact = Number(c.num) === p.num;
        const answerHasNum = hasWholeNumber([c.answer_text, correctAnswerText(c)].join(" "), p.num);
        if (p.numericOnly) {
          if (!exact && !answerHasNum) return { ok: false, score: -1, auto: false };
          score += exact ? 2e3 : 850;
          auto = answerHasNum;
        } else {
          if (!exact) return { ok: false, score: -1, auto: false };
          score += 2e3;
        }
      }
      if (p.answer) {
        score += 900;
        auto = true;
      }
      if (p.multi) {
        score += 350;
      }
      const tokens = p.tokens;
      if (tokens.length) {
        const qHit = countMatches(tokens, qNorm);
        const optHit = countMatches(tokens, optNorm);
        const corHit = countMatches(tokens, corNorm);
        const allHit = countMatches(tokens, allNorm);
        const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.72);
        if (allHit < required) return { ok: false, score: -1, auto: false };
        if (p.phrase && qNorm.includes(p.phrase)) score += 1200;
        if (p.phrase && optNorm.includes(p.phrase)) score += 850;
        if (p.phrase && corNorm.includes(p.phrase)) {
          score += 1e3;
          auto = true;
        }
        score += qHit * 180 + optHit * 95 + corHit * 160;
        if (corHit > 0 || p.phrase && ansLineNorm.includes(p.phrase)) auto = true;
        if (tokens.length >= 3 && qHit === 0 && optHit < required) return { ok: false, score: -1, auto: false };
        if (tokens.length >= 4 && allHit < tokens.length) score -= (tokens.length - allHit) * 220;
      } else if (!p.num && !p.answer && !p.multi) {
        return { ok: false, score: -1, auto: false };
      }
      return { ok: true, score, auto };
    }
    function smartBetter(q) {
      const p = parseQuery(q);
      if (!p.raw) return RAW;
      return RAW.map((c) => ({ c, m: scoreQuestion(c, p) })).filter((x) => x.m.ok).sort((a, b) => b.m.score - a.m.score || Number(a.c.num) - Number(b.c.num)).map((x) => Object.assign({}, x.c, { __autoOpenAnswer: x.m.auto }));
    }
    function markText(text, query, cls = "tokenMark") {
      const parser = typeof parseQuery === "function" ? parseQuery : parseQ;
      const p = parser(query);
      const source = String(text ?? "");
      function escLocal(s) {
        return esc(s);
      }
      function normWithMap(s) {
        let norm = "", map = [], lastSpace = true;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          const n = normText(ch);
          if (n) {
            for (const c of n) {
              norm += c;
              map.push(i);
            }
            lastSpace = false;
          } else if (!lastSpace) {
            norm += " ";
            map.push(i);
            lastSpace = true;
          }
        }
        norm = norm.trimEnd();
        while (norm.startsWith(" ")) {
          norm = norm.slice(1);
          map.shift();
        }
        return { norm, map };
      }
      if (cls === "phraseMark" && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi) {
        const nm = normWithMap(source);
        const hit = nm.norm.indexOf(p.norm);
        if (hit >= 0) {
          const start = nm.map[hit] ?? 0;
          const end = (nm.map[hit + p.norm.length - 1] ?? source.length - 1) + 1;
          return escLocal(source.slice(0, start)) + `<mark class="searchMark phraseMark">${escLocal(source.slice(start, end))}</mark>` + escLocal(source.slice(end));
        }
      }
      const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0, 10);
      if (!tokens.length) return escLocal(source);
      const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
      return parts.map((part) => {
        const np = normText(part);
        if (np && tokens.some((t) => np === t || np.includes(t) || t.includes(np))) {
          return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
        }
        return escLocal(part);
      }).join("");
    }
    function optionStudy(c, q) {
      return Object.entries(c.options || {}).map(([k, v]) => {
        const right = String(c.answer || "").includes(k);
        return `<div class="sopt ${right ? "ans correct" : ""}"><div class="skey">${right ? "\u2713" : esc(k)}</div><div>${esc(k + ". ")}${markText(v, q)}</div></div>`;
      }).join("");
    }
    function renderStudyBetter() {
      const input = $("search");
      const q = input ? input.value || "" : "";
      if (input) input.placeholder = "T\xECm c\xE2u / \u0111\xE1p \xE1n: adopted laws, #26, answer:BC, multi...";
      const arr = smartBetter(q);
      const max = arr.length;
      const html = arr.slice(0, max).map((c) => {
        const auto = !!c.__autoOpenAnswer;
        return `<div class="sitem compactStudyCard ${auto ? "autoOpenAnswer open" : ""}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">C\xC2U ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question, q, "phraseMark")}</div>
          <div class="compactCardRight">${auto ? '<span class="answerMatchChip">Kh\u1EDBp \u0111\xE1p \xE1n</span>' : ""}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="B\xE1o c\xE1o c\xE2u ${esc(c.num)}">!</button><span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c, q)}</div></div>
      </div>`;
      }).join("");
      $("studyList").innerHTML = html + (arr.length > max ? `<div class="more">\u0110ang hi\u1EC3n th\u1ECB ${max} / ${arr.length} k\u1EBFt qu\u1EA3.</div>` : arr.length ? "" : '<div class="more">Kh\xF4ng t\xECm th\u1EA5y k\u1EBFt qu\u1EA3.</div>');
    }
    function bindBetterSearch() {
      const s = $("search");
      if (s) {
        s.oninput = renderStudyBetter;
        s.placeholder = "T\xECm c\xE2u / \u0111\xE1p \xE1n: adopted laws, #26, answer:BC, multi...";
      }
      const list = $("studyList");
      if (list && !list.__betterSearchBound) {
        list.__betterSearchBound = true;
        list.addEventListener("click", function(e) {
          const rb = e.target.closest("[data-report-num]");
          if (rb) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.openStudyReport?.(rb.dataset.reportNum, e);
            return;
          }
          const it = e.target.closest(".sitem");
          if (!it) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          it.classList.toggle("open");
          it.classList.remove("autoOpenAnswer");
        }, true);
      }
    }
    smart = smartBetter;
    renderStudy = renderStudyBetter;
    window.renderStudy = renderStudyBetter;
    document.addEventListener("DOMContentLoaded", function() {
      bindBetterSearch();
      setTimeout(bindBetterSearch, 100);
      setTimeout(bindBetterSearch, 600);
      try {
        renderStudyBetter();
      } catch (e) {
      }
    });
  })();
  (function() {
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    const $2 = (id) => document.getElementById(id);
    const subjectCode = () => localStorage.getItem(SUBJECT_STORE2) || "";
    const client = () => window.HODSupabase?.__client || null;
    const user = () => window.HODSupabase?.getUser?.() || null;
    const profile = () => window.HODSupabase?.getProfile?.() || null;
    const esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const ADD_IMG_DRAFT_KEY = "learninghub_add_question_images_draft_v1";
    function saveAddImagesDraft() {
      try {
        localStorage.setItem(ADD_IMG_DRAFT_KEY, JSON.stringify(addImages));
      } catch (e) {
      }
    }
    function loadAddImagesDraft() {
      try {
        return JSON.parse(localStorage.getItem(ADD_IMG_DRAFT_KEY) || "[]") || [];
      } catch (e) {
        return [];
      }
    }
    function clearAddImagesDraft() {
      try {
        localStorage.removeItem(ADD_IMG_DRAFT_KEY);
      } catch (e) {
      }
    }
    let addImages = loadAddImagesDraft();
    let addUploading = 0;
    function canManage() {
      const p = profile();
      const role = String(p?.role || "").toLowerCase();
      return !!user() && (role === "admin" || role === "editor") && !(p?.blocked || p?.is_blocked || p?.status === "blocked");
    }
    function isAllTab() {
      return $2("study")?.classList.contains("active") || document.querySelector(".tab.active")?.dataset?.tab === "study";
    }
    function nextNum() {
      const nums = (RAW || []).map((q) => Number(q.num)).filter(Number.isFinite);
      return nums.length ? Math.max(...nums) + 1 : 1;
    }
    function notifyOk(msg) {
      if (typeof notify === "function") notify(msg);
      else alert(msg);
    }
    function ensurePlus() {
      let btn = $2("addQuestionFab");
      if (!btn) {
        btn = document.createElement("button");
        btn.id = "addQuestionFab";
        btn.type = "button";
        btn.title = "Th\xEAm c\xE2u h\u1ECFi";
        btn.textContent = "+";
        document.body.appendChild(btn);
      }
      btn.classList.add("prettyAddFab");
      btn.innerHTML = "<span>+</span>";
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openPrettyAddModal();
      };
      return btn;
    }
    function modalOpen() {
      const m = $2("addQuestionModal");
      return !!m && !m.classList.contains("hidden") && getComputedStyle(m).display !== "none";
    }
    function updatePlus() {
      const btn = ensurePlus();
      const open = modalOpen();
      const show = canManage() && isAllTab() && !open;
      document.body.classList.toggle("add-question-visible", show);
      document.body.classList.toggle("add-question-modal-open", open);
      btn.classList.toggle("hidden", !show);
      btn.setAttribute("aria-hidden", show ? "false" : "true");
      btn.style.setProperty("display", show ? "flex" : "none", "important");
      btn.style.setProperty("visibility", show ? "visible" : "hidden", "important");
      btn.style.setProperty("opacity", show ? "1" : "0", "important");
      btn.style.setProperty("pointer-events", show ? "auto" : "none", "important");
      if (!canManage() || !isAllTab()) $2("addQuestionModal")?.classList.add("hidden");
    }
    function cleanupLimitText() {
      const list = $2("studyList");
      if (!list) return;
      list.querySelectorAll(".more").forEach((x) => {
        if (/Đang hiển thị\s+\d+\s*\//i.test(x.textContent || "")) x.remove();
      });
    }
    function getImageFilesFromPaste(e) {
      const items = [...e.clipboardData?.items || []];
      return items.filter((item) => item.kind === "file" && String(item.type || "").startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean);
    }
    async function uploadPrettyImageFiles(files, sourceLabel) {
      files = [...files || []].filter((file) => file && String(file.type || "").startsWith("image/"));
      const st = $2("addUploadStatus");
      const input = $2("addImgUpload");
      const saveBtn = $2("saveAddQuestion");
      if (!files.length) return;
      if (!window.__LHUploadCloudinary) {
        alert("Ch\u01B0a s\u1EB5n s\xE0ng upload Cloudinary. T\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
        return;
      }
      addUploading++;
      if (input) input.disabled = true;
      if (saveBtn) saveBtn.disabled = true;
      if (st) {
        st.style.display = "block";
        st.textContent = "\u0110ang upload " + files.length + " \u1EA3nh l\xEAn Cloudinary...";
      }
      notifyOk(sourceLabel === "paste" ? "\u0110ang upload \u1EA3nh v\u1EEBa d\xE1n..." : "\u0110ang upload \u1EA3nh l\xEAn Cloudinary...");
      try {
        let done = 0;
        for (const file of files) {
          const uploaded = await window.__LHUploadCloudinary(file);
          if (uploaded) addImages.push(uploaded);
          done++;
          if (st) st.textContent = "\u0110ang upload \u1EA3nh " + done + "/" + files.length + "...";
        }
        if (window.__LHCleanImages) addImages = window.__LHCleanImages(addImages);
        saveAddImagesDraft();
        renderPrettyImages();
        if (st) {
          st.textContent = "\u0110\xE3 upload xong. URL n\u1EB1m d\u01B0\u1EDBi \u1EA3nh.";
          setTimeout(() => {
            if (addUploading === 0) st.style.display = "none";
          }, 2200);
        }
        notifyOk("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
      } catch (err) {
        if (st) st.textContent = "Upload l\u1ED7i: " + (err.message || err);
        alert(err.message || err);
      } finally {
        addUploading = Math.max(0, addUploading - 1);
        if (addUploading === 0) {
          if (input) {
            input.disabled = false;
            input.value = "";
          }
          if (saveBtn) saveBtn.disabled = false;
        }
      }
    }
    function ensurePrettyModal() {
      let modal = $2("addQuestionModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "addQuestionModal";
        modal.className = "modal hidden addQuestionModal";
        document.body.appendChild(modal);
      }
      if (modal.dataset.prettyVersion === "20260614") return modal;
      modal.dataset.prettyVersion = "20260614";
      modal.className = "modal hidden addQuestionModal";
      modal.innerHTML = `
      <div class="box editPreviewBox quizEditLayoutV2">
        <button type="button" class="modalX" id="addQuestionClose">\xD7</button>
        <div class="v7Head editPreviewHead">
          <div>
            <span class="v7Label">TH\xCAM M\u1EDAI</span>
            <h2>Th\xEAm c\xE2u h\u1ECFi m\u1EDBi</h2>
            <p class="v7Hint">Nh\u1EADp n\u1ED9i dung c\xE2u h\u1ECFi, c\xE1c \u0111\xE1p \xE1n v\xE0 upload \u1EA3nh n\u1EBFu c\xF3.</p>
          </div>
        </div>
        <article class="v7Card editPreviewCard" style="margin:0!important; border:0!important; background:transparent!important; padding:0!important;">
          <div class="editPreviewTwoColumns">
            <div class="editPreviewLeftCol">
              <div class="v7Field">
                <label>C\xE2u h\u1ECFi</label>
                <textarea id="addQuestionText" placeholder="Nh\u1EADp n\u1ED9i dung c\xE2u h\u1ECFi..." style="min-height: 120px;"></textarea>
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>\u0110\xE1p \xE1n \u0111\xFAng</label>
                <input id="addQuestionAnswer" placeholder="V\xED d\u1EE5: A ho\u1EB7c BC">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>S\u1ED1 c\xE2u</label>
                <input id="addQuestionNum" type="number" min="1" placeholder="T\u1EF1 l\u1EA5y s\u1ED1 ti\u1EBFp theo n\u1EBFu \u0111\u1EC3 tr\u1ED1ng">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>H\xECnh \u1EA3nh</label>
                <input id="addImgUpload" type="file" accept="image/*" multiple>
                <div class="pasteImageHint addPasteImageHint">C\xF3 th\u1EC3 ch\u1EE5p/copy \u1EA3nh r\u1ED3i b\u1EA5m Ctrl + V trong khung n\xE0y \u0111\u1EC3 t\u1EF1 upload URL.</div>
                <div id="addUploadStatus" style="display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;">\u0110ang upload \u1EA3nh...</div>
                <div id="addImgs" class="editImgs addImgs" style="margin-top: 8px;">Ch\u01B0a c\xF3 h\xECnh.</div>
              </div>
            </div>
            <div class="editPreviewRightCol">
              <div class="v7Field" style="margin: 0!important;">
                <label>C\xE1c \u0111\xE1p \xE1n</label>
                <div id="editPreviewOptions" class="v7Options">
                  <div class="v7OptRow">
                    <div class="v7Key">A</div>
                    <input id="addOptA" placeholder="Nh\u1EADp \u0111\xE1p \xE1n A">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptA').value=''">\xD7</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">B</div>
                    <input id="addOptB" placeholder="Nh\u1EADp \u0111\xE1p \xE1n B">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptB').value=''">\xD7</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">C</div>
                    <input id="addOptC" placeholder="Nh\u1EADp \u0111\xE1p \xE1n C">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptC').value=''">\xD7</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">D</div>
                    <input id="addOptD" placeholder="Nh\u1EADp \u0111\xE1p \xE1n D">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptD').value=''">\xD7</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">E</div>
                    <input id="addOptE" placeholder="C\xF3 th\u1EC3 b\u1ECF tr\u1ED1ng (E)">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptE').value=''">\xD7</button>
                  </div>
                </div>
              </div>
              <div class="v7Bottom" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
                <button type="button" class="btn" id="cancelAddQuestion">\u0110\xF3ng</button>
                <button type="button" class="primary" id="saveAddQuestion">L\u01B0u c\xE2u h\u1ECFi</button>
              </div>
            </div>
          </div>
        </article>
      </div>`;
      $2("addQuestionClose").onclick = closePrettyAddModal;
      $2("cancelAddQuestion").onclick = closePrettyAddModal;
      $2("saveAddQuestion").onclick = savePrettyQuestion;
      $2("addImgUpload").onchange = (e) => uploadPrettyImageFiles(e.target.files, "file");
      modal.addEventListener("paste", (e) => {
        const files = getImageFilesFromPaste(e);
        if (!files.length) return;
        e.preventDefault();
        uploadPrettyImageFiles(files, "paste");
      });
      modal.addEventListener("dragover", (e) => {
        const hasFile = [...e.dataTransfer?.items || []].some((item) => item.kind === "file");
        if (!hasFile) return;
        e.preventDefault();
        modal.classList.add("dragImageOver");
      });
      modal.addEventListener("dragleave", () => modal.classList.remove("dragImageOver"));
      modal.addEventListener("drop", (e) => {
        const files = [...e.dataTransfer?.files || []].filter((file) => String(file.type || "").startsWith("image/"));
        if (!files.length) return;
        e.preventDefault();
        modal.classList.remove("dragImageOver");
        uploadPrettyImageFiles(files, "drop");
      });
      $2("addImgs").onclick = (e) => {
        const b = e.target.closest("[data-add-rm]");
        if (!b) return;
        addImages.splice(Number(b.dataset.addRm), 1);
        saveAddImagesDraft();
        renderPrettyImages();
      };
      modal.addEventListener("mousedown", (e) => {
        if (e.target === modal) closePrettyAddModal();
      });
      return modal;
    }
    function renderPrettyImages() {
      const box = $2("addImgs");
      if (!box) return;
      box.innerHTML = addImages.length ? addImages.map((im, i) => `
      <div class="editImg addPreviewImg">
        <button type="button" class="rm" data-add-rm="${i}">\xD7</button>
        <img src="${esc2(im.src)}" alt="" loading="lazy" decoding="async">
        <input class="imgUrlBox" value="${esc2(im.src)}" readonly onclick="this.select()" title="B\u1EA5m \u0111\u1EC3 ch\u1ECDn URL \u1EA3nh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;">
      </div>`).join("") : "Ch\u01B0a c\xF3 h\xECnh.";
    }
    function openPrettyAddModal() {
      if (!canManage()) return;
      if (!isAllTab()) return;
      const modal = ensurePrettyModal();
      addImages = loadAddImagesDraft();
      $2("addQuestionNum").value = nextNum();
      $2("addQuestionText").value = "";
      ["A", "B", "C", "D", "E"].forEach((k) => {
        const el = $2("addOpt" + k);
        if (el) el.value = "";
      });
      $2("addQuestionAnswer").value = "";
      renderPrettyImages();
      modal.classList.remove("hidden");
      updatePlus();
      setTimeout(() => $2("addQuestionText")?.focus(), 80);
    }
    function closePrettyAddModal() {
      $2("addQuestionModal")?.classList.add("hidden");
      setTimeout(updatePlus, 30);
    }
    function answerTextLine(answer, options) {
      return String(answer || "").toUpperCase().split("").filter(Boolean).map((k) => k + ". " + (options[k] || "")).join("; ");
    }
    async function savePrettyQuestion() {
      if (!canManage()) return alert("T\xE0i kho\u1EA3n n\xE0y kh\xF4ng c\xF3 quy\u1EC1n th\xEAm c\xE2u h\u1ECFi.");
      if (addUploading > 0) return alert("\u1EA2nh \u0111ang upload, ch\u1EDD xong r\u1ED3i l\u01B0u nha.");
      const c = client();
      if (!c) return alert("Ch\u01B0a k\u1EBFt n\u1ED1i Supabase.");
      const subject = subjectCode();
      if (!subject) return alert("B\u1EA1n c\u1EA7n ch\u1ECDn m\xF4n tr\u01B0\u1EDBc.");
      const num = Number(($2("addQuestionNum")?.value || "").trim()) || nextNum();
      const question = ($2("addQuestionText")?.value || "").trim();
      const answer = ($2("addQuestionAnswer")?.value || "").trim().toUpperCase().replace(/[^A-E]/g, "");
      const options = {};
      ["A", "B", "C", "D", "E"].forEach((k) => {
        const v = ($2("addOpt" + k)?.value || "").trim();
        if (v) options[k] = v;
      });
      if (!question) return alert("Nh\u1EADp c\xE2u h\u1ECFi tr\u01B0\u1EDBc.");
      if (Object.keys(options).length < 2) return alert("Nh\u1EADp \xEDt nh\u1EA5t 2 \u0111\xE1p \xE1n.");
      if (!answer) return alert("Nh\u1EADp \u0111\xE1p \xE1n \u0111\xFAng, v\xED d\u1EE5 A ho\u1EB7c BC.");
      for (const k of answer) {
        if (!options[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      }
      const imgs = typeof window.__LHCleanImages === "function" ? window.__LHCleanImages(addImages || []) : addImages || [];
      const payload = { subject_code: subject, num, question, options, answer, answer_text: answerTextLine(answer, options), images: imgs, has_image: imgs.length > 0, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      const btn = $2("saveAddQuestion");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang l\u01B0u...";
      }
      try {
        const u = user();
        const res = await fetch("/api/admin-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ user_id: u?.id, action: "add_question", payload: { question_data: payload } })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.error) throw new Error(out.error || "Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c v\xE0o Turso (HTTP " + res.status + ")");
        clearAddImagesDraft();
        addImages = [];
        closePrettyAddModal();
        notifyOk("\u0110\xE3 th\xEAm c\xE2u h\u1ECFi");
        if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
        if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly(true);
        else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
        try {
          const idx = (RAW || []).findIndex((q) => Number(q.num) === num);
          if (idx >= 0) {
            pool = [...RAW];
            ci = idx;
            flipped = false;
            renderCard?.();
            renderStudy?.();
          }
        } catch (e) {
        }
      } catch (err) {
        alert("Th\xEAm c\xE2u h\u1ECFi th\u1EA5t b\u1EA1i: " + (err?.message || err));
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "L\u01B0u c\xE2u h\u1ECFi";
        }
      }
    }
    function boot() {
      ensurePlus();
      const modal = ensurePrettyModal();
      cleanupLimitText();
      updatePlus();
      if (modal && !modal.__mergedAddObserver) {
        modal.__mergedAddObserver = true;
        const obs = new MutationObserver(() => setTimeout(updatePlus, 30));
        obs.observe(modal, { attributes: true, attributeFilter: ["class", "style"] });
        modal.addEventListener("click", () => setTimeout(updatePlus, 30), true);
        modal.addEventListener("mousedown", () => setTimeout(updatePlus, 30), true);
      }
      document.querySelectorAll(".tab").forEach((t) => {
        if (t.__prettyAddTabBound) return;
        t.__prettyAddTabBound = true;
        t.addEventListener("click", () => setTimeout(() => {
          cleanupLimitText();
          updatePlus();
        }, 80));
      });
    }
    window.openAddQuestionModal = openPrettyAddModal;
    window.openPrettyAddModal = openPrettyAddModal;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1e3);
    setInterval(updatePlus, 250);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function canManage() {
      const p = window.HODSupabase?.getProfile?.() || null;
      const u = window.HODSupabase?.getUser?.() || null;
      const role = String(p?.role || "").toLowerCase();
      return !!u && (role === "admin" || role === "editor") && !(p?.blocked || p?.is_blocked || p?.status === "blocked");
    }
    function isStudyTab() {
      return $2("study")?.classList.contains("active") || document.querySelector(".tab.active")?.dataset?.tab === "study";
    }
    function getNum(card) {
      const d = card?.dataset?.num || card?.getAttribute?.("data-num");
      if (d && /^\d+$/.test(String(d))) return Number(d);
      const m = String(card?.textContent || "").match(/CÂU\s*(\d+)/i);
      return m ? Number(m[1]) : null;
    }
    function addDeleteButtons() {
      const list = $2("studyList");
      if (!list) return;
      const show = canManage() && isStudyTab();
      document.body.classList.toggle("study-has-delete", show);
      list.querySelectorAll(".sitem, .compactStudyCard").forEach((card) => {
        let holder = card.querySelector(".compactCardRight");
        if (!holder) {
          holder = document.createElement("div");
          holder.className = "compactCardRight";
          const line = card.querySelector(".compactCardLine");
          if (line) line.appendChild(holder);
          else card.appendChild(holder);
        }
        const existing = card.querySelector(".studyDeleteAction");
        if (!show) {
          if (existing) existing.remove();
          return;
        }
        const num = getNum(card);
        if (!num) return;
        card.dataset.num = String(num);
        if (existing) {
          existing.dataset.deleteNum = String(num);
          return;
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "studyDeleteAction";
        btn.dataset.deleteNum = String(num);
        btn.title = "X\xF3a c\xE2u " + num;
        btn.textContent = "X\xF3a";
        holder.appendChild(btn);
      });
    }
    function patchRender() {
      if (window.__deleteButtonRenderPatched) return;
      const old = typeof renderStudy === "function" ? renderStudy : null;
      if (!old) return;
      window.__deleteButtonRenderPatched = true;
      renderStudy = function() {
        const r = old.apply(this, arguments);
        setTimeout(addDeleteButtons, 0);
        setTimeout(addDeleteButtons, 100);
        return r;
      };
      window.renderStudy = renderStudy;
    }
    function boot() {
      patchRender();
      addDeleteButtons();
      document.querySelectorAll(".tab").forEach((t) => {
        if (t.__deleteBtnBound) return;
        t.__deleteBtnBound = true;
        t.addEventListener("click", () => setTimeout(addDeleteButtons, 100));
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1e3);
    setInterval(addDeleteButtons, 1500);
  })();
  (function() {
    function isDeleteTarget(e) {
      return e.target?.closest?.(".studyDeleteAction,[data-delete-num]");
    }
    function notifySafe(msg) {
      if (typeof notify === "function") notify(msg);
      else alert(msg);
    }
    function client() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function canManage() {
      const p = profile();
      const role = String(p?.role || "").toLowerCase();
      return !!user() && (role === "admin" || role === "editor") && !(p?.blocked || p?.is_blocked || p?.status === "blocked");
    }
    function getQ(num) {
      num = Number(num);
      return (RAW || []).find((q) => Number(q.num) === num) || null;
    }
    async function deleteQuestion(num) {
      num = Number(num);
      if (!num) return;
      const q = getQ(num);
      if (!q) return notifySafe("Kh\xF4ng th\u1EA5y c\xE2u " + num);
      if (!canManage()) return notifySafe("Kh\xF4ng c\xF3 quy\u1EC1n x\xF3a");
      if (!confirm("X\xF3a c\xE2u " + num + "?\nC\xE2u h\u1ECFi s\u1EBD b\u1ECB \u1EA9n kh\u1ECFi th\u01B0 vi\u1EC7n.")) return;
      if (!q.id) return notifySafe("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
      const u = window.HODSupabase?.getUser?.();
      const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: u?.id, action: "delete_question", payload: { question_id: q.id } }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return notifySafe("L\u1ED7i x\xF3a: " + (out.error || res.status));
      if (typeof window.clearLearningHubQuestionCache === "function") {
        window.clearLearningHubQuestionCache();
      }
      RAW = (RAW || []).filter((x) => Number(x.num) !== num);
      pool = (pool || []).filter((x) => Number(x.num) !== num);
      if (ci >= pool.length) ci = Math.max(0, pool.length - 1);
      try {
        renderStudy?.();
        renderCard?.();
        renderQuiz?.();
      } catch (e) {
      }
      notifySafe("\u0110\xE3 x\xF3a c\xE2u " + num);
    }
    function stopOnly(e) {
      const btn = isDeleteTarget(e);
      if (!btn) return;
      e.preventDefault?.();
      e.stopPropagation?.();
      e.stopImmediatePropagation?.();
      return btn;
    }
    if (!document.__deleteNoToggleFinal20260627) {
      document.__deleteNoToggleFinal20260627 = true;
      ["pointerdown", "mousedown", "touchstart"].forEach((ev) => {
        document.addEventListener(ev, function(e) {
          stopOnly(e);
        }, true);
      });
      document.addEventListener("click", function(e) {
        const btn = stopOnly(e);
        if (!btn) return;
        deleteQuestion(btn.dataset.deleteNum || btn.getAttribute("data-delete-num"));
        return false;
      }, true);
    }
  })();
  (function() {
    function escPrompt(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getPromptText() {
      return window.__ADD_SUBJECT_AI_PROMPT || window.AI_PROMPT || document.getElementById("userAiPromptText")?.textContent || "";
    }
    window.__openUserAIPromptModal = function() {
      const prompt2 = getPromptText();
      let modal = document.getElementById("userPromptModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "userPromptModal";
        modal.className = "modal userPromptModal hidden";
        modal.innerHTML = `<div class="box userPromptModalBox">
        <button class="modalX" type="button" id="userPromptModalClose">\xD7</button>
        <div class="userPromptModalHead">
          <div>
            <span class="userPromptLabel">PROMPT T\u1EA0O C\xC2U H\u1ECEI</span>
            <h2>Xem prompt</h2>
            <p>Copy prompt n\xE0y r\u1ED3i d\xE1n v\xE0o Gemini / ChatGPT / Claude k\xE8m t\xE0i li\u1EC7u m\xF4n h\u1ECDc.</p>
          </div>
          <button class="primary userPromptCopyTop" type="button" id="userPromptModalCopy">\u{1F4CB} Sao ch\xE9p</button>
        </div>
        <pre class="userPromptModalPre" id="userPromptModalPre"></pre>
      </div>`;
        modal.addEventListener("mousedown", (e) => {
          if (e.target === modal) window.__closeUserAIPromptModal();
        });
        document.body.appendChild(modal);
        document.getElementById("userPromptModalClose")?.addEventListener("click", window.__closeUserAIPromptModal);
        document.getElementById("userPromptModalCopy")?.addEventListener("click", window.__copyUserAIPrompt);
      }
      const pre = document.getElementById("userPromptModalPre");
      if (pre) pre.textContent = prompt2;
      modal.classList.remove("hidden");
    };
    window.__closeUserAIPromptModal = function() {
      document.getElementById("userPromptModal")?.classList.add("hidden");
    };
    window.__copyUserAIPrompt = function() {
      const prompt2 = getPromptText();
      const done = () => {
        const btn = document.getElementById("btnCopyPrompt");
        if (btn) {
          const oldText = btn.innerHTML;
          btn.innerHTML = "\u2705 \u0110\xE3 copy";
          setTimeout(() => {
            btn.innerHTML = oldText;
          }, 1800);
        }
        if (typeof notify === "function") notify("\u0110\xE3 copy prompt!");
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(prompt2).then(done).catch(() => {
          const ta = document.createElement("textarea");
          ta.value = prompt2;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          done();
        });
      } else {
        const ta = document.createElement("textarea");
        ta.value = prompt2;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done();
      }
    };
    document.addEventListener("click", function(e) {
      const viewBtn = e.target.closest && e.target.closest("#btnViewPrompt,.aiViewPromptBtn");
      if (viewBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.__openUserAIPromptModal();
        return;
      }
      const copyBtn = e.target.closest && e.target.closest("#btnCopyPrompt");
      if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        window.__copyUserAIPrompt();
      }
    }, true);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function notifySafe(msg) {
      if (typeof notify === "function") notify(msg);
      else console.log(msg);
    }
    window.__clearUserImportFile = function() {
      const fileInput = $2("userImportFile");
      const hiddenData = $2("userImportData");
      const dropZone = $2("importDropZone");
      const fileCard = $2("userImportFileCard");
      const fileName = $2("userImportFileName");
      const fileMeta = $2("userImportFileMeta");
      const previewBtn = $2("previewImportBtn");
      const saveBtn = $2("userImportBtn");
      if (fileInput) fileInput.value = "";
      if (hiddenData) hiddenData.value = "";
      if (dropZone) dropZone.classList.remove("hidden");
      if (fileCard) fileCard.classList.add("hidden");
      if (fileName) fileName.textContent = "Ch\u01B0a ch\u1ECDn file";
      if (fileMeta) fileMeta.textContent = "File import c\xE2u h\u1ECFi";
      if (previewBtn) {
        previewBtn.classList.add("hidden");
        previewBtn.disabled = true;
      }
      if (saveBtn) saveBtn.disabled = true;
      localStorage.removeItem("learninghub_add_subject_file_name_v1");
      localStorage.removeItem("learninghub_add_subject_file_size_v1");
      localStorage.removeItem("learninghub_add_subject_file_data_v1");
      localStorage.removeItem("learninghub_add_subject_file_previewed_v1");
      window.__previewSelections = {};
      try {
        window.__closeImportPreviewModal?.();
      } catch (e) {
      }
      notifySafe("\u0110\xE3 x\xF3a file import");
    };
    document.addEventListener("click", function(e) {
      const btn = e.target.closest?.(".removeFileBtn");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      window.__clearUserImportFile();
    }, true);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function enhancePromptStep() {
      const step = $2("addStep2");
      if (!step || step.dataset.promptPolished === "1") return;
      step.dataset.promptPolished = "1";
      step.classList.add("promptPolished");
      step.innerHTML = `
      <div class="promptStepGrid">
        <section class="promptMainCard">
          <div class="promptEyebrow">B\u01B0\u1EDBc 2 \xB7 T\u1EA1o file c\xE2u h\u1ECFi</div>
          <h3 class="promptMainTitle">L\u1EA5y prompt r\u1ED3i \u0111\u01B0a t\xE0i li\u1EC7u cho AI</h3>
          <p class="promptMainDesc">B\u1EA5m sao ch\xE9p prompt, d\xE1n v\xE0o AI b\u1EA1n mu\u1ED1n d\xF9ng, sau \u0111\xF3 g\u1EEDi k\xE8m t\xE0i li\u1EC7u m\xF4n h\u1ECDc. AI s\u1EBD tr\u1EA3 v\u1EC1 file c\xE2u h\u1ECFi \u0111\u1EC3 import \u1EDF b\u01B0\u1EDBc ti\u1EBFp theo.</p>

          <div class="promptActionGrid">
            <button class="aiCopyBtn" type="button" onclick="window.__copyUserAIPrompt()" id="btnCopyPrompt">\u{1F4CB} Sao ch\xE9p prompt</button>
            <button class="aiViewPromptBtn" type="button" onclick="window.__openUserAIPromptModal()" id="btnViewPrompt">\u{1F441} Xem prompt</button>
          </div>

          <div class="promptMiniGuide">
            <div class="guideRow"><div class="guideNum">1</div><div><b>Copy prompt</b><span>Prompt \u0111\xE3 c\xF3 s\u1EB5n format JSON \u0111\xFAng cho h\u1EC7 th\u1ED1ng.</span></div></div>
            <div class="guideRow"><div class="guideNum">2</div><div><b>D\xE1n v\xE0o AI + g\u1EEDi t\xE0i li\u1EC7u</b><span>G\u1EEDi PDF, Word, slide ho\u1EB7c n\u1ED9i dung m\xF4n h\u1ECDc cho AI.</span></div></div>
            <div class="guideRow"><div class="guideNum">3</div><div><b>T\u1EA3i file .md / .txt</b><span>Sau khi AI t\u1EA1o xong, qua b\u01B0\u1EDBc Import \u0111\u1EC3 l\u01B0u m\xF4n h\u1ECDc.</span></div></div>
          </div>
        </section>

        <aside class="promptSideCard">
          <div class="promptToolTitle">Ch\u1ECDn c\xF4ng c\u1EE5 AI</div>
          <div class="promptToolGrid">
            <a href="https://gemini.google.com" target="_blank" class="aiToolBtn gemini">\u2726 Gemini</a>
            <a href="https://chatgpt.com" target="_blank" class="aiToolBtn chatgpt">\u25C9 ChatGPT</a>
            <a href="https://claude.ai" target="_blank" class="aiToolBtn claude">\u25C8 Claude</a>
          </div>
          <div class="promptNoteBox">M\u1EB9o: n\u1EBFu t\xE0i li\u1EC7u d\xE0i, h\xE3y y\xEAu c\u1EA7u AI t\u1EA1o t\u1EEBng ph\u1EA7n r\u1ED3i g\u1ED9p l\u1EA1i th\xE0nh m\u1ED9t file JSON.</div>
        </aside>
      </div>

      <div class="step-actions">
        <button class="btn" type="button" onclick="window.__switchStep(1)">\u2B05 Quay l\u1EA1i</button>
        <button class="primary" type="button" onclick="window.__switchStep(3)">\u0110\xE3 c\xF3 file, ti\u1EBFp t\u1EE5c \u2794</button>
      </div>
    `;
    }
    const oldSwitch = window.__switchStep;
    window.__switchStep = function(step) {
      if (typeof oldSwitch === "function") oldSwitch.apply(this, arguments);
      setTimeout(() => {
        if (Number(step) === 2) enhancePromptStep();
      }, 0);
    };
    document.addEventListener("click", function(e) {
      const btn = e.target.closest?.('[onclick*="__switchStep(2)"]');
      if (btn) setTimeout(enhancePromptStep, 0);
    }, true);
    document.addEventListener("DOMContentLoaded", () => setTimeout(enhancePromptStep, 800));
  })();
  (function() {
    function cleanStrayPromptButtons() {
      document.querySelectorAll(".subjectGate .polishedSubjectPanel > .aiCopyBtn, .subjectGate .polishedSubjectPanel > #btnCopyPrompt, .subjectGate > .aiCopyBtn, .subjectGate > #btnCopyPrompt").forEach((btn) => {
        if (!btn.closest("#addStep2")) btn.remove();
      });
    }
    document.addEventListener("DOMContentLoaded", () => {
      cleanStrayPromptButtons();
      setTimeout(cleanStrayPromptButtons, 300);
      setTimeout(cleanStrayPromptButtons, 1e3);
    });
    document.addEventListener("click", () => setTimeout(cleanStrayPromptButtons, 0), true);
  })();
  (function() {
    function removePromptGuideRows() {
      document.querySelectorAll("#addStep2 .promptMiniGuide").forEach((el) => el.remove());
    }
    document.addEventListener("DOMContentLoaded", () => {
      removePromptGuideRows();
      setTimeout(removePromptGuideRows, 300);
      setTimeout(removePromptGuideRows, 1e3);
    });
    document.addEventListener("click", () => setTimeout(removePromptGuideRows, 0), true);
  })();
  (function() {
    function cleanPromptTip() {
      document.querySelectorAll("#addStep2 .promptNoteBox, .promptNoteBox").forEach((el) => el.remove());
    }
    function patchPromptModal() {
      const modal = document.getElementById("userPromptModal");
      if (!modal) return;
      modal.classList.remove("modal");
      modal.classList.add("userPromptModal");
      const box = modal.querySelector(".userPromptModalBox");
      if (box) box.classList.remove("box");
    }
    const oldOpen = window.__openUserAIPromptModal;
    window.__openUserAIPromptModal = function() {
      if (typeof oldOpen === "function") oldOpen.apply(this, arguments);
      setTimeout(() => {
        patchPromptModal();
        cleanPromptTip();
      }, 0);
    };
    document.addEventListener("DOMContentLoaded", () => {
      cleanPromptTip();
      patchPromptModal();
      setTimeout(() => {
        cleanPromptTip();
        patchPromptModal();
      }, 300);
      setTimeout(() => {
        cleanPromptTip();
        patchPromptModal();
      }, 1e3);
    });
    document.addEventListener("click", () => setTimeout(() => {
      cleanPromptTip();
      patchPromptModal();
    }, 0), true);
  })();
  (function() {
    function escHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getPreviewData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      return arr;
    }
    function opt(q, k) {
      return q?.options?.[k] || "";
    }
    window.__previewQualityFilter = "all";
    function autoDetectQuality(q) {
      const hasImg = !!(q.has_image || q.images && q.images.length > 0);
      let risk = q.error_risk || "";
      let reason = q.error_risk_reason || "";
      if (!risk) {
        if (hasImg && (!q.images || !q.images.length || q.images.some((im) => {
          const src = typeof im === "string" ? im : im.src || im.url || "";
          return !src || src.includes("URL_") || src.includes("M\xD4_T\u1EA2");
        }))) {
          risk = "high";
          reason = reason || "C\xE2u c\u1EA7n h\xECnh \u1EA3nh nh\u01B0ng ch\u01B0a c\xF3 \u1EA3nh th\u1EF1c t\u1EBF";
        } else if (String(q.answer || "").length > 1) {
          risk = "medium";
          reason = reason || "C\xE2u c\xF3 nhi\u1EC1u \u0111\xE1p \xE1n \u0111\xFAng, c\u1EA7n ki\u1EC3m tra k\u1EF9";
        } else {
          risk = "low";
        }
      }
      q.has_image = hasImg;
      q.error_risk = risk;
      q.error_risk_reason = reason;
    }
    function riskLabel(r) {
      return { low: "Th\u1EA5p", medium: "Trung b\xECnh", high: "Cao" }[r] || r;
    }
    function riskColor(r) {
      return { low: "#27ae60", medium: "#f39c12", high: "#e74c3c" }[r] || "#999";
    }
    function renderQualityStats(data) {
      var stats = document.getElementById("importPreviewStats");
      if (!stats) return;
      var imgCount = data.filter(function(q) {
        return q.has_image;
      }).length;
      var highCount = data.filter(function(q) {
        return q.error_risk === "high";
      }).length;
      var medCount = data.filter(function(q) {
        return q.error_risk === "medium";
      }).length;
      var lowCount = data.filter(function(q) {
        return q.error_risk === "low";
      }).length;
      var f = window.__previewQualityFilter;
      stats.textContent = "";
      var statRow = document.createElement("div");
      statRow.className = "previewStatRow";
      var statItems = [
        { text: data.length + " c\xE2u", color: "" },
        { text: imgCount + " c\xF3 \u1EA3nh", color: "#3498db" },
        { text: highCount + " r\u1EE7i ro cao", color: "#e74c3c" },
        { text: medCount + " trung b\xECnh", color: "#f39c12" },
        { text: lowCount + " th\u1EA5p", color: "#27ae60" }
      ];
      statItems.forEach(function(item) {
        var span = document.createElement("span");
        span.className = "previewStatItem";
        span.textContent = item.text;
        if (item.color) span.style.color = item.color;
        statRow.appendChild(span);
      });
      var filterRow = document.createElement("div");
      filterRow.className = "previewFilterRow";
      var filters = [
        { key: "all", label: "Th\u01B0 vi\u1EC7n", border: "" },
        { key: "has_image", label: "\u{1F4F7} C\xF3 \u1EA3nh", border: "" },
        { key: "high", label: "R\u1EE7i ro cao", border: "#e74c3c" },
        { key: "medium", label: "Trung b\xECnh", border: "#f39c12" },
        { key: "low", label: "Th\u1EA5p", border: "#27ae60" }
      ];
      filters.forEach(function(fl) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "previewFilterBtn" + (f === fl.key ? " active" : "");
        btn.textContent = fl.label;
        if (fl.border) btn.style.borderColor = fl.border;
        btn.addEventListener("click", function() {
          window.__setQualityFilter(fl.key);
        });
        filterRow.appendChild(btn);
      });
      stats.appendChild(statRow);
      stats.appendChild(filterRow);
    }
    window.__setQualityFilter = function(f) {
      window.__previewQualityFilter = f;
      const data = getPreviewData();
      renderQualityStats(data);
      renderQualityList(data);
    };
    window.__toggleQualityImage = function(i, val) {
      const data = getPreviewData();
      if (data[i]) {
        data[i].has_image = val;
        renderQualityStats(data);
      }
    };
    window.__setQualityRisk = function(i, val) {
      const data = getPreviewData();
      if (data[i]) {
        data[i].error_risk = val;
        renderQualityStats(data);
        const card = document.querySelector(`[data-pcard="${i}"]`);
        if (card) {
          card.style.borderLeftColor = riskColor(val);
          card.style.background = { low: "rgba(39,174,96,0.08)", medium: "rgba(243,156,18,0.08)", high: "rgba(231,76,60,0.08)" }[val] || "";
          const badge = card.querySelector(".riskBadge");
          if (badge) {
            badge.style.background = riskColor(val);
            badge.textContent = riskLabel(val);
          }
        }
      }
    };
    function renderQualityList(data) {
      var list = document.getElementById("importPreviewList");
      if (!list) return;
      var f = window.__previewQualityFilter;
      var filtered = data.filter(function(q) {
        if (f === "all") return true;
        if (f === "has_image") return q.has_image;
        return q.error_risk === f;
      });
      list.textContent = "";
      if (!filtered.length) {
        var empty = document.createElement("div");
        empty.style.cssText = "text-align:center;padding:30px;opacity:.6";
        empty.textContent = "Kh\xF4ng c\xF3 c\xE2u h\u1ECFi n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.";
        list.appendChild(empty);
        return;
      }
      filtered.forEach(function(q) {
        var i = data.indexOf(q);
        list.appendChild(buildCard(q, i));
      });
    }
    function renderPreviewInline(data) {
      data = getPreviewData(data);
      data.forEach(autoDetectQuality);
      window.__previewQualityFilter = "all";
      let modal = document.getElementById("importPreviewModal");
      if (modal) {
        modal.remove();
        modal = null;
      }
      modal = document.createElement("div");
      modal.id = "importPreviewModal";
      modal.className = "modal importPreviewModal";
      var box = document.createElement("div");
      box.className = "box importPreviewModalBox";
      var closeBtn = document.createElement("button");
      closeBtn.className = "modalX";
      closeBtn.type = "button";
      closeBtn.textContent = "\xD7";
      closeBtn.onclick = function() {
        window.__closeImportPreviewModal();
      };
      var head = document.createElement("div");
      head.className = "importPreviewHead";
      var headLeft = document.createElement("div");
      var label = document.createElement("span");
      label.className = "importPreviewLabel";
      label.textContent = "XEM TR\u01AF\u1EDAC IMPORT";
      var h2 = document.createElement("h2");
      h2.textContent = "Ki\u1EC3m tra c\xE2u h\u1ECFi";
      var desc = document.createElement("p");
      desc.textContent = "\u0110\xE1p \xE1n \u0111\xFAng \u0111\xE3 hi\u1EC3n th\u1ECB s\u1EB5n. \u0110\xE1nh d\u1EA5u c\xE2u c\xF3 \u1EA3nh v\xE0 m\u1EE9c r\u1EE7i ro, b\u1EA5m \u201CS\u1EEDa\u201D \u0111\u1EC3 ch\u1EC9nh n\u1ED9i dung.";
      headLeft.appendChild(label);
      headLeft.appendChild(h2);
      headLeft.appendChild(desc);
      var saveBtn = document.createElement("button");
      saveBtn.className = "primary importPreviewSaveTop";
      saveBtn.type = "button";
      saveBtn.textContent = "L\u01B0u M\xF4n H\u1ECDc";
      saveBtn.onclick = function() {
        window.__closeImportPreviewModal();
        window.__submitSubjectRequest();
      };
      head.appendChild(headLeft);
      head.appendChild(saveBtn);
      var stats = document.createElement("div");
      stats.id = "importPreviewStats";
      stats.className = "importPreviewStats";
      var list = document.createElement("div");
      list.id = "importPreviewList";
      list.className = "importPreviewList";
      box.appendChild(closeBtn);
      box.appendChild(head);
      box.appendChild(stats);
      box.appendChild(list);
      modal.appendChild(box);
      modal.addEventListener("mousedown", function(e) {
        if (e.target === modal) window.__closeImportPreviewModal();
      });
      document.body.appendChild(modal);
      renderQualityStats(data);
      renderQualityList(data);
      modal.classList.remove("hidden");
    }
    function buildCard(q, i) {
      var answer = String(q.answer || "").toUpperCase();
      var risk = q.error_risk || "low";
      var riskBg = { low: "rgba(39,174,96,0.08)", medium: "rgba(243,156,18,0.08)", high: "rgba(231,76,60,0.08)" }[risk] || "";
      var card = document.createElement("article");
      card.className = "previewQuestionCard";
      card.dataset.pcard = i;
      card.style.borderLeft = "4px solid " + riskColor(risk);
      card.style.background = riskBg;
      var top = document.createElement("div");
      top.className = "previewQuestionTop";
      var numB = document.createElement("b");
      numB.textContent = "C\xE2u " + (q.num || i + 1);
      var actions = document.createElement("div");
      actions.className = "previewTopActions";
      if (q.has_image) {
        var imgBadge = document.createElement("span");
        imgBadge.className = "previewBadge imgBadge";
        imgBadge.textContent = "\u{1F4F7} C\xF3 \u1EA3nh";
        actions.appendChild(imgBadge);
      }
      var rBadge = document.createElement("span");
      rBadge.className = "previewBadge riskBadge";
      rBadge.style.background = riskColor(risk);
      rBadge.style.color = "#fff";
      rBadge.textContent = riskLabel(risk);
      actions.appendChild(rBadge);
      var ansBadge = document.createElement("span");
      ansBadge.className = "previewAnswerBadge";
      ansBadge.textContent = "\u0110\xE1p \xE1n: " + (answer || "?");
      actions.appendChild(ansBadge);
      var editBtn = document.createElement("button");
      editBtn.className = "previewEditBtn";
      editBtn.type = "button";
      editBtn.textContent = "S\u1EEDa";
      editBtn.addEventListener("click", function() {
        window.__editImportPreviewQuestion(i);
      });
      actions.appendChild(editBtn);
      top.appendChild(numB);
      top.appendChild(actions);
      card.appendChild(top);
      if (q.error_risk_reason) {
        var reasonDiv = document.createElement("div");
        reasonDiv.className = "previewRiskReason";
        reasonDiv.textContent = "\u26A0 " + q.error_risk_reason;
        card.appendChild(reasonDiv);
      }
      var qText = document.createElement("div");
      qText.className = "previewQuestionText";
      qText.textContent = q.question || "";
      card.appendChild(qText);
      var imgArea = document.createElement("div");
      imgArea.className = "previewImgArea";
      imgArea.dataset.imgIdx = i;
      function renderImgThumbs() {
        imgArea.textContent = "";
        var imgs = q.images || [];
        if (imgs.length) {
          var thumbRow = document.createElement("div");
          thumbRow.className = "previewQuestionImages";
          imgs.forEach(function(im, idx) {
            var src = typeof im === "string" ? im : im.src || im.url || "";
            if (!src) return;
            var wrap = document.createElement("div");
            wrap.className = "previewImgThumb";
            var img = document.createElement("img");
            img.src = src;
            img.alt = "\u1EA2nh " + (idx + 1);
            img.loading = "lazy";
            var rmBtn = document.createElement("button");
            rmBtn.className = "previewImgRm";
            rmBtn.type = "button";
            rmBtn.textContent = "\xD7";
            rmBtn.addEventListener("click", function() {
              q.images.splice(idx, 1);
              renderImgThumbs();
              renderQualityStats(getPreviewData());
            });
            wrap.appendChild(rmBtn);
            wrap.appendChild(img);
            thumbRow.appendChild(wrap);
          });
          imgArea.appendChild(thumbRow);
        }
        var uploadRow = document.createElement("div");
        uploadRow.className = "previewImgUploadRow";
        var fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.multiple = true;
        fileInput.className = "previewImgFileInput";
        fileInput.addEventListener("change", function(e) {
          var files = e.target.files || [];
          Array.prototype.forEach.call(files, function(file) {
            var fr = new FileReader();
            fr.onload = function() {
              if (!q.images) q.images = [];
              q.images.push({ id: "prev_" + Date.now() + "_" + Math.random().toString(16).slice(2), src: fr.result, source: "user-upload", name: file.name });
              if (!q.has_image) {
                q.has_image = true;
              }
              renderImgThumbs();
              renderQualityStats(getPreviewData());
            };
            fr.readAsDataURL(file);
          });
          e.target.value = "";
        });
        var uploadBtn = document.createElement("button");
        uploadBtn.className = "previewImgUploadBtn";
        uploadBtn.type = "button";
        uploadBtn.textContent = "\u{1F4F7} Th\xEAm \u1EA3nh";
        uploadBtn.addEventListener("click", function() {
          fileInput.click();
        });
        uploadRow.appendChild(fileInput);
        uploadRow.appendChild(uploadBtn);
        if (q.images && q.images.length) {
          var countSpan = document.createElement("span");
          countSpan.className = "previewImgCount";
          countSpan.textContent = q.images.length + " \u1EA3nh";
          uploadRow.appendChild(countSpan);
        }
        imgArea.appendChild(uploadRow);
      }
      renderImgThumbs();
      card.appendChild(imgArea);
      var grid = document.createElement("div");
      grid.className = "previewAnswerGrid";
      Object.entries(q.options || {}).forEach(function(entry) {
        var k = entry[0], v = entry[1];
        var key = String(k).toUpperCase();
        var isCorrect = answer.includes(key);
        var optDiv = document.createElement("div");
        optDiv.className = "previewAnswerOption" + (isCorrect ? " correct" : "");
        optDiv.dataset.pi = i;
        optDiv.dataset.k = key;
        var b = document.createElement("b");
        b.textContent = key;
        var s = document.createElement("span");
        s.textContent = v;
        optDiv.appendChild(b);
        optDiv.appendChild(s);
        grid.appendChild(optDiv);
      });
      card.appendChild(grid);
      var controls = document.createElement("div");
      controls.className = "previewQualityControls";
      var toggleLabel = document.createElement("label");
      toggleLabel.className = "previewToggle";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!q.has_image;
      cb.addEventListener("change", function() {
        window.__toggleQualityImage(i, this.checked);
      });
      var cbText = document.createElement("span");
      cbText.textContent = "C\xF3 \u1EA3nh";
      toggleLabel.appendChild(cb);
      toggleLabel.appendChild(cbText);
      var riskDiv = document.createElement("div");
      riskDiv.className = "previewRiskSelect";
      var riskSpan = document.createElement("span");
      riskSpan.textContent = "R\u1EE7i ro:";
      var sel = document.createElement("select");
      ["low", "medium", "high"].forEach(function(val) {
        var opt2 = document.createElement("option");
        opt2.value = val;
        opt2.textContent = { low: "Th\u1EA5p", medium: "Trung b\xECnh", high: "Cao" }[val];
        if (risk === val) opt2.selected = true;
        sel.appendChild(opt2);
      });
      sel.addEventListener("change", function() {
        window.__setQualityRisk(i, this.value);
      });
      riskDiv.appendChild(riskSpan);
      riskDiv.appendChild(sel);
      controls.appendChild(toggleLabel);
      controls.appendChild(riskDiv);
      card.appendChild(controls);
      return card;
    }
    window.__openImportPreviewModal = renderPreviewInline;
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
    function escHtml(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getData() {
      return window.__previewImportData || [];
    }
    function optionKeys(q) {
      const keys = Object.keys(q?.options || {}).map((k) => String(k).toUpperCase());
      return LETTERS.filter((k) => keys.includes(k));
    }
    function nextKey(keys) {
      return LETTERS.find((k) => !keys.includes(k));
    }
    function markCorrect(card, answer) {
      card.querySelectorAll(".previewAnswerOption").forEach((opt) => {
        const k = String(opt.dataset.k || "").toUpperCase();
        opt.classList.toggle("correct", answer.includes(k));
      });
    }
    function refreshCardOnly(i) {
      const q = getData()[i];
      if (!q) return;
      const open = window.__openImportPreviewModal;
      if (typeof open === "function") {
        open(getData());
      }
    }
    window.__editImportPreviewQuestion = function(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!q || !card) return;
      if (card.classList.contains("inlineEditing")) return;
      card.dataset.backupHtml = card.innerHTML;
      card.classList.add("inlineEditing");
      const questionEl = card.querySelector(".previewQuestionText");
      if (questionEl) {
        questionEl.setAttribute("contenteditable", "true");
        questionEl.dataset.field = "question";
      }
      card.querySelectorAll(".previewAnswerOption").forEach((opt) => {
        const span = opt.querySelector("span");
        if (span) {
          span.setAttribute("contenteditable", "true");
          span.dataset.optText = opt.dataset.k || "";
        }
      });
      const badge = card.querySelector(".previewAnswerBadge");
      if (badge) {
        badge.innerHTML = `\u0110\xE1p \xE1n \u0111\xFAng: <input class="inlineCorrectInput" value="${escHtml(String(q.answer || "").toUpperCase())}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">`;
        const input = badge.querySelector("input");
        input?.addEventListener("input", () => markCorrect(card, String(input.value || "").toUpperCase()));
      }
      const grid = card.querySelector(".previewAnswerGrid");
      if (grid && !card.querySelector(".inlineAddOptionMini")) {
        grid.insertAdjacentHTML("afterend", `<button class="inlineAddOptionMini" type="button" title="Th\xEAm \u0111\xE1p \xE1n" onclick="window.__inlineAddPreviewOption(${i})">+</button>`);
      }
      if (!card.querySelector(".inlineEditActionsMini")) {
        card.insertAdjacentHTML("beforeend", `<div class="inlineEditActionsMini"><button class="btn" type="button" onclick="window.__cancelInlineKeepEdit(${i})">H\u1EE7y</button><button class="primary" type="button" onclick="window.__saveInlineKeepEdit(${i})">L\u01B0u s\u1EEDa</button></div>`);
      }
      questionEl?.focus();
    };
    window.__inlineAddPreviewOption = function(i) {
      const card = document.querySelector(`[data-pcard="${i}"]`);
      const grid = card?.querySelector(".previewAnswerGrid");
      if (!card || !grid) return;
      const keys = Array.from(grid.querySelectorAll(".previewAnswerOption")).map((x) => String(x.dataset.k || "").toUpperCase());
      const k = nextKey(keys);
      if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 l\u1EF1a ch\u1ECDn.");
      grid.insertAdjacentHTML("beforeend", `<div class="previewAnswerOption" data-pi="${i}" data-k="${k}"><b>${k}</b><span contenteditable="true" data-opt-text="${k}"></span></div>`);
      grid.querySelector(`[data-k="${k}"] span`)?.focus();
    };
    window.__cancelInlineKeepEdit = function(i) {
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!card) return;
      card.innerHTML = card.dataset.backupHtml || card.innerHTML;
      card.classList.remove("inlineEditing");
      delete card.dataset.backupHtml;
    };
    window.__saveInlineKeepEdit = function(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-pcard="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector(".previewQuestionText")?.textContent || "").trim();
      const answer = (card.querySelector(".inlineCorrectInput")?.value || "").trim().toUpperCase();
      if (!question) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!answer) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const options = {};
      card.querySelectorAll(".previewAnswerOption").forEach((opt) => {
        const k = String(opt.dataset.k || "").toUpperCase();
        const v = (opt.querySelector("span")?.textContent || "").trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert("C\u1EA7n c\xF3 \xEDt nh\u1EA5t m\u1ED9t \u0111\xE1p \xE1n l\u1EF1a ch\u1ECDn.");
      q.question = question;
      q.options = options;
      q.answer = answer;
      refreshCardOnly(i);
      if (typeof notify === "function") notify("\u0110\xE3 c\u1EADp nh\u1EADt c\xE2u h\u1ECFi");
    };
  })();
  (function() {
    function ensureDeleteButtons(card) {
      if (!card) return;
      card.querySelectorAll(".previewAnswerOption").forEach((opt) => {
        if (opt.querySelector(".inlineDeleteOptionBtn")) return;
        const k = opt.dataset.k || "";
        opt.insertAdjacentHTML("beforeend", `<button class="inlineDeleteOptionBtn" type="button" title="X\xF3a \u0111\xE1p \xE1n ${k}" onclick="window.__deleteInlinePreviewOption(this)">\xD7</button>`);
      });
    }
    window.__deleteInlinePreviewOption = function(btn) {
      const opt = btn?.closest?.(".previewAnswerOption");
      const card = btn?.closest?.(".previewQuestionCard");
      if (!opt || !card) return;
      const count = card.querySelectorAll(".previewAnswerOption").length;
      if (count <= 1) return alert("Ph\u1EA3i c\xF2n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      const k = String(opt.dataset.k || "").toUpperCase();
      const input = card.querySelector(".inlineCorrectInput");
      if (input && k) {
        input.value = String(input.value || "").toUpperCase().replaceAll(k, "");
        card.querySelectorAll(".previewAnswerOption").forEach((o) => {
          const ok = String(input.value || "").includes(String(o.dataset.k || "").toUpperCase());
          o.classList.toggle("correct", ok);
        });
      }
      opt.remove();
    };
    const oldEdit = window.__editImportPreviewQuestion;
    window.__editImportPreviewQuestion = function(i) {
      if (typeof oldEdit === "function") oldEdit.apply(this, arguments);
      setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
    };
    const oldAdd = window.__inlineAddPreviewOption;
    window.__inlineAddPreviewOption = function(i) {
      if (typeof oldAdd === "function") oldAdd.apply(this, arguments);
      setTimeout(() => ensureDeleteButtons(document.querySelector(`[data-pcard="${i}"]`)), 0);
    };
  })();
  (function() {
    const STORE2 = "learninghub_import_preview_compact_v1";
    function applyCompact(modal, compact) {
      if (!modal) return;
      modal.classList.toggle("compactMode", !!compact);
      const btn = modal.querySelector(".previewCompactToggle");
      if (btn) {
        btn.classList.toggle("active", !!compact);
        btn.textContent = compact ? "Chi ti\u1EBFt" : "Danh s\xE1ch nhanh";
        btn.title = compact ? "B\u1EA5m \u0111\u1EC3 xem \u0111\u1EA7y \u0111\u1EE7 \u0111\xE1p \xE1n v\xE0 c\xF4ng c\u1EE5" : "B\u1EA5m \u0111\u1EC3 xem nhi\u1EC1u c\xE2u h\u01A1n";
      }
    }
    function enhanceImportPreview() {
      const modal = document.getElementById("importPreviewModal");
      if (!modal || modal.dataset.compactEnhanced === "1") return;
      const save = modal.querySelector(".importPreviewSaveTop");
      if (!save || !save.parentNode) return;
      modal.dataset.compactEnhanced = "1";
      let compact = localStorage.getItem(STORE2);
      compact = compact === null ? true : compact === "1";
      const actions = document.createElement("div");
      actions.className = "importPreviewHeadActions";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "previewCompactToggle";
      toggle.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        compact = !modal.classList.contains("compactMode");
        localStorage.setItem(STORE2, compact ? "1" : "0");
        applyCompact(modal, compact);
      });
      save.parentNode.insertBefore(actions, save);
      actions.appendChild(toggle);
      actions.appendChild(save);
      applyCompact(modal, compact);
    }
    function start() {
      enhanceImportPreview();
      if (window.MutationObserver && document.body) {
        new MutationObserver(enhanceImportPreview).observe(document.body, { childList: true, subtree: true });
      }
      setInterval(enhanceImportPreview, 700);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
      return ans.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ");
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map((k) => String(k).toUpperCase()));
      return LETTERS.find((k) => !used.has(k));
    }
    function renderCard2(q, i) {
      const ans = normAns(q) || "?";
      return `<article class="simplePreviewCard" data-simple-card="${i}"><div class="simplePreviewRow"><div class="simplePreviewNum">C\xE2u ${esc2(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc2(q.question || "")}</div><div class="simplePreviewCorrect"><b>\u0110\xE1p \xE1n: ${esc2(ans)}</b><span>${esc2(correctText(q))}</span></div></div><button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">S\u1EEDa</button></div></article>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts).sort().map((k) => `<div class="simpleEditOption" data-opt-row="${esc2(k)}"><div class="simpleEditKey">${esc2(k)}</div><input value="${esc2(opts[k] || "")}" data-edit-opt="${esc2(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc2(k)}">\xD7</button></div>`).join("");
      return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">S\u1EEDa to\xE0n b\u1ED9 C\xE2u ${esc2(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>C\xE2u h\u1ECFi</label><textarea data-edit-question>${esc2(q.question || "")}</textarea></div><div class="simpleEditField"><label>\u0110\xE1p \xE1n \u0111\xFAng</label><input data-edit-answer value="${esc2(normAns(q))}" placeholder="VD: A ho\u1EB7c AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>C\xE1c \u0111\xE1p \xE1n</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Th\xEAm \u0111\xE1p \xE1n</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">H\u1EE7y</button><button class="primary" type="button" data-save-simple="${i}">L\u01B0u s\u1EEDa</button></div></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById("simplePreviewList");
      if (list) list.innerHTML = data.map(renderCard2).join("");
    }
    function openSimplePreview(data) {
      data = getData(data);
      let modal = document.getElementById("importPreviewModal");
      if (modal) modal.remove();
      modal = document.createElement("div");
      modal.id = "importPreviewModal";
      modal.className = "modal simpleImportPreviewModal";
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>\xD7</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TR\u01AF\u1EDAC IMPORT</span><h2>Ki\u1EC3m tra c\xE2u h\u1ECFi</h2><p class="simplePreviewHint">Ch\u1EC9 hi\u1EC7n c\xE2u h\u1ECFi v\xE0 \u0111\xE1p \xE1n \u0111\xFAng. B\u1EA5m \u201CS\u1EEDa\u201D \u0111\u1EC3 ch\u1EC9nh to\xE0n b\u1ED9 c\xE2u v\xE0 c\xE1c \u0111\xE1p \xE1n.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>L\u01B0u M\xF4n H\u1ECDc</button></div></div><div class="simplePreviewCount">${data.length} c\xE2u h\u1ECFi</div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector("[data-edit-question]")?.value || "").trim();
      const answer = (card.querySelector("[data-edit-answer]")?.value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (!question) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!answer) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const options = {};
      card.querySelectorAll("[data-edit-opt]").forEach((inp) => {
        const k = String(inp.dataset.editOpt || "").toUpperCase();
        const v = (inp.value || "").trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert("C\u1EA7n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      for (const k of answer.split("")) {
        if (!options[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer.split("").map((k) => k + ". " + (options[k] || "")).join("; ");
      renderList(data);
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u s\u1EEDa c\xE2u " + (q.num || i + 1));
    }
    document.addEventListener("click", function(e) {
      if (e.target.closest("[data-simple-close]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        return;
      }
      if (e.target.closest("[data-simple-save]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest("[data-simple-edit]");
      if (edit) {
        const i = +edit.dataset.simpleEdit;
        const data = getData();
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest("[data-cancel-simple]");
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest("[data-save-simple]");
      if (save) {
        saveEdit(+save.dataset.saveSimple);
        return;
      }
      const add = e.target.closest("[data-add-opt]");
      if (add) {
        const i = +add.dataset.addOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 \u0111\xE1p \xE1n.");
        q.options = q.options || {};
        q.options[k] = "";
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest("[data-del-opt]");
      if (del) {
        const card = del.closest("[data-simple-card]");
        const i = +(card?.dataset.simpleCard || 0);
        const q = getData()[i];
        const k = del.dataset.delOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    window.__openImportPreviewModal = openSimplePreview;
    window.__editImportPreviewQuestion = function(i) {
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    let currentFilter = "all";
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function detect(q) {
      q.has_image = !!(q.has_image || q.images && q.images.length);
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? "medium" : "low";
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
      return ans.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ");
    }
    function riskColor(r) {
      return { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" }[r] || "#999";
    }
    function riskLabel(r) {
      return { high: "Cao", medium: "Trung b\xECnh", low: "Th\u1EA5p" }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map((k) => String(k).toUpperCase()));
      return LETTERS.find((k) => !used.has(k));
    }
    function pass(q) {
      if (currentFilter === "all") return true;
      if (currentFilter === "has_image") return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stat(data) {
      return { total: data.length, img: data.filter((q) => q.has_image).length, high: data.filter((q) => q.error_risk === "high").length, medium: data.filter((q) => q.error_risk === "medium").length, low: data.filter((q) => q.error_risk === "low").length };
    }
    function renderStats(data) {
      const s = stat(data);
      const box = document.getElementById("simplePreviewStats");
      if (!box) return;
      const filters = [["all", "Th\u01B0 vi\u1EC7n"], ["has_image", "\u{1F4F7} C\xF3 \u1EA3nh"], ["high", "R\u1EE7i ro cao"], ["medium", "Trung b\xECnh"], ["low", "Th\u1EA5p"]];
      box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} c\xE2u</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} c\xF3 \u1EA3nh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} r\u1EE7i ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung b\xECnh</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} th\u1EA5p</span></div><div class="simplePreviewFilterLine">${filters.map((f) => `<button type="button" class="simpleFilterBtn ${currentFilter === f[0] ? "active" : ""}" data-filter="${f[0]}">${f[1]}</button>`).join("")}</div>`;
    }
    function renderCard2(q, i) {
      const ans = normAns(q) || "?";
      return `<article class="simplePreviewCard" data-simple-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="simplePreviewRow"><div class="simplePreviewNum">C\xE2u ${esc2(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc2(q.question || "")}</div><div class="simplePreviewCorrect"><b>\u0110\xE1p \xE1n: ${esc2(ans)}</b><span>${esc2(correctText(q))}</span></div></div><div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="R\u1EE7i ro: ${esc2(riskLabel(q.error_risk))}"></span>${q.has_image ? '<span class="simplePreviewImgMark">\u{1F4F7}</span>' : ""}<button class="simplePreviewEditBtn" type="button" data-simple-edit="${i}">S\u1EEDa</button></div></div></article>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts).sort().map((k) => `<div class="simpleEditOption" data-opt-row="${esc2(k)}"><div class="simpleEditKey">${esc2(k)}</div><input value="${esc2(opts[k] || "")}" data-edit-opt="${esc2(k)}"><button class="simpleEditDel" type="button" data-del-opt="${esc2(k)}">\xD7</button></div>`).join("");
      return `<article class="simplePreviewCard simpleEditCard" data-simple-card="${i}"><div class="simpleEditHead"><div class="simpleEditTitle">S\u1EEDa to\xE0n b\u1ED9 C\xE2u ${esc2(q.num || i + 1)}</div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>C\xE2u h\u1ECFi</label><textarea data-edit-question>${esc2(q.question || "")}</textarea></div><div class="simpleEditField"><label>\u0110\xE1p \xE1n \u0111\xFAng</label><input data-edit-answer value="${esc2(normAns(q))}" placeholder="VD: A ho\u1EB7c AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>C\xE1c \u0111\xE1p \xE1n</label><div class="simpleEditOptions">${optionRows}</div></div><div class="simpleEditBottom"><button class="btn" type="button" data-add-opt="${i}">+ Th\xEAm \u0111\xE1p \xE1n</button><div class="simpleEditMiniActions"><button class="btn" type="button" data-cancel-simple="${i}">H\u1EE7y</button><button class="primary" type="button" data-save-simple="${i}">L\u01B0u s\u1EEDa</button></div></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById("simplePreviewList");
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter((x) => pass(x.q));
      list.innerHTML = filtered.length ? filtered.map((x) => renderCard2(x.q, x.i)).join("") : '<div class="simplePreviewEmpty">Kh\xF4ng c\xF3 c\xE2u n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.</div>';
      renderStats(data);
    }
    function openSimplePreview(data) {
      data = getData(data);
      let modal = document.getElementById("importPreviewModal");
      if (modal) modal.remove();
      modal = document.createElement("div");
      modal.id = "importPreviewModal";
      modal.className = "modal simpleImportPreviewModal";
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-simple-close>\xD7</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TR\u01AF\u1EDAC IMPORT</span><h2>Ki\u1EC3m tra c\xE2u h\u1ECFi</h2><p class="simplePreviewHint">Ch\u1EC9 hi\u1EC7n c\xE2u h\u1ECFi v\xE0 \u0111\xE1p \xE1n \u0111\xFAng. D\xF9ng b\u1ED9 l\u1ECDc \u0111\u1EC3 xem c\xE2u c\xF3 \u1EA3nh ho\u1EB7c c\xE2u d\u1EC5 sai.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-simple-save>L\u01B0u M\xF4n H\u1ECDc</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector("[data-edit-question]")?.value || "").trim();
      const answer = (card.querySelector("[data-edit-answer]")?.value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (!question) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!answer) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const options = {};
      card.querySelectorAll("[data-edit-opt]").forEach((inp) => {
        const k = String(inp.dataset.editOpt || "").toUpperCase();
        const v = (inp.value || "").trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert("C\u1EA7n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      for (const k of answer.split("")) {
        if (!options[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer.split("").map((k) => k + ". " + (options[k] || "")).join("; ");
      renderList(data);
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u s\u1EEDa c\xE2u " + (q.num || i + 1));
    }
    document.addEventListener("click", function(e) {
      const filter = e.target.closest(".simpleFilterBtn");
      if (filter) {
        currentFilter = filter.dataset.filter || "all";
        renderList(getData());
        return;
      }
      if (e.target.closest("[data-simple-close]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        return;
      }
      if (e.target.closest("[data-simple-save]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest("[data-simple-edit]");
      if (edit) {
        const i = +edit.dataset.simpleEdit;
        const data = getData();
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-simple-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest("[data-cancel-simple]");
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest("[data-save-simple]");
      if (save) {
        saveEdit(+save.dataset.saveSimple);
        return;
      }
      const add = e.target.closest("[data-add-opt]");
      if (add) {
        const i = +add.dataset.addOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 \u0111\xE1p \xE1n.");
        q.options = q.options || {};
        q.options[k] = "";
        const card = document.querySelector(`[data-simple-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-simple-card="${i}"] [data-edit-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest("[data-del-opt]");
      if (del) {
        const card = del.closest("[data-simple-card]");
        const i = +(card?.dataset.simpleCard || 0);
        const q = getData()[i];
        const k = del.dataset.delOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    window.__openImportPreviewModal = openSimplePreview;
    window.__editImportPreviewQuestion = function(i) {
      const data = getData();
      const card = document.querySelector(`[data-simple-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    let currentFilter = "all";
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function detect(q) {
      q.images = q.images || [];
      q.has_image = !!(q.has_image || q.images && q.images.length);
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? "medium" : "low";
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
      return ans.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ");
    }
    function riskColor(r) {
      return { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" }[r] || "#999";
    }
    function riskLabel(r) {
      return { high: "Cao", medium: "Trung b\xECnh", low: "Th\u1EA5p" }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map((k) => String(k).toUpperCase()));
      return LETTERS.find((k) => !used.has(k));
    }
    function imgSrc(im) {
      return typeof im === "string" ? im : im?.src || im?.url || "";
    }
    function pass(q) {
      if (currentFilter === "all") return true;
      if (currentFilter === "has_image") return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stat(data) {
      return { total: data.length, img: data.filter((q) => q.has_image).length, high: data.filter((q) => q.error_risk === "high").length, medium: data.filter((q) => q.error_risk === "medium").length, low: data.filter((q) => q.error_risk === "low").length };
    }
    function renderStats(data) {
      const s = stat(data), box = document.getElementById("simplePreviewStats");
      if (!box) return;
      const filters = [["all", "Th\u01B0 vi\u1EC7n"], ["has_image", "\u{1F4F7} C\xF3 \u1EA3nh"], ["high", "R\u1EE7i ro cao"], ["medium", "Trung b\xECnh"], ["low", "Th\u1EA5p"]];
      box.innerHTML = `<div class="simplePreviewStatLine"><span class="simplePreviewStatItem">${s.total} c\xE2u</span><span class="simplePreviewStatItem" style="color:#3498db">${s.img} c\xF3 \u1EA3nh</span><span class="simplePreviewStatItem" style="color:#e74c3c">${s.high} r\u1EE7i ro cao</span><span class="simplePreviewStatItem" style="color:#f39c12">${s.medium} trung b\xECnh</span><span class="simplePreviewStatItem" style="color:#27ae60">${s.low} th\u1EA5p</span></div><div class="simplePreviewFilterLine">${filters.map((f) => `<button type="button" class="imagePreviewFilterBtn ${currentFilter === f[0] ? "active" : ""}" data-imgui-filter="${f[0]}">${f[1]}</button>`).join("")}</div>`;
    }
    function miniImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return '<div class="imageMiniPreview"></div>';
      return `<div class="imageMiniPreview"><img src="${esc2(imgs[0])}" alt="\u1EA2nh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="imageMiniCount">+${imgs.length - 1}</span>` : ""}</div>`;
    }
    function renderCard2(q, i) {
      const ans = normAns(q) || "?";
      return `<article class="simplePreviewCard" data-imgui-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="imagePreviewListRow"><div class="simplePreviewNum">C\xE2u ${esc2(q.num || i + 1)}</div><div class="simplePreviewMain"><div class="simplePreviewQuestion">${esc2(q.question || "")}</div><div class="simplePreviewCorrect"><b>\u0110\xE1p \xE1n: ${esc2(ans)}</b><span>${esc2(correctText(q))}</span></div></div>${miniImages(q)}<div class="simplePreviewMetaMini"><span class="simplePreviewRiskDot" style="background:${riskColor(q.error_risk)}" title="R\u1EE7i ro: ${esc2(riskLabel(q.error_risk))}"></span><button class="simplePreviewEditBtn" type="button" data-imgui-edit="${i}">S\u1EEDa</button></div></div></article>`;
    }
    function renderImages(q, i) {
      const imgs = q.images || [];
      return `<div class="simpleEditImages"><div class="simpleEditImagesHead"><span>\u1EA2nh c\u1EE7a c\xE2u h\u1ECFi</span><button class="simpleImageUploadBtn" type="button" data-imgui-pick-img="${i}">+ Th\xEAm \u1EA3nh</button><input class="simpleImgHiddenInput" type="file" accept="image/*" multiple data-imgui-input="${i}"></div><div class="simpleImageThumbs">${imgs.length ? imgs.map((im, idx) => `<div class="simpleImageThumb"><button class="simpleImageRemove" type="button" data-imgui-rm-img="${idx}">\xD7</button><img src="${esc2(imgSrc(im))}" alt="\u1EA2nh ${idx + 1}" loading="lazy" decoding="async"></div>`).join("") : '<div class="simpleNoImage">Ch\u01B0a c\xF3 \u1EA3nh. B\u1EA5m \u201C+ Th\xEAm \u1EA3nh\u201D n\u1EBFu c\xE2u n\xE0y c\u1EA7n h\xECnh.</div>'}</div></div>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts).sort().map((k) => `<div class="simpleEditOption" data-opt-row="${esc2(k)}"><div class="simpleEditKey">${esc2(k)}</div><input value="${esc2(opts[k] || "")}" data-imgui-opt="${esc2(k)}"><button class="simpleEditDel" type="button" data-imgui-del-opt="${esc2(k)}">\xD7</button></div>`).join("");
      return `<article class="simplePreviewCard simpleEditCard" data-imgui-card="${i}"><div class="simpleEditHead imageEditHeadTop"><div class="simpleEditTitle">S\u1EEDa to\xE0n b\u1ED9 C\xE2u ${esc2(q.num || i + 1)}</div><div class="imageEditHeadActions"><button class="btn" type="button" data-imgui-cancel="${i}">H\u1EE7y</button><button class="primary" type="button" data-imgui-save="${i}">L\u01B0u s\u1EEDa</button></div></div><div class="simpleEditGrid"><div class="simpleEditField"><label>C\xE2u h\u1ECFi</label><textarea data-imgui-question>${esc2(q.question || "")}</textarea></div><div class="simpleEditField"><label>\u0110\xE1p \xE1n \u0111\xFAng</label><input data-imgui-answer value="${esc2(normAns(q))}" placeholder="VD: A ho\u1EB7c AC"></div></div><div class="simpleEditField" style="margin-top:10px"><label>C\xE1c \u0111\xE1p \xE1n</label><div class="simpleEditOptions">${optionRows}</div></div>${renderImages(q, i)}<div class="simpleEditBottom imageEditBottomOnlyAdd"><button class="btn" type="button" data-imgui-add-opt="${i}">+ Th\xEAm \u0111\xE1p \xE1n</button></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById("simplePreviewList");
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter((x) => pass(x.q));
      list.innerHTML = filtered.length ? filtered.map((x) => renderCard2(x.q, x.i)).join("") : '<div class="simplePreviewEmpty">Kh\xF4ng c\xF3 c\xE2u n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.</div>';
      renderStats(data);
    }
    function openPreview(data) {
      data = getData(data);
      let modal = document.getElementById("importPreviewModal");
      if (modal) modal.remove();
      modal = document.createElement("div");
      modal.id = "importPreviewModal";
      modal.className = "modal simpleImportPreviewModal";
      modal.innerHTML = `<div class="box simpleImportPreviewBox"><button class="modalX" type="button" data-imgui-close>\xD7</button><div class="simplePreviewHead"><div><span class="simplePreviewLabel">XEM TR\u01AF\u1EDAC IMPORT</span><h2>Ki\u1EC3m tra c\xE2u h\u1ECFi</h2><p class="simplePreviewHint">Ch\u1EC9 hi\u1EC7n c\xE2u h\u1ECFi v\xE0 \u0111\xE1p \xE1n \u0111\xFAng. C\xE2u c\xF3 \u1EA3nh s\u1EBD hi\u1EC7n preview nh\u1ECF.</p></div><div class="simplePreviewActions"><button class="primary simplePreviewSave" type="button" data-imgui-submit>L\u01B0u M\xF4n H\u1ECDc</button></div></div><div id="simplePreviewStats" class="simplePreviewStats"></div><div id="simplePreviewList" class="simplePreviewList"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector("[data-imgui-question]")?.value || "").trim();
      const answer = (card.querySelector("[data-imgui-answer]")?.value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (!question) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!answer) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const options = {};
      card.querySelectorAll("[data-imgui-opt]").forEach((inp) => {
        const k = String(inp.dataset.imguiOpt || "").toUpperCase();
        const v = (inp.value || "").trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert("C\u1EA7n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      for (const k of answer.split("")) {
        if (!options[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer.split("").map((k) => k + ". " + (options[k] || "")).join("; ");
      q.has_image = !!(q.images && q.images.length);
      renderList(data);
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u s\u1EEDa c\xE2u " + (q.num || i + 1));
    }
    document.addEventListener("click", function(e) {
      const filter = e.target.closest("[data-imgui-filter]");
      if (filter) {
        currentFilter = filter.dataset.imguiFilter || "all";
        renderList(getData());
        return;
      }
      if (e.target.closest("[data-imgui-close]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        return;
      }
      if (e.target.closest("[data-imgui-submit]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest("[data-imgui-edit]");
      if (edit) {
        const i = +edit.dataset.imguiEdit;
        const data = getData();
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-imgui-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest("[data-imgui-cancel]");
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest("[data-imgui-save]");
      if (save) {
        saveEdit(+save.dataset.imguiSave);
        return;
      }
      const pick = e.target.closest("[data-imgui-pick-img]");
      if (pick) {
        document.querySelector(`[data-imgui-input="${pick.dataset.imguiPickImg}"]`)?.click();
        return;
      }
      const rm = e.target.closest("[data-imgui-rm-img]");
      if (rm) {
        const card = rm.closest("[data-imgui-card]");
        const i = +(card?.dataset.imguiCard || 0);
        const q = getData()[i];
        if (q?.images) {
          q.images.splice(+rm.dataset.imguiRmImg, 1);
          q.has_image = !!q.images.length;
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
      const add = e.target.closest("[data-imgui-add-opt]");
      if (add) {
        const i = +add.dataset.imguiAddOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 \u0111\xE1p \xE1n.");
        q.options = q.options || {};
        q.options[k] = "";
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-imgui-card="${i}"] [data-imgui-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest("[data-imgui-del-opt]");
      if (del) {
        const card = del.closest("[data-imgui-card]");
        const i = +(card?.dataset.imguiCard || 0);
        const q = getData()[i];
        const k = del.dataset.imguiDelOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    document.addEventListener("change", async function(e) {
      const inp = e.target.closest("[data-imgui-input]");
      if (!inp) return;
      const i = +inp.dataset.imguiInput;
      const q = getData()[i];
      if (!q) return;
      q.images = q.images || [];
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      inp.disabled = true;
      if (typeof notify === "function") notify("\u0110ang upload \u1EA3nh...");
      try {
        for (const file of files) {
          if (window.__LHUploadCloudinary) {
            const uploaded = await window.__LHUploadCloudinary(file);
            if (uploaded) q.images.push(uploaded);
          } else {
            const fr = new FileReader();
            const p = new Promise((resolve) => {
              fr.onload = function() {
                q.images.push({ id: "import_" + Date.now() + "_" + Math.random().toString(16).slice(2), src: fr.result, source: "user-upload", name: file.name });
                resolve();
              };
              fr.readAsDataURL(file);
            });
            await p;
          }
        }
        q.has_image = true;
        const card = document.querySelector(`[data-imgui-card="${i}"]`);
        if (card) card.outerHTML = renderEditCard(q, i);
        if (typeof notify === "function") notify("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = "";
      }
    });
    window.__openImportPreviewModal = openPreview;
    window.__editImportPreviewQuestion = function(i) {
      const data = getData();
      const card = document.querySelector(`[data-imgui-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    let currentFilter = "all";
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function getData(data) {
      const arr = data || window.__previewImportData || [];
      window.__previewImportData = arr;
      arr.forEach(detect);
      return arr;
    }
    function normAns(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function detect(q) {
      q.images = q.images || [];
      q.has_image = !!(q.has_image || q.images && q.images.length);
      if (!q.error_risk) q.error_risk = normAns(q).length > 1 ? "medium" : "low";
      return q;
    }
    function correctText(q) {
      const ans = normAns(q);
      if (!ans) return "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
      return ans.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ");
    }
    function riskColor(r) {
      return { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" }[r] || "#999";
    }
    function riskLabel(r) {
      return { high: "Cao", medium: "Trung b\xECnh", low: "Th\u1EA5p" }[r] || r;
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map((k) => String(k).toUpperCase()));
      return LETTERS.find((k) => !used.has(k));
    }
    function imgSrc(im) {
      return typeof im === "string" ? im : im?.src || im?.url || "";
    }
    function pass(q) {
      if (currentFilter === "all") return true;
      if (currentFilter === "has_image") return !!q.has_image;
      return q.error_risk === currentFilter;
    }
    function stats(data) {
      return { total: data.length, img: data.filter((q) => q.has_image).length, high: data.filter((q) => q.error_risk === "high").length, medium: data.filter((q) => q.error_risk === "medium").length, low: data.filter((q) => q.error_risk === "low").length };
    }
    function renderStats(data) {
      const s = stats(data), box = document.getElementById("v7Stats");
      if (!box) return;
      const filters = [["all", "Th\u01B0 vi\u1EC7n"], ["has_image", "\u{1F4F7} C\xF3 \u1EA3nh"], ["high", "R\u1EE7i ro cao"], ["medium", "Trung b\xECnh"], ["low", "Th\u1EA5p"]];
      box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} c\xE2u</span><span class="v7StatItem" style="color:#3498db">${s.img} c\xF3 \u1EA3nh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} r\u1EE7i ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung b\xECnh</span><span class="v7StatItem" style="color:#27ae60">${s.low} th\u1EA5p</span></div><div class="v7FilterLine">${filters.map((f) => `<button type="button" class="v7FilterBtn ${currentFilter === f[0] ? "active" : ""}" data-v7-filter="${f[0]}">${f[1]}</button>`).join("")}</div>`;
    }
    function miniImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return '<div class="v7MiniImgs"></div>';
      return `<div class="v7MiniImgs"><img src="${esc2(imgs[0])}" alt="\u1EA2nh preview" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ""}</div>`;
    }
    function renderCard2(q, i) {
      const ans = normAns(q) || "?";
      return `<article class="v7Card" data-v7-card="${i}" style="border-left-color:${riskColor(q.error_risk)}!important"><div class="v7Row"><div class="v7Num">C\xE2u ${esc2(q.num || i + 1)}</div><div class="v7Main"><div class="v7Question">${esc2(q.question || "")}</div><div class="v7Answer"><b>\u0110\xE1p \xE1n: ${esc2(ans)}</b><span>${esc2(correctText(q))}</span></div></div>${miniImages(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${riskColor(q.error_risk)}" title="R\u1EE7i ro: ${esc2(riskLabel(q.error_risk))}"></span><button class="v7EditBtn" type="button" data-v7-edit="${i}">S\u1EEDa</button></div></div></article>`;
    }
    function renderImages(q, i) {
      const imgs = q.images || [];
      return `<div class="v7Images"><div class="v7ImagesHead"><span>\u1EA2nh c\u1EE7a c\xE2u h\u1ECFi</span><button class="v7UploadBtn" type="button" data-v7-pick-img="${i}">+ Th\xEAm \u1EA3nh</button><input class="v7HiddenInput" type="file" accept="image/*" multiple data-v7-input="${i}"></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, idx) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-v7-rm-img="${idx}">\xD7</button><img src="${esc2(imgSrc(im))}" alt="\u1EA2nh ${idx + 1}" loading="lazy" decoding="async"></div>`).join("") : '<div class="v7NoImage">Ch\u01B0a c\xF3 \u1EA3nh. B\u1EA5m \u201C+ Th\xEAm \u1EA3nh\u201D n\u1EBFu c\xE2u n\xE0y c\u1EA7n h\xECnh.</div>'}</div></div>`;
    }
    function renderEditCard(q, i) {
      const opts = q.options || {};
      const optionRows = Object.keys(opts).sort().map((k) => `<div class="v7OptRow"><div class="v7Key">${esc2(k)}</div><input value="${esc2(opts[k] || "")}" data-v7-opt="${esc2(k)}"><button class="v7DelOpt" type="button" data-v7-del-opt="${esc2(k)}">\xD7</button></div>`).join("");
      return `<article class="v7Card" data-v7-card="${i}"><div class="v7EditHead"><div class="v7EditTitle">S\u1EEDa to\xE0n b\u1ED9 C\xE2u ${esc2(q.num || i + 1)}</div><div class="v7EditHeadActions"><button class="btn" type="button" data-v7-cancel="${i}">H\u1EE7y</button><button class="primary" type="button" data-v7-save="${i}">L\u01B0u s\u1EEDa</button></div></div><div class="v7EditGrid"><div class="v7Field"><label>C\xE2u h\u1ECFi</label><textarea data-v7-question>${esc2(q.question || "")}</textarea></div><div class="v7Field"><label>\u0110\xE1p \xE1n \u0111\xFAng</label><input data-v7-answer value="${esc2(normAns(q))}" placeholder="VD: A ho\u1EB7c AC"></div></div><div class="v7Field" style="margin-top:10px"><label>C\xE1c \u0111\xE1p \xE1n</label><div class="v7Options">${optionRows}</div></div>${renderImages(q, i)}<div class="v7Bottom"><button class="btn" type="button" data-v7-add-opt="${i}">+ Th\xEAm \u0111\xE1p \xE1n</button></div></article>`;
    }
    function renderList(data) {
      const list = document.getElementById("v7List");
      if (!list) return;
      const filtered = data.map((q, i) => ({ q, i })).filter((x) => pass(x.q));
      list.innerHTML = filtered.length ? filtered.map((x) => renderCard2(x.q, x.i)).join("") : '<div class="v7Empty">Kh\xF4ng c\xF3 c\xE2u n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.</div>';
      renderStats(data);
    }
    function openPreview(data) {
      data = getData(data);
      let modal = document.getElementById("importPreviewModal");
      if (modal) modal.remove();
      modal = document.createElement("div");
      modal.id = "importPreviewModal";
      modal.className = "modal v7ImportModal";
      modal.innerHTML = `<div class="box v7ImportBox"><button class="modalX" type="button" data-v7-close>\xD7</button><div class="v7Head"><div><span class="v7Label">XEM TR\u01AF\u1EDAC IMPORT</span><h2>Ki\u1EC3m tra c\xE2u h\u1ECFi</h2><p class="v7Hint">Ch\u1EC9 hi\u1EC7n c\xE2u h\u1ECFi v\xE0 \u0111\xE1p \xE1n \u0111\xFAng. C\xE2u c\xF3 \u1EA3nh s\u1EBD hi\u1EC7n preview nh\u1ECF.</p></div><div class="v7TopActions"><button class="primary v7SaveTop" type="button" data-v7-submit>L\u01B0u M\xF4n H\u1ECDc</button></div></div><div id="v7Stats" class="v7Stats"></div><div id="v7List" class="v7List"></div></div>`;
      document.body.appendChild(modal);
      renderList(data);
    }
    function saveEdit(i) {
      const data = getData();
      const q = data[i];
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (!q || !card) return;
      const question = (card.querySelector("[data-v7-question]")?.value || "").trim();
      const answer = (card.querySelector("[data-v7-answer]")?.value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (!question) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!answer) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const options = {};
      card.querySelectorAll("[data-v7-opt]").forEach((inp) => {
        const k = String(inp.dataset.v7Opt || "").toUpperCase();
        const v = (inp.value || "").trim();
        if (k && v) options[k] = v;
      });
      if (!Object.keys(options).length) return alert("C\u1EA7n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      for (const k of answer.split("")) {
        if (!options[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      }
      q.question = question;
      q.answer = answer;
      q.options = options;
      q.answer_text = answer.split("").map((k) => k + ". " + (options[k] || "")).join("; ");
      q.has_image = !!(q.images && q.images.length);
      renderList(data);
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u s\u1EEDa c\xE2u " + (q.num || i + 1));
    }
    document.addEventListener("click", function(e) {
      const filter = e.target.closest("[data-v7-filter]");
      if (filter) {
        currentFilter = filter.dataset.v7Filter || "all";
        renderList(getData());
        return;
      }
      if (e.target.closest("[data-v7-close]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        return;
      }
      if (e.target.closest("[data-v7-submit]")) {
        document.getElementById("importPreviewModal")?.classList.add("hidden");
        window.__submitSubjectRequest?.();
        return;
      }
      const edit = e.target.closest("[data-v7-edit]");
      if (edit) {
        const i = +edit.dataset.v7Edit;
        const data = getData();
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card && data[i]) {
          card.outerHTML = renderEditCard(data[i], i);
          document.querySelector(`[data-v7-card="${i}"] textarea`)?.focus();
        }
        return;
      }
      const cancel = e.target.closest("[data-v7-cancel]");
      if (cancel) {
        renderList(getData());
        return;
      }
      const save = e.target.closest("[data-v7-save]");
      if (save) {
        saveEdit(+save.dataset.v7Save);
        return;
      }
      const pick = e.target.closest("[data-v7-pick-img]");
      if (pick) {
        document.querySelector(`[data-v7-input="${pick.dataset.v7PickImg}"]`)?.click();
        return;
      }
      const rm = e.target.closest("[data-v7-rm-img]");
      if (rm) {
        const card = rm.closest("[data-v7-card]");
        const i = +(card?.dataset.v7Card || 0);
        const q = getData()[i];
        if (q?.images) {
          q.images.splice(+rm.dataset.v7RmImg, 1);
          q.has_image = !!q.images.length;
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
      const add = e.target.closest("[data-v7-add-opt]");
      if (add) {
        const i = +add.dataset.v7AddOpt;
        const data = getData();
        const q = data[i];
        const k = nextKey(q.options || {});
        if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 \u0111\xE1p \xE1n.");
        q.options = q.options || {};
        q.options[k] = "";
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card) {
          card.outerHTML = renderEditCard(q, i);
          document.querySelector(`[data-v7-card="${i}"] [data-v7-opt="${k}"]`)?.focus();
        }
        return;
      }
      const del = e.target.closest("[data-v7-del-opt]");
      if (del) {
        const card = del.closest("[data-v7-card]");
        const i = +(card?.dataset.v7Card || 0);
        const q = getData()[i];
        const k = del.dataset.v7DelOpt;
        if (q?.options && k) {
          delete q.options[k];
          card.outerHTML = renderEditCard(q, i);
        }
        return;
      }
    });
    document.addEventListener("change", async function(e) {
      const inp = e.target.closest("[data-v7-input]");
      if (!inp) return;
      const i = +inp.dataset.v7Input;
      const q = getData()[i];
      if (!q) return;
      q.images = q.images || [];
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      inp.disabled = true;
      if (typeof notify === "function") notify("\u0110ang upload \u1EA3nh...");
      try {
        for (const file of files) {
          if (window.__LHUploadCloudinary) {
            const uploaded = await window.__LHUploadCloudinary(file);
            if (uploaded) q.images.push(uploaded);
          } else {
            const fr = new FileReader();
            const p = new Promise((resolve) => {
              fr.onload = function() {
                q.images.push({ id: "import_" + Date.now() + "_" + Math.random().toString(16).slice(2), src: fr.result, source: "user-upload", name: file.name });
                resolve();
              };
              fr.readAsDataURL(file);
            });
            await p;
          }
        }
        q.has_image = true;
        const card = document.querySelector(`[data-v7-card="${i}"]`);
        if (card) card.outerHTML = renderEditCard(q, i);
        if (typeof notify === "function") notify("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
      } catch (err) {
        alert(err.message || err);
      } finally {
        inp.disabled = false;
        inp.value = "";
      }
    });
    window.__openImportPreviewModal = openPreview;
    window.__editImportPreviewQuestion = function(i) {
      const data = getData();
      const card = document.querySelector(`[data-v7-card="${i}"]`);
      if (card && data[i]) card.outerHTML = renderEditCard(data[i], i);
    };
  })();
  (function() {
    function ensureLightbox() {
      let lb = document.getElementById("v7ImageLightbox");
      if (lb) return lb;
      lb = document.createElement("div");
      lb.id = "v7ImageLightbox";
      lb.className = "v7Lightbox hidden";
      lb.innerHTML = '<div class="v7LightboxInner"><button class="v7LightboxClose" type="button" aria-label="\u0110\xF3ng">\xD7</button><img class="v7LightboxImg" alt="\u1EA2nh ph\xF3ng to" loading="lazy" decoding="async"></div>';
      document.body.appendChild(lb);
      return lb;
    }
    function openImg(src) {
      if (!src) return;
      const lb = ensureLightbox();
      const img = lb.querySelector(".v7LightboxImg");
      if (img) img.src = src;
      lb.classList.remove("hidden");
    }
    function closeImg() {
      const lb = document.getElementById("v7ImageLightbox");
      if (!lb) return;
      lb.classList.add("hidden");
      const img = lb.querySelector(".v7LightboxImg");
      if (img) img.removeAttribute("src");
    }
    document.addEventListener("click", function(e) {
      const thumb = e.target.closest(".v7MiniImgs img, .v7Thumb img");
      if (thumb) {
        e.preventDefault();
        e.stopPropagation();
        openImg(thumb.currentSrc || thumb.src);
        return;
      }
      if (e.target.closest(".v7LightboxClose") || e.target.id === "v7ImageLightbox") {
        closeImg();
      }
    }, true);
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") closeImg();
    });
  })();
  (function() {
    window.__APP_UI_CLEAN_FINAL__ = "20260627";
    function cleanupOldUI() {
      ["#hodLoginScreen", "#hodRoleBar", "#hodUserDock", "#hodFinalRoleBar", "#hodFinalLogin", ".hodAuthLanding", ".hodFloatingAuth", ".legacyLogin", ".legacyAuth", ".oldLanding"].forEach(function(s) {
        document.querySelectorAll(s).forEach(function(el) {
          el.remove();
        });
      });
      ["#hodTopAvatar", "#subjectTopChip", "#hodAccountMenu"].forEach(function(s) {
        var arr = Array.from(document.querySelectorAll(s));
        arr.slice(0, Math.max(0, arr.length - 1)).forEach(function(el) {
          el.remove();
        });
      });
      if (!window.HODSupabase?.canOpenDashboard?.()) {
        document.querySelectorAll("#adminOpenBtn,#hodFloatAdmin").forEach(function(el) {
          el.remove();
        });
        document.getElementById("adminModal")?.classList.add("hidden");
      }
      document.querySelectorAll("#shuffle,#stShuffle").forEach(function(el) {
        el.style.display = "none";
        el.disabled = true;
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cleanupOldUI);
    else cleanupOldUI();
    setTimeout(cleanupOldUI, 300);
    setTimeout(cleanupOldUI, 1200);
  })();
  (function() {
    let examOnlyIndex = 0;
    let examOnlyReview = false;
    let examSelectedCodes = [];
    let timerInt = null;
    let examStart = 0;
    let examBaseMs = 0;
    let examElapsed = "00:00";
    let examLayoutMode = localStorage.getItem("hod102_exam_layout_mode") || "standard";
    let kizspyFontSize = parseInt(localStorage.getItem("hod102_kizspy_font_size") || "10", 10);
    let kizspySplitPct = parseFloat(localStorage.getItem("hod102_kizspy_split_pct") || "42");
    let kizspyCheckedMap = {};
    const EXAM_STORE = "learninghub_exam_state_v1";
    const $2 = (id) => document.getElementById(id);
    const E = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const S = (s) => typeof sortAns === "function" ? sortAns(s || "") : String(s || "").split("").sort().join("");
    const FMT = (ms) => typeof fmt === "function" ? fmt(ms) : String(Math.floor(ms / 6e4)).padStart(2, "0") + ":" + String(Math.floor(ms / 1e3) % 60).padStart(2, "0");
    const IMG = (c) => {
      try {
        return typeof imgsHTML === "function" ? imgsHTML(c) : "";
      } catch (e) {
        return "";
      }
    };
    const EXPLAIN = (c) => {
      try {
        return typeof finalAnswerText === "function" ? finalAnswerText(c) : answerText(c);
      } catch (e) {
        return String(c?.answer || "").split("").map((k) => k + ". " + ((c?.options || {})[k] || "")).join("; ");
      }
    };
    const done = () => Object.keys(qSel || {}).filter((k) => qSel[k]).length;
    const examSubject = () => {
      try {
        return localStorage.getItem("learninghub_subject_code_merged_v1") || "";
      } catch (e) {
        return "";
      }
    };
    const displayCode = (code) => String(code || "");
    const baseCode = (code) => String(code || "").split(/[_\-\s]/)[0].toUpperCase();
    function timeMsFromText(t) {
      const m = String(t || "").match(/^(\d+):(\d+)$/);
      return m ? (+m[1] * 60 + +m[2]) * 1e3 : 0;
    }
    function setTimerText() {
      const el = $2("examTimer");
      if (el) el.textContent = examElapsed;
    }
    function startTimer(resumeMs = 0) {
      clearInterval(timerInt);
      examBaseMs = Math.max(0, resumeMs || 0);
      examStart = Date.now();
      examElapsed = FMT(examBaseMs);
      setTimerText();
      timerInt = setInterval(() => {
        examElapsed = FMT(examBaseMs + Date.now() - examStart);
        setTimerText();
      }, 1e3);
    }
    function stopTimer() {
      clearInterval(timerInt);
      timerInt = null;
    }
    function resetTimer() {
      stopTimer();
      examBaseMs = 0;
      examStart = 0;
      examElapsed = "00:00";
      setTimerText();
    }
    function nowTimerMs() {
      return examSubmitted || !timerInt ? timeMsFromText(examElapsed) : examBaseMs + Date.now() - examStart;
    }
    function saveExam() {
      try {
        if (!qSet || !qSet.length) return;
        localStorage.setItem(EXAM_STORE, JSON.stringify({
          subject: examSubject(),
          nums: (qSet || []).map((c) => c.num),
          ids: (qSet || []).map((c) => c.id || ""),
          qSel: qSel || {},
          submitted: !!examSubmitted,
          index: examOnlyIndex || 0,
          review: !!examOnlyReview,
          qCnt: qCnt || 0,
          timerMs: nowTimerMs(),
          timer: examElapsed,
          layoutMode: examLayoutMode
        }));
      } catch (e) {
      }
    }
    function clearExam() {
      try {
        localStorage.removeItem(EXAM_STORE);
      } catch (e) {
      }
    }
    function restoreExam() {
      try {
        const st = JSON.parse(localStorage.getItem(EXAM_STORE) || "null");
        if (!st || !Array.isArray(st.nums) || !st.nums.length || !Array.isArray(RAW) || !RAW.length) return false;
        if (st.subject && examSubject() && st.subject !== examSubject()) return false;
        const restored = st.nums.map((n, i) => RAW.find((c) => String(c.id || "") === String(st.ids?.[i] || "") || Number(c.num) === Number(n))).filter(Boolean);
        if (!restored.length) return false;
        qSet = restored;
        qSel = st.qSel || {};
        examSubmitted = !!st.submitted;
        examOnlyIndex = Math.max(0, Math.min(+st.index || 0, qSet.length - 1));
        examOnlyReview = !!st.review;
        qCnt = st.qCnt || 0;
        if (st.layoutMode) examLayoutMode = st.layoutMode;
        quizMode = "exam";
        examElapsed = st.timer || FMT(+st.timerMs || 0);
        if (!examSubmitted && !timerInt) startTimer(+st.timerMs || timeMsFromText(examElapsed));
        return true;
      } catch (e) {
        return false;
      }
    }
    function markTab() {
      document.querySelectorAll(".tab").forEach((t) => {
        if (t.dataset?.tab === "quiz") t.textContent = "Ki\u1EC3m tra";
      });
    }
    function removeOldQuizUI() {
      document.querySelectorAll("#quiz .modeRow,#quiz .cntGrid:not(.examOnlyCountGrid),#practiceMode,#examMode").forEach((x) => x.remove());
    }
    let examSubjectsData = [];
    let examSubjectsFetchedAt = 0;
    async function ensureExamSubjects() {
      if (ensureExamSubjects.__busy) return;
      if (!window.HODSupabase?.getUser?.()) return;
      const prof = window.HODSupabase?.getProfile?.();
      if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === "0")) return;
      if (examSubjectsData.length && Date.now() - examSubjectsFetchedAt < 6e4) return;
      ensureExamSubjects.__busy = true;
      try {
        const res = await fetch("/api/subjects?ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json.data) ? json.data : [];
        if (res.ok && rows.length) {
          examSubjectsData = rows.filter((s) => s && s.is_active !== false);
          examSubjectsFetchedAt = Date.now();
          if (document.querySelector("#quiz .setup .examOnlyStart")) setup();
        }
      } catch (e) {
        console.warn("[exam subjects]", e);
      } finally {
        ensureExamSubjects.__busy = false;
      }
    }
    function cachedSubjects() {
      let subjects = typeof window.getSubjectsCache === "function" ? window.getSubjectsCache() || [] : [];
      if (!subjects.length) subjects = examSubjectsData;
      if (!subjects.length || Date.now() - examSubjectsFetchedAt > 6e4) ensureExamSubjects();
      return subjects;
    }
    function setup() {
      const box = document.querySelector("#quiz .setup");
      if (!box) return;
      const activeSubject = examSubject();
      const subjects = cachedSubjects();
      const totalCount = (RAW || []).length;
      if (activeSubject && (!examSelectedCodes.length || !examSelectedCodes.includes(activeSubject))) examSelectedCodes = [activeSubject];
      const activeBase = baseCode(activeSubject);
      const activeSub = subjects.find((s) => s.code === activeSubject) || (activeSubject ? { code: activeSubject, name: displayCode(activeSubject), question_count: totalCount } : null);
      const matchingSubjects = subjects.filter((s) => s.code !== activeSubject && baseCode(s.code) === activeBase);
      const activeCard = activeSub ? `
      <div class="examActiveSubjectCard">
        <div class="examActiveSubjectTop"><span class="examActiveSubjectCode">${E(displayCode(activeSub.code))}</span><span class="examActiveSubjectName">${E(activeSub.name || displayCode(activeSub.code))}</span></div>
        <div class="examActiveSubjectDesc">${E(activeSub.description || "M\xF4n h\u1ECDc ch\u01B0a c\xF3 m\xF4 t\u1EA3.")}</div>
        <div class="examActiveSubjectMeta">${E(activeSub.question_count || totalCount || 0)} c\xE2u</div>
      </div>` : "";
      const extraChips = matchingSubjects.map((s) => {
        const checked = examSelectedCodes.includes(s.code);
        return `<label class="examSubjectChip ${checked ? "checked" : ""}" data-exam-subj="${E(s.code)}">
        <input type="checkbox" value="${E(s.code)}" ${checked ? "checked" : ""}>
        <span class="examSubjectChipTop"><span class="examSubjectChipCode">${E(displayCode(s.code))}</span><span class="examSubjectChipName">${E(s.name || "")}</span></span>
        <span class="examSubjectChipDesc">${E(s.description || "M\xF4n h\u1ECDc ch\u01B0a c\xF3 m\xF4 t\u1EA3.")}</span>
        <span class="examSubjectChipDivider"></span>
        <span class="examSubjectChipBottom"><span class="examSubjectChipCount">${E(s.question_count || 0)} c\xE2u</span><span class="examSubjectChipChoose">${checked ? "\u0110\xE3 ch\u1ECDn" : "Ch\u1ECDn"}</span></span>
      </label>`;
      }).join("");
      box.innerHTML = `
      <div class="examOnlyStart">
        <div class="examOnlyBadge">KI\u1EC2M TRA</div>
        <div class="examOnlyLabel">M\xF4n \u0111ang h\u1ECDc</div>
        ${activeCard || '<span style="color:var(--mist)">Ch\u01B0a ch\u1ECDn m\xF4n h\u1ECDc</span>'}
        ${extraChips ? `<div class="examOnlyLabel">G\u1ED9p th\xEAm m\xF4n <span style="font-weight:400;color:var(--mist);font-size:.85rem">(ch\u1ECDn th\xEAm m\xF4n c\xF9ng m\xE3 \u0111\u1EC3 g\u1ED9p \u0111\u1EC1)</span></div><div class="examSubjectChips" id="examSubjectChipsExtra">${extraChips}</div>` : ""}
        <div class="examOnlyLabel">S\u1ED1 c\xE2u ki\u1EC3m tra <span style="font-weight:400;color:var(--mist);font-size:.85rem">(Th\u01B0 vi\u1EC7n hi\u1EC7n c\xF3: <span id="examTotalCountVal">${totalCount}</span> c\xE2u)</span></div>
        <div class="examOnlyCountGrid">
          <button class="cnt" data-exam-cnt="10">10</button>
          <button class="cnt" data-exam-cnt="20">20</button>
          <button class="cnt" data-exam-cnt="30">30</button>
          <button class="cnt" data-exam-cnt="50">50</button>
          <button class="cnt" data-exam-cnt="100">100</button>
          <button class="cnt" data-exam-cnt="0">T\u1EA5t c\u1EA3</button>
        </div>
        <div class="examCustomCntRow"><label class="examCustomCntLabel">T\xF9y ch\u1EC9nh:</label><input type="number" id="examCustomCnt" class="examCustomCntInput" min="1" placeholder="Nh\u1EADp s\u1ED1 c\xE2u..."><button type="button" class="cnt examCustomCntApply" id="examCustomCntApply">\xC1p d\u1EE5ng</button></div>
        <button id="start" class="start" type="button">B\u1EAFt \u0111\u1EA7u ki\u1EC3m tra</button>
      </div>`;
      const updateMergedCount = () => {
        const sum = subjects.filter((s) => examSelectedCodes.includes(s.code)).reduce((acc, s) => acc + (+s.question_count || 0), 0) || totalCount;
        const el = $2("examTotalCountVal");
        if (el) el.textContent = sum;
      };
      updateMergedCount();
      box.querySelectorAll('.examSubjectChip input[type="checkbox"]').forEach((cb) => {
        cb.onchange = () => {
          const code = cb.value;
          const label = cb.closest(".examSubjectChip");
          if (cb.checked) {
            if (!examSelectedCodes.includes(code)) examSelectedCodes.push(code);
            label?.classList.add("checked");
          } else {
            examSelectedCodes = examSelectedCodes.filter((c) => c !== code);
            label?.classList.remove("checked");
          }
          const choose = label?.querySelector(".examSubjectChipChoose");
          if (choose) choose.textContent = cb.checked ? "\u0110\xE3 ch\u1ECDn" : "Ch\u1ECDn";
          updateMergedCount();
        };
      });
      box.querySelectorAll("[data-exam-cnt]").forEach((b) => {
        const cnt = +b.dataset.examCnt;
        b.classList.toggle("sel", cnt === qCnt);
        b.onclick = () => {
          qCnt = cnt;
          box.querySelectorAll("[data-exam-cnt]").forEach((x) => x.classList.remove("sel"));
          b.classList.add("sel");
          const input = $2("examCustomCnt");
          if (input) input.value = "";
        };
      });
      const applyBtn = $2("examCustomCntApply");
      const customInput = $2("examCustomCnt");
      if (applyBtn && customInput) {
        const applyCustom = () => {
          const v = parseInt(customInput.value, 10);
          if (v > 0) {
            qCnt = v;
            box.querySelectorAll("[data-exam-cnt]").forEach((x) => x.classList.remove("sel"));
          }
        };
        applyBtn.onclick = applyCustom;
        customInput.onkeydown = (e) => {
          if (e.key === "Enter") applyCustom();
        };
      }
      const startBtn = $2("start");
      if (startBtn) {
        startBtn.onclick = () => {
          showLayoutPickerModal(() => {
            start();
          });
        };
      }
    }
    function showLayoutPickerModal(onConfirm) {
      let modal = document.getElementById("examLayoutPickerModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "examLayoutPickerModal";
        document.body.appendChild(modal);
      }
      modal.className = "examLayoutPickerOverlay";
      modal.innerHTML = `
      <div class="examLayoutPickerBox">
        <h3 class="examLayoutPickerTitle">\u{1F3AF} Ch\u1ECDn Giao Di\u1EC7n L\xE0m B\xE0i</h3>
        <p class="examLayoutPickerSub">Vui l\xF2ng ch\u1ECDn ki\u1EC3u giao di\u1EC7n hi\u1EC3n th\u1ECB b\u1EA1n mong mu\u1ED1n:</p>
        
        <div class="examLayoutPickerGrid">
          <div class="examLayoutPickerCard ${examLayoutMode === "kizspy" ? "active" : ""}" data-pick-layout="kizspy">
            <span class="examLayoutPickerBadge">GIAO DI\u1EC6N THI</span>
            <div class="examLayoutPickerIcon">\u{1F4BB}</div>
            <div class="examLayoutPickerName">Giao di\u1EC7n thi</div>
            <div class="examLayoutPickerDesc">M\xF4 ph\u1ECFng EOS Client FPT v\u1EA1ch \u0111\u1ECF, t\xEDch ch\u1ECDn c\u1ED9t tr\xE1i & t\xF9y ch\u1EC9nh zoom c\u1EE1 ch\u1EEF.</div>
          </div>

          <div class="examLayoutPickerCard ${examLayoutMode === "standard" ? "active" : ""}" data-pick-layout="standard">
            <div class="examLayoutPickerIcon">\u{1F5C2}</div>
            <div class="examLayoutPickerName">Giao di\u1EC7n chu\u1EA9n</div>
            <div class="examLayoutPickerDesc">Giao di\u1EC7n d\u1EA1ng th\u1EBB \u0111\u1EA7y \u0111\u1EE7 t\xEDnh n\u0103ng truy\u1EC1n th\u1ED1ng.</div>
          </div>
        </div>

        <div class="examLayoutPickerActions">
          <button type="button" class="examLayoutPickerConfirmBtn" id="examLayoutPickerStart">B\u1EAFt \u0111\u1EA7u l\xE0m b\xE0i \u25B6</button>
        </div>
      </div>
    `;
      modal.querySelectorAll("[data-pick-layout]").forEach((card) => {
        card.onclick = () => {
          examLayoutMode = card.dataset.pickLayout;
          try {
            localStorage.setItem("hod102_exam_layout_mode", examLayoutMode);
          } catch (e) {
          }
          modal.querySelectorAll("[data-pick-layout]").forEach((x) => x.classList.remove("active"));
          card.classList.add("active");
        };
      });
      const confirmBtn = modal.querySelector("#examLayoutPickerStart");
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          modal.remove();
          if (typeof onConfirm === "function") onConfirm();
        };
      }
    }
    function showQuickCheckResultPopup(userChoice, correctChoice, q) {
      let popup = document.getElementById("kizspyQuickCheckPopup");
      if (!popup) {
        popup = document.createElement("div");
        popup.id = "kizspyQuickCheckPopup";
        document.body.appendChild(popup);
      }
      popup.className = "kizspyCheckOverlay";
      const opts = q.options || {};
      const formatOptText = (keysStr) => {
        if (!keysStr) return "";
        return keysStr.split("").map((k) => opts[k] ? `${k}. ${opts[k]}` : k).join("; ");
      };
      const userText = formatOptText(userChoice);
      const correctText = formatOptText(correctChoice);
      if (!userChoice) {
        popup.innerHTML = `
        <div class="kizspyCheckBox warning">
          <div class="kizspyCheckHeader">
            <span class="kizspyCheckTitle">\u26A0\uFE0F CH\u01AFA CH\u1ECCN \u0110\xC1P \xC1N</span>
            <button type="button" class="kizspyCheckClose" id="kizspyCheckCloseBtn">\xD7</button>
          </div>
          <div class="kizspyCheckContent">
            B\u1EA1n ch\u01B0a t\xEDch ch\u1ECDn \u0111\xE1p \xE1n n\xE0o cho <b>C\xE2u ${examOnlyIndex + 1}</b>. H\xE3y ch\u1ECDn 1 \u0111\xE1p \xE1n \u1EDF c\u1ED9t tr\xE1i r\u1ED3i b\u1EA5m Ki\u1EC3m tra l\u1EA1i nh\xE9!
          </div>
          <div class="kizspyCheckFooter">
            <button type="button" class="kizspyCheckOkBtn" id="kizspyCheckOkBtn">\u0110\xE3 hi\u1EC3u</button>
          </div>
        </div>
      `;
      } else {
        const isCorrect = S(userChoice) === S(correctChoice);
        const explainText = q.explain || EXPLAIN(q) || "";
        popup.innerHTML = `
        <div class="kizspyCheckBox ${isCorrect ? "correct" : "incorrect"}">
          <div class="kizspyCheckHeader">
            <span class="kizspyCheckTitle">${isCorrect ? "\u2705 CH\xCDNH X\xC1C!" : "\u274C CH\u01AFA CH\xCDNH X\xC1C"}</span>
            <button type="button" class="kizspyCheckClose" id="kizspyCheckCloseBtn">\xD7</button>
          </div>
          <div class="kizspyCheckBodyGrid">
            <div class="kizspyCheckRow ${isCorrect ? "ok" : "bad"}">
              <div class="kizspyCheckRowTop">
                <span class="kizspyCheckLabel">L\u1EF1a ch\u1ECDn c\u1EE7a b\u1EA1n:</span>
                <span class="kizspyCheckBadge ${isCorrect ? "ok" : "bad"}">${E(userChoice)}</span>
              </div>
              <div class="kizspyCheckVal">${E(userText)}</div>
            </div>
            ${!isCorrect ? `
              <div class="kizspyCheckRow ok">
                <div class="kizspyCheckRowTop">
                  <span class="kizspyCheckLabel">\u0110\xE1p \xE1n \u0111\xFAng:</span>
                  <span class="kizspyCheckBadge ok">${E(correctChoice)}</span>
                </div>
                <div class="kizspyCheckVal">${E(correctText)}</div>
            <div class="kizspyCheckExplainText">${E(explainText)}</div>
              </div>
            ` : ""}
          </div>
          <div class="kizspyCheckFooter">
            <button type="button" class="kizspyCheckOkBtn" id="kizspyCheckOkBtn">\u0110\xF3ng</button>
          </div>
        </div>
      `;
      }
      const close = () => popup.remove();
      const closeBtn = popup.querySelector("#kizspyCheckCloseBtn");
      const okBtn = popup.querySelector("#kizspyCheckOkBtn");
      if (closeBtn) closeBtn.onclick = close;
      if (okBtn) okBtn.onclick = close;
      popup.onclick = (e) => {
        if (e.target === popup) close();
      };
    }
    async function loadQuestionsForCodes(codes) {
      if (!codes.length) return [];
      const out = [];
      for (const code of codes) {
        try {
          const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(code) + "&ts=" + Date.now(), { cache: "no-store" });
          const json = await res.json().catch(() => ({}));
          if (res.ok && Array.isArray(json.data)) out.push(...json.data);
        } catch (e) {
          console.warn("[loadQuestionsForCodes]", code, e);
        }
      }
      return out.map((r) => ({
        id: r.id,
        subject_code: r.subject_code,
        num: r.num,
        question: r.question,
        options: r.options || {},
        answer: r.answer,
        answer_text: r.answer_text,
        images: typeof cleanImages === "function" ? cleanImages(r.images || []) : r.images || [],
        has_image: !!(r.has_image || (r.images || []).length),
        error_risk: r.error_risk || "low",
        error_risk_reason: r.error_risk_reason || "",
        __imagesChecked: true,
        __imagesLoaded: true
      }));
    }
    async function start() {
      quizMode = "exam";
      examSubmitted = false;
      examOnlyReview = false;
      examOnlyIndex = 0;
      const activeSubject = examSubject();
      const extraCodes = examSelectedCodes.filter((c) => c && c !== activeSubject);
      let mergedPool = [...RAW || []];
      if (extraCodes.length) {
        if (typeof showProgress === "function") showProgress("\u0110ang t\u1EA3i c\xE2u h\u1ECFi t\u1EEB c\xE1c m\xF4n \u0111\xE3 ch\u1ECDn...", 0, 100);
        const extraQuestions = await loadQuestionsForCodes(extraCodes);
        if (typeof hideProgress === "function") hideProgress();
        const seen = new Set(mergedPool.map((q) => q.id || q.subject_code + ":" + q.num));
        extraQuestions.forEach((q) => {
          const key = q.id || q.subject_code + ":" + q.num;
          if (!seen.has(key)) {
            mergedPool.push(q);
            seen.add(key);
          }
        });
      }
      if (!mergedPool.length) {
        alert("Ch\u01B0a c\xF3 c\xE2u h\u1ECFi \u0111\u1EC3 ki\u1EC3m tra.");
        return;
      }
      qSet = sample(mergedPool, qCnt || 0);
      qDone = {};
      qSel = {};
      clearExam();
      startTimer(0);
      saveExam();
      draw();
    }
    function scoreExam() {
      let ok = 0;
      (qSet || []).forEach((c, i) => {
        if (S(qSel[i]) === S(c.answer)) ok++;
      });
      const total = (qSet || []).length;
      const pct = total ? Math.round(ok / total * 100) : 0;
      return { ok, bad: total - ok, total, pct };
    }
    function draw() {
      window.__examOnlyRender = draw;
      const body = $2("quizBody");
      if (!body) return;
      const isQuizActive = $2("quiz")?.classList.contains("active") || document.querySelector(".tab.active")?.dataset?.tab === "quiz";
      if (!isQuizActive) {
        document.body.classList.remove("kizspy-active");
        const p2 = document.getElementById("kizspyExamPortal");
        if (p2) p2.remove();
        return;
      }
      if (!qSet || !qSet.length) restoreExam();
      const box = document.querySelector("#quiz .setup");
      const idxEl = document.getElementById("idx");
      const totalEl = document.getElementById("total");
      const totalCountVal = qSet && qSet.length ? qSet.length : typeof RAW !== "undefined" && RAW.length ? RAW.length : 0;
      if (idxEl) idxEl.textContent = String((examOnlyIndex || 0) + 1);
      if (totalEl) totalEl.textContent = String(totalCountVal);
      if (!qSet || !qSet.length) {
        document.body.classList.remove("kizspy-active");
        const p2 = document.getElementById("kizspyExamPortal");
        if (p2) p2.remove();
        setup();
        if (box) box.classList.remove("hidden");
        body.innerHTML = "";
        return;
      }
      if (box) box.classList.add("hidden");
      if (examSubmitted && !examOnlyReview) {
        document.body.classList.remove("kizspy-active");
        const portal = document.getElementById("kizspyExamPortal");
        if (portal) portal.remove();
        result();
        return;
      }
      const c = qSet[examOnlyIndex];
      const total = qSet.length;
      const p = Math.round((examOnlyIndex + 1) / total * 100);
      const ch = qSel[examOnlyIndex] || "";
      const correctAns = c.answer || "";
      if (examLayoutMode === "kizspy") {
        document.body.classList.add("kizspy-active");
        let portal = document.getElementById("kizspyExamPortal");
        if (!portal) {
          portal = document.createElement("div");
          portal.id = "kizspyExamPortal";
          document.body.appendChild(portal);
        }
        portal.style.display = "flex";
        const questionCountLabel = `Question: ${examOnlyIndex + 1}`;
        const ansLen = (c.answer || "").length;
        const isMulti = ansLen > 1;
        const choiceInstruction = isMulti ? `(Choose ${ansLen} answers)` : "(Choose 1 answer)";
        const isCheckedThisQ = examOnlyReview || !!kizspyCheckedMap[examOnlyIndex];
        const isUserChoseAny = !!ch;
        const isUserCorrect = isUserChoseAny && S(ch) === S(correctAns);
        const isAllChecked = (qSet || []).length > 0 && (qSet || []).every((_, idx) => kizspyCheckedMap[idx]);
        const selectBoxesHTML = Object.keys(c.options || {}).map((k) => {
          const isChecked = String(ch).includes(k);
          const inputType = isMulti ? "checkbox" : "radio";
          let boxClass = isChecked ? "sel" : "";
          if (isCheckedThisQ) {
            if (correctAns.includes(k)) boxClass += " check-correct-ok";
            else if (isChecked && !correctAns.includes(k)) boxClass += " check-user-bad";
          }
          return `
          <label class="kizspySelectBoxItem ${boxClass}" data-exam-opt="${E(k)}">
            <input type="${inputType}" class="kizspyRadioCheck" name="kizspyOpt_${examOnlyIndex}" ${isChecked ? "checked" : ""} ${examOnlyReview ? "disabled" : ""}>
            <span class="kizspySelectBoxLetter">${E(k)}</span>
          </label>
        `;
        }).join("");
        let optsHTML = Object.entries(c.options || {}).map(([k, v]) => {
          const isChecked = String(ch).includes(k);
          const isUserChose = ch.includes(k);
          const isCorrect = correctAns.includes(k);
          let stateClass = isChecked ? "sel" : "";
          let badgeTag = "";
          if (isCheckedThisQ) {
            if (isCorrect) {
              stateClass = "check-correct-ok";
              badgeTag = '<span class="kizspyCheckBadgeTag ok">\u2713 \u0110\xE1p \xE1n \u0111\xFAng</span>';
            } else if (isUserChose && !isCorrect) {
              stateClass = "check-user-bad";
              badgeTag = '<span class="kizspyCheckBadgeTag bad">\u2715 L\u1EF1a ch\u1ECDn c\u1EE7a b\u1EA1n</span>';
            }
          }
          return `
          <div class="kizspyOption ${stateClass}" ${!examOnlyReview ? `data-exam-opt="${E(k)}"` : ""}>
            <span class="kizspyOptionPrefix">${E(k)}.</span>
            <span class="kizspyOptionText">${E(v)}</span>
            ${badgeTag}
          </div>
        `;
        }).join("");
        portal.innerHTML = `
        <div class="kizspyHeaderNav">
          <div class="kizspyNavLeft">
            <span class="kizspyBrandBadge">\u{1F4BB} EOS Client</span>
            <span class="kizspyTimerBadge">\u23F1 <b id="examTimer">${timeText()}</b></span>
            <span class="kizspyCountBadge">\u0110\xE3 l\xE0m: <b>${done()}/${total}</b></span>
          </div>

          <div class="kizspyNavCenter">
            <button type="button" id="kizspyOpenMapBtn" class="kizspyBtn kizspyBtnMap" title="Xem b\u1EA3n \u0111\u1ED3 t\u1EA5t c\u1EA3 c\xE1c c\xE2u h\u1ECFi trong b\xE0i thi">
              \u{1F5FA} B\u1EA3n \u0111\u1ED3 c\xE2u (${done()}/${total})
            </button>
            <button type="button" id="kizspyFontDec" class="kizspyBtn" title="Gi\u1EA3m c\u1EE1 ch\u1EEF (Zoom out)">A-</button>
            <button type="button" id="kizspyFontReset" class="kizspyBtn" title="Reset c\u1EE1 ch\u1EEF v\u1EC1 m\u1EB7c \u0111\u1ECBnh 10px">\u21BA 10px</button>
            <button type="button" id="kizspyFontInc" class="kizspyBtn" title="T\u0103ng c\u1EE1 ch\u1EEF (Zoom in)">A+</button>
            <button type="button" id="kizspyQuickCheck" class="kizspyBtn kizspyBtnCheck ${isCheckedThisQ ? "active" : ""}" title="Ki\u1EC3m tra \u0111\xE1p \xE1n c\xE2u hi\u1EC7n t\u1EA1i">
              \u2714 Check \u0111\xE1p \xE1n
            </button>
            <button type="button" id="examToggleLayout" class="kizspyBtn kizspyBtnLayout" title="Chuy\u1EC3n v\u1EC1 giao di\u1EC7n chu\u1EA9n">
              \u21C4 Giao di\u1EC7n chu\u1EA9n
            </button>
          </div>

          <div class="kizspyNavRight">
            ${!examOnlyReview ? `
              <button type="button" id="examSubmit" class="kizspyBtn kizspyBtnSubmit">N\u1ED9p b\xE0i</button>
            ` : `
              <button type="button" id="examOnlyExitToResult" class="kizspyBtn kizspyBtnSubmit">Xem k\u1EBFt qu\u1EA3</button>
            `}
            <button type="button" id="examOnlyExit" class="kizspyBtn kizspyBtnExit">\u2715 Tho\xE1t</button>
          </div>
        </div>

        <div class="kizspyMainSplit">
          <div class="kizspyLeftPane" style="flex:0 0 ${kizspySplitPct}% !important; width:${kizspySplitPct}% !important;">
            <div class="kizspyHeaderLine">${questionCountLabel}</div>
            <div class="kizspySubLine">${choiceInstruction}</div>
            <div class="kizspySelectBoxContainer">
              <div class="kizspySelectBoxList">${selectBoxesHTML}</div>
            </div>

            <!-- Prev / Next Navigation Buttons on Left Pane -->
            <div class="kizspyLeftNavBtns">
              <button type="button" id="examPrev" class="kizspyNavBtn" ${examOnlyIndex <= 0 ? "disabled" : ""}>\u2190 Prev</button>
              <button type="button" id="examNext" class="kizspyNavBtn" ${examOnlyIndex >= total - 1 ? "disabled" : ""}>Next \u2192</button>
            </div>
          </div>

          <div class="kizspyDividerLine" title="K\xE9o qua tr\xE1i/ph\u1EA3i \u0111\u1EC3 ch\u1EC9nh \u0111\u1ED9 r\u1ED9ng 2 c\u1ED9t"></div>

          <div class="kizspyRightPane" style="font-size:${kizspyFontSize}px !important;">
            <div class="kizspyQText" style="font-size:${kizspyFontSize}px !important;">${E(c.question)}</div>
            ${c.images && c.images.length ? `<div class="kizspyQImgs">${IMG(c)}</div>` : ""}
            <div class="kizspyOptionsList">${optsHTML}</div>
          </div>
        </div>

        <!-- EOS Question Map Modal Overlay -->
        <div id="kizspyMapModal" class="kizspyMapOverlay hidden">
          <div class="kizspyMapBox">
            <div class="kizspyMapHeader">
              <div class="kizspyMapTitle">
                <b>\u{1F5FA} B\u1EA3n \u0111\u1ED3 c\xE2u h\u1ECFi b\xE0i thi EOS</b>
                <span>(\u0110\xE3 l\xE0m: ${done()} / ${total} c\xE2u)</span>
              </div>
              <button type="button" class="kizspyMapClose" id="kizspyCloseMapBtn" title="\u0110\xF3ng b\u1EA3n \u0111\u1ED3 c\xE2u h\u1ECFi">\u2715</button>
            </div>
            
            <div class="kizspyMapGrid">
              ${(qSet || []).map((qItem, idx) => {
          const userSel = qSel[idx] || "";
          const isUserDone = !!userSel;
          const isChecked = examOnlyReview || !!kizspyCheckedMap[idx];
          const isCurrent = idx === examOnlyIndex;
          const correctAnsStr = qItem.answer || "";
          const isCorrect = isUserDone && S(userSel) === S(correctAnsStr);
          let itemClass = "";
          if (isCurrent) itemClass += " current";
          if (isChecked && isUserDone) {
            itemClass += isCorrect ? " ok" : " bad";
          } else if (isUserDone) {
            itemClass += " done";
          }
          const subLabel = userSel ? E(userSel) : isChecked && isUserDone ? isCorrect ? "\u2713" : "\u2715" : "";
          return `
                  <div class="kizspyMapItem ${itemClass}" data-exam-jump="${idx}">
                    <span>${idx + 1}</span>
                    ${subLabel ? `<span class="kizspyMapItemSub">${subLabel}</span>` : ""}
                  </div>
                `;
        }).join("")}
            </div>
          </div>
        </div>
      `;
        body.innerHTML = `<div style="padding:20px;text-align:center;color:#94a3b8;">(\u0110ang \u1EDF ch\u1EBF \u0111\u1ED9 Kizspy EOS Portal)</div>`;
        setTimeout(() => {
          const openMapBtn = portal.querySelector("#kizspyOpenMapBtn");
          const mapModal = portal.querySelector("#kizspyMapModal");
          const closeMapBtn = portal.querySelector("#kizspyCloseMapBtn");
          if (openMapBtn && mapModal) {
            openMapBtn.onclick = () => mapModal.classList.remove("hidden");
          }
          if (closeMapBtn && mapModal) {
            closeMapBtn.onclick = () => mapModal.classList.add("hidden");
          }
          if (mapModal) {
            mapModal.onclick = (e) => {
              if (e.target === mapModal) mapModal.classList.add("hidden");
            };
            mapModal.querySelectorAll("[data-exam-jump]").forEach((item) => {
              item.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(item.getAttribute("data-exam-jump"), 10);
                if (!isNaN(idx)) {
                  examOnlyIndex = idx;
                  mapModal.classList.add("hidden");
                  saveExam();
                  draw();
                }
              };
            });
          }
          const divider = portal.querySelector(".kizspyDividerLine");
          const container = portal.querySelector(".kizspyMainSplit");
          const leftPane = portal.querySelector(".kizspyLeftPane");
          if (divider && container && leftPane) {
            let isDragging = false;
            const startDrag = (e) => {
              if (e) e.preventDefault();
              isDragging = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            };
            const doDrag = (e) => {
              if (!isDragging) return;
              const clientX = e.touches ? e.touches[0].clientX : e.clientX;
              const rect = container.getBoundingClientRect();
              const pct = Math.max(10, Math.min(90, (clientX - rect.left) / rect.width * 100));
              kizspySplitPct = Math.round(pct * 10) / 10;
              try {
                localStorage.setItem("hod102_kizspy_split_pct", String(kizspySplitPct));
              } catch (ex) {
              }
              leftPane.style.setProperty("flex", `0 0 ${kizspySplitPct}%`, "important");
              leftPane.style.setProperty("width", `${kizspySplitPct}%`, "important");
            };
            const stopDrag = () => {
              if (isDragging) {
                isDragging = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
              }
            };
            divider.addEventListener("mousedown", startDrag);
            window.addEventListener("mousemove", doDrag);
            window.addEventListener("mouseup", stopDrag);
            divider.addEventListener("touchstart", startDrag, { passive: false });
            window.addEventListener("touchmove", doDrag, { passive: false });
            window.addEventListener("touchend", stopDrag);
          }
          const fontDecBtn = portal.querySelector("#kizspyFontDec");
          if (fontDecBtn) {
            fontDecBtn.onclick = () => {
              if (kizspyFontSize > 9) {
                kizspyFontSize--;
                try {
                  localStorage.setItem("hod102_kizspy_font_size", String(kizspyFontSize));
                } catch (ex) {
                }
                saveExam();
                draw();
              }
            };
          }
          const fontResetBtn = portal.querySelector("#kizspyFontReset");
          if (fontResetBtn) {
            fontResetBtn.onclick = () => {
              kizspyFontSize = 10;
              try {
                localStorage.setItem("hod102_kizspy_font_size", "10");
              } catch (ex) {
              }
              saveExam();
              draw();
            };
          }
          const fontIncBtn = portal.querySelector("#kizspyFontInc");
          if (fontIncBtn) {
            fontIncBtn.onclick = () => {
              if (kizspyFontSize < 24) {
                kizspyFontSize++;
                try {
                  localStorage.setItem("hod102_kizspy_font_size", String(kizspyFontSize));
                } catch (ex) {
                }
                saveExam();
                draw();
              }
            };
          }
          const checkBtn = portal.querySelector("#kizspyQuickCheck");
          if (checkBtn) {
            checkBtn.onclick = () => {
              kizspyCheckedMap[examOnlyIndex] = !kizspyCheckedMap[examOnlyIndex];
              saveExam();
              draw();
            };
          }
          portal.querySelectorAll("[data-exam-opt]").forEach((el) => {
            el.onclick = (e) => {
              if (examOnlyReview) return;
              const selText = window.getSelection() ? window.getSelection().toString().trim() : "";
              if (selText.length > 0) return;
              const k = el.getAttribute("data-exam-opt");
              if (!k) return;
              const isMulti2 = (c.answer || "").length > 1;
              if (isMulti2) {
                let cur = (qSel[examOnlyIndex] || "").split("").filter(Boolean);
                if (cur.includes(k)) cur = cur.filter((x) => x !== k);
                else cur.push(k);
                cur.sort();
                qSel[examOnlyIndex] = cur.join("");
              } else {
                qSel[examOnlyIndex] = k;
              }
              saveExam();
              draw();
            };
          });
          const pBtn = portal.querySelector("#examPrev");
          if (pBtn) pBtn.onclick = () => {
            if (examOnlyIndex > 0) {
              examOnlyIndex--;
              saveExam();
              draw();
            }
          };
          const nBtn = portal.querySelector("#examNext");
          if (nBtn) nBtn.onclick = () => {
            if (examOnlyIndex < total - 1) {
              examOnlyIndex++;
              saveExam();
              draw();
            }
          };
          const tBtn = portal.querySelector("#examToggleLayout");
          if (tBtn) tBtn.onclick = () => {
            examLayoutMode = "standard";
            try {
              localStorage.setItem("hod102_exam_layout_mode", "standard");
            } catch (ex) {
            }
            document.body.classList.remove("kizspy-active");
            if (portal) portal.remove();
            saveExam();
            draw();
          };
          const sBtn = portal.querySelector("#examSubmit");
          if (sBtn) sBtn.onclick = () => {
            submit();
          };
          const exBtn = portal.querySelector("#examOnlyExit");
          if (exBtn) exBtn.onclick = () => {
            if (confirm("Tho\xE1t b\xE0i ki\u1EC3m tra hi\u1EC7n t\u1EA1i?")) {
              document.body.classList.remove("kizspy-active");
              if (portal) portal.remove();
              clearExam();
              qSet = [];
              qSel = {};
              examSubmitted = false;
              examOnlyReview = false;
              examOnlyIndex = 0;
              resetTimer();
              draw();
            }
          };
          const exToResBtn = portal.querySelector("#examOnlyExitToResult");
          if (exToResBtn) exToResBtn.onclick = () => {
            examOnlyReview = false;
            document.body.classList.remove("kizspy-active");
            if (portal) portal.remove();
            saveExam();
            draw();
          };
        }, 20);
      } else {
        document.body.classList.remove("kizspy-active");
        const portal = document.getElementById("kizspyExamPortal");
        if (portal) portal.remove();
        const titleHTML = examOnlyReview ? `C\xE2u ${examOnlyIndex + 1} / ${total} <span class="reviewModeHeaderTag" style="font-size:0.88rem;color:var(--gold2);background:rgba(200,169,110,0.1);padding:3px 8px;border-radius:999px;border:1px solid rgba(200,169,110,0.3);margin-left:8px;vertical-align:middle;font-weight:800;letter-spacing:0.04em;">XEM L\u1EA0I</span>` : `C\xE2u ${examOnlyIndex + 1} / ${total}`;
        const subtitleHTML = examOnlyReview ? `\u0110\xFAng: <b style="color:#72c58c;">${scoreExam().ok}</b> \xB7 Sai: <b style="color:#e9877b;">${scoreExam().bad}</b> \xB7 Th\u1EDDi gian: <b>${timeText()}</b>` : `\u0110\xE3 l\xE0m: ${done()} / ${total} \xB7 Th\u1EDDi gian: <span id="examTimer">${timeText()}</span>`;
        const footerHTML = examOnlyReview ? `<div class="examOnlyFooter review-mode"><div class="examOnlyNav" style="grid-column: 1 / -1 !important;"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? "disabled" : ""}>\u2190 C\xE2u tr\u01B0\u1EDBc</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? "disabled" : ""}>C\xE2u ti\u1EBFp \u2192</button></div></div>` : `<div class="examOnlyFooter"><div class="examOnlyNav"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? "disabled" : ""}>\u2190 C\xE2u tr\u01B0\u1EDBc</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? "disabled" : ""}>C\xE2u ti\u1EBFp \u2192</button></div><button type="button" class="submitExam" id="examSubmit">N\u1ED9p b\xE0i</button></div>`;
        const exitBtn = examOnlyReview ? `<button type="button" class="examOnlyExit" id="examOnlyExitToResult">Xem k\u1EBFt qu\u1EA3</button>` : `<button type="button" class="examOnlyExit" id="examOnlyExit">Tho\xE1t</button>`;
        const opts = Object.entries(c.options || {}).map(([k, v]) => {
          const isChecked = String(ch).includes(k);
          const isUserChose = ch.includes(k);
          const isCorrect = correctAns.includes(k);
          let stateClass = isChecked ? "sel" : "";
          if (examOnlyReview) {
            if (isCorrect) stateClass = "review-correct";
            else if (isUserChose && !isCorrect) stateClass = "review-incorrect";
          }
          return `
          <button type="button" class="examOnlyOption ${stateClass}" ${!examOnlyReview ? `data-exam-opt="${E(k)}"` : ""}>
            <span class="qkey">${E(k)}</span>
            <span class="qtxt">${E(v)}</span>
            ${examOnlyReview ? isCorrect ? '<span style="margin-left:auto;color:#72c58c;font-weight:bold;">\u2713</span>' : isUserChose ? '<span style="margin-left:auto;color:#e9877b;font-weight:bold;">\xD7</span>' : "" : ""}
          </button>
        `;
        }).join("");
        const gridItems = (qSet || []).map((q, idx) => {
          const isCur = idx === examOnlyIndex;
          const isDone = !!qSel[idx];
          let stateClass = "";
          if (examOnlyReview) {
            const isCorrect = S(qSel[idx]) === S(q.answer);
            stateClass = isCorrect ? "review-grid-correct review-ok" : "review-grid-incorrect review-bad";
          } else {
            stateClass = isDone ? "answered" : "";
          }
          return `
          <button type="button" class="examGridItem ${stateClass} ${isCur ? "active" : ""}" data-exam-jump="${idx}">
            ${idx + 1}
          </button>
        `;
        }).join("");
        body.innerHTML = `
        <div class="examOnlyGridContainer">
          <section class="examOnlyCard">
            <div class="examOnlyTopline">
              <div>
                <div class="examOnlyQuestionNo">${titleHTML}</div>
                <div class="examOnlyMeta">${subtitleHTML}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <button type="button" class="examOnlyExit" id="examToggleLayout" style="background:rgba(200,169,110,0.15);color:var(--gold2);">\u21C4 \u0110\u1ED5i giao di\u1EC7n</button>
                ${exitBtn}
              </div>
            </div>
            <div class="examOnlyProgress"><div style="width:${p}%"></div></div>
            <div class="examOnlyContentBody">
              <div class="examOnlyQuestionZone">
                <div class="qq">${E(c.question)}</div>
                <div class="qimgs">${IMG(c)}</div>
              </div>
              <div class="examOnlyRightZone">
                <div class="examOnlyOptions">${opts}</div>
              </div>
            </div>
            ${footerHTML}
          </section>
          <aside class="examOnlySidebar">
            <div class="examSidebarHead"><h4>B\u1EA3n \u0111\u1ED3 c\xE2u h\u1ECFi</h4></div>
            <div class="examSidebarGrid">${gridItems}</div>
          </aside>
        </div>
      `;
      }
      setTimerText();
    }
    function timeText() {
      return examElapsed || "00:00";
    }
    function result() {
      const box = document.querySelector("#quiz .setup");
      if (box) box.classList.add("hidden");
      const body = $2("quizBody");
      if (!body) return;
      const s = scoreExam();
      const label = s.pct >= 90 ? "Xu\u1EA5t s\u1EAFc" : s.pct >= 70 ? "Kh\xE1 \u1ED5n r\u1ED3i" : s.pct >= 50 ? "C\u1EA7n \xF4n th\xEAm" : "N\xEAn l\xE0m l\u1EA1i v\xE0i v\xF2ng";
      body.innerHTML = `<section class="examOnlyResult"><div class="examOnlyBadge">K\u1EBET QU\u1EA2 KI\u1EC2M TRA</div><h2>${s.ok} / ${s.total} c\xE2u \u0111\xFAng</h2><div class="examOnlyScore">${s.pct}%</div><p>${label}</p><div class="examOnlyStats"><span>\u0110\xFAng: <b>${s.ok}</b></span><span>Sai: <b>${s.bad}</b></span><span>Th\u1EDDi gian: <b>${timeText()}</b></span></div><div class="examOnlyActions"><button type="button" class="primary" id="examReviewBtn">Xem l\u1EA1i b\xE0i l\xE0m</button><button type="button" class="btn" id="examRetryBtn">L\xE0m l\u1EA1i b\u1ED9 n\xE0y</button><button type="button" class="btn" id="examNewBtn">T\u1EA1o \u0111\u1EC1 m\u1EDBi</button></div><div id="examReviewList" class="examOnlyReviewList hidden"></div></section>`;
      if (examOnlyReview) review();
    }
    function review() {
      const list = $2("examReviewList");
      if (!list) return;
      list.classList.remove("hidden");
      list.innerHTML = (qSet || []).map((c, i) => {
        const ch = qSel[i] || "";
        const correctAns = c.answer || "";
        const ok = S(ch) === S(correctAns);
        const reviewOpts = Object.entries(c.options || {}).map(([k, v]) => {
          const isUserChose = ch.includes(k);
          const isCorrect = correctAns.includes(k);
          let stateClass = "";
          let badgeHTML = "";
          if (isCorrect) {
            stateClass = "review-opt-correct";
            badgeHTML = `<span class="review-opt-badge correct">\u2713</span>`;
          } else if (isUserChose && !isCorrect) {
            stateClass = "review-opt-incorrect";
            badgeHTML = `<span class="review-opt-badge incorrect">\xD7</span>`;
          } else {
            stateClass = "review-opt-normal";
          }
          return `<div class="examReviewOpt ${stateClass}"><span class="qkey">${k}</span><span class="qtxt">${E(v)}</span>${badgeHTML}</div>`;
        }).join("");
        return `
        <div class="examOnlyReviewItem ${ok ? "item-correct" : "item-incorrect"}">
          <div class="examOnlyReviewHeader">
            <span class="reviewItemNo">C\xC2U ${i + 1}</span>
            <span class="reviewStatusBadge ${ok ? "correct" : "incorrect"}">${ok ? "\u0110\xDANG" : "SAI"}</span>
          </div>
          <div class="examOnlyReviewQ">${E(c.question)}</div>
          <div class="qimgs">${IMG(c)}</div>
          <div class="examOnlyReviewOptionsList">${reviewOpts}</div>
        </div>
      `;
      }).join("");
    }
    function submit() {
      if (!confirm("B\u1EA1n ch\u1EAFc ch\u1EAFn mu\u1ED1n n\u1ED9p b\xE0i?\n\n\u0110\xE3 l\xE0m: " + done() + " / " + (qSet || []).length + " c\xE2u")) return;
      examElapsed = FMT(nowTimerMs());
      examSubmitted = true;
      examOnlyReview = false;
      document.body.classList.remove("kizspy-active");
      const portal = document.getElementById("kizspyExamPortal");
      if (portal) portal.remove();
      stopTimer();
      saveExam();
      result();
    }
    function bind() {
      markTab();
      removeOldQuizUI();
      setup();
      const label = $2("quizModeLabel");
      if (label) label.textContent = "Ki\u1EC3m tra: n\u1ED9p b\xE0i m\u1EDBi hi\u1EC7n \u0111\xE1p \xE1n";
      const body = $2("quizBody");
      if (body && body.dataset.examOnlyBound !== "1") {
        body.dataset.examOnlyBound = "1";
        document.addEventListener("keydown", (e) => {
          if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if ($2("quiz") && $2("quiz").classList.contains("active")) {
            if (e.key === "ArrowRight") {
              if (qSet && qSet.length) {
                examOnlyIndex = Math.min(qSet.length - 1, examOnlyIndex + 1);
                saveExam();
                draw();
              }
              return;
            }
            if (e.key === "ArrowLeft" || e.key === "Backspace") {
              if (qSet && qSet.length) {
                examOnlyIndex = Math.max(0, examOnlyIndex - 1);
                saveExam();
                draw();
              }
              if (e.key === "Backspace") e.preventDefault();
              return;
            }
            const keyUpper = e.key.toUpperCase();
            let keyOpt = "";
            if (["A", "B", "C", "D", "E"].includes(keyUpper)) {
              keyOpt = keyUpper;
            } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
              const mapKey = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };
              keyOpt = mapKey[e.key];
            }
            if (keyOpt && !examSubmitted && qSet && qSet.length) {
              const c = qSet[examOnlyIndex];
              if (c && c.options && c.options[keyOpt]) {
                if (String(c.answer || "").length > 1) {
                  const set = new Set(String(qSel[examOnlyIndex] || "").split("").filter(Boolean));
                  set.has(keyOpt) ? set.delete(keyOpt) : set.add(keyOpt);
                  qSel[examOnlyIndex] = Array.from(set).sort().join("");
                } else {
                  qSel[examOnlyIndex] = keyOpt;
                }
                saveExam();
                draw();
                return;
              }
            }
            if (e.key === "Escape") {
              if (examOnlyReview) {
                examOnlyReview = false;
                saveExam();
                draw();
              } else {
                const exitBtn = $2("examOnlyExit") || $2("examOnlyExitToResult");
                if (exitBtn) exitBtn.click();
              }
              return;
            }
            if (e.code === "Space" || e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
            }
          }
        }, true);
        body.addEventListener("click", (e) => {
          const opt = e.target.closest("[data-exam-opt]");
          if (opt && !examSubmitted && qSet && qSet.length) {
            const c = qSet[examOnlyIndex];
            const k = opt.dataset.examOpt;
            if (c && String(c.answer || "").length > 1) {
              const set = new Set(String(qSel[examOnlyIndex] || "").split("").filter(Boolean));
              set.has(k) ? set.delete(k) : set.add(k);
              qSel[examOnlyIndex] = Array.from(set).sort().join("");
            } else qSel[examOnlyIndex] = k;
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examEditCard" || e.target.closest("#examEditCard")) {
            const c = qSet && qSet[examOnlyIndex];
            if (c && typeof window.openStudyReport === "function") window.openStudyReport(c.num);
            else if (typeof openEditor === "function") openEditor();
            return;
          }
          if (e.target.id === "examToggleLayout") {
            examLayoutMode = examLayoutMode === "kizspy" ? "standard" : "kizspy";
            try {
              localStorage.setItem("hod102_exam_layout_mode", examLayoutMode);
            } catch (ex) {
            }
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examPrev") {
            examOnlyIndex = Math.max(0, examOnlyIndex - 1);
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examNext") {
            examOnlyIndex = Math.min((qSet || []).length - 1, examOnlyIndex + 1);
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examSubmit") {
            submit();
            return;
          }
          if (e.target.id === "examReviewBtn") {
            examOnlyReview = true;
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examOnlyExitToResult") {
            examOnlyReview = false;
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examRetryBtn") {
            qSel = {};
            examSubmitted = false;
            examOnlyReview = false;
            examOnlyIndex = 0;
            startTimer(0);
            saveExam();
            draw();
            return;
          }
          if (e.target.id === "examNewBtn" || e.target.id === "examOnlyExit") {
            if (e.target.id === "examOnlyExit" && !confirm("Tho\xE1t b\xE0i ki\u1EC3m tra hi\u1EC7n t\u1EA1i?")) return;
            clearExam();
            qSet = [];
            qSel = {};
            examSubmitted = false;
            examOnlyReview = false;
            examOnlyIndex = 0;
            resetTimer();
            draw();
            return;
          }
          const jump = e.target.closest("[data-exam-jump]");
          if (jump) {
            examOnlyIndex = +jump.dataset.examJump;
            saveExam();
            draw();
          }
        });
      }
      restoreExam();
      draw();
    }
    try {
      renderQuiz = function() {
        setup();
        draw();
      };
    } catch (e) {
      window.renderQuiz = function() {
        setup();
        draw();
      };
    }
    window.__examResetForSubjectChange = function() {
      try {
        stopTimer();
      } catch (e) {
      }
      qSet = [];
      qSel = {};
      qDone = {};
      examSubmitted = false;
      examOnlyReview = false;
      examOnlyIndex = 0;
      examElapsed = "00:00";
      examSelectedCodes = [];
      quizMode = "exam";
      kizspyCheckedMap = {};
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(bind, 120));
    else setTimeout(bind, 120);
    setTimeout(bind, 900);
  })();
  (function() {
    function fixLibraryText() {
      document.querySelectorAll('.tab,[data-tab="study"],button,a,span,div,h1,h2,h3,p').forEach((el) => {
        if (!el || el.children.length) return;
        const t = (el.textContent || "").trim();
        if (t === "Th\u01B0 vi\u1EC7n" || t === "Th\u01B0 vi\u1EC7n" || t === "All" || el.dataset && el.dataset.tab === "study") {
          el.textContent = "Th\u01B0 vi\u1EC7n";
        }
      });
      document.querySelectorAll('[data-tab="study"]').forEach((el) => {
        el.textContent = "Th\u01B0 vi\u1EC7n";
      });
      const search = document.getElementById("search") || document.getElementById("studySearch");
      if (search) search.placeholder = "T\xECm trong th\u01B0 vi\u1EC7n: #12, \u0111\xE1p \xE1n, t\u1EEB kh\xF3a...";
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fixLibraryText);
    else fixLibraryText();
    setTimeout(fixLibraryText, 100);
    setTimeout(fixLibraryText, 600);
    setInterval(fixLibraryText, 1200);
  })();
  (function() {
    const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const FILTER_STORE = "learninghub_library_filter_v1";
    let libraryFilter = localStorage.getItem(FILTER_STORE) || "all";
    function $2(id) {
      return document.getElementById(id);
    }
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function ans(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function src(im) {
      return typeof im === "string" ? im : im?.src || im?.url || "";
    }
    function hasImg(q) {
      return !!((q?.images || []).map(src).filter(Boolean).length || q?.has_image);
    }
    function risk(q) {
      return q?.error_risk || (ans(q).length > 1 ? "medium" : "low");
    }
    function rColor(r) {
      return { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" }[r] || "#999";
    }
    function rLabel(r) {
      return { high: "Cao", medium: "Trung b\xECnh", low: "Th\u1EA5p" }[r] || r;
    }
    function pass(q) {
      if (libraryFilter === "all") return true;
      if (libraryFilter === "has_image") return hasImg(q);
      return risk(q) === libraryFilter;
    }
    function answerText2(q) {
      const a = ans(q);
      return a ? a.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ") : "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
    }
    function nextKey(opts) {
      const used = new Set(Object.keys(opts || {}).map((k) => String(k).toUpperCase()));
      return LETTERS.find((k) => !used.has(k));
    }
    function miniImg(q) {
      const imgs = (q.images || []).map(src).filter(Boolean);
      return imgs.length ? `<div class="v7MiniImgs libraryMiniImgs"><img src="${esc2(imgs[0])}" alt="\u1EA2nh c\xE2u h\u1ECFi" loading="lazy" decoding="async">${imgs.length > 1 ? `<span class="v7ImgCount">+${imgs.length - 1}</span>` : ""}</div>` : '<div class="v7MiniImgs libraryMiniImgs"></div>';
    }
    function stat(data) {
      return { total: data.length, img: data.filter(hasImg).length, high: data.filter((q) => risk(q) === "high").length, medium: data.filter((q) => risk(q) === "medium").length, low: data.filter((q) => risk(q) === "low").length };
    }
    function renderLibraryStats(data) {
      const list = $2("studyList");
      if (!list) return;
      let box = $2("libraryQuestionFilters");
      if (!box) {
        box = document.createElement("div");
        box.id = "libraryQuestionFilters";
        box.className = "v7Stats libraryQuestionFilters";
        list.parentNode.insertBefore(box, list);
      }
      const s = stat(data), fs = [["all", "Th\u01B0 vi\u1EC7n"], ["has_image", "\u{1F4F7} C\xF3 \u1EA3nh"], ["high", "R\u1EE7i ro cao"], ["medium", "Trung b\xECnh"], ["low", "Th\u1EA5p"]];
      box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} c\xE2u</span><span class="v7StatItem" style="color:#3498db">${s.img} c\xF3 \u1EA3nh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} r\u1EE7i ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung b\xECnh</span><span class="v7StatItem" style="color:#27ae60">${s.low} th\u1EA5p</span></div><div class="v7FilterLine">${fs.map((f) => `<button type="button" class="v7FilterBtn ${libraryFilter === f[0] ? "active" : ""}" data-library-filter="${f[0]}">${f[1]}</button>`).join("")}</div>`;
    }
    function libraryCard(q) {
      const a = ans(q) || "?", r = risk(q);
      const opts = Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? "correct" : ""}"><b>${esc2(k)}</b><span>${esc2(v)}</span></div>`).join("");
      return `<article class="v7Card libraryQuestionCard" style="border-left-color:${rColor(r)}!important"><div class="v7Row"><div class="v7Num">C\xE2u ${esc2(q.num || "")}</div><div class="v7Main"><div class="v7Question">${esc2(q.question || "")}</div><div class="v7Answer"><b>\u0110\xE1p \xE1n: ${esc2(a)}</b><span>${esc2(answerText2(q))}</span></div><div class="libraryOptions">${opts}</div></div>${miniImg(q)}<div class="v7Meta"><span class="v7RiskDot" style="background:${rColor(r)}" title="R\u1EE7i ro: ${esc2(rLabel(r))}"></span></div></div></article>`;
    }
    try {
      renderStudy = function() {
        const base = typeof smart === "function" ? smart($2("search")?.value || "") : typeof RAW !== "undefined" ? RAW : [];
        renderLibraryStats(base);
        const arr = base.filter(pass);
        const list = $2("studyList");
        if (list) list.innerHTML = arr.length ? arr.map(libraryCard).join("") : '<div class="v7Empty">Kh\xF4ng c\xF3 c\xE2u n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.</div>';
      };
    } catch (e) {
    }
    document.addEventListener("click", (e) => {
      const f = e.target.closest("[data-library-filter]");
      if (f) {
        libraryFilter = f.dataset.libraryFilter || "all";
        localStorage.setItem(FILTER_STORE, libraryFilter);
        try {
          renderStudy();
        } catch (_) {
        }
      }
    });
    function editImgs(q) {
      const imgs = q.images || [];
      return `<div class="v7Images"><div class="v7ImagesHead"><span>\u1EA2nh c\u1EE7a c\xE2u h\u1ECFi</span><button class="v7UploadBtn" type="button" data-edit-pick-img>+ Th\xEAm \u1EA3nh</button><input id="editPreviewImgInput" class="v7HiddenInput" type="file" accept="image/*" multiple></div><div class="v7Thumbs">${imgs.length ? imgs.map((im, i) => `<div class="v7Thumb"><button class="v7RemoveImg" type="button" data-edit-rm-img="${i}">\xD7</button><img src="${esc2(src(im))}" alt="\u1EA2nh ${i + 1}" loading="lazy" decoding="async"></div>`).join("") : '<div class="v7NoImage">Ch\u01B0a c\xF3 \u1EA3nh.</div>'}</div></div>`;
    }
    function optRows(opts) {
      return Object.keys(opts || {}).sort().map((k) => `<div class="v7OptRow"><div class="v7Key">${esc2(k)}</div><input value="${esc2(opts[k] || "")}" data-edit-opt="${esc2(k)}"><button class="v7DelOpt" type="button" data-edit-del-opt="${esc2(k)}">\xD7</button></div>`).join("");
    }
    function redrawImg() {
      const h = $2("editPreviewImageHost");
      if (h && window.editDraft) h.innerHTML = editImgs(window.editDraft);
    }
    function redrawOpt() {
      const h = $2("editPreviewOptions");
      if (h && window.editDraft) h.innerHTML = optRows(window.editDraft.options || {});
    }
    function openEditPreview() {
      const c = typeof pool !== "undefined" && pool[ci] || typeof RAW !== "undefined" && RAW[0];
      if (!c) return;
      window.editDraft = clone(c);
      if (typeof editDraft !== "undefined") editDraft = window.editDraft;
      const role = String(window.HODSupabase?.getProfile?.()?.role || "").trim().toLowerCase();
      const canDirect = ["admin", "editor"].includes(role);
      const reporting = !!window.HODSupabase?.getUser?.() && !canDirect;
      const modal = $2("editModal"), box = modal?.querySelector(".box");
      if (!modal || !box) return;
      box.classList.add("editPreviewBox", "quizEditLayoutV2");
      box.innerHTML = `<button class="modalX" type="button" data-edit-preview-close>\xD7</button><div class="v7Head editPreviewHead"><div><span class="v7Label">S\u1EECA C\xC2U H\u1ECEI</span><h2>${esc2((reporting ? "B\xE1o c\xE1o / \u0111\u1EC1 xu\u1EA5t s\u1EEDa c\xE2u " : "S\u1EEDa c\xE2u ") + (c.num || ""))}</h2><p class="v7Hint">S\u1EEDa nhanh n\u1ED9i dung quiz, \u0111\xE1p \xE1n v\xE0 \u1EA3nh.</p></div><div class="v7TopActions"><button class="btn ${reporting ? "hidden" : ""}" type="button" data-edit-preview-restore>Kh\xF4i ph\u1EE5c</button><button class="primary v7SaveTop" type="button" data-edit-preview-save>${canDirect ? "L\u01B0u tr\u1EF1c ti\u1EBFp" : reporting ? "G\u1EEDi b\xE1o c\xE1o" : "L\u01B0u s\u1EEDa"}</button></div></div><article class="v7Card editPreviewCard"><div class="editPreviewTwoColumns"><div class="editPreviewLeftCol"><div class="v7Field"><label>C\xE2u h\u1ECFi</label><textarea data-edit-question>${esc2(c.question || "")}</textarea></div><div class="v7Field"><label>\u0110\xE1p \xE1n \u0111\xFAng</label><input data-edit-answer value="${esc2(ans(c))}" placeholder="VD: A ho\u1EB7c AC"></div><div id="editPreviewImageHost">${editImgs(c)}</div></div><div class="editPreviewRightCol"><div class="v7Field"><label>C\xE1c \u0111\xE1p \xE1n</label><div id="editPreviewOptions" class="v7Options">${optRows(c.options || {})}</div></div><div class="v7Bottom"><button class="btn" type="button" data-edit-add-opt>+ Th\xEAm \u0111\xE1p \xE1n</button></div></div></div></article>`;
      modal.classList.remove("hidden");
    }
    async function saveEditPreview() {
      if (!window.editDraft) return;
      const oldQ = clone(typeof RAW !== "undefined" && RAW.find((c) => c.num === window.editDraft.num) || window.editDraft);
      const modal = $2("editModal");
      const q = (modal?.querySelector("[data-edit-question]")?.value || "").trim();
      const a = (modal?.querySelector("[data-edit-answer]")?.value || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      if (!q) return alert("C\xE2u h\u1ECFi kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!a) return alert("\u0110\xE1p \xE1n \u0111\xFAng kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const opts = {};
      modal?.querySelectorAll("[data-edit-opt]").forEach((inp) => {
        const k = String(inp.dataset.editOpt || "").toUpperCase(), v = (inp.value || "").trim();
        if (k && v) opts[k] = v;
      });
      if (!Object.keys(opts).length) return alert("C\u1EA7n \xEDt nh\u1EA5t 1 \u0111\xE1p \xE1n.");
      for (const k of a.split("")) if (!opts[k]) return alert("\u0110\xE1p \xE1n \u0111\xFAng " + k + " ch\u01B0a c\xF3 n\u1ED9i dung.");
      Object.assign(window.editDraft, { question: q, answer: a, options: opts, answer_text: a.split("").map((k) => k + ". " + (opts[k] || "")).join("; "), subject_code: localStorage.getItem("learninghub_subject_code_merged_v1") || window.editDraft.subject_code || "" });
      if (window.HODSupabase && window.HODSupabase.isReady()) {
        const role = String(window.HODSupabase?.getProfile?.()?.role || "").trim().toLowerCase();
        const canDirect = ["admin", "editor"].includes(role);
        if (canDirect) {
          const id = oldQ?.id || window.editDraft?.id;
          if (!id) {
            alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
            return;
          }
          const u = window.HODSupabase?.getUser?.();
          if (!u?.id) {
            alert("Ch\u01B0a \u0111\u0103ng nh\u1EADp. H\xE3y \u0111\u0103ng nh\u1EADp l\u1EA1i.");
            return;
          }
          const list = window.editDraft.images || [];
          const localHasImg = oldQ?.__imagesLoaded ? list.length > 0 : !!(list.length || oldQ?.has_image);
          const text = window.editDraft.question + " " + Object.values(window.editDraft.options || {}).join(" ");
          const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
          const hasPlaceholder = list.some((im) => {
            const src2 = typeof im === "string" ? im : im.src || im.url || im.secure_url || "";
            return !src2 || src2.includes("URL_") || src2.includes("M\xD4_T\u1EA2") || src2.includes("PLACEHOLDER");
          });
          let risk2 = "";
          let reason = "";
          if (localHasImg && hasPlaceholder || needsImg && list.length === 0) {
            risk2 = "high";
            reason = "C\u1EA7n h\xECnh v\u1EBD/\u1EA3nh minh h\u1ECDa nh\u01B0ng ch\u01B0a c\xF3 \u1EA3nh th\u1EF1c t\u1EBF";
          } else if (window.editDraft.answer.length > 1) {
            risk2 = "medium";
            reason = "C\xE2u ch\u1ECDn nhi\u1EC1u \u0111\xE1p \xE1n \u0111\xFAng, c\u1EA7n r\xE0 so\xE1t k\u1EF9";
          } else {
            risk2 = "low";
          }
          const newData = { question: window.editDraft.question, options: window.editDraft.options || {}, answer: window.editDraft.answer, answer_text: window.editDraft.answer_text, images: list, has_image: localHasImg || needsImg, error_risk: risk2, error_risk_reason: reason || null };
          const oldData = { question: oldQ.question, options: oldQ.options || {}, answer: oldQ.answer, answer_text: oldQ.answer_text, images: oldQ.images || [] };
          if (typeof notify === "function") notify("\u0110ang l\u01B0u...");
          try {
            const res = await fetch("/api/admin-action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user_id: u.id, action: "save_question_direct", payload: { question_id: id, new_data: newData, old_data: oldData } }) });
            const resJson = await res.json().catch(() => ({}));
            if (!res.ok || resJson.error) {
              alert("L\u01B0u tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + (resJson.error || res.status));
              return;
            }
          } catch (fetchErr) {
            alert("L\u1ED7i k\u1EBFt n\u1ED1i khi l\u01B0u: " + fetchErr.message);
            return;
          }
          if (typeof window.clearLearningHubQuestionCache === "function") {
            window.clearLearningHubQuestionCache();
          }
          $2("editModal")?.classList.add("hidden");
          notify("\u0110\xE3 l\u01B0u tr\u1EF1c ti\u1EBFp \u2713");
          if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly(true);
          else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase(true);
          return;
        }
        await window.HODSupabase.submitEditRequest(window.editDraft, oldQ);
        return;
      }
      if (window.HODSupabase?.getUser?.()) {
        alert("Ch\u01B0a k\u1EBFt n\u1ED1i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u duy\u1EC7t. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i g\u1EEDi l\u1EA1i b\xE1o c\xE1o.");
        return;
      }
      edits[window.editDraft.num] = { question: window.editDraft.question, options: window.editDraft.options, answer: window.editDraft.answer, answer_text: window.editDraft.answer_text, images: window.editDraft.images || [] };
      localStorage.setItem("hod102_user_edits_v1", JSON.stringify(edits));
      rebuild();
      ci = pool.findIndex((c) => c.num === window.editDraft.num);
      if (ci < 0) ci = 0;
      flipped = false;
      renderCard();
      renderQuiz();
      renderStudy();
      $2("editModal")?.classList.add("hidden");
      notify("\u0110\xE3 l\u01B0u s\u1EEDa local");
    }
    function apply() {
      try {
        openEditor = openEditPreview;
        saveEditor = saveEditPreview;
      } catch (e) {
      }
      window.openEditor = openEditPreview;
      window.saveEditor = saveEditPreview;
    }
    apply();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 0));
    else setTimeout(apply, 0);
    setTimeout(apply, 900);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-edit-preview-close]")) return $2("editModal")?.classList.add("hidden");
      if (e.target.closest("[data-edit-preview-save]")) return saveEditPreview();
      if (e.target.closest("[data-edit-preview-restore]")) return typeof restoreEditor === "function" && restoreEditor();
      if (e.target.closest("[data-edit-pick-img]")) return $2("editPreviewImgInput")?.click();
      const rm = e.target.closest("[data-edit-rm-img]");
      if (rm && window.editDraft) {
        window.editDraft.images = window.editDraft.images || [];
        window.editDraft.images.splice(+rm.dataset.editRmImg, 1);
        redrawImg();
        return;
      }
      if (e.target.closest("[data-edit-add-opt]") && window.editDraft) {
        window.editDraft.options = window.editDraft.options || {};
        const k = nextKey(window.editDraft.options);
        if (!k) return alert("\u0110\xE3 \u0111\u1EE7 s\u1ED1 \u0111\xE1p \xE1n.");
        window.editDraft.options[k] = "";
        redrawOpt();
        setTimeout(() => document.querySelector(`[data-edit-opt="${k}"]`)?.focus(), 0);
        return;
      }
      const del = e.target.closest("[data-edit-del-opt]");
      if (del && window.editDraft) {
        delete window.editDraft.options[String(del.dataset.editDelOpt || "").toUpperCase()];
        redrawOpt();
      }
    });
    document.addEventListener("change", async (e) => {
      if (e.target?.id === "editPreviewImgInput" && window.editDraft) {
        const inp = e.target;
        const files = Array.from(inp.files || []);
        if (!files.length) return;
        inp.disabled = true;
        if (typeof notify === "function") notify("\u0110ang upload \u1EA3nh...");
        try {
          window.editDraft.images = window.editDraft.images || [];
          if (window.__LHCleanImages) window.editDraft.images = window.__LHCleanImages(window.editDraft.images);
          for (const file of files) {
            if (window.__LHUploadCloudinary) {
              const uploaded = await window.__LHUploadCloudinary(file);
              if (uploaded) window.editDraft.images.push(uploaded);
            } else {
              const fr = new FileReader();
              const p = new Promise((resolve) => {
                fr.onload = () => {
                  window.editDraft.images.push({ id: "edit_" + Date.now(), src: fr.result, source: "user-upload", name: file.name });
                  resolve();
                };
                fr.readAsDataURL(file);
              });
              await p;
            }
          }
          redrawImg();
          if (typeof notify === "function") notify("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
        } catch (err) {
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          inp.value = "";
        }
      }
    });
    setTimeout(() => {
      try {
        if ($2("studyList")) renderStudy();
      } catch (e) {
      }
    }, 350);
  })();
  (function() {
    const FILTER_STORE = "learninghub_library_filter_v1";
    function $2(id) {
      return document.getElementById(id);
    }
    function esc2(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function ans(q) {
      return String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    function imgSrc(im) {
      return typeof im === "string" ? im : im?.src || im?.url || "";
    }
    function hasImg(q) {
      return !!((q?.images || []).map(imgSrc).filter(Boolean).length || q?.has_image);
    }
    function risk(q) {
      return q?.error_risk || (ans(q).length > 1 ? "medium" : "low");
    }
    function riskColor(r) {
      return { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" }[r] || "#999";
    }
    function pass(q) {
      const f = localStorage.getItem(FILTER_STORE) || "all";
      if (f === "all") return true;
      if (f === "has_image") return hasImg(q);
      return risk(q) === f;
    }
    function correctText(q) {
      const a = ans(q);
      return a ? a.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ") : "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
    }
    function miniImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return '<div class="libraryV2Img empty"></div>';
      return `<div class="libraryV2Img"><img src="${esc2(imgs[0])}" alt="\u1EA2nh c\xE2u h\u1ECFi" loading="lazy" decoding="async">${imgs.length > 1 ? `<span>+${imgs.length - 1}</span>` : ""}</div>`;
    }
    function allImages(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) return "";
      return `<div class="libraryV2Images">${imgs.map((s, i) => `<img src="${esc2(s)}" alt="\u1EA2nh ${i + 1}" loading="lazy" decoding="async">`).join("")}</div>`;
    }
    function stats(data) {
      return { total: data.length, img: data.filter(hasImg).length, high: data.filter((q) => risk(q) === "high").length, medium: data.filter((q) => risk(q) === "medium").length, low: data.filter((q) => risk(q) === "low").length };
    }
    function renderStats(data) {
      const list = $2("studyList");
      if (!list) return;
      let box = $2("libraryQuestionFilters");
      if (!box) {
        box = document.createElement("div");
        box.id = "libraryQuestionFilters";
        box.className = "v7Stats libraryQuestionFilters";
        list.parentNode.insertBefore(box, list);
      }
      const f = localStorage.getItem(FILTER_STORE) || "all", s = stats(data);
      const filters = [["all", "Th\u01B0 vi\u1EC7n"], ["has_image", "\u{1F4F7} C\xF3 \u1EA3nh"], ["high", "R\u1EE7i ro cao"], ["medium", "Trung b\xECnh"], ["low", "Th\u1EA5p"]];
      box.innerHTML = `<div class="v7StatLine"><span class="v7StatItem">${s.total} c\xE2u</span><span class="v7StatItem" style="color:#3498db">${s.img} c\xF3 \u1EA3nh</span><span class="v7StatItem" style="color:#e74c3c">${s.high} r\u1EE7i ro cao</span><span class="v7StatItem" style="color:#f39c12">${s.medium} trung b\xECnh</span><span class="v7StatItem" style="color:#27ae60">${s.low} th\u1EA5p</span></div><div class="v7FilterLine">${filters.map((x) => `<button type="button" class="v7FilterBtn ${f === x[0] ? "active" : ""}" data-library-filter="${x[0]}">${x[1]}</button>`).join("")}</div>`;
    }
    function optionList(q) {
      const a = ans(q);
      return Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? "correct" : ""}"><b>${esc2(k)}</b><span>${esc2(v)}</span></div>`).join("");
    }
    function card(q, i) {
      const a = ans(q) || "?", r = risk(q);
      return `<article class="libraryV2Card libraryQuestionCard" data-library-v2-card="${i}" data-num="${esc2(q.num || "")}" style="border-left-color:${riskColor(r)}!important"><div class="libraryV2Row"><div class="libraryV2Num">C\xE2u ${esc2(q.num || i + 1)}</div><div class="libraryV2Main"><div class="libraryV2Question">${esc2(q.question || "")}</div><div class="libraryV2Answer"><b>\u0110\xE1p \xE1n: ${esc2(a)}</b><span>${esc2(correctText(q))}</span></div></div>${miniImages(q)}<div class="libraryV2Actions"><button type="button" class="libraryV2Study" data-library-study="${i}">H\u1ECDc</button><button type="button" class="libraryV2Report" data-library-report="${i}">!</button></div></div><div class="libraryV2Details"><div class="libraryOptions">${optionList(q)}</div>${allImages(q)}</div></article>`;
    }
    function getBase() {
      const q = $2("search")?.value || $2("studySearch")?.value || "";
      try {
        return (typeof smart === "function" ? smart(q) : typeof RAW !== "undefined" ? RAW : []) || [];
      } catch (e) {
        return typeof RAW !== "undefined" ? RAW : [];
      }
    }
    function render() {
      const base = getBase();
      renderStats(base);
      const arr = base.filter(pass);
      const list = $2("studyList");
      if (!list) return;
      list.innerHTML = arr.length ? arr.map(card).join("") : '<div class="v7Empty libraryV2Empty">Kh\xF4ng c\xF3 c\xE2u n\xE0o ph\xF9 h\u1EE3p b\u1ED9 l\u1ECDc.</div>';
      setTimeout(() => {
        try {
          document.dispatchEvent(new CustomEvent("library-v2-rendered"));
        } catch (e) {
        }
      }, 0);
    }
    function goStudy(i) {
      const q = getBase().filter(pass)[i] || getBase()[i];
      if (!q) return;
      let idx = (pool || []).findIndex((x) => Number(x.num) === Number(q.num));
      if (idx < 0) {
        pool = [...RAW];
        idx = pool.findIndex((x) => Number(x.num) === Number(q.num));
      }
      if (idx >= 0) {
        ci = idx;
        flipped = false;
        flipDir = "horizontal";
        try {
          renderCard();
        } catch (e) {
        }
        document.querySelector('[data-tab="fc"]')?.click?.();
      }
    }
    function report(i) {
      const q = getBase().filter(pass)[i] || getBase()[i];
      if (!q) return;
      if (typeof window.openStudyReport === "function") return window.openStudyReport(q.num);
      let idx = (pool || []).findIndex((x) => Number(x.num) === Number(q.num));
      if (idx < 0) {
        pool = [...RAW];
        idx = pool.findIndex((x) => Number(x.num) === Number(q.num));
      }
      if (idx >= 0) {
        ci = idx;
        flipped = false;
        try {
          renderCard();
          openEditor();
        } catch (e) {
        }
      }
    }
    try {
      renderStudy = render;
      window.renderStudy = render;
    } catch (e) {
      window.renderStudy = render;
    }
    document.addEventListener("click", function(e) {
      const f = e.target.closest("[data-library-filter]");
      if (f) {
        localStorage.setItem(FILTER_STORE, f.dataset.libraryFilter || "all");
        render();
        return;
      }
      const t = e.target.closest("[data-library-toggle]");
      if (t) {
        const card2 = t.closest(".libraryV2Card");
        card2?.classList.toggle("open");
        t.textContent = card2?.classList.contains("open") ? "Thu g\u1ECDn" : "M\u1EDF";
        return;
      }
      const h = e.target.closest("[data-library-study]");
      if (h) {
        goStudy(+h.dataset.libraryStudy);
        return;
      }
      const r = e.target.closest("[data-library-report]");
      if (r) {
        report(+r.dataset.libraryReport);
        return;
      }
    }, true);
    document.addEventListener("DOMContentLoaded", () => setTimeout(render, 60));
    setTimeout(render, 500);
  })();
  (function() {
    const FILTER_STORE = "learninghub_library_filter_v1";
    const VIEW_STORE = "learninghub_library_view_v1";
    const OPEN_STORE = "learninghub_library_open_nums_v1";
    const SEARCH_STORE = "learninghub_library_search_v1";
    const $2 = (id) => document.getElementById(id);
    const esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9#:\s]/g, " ").replace(/\s+/g, " ").trim();
    const ans = (q) => String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    const imgSrc = (im) => typeof im === "string" ? im : im?.src || im?.url || "";
    const optimizeImageUrl = (src) => {
      if (!src) return "";
      if (src.includes("res.cloudinary.com/") && src.includes("/image/upload/")) {
        if (!src.includes("q_auto") && !src.includes("f_auto")) {
          return src.replace("/image/upload/", "/image/upload/c_limit,w_600,q_auto,f_auto/");
        }
      }
      return src;
    };
    const hasImg = (q) => {
      const list = q?.images || [];
      const localHasImg = !!(list.map(imgSrc).filter(Boolean).length || q?.has_image);
      if (localHasImg) return true;
      const text = (q?.question || "") + " " + Object.values(q?.options || {}).join(" ");
      return /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    };
    const risk = (q) => {
      if (q?.error_risk) return q.error_risk;
      const list = (q?.images || []).map(imgSrc).filter(Boolean);
      const localHasImg = !!(list.length || q?.has_image);
      const text = (q?.question || "") + " " + Object.values(q?.options || {}).join(" ");
      const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
      const hasPlaceholder = list.some((im) => {
        const src = typeof im === "string" ? im : im.src || im.url || "";
        return !src || src.includes("URL_") || src.includes("M\xD4_T\u1EA2") || src.includes("PLACEHOLDER");
      });
      if (localHasImg && hasPlaceholder || needsImg && list.length === 0) {
        return "high";
      }
      if (ans(q).length > 1) return "medium";
      return "low";
    };
    const riskColor = (r) => ({ high: "#e74c3c", medium: "#f39c12", low: "#27ae60" })[r] || "#999";
    const filterVal = () => localStorage.getItem(FILTER_STORE) || "all";
    const viewVal = () => localStorage.getItem(VIEW_STORE) || "compact";
    let lastList = [];
    const libraryOpenNums = /* @__PURE__ */ new Set();
    try {
      JSON.parse(localStorage.getItem(OPEN_STORE) || "[]").forEach((n) => libraryOpenNums.add(String(n)));
    } catch (e) {
    }
    function saveOpenState() {
      try {
        localStorage.setItem(OPEN_STORE, JSON.stringify([...libraryOpenNums]));
      } catch (e) {
      }
    }
    function answerText2(q) {
      const a = ans(q);
      return a ? a.split("").map((k) => k + ". " + (q.options?.[k] || "")).join(" | ") : "Ch\u01B0a c\xF3 \u0111\xE1p \xE1n";
    }
    function allText(q) {
      return norm([q?.num, q?.question, q?.answer, q?.answer_text, Object.values(q?.options || {}).join(" ")].join(" "));
    }
    function parseQuery(raw) {
      const q = String(raw || "").trim(), n = norm(q);
      const p = { raw: q, n, num: null, answer: null, multi: false, tokens: [] };
      if (/^\d+$/.test(n)) p.num = Number(n);
      let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)|(?:^|\s)cau\s*(\d+)(?:\s|$)/);
      if (m) p.num = Number(m[1] || m[2]);
      m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
      if (m) p.answer = m[1].toUpperCase().split("").sort().join("");
      p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
      let tokens = n.split(/\s+/).filter((t) => t.length >= 2 && !/^(answer|ans|dap|an|dapan|multi|multiple|chon|nhieu|lua|cau)$/.test(t) && !t.includes(":") && !/^#?\d+$/.test(t));
      const cleanN = n.replace(/(?:answer|ans|dap\s*an|dapan)\s*:\s*[a-e]+/gi, "").replace(/(?:^|\s)#\s*\d+(?:\s|$)|(?:^|\s)cau\s*\d+(?:\s|$)/gi, "").replace(/(?:^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/gi, "").replace(/\s+/g, " ").trim();
      if (cleanN.includes(" ") && cleanN.length >= 3) {
        tokens.unshift(cleanN);
      }
      p.tokens = tokens;
      return p;
    }
    function hlt(text) {
      const raw = $2("search")?.value || $2("studySearch")?.value || "";
      const p = parseQuery(raw);
      const tokens = [...new Set((p.tokens || []).filter((t) => t.length >= 2))].sort((a, b) => b.length - a.length);
      const src = String(text ?? "");
      if (!tokens.length) return esc2(src);
      let ns = "", map = [];
      for (let i = 0; i < src.length; i++) {
        let c = norm(src[i]);
        if (!c) continue;
        for (const ch of c) {
          ns += ch;
          map.push(i);
        }
      }
      let ranges = [];
      for (const t of tokens) {
        let pos = 0;
        while ((pos = ns.indexOf(t, pos)) > -1) {
          let a = map[pos], b = map[pos + t.length - 1] + 1;
          if (a != null && b != null && !ranges.some((r) => !(b <= r[0] || a >= r[1]))) ranges.push([a, b]);
          pos += t.length;
        }
      }
      if (!ranges.length) return esc2(src);
      ranges.sort((a, b) => a[0] - b[0]);
      let out = "", last = 0;
      for (const [a, b] of ranges) {
        out += esc2(src.slice(last, a));
        out += `<mark class="searchMark tokenMark">${esc2(src.slice(a, b))}</mark>`;
        last = b;
      }
      return out + esc2(src.slice(last));
    }
    function searchList() {
      const raw = $2("search")?.value || $2("studySearch")?.value || "";
      const p = parseQuery(raw);
      let data = Array.isArray(RAW) ? RAW : [];
      if (!p.raw) return data;
      return data.map((q) => {
        let score = 0;
        if (p.num !== null) {
          if (Number(q.num) !== p.num) return null;
          score += 2e3;
        }
        const a = ans(q).split("").sort().join("");
        if (p.answer) {
          if (a !== p.answer) return null;
          score += 900;
        }
        if (p.multi) {
          if (ans(q).length <= 1) return null;
          score += 350;
        }
        const h = allText(q);
        for (const t of p.tokens) {
          if (!h.includes(t)) return null;
          score += 80;
        }
        return { q, score };
      }).filter(Boolean).sort((x, y) => y.score - x.score || Number(x.q.num) - Number(y.q.num)).map((x) => x.q);
    }
    function passFilter(q) {
      const f = filterVal();
      if (f === "all") return true;
      if (f === "has_image") return hasImg(q);
      return risk(q) === f;
    }
    function stats(data) {
      return { total: data.length, img: data.filter(hasImg).length, high: data.filter((q) => risk(q) === "high").length, medium: data.filter((q) => risk(q) === "medium").length, low: data.filter((q) => risk(q) === "low").length };
    }
    function ensureToolbar() {
      const list = $2("studyList");
      if (!list) return;
      let tool = $2("libraryStableToolbar");
      if (!tool) {
        tool = document.createElement("section");
        tool.id = "libraryStableToolbar";
        tool.className = "libraryStableToolbar";
        tool.innerHTML = '<div class="libStableHead libStableHeadCompact"><div class="libStableInfo"><b id="libStableFilterText">T\u1EA5t c\u1EA3</b><em id="libStableCount">0 c\xE2u</em></div></div><div id="libStableSearchSlot"></div><div id="libStableFilters"></div>';
        const searchBox2 = ($2("search") || $2("studySearch"))?.closest(".search");
        (searchBox2?.parentNode || list.parentNode).insertBefore(tool, searchBox2 || list);
      }
      const searchBox = ($2("search") || $2("studySearch"))?.closest(".search");
      if (searchBox && $2("libStableSearchSlot") && searchBox.parentNode !== $2("libStableSearchSlot")) $2("libStableSearchSlot").appendChild(searchBox);
      const input = $2("search") || $2("studySearch");
      if (input) {
        input.placeholder = "T\xECm c\xE2u ho\u1EB7c #12...";
        if (!input.value) {
          try {
            input.value = localStorage.getItem(SEARCH_STORE) || "";
          } catch (e) {
          }
        }
        if (!$2("libStableClear")) {
          const b = document.createElement("button");
          b.id = "libStableClear";
          b.type = "button";
          b.textContent = "\xD7";
          b.title = "X\xF3a t\xECm ki\u1EBFm";
          b.onclick = function() {
            input.value = "";
            try {
              localStorage.removeItem(SEARCH_STORE);
            } catch (e) {
            }
            renderUnified();
            input.focus();
          };
          input.insertAdjacentElement("afterend", b);
        }
        input.oninput = function() {
          try {
            localStorage.setItem(SEARCH_STORE, input.value || "");
          } catch (e) {
          }
          renderUnified();
        };
        $2("libStableClear")?.classList.toggle("show", !!input.value.trim());
      }
    }
    function renderFilters(base, shown) {
      ensureToolbar();
      const box = $2("libStableFilters");
      if (!box) return;
      const s = stats(base), f = filterVal(), v = viewVal();
      const filters = [["all", "T\u1EA5t c\u1EA3", s.total], ["has_image", "C\xF3 \u1EA3nh", s.img], ["high", "R\u1EE7i ro cao", s.high], ["medium", "Trung b\xECnh", s.medium], ["low", "Th\u1EA5p", s.low]];
      const isAllOpen = v === "full";
      box.innerHTML = `
      <div class="libStableFilterLine" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${filters.map((x) => `<button type="button" class="${f === x[0] ? "active" : ""}" data-stable-filter="${x[0]}">${x[1]} <small>${x[2]}</small></button>`).join("")}
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="v7FilterBtn ${isAllOpen ? "active" : ""}" data-stable-toggle-all="${isAllOpen ? "compact" : "full"}" title="M\u1EDF ho\u1EB7c thu g\u1ECDn t\u1EA5t c\u1EA3 c\xE2u h\u1ECFi trong danh s\xE1ch">
            ${isAllOpen ? "\u{1F4D1} Thu g\u1ECDn t\u1EA5t c\u1EA3" : "\u{1F4C2} M\u1EDF t\u1EA5t c\u1EA3"}
          </button>
        </div>
      </div>
    `;
      const ft = $2("libStableFilterText"), ct = $2("libStableCount");
      if (ft) ft.textContent = "\u0110ang l\u1ECDc: " + (filters.find((x) => x[0] === f)?.[1] || "T\u1EA5t c\u1EA3");
      if (ct) ct.textContent = shown.length + " / " + base.length + " c\xE2u";
    }
    function miniImg(q) {
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (imgs.length) {
        return `<div class="libraryV2Img noAutoImg" title="C\xF3 ${imgs.length} \u1EA3nh"><img src="${esc2(optimizeImageUrl(imgs[0]))}" alt="thumb" loading="lazy" decoding="async"></div>`;
      }
      return q.has_image ? `<div class="libraryV2Img noAutoImg" title="C\xF3 \u1EA3nh"><span>\u{1F5BC}</span></div>` : '<div class="libraryV2Img empty"></div>';
    }
    function options(q) {
      const a = ans(q);
      return Object.entries(q.options || {}).map(([k, v]) => `<div class="libraryOption ${a.includes(String(k).toUpperCase()) ? "correct" : ""}"><b>${esc2(k)}</b><span>${hlt(v)}</span></div>`).join("");
    }
    function images(q, open) {
      if (!open) return "";
      if (q.has_image && !q.__imagesLoaded && !q.__imagesLoading) {
        q.__imagesLoading = true;
        const supa = window.HODSupabase?.__client;
        if (supa && q.id) {
          supa.from("questions").select("id,images,updated_at").eq("id", q.id).maybeSingle().then((res) => {
            q.__imagesLoading = false;
            q.__imagesLoaded = true;
            if (res.data) {
              q.images = cleanImages(res.data.images);
              if (typeof renderStudy === "function") renderStudy();
            }
          }).catch(() => {
            q.__imagesLoading = false;
            q.__imagesLoaded = true;
          });
        }
      }
      const imgs = (q.images || []).map(imgSrc).filter(Boolean);
      if (!imgs.length) {
        return q.has_image ? `<div class="libraryV2Images"><div class="imgLoading" style="color:var(--mist);font-size:.8rem;padding:10px 0;">\u0110ang t\u1EA3i \u1EA3nh t\u1EEB database...</div></div>` : "";
      }
      return `<div class="libraryV2Images">${imgs.map((s, i) => `<img loading="lazy" decoding="async" src="${esc2(optimizeImageUrl(s))}" alt="\u1EA2nh ${i + 1}" class="zoomableImg">`).join("")}</div>`;
    }
    function card(q, i) {
      const a = ans(q) || "?", r = risk(q);
      const rawSearch = ($2("search")?.value || $2("studySearch")?.value || "").trim();
      const queryObj = parseQuery(rawSearch);
      let isMatchInDetails = false;
      if (queryObj.tokens && queryObj.tokens.length) {
        const detailsText = norm(Object.values(q.options || {}).join(" ") + " " + (q.answer_text || ""));
        isMatchInDetails = queryObj.tokens.every((t) => detailsText.includes(t));
      }
      const open = viewVal() === "full" || libraryOpenNums.has(String(q.num)) || isMatchInDetails || !!rawSearch;
      return `<article class="libraryV2Card libraryQuestionCard ${open ? "open" : ""}" data-num="${esc2(q.num || "")}" data-stable-index="${i}" style="border-left-color:${riskColor(r)}!important"><div class="libraryV2Row"><div class="libraryV2Num">C\xE2u ${esc2(q.num || i + 1)}</div><div class="libraryV2Main"><div class="libraryV2Question">${hlt(q.question || "")}</div><div class="libraryV2Answer"><b>\u0110\xE1p \xE1n: ${esc2(a)}</b><span>${hlt(answerText2(q))}</span></div></div>${miniImg(q)}<div class="libraryV2Actions"><button type="button" class="libraryV2Study" data-stable-study="${i}" title="H\u1ECDc c\xE2u n\xE0y">H\u1ECDc</button><button type="button" class="libraryV2Report" data-stable-report="${i}" title="B\xE1o c\xE1o / s\u1EEDa c\xE2u">!</button></div></div><div class="libraryV2Details"><div class="libraryOptions">${options(q)}</div>${images(q, open)}</div></article>`;
    }
    function renderUnified() {
      ensureToolbar();
      const base = searchList();
      lastList = base.filter(passFilter);
      renderFilters(base, lastList);
      const list = $2("studyList");
      if (!list) return;
      list.innerHTML = lastList.length ? lastList.map(card).join("") : '<div class="libraryStableEmpty"><b>Kh\xF4ng c\xF3 c\xE2u ph\xF9 h\u1EE3p.</b><button type="button" data-stable-clear-all>X\xF3a t\xECm ki\u1EBFm & b\u1ED9 l\u1ECDc</button></div>';
      if ($2("libStableClear")) $2("libStableClear").classList.toggle("show", !!(($2("search") || $2("studySearch"))?.value || "").trim());
    }
    function setCurrent(q) {
      let idx = (pool || []).findIndex((x) => Number(x.num) === Number(q.num));
      if (idx < 0) {
        pool = [...RAW];
        idx = pool.findIndex((x) => Number(x.num) === Number(q.num));
      }
      if (idx >= 0) {
        ci = idx;
        flipped = false;
        flipDir = "horizontal";
        try {
          renderCard();
        } catch (e) {
        }
        return true;
      }
      return false;
    }
    function showImageLightbox(src) {
      let overlay = document.getElementById("lhImageLightbox");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "lhImageLightbox";
        overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        cursor: zoom-out;
        opacity: 0;
        transition: opacity 0.25s ease;
      `;
        overlay.innerHTML = `<img id="lhLightboxImg" src="" style="width:90vw;height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);transition:transform 0.25s ease;transform:scale(0.95);">`;
        overlay.onclick = () => {
          overlay.style.opacity = "0";
          overlay.querySelector("img").style.transform = "scale(0.95)";
          setTimeout(() => overlay.classList.add("hidden"), 250);
        };
        document.body.appendChild(overlay);
      }
      overlay.classList.remove("hidden");
      overlay.querySelector("img").src = src;
      setTimeout(() => {
        overlay.style.opacity = "1";
        overlay.querySelector("img").style.transform = "scale(1)";
      }, 10);
    }
    document.addEventListener("click", function(e) {
      const zoomImg = e.target.closest(".libraryV2Images img, #images img, .sitem img, .dqEditImg img, .libraryV2Img img");
      if (zoomImg && zoomImg.src) {
        e.preventDefault();
        e.stopPropagation();
        showImageLightbox(zoomImg.src);
        return;
      }
      const toggleAll = e.target.closest("[data-stable-toggle-all]");
      if (toggleAll) {
        e.preventDefault();
        const targetView = toggleAll.dataset.stableToggleAll;
        localStorage.setItem(VIEW_STORE, targetView);
        if (targetView === "compact") {
          libraryOpenNums.clear();
          saveOpenState();
        }
        renderUnified();
        return;
      }
      const f = e.target.closest("[data-stable-filter]");
      if (f) {
        e.preventDefault();
        localStorage.setItem(FILTER_STORE, f.dataset.stableFilter || "all");
        renderUnified();
        return;
      }
      if (e.target.closest("[data-stable-clear-all]")) {
        e.preventDefault();
        const input = $2("search") || $2("studySearch");
        if (input) input.value = "";
        try {
          localStorage.removeItem(SEARCH_STORE);
        } catch (_e) {
        }
        localStorage.setItem(FILTER_STORE, "all");
        renderUnified();
        return;
      }
      const h = e.target.closest("[data-stable-study]");
      if (h) {
        e.preventDefault();
        const q = lastList[+h.dataset.stableStudy];
        if (q && setCurrent(q)) document.querySelector('[data-tab="fc"]')?.click?.();
        return;
      }
      const r = e.target.closest("[data-stable-report]");
      if (r) {
        e.preventDefault();
        const q = lastList[+r.dataset.stableReport];
        if (q) {
          if (typeof window.openStudyReport === "function") window.openStudyReport(q.num, e);
          else if (setCurrent(q)) openEditor?.();
        }
        return;
      }
      const cardRow = e.target.closest(".libraryV2Row");
      if (cardRow) {
        const card2 = cardRow.closest(".libraryV2Card");
        if (card2) {
          e.preventDefault();
          card2.classList.toggle("open");
          const num = card2.dataset.num;
          if (num) {
            if (card2.classList.contains("open")) libraryOpenNums.add(String(num));
            else libraryOpenNums.delete(String(num));
            saveOpenState();
          }
          const toggleBtn = card2.querySelector("[data-stable-toggle]");
          if (toggleBtn) {
            toggleBtn.textContent = card2.classList.contains("open") ? "Thu g\u1ECDn" : "M\u1EDF";
          }
          return;
        }
      }
    }, true);
    function apply() {
      try {
        renderStudy = renderUnified;
        window.renderStudy = renderUnified;
      } catch (e) {
        window.renderStudy = renderUnified;
      }
      const s = $2("search") || $2("studySearch");
      if (s) {
        try {
          if (!s.value) s.value = localStorage.getItem(SEARCH_STORE) || "";
        } catch (e) {
        }
        s.oninput = function() {
          try {
            localStorage.setItem(SEARCH_STORE, s.value || "");
          } catch (e) {
          }
          renderUnified();
        };
      }
      renderUnified();
    }
    window.__renderStudyUnified = renderUnified;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(apply, 0));
    else setTimeout(apply, 0);
    setTimeout(apply, 700);
  })();
  (function() {
    const CLOUDINARY_CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || "";
    const CLOUDINARY_UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || "";
    const CLOUDINARY_UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || "learninghub/questions";
    const CLOUDINARY_UPLOAD_URL = window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (CLOUDINARY_CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload` : "");
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    const QUESTION_LIGHT_COLUMNS = "id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason";
    function $2(id) {
      return document.getElementById(id);
    }
    function supa() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function subject() {
      return localStorage.getItem(SUBJECT_STORE2) || "";
    }
    function notifyX(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    async function uploadCloudinary(file) {
      if (!CLOUDINARY_UPLOAD_URL || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Thi\u1EBFu Cloudinary trong config.js.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      fd.append("folder", CLOUDINARY_UPLOAD_FOLDER);
      const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || "Upload Cloudinary th\u1EA5t b\u1EA1i");
      return { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: "cloudinary" };
    }
    async function loadSubjectLight(force = false) {
      const code = subject();
      if (!code) return false;
      try {
        const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(code) + "&ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c c\xE2u h\u1ECFi t\u1EEB Turso");
        const data = Array.isArray(json.data) ? json.data : [];
        RAW = data.map((r) => {
          const images = typeof cleanImages === "function" ? cleanImages(r.images || []) : r.images || [];
          return { id: r.id, subject_code: r.subject_code || code, num: r.num, question: r.question, options: r.options || {}, answer: r.answer || "", answer_text: r.answer_text || "", images, has_image: !!(r.has_image || images.length), error_risk: r.error_risk, error_risk_reason: r.error_risk_reason, __imagesChecked: true, __imagesLoaded: true };
        });
        pool = [...RAW];
        const saved = +localStorage.getItem("learninghub_progress_" + code) || 0;
        ci = Math.max(0, Math.min(saved, Math.max(0, pool.length - 1)));
        flipped = false;
        try {
          renderCard();
          renderQuiz();
          renderStudy();
        } catch (e) {
        }
        return true;
      } catch (e) {
        console.warn("[light load]", e);
        return false;
      }
    }
    window.loadCurrentSubjectOnly = loadSubjectLight;
    function patchApi() {
      if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;
    }
    patchApi();
    setTimeout(patchApi, 500);
    setTimeout(patchApi, 1500);
    async function fetchImagesForCurrent() {
      const c = supa();
      const q = pool && pool[ci] || null;
      if (!c || !q || !q.id || q.__imagesChecked) return;
      q.__imagesChecked = true;
      const { data, error } = await c.from("questions").select("id,images").eq("id", q.id).maybeSingle();
      if (!error && data) {
        q.images = data.images || [];
        q.__imagesLoaded = true;
        try {
          renderCard();
        } catch (e) {
        }
      }
    }
    const oldRenderCard = typeof renderCard === "function" ? renderCard : null;
    if (oldRenderCard && !oldRenderCard.__cloudinaryLazy) {
      renderCard = function() {
        oldRenderCard.apply(this, arguments);
      };
      renderCard.__cloudinaryLazy = true;
      window.renderCard = renderCard;
    }
    function bindEditorUpload() {
      const inp = $2("imgUpload");
      if (!inp || inp.__cloudinaryBound) return;
      inp.__cloudinaryBound = true;
      inp.onchange = async function(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        inp.disabled = true;
        notifyX("\u0110ang upload \u1EA3nh l\xEAn Cloudinary...");
        try {
          editDraft.images = editDraft.images || [];
          for (const file of files) {
            editDraft.images.push(await uploadCloudinary(file));
          }
          if (typeof renderEditImages === "function") renderEditImages();
          notifyX("\u0110\xE3 upload \u1EA3nh l\xEAn Cloudinary");
        } catch (err) {
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          e.target.value = "";
        }
      };
    }
    const oldOpenEditor = typeof openEditor === "function" ? openEditor : null;
    if (oldOpenEditor && !oldOpenEditor.__cloudinaryPatch) {
      openEditor = async function() {
        const q = pool && pool[ci] || null;
        if (q && q.id && !q.__imagesLoaded) {
          try {
            const c = supa();
            const { data } = await c.from("questions").select("*").eq("id", q.id).maybeSingle();
            if (data) Object.assign(q, data, { images: data.images || [], __imagesLoaded: true });
          } catch (e) {
          }
        }
        const r = oldOpenEditor.apply(this, arguments);
        setTimeout(bindEditorUpload, 0);
        return r;
      };
      openEditor.__cloudinaryPatch = true;
      window.openEditor = openEditor;
    }
    document.addEventListener("DOMContentLoaded", () => {
      patchApi();
      setTimeout(bindEditorUpload, 300);
    });
  })();
  (function() {
    const CLOUD_NAME = window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || "";
    const UPLOAD_PRESET = window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || "";
    const UPLOAD_FOLDER = window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || "learninghub/questions";
    const UPLOAD_URL = window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (CLOUD_NAME ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload` : "");
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    const LIGHT_COLUMNS = "id,subject_code,num,question,options,answer,answer_text,is_active,updated_at,has_image,error_risk,error_risk_reason";
    const FULL_COLUMNS = "id,subject_code,num,question,options,answer,answer_text,images,is_active,updated_at,has_image,error_risk,error_risk_reason,has_image,error_risk,error_risk_reason";
    let lastAutoReload = 0;
    function $2(id) {
      return document.getElementById(id);
    }
    function supa() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function subject() {
      return localStorage.getItem(SUBJECT_STORE2) || "";
    }
    function notifyX(msg) {
      if (typeof notify === "function") notify(msg);
      else console.log(msg);
    }
    function isDataImage(s) {
      return /^data:image\//i.test(String(s || ""));
    }
    function isLikelyBase64(s) {
      s = String(s || "").trim();
      return s.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(s);
    }
    function cleanImageOne(im) {
      if (!im) return null;
      if (typeof im === "string") {
        const s = im.trim();
        if (!s || isDataImage(s) || isLikelyBase64(s)) return null;
        if (/^https?:\/\//i.test(s)) return { src: s, url: s, source: "url" };
        return null;
      }
      if (typeof im === "object") {
        const raw = im.secure_url || im.src || im.url || im.publicUrl || im.public_url || im.image_url || im.imageUrl || im.file_url || im.fileUrl || im.href || im.path || "";
        if (!raw || isDataImage(raw) || isLikelyBase64(raw)) return null;
        if (!/^https?:\/\//i.test(String(raw))) return null;
        return {
          id: im.public_id || im.id || void 0,
          public_id: im.public_id || im.id || void 0,
          src: String(raw),
          url: String(raw),
          width: im.width || void 0,
          height: im.height || void 0,
          source: im.source || "url"
        };
      }
      return null;
    }
    function cleanImages2(arr) {
      let raw = arr || [];
      if (typeof raw === "string") {
        const s = raw.trim();
        if (s.startsWith("[") && s.endsWith("]") || s.startsWith("{") && s.endsWith("}")) {
          try {
            raw = JSON.parse(s);
          } catch (e) {
            raw = [raw];
          }
        } else raw = [raw];
      }
      if (!Array.isArray(raw)) raw = [raw];
      return raw.map(cleanImageOne).filter(Boolean);
    }
    function imageUrl(im) {
      const c = cleanImageOne(im);
      return c?.src || "";
    }
    async function uploadCloudinary(file) {
      if (!UPLOAD_URL || !UPLOAD_PRESET) throw new Error("Thi\u1EBFu Cloudinary trong config.js.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", UPLOAD_FOLDER);
      const res = await fetch(UPLOAD_URL, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || "Upload \u1EA3nh l\xEAn Cloudinary th\u1EA5t b\u1EA1i");
      return cleanImageOne({
        public_id: data.public_id,
        secure_url: data.secure_url,
        width: data.width,
        height: data.height,
        source: "cloudinary"
      });
    }
    window.__LHCleanImages = cleanImages2;
    window.__LHUploadCloudinary = uploadCloudinary;
    function optimizeImageUrl(src) {
      if (!src) return "";
      if (src.includes("res.cloudinary.com/") && src.includes("/image/upload/")) {
        if (!src.includes("q_auto") && !src.includes("f_auto")) {
          return src.replace("/image/upload/", "/image/upload/c_limit,w_600,q_auto,f_auto/");
        }
      }
      return src;
    }
    window.imgsHTML = imgsHTML = function(c) {
      return cleanImages2(c?.images || []).map((im) => `<img src="${esc(optimizeImageUrl(im.src))}" alt="" loading="lazy" decoding="async">`).join("");
    };
    function bindEditorUpload() {
      const inp = $2("imgUpload");
      if (!inp || inp.__urlOnlyBound) return;
      inp.__urlOnlyBound = true;
      inp.onchange = async function(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        inp.disabled = true;
        notifyX("\u0110ang upload \u1EA3nh...");
        try {
          editDraft.images = cleanImages2(editDraft.images);
          for (const file of files) {
            const uploaded = await uploadCloudinary(file);
            if (uploaded) editDraft.images.push(uploaded);
          }
          if (typeof renderEditImages === "function") renderEditImages();
          notifyX("\u0110\xE3 upload \u1EA3nh b\u1EB1ng URL");
        } catch (err) {
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          inp.value = "";
        }
      };
    }
    const oldRenderEditImages = typeof renderEditImages === "function" ? renderEditImages : null;
    renderEditImages = window.renderEditImages = function() {
      const box = $2("editImgs");
      if (!box) return oldRenderEditImages ? oldRenderEditImages() : void 0;
      editDraft.images = cleanImages2(editDraft.images);
      box.innerHTML = editDraft.images.length ? editDraft.images.map((im, i) => `<div class="editImg"><button class="rm" data-rm="${i}">\xD7</button><img src="${esc(im.src)}" loading="lazy" decoding="async"></div>`).join("") : '<p style="color:var(--mist)">Ch\u01B0a c\xF3 h\xECnh.</p>';
    };
    const oldOpenEditor = typeof openEditor === "function" ? openEditor : null;
    if (oldOpenEditor && !oldOpenEditor.__urlOnlyPatch) {
      openEditor = window.openEditor = async function() {
        const q = pool && pool[ci] || null;
        if (q?.id && !q.__imagesLoaded) {
          try {
            const code = subject();
            if (code) {
              const rows = await fetchTursoQuestions(code);
              const data = rows.find((r2) => String(r2.id) === String(q.id));
              if (data) Object.assign(q, mapTursoRow(data, code));
            }
          } catch (e) {
          }
        }
        const r = oldOpenEditor.apply(this, arguments);
        setTimeout(bindEditorUpload, 0);
        setTimeout(() => {
          if (editDraft) editDraft.images = cleanImages2(editDraft.images);
          if (typeof renderEditImages === "function") renderEditImages();
        }, 20);
        return r;
      };
      openEditor.__urlOnlyPatch = true;
    }
    if (window.HODSupabase?.submitEditRequest && !window.HODSupabase.submitEditRequest.__urlOnlyPatch) {
      const oldSubmit = window.HODSupabase.submitEditRequest.bind(window.HODSupabase);
      window.HODSupabase.submitEditRequest = async function(newDraft, oldQ) {
        if (newDraft) newDraft.images = cleanImages2(newDraft.images);
        if (oldQ) oldQ.images = cleanImages2(oldQ.images);
        return oldSubmit(newDraft, oldQ);
      };
      window.HODSupabase.submitEditRequest.__urlOnlyPatch = true;
    }
    const CACHE_TTL = 12 * 60 * 60 * 1e3;
    function cacheKey(code) {
      return "learninghub_questions_cache_v1_" + code;
    }
    function readQuestionCache(code) {
      try {
        const raw = localStorage.getItem(cacheKey(code));
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || !obj.savedAt || !Array.isArray(obj.rows)) return null;
        if (Date.now() - obj.savedAt > CACHE_TTL) return null;
        return obj.rows;
      } catch (e) {
        return null;
      }
    }
    function writeQuestionCache(code, rows) {
      try {
        localStorage.setItem(cacheKey(code), JSON.stringify({ savedAt: Date.now(), rows: rows || [] }));
      } catch (e) {
      }
    }
    async function fetchTursoQuestions(code) {
      const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(code) + "&ts=" + Date.now(), { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error || "Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c c\xE2u h\u1ECFi t\u1EEB Turso");
      return Array.isArray(json.data) ? json.data : [];
    }
    function mapTursoRow(r, code) {
      const images = cleanImages2(r.images || []);
      return {
        id: r.id,
        subject_code: r.subject_code || code,
        num: r.num,
        question: r.question,
        options: r.options || {},
        answer: r.answer || "",
        answer_text: r.answer_text || "",
        images,
        is_active: r.is_active !== false && r.is_active !== 0 && r.is_active !== "0",
        updated_at: r.updated_at,
        has_image: !!(r.has_image || images.length),
        error_risk: r.error_risk || "low",
        error_risk_reason: r.error_risk_reason || "",
        __imagesChecked: true,
        __imagesLoaded: true
      };
    }
    function applyQuestionRows(rows, code) {
      RAW = (rows || []).map((r) => mapTursoRow(r, code));
      pool = [...RAW];
      const saved = +localStorage.getItem("learninghub_progress_" + code) || 0;
      ci = Math.max(0, Math.min(saved, Math.max(0, pool.length - 1)));
      flipped = false;
      try {
        renderCard();
        renderQuiz();
        renderStudy();
      } catch (e) {
      }
    }
    let activeLoadPromises = {};
    async function loadSubjectLight(force = false) {
      const code = subject();
      if (!user() || !code) return false;
      if (!force) {
        const cached = readQuestionCache(code);
        if (cached && cached.length && cached.every((r) => Object.prototype.hasOwnProperty.call(r, "images"))) {
          applyQuestionRows(cached, code);
          return true;
        }
      }
      if (activeLoadPromises[code]) return activeLoadPromises[code];
      activeLoadPromises[code] = (async () => {
        try {
          const data = await fetchTursoQuestions(code);
          writeQuestionCache(code, data);
          applyQuestionRows(data, code);
          return true;
        } catch (e) {
          console.warn("[loadSubjectLight]", e);
          return false;
        } finally {
          delete activeLoadPromises[code];
        }
      })();
      return activeLoadPromises[code];
    }
    async function fetchImagesForCurrent(force = false) {
      const q = pool && pool[ci] || null;
      const code = subject();
      if (!q?.id || !code) return false;
      if (!force && q.__imagesLoaded) return true;
      if (q.__imagesLoading) return true;
      if (!force && q.images && q.images.length) {
        q.__imagesLoaded = true;
        return true;
      }
      if (!force && !q.has_image) {
        q.images = [];
        q.__imagesLoaded = true;
        return true;
      }
      q.__imagesLoading = true;
      try {
        const rows = await fetchTursoQuestions(code);
        const data = rows.find((r) => String(r.id) === String(q.id));
        if (data) {
          const mapped = mapTursoRow(data, code);
          Object.assign(q, mapped);
          try {
            writeQuestionCache(code, pool.map((x) => ({
              id: x.id,
              subject_code: x.subject_code,
              num: x.num,
              question: x.question,
              options: x.options,
              answer: x.answer,
              answer_text: x.answer_text,
              images: x.images,
              is_active: x.is_active,
              updated_at: x.updated_at,
              has_image: x.has_image,
              error_risk: x.error_risk,
              error_risk_reason: x.error_risk_reason
            })));
          } catch (e) {
          }
          try {
            renderCard();
            renderQuiz();
            renderStudy();
          } catch (e) {
          }
        }
        q.__imagesLoaded = true;
        return !!data;
      } catch (e) {
        q.__imagesLoaded = true;
        return false;
      } finally {
        q.__imagesLoading = false;
      }
    }
    async function reloadCurrentQuestion(silent = false) {
      const q = pool && pool[ci] || null;
      const code = subject();
      if (!q?.id || !code) return false;
      try {
        const rows = await fetchTursoQuestions(code);
        const data = rows.find((r) => String(r.id) === String(q.id));
        if (!data) {
          if (!silent) alert("Kh\xF4ng reload \u0111\u01B0\u1EE3c c\xE2u hi\u1EC7n t\u1EA1i.");
          return false;
        }
        const clean = mapTursoRow(data, code);
        const upd = (row) => String(row.id) === String(clean.id) ? Object.assign(row, clean) : row;
        RAW = (RAW || []).map(upd);
        pool = (pool || []).map(upd);
        try {
          renderCard();
          renderQuiz();
          renderStudy();
        } catch (e) {
        }
        if (!silent) notifyX("\u0110\xE3 reload c\xE2u hi\u1EC7n t\u1EA1i");
        return true;
      } catch (e) {
        if (!silent) alert("Kh\xF4ng reload \u0111\u01B0\u1EE3c c\xE2u hi\u1EC7n t\u1EA1i.");
        return false;
      }
    }
    window.loadCurrentSubjectOnly = loadSubjectLight;
    window.reloadCurrentQuestion = reloadCurrentQuestion;
    if (window.HODSupabase) window.HODSupabase.loadQuestionsFromSupabase = loadSubjectLight;
    let lazyLoadTimeout = null;
    const oldRenderCard = typeof renderCard === "function" ? renderCard : null;
    if (oldRenderCard && !oldRenderCard.__urlOnlyLazy) {
      renderCard = window.renderCard = function() {
        oldRenderCard.apply(this, arguments);
        if (lazyLoadTimeout) clearTimeout(lazyLoadTimeout);
        lazyLoadTimeout = setTimeout(() => {
          fetchImagesForCurrent(false);
        }, 300);
      };
      renderCard.__urlOnlyLazy = true;
    }
    function ensureReloadButton() {
      return;
    }
    function autoReloadCurrent() {
      const now = Date.now();
      if (now - lastAutoReload < 45e3) return;
      lastAutoReload = now;
      reloadCurrentQuestion(true);
    }
  })();
  (function() {
    function all(sel) {
      return Array.from(document.querySelectorAll(sel));
    }
    function keepFirstById(id) {
      const arr = all("#" + id);
      arr.slice(1).forEach((x) => x.remove());
      return arr[0] || null;
    }
    function removeAll(id) {
      all("#" + id).forEach((x) => x.remove());
    }
    function cleanButtons() {
      const avatar = keepFirstById("hodTopAvatar");
      if (avatar) {
        avatar.style.display = avatar.style.display === "none" ? "" : avatar.style.display;
        avatar.classList.remove("ghost", "duplicate");
      }
      keepFirstById("hodReportBox");
      keepFirstById("hodReportModal");
      const chip = keepFirstById("subjectTopChip");
      const actions = document.querySelector(".globalTop .actions") || document.querySelector("#fc .actions") || document.querySelector(".actions");
      const settings = document.getElementById("openSettings");
      if (chip && actions) {
        chip.textContent = "\u0110\u1ED5i m\xF4n";
        chip.classList.remove("hidden", "ghost", "duplicate");
        chip.style.display = "inline-flex";
        if (settings && settings.parentNode === actions && settings.previousElementSibling !== chip) {
          actions.insertBefore(chip, settings);
        } else if (!actions.contains(chip)) {
          actions.prepend(chip);
        }
      }
      removeAll("adminOpenBtn");
      keepFirstById("authStatusBtn");
      keepFirstById("landingParticles");
      keepFirstById("mobileCardNav");
      keepFirstById("subjectGateTabsBar");
    }
    function cleanModals() {
      const reportModals = all(".hodReportModal");
      reportModals.slice(1).forEach((x) => x.remove());
      document.querySelectorAll(".modal .box, .overlay .box").forEach((box) => {
        const xs = Array.from(box.querySelectorAll(":scope > .modalX"));
        xs.slice(1).forEach((x) => x.remove());
      });
    }
    function cleanAddQuestionGhosts() {
      const buttons = all(".addQuestionFloat, .lhAddQuestionFloat, #addQuestionFloatBtn, #lhAddQuestionBtn");
      const visible = buttons.filter((b) => !b.classList.contains("hidden") && b.style.display !== "none");
      visible.slice(1).forEach((b) => b.remove());
    }
    function runCleaner() {
      cleanButtons();
      cleanModals();
      cleanAddQuestionGhosts();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", runCleaner);
    else runCleaner();
    setTimeout(runCleaner, 100);
    setTimeout(runCleaner, 500);
    setTimeout(runCleaner, 1500);
    setInterval(runCleaner, 3e3);
  })();
  (function() {
    function kill() {
      document.querySelectorAll("button").forEach(function(b) {
        const txt = (b.textContent || "").trim().toLowerCase();
        const title = (b.getAttribute("title") || "").toLowerCase();
        if (b.id === "reloadCurrentQuestionBtn" || txt === "\u21BB c\xE2u" || title.includes("reload c\xE2u") || title.includes("t\u1EA3i c\xE2u")) b.remove();
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kill);
    else kill();
    setTimeout(kill, 50);
    setTimeout(kill, 200);
    setTimeout(kill, 800);
    setInterval(kill, 500);
  })();
  (function() {
    function isPrivileged(p) {
      const role = String(p?.role || "").toLowerCase();
      return role === "admin" || role === "editor";
    }
    async function approvePrivilegedProfile() {
      try {
        const api = window.HODSupabase;
        const p = api?.getProfile?.();
        const u = api?.getUser?.();
        const c = api?.__client || null;
        if (!p || !u || !isPrivileged(p)) return false;
        if (p.approved === true && p.blocked === false) {
          document.getElementById("hodPendingApproval")?.classList.add("hidden");
          document.getElementById("hodLoginGate")?.classList.add("hidden");
          document.body?.classList.remove("hod-locked");
          return true;
        }
        p.approved = true;
        p.blocked = false;
        p.is_blocked = false;
        if (p.status === "blocked") p.status = "active";
        if (c) {
          await c.from("profiles").update({ approved: true, blocked: false }).eq("id", u.id).in("role", ["admin", "editor"]);
        }
        document.getElementById("hodPendingApproval")?.classList.add("hidden");
        document.getElementById("hodLoginGate")?.classList.add("hidden");
        document.body?.classList.remove("hod-locked");
        try {
          if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly();
          else if (api?.loadQuestionsFromSupabase) await api.loadQuestionsFromSupabase();
        } catch (e) {
        }
        return true;
      } catch (e) {
        console.warn("[skip approval admin/editor]", e);
        return false;
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", approvePrivilegedProfile);
    else approvePrivilegedProfile();
    setTimeout(approvePrivilegedProfile, 300);
    setTimeout(approvePrivilegedProfile, 1200);
    setTimeout(approvePrivilegedProfile, 3e3);
  })();
  (function() {
    function currentTabId() {
      return document.querySelector(".pane.active")?.id || document.querySelector(".tab.active")?.dataset?.tab || "fc";
    }
    function restoreTab(id) {
      if (!id) return;
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
      document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("active", p.id === id));
    }
    function doResetKeepTab() {
      const tab = currentTabId();
      try {
        if (Array.isArray(RAW)) pool = [...RAW];
        ci = 0;
        flipped = false;
        flipDir = "horizontal";
        randomActive = false;
        localStorage.setItem("hod102_random_active", "0");
        const subject = localStorage.getItem("learninghub_subject_code_merged_v1") || "";
        if (subject) localStorage.setItem("learninghub_progress_" + subject, "0");
        localStorage.setItem("hod102_ci", "0");
        if (typeof renderCard === "function") renderCard();
        if (typeof renderQuiz === "function") renderQuiz();
        if (typeof renderStudy === "function") renderStudy();
        if (typeof updateSettingsUI === "function") updateSettingsUI();
      } catch (e) {
        console.warn("[reset keep tab]", e);
      }
      restoreTab(tab);
      if (typeof notify === "function") notify("\u0110\xE3 reset");
    }
    window.resetKeepCurrentTab = doResetKeepTab;
    if (typeof reset === "function") reset = window.reset = function() {
      doResetKeepTab();
    };
    if (typeof triggerReset === "function") triggerReset = window.triggerReset = function() {
      doResetKeepTab();
    };
    function bindReset() {
      ["reset", "stReset"].forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn || btn.__keepTabBound) return;
        btn.__keepTabBound = true;
        btn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          doResetKeepTab();
          return false;
        };
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindReset);
    else bindReset();
    setTimeout(bindReset, 300);
    setTimeout(bindReset, 1e3);
    setInterval(bindReset, 2e3);
  })();
  (function() {
    function srcOf(im) {
      return typeof im === "string" ? im : im?.src || im?.url || im?.secure_url || im?.publicUrl || im?.public_url || "";
    }
    function preloadQuestionImages(q) {
      try {
        (q?.images || []).map(srcOf).filter(Boolean).forEach((src) => {
          if (window.__LH_PRELOADED_IMAGES?.has(src)) return;
          window.__LH_PRELOADED_IMAGES = window.__LH_PRELOADED_IMAGES || /* @__PURE__ */ new Set();
          window.__LH_PRELOADED_IMAGES.add(src);
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = src;
        });
      } catch (e) {
      }
    }
    function preloadAround() {
      try {
        if (!Array.isArray(pool) || !pool.length) return;
        preloadQuestionImages(pool[ci]);
        preloadQuestionImages(pool[(ci + 1) % pool.length]);
        preloadQuestionImages(pool[(ci - 1 + pool.length) % pool.length]);
      } catch (e) {
      }
    }
    const oldNext = typeof next === "function" ? next : null;
    const oldPrev = typeof prev === "function" ? prev : null;
    if (oldNext && !oldNext.__noFlicker) {
      next = function() {
        oldNext.apply(this, arguments);
        setTimeout(preloadAround, 0);
      };
      next.__noFlicker = true;
      window.next = next;
    }
    if (oldPrev && !oldPrev.__noFlicker) {
      prev = function() {
        oldPrev.apply(this, arguments);
        setTimeout(preloadAround, 0);
      };
      prev.__noFlicker = true;
      window.prev = prev;
    }
    document.addEventListener("DOMContentLoaded", () => setTimeout(preloadAround, 800));
  })();
  (function() {
    const TAB_STORE = "learninghub_last_tab_v1";
    function restoreLastTab() {
      let tab = "";
      try {
        tab = localStorage.getItem(TAB_STORE) || "";
      } catch (e) {
      }
      if (!/^(fc|quiz|study)$/.test(tab)) return;
      const btn = document.querySelector(`.tab[data-tab="${tab}"],[data-tab="${tab}"]`);
      if (btn && !btn.classList.contains("active")) btn.click();
    }
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab]");
      if (t?.dataset?.tab) {
        const tabId = t.dataset.tab;
        try {
          localStorage.setItem(TAB_STORE, tabId);
        } catch (_e) {
        }
        switchTab(tabId, t);
      }
    }, true);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => {
      setTimeout(restoreLastTab, 250);
      setTimeout(restoreLastTab, 1200);
      setTimeout(restoreLastTab, 2500);
    });
    else {
      setTimeout(restoreLastTab, 250);
      setTimeout(restoreLastTab, 1200);
      setTimeout(restoreLastTab, 2500);
    }
  })();
  window.clearLearningHubQuestionCache = function() {
    try {
      const code = localStorage.getItem("learninghub_subject_code_merged_v1") || "";
      if (code) localStorage.removeItem("learninghub_questions_cache_v1_" + code);
      if (typeof window.clearLearningHubSupabaseCache === "function") window.clearLearningHubSupabaseCache("questions");
    } catch (e) {
    }
  };
  (function() {
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    let sending = false;
    const $2 = (id) => document.getElementById(id);
    const supa = () => window.HODSupabase?.__client || null;
    const me = () => window.HODSupabase?.getUser?.() || null;
    const prof = () => window.HODSupabase?.getProfile?.() || null;
    const currentSubject = () => localStorage.getItem(SUBJECT_STORE2) || "";
    const notifyUser = (t) => typeof notify === "function" ? notify(t) : alert(t);
    const isEditorRole = () => ["admin", "editor"].includes(String(prof()?.role || "").toLowerCase());
    function imgSrc(im) {
      if (!im) return "";
      if (typeof im === "string") return im.trim();
      return String(im.secure_url || im.src || im.url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.path || "").trim();
    }
    function cleanImages2(list) {
      let raw = list || [];
      if (typeof raw === "string") {
        const t = raw.trim();
        if (!t) return [];
        if (t.startsWith("[") && t.endsWith("]") || t.startsWith("{") && t.endsWith("}")) {
          try {
            raw = JSON.parse(t);
          } catch (e) {
            raw = [t];
          }
        } else raw = [t];
      }
      if (!Array.isArray(raw)) raw = [raw];
      return raw.map((im, i) => {
        const src = imgSrc(im);
        if (!src) return null;
        if (/^data:image\//i.test(src)) return null;
        if (src.length > 500 && /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(src)) return null;
        const o = typeof im === "object" && im ? { ...im } : {};
        o.id = o.id || o.public_id || "img_" + i + "_" + Date.now();
        o.src = src;
        o.url = src;
        o.source = o.source || (/cloudinary/i.test(src) ? "cloudinary" : "url");
        delete o.data;
        delete o.base64;
        delete o.dataUrl;
        delete o.data_url;
        return o;
      }).filter(Boolean);
    }
    function buildDraft() {
      const d = typeof editDraft !== "undefined" ? editDraft : window.editDraft;
      if (!d) return null;
      d.question = ($2("editQuestion")?.value || "").trim();
      d.answer = ($2("editAnswer")?.value || "").trim().toUpperCase();
      const ops = {};
      document.querySelectorAll("[data-opt]").forEach((t) => {
        const v = (t.value || "").trim();
        if (v) ops[t.dataset.opt] = v;
      });
      d.options = ops;
      d.answer_text = typeof answerText === "function" ? answerText(d) : "";
      d.subject_code = d.subject_code || currentSubject();
      d.images = cleanImages2(d.images || []);
      return d;
    }
    async function fetchQuestion(oldQ, d) {
      let q = oldQ || {};
      const code = q.subject_code || d?.subject_code || currentSubject();
      if (code && q.id) {
        try {
          const res = await fetch("/api/questions?subject_code=" + encodeURIComponent(code) + "&ts=" + Date.now(), { cache: "no-store" });
          const json = await res.json().catch(() => ({}));
          const rows = Array.isArray(json.data) ? json.data : [];
          const found = rows.find((r) => String(r.id) === String(q.id));
          if (found) {
            const images = cleanImages2(found.images || []);
            q = { ...q, ...found, images, has_image: !!(found.has_image || images.length) };
          }
        } catch (e) {
        }
      }
      return q;
    }
    function row(q) {
      const images = cleanImages2(q?.images || []);
      return {
        question: q?.question || "",
        options: q?.options || {},
        answer: q?.answer || "",
        answer_text: q?.answer_text || (typeof finalAnswerText === "function" ? finalAnswerText(q) : ""),
        images,
        has_image: !!(q?.has_image || images.length)
      };
    }
    async function saveClean(e) {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
        e.stopImmediatePropagation?.();
      }
      if (sending) return false;
      const c = supa(), u = me();
      if (!c || !u) {
        alert("B\u1EA1n c\u1EA7n \u0111\u0103ng nh\u1EADp tr\u01B0\u1EDBc.");
        return false;
      }
      const d = buildDraft();
      if (!d) return false;
      if (!d.question) return alert("Ch\u01B0a c\xF3 n\u1ED9i dung c\xE2u h\u1ECFi."), false;
      if (!d.answer) return alert("Ch\u01B0a nh\u1EADp \u0111\xE1p \xE1n \u0111\xFAng."), false;
      if (!d.options || !Object.keys(d.options).length) return alert("Ch\u01B0a c\xF3 l\u1EF1a ch\u1ECDn \u0111\xE1p \xE1n."), false;
      const oldQ = await fetchQuestion((RAW || []).find((x) => x.num === d.num) || (pool || [])[ci] || d, d);
      if (!oldQ?.id) return alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i."), false;
      const oldRow = row(oldQ), newRow = row(d);
      const btn = $2("saveEdit"), oldText = btn?.textContent || "";
      sending = true;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang l\u01B0u...";
      }
      try {
        if (isEditorRole()) {
          const imgs = newRow.images || [];
          const payload2 = {
            id: oldQ.id,
            subject_code: oldQ.subject_code || d.subject_code || currentSubject(),
            num: oldQ.num || d.num,
            question: newRow.question,
            options: newRow.options,
            answer: newRow.answer,
            answer_text: newRow.answer_text,
            images: imgs,
            has_image: imgs.length > 0,
            updated_at: (/* @__PURE__ */ new Date()).toISOString(),
            error_risk: oldQ.error_risk || "low",
            error_risk_reason: oldQ.error_risk_reason || null
          };
          const res = await fetch("/api/admin-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              user_id: u.id,
              action: "save_question_direct",
              payload: { question_id: oldQ.id, new_data: payload2, old_data: oldRow }
            })
          });
          const out = await res.json().catch(() => ({}));
          if (!res.ok || out.error) return alert("L\u01B0u tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + (out.error || res.status)), false;
          if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
          $2("editModal")?.classList.add("hidden");
          notifyUser("\u0110\xE3 l\u01B0u tr\u1EF1c ti\u1EBFp");
          if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly(true);
          return false;
        }
        const payload = {
          question_id: oldQ.id,
          question_num: oldQ.num || d.num || null,
          subject_code: oldQ.subject_code || d.subject_code || currentSubject(),
          user_id: u.id,
          user_email: u.email || prof()?.email || "",
          old_data: oldRow,
          new_data: newRow,
          reason: ""
        };
        const reqRes = await fetch("/api/edit-requests", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(payload) });
        const reqOut = await reqRes.json().catch(() => ({}));
        if (!reqRes.ok || reqOut.error) return alert("G\u1EEDi y\xEAu c\u1EA7u s\u1EEDa th\u1EA5t b\u1EA1i: " + (reqOut.error || reqRes.status)), false;
        $2("editModal")?.classList.add("hidden");
        notifyUser("\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa cho admin");
        return false;
      } finally {
        sending = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = oldText || (isEditorRole() ? "L\u01B0u tr\u1EF1c ti\u1EBFp" : "G\u1EEDi b\xE1o c\xE1o");
        }
      }
    }
    saveEditor = window.saveEditor = saveClean;
    function bind() {
      const b = $2("saveEdit");
      if (!b) return;
      b.onclick = saveClean;
      if (!b.__cleanRequestSaveBound) {
        b.__cleanRequestSaveBound = true;
        b.addEventListener("click", saveClean, true);
      }
    }
    const oldOpen = typeof openEditor === "function" ? openEditor : null;
    openEditor = window.openEditor = function() {
      if (oldOpen) oldOpen.apply(this, arguments);
      setTimeout(bind, 0);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
    setTimeout(bind, 300);
    setInterval(bind, 1e3);
  })();
  (function() {
    const CFG = window.APP_CONFIG = Object.assign({
      CLOUDINARY_CLOUD_NAME: "ddc4uvm7m",
      CLOUDINARY_UPLOAD_PRESET: "learninghub_unsigned",
      CLOUDINARY_UPLOAD_FOLDER: "learninghub/questions",
      CLOUDINARY_UPLOAD_URL: "https://api.cloudinary.com/v1_1/ddc4uvm7m/image/upload"
    }, window.APP_CONFIG || {});
    function $2(id) {
      return document.getElementById(id);
    }
    function msg(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    function ensureStatus(inputId, statusId) {
      const inp = $2(inputId);
      if (!inp) return null;
      let st = $2(statusId);
      if (!st) {
        st = document.createElement("div");
        st.id = statusId;
        st.style.cssText = "display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;";
        inp.insertAdjacentElement("afterend", st);
      }
      return st;
    }
    async function directUpload(file) {
      const url = CFG.CLOUDINARY_UPLOAD_URL || (CFG.CLOUDINARY_CLOUD_NAME ? "https://api.cloudinary.com/v1_1/" + CFG.CLOUDINARY_CLOUD_NAME + "/image/upload" : "");
      const preset = CFG.CLOUDINARY_UPLOAD_PRESET;
      if (!url || !preset) throw new Error("Thi\u1EBFu Cloudinary config / upload preset.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      if (CFG.CLOUDINARY_UPLOAD_FOLDER) fd.append("folder", CFG.CLOUDINARY_UPLOAD_FOLDER);
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Cloudinary l\u1ED7i HTTP " + res.status);
      const img = { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: "cloudinary" };
      return img;
    }
    window.__LHUploadCloudinary = window.__LHUploadCloudinary || directUpload;
    window.__LHTestCloudinaryConfig = function() {
      console.log("[Cloudinary config]", {
        url: CFG.CLOUDINARY_UPLOAD_URL,
        cloud: CFG.CLOUDINARY_CLOUD_NAME,
        preset: CFG.CLOUDINARY_UPLOAD_PRESET,
        folder: CFG.CLOUDINARY_UPLOAD_FOLDER
      });
      return CFG;
    };
    function bindEditUploadFinal() {
      const inp = $2("imgUpload");
      if (!inp || inp.__copilotFinalUpload) return;
      inp.__copilotFinalUpload = true;
      inp.onchange = async function(e) {
        const files = Array.from(e.target.files || []);
        const st = ensureStatus("imgUpload", "editUploadStatus");
        if (!files.length) return;
        inp.disabled = true;
        if (st) {
          st.style.display = "block";
          st.textContent = "\u0110ang upload " + files.length + " \u1EA3nh l\xEAn Cloudinary...";
        }
        msg("\u0110ang upload \u1EA3nh l\xEAn Cloudinary...");
        try {
          editDraft.images = window.__LHCleanImages ? window.__LHCleanImages(editDraft.images || []) : editDraft.images || [];
          for (const file of files) {
            const uploaded = await (window.__LHUploadCloudinary || directUpload)(file);
            editDraft.images.push(uploaded);
          }
          if (typeof renderEditImages === "function") renderEditImages();
          if (st) {
            st.textContent = "\u0110\xE3 upload xong. URL n\u1EB1m d\u01B0\u1EDBi \u1EA3nh.";
            setTimeout(() => {
              st.style.display = "none";
            }, 2200);
          }
          msg("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
        } catch (err) {
          if (st) {
            st.textContent = "Upload l\u1ED7i: " + (err.message || err);
          }
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          inp.value = "";
        }
      };
    }
    const oldOpen = typeof window.openEditor === "function" ? window.openEditor : null;
    if (oldOpen && !oldOpen.__copilotFinalUploadOpen) {
      window.openEditor = openEditor = function() {
        const r = oldOpen.apply(this, arguments);
        setTimeout(bindEditUploadFinal, 0);
        setTimeout(bindEditUploadFinal, 100);
        return r;
      };
      window.openEditor.__copilotFinalUploadOpen = true;
    }
    function boot() {
      bindEditUploadFinal();
      window.__LHTestCloudinaryConfig();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 500);
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function msg(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    function isDataUrl(s) {
      return /^data:image\//i.test(String(s || ""));
    }
    function dataUrlToFile(dataUrl, name) {
      const arr = String(dataUrl).split(",");
      const mime = (arr[0].match(/:(.*?);/) || [])[1] || "image/png";
      const bin = atob(arr[1] || "");
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new File([u8], name || "upload_" + Date.now() + ".png", { type: mime });
    }
    async function uploadOne(file) {
      if (window.__LHUploadCloudinary) return await window.__LHUploadCloudinary(file);
      const cfg = window.APP_CONFIG || {};
      const url = cfg.CLOUDINARY_UPLOAD_URL || (cfg.CLOUDINARY_CLOUD_NAME ? "https://api.cloudinary.com/v1_1/" + cfg.CLOUDINARY_CLOUD_NAME + "/image/upload" : "");
      if (!url || !cfg.CLOUDINARY_UPLOAD_PRESET) throw new Error("Thi\u1EBFu Cloudinary config.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", cfg.CLOUDINARY_UPLOAD_PRESET);
      if (cfg.CLOUDINARY_UPLOAD_FOLDER) fd.append("folder", cfg.CLOUDINARY_UPLOAD_FOLDER);
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Cloudinary l\u1ED7i HTTP " + res.status);
      return { id: data.public_id, public_id: data.public_id, src: data.secure_url, url: data.secure_url, width: data.width, height: data.height, source: "cloudinary" };
    }
    function cleanList(arr) {
      return (arr || []).filter(Boolean).map((im) => {
        if (typeof im === "string") return { src: im, url: im, source: isDataUrl(im) ? "data" : "url" };
        const src = im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "";
        return Object.assign({}, im, { src, url: src || im.url });
      }).filter((im) => im.src || im.url);
    }
    async function uploadPendingEditImages() {
      if (!window.editDraft && typeof editDraft === "undefined") return;
      const draft = window.editDraft || editDraft;
      if (!draft) return;
      const inp = $2("imgUpload");
      const files = Array.from(inp?.files || []);
      let list = cleanList(draft.images || []);
      let need = list.some((im) => isDataUrl(im.src || im.url)) || files.length > 0;
      if (!need) {
        draft.images = window.__LHCleanImages ? window.__LHCleanImages(list) : list;
        return;
      }
      const st = $2("editUploadStatus") || (() => {
        const e = document.createElement("div");
        e.id = "editUploadStatus";
        e.style.cssText = "display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;";
        inp?.insertAdjacentElement("afterend", e);
        return e;
      })();
      st.style.display = "block";
      st.textContent = "\u0110ang upload \u1EA3nh l\xEAn Cloudinary tr\u01B0\u1EDBc khi l\u01B0u...";
      msg("\u0110ang upload \u1EA3nh l\xEAn Cloudinary tr\u01B0\u1EDBc khi l\u01B0u...");
      const out = [];
      for (const im of list) {
        const src = im.src || im.url;
        if (isDataUrl(src)) out.push(await uploadOne(dataUrlToFile(src, im.name || "image.png")));
        else out.push(im);
      }
      for (const f of files) out.push(await uploadOne(f));
      draft.images = window.__LHCleanImages ? window.__LHCleanImages(out) : out;
      if (inp) inp.value = "";
      if (typeof renderEditImages === "function") renderEditImages();
      st.textContent = "\u0110\xE3 upload \u1EA3nh xong, \u0111ang l\u01B0u...";
    }
    function bindUploadInput() {
      const inp = $2("imgUpload");
      if (!inp || inp.__copilotSaveUploadBound) return;
      inp.__copilotSaveUploadBound = true;
      inp.onchange = async function(e) {
        const draft = window.editDraft || (typeof editDraft !== "undefined" ? editDraft : null);
        if (!draft) return;
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        inp.disabled = true;
        let st = $2("editUploadStatus");
        if (!st) {
          st = document.createElement("div");
          st.id = "editUploadStatus";
          st.style.cssText = "display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;";
          inp.insertAdjacentElement("afterend", st);
        }
        st.style.display = "block";
        st.textContent = "\u0110ang upload " + files.length + " \u1EA3nh l\xEAn Cloudinary...";
        try {
          draft.images = cleanList(draft.images || []);
          for (const f of files) draft.images.push(await uploadOne(f));
          draft.images = window.__LHCleanImages ? window.__LHCleanImages(draft.images) : draft.images;
          if (typeof renderEditImages === "function") renderEditImages();
          st.textContent = "\u0110\xE3 upload xong. URL n\u1EB1m d\u01B0\u1EDBi \u1EA3nh.";
          msg("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
        } catch (err) {
          st.textContent = "Upload l\u1ED7i: " + (err.message || err);
          alert(err.message || err);
        } finally {
          inp.disabled = false;
          inp.value = "";
        }
      };
    }
    const oldOpen = window.openEditor || (typeof openEditor === "function" ? openEditor : null);
    if (oldOpen && !oldOpen.__copilotEditSaveUploadOpen) {
      window.openEditor = openEditor = function() {
        const r = oldOpen.apply(this, arguments);
        setTimeout(bindUploadInput, 0);
        setTimeout(bindUploadInput, 150);
        setTimeout(rebindSaveButton, 180);
        return r;
      };
      window.openEditor.__copilotEditSaveUploadOpen = true;
    }
    const oldSave = window.saveEditor || (typeof saveEditor === "function" ? saveEditor : null);
    if (oldSave && !oldSave.__copilotUploadBeforeSave) {
      window.saveEditor = saveEditor = async function() {
        const btn = $2("saveEdit");
        const oldText = btn ? btn.textContent : "";
        try {
          if (btn) {
            btn.disabled = true;
            btn.textContent = "\u0110ang upload/l\u01B0u...";
          }
          await uploadPendingEditImages();
          return await oldSave.apply(this, arguments);
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = oldText || "L\u01B0u tr\u1EF1c ti\u1EBFp";
          }
        }
      };
      window.saveEditor.__copilotUploadBeforeSave = true;
    }
    function rebindSaveButton() {
      const btn = $2("saveEdit");
      if (!btn) return;
      btn.onclick = function(e) {
        e?.preventDefault?.();
        return window.saveEditor ? window.saveEditor() : typeof saveEditor === "function" ? saveEditor() : void 0;
      };
    }
    function boot() {
      bindUploadInput();
      rebindSaveButton();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 500);
    setTimeout(boot, 1500);
  })();
  (function() {
    const STORE2 = "learninghub_subject_code_merged_v1";
    let pending = null;
    window.__LHGetPendingImageUpload = () => pending;
    function $2(id) {
      return document.getElementById(id);
    }
    function msg(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    function c() {
      return window.HODSupabase?.__client || null;
    }
    function u() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function p() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function can() {
      const x = p(), r = String(x?.role || "").toLowerCase();
      return !!u() && (r === "admin" || r === "editor") && !(x?.blocked || x?.is_blocked || x?.status === "blocked");
    }
    function sc() {
      return localStorage.getItem(STORE2) || "";
    }
    function draft() {
      try {
        return editDraft || null;
      } catch (e) {
        return null;
      }
    }
    function dataUrl(s) {
      return /^data:image\//i.test(String(s || ""));
    }
    function escx(s) {
      return String(s ?? "").replace(/[&<>"']/g, (a) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[a]);
    }
    function toFile(data, name) {
      const a = String(data).split(","), m = (a[0].match(/:(.*?);/) || [])[1] || "image/png", b = atob(a[1] || ""), u8 = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
      return new File([u8], name || "image.png", { type: m });
    }
    async function up(file) {
      if (window.__LHUploadCloudinary) return await window.__LHUploadCloudinary(file);
      const cfg = window.APP_CONFIG || {}, url = cfg.CLOUDINARY_UPLOAD_URL || (cfg.CLOUDINARY_CLOUD_NAME ? "https://api.cloudinary.com/v1_1/" + cfg.CLOUDINARY_CLOUD_NAME + "/image/upload" : "");
      if (!url || !cfg.CLOUDINARY_UPLOAD_PRESET) throw new Error("Thi\u1EBFu Cloudinary config/upload preset");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", cfg.CLOUDINARY_UPLOAD_PRESET);
      if (cfg.CLOUDINARY_UPLOAD_FOLDER) fd.append("folder", cfg.CLOUDINARY_UPLOAD_FOLDER);
      const res = await fetch(url, { method: "POST", body: fd }), j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message || "Cloudinary l\u1ED7i " + res.status);
      return { id: j.public_id, public_id: j.public_id, src: j.secure_url, url: j.secure_url, width: j.width, height: j.height, source: "cloudinary" };
    }
    function imgs(a) {
      return (a || []).map((im) => {
        if (!im) return null;
        if (typeof im === "string") return { src: im, url: im };
        const src = im.secure_url || im.src || im.url || im.publicUrl || im.public_url || "";
        return src ? Object.assign({}, im, { src: String(src), url: String(src) }) : null;
      }).filter(Boolean);
    }
    function status(t) {
      let inp = $2("imgUpload"), s = $2("editUploadStatus");
      if (!inp) return null;
      if (!s) {
        s = document.createElement("div");
        s.id = "editUploadStatus";
        s.style.cssText = "display:block;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;word-break:break-word;";
        inp.insertAdjacentElement("afterend", s);
      }
      s.style.display = "block";
      if (t) s.textContent = t;
      return s;
    }
    function renderUrls() {
      const d = draft(), box = $2("editImgs");
      if (!d || !box) return;
      d.images = imgs(d.images).filter((x) => !dataUrl(x.src || x.url));
      box.innerHTML = d.images.length ? d.images.map((im, i) => `<div class="editImg"><button class="rm" data-rm="${i}">\xD7</button><img src="${escx(im.src)}" loading="lazy" decoding="async"><input value="${escx(im.src)}" readonly onclick="this.select()" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`).join("") : '<p style="color:var(--mist)">Ch\u01B0a c\xF3 h\xECnh.</p>';
    }
    async function runUpload(files) {
      const d = draft();
      if (!d) return;
      files = [...files || []];
      if (!files.length) return;
      const btn = $2("saveEdit");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang upload \u1EA3nh...";
      }
      status("\u0110ang upload " + files.length + " \u1EA3nh l\xEAn Cloudinary...");
      msg("\u0110ang upload \u1EA3nh l\xEAn Cloudinary...");
      d.images = imgs(d.images).filter((x) => !dataUrl(x.src || x.url));
      for (const f of files) {
        const x = await up(f);
        d.images.push(x);
      }
      d.images = window.__LHCleanImages ? window.__LHCleanImages(d.images) : imgs(d.images);
      renderUrls();
      status("\u0110\xE3 upload xong. URL n\u1EB1m d\u01B0\u1EDBi \u1EA3nh.");
      msg("\u0110\xE3 upload \u1EA3nh th\xE0nh URL");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "L\u01B0u tr\u1EF1c ti\u1EBFp";
      }
    }
    function bindInput() {
      const inp = $2("imgUpload");
      if (!inp || inp.__ultraUpload) return;
      inp.__ultraUpload = true;
      inp.onchange = null;
      inp.addEventListener("change", (e) => {
        const files = [...e.target.files || []];
        if (!files.length) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        pending = runUpload(files).catch((err) => {
          status("Upload l\u1ED7i: " + (err.message || err));
          alert(err.message || err);
          throw err;
        }).finally(() => {
          inp.value = "";
        });
      }, true);
    }
    function build() {
      const d = draft();
      if (!d) return null;
      d.question = ($2("editQuestion")?.value || "").trim();
      d.answer = ($2("editAnswer")?.value || "").trim().toUpperCase();
      const o = {};
      document.querySelectorAll("[data-opt]").forEach((t) => {
        if ((t.value || "").trim()) o[t.dataset.opt] = t.value.trim();
      });
      d.options = o;
      d.answer_text = typeof answerText === "function" ? answerText(d) : "";
      d.subject_code = sc() || d.subject_code || "";
      d.images = window.__LHCleanImages ? window.__LHCleanImages(imgs(d.images)) : imgs(d.images).filter((x) => /^https?:\/\//i.test(x.src || x.url));
      return d;
    }
    async function uploadDataUrls() {
      const d = draft();
      if (!d) return;
      const list = imgs(d.images);
      if (!list.some((x) => dataUrl(x.src || x.url))) {
        d.images = window.__LHCleanImages ? window.__LHCleanImages(list) : list;
        return;
      }
      status("\u0110ang upload \u1EA3nh tr\u01B0\u1EDBc khi l\u01B0u...");
      const out = [];
      for (const im of list) {
        const s = im.src || im.url;
        out.push(dataUrl(s) ? await up(toFile(s, im.name)) : im);
      }
      d.images = window.__LHCleanImages ? window.__LHCleanImages(out) : out;
      renderUrls();
    }
    window.__LHUploadPendingDataUrls = uploadDataUrls;
    async function qid(d) {
      if (d.id) return d.id;
      const db = c(), code = d.subject_code || sc();
      if (!db || !code || !d.num) return null;
      const { data, error } = await db.from("questions").select("id").eq("subject_code", code).eq("num", d.num).maybeSingle();
      return error || !data ? null : data.id;
    }
    async function saveDirect() {
      if (!can()) return false;
      const usr = u();
      if (!usr || !draft()) {
        alert("Ch\u01B0a s\u1EB5n s\xE0ng d\u1EEF li\u1EC7u");
        return true;
      }
      const btn = $2("saveEdit");
      try {
        if (btn) {
          btn.disabled = true;
          btn.textContent = "\u0110ang upload/l\u01B0u...";
        }
        if (pending) await pending;
        await uploadDataUrls();
        const d = build(), id = await qid(d);
        if (!id) {
          alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
          return true;
        }
        const oldQ = (RAW || []).find((x) => String(x.id) === String(id)) || (pool || [])[ci] || d;
        const imgs2 = d.images || [];
        const payload = { id, subject_code: d.subject_code || oldQ.subject_code || sc(), num: d.num || oldQ.num, question: d.question, options: d.options || {}, answer: d.answer, answer_text: d.answer_text, images: imgs2, has_image: imgs2.length > 0, updated_at: (/* @__PURE__ */ new Date()).toISOString(), error_risk: oldQ.error_risk || "low", error_risk_reason: oldQ.error_risk_reason || null };
        const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: usr.id, action: "save_question_direct", payload: { question_id: id, new_data: payload, old_data: oldQ } }) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.error) {
          alert("L\u01B0u tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + (json.error || res.status));
          return true;
        }
        if (typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
        $2("editModal")?.classList.add("hidden");
        msg("\u0110\xE3 l\u01B0u tr\u1EF1c ti\u1EBFp");
        if (typeof window.loadCurrentSubjectOnly === "function") await window.loadCurrentSubjectOnly(true);
        return true;
      } finally {
        pending = null;
        if (btn) {
          btn.disabled = false;
          btn.textContent = "L\u01B0u tr\u1EF1c ti\u1EBFp";
        }
      }
    }
    function bindSave() {
      const b = $2("saveEdit");
      if (!b || b.__ultraSave) return;
      b.__ultraSave = true;
      b.onclick = null;
      b.addEventListener("click", async (e) => {
        if (!can()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        await saveDirect();
      }, true);
    }
    const old = window.openEditor || (typeof openEditor === "function" ? openEditor : null);
    if (old && !old.__ultraOpen) {
      window.openEditor = openEditor = function() {
        const r = old.apply(this, arguments);
        setTimeout(() => {
          bindInput();
          bindSave();
          renderUrls();
          if (can() && $2("saveEdit")) $2("saveEdit").textContent = "L\u01B0u tr\u1EF1c ti\u1EBFp";
        }, 0);
        setTimeout(() => {
          bindInput();
          bindSave();
          renderUrls();
        }, 250);
        return r;
      };
      window.openEditor.__ultraOpen = true;
    }
    function boot() {
      bindInput();
      bindSave();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 500);
    setTimeout(boot, 1500);
    setInterval(boot, 1e3);
  })();
  (function() {
    if (window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628) return;
    window.__COPILOT_CLEAN_RUNTIME_GUARD_20260628 = true;
    if (!window.fetch) return;
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    const nativeFetch = window.fetch.bind(window);
    const cache = /* @__PURE__ */ new Map();
    const pending = /* @__PURE__ */ new Map();
    function supabaseOrigin() {
      try {
        return new URL(window.APP_CONFIG?.SUPABASE_URL || "").origin;
      } catch (e) {
        return "";
      }
    }
    function methodOf(init2) {
      return String(init2?.method || "GET").toUpperCase();
    }
    function urlOf(input) {
      try {
        const raw = typeof input === "string" ? input : input && input.url ? input.url : "";
        return new URL(raw, location.href);
      } catch (e) {
        return null;
      }
    }
    function isSupabase(url) {
      const origin = supabaseOrigin();
      return !!url && !!origin && url.origin === origin;
    }
    function isRest(url) {
      return isSupabase(url) && url.pathname.includes("/rest/v1/");
    }
    function currentSubject() {
      return (localStorage.getItem(SUBJECT_STORE2) || "").trim();
    }
    function normalizeUrlForSubject(url, method) {
      if (!isRest(url)) return url;
      if (method !== "GET" && method !== "HEAD") return url;
      if (!url.pathname.includes("/rest/v1/questions")) return url;
      const subject = currentSubject();
      if (!subject) return url;
      if (url.searchParams.get("is_active") === "eq.true" && !url.searchParams.has("subject_code")) {
        url.searchParams.set("subject_code", "eq." + subject);
      }
      return url;
    }
    function ttlFor(url, method) {
      if (!isRest(url)) return 0;
      if (method !== "GET" && method !== "HEAD") return 0;
      if (url.pathname.includes("/rest/v1/profiles")) return 10 * 60 * 1e3;
      if (url.pathname.includes("/rest/v1/subjects")) return 2 * 60 * 1e3;
      if (url.pathname.includes("/rest/v1/site_settings")) return 60 * 1e3;
      if (url.pathname.includes("/rest/v1/questions")) {
        const select = url.searchParams.get("select") || "";
        if (select === "id") return 2 * 60 * 1e3;
        if (select === "id,images,updated_at") return 2 * 60 * 1e3;
        if (url.searchParams.get("is_active") === "eq.true") return 2 * 60 * 1e3;
      }
      return 0;
    }
    function cacheKey(method, url) {
      const params = Array.from(url.searchParams.entries()).sort((a, b) => (a[0] + "=" + a[1]).localeCompare(b[0] + "=" + b[1]));
      return method + " " + url.origin + url.pathname + "?" + params.map((x) => x[0] + "=" + x[1]).join("&");
    }
    async function packResponse(res) {
      const body = await res.clone().arrayBuffer();
      return {
        body,
        status: res.status,
        statusText: res.statusText,
        headers: Array.from(res.headers.entries())
      };
    }
    function unpack(pack) {
      return new Response(pack.body.slice(0), {
        status: pack.status,
        statusText: pack.statusText,
        headers: new Headers(pack.headers)
      });
    }
    window.fetch = async function(input, init2) {
      let url = urlOf(input);
      const method = methodOf(init2);
      if (!url) return nativeFetch(input, init2);
      url = normalizeUrlForSubject(url, method);
      let nextInput = input;
      if (typeof input === "string") nextInput = url.toString();
      else if (input && input.url && input.url !== url.toString()) nextInput = new Request(url.toString(), input);
      const ttl = ttlFor(url, method);
      if (!ttl) return nativeFetch(nextInput, init2);
      const key = cacheKey(method, url);
      const hit = cache.get(key);
      if (hit && Date.now() - hit.t < ttl) return unpack(hit.pack);
      if (pending.has(key)) return unpack(await pending.get(key));
      const job = nativeFetch(nextInput, init2).then((res) => packResponse(res)).then((pack) => {
        cache.set(key, { t: Date.now(), pack });
        pending.delete(key);
        return pack;
      }).catch((err) => {
        pending.delete(key);
        throw err;
      });
      pending.set(key, job);
      return unpack(await job);
    };
    window.clearLearningHubSupabaseRuntimeCache = function() {
      cache.clear();
      pending.clear();
    };
    setTimeout(function patchProfileGetter() {
      const api = window.HODSupabase;
      if (!api || !api.getProfile || api.__cleanProfileCached) return;
      const oldGetProfile = api.getProfile.bind(api);
      let last = null, at = 0;
      api.getProfile = function() {
        const now = Date.now();
        const p = oldGetProfile();
        if (p) {
          last = p;
          at = now;
          return p;
        }
        if (last && now - at < 1e4) return last;
        return p;
      };
      api.__cleanProfileCached = true;
    }, 0);
  })();
  (function() {
    if (window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628) return;
    window.__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 = true;
    function $2(id) {
      return document.getElementById(id);
    }
    function db() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function canDirect() {
      const r = String(profile()?.role || "").toLowerCase();
      return !!user() && (r === "admin" || r === "editor");
    }
    function subjectCode() {
      return localStorage.getItem("learninghub_subject_code_merged_v1") || "";
    }
    function currentDraft() {
      try {
        return window.editDraft || editDraft || null;
      } catch (e) {
        return window.editDraft || null;
      }
    }
    function imgUrl(im) {
      if (!im) return "";
      if (typeof im === "string") return im;
      return im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "";
    }
    function cleanImgs(list) {
      return (list || []).map((im) => {
        const src = imgUrl(im);
        if (!src || !/^https?:\/\//i.test(src)) return null;
        return typeof im === "string" ? { src, url: src } : Object.assign({}, im, { src, url: src });
      }).filter(Boolean);
    }
    function collectDraft() {
      const d = currentDraft();
      if (!d) return null;
      const qEl = $2("editQuestion") || document.querySelector("[data-edit-question]");
      const aEl = $2("editAnswer") || document.querySelector("[data-edit-answer]");
      d.question = (qEl?.value || d.question || "").trim();
      d.answer = (aEl?.value || d.answer || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
      const opts = {};
      document.querySelectorAll("[data-opt],[data-edit-opt]").forEach((inp) => {
        const k = String(inp.dataset.opt || inp.dataset.editOpt || "").toUpperCase();
        const v = String(inp.value || "").trim();
        if (k && v) opts[k] = v;
      });
      if (Object.keys(opts).length) d.options = opts;
      d.answer_text = typeof answerText === "function" ? answerText(d) : d.answer_text || "";
      d.subject_code = d.subject_code || subjectCode();
      d.images = cleanImgs(d.images);
      return d;
    }
    async function getQuestionId(d) {
      if (d.id) return d.id;
      const c = db();
      if (!c || !d.num) return null;
      const r = await c.from("questions").select("id").eq("subject_code", d.subject_code || subjectCode()).eq("num", d.num).maybeSingle();
      return r.error || !r.data ? null : r.data.id;
    }
    function updateLocal(d, id) {
      const patch = Object.assign({}, d, { id, images: cleanImgs(d.images), has_image: !!(d.images && d.images.length), __imagesChecked: true, __imagesLoaded: true });
      try {
        if (Array.isArray(RAW)) {
          const i = RAW.findIndex((q) => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
          if (i >= 0) RAW[i] = Object.assign({}, RAW[i], patch);
        }
        if (Array.isArray(pool)) {
          const j = pool.findIndex((q) => String(q.id) === String(id) || Number(q.num) === Number(patch.num));
          if (j >= 0) pool[j] = Object.assign({}, pool[j], patch);
        }
        const active = pool && pool[ci] || null;
        if (active && (String(active.id) === String(id) || Number(active.num) === Number(patch.num))) {
          Object.assign(active, patch);
        }
        if (typeof renderCard === "function") renderCard();
        if (typeof renderQuiz === "function") renderQuiz();
        if (typeof renderStudy === "function") renderStudy();
      } catch (e) {
        console.warn("[edit image local update]", e);
      }
    }
    async function saveDirectNoReload() {
      if (!canDirect()) return false;
      const c = db();
      const d = collectDraft();
      if (!c || !d) return false;
      const id = await getQuestionId(d);
      if (!id) {
        alert("Kh\xF4ng t\xECm th\u1EA5y ID c\xE2u h\u1ECFi tr\xEAn Supabase.");
        return true;
      }
      const payload = {
        question: d.question,
        options: d.options || {},
        answer: d.answer,
        answer_text: d.answer_text,
        images: cleanImgs(d.images),
        has_image: !!(d.images && d.images.length),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const u = window.HODSupabase?.getUser?.();
      const oldQ = (RAW || []).find((x) => String(x.id) === String(id) || Number(x.num) === Number(d.num)) || (pool || []).find((x) => String(x.id) === String(id) || Number(x.num) === Number(d.num)) || d;
      const old_data = {
        question: oldQ.question || "",
        options: oldQ.options || {},
        answer: oldQ.answer || "",
        answer_text: oldQ.answer_text || "",
        images: cleanImgs(oldQ.images || [])
      };
      const res = await fetch("/api/admin-action", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ user_id: u?.id, action: "save_question_direct", payload: { question_id: id, new_data: Object.assign({ id, subject_code: d.subject_code, num: d.num }, payload), old_data } }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) {
        alert("L\u01B0u tr\u1EF1c ti\u1EBFp th\u1EA5t b\u1EA1i: " + (out.error || res.status));
        return true;
      }
      if (typeof window.clearLearningHubQuestionCache === "function") {
        window.clearLearningHubQuestionCache();
      }
      d.images = payload.images;
      $2("editModal")?.classList.add("hidden");
      updateLocal(Object.assign({}, d, payload), id);
      if (typeof notify === "function") notify("\u0110\xE3 l\u01B0u \u1EA3nh v\xE0 c\u1EADp nh\u1EADt c\xE2u hi\u1EC7n t\u1EA1i");
      return true;
    }
    document.addEventListener("click", async function(e) {
      const btn = e.target.closest?.("#saveEdit,[data-edit-preview-save]");
      if (!btn || !btn.closest?.("#editModal")) return;
      if (!canDirect()) return;
      e.preventDefault?.();
      e.stopPropagation?.();
      e.stopImmediatePropagation?.();
      const oldText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "\u0110ang l\u01B0u...";
      try {
        await saveDirectNoReload();
      } finally {
        btn.disabled = false;
        btn.textContent = oldText || "L\u01B0u tr\u1EF1c ti\u1EBFp";
      }
    }, true);
  })();
  (function() {
    if (window.__APP_REALTIME_CACHE_INVALIDATE_20260629) return;
    window.__APP_REALTIME_CACHE_INVALIDATE_20260629 = true;
    let channel = null;
    let tries = 0;
    function getClient() {
      try {
        if (window.HODSupabase && window.HODSupabase.__client) return window.HODSupabase.__client;
        if (window.supabase && window.APP_CONFIG?.SUPABASE_URL && window.APP_CONFIG?.SUPABASE_ANON_KEY) {
          if (!window.__lhCacheRealtimeClient) {
            window.__lhCacheRealtimeClient = window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_ANON_KEY);
          }
          return window.__lhCacheRealtimeClient;
        }
      } catch (e) {
      }
      return null;
    }
    function clear(kind) {
      try {
        if (typeof window.clearLearningHubSupabaseCache === "function") window.clearLearningHubSupabaseCache(kind);
        else if (kind === "questions" && typeof window.clearLearningHubQuestionCache === "function") window.clearLearningHubQuestionCache();
        if (kind === "questions" && typeof window.loadCurrentSubjectOnly === "function") {
          window.loadCurrentSubjectOnly(true);
        }
        console.info("[LearningHub cache] cleared:", kind);
      } catch (e) {
      }
    }
    function stop() {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (e) {
        }
        channel = null;
      }
    }
    function start() {
      return;
      if (document.hidden) return;
      if (channel) return;
      const c = getClient();
      if (!c) {
        if (tries++ < 30) setTimeout(start, 500);
        return;
      }
      try {
        channel = c.channel("learninghub-cache-invalidate-v1").on("postgres_changes", { event: "*", schema: "public", table: "questions" }, function() {
          clear("questions");
        }).on("postgres_changes", { event: "*", schema: "public", table: "subjects" }, function() {
          clear("subjects");
          clear("questions");
        }).subscribe(function(status) {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            channel = null;
            if (!document.hidden) setTimeout(start, 1500);
          }
        });
      } catch (e) {
        channel = null;
        if (tries++ < 30 && !document.hidden) setTimeout(start, 1e3);
      }
    }
    document.addEventListener("visibilitychange", function() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
    document.addEventListener("DOMContentLoaded", function() {
      setTimeout(start, 1200);
    });
    setTimeout(start, 2e3);
  })();
  (function() {
    if (window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629) return;
    window.__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629 = true;
    function blurInsideGate() {
      const gate = document.getElementById("subjectGate");
      const active = document.activeElement;
      if (gate && active && gate.contains(active)) {
        try {
          active.blur();
        } catch (e) {
        }
      }
    }
    function patchGate() {
      const gate = document.getElementById("subjectGate");
      if (!gate || gate.__ariaFocusPatch) return;
      gate.__ariaFocusPatch = true;
      const obs = new MutationObserver(() => {
        if (gate.classList.contains("hidden") || gate.getAttribute("aria-hidden") === "true") blurInsideGate();
      });
      obs.observe(gate, { attributes: true, attributeFilter: ["class", "aria-hidden"] });
    }
    ["click", "pointerdown", "mousedown", "touchstart"].forEach((ev) => {
      document.addEventListener(ev, (e) => {
        if (e.target && e.target.closest && e.target.closest("#subjectEnter,#subjectLogout,#subjectGate .close,#subjectGate [data-close]")) {
          setTimeout(blurInsideGate, 0);
        }
      }, true);
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", patchGate);
    else patchGate();
    setTimeout(patchGate, 500);
  })();
  (function() {
    if (window.__SUBJECT_COUNTS_ONCE_CACHE_20260629) return;
    window.__SUBJECT_COUNTS_ONCE_CACHE_20260629 = true;
    const STORE2 = "learninghub_subject_counts_cache_v3";
    const DIRTY = "learninghub_subject_counts_dirty_v3";
    const pending = /* @__PURE__ */ new Set();
    function client() {
      return window.HODSupabase?.__client || null;
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function activeSubject() {
      return localStorage.getItem("learninghub_subject_code_merged_v1") || "";
    }
    function cssEscape(s) {
      try {
        return CSS.escape(String(s));
      } catch (e) {
        return String(s).replace(/"/g, '\\"');
      }
    }
    function read() {
      try {
        return JSON.parse(localStorage.getItem(STORE2) || "{}") || {};
      } catch (e) {
        return {};
      }
    }
    function write(data) {
      try {
        localStorage.setItem(STORE2, JSON.stringify(data || {}));
      } catch (e) {
      }
    }
    function dirty() {
      return localStorage.getItem(DIRTY) === "1";
    }
    function setDirty(on = true) {
      try {
        on ? localStorage.setItem(DIRTY, "1") : localStorage.removeItem(DIRTY);
      } catch (e) {
      }
    }
    function ensureStore() {
      const x = read();
      x.counts = x.counts || {};
      x.confirmed = x.confirmed || {};
      x.updated_at = x.updated_at || "";
      return x;
    }
    function localCount(code) {
      try {
        const active = activeSubject();
        if (active === code && Array.isArray(RAW) && RAW.length) return RAW.length;
        if (Array.isArray(RAW)) {
          const n = RAW.filter((q) => (q.subject_code || active) === code).length;
          return n > 0 ? n : null;
        }
      } catch (e) {
      }
      return null;
    }
    function setCardCount(code, n) {
      const count = Number(n || 0);
      document.querySelectorAll('.subjectCard[data-code="' + cssEscape(code) + '"]').forEach((card) => {
        const meta = card.querySelector(".subjectMeta span:first-child");
        if (meta) meta.textContent = count + " c\xE2u";
        card.title = (card.title || code).replace(/(?:\d+|—) câu/g, count + " c\xE2u");
      });
    }
    function paint() {
      const store = ensureStore();
      document.querySelectorAll(".subjectCard[data-code]").forEach((card) => {
        const code = card.dataset.code;
        const n = localCount(code);
        if (Number.isFinite(Number(n)) && Number(n) > 0) {
          setCardCount(code, Number(n));
          return;
        }
        if (store.confirmed[code]) setCardCount(code, Number(store.counts[code] || 0));
      });
    }
    let _countsMap = null, _countsAt = 0;
    async function tursoCounts(force) {
      const now = Date.now();
      if (!force && _countsMap && now - _countsAt < 6e4) return _countsMap;
      try {
        const res = await fetch("/api/subjects?ts=" + now, { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        const map = {};
        (j.data || []).forEach((r) => {
          map[String(r.code || "").toUpperCase()] = Number(r.question_count ?? r.questions_count ?? r.count ?? 0);
        });
        _countsMap = map;
        _countsAt = now;
        return map;
      } catch (e) {
        console.warn("[subject count Turso]", e);
        return _countsMap || {};
      }
    }
    async function countOne(code) {
      if (!code) return null;
      const map = await tursoCounts();
      const v = map[String(code).toUpperCase()];
      return v === void 0 || v === null ? null : Number(v);
    }
    async function refresh(force = false) {
      if (!user()) return;
      const prof = window.HODSupabase?.getProfile?.() || null;
      if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === "0")) return;
      const cards = [...document.querySelectorAll(".subjectCard[data-code]")];
      if (!cards.length) return;
      const store = ensureStore();
      const must = force || dirty();
      paint();
      const codes = cards.map((card) => card.dataset.code).filter(Boolean);
      const need = codes.filter((code) => {
        const n = localCount(code);
        if (Number.isFinite(Number(n)) && Number(n) > 0) return false;
        return must || !store.confirmed[code];
      });
      if (!need.length) return;
      for (const code of need) {
        if (pending.has(code)) continue;
        pending.add(code);
        const n = await countOne(code);
        if (n !== null) {
          store.counts[code] = n;
          store.confirmed[code] = true;
          store.updated_at = (/* @__PURE__ */ new Date()).toISOString();
          write(store);
          setCardCount(code, n);
        }
        pending.delete(code);
      }
      setDirty(false);
    }
    const oldClear = window.clearLearningHubSupabaseCache;
    window.clearLearningHubSupabaseCache = function(kind) {
      if (!kind || kind === "all" || kind === "questions" || kind === "subjects") setDirty(true);
      return typeof oldClear === "function" ? oldClear.apply(this, arguments) : void 0;
    };
    window.refreshSubjectCountsOnce = function() {
      return refresh(true);
    };
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(paint, 300);
      setTimeout(() => refresh(false), 1200);
      setTimeout(() => refresh(false), 2600);
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest("#subjectRefresh")) setTimeout(() => refresh(true), 600);
      if (e.target.closest("#hodChangeSubjectBtn,#subjectTopChip")) {
        setTimeout(paint, 300);
        setTimeout(() => refresh(false), 1200);
        setTimeout(() => refresh(false), 2600);
      }
    }, true);
  })();
  (function() {
    if (window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629) return;
    window.__ACTIVE_SUBJECT_COUNT_SYNC_20260629 = true;
    const STORE2 = "learninghub_subject_counts_cache_v3";
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    function code() {
      return localStorage.getItem(SUBJECT_STORE2) || "";
    }
    function read() {
      try {
        return JSON.parse(localStorage.getItem(STORE2) || "{}") || {};
      } catch (e) {
        return {};
      }
    }
    function write(x) {
      try {
        localStorage.setItem(STORE2, JSON.stringify(x || {}));
      } catch (e) {
      }
    }
    function cssEscape(s) {
      try {
        return CSS.escape(String(s));
      } catch (e) {
        return String(s).replace(/"/g, '\\"');
      }
    }
    function loadedCount() {
      try {
        if (Array.isArray(RAW) && RAW.length) return RAW.length;
        if (Array.isArray(pool) && pool.length) return pool.length;
      } catch (e) {
      }
      return 0;
    }
    function setCardCount(subject, n) {
      if (!subject || !Number.isFinite(Number(n)) || Number(n) <= 0) return;
      const count = Number(n);
      document.querySelectorAll('.subjectCard[data-code="' + cssEscape(subject) + '"]').forEach((card) => {
        const meta = card.querySelector(".subjectMeta span:first-child");
        if (meta) meta.textContent = count + " c\xE2u";
        card.title = (card.title || subject).replace(/(?:\d+|—|0) câu/g, count + " c\xE2u");
      });
      const store = read();
      store.counts = store.counts || {};
      store.confirmed = store.confirmed || {};
      store.counts[subject] = count;
      store.confirmed[subject] = true;
      store.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      write(store);
    }
    function syncActiveSubjectCount() {
      const subject = code();
      const n = loadedCount();
      if (subject && n > 0) setCardCount(subject, n);
    }
    window.syncActiveSubjectCount = syncActiveSubjectCount;
    const oldLoadCurrent = window.loadCurrentSubjectOnly;
    if (typeof oldLoadCurrent === "function" && !oldLoadCurrent.__activeCountPatched) {
      window.loadCurrentSubjectOnly = async function() {
        const out = await oldLoadCurrent.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 50);
        setTimeout(syncActiveSubjectCount, 300);
        return out;
      };
      window.loadCurrentSubjectOnly.__activeCountPatched = true;
    }
    const oldLoadBySubject = window.loadBySubject;
    if (typeof oldLoadBySubject === "function" && !oldLoadBySubject.__activeCountPatched) {
      window.loadBySubject = async function() {
        const out = await oldLoadBySubject.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 50);
        setTimeout(syncActiveSubjectCount, 300);
        return out;
      };
      window.loadBySubject.__activeCountPatched = true;
    }
    const oldRenderCard = typeof renderCard === "function" ? renderCard : null;
    if (oldRenderCard && !window.__renderCardActiveCountPatched) {
      window.__renderCardActiveCountPatched = true;
      renderCard = function() {
        const out = oldRenderCard.apply(this, arguments);
        setTimeout(syncActiveSubjectCount, 0);
        return out;
      };
      window.renderCard = renderCard;
    }
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(syncActiveSubjectCount, 500);
      setTimeout(syncActiveSubjectCount, 1500);
    });
    setInterval(() => {
      const gate = document.getElementById("subjectGate");
      if (gate && !gate.classList.contains("hidden")) syncActiveSubjectCount();
    }, 800);
  })();
  (function() {
    function apply() {
      try {
        localStorage.removeItem("hod102_hide_options");
      } catch (e) {
      }
      var opt = document.getElementById("options");
      if (opt) opt.classList.remove("hide");
      var eye = document.getElementById("toggleOpts");
      if (eye) eye.remove();
      var st = document.getElementById("stToggleOpts");
      if (st) st.style.display = "none";
      var stText = document.getElementById("stOptState");
      if (stText) stText.textContent = "\u0110ang hi\u1EC7n l\u1EF1a ch\u1ECDn";
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
    else apply();
    setTimeout(apply, 300);
  })();
  (function() {
    function injectExamStyle() {
      if (document.getElementById("examUiStyleMerged")) return;
      var style = document.createElement("style");
      style.id = "examUiStyleMerged";
      style.textContent = `
      #quiz.pane.active,
      #quiz.active {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      #quizBody {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }

      .examOnlyGridContainer {
        min-height: calc(100dvh - var(--headH,112px) - 8px) !important;
        height: calc(100dvh - var(--headH,112px) - 8px) !important;
        align-items: stretch !important;
        margin-bottom: 0 !important;
        width: min(1728px, calc(100vw - 96px)) !important;
        max-width: none !important;
      }

      .examOnlyCard,
      .examOnlySidebar {
        height: 100% !important;
        min-height: 0 !important;
        box-sizing: border-box !important;
      }

      .examOnlyCard {
        display: flex !important;
        flex-direction: column !important;
      }

      .examOnlyContentBody {
        flex: 1 1 auto !important;
        min-height: 0 !important;
      }

      .examOnlyFooter {
        flex: 0 0 auto !important;
        margin-top: 20px !important;
      }

      .examSidebarGrid,
      .examOnlyQuestionZone,
      .examOnlyRightZone {
        min-height: 0 !important;
      }

      #quiz .examOnlyCard .qq,
      #quiz .examOnlyQuestionZone .qq,
      #quiz .qq{
        color:rgba(245,240,232,.78)!important;
        -webkit-text-fill-color:rgba(245,240,232,.78)!important;
        text-shadow:none!important;
        font-size:clamp(1.00rem,1.04vw,1.18rem)!important;
        line-height:1.42!important;
        font-weight:580!important;
      }
      #quiz .examOnlyOption .qtxt,
      #quiz .examOnlyCard .qtxt{
        color:rgba(245,240,232,.60)!important;
        font-weight:480!important;
        text-shadow:none!important;
      }
      #quiz .examOnlyOption.sel{
        background:linear-gradient(135deg,rgba(200,169,110,.075),rgba(232,212,168,.032))!important;
        border-color:rgba(232,212,168,.42)!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
      }
      #quiz .examOnlyOption.sel .qtxt{
        color:rgba(245,240,232,.76)!important;
        font-weight:520!important;
      }
      #quiz .examOnlyOption.sel .qkey{
        color:#14100b!important;
        background:linear-gradient(135deg,rgba(232,212,168,.80),rgba(200,169,110,.76))!important;
        box-shadow:0 1px 6px rgba(232,212,168,.12)!important;
      }

      @media (max-width: 900px) {
        .examOnlyGridContainer {
          height: auto !important;
          min-height: 0 !important;
        }
        .examOnlyCard,
        .examOnlySidebar {
          height: auto !important;
        }
      }

      @media (min-width:901px){
        #quiz .examOnlyContentBody{
          display:flex!important;
          flex-direction:column!important;
          gap:16px!important;
          align-items:stretch!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          padding-right:6px!important;
        }
        #quiz .examOnlyQuestionZone,#quiz .examOnlyRightZone{
          max-height:none!important;
          overflow:visible!important;
          padding:0!important;
          flex:0 0 auto!important;
        }
        #quiz .examOnlyOptions{padding:0!important;gap:11px!important;}

        #quiz.pane.scroll.active,
        #quiz.pane.active,
        #quiz.scroll{
          padding-left:0!important;
          padding-right:0!important;
          align-items:center!important;
        }

        #quizBody{
          width:min(1580px,calc(100vw - 220px))!important;
          max-width:1580px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          transform:translateX(34px)!important;
        }
        #quiz .examOnlyGridContainer{
          width:100%!important;
          max-width:1580px!important;
          grid-template-columns:minmax(0,1fr) 360px!important;
          gap:26px!important;
          margin-left:auto!important;
          margin-right:auto!important;
        }
        #quiz .examOnlyCard{max-width:none!important;}
      }
    `;
      document.head.appendChild(style);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectExamStyle);
    else injectExamStyle();
  })();
  (function() {
    const KEYS = [
      "learninghub_add_subject_code_v1",
      "learninghub_add_subject_name_v1",
      "learninghub_add_subject_desc_v1",
      "learninghub_add_subject_step_v1",
      "learninghub_add_subject_file_name_v1",
      "learninghub_add_subject_file_size_v1",
      "learninghub_add_subject_file_data_v1",
      "learninghub_add_subject_file_previewed_v1"
    ];
    const SESSION_KEY = "learninghub_add_subject_draft_cleared_for_user_v1";
    function clearAddSubjectDraft() {
      try {
        KEYS.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
      }
      try {
        localStorage.setItem("learninghub_subject_gate_tab_v1", "list");
      } catch (e) {
      }
      const ids = [
        "addSubjectCode",
        "addSubjectName",
        "addSubjectDesc",
        "userImportData",
        "userImportFile"
      ];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const card = document.getElementById("userImportFileCard");
      const dz = document.getElementById("importDropZone");
      const pv = document.getElementById("previewImportBtn");
      const preview = document.getElementById("userImportPreview");
      if (card) card.classList.add("hidden");
      if (dz) dz.classList.remove("hidden");
      if (pv) {
        pv.classList.add("hidden");
        pv.disabled = true;
      }
      if (preview) preview.innerHTML = "";
    }
    function currentUserId() {
      try {
        return window.HODSupabase?.getUser?.()?.id || "";
      } catch (e) {
        return "";
      }
    }
    function clearOnceForCurrentLogin() {
      const uid = currentUserId();
      if (!uid) return;
      let cleared = "";
      try {
        cleared = sessionStorage.getItem(SESSION_KEY) || "";
      } catch (e) {
      }
      if (cleared === uid) return;
      clearAddSubjectDraft();
      try {
        sessionStorage.setItem(SESSION_KEY, uid);
      } catch (e) {
      }
    }
    function patchAuthMethods() {
      const api = window.HODSupabase;
      if (!api || api.__clearAddSubjectDraftPatched) return;
      if (typeof api.signInGoogle === "function") {
        const oldGoogle = api.signInGoogle.bind(api);
        api.signInGoogle = async function() {
          clearAddSubjectDraft();
          try {
            sessionStorage.removeItem(SESSION_KEY);
          } catch (e) {
          }
          return oldGoogle.apply(this, arguments);
        };
      }
      if (typeof api.signOut === "function") {
        const oldSignOut = api.signOut.bind(api);
        api.signOut = async function() {
          clearAddSubjectDraft();
          try {
            sessionStorage.removeItem(SESSION_KEY);
          } catch (e) {
          }
          return oldSignOut.apply(this, arguments);
        };
      }
      api.__clearAddSubjectDraftPatched = true;
    }
    function tick() {
      patchAuthMethods();
      clearOnceForCurrentLogin();
    }
    window.__clearAddSubjectDraft = clearAddSubjectDraft;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
    else tick();
    setTimeout(tick, 500);
    setTimeout(tick, 1600);
    setInterval(tick, 2500);
  })();
  (function() {
    if (window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629) return;
    window.__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629 = true;
    function normalizeQuestionAttrs(q) {
      if (!q || typeof q !== "object") return q;
      const imgs = Array.isArray(q.images) ? q.images : [];
      q.has_image = !!(q.has_image || imgs.length);
      q.error_risk = q.error_risk || "low";
      q.error_risk_reason = q.error_risk_reason || "";
      return q;
    }
    window.__LHNormalizeQuestionAttrs = normalizeQuestionAttrs;
    function normalizeAll() {
      try {
        if (Array.isArray(RAW)) RAW.forEach(normalizeQuestionAttrs);
      } catch (e) {
      }
      try {
        if (Array.isArray(pool)) pool.forEach(normalizeQuestionAttrs);
      } catch (e) {
      }
      try {
        if (Array.isArray(qSet)) qSet.forEach(normalizeQuestionAttrs);
      } catch (e) {
      }
    }
    const oldRenderStudy = typeof renderStudy === "function" ? renderStudy : null;
    if (oldRenderStudy && !oldRenderStudy.__keepAttrs) {
      renderStudy = function() {
        normalizeAll();
        return oldRenderStudy.apply(this, arguments);
      };
      renderStudy.__keepAttrs = true;
    }
    const oldRenderCard = typeof renderCard === "function" ? renderCard : null;
    if (oldRenderCard && !oldRenderCard.__keepAttrs) {
      renderCard = function() {
        normalizeAll();
        return oldRenderCard.apply(this, arguments);
      };
      renderCard.__keepAttrs = true;
    }
    normalizeAll();
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function safeSrc(im) {
      return im && typeof im === "object" ? im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "" : im || "";
    }
    function safeEsc(s) {
      return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }
    function ensureEditImgsBox() {
      let box = $2("editImgs");
      if (box) return box;
      const input = $2("imgUpload");
      if (!input) return null;
      box = document.createElement("div");
      box.id = "editImgs";
      box.className = "editImgs";
      input.insertAdjacentElement("afterend", box);
      return box;
    }
    window.renderEditImages = renderEditImages = function() {
      const box = ensureEditImgsBox();
      if (!box) return;
      const imgs = typeof editDraft !== "undefined" && editDraft && Array.isArray(editDraft.images) ? editDraft.images : [];
      box.innerHTML = imgs.length ? imgs.map((im, i) => {
        const src = safeSrc(im);
        return `<div class="editImg"><button class="rm" data-rm="${i}">\xD7</button><img src="${safeEsc(src)}" loading="lazy" decoding="async"><input class="imgUrlBox" value="${safeEsc(src)}" readonly onclick="this.select()" title="B\u1EA5m \u0111\u1EC3 ch\u1ECDn URL \u1EA3nh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;"></div>`;
      }).join("") : '<p style="color:var(--mist)">Ch\u01B0a c\xF3 h\xECnh.</p>';
    };
  })();
  (function() {
    function $2(id) {
      return document.getElementById(id);
    }
    function msg(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    function imageFilesFromClipboard(e) {
      return [...e.clipboardData?.items || []].filter((item) => item.kind === "file" && String(item.type || "").startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean);
    }
    function imageFilesFromDrop(e) {
      return [...e.dataTransfer?.files || []].filter((file) => String(file.type || "").startsWith("image/"));
    }
    function setInputFilesAndUpload(files, source) {
      files = [...files || []].filter((file) => file && String(file.type || "").startsWith("image/"));
      if (!files.length) return false;
      const input = $2("editPreviewImgInput") || $2("imgUpload");
      if (!input) {
        alert("Ch\u01B0a th\u1EA5y \xF4 th\xEAm \u1EA3nh. \u0110\xF3ng/m\u1EDF l\u1EA1i form s\u1EEDa r\u1ED3i th\u1EED l\u1EA1i.");
        return true;
      }
      try {
        const dt = new DataTransfer();
        files.forEach((file) => dt.items.add(file));
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        msg(source === "paste" ? "\u0110ang upload \u1EA3nh v\u1EEBa d\xE1n..." : "\u0110ang upload \u1EA3nh...");
      } catch (err) {
        alert("Tr\xECnh duy\u1EC7t kh\xF4ng h\u1ED7 tr\u1EE3 d\xE1n \u1EA3nh ki\u1EC3u n\xE0y. H\xE3y b\u1EA5m + Th\xEAm \u1EA3nh \u0111\u1EC3 ch\u1ECDn file.");
      }
      return true;
    }
    function ensureEditPasteHint() {
      const modal = $2("editModal");
      if (!modal || modal.classList.contains("hidden")) return;
      const imagesBox = modal.querySelector(".v7Images");
      if (!imagesBox || imagesBox.querySelector(".editPasteImageHint")) return;
      const head = imagesBox.querySelector(".v7ImagesHead") || imagesBox.firstElementChild;
      const hint = document.createElement("div");
      hint.className = "pasteImageHint editPasteImageHint";
      hint.textContent = "C\xF3 th\u1EC3 ch\u1EE5p/copy \u1EA3nh r\u1ED3i b\u1EA5m Ctrl + V t\u1EA1i khung n\xE0y \u0111\u1EC3 t\u1EF1 upload URL.";
      if (head) head.insertAdjacentElement("afterend", hint);
      else imagesBox.prepend(hint);
    }
    function bindEditPreviewPasteUpload() {
      const modal = $2("editModal");
      if (!modal) return;
      ensureEditPasteHint();
      if (modal.__editPreviewPasteUploadBound) return;
      modal.__editPreviewPasteUploadBound = true;
      modal.addEventListener("paste", (e) => {
        const files = imageFilesFromClipboard(e);
        if (!files.length) return;
        e.preventDefault();
        setInputFilesAndUpload(files, "paste");
      }, true);
      modal.addEventListener("dragover", (e) => {
        const hasFile = [...e.dataTransfer?.items || []].some((item) => item.kind === "file");
        if (!hasFile) return;
        e.preventDefault();
        modal.classList.add("dragImageOver");
        ensureEditPasteHint();
      }, true);
      modal.addEventListener("dragleave", () => modal.classList.remove("dragImageOver"), true);
      modal.addEventListener("drop", (e) => {
        const files = imageFilesFromDrop(e);
        if (!files.length) return;
        e.preventDefault();
        modal.classList.remove("dragImageOver");
        setInputFilesAndUpload(files, "drop");
      }, true);
    }
    function boot() {
      bindEditPreviewPasteUpload();
      ensureEditPasteHint();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setTimeout(boot, 300);
    setInterval(boot, 700);
  })();
  (function() {
    function msg(t) {
      if (typeof notify === "function") notify(t);
      else console.log(t);
    }
    function modal() {
      return document.getElementById("importPreviewModal");
    }
    function isOpen() {
      const m = modal();
      return !!m && !m.classList.contains("hidden") && getComputedStyle(m).display !== "none";
    }
    function filesFromPaste(e) {
      return [...e.clipboardData?.items || []].filter((item) => item.kind === "file" && String(item.type || "").startsWith("image/")).map((item) => item.getAsFile()).filter(Boolean);
    }
    function filesFromDrop(e) {
      return [...e.dataTransfer?.files || []].filter((file) => String(file.type || "").startsWith("image/"));
    }
    function activeCard() {
      const m = modal();
      if (!m) return null;
      return document.activeElement?.closest?.("[data-v7-card],[data-imgui-card]") || m.querySelector("[data-v7-card]:has([data-v7-input]),[data-imgui-card]:has([data-imgui-input])");
    }
    function activeInput() {
      const c = activeCard();
      const inp = c?.querySelector?.("[data-v7-input],[data-imgui-input]");
      if (inp) return inp;
      return modal()?.querySelector?.("[data-v7-input],[data-imgui-input]") || null;
    }
    function ensureHints() {
      const m = modal();
      if (!m || !isOpen()) return;
      m.querySelectorAll(".v7Images,.simpleEditImages").forEach((box) => {
        if (box.querySelector(".importPasteImageHint")) return;
        const head = box.querySelector(".v7ImagesHead,.simpleEditImagesHead") || box.firstElementChild;
        const hint = document.createElement("div");
        hint.className = "pasteImageHint importPasteImageHint";
        hint.textContent = "C\xF3 th\u1EC3 ch\u1EE5p/copy \u1EA3nh r\u1ED3i b\u1EA5m Ctrl + V t\u1EA1i khung n\xE0y \u0111\u1EC3 t\u1EF1 upload URL.";
        if (head) head.insertAdjacentElement("afterend", hint);
        else box.prepend(hint);
      });
    }
    function uploadByInput(files, source) {
      files = [...files || []].filter((file) => file && String(file.type || "").startsWith("image/"));
      if (!files.length || !isOpen()) return false;
      const input = activeInput();
      if (!input) {
        alert("B\u1EA5m S\u1EEDa \u1EDF c\xE2u c\u1EA7n th\xEAm \u1EA3nh tr\u01B0\u1EDBc, r\u1ED3i d\xE1n \u1EA3nh l\u1EA1i nha.");
        return true;
      }
      try {
        const dt = new DataTransfer();
        files.forEach((file) => dt.items.add(file));
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        msg(source === "paste" ? "\u0110ang upload \u1EA3nh v\u1EEBa d\xE1n..." : "\u0110ang upload \u1EA3nh...");
      } catch (err) {
        alert("Tr\xECnh duy\u1EC7t kh\xF4ng h\u1ED7 tr\u1EE3 d\xE1n \u1EA3nh ki\u1EC3u n\xE0y. H\xE3y b\u1EA5m + Th\xEAm \u1EA3nh \u0111\u1EC3 ch\u1ECDn file.");
      }
      return true;
    }
    function bind() {
      const m = modal();
      if (!m) return;
      ensureHints();
      if (m.__importPreviewPasteBound) return;
      m.__importPreviewPasteBound = true;
      m.addEventListener("paste", (e) => {
        const files = filesFromPaste(e);
        if (!files.length) return;
        e.preventDefault();
        uploadByInput(files, "paste");
      }, true);
      m.addEventListener("dragover", (e) => {
        const has = [...e.dataTransfer?.items || []].some((item) => item.kind === "file");
        if (!has) return;
        e.preventDefault();
        m.classList.add("dragImageOver");
        ensureHints();
      }, true);
      m.addEventListener("dragleave", () => m.classList.remove("dragImageOver"), true);
      m.addEventListener("drop", (e) => {
        const files = filesFromDrop(e);
        if (!files.length) return;
        e.preventDefault();
        m.classList.remove("dragImageOver");
        uploadByInput(files, "drop");
      }, true);
    }
    function boot() {
      bind();
      ensureHints();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    document.addEventListener("click", () => setTimeout(boot, 0), true);
    setInterval(boot, 700);
  })();
  window.APP_CONFIG = window.APP_CONFIG || {};
  window.APP_CONFIG.USE_TURSO_API = true;
  (function() {
    if (window.__TURSO_SUBJECT_COUNTS_FALLBACK_20260630) return;
    window.__TURSO_SUBJECT_COUNTS_FALLBACK_20260630 = true;
    const STORE2 = "learninghub_subject_counts_cache_v3";
    let loading = false;
    function readStore() {
      try {
        return JSON.parse(localStorage.getItem(STORE2) || "{}") || {};
      } catch (e) {
        return {};
      }
    }
    function writeCounts(counts) {
      try {
        localStorage.setItem(STORE2, JSON.stringify({ counts: counts || {}, confirmed: counts || {}, at: Date.now() }));
      } catch (e) {
      }
    }
    function norm(code) {
      return String(code || "").trim().toUpperCase();
    }
    async function fetchCounts() {
      if (loading) return null;
      if (!window.HODSupabase?.getUser?.()) return null;
      const prof = window.HODSupabase?.getProfile?.();
      if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === "0")) return null;
      loading = true;
      try {
        const res = await fetch("/api/questions?count_only=1&ts=" + Date.now(), { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        const counts = {};
        rows.forEach((q) => {
          const code = norm(q.subject_code);
          const n = Number(q.question_count ?? q.questions_count ?? q.count ?? 1);
          if (code) counts[code] = (counts[code] || 0) + (Number.isFinite(n) && n > 0 ? n : 1);
        });
        writeCounts(counts);
        return counts;
      } catch (e) {
        console.warn("[Turso counts fallback]", e);
        return null;
      } finally {
        loading = false;
      }
    }
    function applyCountsToCards(counts) {
      if (!counts) return;
      document.querySelectorAll(".subjectCard").forEach((card) => {
        const code = norm(card.dataset.code || card.getAttribute("data-code"));
        if (!code || counts[code] == null) return;
        const meta = card.querySelector(".subjectMeta span");
        if (meta) meta.textContent = Number(counts[code] || 0) + " c\xE2u";
      });
    }
    async function refreshZeroCounts() {
      const cards = Array.from(document.querySelectorAll(".subjectCard"));
      if (!cards.length) return;
      const hasZero = cards.some((card) => /(^|\s)0\s*câu/i.test(card.textContent || ""));
      if (!hasZero) return;
      const store = readStore();
      if (store.counts) applyCountsToCards(store.counts);
      const counts = await fetchCounts();
      applyCountsToCards(counts);
    }
    const oldRenderSubjects = typeof renderSubjects === "function" ? renderSubjects : null;
    if (oldRenderSubjects && !oldRenderSubjects.__tursoCountsFallback) {
      const fn = function() {
        const out = oldRenderSubjects.apply(this, arguments);
        setTimeout(refreshZeroCounts, 80);
        return out;
      };
      fn.__tursoCountsFallback = true;
      window.renderSubjects = renderSubjects = fn;
    }
    document.addEventListener("DOMContentLoaded", function() {
      setTimeout(refreshZeroCounts, 600);
      setTimeout(refreshZeroCounts, 1800);
    });
  })();
  (function() {
    if (window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630) return;
    window.__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630 = true;
    const SUBJECT_STORE2 = "learninghub_subject_code_merged_v1";
    let running = false;
    let doneFor = "";
    function subject() {
      return localStorage.getItem(SUBJECT_STORE2) || "";
    }
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function approved() {
      const p = profile();
      return !p || !(p.approved === false || p.approved === 0 || p.approved === "0");
    }
    function dataOk(code) {
      try {
        return !!code && Array.isArray(RAW) && RAW.length > 0 && RAW.some((q) => String(q.subject_code || code).toUpperCase() === String(code).toUpperCase());
      } catch (e) {
        return false;
      }
    }
    function renderAll() {
      try {
        renderCard?.();
      } catch (e) {
      }
      try {
        renderQuiz?.();
      } catch (e) {
      }
      try {
        renderStudy?.();
      } catch (e) {
      }
    }
    async function loadOnce(reason) {
      const code = subject();
      if (!code || !user() || !approved() || running) return false;
      if (dataOk(code)) {
        doneFor = code;
        renderAll();
        return true;
      }
      if (doneFor === code) return true;
      running = true;
      try {
        let ok = false;
        if (typeof window.loadCurrentSubjectOnly === "function") ok = await window.loadCurrentSubjectOnly(false);
        else if (window.HODSupabase?.loadQuestionsFromSupabase) ok = await window.HODSupabase.loadQuestionsFromSupabase();
        if (ok || dataOk(code)) {
          doneFor = code;
          renderAll();
          return true;
        }
      } catch (e) {
        console.warn("[startup auto load]", reason, e);
      } finally {
        running = false;
      }
      return false;
    }
    function schedule(reason) {
      [300, 1300, 3500].forEach((ms) => setTimeout(() => loadOnce(reason + ":" + ms), ms));
    }
    function boot() {
      schedule("boot");
      document.querySelectorAll(".tab").forEach((btn) => {
        if (btn.__startupAutoLoadBound) return;
        btn.__startupAutoLoadBound = true;
        btn.addEventListener("click", () => setTimeout(() => loadOnce("tab"), 120));
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  })();
  (function() {
    if (window.__COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630) return;
    window.__COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630 = true;
    try {
      imgsHTML = function(c) {
        return (c?.images || []).map((im) => {
          const src = typeof im === "string" ? im : im.src || im.url || im.secure_url || im.publicUrl || im.public_url || "";
          if (!src || String(src).startsWith("data:image/")) return "";
          return '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">';
        }).join("");
      };
      window.imgsHTML = imgsHTML;
    } catch (e) {
    }
  })();
  (function() {
    if (window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701) return;
    window.__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 = true;
    const $2 = (id) => document.getElementById(id);
    const LARGE_LIMIT = 80;
    const CONCURRENCY = 8;
    function user() {
      return window.HODSupabase?.getUser?.() || null;
    }
    function profile() {
      return window.HODSupabase?.getProfile?.() || null;
    }
    function canManage() {
      const role = String(profile()?.role || "").toLowerCase();
      return !!user() && (window.HODSupabase?.isAdmin?.() || role === "admin" || role === "editor");
    }
    function toast(msg) {
      try {
        if (typeof notify === "function") notify(msg);
      } catch (e) {
      }
    }
    function prog(title, current, total, detail) {
      try {
        if (typeof showProgress === "function") showProgress(title, current, total, detail || "");
      } catch (e) {
      }
    }
    function hideProg() {
      try {
        if (typeof hideProgress === "function") hideProgress();
      } catch (e) {
      }
    }
    function cleanQuestions(arr) {
      return (Array.isArray(arr) ? arr : []).map((q, i) => {
        const opts = q && typeof q.options === "object" && !Array.isArray(q.options) ? q.options : {};
        const answer = String(q?.answer || "").toUpperCase().replace(/[^A-Z]/g, "");
        const images = Array.isArray(q?.images) ? q.images : [];
        return {
          num: Number(q?.num) || i + 1,
          question: String(q?.question || "").trim(),
          options: opts,
          answer,
          answer_text: q?.answer_text || answer.split("").map((k) => k + ". " + (opts[k] || "")).join("; "),
          images,
          has_image: !!(q?.has_image || images.length),
          error_risk: q?.error_risk || "low",
          error_risk_reason: q?.error_risk_reason || null
        };
      }).filter((q) => q.question && q.answer && q.options);
    }
    function readQuestions() {
      let arr = window.__previewImportData || window.__LH_LAST_PREVIEW_IMPORT_DATA || [];
      if (!Array.isArray(arr) || !arr.length) {
        try {
          let s = String($2("userImportData")?.value || localStorage.getItem("learninghub_add_subject_file_data_v1") || "").trim();
          const m = s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
          if (m) s = m[1].trim();
          const j = JSON.parse(s);
          arr = Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : [];
        } catch (e) {
          arr = [];
        }
      }
      return cleanQuestions(arr);
    }
    async function postAction(action, payload) {
      const res = await fetch("/api/admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ user_id: user()?.id, action, payload })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) throw new Error(out.error || "HTTP " + res.status);
      return out;
    }
    function cacheCount(code, count) {
      try {
        const key = "learninghub_subject_counts_cache_v3";
        const store = JSON.parse(localStorage.getItem(key) || "{}") || {};
        store.counts = store.counts || {};
        store.confirmed = store.confirmed || {};
        store.counts[code] = count;
        store.confirmed[code] = true;
        store.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        localStorage.setItem(key, JSON.stringify(store));
        localStorage.setItem("learninghub_subjects_dirty_v3", String(Date.now()));
        localStorage.removeItem("learninghub_subjects_cache_v1");
        sessionStorage.removeItem("learninghub_subject_counts_cache_v1");
        window.clearLearningHubSupabaseCache?.("subjects");
        window.clearLearningHubSupabaseCache?.("questions");
        window.clearLearningHubQuestionCache?.();
      } catch (e) {
      }
    }
    function clearState() {
      try {
        window.__previewImportData = [];
        window.__LH_LAST_PREVIEW_IMPORT_DATA = [];
        $2("importPreviewModal")?.classList.add("hidden");
        ["learninghub_add_subject_file_name_v1", "learninghub_add_subject_file_size_v1", "learninghub_add_subject_file_data_v1", "learninghub_add_subject_file_previewed_v1"].forEach((k) => localStorage.removeItem(k));
      } catch (e) {
      }
    }
    async function uploadOne(finalCode, q, i) {
      await postAction("add_question", {
        question_data: {
          subject_code: finalCode,
          num: Number(q.num) || i + 1,
          question: q.question,
          options: q.options || {},
          answer: q.answer,
          answer_text: q.answer_text || "",
          images: q.images || [],
          has_image: !!q.has_image,
          error_risk: q.error_risk || "low",
          error_risk_reason: q.error_risk_reason || null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    async function uploadParallel(finalCode, questions) {
      let done = 0;
      let next2 = 0;
      const total = questions.length;
      const errors = [];
      prog("\u0110ang upload c\xE2u h\u1ECFi...", 0, total, "Upload nhanh: g\u1EEDi " + CONCURRENCY + " c\xE2u c\xF9ng l\xFAc");
      async function worker() {
        while (next2 < total && !errors.length) {
          const i = next2++;
          try {
            await uploadOne(finalCode, questions[i], i);
          } catch (e) {
            errors.push("C\xE2u " + (questions[i].num || i + 1) + ": " + (e?.message || e));
            break;
          }
          done++;
          prog("\u0110ang upload c\xE2u h\u1ECFi...", done, total, "\u0110\xE3 g\u1EEDi " + done + "/" + total + " c\xE2u");
        }
      }
      const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
      await Promise.all(workers);
      if (errors.length) throw new Error(errors[0]);
      return done;
    }
    async function createLarge(code, name, desc, questions) {
      prog("\u0110ang t\u1EA1o m\xF4n h\u1ECDc...", 0, questions.length, "T\u1EA1o m\xF4n tr\u01B0\u1EDBc, r\u1ED3i upload nhi\u1EC1u c\xE2u song song...");
      const created = await postAction("add_subject", { code, name: name || code, description: desc || "", questions: [] });
      const finalCode = created.code || created.subject_code || code;
      const success = await uploadParallel(finalCode, questions);
      cacheCount(finalCode, success);
      return { finalCode, success };
    }
    async function createSmall(code, name, desc, questions) {
      prog("\u0110ang l\u01B0u m\xF4n h\u1ECDc...", 0, 100, "\u0110ang t\u1EA1o m\xF4n v\xE0 nh\u1EADp c\xE2u h\u1ECFi...");
      const out = await postAction("add_subject", { code, name: name || code, description: desc || "", questions });
      const finalCode = out.code || out.subject_code || code;
      cacheCount(finalCode, questions.length);
      prog("\u0110ang l\u01B0u m\xF4n h\u1ECDc...", 100, 100, "Ho\xE0n t\u1EA5t");
      return { finalCode, success: questions.length };
    }
    window.__submitSubjectRequest = async function() {
      const code = ($2("addSubjectCode")?.value || "").trim().toUpperCase();
      const name = ($2("addSubjectName")?.value || "").trim();
      const desc = ($2("addSubjectDesc")?.value || "").trim();
      const questions = readQuestions();
      if (!code) {
        alert("Vui l\xF2ng nh\u1EADp m\xE3 m\xF4n");
        $2("addSubjectCode")?.focus();
        return;
      }
      if (!/^[A-Z0-9_]{2,20}$/.test(code)) {
        alert("M\xE3 m\xF4n ch\u1EC9 g\u1ED3m ch\u1EEF, s\u1ED1, g\u1EA1ch d\u01B0\u1EDBi (2-20 k\xFD t\u1EF1)");
        $2("addSubjectCode")?.focus();
        return;
      }
      if (!name) {
        alert("Vui l\xF2ng nh\u1EADp t\xEAn m\xF4n");
        $2("addSubjectName")?.focus();
        return;
      }
      if (!questions.length) {
        alert("B\u1EA1n c\u1EA7n ch\u1ECDn file v\xE0 b\u1EA5m Xem tr\u01B0\u1EDBc tr\u01B0\u1EDBc khi l\u01B0u m\xF4n h\u1ECDc.");
        return;
      }
      if (!user()) {
        alert("B\u1EA1n c\u1EA7n \u0111\u0103ng nh\u1EADp tr\u01B0\u1EDBc khi l\u01B0u m\xF4n h\u1ECDc.");
        return;
      }
      const btn = $2("userImportBtn");
      const old = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "\u0110ang l\u01B0u...";
      }
      try {
        if (canManage()) {
          const rs = questions.length > LARGE_LIMIT ? await createLarge(code, name, desc, questions) : await createSmall(code, name, desc, questions);
          const ok = "\u0110\xE3 th\xEAm m\xF4n " + rs.finalCode + " v\u1EDBi " + rs.success + " c\xE2u h\u1ECFi";
          prog("Ho\xE0n t\u1EA5t upload", rs.success, rs.success, ok);
          alert(ok);
          toast(ok);
          clearState();
          window.__switchSubjectGateTab?.("list");
          try {
            $2("subjectRefresh")?.click();
            setTimeout(() => $2("subjectRefresh")?.click(), 5600);
            setTimeout(() => window.refreshSubjectCountsOnce?.(), 6500);
          } catch (e) {
          }
        } else {
          prog("\u0110ang g\u1EEDi y\xEAu c\u1EA7u t\u1EA1o m\xF4n h\u1ECDc...", 0, 100, "\u0110ang t\u1EA3i d\u1EEF li\u1EC7u c\xE2u h\u1ECFi...");
          await postAction("add_subject_request", { code, name, description: desc || "", questions_data: questions });
          prog("Ho\xE0n t\u1EA5t", 100, 100, "\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u");
          const ok = "\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u th\xEAm m\xF4n " + code + ". Vui l\xF2ng ch\u1EDD admin duy\u1EC7t.";
          alert(ok);
          toast(ok);
          clearState();
          window.__switchSubjectGateTab?.("list");
        }
      } catch (e) {
        console.warn("Fast add subject upload error:", e);
        alert("L\u1ED7i t\u1EA1o m\xF4n: " + (e?.message || e));
        toast("L\u1ED7i t\u1EA1o m\xF4n");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = old || "L\u01B0u M\xF4n H\u1ECDc";
        }
        setTimeout(hideProg, 450);
      }
    };
  })();
  (function() {
    if (window.__LH_AUTH_FETCH_20260705) return;
    window.__LH_AUTH_FETCH_20260705 = true;
    var prevFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!prevFetch) return;
    function lhToken() {
      try {
        var url = window.APP_CONFIG?.SUPABASE_URL || "";
        var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
        var ref = m ? m[1] : "";
        if (ref) {
          var key = "sb-" + ref + "-auth-token";
          var raw = localStorage.getItem(key);
          if (raw) {
            var v = JSON.parse(raw);
            var tok = v && (v.access_token || v.currentSession && v.currentSession.access_token || Array.isArray(v) && v[0]);
            var exp = v && (v.expires_at || v.currentSession && v.currentSession.expires_at);
            if (tok) {
              if (exp && Date.now() / 1e3 > exp - 10) return "";
              return tok;
            }
          }
        }
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.slice(0, 3) === "sb-" && k.slice(-11) === "-auth-token") {
            var raw = localStorage.getItem(k);
            if (!raw) continue;
            var v = JSON.parse(raw);
            var tok = v && (v.access_token || v.currentSession && v.currentSession.access_token || Array.isArray(v) && v[0]);
            var exp = v && (v.expires_at || v.currentSession && v.currentSession.expires_at);
            if (tok) {
              if (exp && Date.now() / 1e3 > exp - 10) return "";
              return tok;
            }
          }
        }
      } catch (e) {
      }
      return "";
    }
    window.__lhAccessToken = lhToken;
    function lhIsApi(u) {
      try {
        var url = new URL(u, location.href);
        return url.origin === location.origin && url.pathname.indexOf("/api/") === 0;
      } catch (e) {
        return false;
      }
    }
    window.fetch = function(input, init2) {
      try {
        var url = typeof input === "string" ? input : input && input.url || "";
        if (lhIsApi(url)) {
          var tok = lhToken();
          if (tok) {
            if (input instanceof Request) {
              if (!input.headers.has("Authorization")) {
                var h = new Headers(input.headers);
                h.set("Authorization", "Bearer " + tok);
                input = new Request(input, { headers: h });
              }
            } else {
              init2 = init2 || {};
              var hh = new Headers(init2.headers || {});
              if (!hh.has("Authorization")) hh.set("Authorization", "Bearer " + tok);
              init2.headers = hh;
            }
          }
        }
      } catch (e) {
      }
      return prevFetch(input, init2);
    };
  })();
  (function() {
    const $2 = (id) => document.getElementById(id);
    const esc2 = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
    let requests = [];
    let loading = null;
    let statusSnapshot = /* @__PURE__ */ new Map();
    let hasFirstSnapshot = false;
    let recentResultKeys = /* @__PURE__ */ new Set();
    function currentUserId() {
      return window.HODSupabase?.getUser?.()?.id || "";
    }
    function isStaff() {
      return ["admin", "editor"].includes(String(window.HODSupabase?.getProfile?.()?.role || "").toLowerCase());
    }
    function storageKey() {
      return `learninghub_edit_request_seen_v1_${isStaff() ? "staff" : "user"}_${currentUserId()}`;
    }
    function seenMap() {
      try {
        return JSON.parse(localStorage.getItem(storageKey()) || "{}") || {};
      } catch {
        return {};
      }
    }
    function saveSeen(value) {
      try {
        localStorage.setItem(storageKey(), JSON.stringify(value));
      } catch {
      }
    }
    function statusText(status) {
      return { pending: "\u0110ang ch\u1EDD duy\u1EC7t", approved: "\u0110\xE3 \u0111\u01B0\u1EE3c ch\u1EA5p nh\u1EADn", rejected: "\u0110\xE3 b\u1ECB t\u1EEB ch\u1ED1i" }[status] || status || "Kh\xF4ng r\xF5";
    }
    function questionText(row) {
      const text = String(row?.new_data?.question || "").trim();
      return text.length > 115 ? `${text.slice(0, 114)}\u2026` : text || "Kh\xF4ng c\xF3 n\u1ED9i dung c\xE2u h\u1ECFi";
    }
    function formatDate(value) {
      if (!value) return "";
      const date = /* @__PURE__ */ new Date(String(value).replace(" ", "T") + (String(value).includes("Z") ? "" : "Z"));
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    }
    function refreshBadge() {
      const badge = $2("hodEditRequestBadge");
      if (!badge) return;
      const seen = seenMap();
      const count = isStaff() ? requests.filter((row) => !seen[`${row.id}:pending`]).length : requests.filter((row) => {
        const key = `${row.id}:${row.status}`;
        return ["approved", "rejected"].includes(row.status) && (!seen[key] || recentResultKeys.has(key));
      }).length;
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.toggle("hidden", count === 0);
      $2("hodEditRequestBell")?.classList.toggle("hasNewRequest", count > 0);
    }
    function announceNewResult(rows) {
      const next2 = new Map(rows.map((row) => [String(row.id), String(row.status || "")]));
      if (hasFirstSnapshot && !isStaff()) {
        const hasNewResult = rows.some((row) => {
          const status = String(row.status || "");
          return ["approved", "rejected"].includes(status) && statusSnapshot.get(String(row.id)) !== status;
        });
        if (hasNewResult) {
          rows.forEach((row) => {
            const status = String(row.status || "");
            const key = `${row.id}:${status}`;
            if (["approved", "rejected"].includes(status) && statusSnapshot.get(String(row.id)) !== status) recentResultKeys.add(key);
          });
          const message = rows.some((row) => String(row.status) === "approved" && statusSnapshot.get(String(row.id)) !== "approved") ? "Y\xEAu c\u1EA7u s\u1EEDa c\xE2u h\u1ECFi c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c duy\u1EC7t." : "Y\xEAu c\u1EA7u s\u1EEDa c\xE2u h\u1ECFi c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c ph\u1EA3n h\u1ED3i.";
          if (typeof notifyUX === "function") notifyUX(message);
          else if (typeof notify === "function") notify(message);
        }
      }
      statusSnapshot = next2;
      hasFirstSnapshot = true;
    }
    function render() {
      const list = $2("hodEditRequestList");
      if (!list) return;
      if (!requests.length) {
        list.innerHTML = `<p class="muted">${isStaff() ? "Kh\xF4ng c\xF3 y\xEAu c\u1EA7u s\u1EEDa n\xE0o \u0111ang ch\u1EDD duy\u1EC7t." : "B\u1EA1n ch\u01B0a g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa c\xE2u h\u1ECFi n\xE0o."}</p>`;
        return;
      }
      const seen = seenMap();
      const displayRows = [...requests].sort((a, b) => {
        const aNew = ["approved", "rejected"].includes(a.status) && (!seen[`${a.id}:${a.status}`] || recentResultKeys.has(`${a.id}:${a.status}`));
        const bNew = ["approved", "rejected"].includes(b.status) && (!seen[`${b.id}:${b.status}`] || recentResultKeys.has(`${b.id}:${b.status}`));
        if (aNew !== bNew) return aNew ? -1 : 1;
        return String(b.reviewed_at || b.created_at || "").localeCompare(String(a.reviewed_at || a.created_at || ""));
      });
      list.innerHTML = displayRows.map((row) => {
        const code = row.subject_code || row.new_data?.subject_code || "Ch\u01B0a r\xF5 m\xF4n";
        const num = row.question_num || row.new_data?.num || row.question_id || "?";
        const note = row.status === "rejected" && row.admin_note ? `<p class="hodEditRequestNote">L\xFD do: ${esc2(row.admin_note)}</p>` : "";
        const when = row.reviewed_at || row.created_at;
        const action = isStaff() ? '<button class="primary hodEditRequestReview" type="button" data-review-edit-request>\u0110i t\u1EDBi trang duy\u1EC7t y\xEAu c\u1EA7u</button>' : "";
        const isNew = ["approved", "rejected"].includes(row.status) && (!seen[`${row.id}:${row.status}`] || recentResultKeys.has(`${row.id}:${row.status}`));
        return `<article class="hodEditRequestItem ${isNew ? "is-new" : ""}"><div class="hodEditRequestHead"><b>${esc2(code)} \xB7 C\xE2u ${esc2(num)}</b><span class="hodEditRequestStatus ${esc2(row.status || "")}">${esc2(statusText(row.status))}</span></div>${isNew ? '<span class="hodEditRequestNew">M\u1EDBi</span>' : ""}<p class="hodEditRequestMeta">${esc2(questionText(row))}</p><p class="hodEditRequestMeta">${row.reviewed_at ? "C\u1EADp nh\u1EADt" : "G\u1EEDi"}: ${esc2(formatDate(when))}</p>${note}${action}</article>`;
      }).join("");
      list.querySelectorAll("[data-review-edit-request]").forEach((btn) => btn.onclick = () => {
        window.location.href = "admin.html?tab=requests";
      });
    }
    async function load(force = false) {
      if (!currentUserId()) {
        requests = [];
        refreshBadge();
        return [];
      }
      if (loading) return loading;
      loading = (async () => {
        try {
          const endpoint = isStaff() ? "/api/staff-edit-requests" : "/api/my-edit-requests";
          const res = await fetch(`${endpoint}?ts=${Date.now()}`, { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
          requests = Array.isArray(data.data) ? data.data : [];
          announceNewResult(requests);
          render();
          refreshBadge();
          return requests;
        } catch (error) {
          if ($2("hodEditRequestModal") && !$2("hodEditRequestModal").classList.contains("hidden")) $2("hodEditRequestList").innerHTML = `<p class="muted">Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c th\xF4ng b\xE1o: ${esc2(error.message)}</p>`;
          return [];
        } finally {
          loading = null;
        }
      })();
      return loading;
    }
    async function open() {
      const modal = $2("hodEditRequestModal");
      if (!modal) return;
      modal.classList.remove("hidden");
      $2("hodEditRequestTitle").textContent = isStaff() ? "Y\xEAu c\u1EA7u s\u1EEDa \u0111ang ch\u1EDD duy\u1EC7t" : "Th\xF4ng b\xE1o y\xEAu c\u1EA7u s\u1EEDa";
      $2("hodEditRequestList").innerHTML = '<p class="muted">\u0110ang t\u1EA3i th\xF4ng b\xE1o...</p>';
      await load(true);
      const seen = seenMap();
      requests.filter((row) => isStaff() || ["approved", "rejected"].includes(row.status)).forEach((row) => {
        seen[`${row.id}:${row.status}`] = Date.now();
      });
      recentResultKeys.clear();
      saveSeen(seen);
      refreshBadge();
    }
    function close() {
      $2("hodEditRequestModal")?.classList.add("hidden");
    }
    function bind() {
      $2("hodEditRequestBell")?.addEventListener("click", open);
      $2("hodEditRequestClose")?.addEventListener("click", close);
      $2("hodEditRequestModal")?.addEventListener("click", (event) => {
        if (event.target === $2("hodEditRequestModal")) close();
      });
      document.addEventListener("click", (event) => {
        if (event.target.closest("#hodTopAvatar")) setTimeout(() => load(true), 80);
      });
      window.addEventListener("focus", () => load());
      window.addEventListener("lh:profile-ready", () => load(true));
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) load();
      });
      setInterval(() => {
        if (!document.hidden) load();
      }, 5 * 60 * 1e3);
      if (currentUserId()) load(true);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
    else bind();
  })();
  (function() {
    function placeBell() {
      const bell = document.getElementById("hodEditRequestBell");
      const actions = document.querySelector(".globalTop .actions") || document.querySelector("#fc .actions") || document.querySelector(".actions");
      const subject = document.getElementById("subjectTopChip");
      const settings = document.getElementById("openSettings");
      if (!bell || !actions) return;
      if (settings?.parentNode === actions) {
        actions.insertBefore(bell, settings);
      } else if (subject?.parentNode === actions) {
        actions.insertBefore(bell, subject.nextSibling);
      } else if (!actions.contains(bell)) {
        actions.appendChild(bell);
      }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", placeBell, { once: true });
    else placeBell();
    setTimeout(placeBell, 350);
    setTimeout(placeBell, 1200);
  })();

  // src/student/main.js
  window.getDeviceTypeString = getDeviceTypeString;
  window.getSubjectCode = getSubjectCode;
  window.setSubjectHelper = setSubject;
  window.syncUserSubjectToProfileHelper = syncUserSubjectToProfile;
  window.fetchApiHelper = fetchApi;
  window.fetchSubjectsHelper = fetchSubjects;
  window.fetchQuestionsHelper = fetchQuestions;
  window.filterQuestionsHelper = filterQuestions;
  window.shuffleQuestionsHelper = shuffleQuestions;
  window.formatFlashcardFrontHelper = formatFlashcardFront;
  window.formatFlashcardBackHelper = formatFlashcardBack;
})();
