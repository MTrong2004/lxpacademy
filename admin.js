(() => {
  // src/admin/users.js
  function renderUserRowSaaS2(p, helpers) {
    const { actText, actTime, date: date2, isBlocked: isBlocked2, badge: badge2, roleBadgeFinal, avatarButton, esc: esc2 } = helpers;
    const activeText = actText(p);
    const activeClass = activeText === "\u0110ang ho\u1EA1t \u0111\u1ED9ng" ? "activityNow" : "";
    const subjectTag = p.current_subject ? `<span class="saasSubjectChip">${esc2(p.current_subject)}</span>` : `<span class="saasMutedChip">Ch\u01B0a ch\u1ECDn m\xF4n</span>`;
    const deviceTag = p.device_info ? `<button class="saasDeviceChip saasDeviceBtn" type="button" title="Xem l\u1ECBch s\u1EED thi\u1EBFt b\u1ECB" onclick="showUserDeviceHistoryModal('${esc2(p.id)}')">${esc2(p.device_info)}</button>` : `<span class="saasMutedChip">Ch\u01B0a r\xF5</span>`;
    const statusBadge = isBlocked2(p) ? badge2("blocked") : `<span class="badge approved userApprovedBadge"><span class="badgeDot"></span>\u0110\xE3 duy\u1EC7t</span>`;
    return `<div class="userRow activitySortedRow lhUserRowSaaS approvedUserRow ${activeClass}">
    <div class="saasUserCol">
      <div class="lhAvatarCell">${avatarButton(p)}</div>
      <div class="saasUserInfo">
        <div class="saasMailRow">
          <span class="mail" title="${esc2(p.email || p.id)}">${esc2(p.email || p.id)}</span>
        </div>
        <div class="saasSubRow">
          ${roleBadgeFinal(p.role)}
          <span class="uid" title="${esc2(p.id)}">${esc2(p.id)}</span>
        </div>
      </div>
    </div>
    <div class="saasMetaCol">
      <div class="saasSubjectCell">${subjectTag}</div>
      <div class="saasDeviceCell">${deviceTag}</div>
    </div>
    <div class="saasStatusCol">
      <div class="saasStatusRow">${statusBadge}</div>
      <div class="saasActivityRow"><b class="lastActivity ${activeClass}">${esc2(activeText)}</b> <span class="uidTime">${esc2(date2(actTime(p)))}</span></div>
    </div>
    <div class="actions lhActionsCell">
      <button class="lhDotsBtn" type="button" title="Thao t\xE1c" onclick="openUserActionMenuFinal(event,'${esc2(p.id)}')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>
  </div>`;
  }
  function getUserTableHeadHTML2() {
    return `<div class="userRow muted tableHead lhUserRowSaaS approvedUsersHead">
    <div class="thCol">NG\u01AF\u1EDCI D\xD9NG</div>
    <div class="thCol thMeta">
      <span class="thSub">M\xD4N \u0110ANG H\u1ECCC</span>
      <span class="thDev">THI\u1EBET B\u1ECA</span>
    </div>
    <div class="thCol">TR\u1EA0NG TH\xC1I &amp; HO\u1EA0T \u0110\u1ED8NG</div>
    <div class="thCol thActions">THAO T\xC1C</div>
  </div>`;
  }

  // src/admin/questions.js
  async function uploadImageToCloudinary(file, config = {}) {
    const cloudName = config.cloudName || window.APP_CONFIG?.CLOUDINARY_CLOUD_NAME || "";
    const uploadPreset = config.uploadPreset || window.APP_CONFIG?.CLOUDINARY_UPLOAD_PRESET || "";
    const uploadFolder = config.uploadFolder || window.APP_CONFIG?.CLOUDINARY_UPLOAD_FOLDER || "learninghub/questions";
    const uploadUrl = config.uploadUrl || window.APP_CONFIG?.CLOUDINARY_UPLOAD_URL || (cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : "");
    if (!uploadUrl || !uploadPreset) {
      throw new Error("Thi\u1EBFu c\u1EA5u h\xECnh Cloudinary trong config.js.");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", uploadFolder);
    const res = await fetch(uploadUrl, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || "Upload Cloudinary th\u1EA5t b\u1EA1i");
    }
    return {
      id: data.public_id,
      public_id: data.public_id,
      src: data.secure_url,
      url: data.secure_url,
      width: data.width,
      height: data.height,
      source: "cloudinary"
    };
  }
  function calculateQuestionErrorRisk(newQuestionText, answerStr, hasImagePlaceholder = false) {
    const text = String(newQuestionText || "");
    const needsImg = /(hình vẽ|hình bên|đồ thị|bảng biến thiên|sơ đồ)/gi.test(text);
    if (hasImagePlaceholder || needsImg && !hasImagePlaceholder) {
      return { risk: "high", reason: "C\u1EA7n h\xECnh v\u1EBD/\u1EA3nh minh h\u1ECDa nh\u01B0ng ch\u01B0a c\xF3 \u1EA3nh th\u1EF1c t\u1EBF" };
    } else if ((answerStr || "").length > 1) {
      return { risk: "medium", reason: "C\xE2u ch\u1ECDn nhi\u1EC1u \u0111\xE1p \xE1n \u0111\xFAng, c\u1EA7n r\xE0 so\xE1t k\u1EF9" };
    } else {
      return { risk: "low", reason: null };
    }
  }

  // src/core/versionChecker.js
  var currentVersion = true ? "53e6f54" : null;
  var updateDetected = false;
  var lastCheckTime = 0;
  var CHECK_INTERVAL_MS = 60 * 1e3;
  var MIN_CHECK_GAP_MS = 15 * 1e3;
  async function fetchVersion() {
    try {
      const res = await fetch("/version.json?_t=" + Date.now(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache"
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.version ? String(data.version) : null;
    } catch (e) {
      return null;
    }
  }
  async function checkForUpdates() {
    if (updateDetected) return;
    const now = Date.now();
    if (now - lastCheckTime < MIN_CHECK_GAP_MS) return;
    lastCheckTime = now;
    const remoteVersion = await fetchVersion();
    if (!remoteVersion) return;
    if (!currentVersion) {
      currentVersion = remoteVersion;
      return;
    }
    if (remoteVersion !== currentVersion) {
      updateDetected = true;
      showUpdateNotification();
    }
  }
  function showUpdateNotification(opts) {
    const title = opts?.title || "C\xF3 phi\xEAn b\u1EA3n m\u1EDBi";
    const sub = opts?.sub || "C\u1EADp nh\u1EADt \u0111\u1EC3 t\u1EA3i giao di\u1EC7n v\xE0 d\u1EEF li\u1EC7u m\u1EDBi nh\u1EA5t";
    if (document.getElementById("lhUpdateBanner")) return;
    const styleId = "lhUpdateBannerStyles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
      .lh-update-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 20px;
        background: rgba(18, 24, 38, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-left: 4px solid #3b82f6;
        border-radius: 16px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(59, 130, 246, 0.25);
        backdrop-filter: blur(18px);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        animation: lhBannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes lhBannerSlideIn {
        from { opacity: 0; transform: translateY(24px) scale(0.94); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .lh-update-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      }
      .lh-update-icon svg {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: #ffffff;
        stroke-width: 2.2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .lh-update-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .lh-update-title {
        font-weight: 700;
        font-size: 14px;
        color: #ffffff;
        letter-spacing: -0.01em;
      }
      .lh-update-sub {
        font-size: 12px;
        color: #94a3b8;
      }
      .lh-update-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }
      .lh-update-btn {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        white-space: nowrap;
      }
      .lh-update-btn:hover {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(59, 130, 246, 0.5);
      }
      .lh-update-btn:active {
        transform: translateY(0);
      }
      .lh-update-close {
        background: transparent;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .lh-update-close:hover {
        color: #f1f5f9;
        background: rgba(255, 255, 255, 0.1);
      }
      @media (max-width: 640px) {
        .lh-update-banner {
          left: 12px;
          right: 12px;
          bottom: 16px;
          padding: 12px 14px;
          gap: 10px;
        }
        .lh-update-sub {
          display: none;
        }
      }
    `;
      document.head.appendChild(styleEl);
    }
    const banner = document.createElement("div");
    banner.id = "lhUpdateBanner";
    banner.className = "lh-update-banner";
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "assertive");
    banner.innerHTML = `
    <div class="lh-update-icon">
      <svg viewBox="0 0 24 24">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
        <path d="M16 16h5v5"></path>
      </svg>
    </div>
    <div class="lh-update-content">
      <span class="lh-update-title"></span>
      <span class="lh-update-sub"></span>
    </div>
    <div class="lh-update-actions">
      <button id="lhUpdateReloadBtn" class="lh-update-btn" type="button">C\u1EADp nh\u1EADt ngay</button>
      <button id="lhUpdateCloseBtn" class="lh-update-close" type="button" aria-label="\u0110\xF3ng th\xF4ng b\xE1o">
        <svg style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
    banner.querySelector(".lh-update-title").textContent = title;
    banner.querySelector(".lh-update-sub").textContent = sub;
    document.body.appendChild(banner);
    document.getElementById("lhUpdateReloadBtn")?.addEventListener("click", () => {
      window.location.reload();
    });
    document.getElementById("lhUpdateCloseBtn")?.addEventListener("click", () => {
      banner.remove();
    });
  }
  function initVersionChecker() {
    if (typeof window === "undefined") return;
    if (!currentVersion) {
      fetchVersion().then((v) => {
        if (v) currentVersion = v;
      });
    }
    setInterval(() => {
      checkForUpdates();
    }, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    });
    window.addEventListener("focus", () => {
      checkForUpdates();
    });
  }

  // src/core/log.js
  var MAX_KEEP = 80;
  var index = /* @__PURE__ */ new Map();
  var seq = 0;
  function describe(err2) {
    if (!err2) return String(err2);
    if (err2 instanceof Error) return (err2.name || "Error") + ": " + (err2.message || "");
    if (typeof err2 === "object") {
      try {
        return JSON.stringify(err2);
      } catch (_e) {
        return Object.prototype.toString.call(err2);
      }
    }
    return String(err2);
  }
  function lhWarn(tag, err2) {
    try {
      const label = String(tag || "unknown");
      const msg = describe(err2);
      const key2 = label + "|" + msg;
      let row = index.get(key2);
      if (!row) {
        row = { tag: label, error: msg, count: 0, at: "", seq: 0 };
        index.set(key2, row);
        if (index.size > MAX_KEEP) {
          let oldestKey = null, oldestSeq = Infinity;
          for (const [k, v] of index)
            if (v.seq < oldestSeq) {
              oldestSeq = v.seq;
              oldestKey = k;
            }
          if (oldestKey !== null) index.delete(oldestKey);
        }
      }
      row.count++;
      row.at = (/* @__PURE__ */ new Date()).toLocaleTimeString("vi-VN");
      row.seq = ++seq;
      if (row.count === 1) console.warn("[" + label + "]", err2);
      else if (row.count === 10 || row.count === 100 || row.count === 1e3) {
        console.warn("[" + label + "] l\u1EB7p l\u1EA1i " + row.count + " l\u1EA7n:", msg);
      }
    } catch (_e) {
    }
  }
  function lhErrors() {
    const rows = [...index.values()].sort((a, b) => b.seq - a.seq).map((r) => ({ tag: r.tag, error: r.error, count: r.count, at: r.at }));
    try {
      console.table(rows);
    } catch (_e) {
      console.log(rows);
    }
    return rows;
  }
  function lhClearErrors() {
    index.clear();
    seq = 0;
    return true;
  }
  if (typeof window !== "undefined") {
    window.lhWarn = lhWarn;
    window.lhErrors = lhErrors;
    window.lhClearErrors = lhClearErrors;
    window.addEventListener("error", (e) => lhWarn("window.onerror", e?.error || e?.message || e));
    window.addEventListener("unhandledrejection", (e) => lhWarn("unhandledRejection", e?.reason || e));
  }

  // src/core/mock.js
  var LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];
  function isMockMode() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("mock") !== "1") return false;
      if (!LOCAL_HOSTS.includes(location.hostname)) {
        console.warn("[MOCK] ?mock=1 ch\u1EC9 ho\u1EA1t \u0111\u1ED9ng tr\xEAn localhost \u2014 b\u1ECF qua.");
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  function readOptions() {
    const p = new URLSearchParams(location.search);
    const role = ["admin", "editor", "user"].includes(p.get("role")) ? p.get("role") : "user";
    return {
      role,
      pending: p.get("pending") === "1",
      blocked: p.get("blocked") === "1",
      fail: p.get("fail") || "",
      // '500' | '401' | '403' | ''
      subject: (p.get("subject") || "MOCK1").toUpperCase(),
      /*
        ADMIN_TWO_TIERS_20260729: vai admin trong mock mặc định là ADMIN HỆ THỐNG (đổi được
        cấu hình Discord). Thêm `&sysadmin=0` để giả lập ADMIN THƯỜNG — cần thiết vì hai cấp
        này nhìn khác nhau và bug hay nằm ở nhánh "bị hạn chế".
      */
      systemAdmin: role === "admin" && p.get("sysadmin") !== "0",
      reloadNotice: p.get("reload_notice") === "1"
    };
  }
  var MOCK_USER = {
    id: "mock-user-0000-0000",
    email: "mock@localhost",
    user_metadata: { full_name: "Ng\u01B0\u1EDDi D\xF9ng Mock", avatar_url: "" }
  };
  function mockProfile(opts) {
    return {
      id: MOCK_USER.id,
      user_id: MOCK_USER.id,
      email: MOCK_USER.email,
      full_name: "Ng\u01B0\u1EDDi D\xF9ng Mock",
      avatar_url: "",
      role: opts.role,
      current_subject: opts.subject,
      approved: !opts.pending,
      blocked: opts.blocked,
      force_logout: false
    };
  }
  var MOCK_CHAPTERS = [
    ["MOCK1_C1", "Ch\u01B0\u01A1ng 1", 34],
    ["MOCK1_C2", "Ch\u01B0\u01A1ng 2", 12],
    ["MOCK1_C3", "Ch\u01B0\u01A1ng 3", 8],
    ["MOCK1_C4", "Ch\u01B0\u01A1ng 4 t\xEAn r\u1EA5t d\xE0i \u0111\u1EC3 ki\u1EC3m tra tr\xE0n ch\u1EEF", 20]
  ];
  var mockFolderNewBadges = ["MOCK1"];
  function mockSubjects() {
    const make = (id, code, name, count) => ({
      id,
      code,
      name,
      description: `M\xF4n gi\u1EA3 l\u1EADp ${code} \u2014 d\u1EEF li\u1EC7u kh\xF4ng c\xF3 th\u1EADt`,
      cover: "",
      sort_order: id,
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      question_count: count,
      questions_count: count,
      count
    });
    return {
      folder_new_badges: [...mockFolderNewBadges],
      data: [
        make(1, "MOCK1", "M\xF4n Mock M\u1ED9t", 4),
        make(2, "MOCK2", "M\xF4n Mock Hai", 2),
        ...MOCK_CHAPTERS.map(([code, name, count], i) => make(3 + i, code, name, count))
      ]
    };
  }
  function mockQuestions(subjectCode) {
    const code = (subjectCode || "MOCK1").toUpperCase();
    const base = (num, question, options, answer, extra = {}) => ({
      id: `${code}-${num}`,
      subject_code: code,
      num,
      question,
      options,
      answer,
      answer_text: options[answer] || "",
      images: [],
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      has_image: false,
      error_risk: "low",
      error_risk_reason: "",
      ...extra
    });
    const all = {
      MOCK1: [
        base(1, "Th\u1EE7 \u0111\xF4 c\u1EE7a Vi\u1EC7t Nam l\xE0 g\xEC?", { A: "H\xE0 N\u1ED9i", B: "Hu\u1EBF", C: "\u0110\xE0 N\u1EB5ng", D: "C\u1EA7n Th\u01A1" }, "A"),
        base(2, "2 + 2 = ?", { A: "3", B: "4", C: "5", D: "22" }, "B"),
        base(3, "C\xE2u n\xE0y c\xF3 \u0111\xE1nh d\u1EA5u r\u1EE7i ro cao \u2014 d\xF9ng \u0111\u1EC3 ki\u1EC3m hi\u1EC3n th\u1ECB c\u1EA3nh b\xE1o.", { A: "\u0110\xFAng", B: "Sai" }, "A", {
          error_risk: "high",
          error_risk_reason: "C\xE2u gi\u1EA3 l\u1EADp \u0111\u1EC3 test giao di\u1EC7n c\u1EA3nh b\xE1o"
        }),
        base(4, "C\xE2u d\xE0i \u0111\u1EC3 ki\u1EC3m xu\u1ED1ng d\xF2ng: " + "n\u1ED9i dung l\u1EB7p l\u1EA1i nhi\u1EC1u l\u1EA7n. ".repeat(12), { A: "A", B: "B" }, "B")
      ],
      MOCK2: [
        base(1, "N\u01B0\u1EDBc s\xF4i \u1EDF bao nhi\xEAu \u0111\u1ED9 C (\xE1p su\u1EA5t th\u01B0\u1EDDng)?", { A: "90", B: "100", C: "110", D: "120" }, "B"),
        base(2, "HTML l\xE0 vi\u1EBFt t\u1EAFt c\u1EE7a g\xEC?", { A: "HyperText Markup Language", B: "Hot Mail" }, "A")
      ]
    };
    const chapter = MOCK_CHAPTERS.find(([c]) => c === code);
    if (chapter) {
      const n = chapter[2];
      return {
        data: Array.from(
          { length: n },
          (_, i) => base(
            i + 1,
            `[${code}] C\xE2u s\u1ED1 ${i + 1} \u2014 c\xE2u gi\u1EA3 l\u1EADp c\u1EE7a ${chapter[1]}.`,
            { A: "\u0110\xFAng", B: "Sai" },
            i % 2 ? "B" : "A"
          )
        )
      };
    }
    return { data: all[code] || [] };
  }
  function mockAdminDashboard(opts) {
    const subjects = mockSubjects().data;
    const questions = subjects.flatMap((s) => mockQuestions(s.code).data);
    return {
      profiles: [
        mockProfile({ ...opts, role: "admin" }),
        { ...mockProfile({ ...opts, role: "user" }), id: "mock-user-2", email: "user2@localhost" }
      ],
      questions,
      requests: [],
      history: [],
      logs: [],
      subjects,
      subject_requests: [],
      deleted_questions: [],
      deleted_subjects: [],
      folder_new_badges: [...mockFolderNewBadges],
      // SUBJECT_FOLDER_NEW_BADGE_20260729
      // ADMIN_TWO_TIERS_AND_DISCORD_TOGGLES_20260729: khớp đúng các khoá api/controllers/admin.js
      // gắn thêm vào response (TẦNG TRÊN CÙNG, không bọc trong `data`).
      is_system_admin: !!opts.systemAdmin,
      admin_tier: opts.systemAdmin ? "system" : opts.role === "admin" ? "normal" : null,
      discord_notifications: { ...mockDiscordSettings },
      discord_notification_kinds: MOCK_DISCORD_KINDS
    };
  }
  var MOCK_DISCORD_KINDS = [
    { key: "login", label: "\u0110\u0103ng nh\u1EADp", description: "C\xF3 ng\u01B0\u1EDDi \u0111\u0103ng nh\u1EADp web h\u1ECDc ho\u1EB7c trang admin.", default: true },
    {
      key: "action",
      label: "H\xE0nh \u0111\u1ED9ng c\u1EE7a admin / editor",
      description: "Duy\u1EC7t, t\u1EEB ch\u1ED1i, block, \u0111\u1ED5i vai tr\xF2, xo\xE1 m\xF4n\u2026 m\u1ED7i thao t\xE1c m\u1ED9t tin.",
      default: true
    },
    {
      key: "edit_request",
      label: "Y\xEAu c\u1EA7u s\u1EEDa c\xE2u h\u1ECFi",
      description: "Ng\u01B0\u1EDDi h\u1ECDc g\u1EEDi b\xE1o c\xE1o / \u0111\u1EC1 xu\u1EA5t s\u1EEDa m\u1ED9t c\xE2u h\u1ECFi.",
      default: true
    },
    {
      key: "question_edit",
      label: "N\u1ED9i dung c\xE2u h\u1ECFi b\u1ECB \u0111\u1ED5i (admin th\u01B0\u1EDDng / editor)",
      description: "Admin th\u01B0\u1EDDng ho\u1EB7c editor th\xEAm / s\u1EEDa / xo\xE1 / \u1EA9n m\u1ED9t c\xE2u h\u1ECFi, k\u1EC3 c\u1EA3 khi duy\u1EC7t y\xEAu c\u1EA7u s\u1EEDa. Thao t\xE1c c\u1EE7a admin h\u1EC7 th\u1ED1ng KH\xD4NG g\u1EEDi tin (\u0111\u1EE1 t\u1EF1 b\xE1o cho ch\xEDnh m\xECnh).",
      default: true
    },
    {
      key: "new_user",
      label: "Ng\u01B0\u1EDDi d\xF9ng m\u1EDBi \u0111\u0103ng k\xFD",
      description: "C\xF3 t\xE0i kho\u1EA3n Google m\u1EDBi v\xE0o h\u1EC7 th\u1ED1ng \u2014 k\xE8m tr\u1EA1ng th\xE1i ch\u1EDD duy\u1EC7t hay \u0111\u01B0\u1EE3c duy\u1EC7t t\u1EF1 \u0111\u1ED9ng.",
      default: true
    },
    {
      key: "role_change",
      label: "\u0110\u1ED5i quy\u1EC1n / kho\xE1 ng\u01B0\u1EDDi d\xF9ng",
      description: "C\u1EA5p ho\u1EB7c g\u1EE1 admin / editor, kho\xE1 \u2013 m\u1EDF kho\xE1, duy\u1EC7t \u2013 t\u1EEB ch\u1ED1i \u2013 thu h\u1ED3i duy\u1EC7t t\xE0i kho\u1EA3n.",
      default: true
    },
    {
      key: "destructive",
      label: "Thao t\xE1c n\u1EB7ng tr\xEAn m\xF4n h\u1ECDc (xo\xE1 / \u0111\u1ED5i m\xE3)",
      description: "Xo\xE1 m\xF4n, xo\xE1 v\u0129nh vi\u1EC5n m\xF4n k\xE8m to\xE0n b\u1ED9 c\xE2u h\u1ECFi, \u0111\u1ED5i m\xE3 m\xF4n.",
      default: true
    },
    {
      key: "subject_request",
      label: "Y\xEAu c\u1EA7u th\xEAm m\xF4n c\u1EE7a ng\u01B0\u1EDDi h\u1ECDc",
      description: "Ng\u01B0\u1EDDi h\u1ECDc g\u1EEDi m\u1ED9t m\xF4n m\u1EDBi ch\u1EDD admin duy\u1EC7t.",
      default: true
    },
    {
      key: "server_error",
      label: "L\u1ED7i server (500)",
      description: "API n\xE9m exception (tr\u1EA3 500 INTERNAL_ERROR). C\xF9ng m\u1ED9t l\u1ED7i ch\u1EC9 g\u1EEDi 1 tin m\u1ED7i 5 ph\xFAt, l\u1EA7n g\u1EEDi sau k\xE8m s\u1ED1 l\u1EA7n \u0111\xE3 b\u1ECB d\u1ED3n \u2014 tr\xE1nh spam khi l\u1ED7i l\u1EB7p li\xEAn t\u1EE5c.",
      default: true
    }
  ];
  var mockDiscordSettings = {
    login: true,
    action: true,
    edit_request: true,
    question_edit: true,
    new_user: true,
    role_change: true,
    destructive: true,
    subject_request: true,
    server_error: true
  };
  var SUBJECT_KEY = "learninghub_subject_code_merged_v1";
  var QCACHE_PREFIX = "learninghub_questions_cache_v2_";
  function seedMockSubject(opts) {
    try {
      localStorage.setItem(SUBJECT_KEY, opts.subject);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(QCACHE_PREFIX) && k.slice(QCACHE_PREFIX.length).startsWith("MOCK")) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      lhWarn("MOCK:seedSubject", e);
    }
  }
  function clearMockLeftovers() {
    try {
      if ((localStorage.getItem(SUBJECT_KEY) || "").startsWith("MOCK")) {
        localStorage.removeItem(SUBJECT_KEY);
        console.warn("[MOCK] \u0110\xE3 x\xF3a m\xF4n MOCK* c\xF2n s\xF3t trong localStorage.");
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(QCACHE_PREFIX) && k.slice(QCACHE_PREFIX.length).startsWith("MOCK")) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      lhWarn("MOCK:cleanup", e);
    }
  }
  function forceAdminAppVisible() {
    const apply = () => {
      document.getElementById("loginBox")?.classList.add("hidden");
      document.getElementById("denyBox")?.classList.add("hidden");
      document.getElementById("appBox")?.classList.remove("hidden");
    };
    const start = () => {
      if (!document.getElementById("appBox")) return;
      apply();
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          const id = m.target.id;
          if (id === "loginBox" || id === "denyBox") {
            if (!m.target.classList.contains("hidden")) apply();
          } else if (id === "appBox" && m.target.classList.contains("hidden")) {
            apply();
          }
        }
      });
      for (const id of ["loginBox", "denyBox", "appBox"]) {
        const el = document.getElementById(id);
        if (el) obs.observe(el, { attributes: true, attributeFilter: ["class"] });
      }
      window.__LH_MOCK_ADMIN_OBSERVER = obs;
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
  function fakeAdminAuthSession() {
    const sdk = window.supabase;
    if (!sdk || typeof sdk.createClient !== "function" || sdk.__lhMockAuth) return;
    if (!document.getElementById("appBox")) return;
    const realCreate = sdk.createClient.bind(sdk);
    const session = { access_token: "mock-token", token_type: "bearer", user: MOCK_USER };
    sdk.createClient = function() {
      const c = realCreate.apply(null, arguments);
      try {
        c.auth.getSession = async () => ({ data: { session }, error: null });
        c.auth.getUser = async () => ({ data: { user: MOCK_USER }, error: null });
        c.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {
        } } } });
      } catch (e) {
        lhWarn("MOCK:adminAuth", e);
      }
      return c;
    };
    sdk.__lhMockAuth = true;
  }
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
  function mockApiResponse(pathname, query, opts, body) {
    if (opts.fail === "500") {
      return jsonResponse({ error: "L\u1ED7i gi\u1EA3 l\u1EADp", code: "INTERNAL_ERROR" }, 500);
    }
    if (opts.fail === "401") {
      return jsonResponse({ error: "Phi\xEAn \u0111\u0103ng nh\u1EADp kh\xF4ng h\u1EE3p l\u1EC7", code: "UNAUTHORIZED" }, 401);
    }
    if (opts.blocked) {
      return jsonResponse({ error: "T\xE0i kho\u1EA3n \u0111\xE3 b\u1ECB kh\xF3a", code: "BLOCKED" }, 403);
    }
    if (opts.pending) {
      return jsonResponse({ error: "T\xE0i kho\u1EA3n ch\u01B0a \u0111\u01B0\u1EE3c ph\xEA duy\u1EC7t", code: "PENDING_APPROVAL" }, 403);
    }
    const route = pathname.replace(/^\/api\/?/, "").split("/")[0];
    switch (route) {
      case "subjects":
        return jsonResponse(mockSubjects());
      case "questions": {
        const subject = query.get("subject_code") || opts.subject;
        return jsonResponse(mockQuestions(subject));
      }
      case "profile":
        return jsonResponse({ data: mockProfile(opts), reload_notice: !!opts.reloadNotice });
      case "settings":
        return jsonResponse({ data: { maintenance: false, announcement: "" } });
      case "my-edit-requests":
      case "edit-requests":
      case "staff-edit-requests":
        return jsonResponse({ data: [] });
      case "admin-dashboard":
        return jsonResponse(mockAdminDashboard(opts));
      case "notify":
        return jsonResponse({ ok: true });
      case "admin-action": {
        const action = String(body?.action || "");
        if (action === "set_discord_notifications") {
          if (!opts.systemAdmin) {
            return jsonResponse(
              { error: "Ch\u1EC9 admin h\u1EC7 th\u1ED1ng m\u1EDBi \u0111\u01B0\u1EE3c \u0111\u1ED5i c\u1EA5u h\xECnh n\xE0y", code: "INSUFFICIENT_ROLE" },
              403
            );
          }
          const next = body?.payload?.notifications || {};
          for (const k of MOCK_DISCORD_KINDS) {
            if (Object.prototype.hasOwnProperty.call(next, k.key)) mockDiscordSettings[k.key] = !!next[k.key];
          }
          return jsonResponse({ ok: true, notifications: { ...mockDiscordSettings }, mock: true });
        }
        if (action === "set_subject_folder_new_badge") {
          const base = String(body?.payload?.base || "").toUpperCase();
          if (!base) return jsonResponse({ error: "Thi\u1EBFu m\xE3 g\u1ED1c th\u01B0 m\u1EE5c" }, 400);
          mockFolderNewBadges = body?.payload?.enabled ? [.../* @__PURE__ */ new Set([...mockFolderNewBadges, base])] : mockFolderNewBadges.filter((x) => x !== base);
          return jsonResponse({ ok: true, folder_new_badges: [...mockFolderNewBadges], mock: true });
        }
        return jsonResponse({ ok: true, data: null, mock: true });
      }
      default:
        return jsonResponse({ error: `Route gi\u1EA3 l\u1EADp ch\u01B0a h\u1ED7 tr\u1EE3: ${route}`, code: "NOT_FOUND" }, 404);
    }
  }
  function fakeSupabase(opts) {
    const profile2 = mockProfile(opts);
    const noop = () => {
    };
    return {
      init: async () => profile2,
      isReady: () => true,
      isAdmin: () => opts.role === "admin",
      canOpenDashboard: () => ["admin", "editor"].includes(opts.role),
      submitEditRequest: async () => ({ ok: true, mock: true }),
      loadQuestionsFromSupabase: async () => mockQuestions(opts.subject).data,
      openAuth: noop,
      openAdmin: () => {
        if (["admin", "editor"].includes(opts.role)) location.href = "admin.html?mock=1&role=" + opts.role;
        else alert("[MOCK] Vai hi\u1EC7n t\u1EA1i kh\xF4ng m\u1EDF \u0111\u01B0\u1EE3c dashboard. Th\u1EED ?mock=1&role=admin");
      },
      signOut: async () => {
        alert("[MOCK] signOut kh\xF4ng l\xE0m g\xEC trong ch\u1EBF \u0111\u1ED9 mock.");
      },
      signInGoogle: async () => {
        alert('[MOCK] \u0110\xE3 \u0111\u0103ng nh\u1EADp s\u1EB5n d\u01B0\u1EDBi vai "' + opts.role + '".');
      },
      getUser: () => MOCK_USER,
      getProfile: () => profile2,
      getSession: () => ({ access_token: "mock-token" }),
      __client: null,
      __mock: true
    };
  }
  var networkInstalled = false;
  function installMockNetwork() {
    if (networkInstalled) return;
    networkInstalled = true;
    const opts = readOptions();
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init2) => {
      let pathname = "";
      let query = new URLSearchParams();
      try {
        const u = new URL(typeof input === "string" ? input : input.url, location.origin);
        pathname = u.pathname;
        query = u.searchParams;
      } catch (e) {
        lhWarn("MOCK:url", e);
      }
      if (!pathname.startsWith("/api")) return realFetch(input, init2);
      const method = (init2?.method || "GET").toUpperCase();
      const label = query.get("subject_code") ? ` (${query.get("subject_code")})` : "";
      console.log(`[MOCK] ${method} ${pathname}${label} -> d\u1EEF li\u1EC7u gi\u1EA3`);
      let body = null;
      if (init2?.body && typeof init2.body === "string") {
        try {
          body = JSON.parse(init2.body);
        } catch (e) {
          lhWarn("MOCK:body", e);
        }
      }
      return mockApiResponse(pathname, query, opts, body);
    };
  }
  if (isMockMode()) installMockNetwork();
  function installMock() {
    if (!isMockMode()) return false;
    const opts = readOptions();
    seedMockSubject(opts);
    fakeAdminAuthSession();
    forceAdminAppVisible();
    try {
      Object.defineProperty(window, "__LH_ACCESS_OK", {
        get: () => true,
        set: () => {
        },
        configurable: true
      });
    } catch (e) {
      lhWarn("MOCK:gate", e);
      window.__LH_ACCESS_OK = true;
    }
    try {
      window.HODSupabase = fakeSupabase(opts);
    } catch (e) {
      lhWarn("MOCK:supabase", e);
    }
    window.__LH_MOCK = { ...opts, subjects: mockSubjects().data.map((s) => s.code) };
    const applySubject = () => {
      try {
        if (typeof window.setSubject === "function") window.setSubject(opts.subject);
        else if (typeof window.setSubjectHelper === "function") window.setSubjectHelper(opts.subject);
      } catch (e) {
        lhWarn("MOCK:setSubject", e);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(applySubject, 0));
    } else {
      setTimeout(applySubject, 0);
    }
    console.log(
      `%c[MOCK] \u0110ang ch\u1EA1y d\u1EEF li\u1EC7u GI\u1EA2 \u2014 kh\xF4ng c\xF3 DB, kh\xF4ng c\xF3 \u0111\u0103ng nh\u1EADp.
vai=${opts.role} approved=${!opts.pending} blocked=${opts.blocked}` + (opts.fail ? ` fail=${opts.fail}` : "") + `
M\xF4n: MOCK1 (4 c\xE2u), MOCK2 (2 c\xE2u). T\u1EAFt b\u1EB1ng c\xE1ch b\u1ECF ?mock=1 kh\u1ECFi URL.`,
      "background:#7c2d12;color:#fff;padding:2px 6px;border-radius:3px"
    );
    return true;
  }

  // src/admin/adminCore.js
  var CONFIG = {
    SUPABASE_URL: window.APP_CONFIG?.SUPABASE_URL || "https://kxyukiwhhorvxgxxxmfq.supabase.co",
    SUPABASE_ANON_KEY: window.APP_CONFIG?.SUPABASE_ANON_KEY || "sb_publishable_yOIciG2SCPyu8mP5KWE5RQ_qIgCd4-f"
  };
  var client;
  var user;
  var profile;
  var activeStatus = "all";
  var cache = { profiles: [], questions: [], requests: [], history: [], logs: [], folder_new_badges: [] };
  var $ = (id) => document.getElementById(id);
  var esc = (s) => String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]
  );
  function safe(o) {
    try {
      return JSON.stringify(o, null, 2);
    } catch (e) {
      return String(o);
    }
  }
  function isBlocked(p) {
    return !!(p?.blocked || p?.is_blocked || p?.status === "blocked");
  }
  function isAdmin() {
    return profile?.role === "admin" && !isBlocked(profile);
  }
  function isEditor() {
    return ["admin", "editor"].includes(profile?.role) && !isBlocked(profile);
  }
  function date(d) {
    if (!d) return "Ch\u01B0a c\xF3";
    try {
      return new Date(d).toLocaleString("vi-VN");
    } catch (e) {
      return d;
    }
  }
  function toast(t) {
    $("toast").textContent = t;
    $("toast").classList.remove("hidden");
    setTimeout(() => $("toast").classList.add("hidden"), 1800);
  }
  function err(t) {
    $("errorBox").textContent = typeof t === "string" ? t.replace(/<[^>]*>/g, "") : String(t);
    $("errorBox").classList.remove("hidden");
  }
  function clearErr() {
    $("errorBox").classList.add("hidden");
  }
  function setBusy(on, label = "\u0110ang t\u1EA3i...") {
    document.body.classList.toggle("is-busy", !!on);
    $("refreshBtn").disabled = !!on;
    $("refreshBtn").textContent = on ? label : "T\u1EA3i l\u1EA1i";
  }
  function hideProgress() {
    const el = $("adminProgressOverlay");
    if (el) el.classList.add("hidden");
  }
  (function() {
    if (window.__FIX_ADMIN_DASHBOARD_DEDUP_20260705) return;
    window.__FIX_ADMIN_DASHBOARD_DEDUP_20260705 = true;
    const TTL_MS = 4e3;
    let inflight = null, lastResult = null, lastAt = 0;
    window.__adminDashboardBusy = function() {
      return !!inflight;
    };
    window.__adminDashboardLoadedOnce = false;
    window.__invalidateAdminDashboardCache = function() {
      lastResult = null;
      lastAt = 0;
    };
    window.__fetchAdminDashboardJSON = async function(force) {
      if (!force && lastResult && Date.now() - lastAt < TTL_MS) return lastResult;
      if (inflight) return inflight;
      inflight = (async () => {
        try {
          const res = await fetch("/api/admin-dashboard", { cache: "no-store" });
          const text = await res.text().catch(() => "");
          let dash = {};
          try {
            dash = JSON.parse(text) || {};
          } catch (e) {
            lhWarn("FIX_ADMIN_DASHBOARD_DEDUP_20260705", e);
          }
          const out = { ok: res.ok, status: res.status, dash, text };
          if (res.ok && !dash.error) {
            lastResult = out;
            lastAt = Date.now();
            window.__adminDashboardLoadedOnce = true;
          }
          return out;
        } finally {
          inflight = null;
        }
      })();
      return inflight;
    };
  })();
  function createTursoClientMock(supaClient) {
    let localCache = null;
    let cachePromise = null;
    async function fetchDashboardData() {
      if (cachePromise) return cachePromise;
      cachePromise = (async () => {
        try {
          const r = await window.__fetchAdminDashboardJSON();
          const data = r.dash || {};
          if (!r.ok || data.error) throw new Error(data.error || "HTTP " + r.status);
          normalizeDashboardData(data);
          localCache = data;
          return data;
        } catch (err2) {
          console.error("[fetchDashboardData Error]", err2);
          throw err2;
        } finally {
          cachePromise = null;
        }
      })();
      return cachePromise;
    }
    function getUserId() {
      return user?.id || supaClient.auth.getUser()?.id || "";
    }
    function parseMaybeJson(v, fallback) {
      if (v === null || v === void 0 || v === "") return fallback;
      if (typeof v !== "string") return v;
      try {
        return JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    }
    function normalizeDashboardData(data) {
      if (!data) return data;
      const normalizeQuestion = (q) => {
        if (!q) return q;
        q.options = parseMaybeJson(q.options, {});
        q.images = parseMaybeJson(q.images, []);
        q.is_active = !(q.is_active === 0 || q.is_active === false || q.is_active === "0");
        q.has_image = q.has_image === 1 || q.has_image === true || q.has_image === "1";
        return q;
      };
      const normalizeJsonCols = (row) => {
        if (!row) return row;
        ["old_data", "new_data", "previous_data", "questions_data", "original_data", "details"].forEach((k) => {
          if (k in row) row[k] = parseMaybeJson(row[k], k === "questions_data" ? [] : {});
        });
        return row;
      };
      data.questions = (data.questions || []).map(normalizeQuestion);
      data.requests = (data.requests || []).map(normalizeJsonCols);
      data.history = (data.history || []).map(normalizeJsonCols);
      data.logs = (data.logs || []).map(normalizeJsonCols);
      data.subject_requests = (data.subject_requests || []).map(normalizeJsonCols);
      data.deleted_questions = (data.deleted_questions || []).map(normalizeJsonCols);
      data.deleted_subjects = (data.deleted_subjects || []).map(normalizeJsonCols);
      data.profiles = (data.profiles || []).map((p) => {
        p.approved = p.approved === 1 || p.approved === true || p.approved === "1";
        p.blocked = p.blocked === 1 || p.blocked === true || p.blocked === "1";
        return p;
      });
      return data;
    }
    const builder = (tableName) => {
      let queryType = "";
      let selectCols = "";
      let filters = [];
      let payload = null;
      let orderCols = [];
      let limitVal = null;
      let rangeFrom = null;
      let rangeTo = null;
      let lastCount = null;
      let singleMode = false;
      let maybeSingleMode = false;
      const chain = {
        select: (cols) => {
          if (!queryType || queryType === "select") {
            queryType = "select";
          }
          selectCols = cols || "*";
          return chain;
        },
        range: (from, to) => {
          rangeFrom = Number(from) || 0;
          rangeTo = Number(to);
          return chain;
        },
        eq: (col, val) => {
          filters.push({ col, val });
          return chain;
        },
        neq: (col, val) => {
          filters.push({ col, val, op: "neq" });
          return chain;
        },
        in: (col, vals) => {
          filters.push({ col, val: vals, op: "in" });
          return chain;
        },
        or: (expr) => {
          filters.push({ col: "or", val: expr, op: "or" });
          return chain;
        },
        order: (col, opts) => {
          orderCols.push({ col, opts: opts || {} });
          return chain;
        },
        limit: (val) => {
          limitVal = val;
          return chain;
        },
        insert: (data) => {
          queryType = "insert";
          payload = data;
          return chain;
        },
        update: (data) => {
          queryType = "update";
          payload = data;
          return chain;
        },
        upsert: (data) => {
          queryType = "upsert";
          payload = data;
          return chain;
        },
        delete: () => {
          queryType = "delete";
          return chain;
        },
        single: () => {
          singleMode = true;
          return chain;
        },
        maybeSingle: () => {
          maybeSingleMode = true;
          return chain;
        },
        then: async (onfulfilled, onrejected) => {
          try {
            const resData = await executeQuery();
            return onfulfilled({ data: resData, count: lastCount, error: null });
          } catch (err2) {
            console.error("[Mock Execution Error]", err2);
            if (onrejected) return onrejected({ data: null, error: err2 });
            return { data: null, error: err2 };
          }
        }
      };
      async function executeQuery() {
        if (queryType === "select") {
          if (!localCache) {
            await fetchDashboardData();
          }
          let list = [];
          if (tableName === "profiles") list = localCache.profiles || [];
          else if (tableName === "questions") list = localCache.questions || [];
          else if (tableName === "edit_requests") list = localCache.requests || [];
          else if (tableName === "question_history") list = localCache.history || [];
          else if (tableName === "admin_logs") list = localCache.logs || [];
          else if (tableName === "subjects") list = localCache.subjects || [];
          else if (tableName === "subject_requests") list = localCache.subject_requests || [];
          else if (tableName === "deleted_questions") list = localCache.deleted_questions || [];
          else if (tableName === "deleted_subjects") list = localCache.deleted_subjects || [];
          let filtered = [...list];
          for (const f of filters) {
            if (f.op === "neq") {
              filtered = filtered.filter((x) => x[f.col] !== f.val);
            } else if (f.op === "in") {
              filtered = filtered.filter((x) => Array.isArray(f.val) ? f.val.includes(x[f.col]) : false);
            } else if (f.op === "or") {
              const exprs = String(f.val).split(",");
              filtered = filtered.filter((x) => {
                return exprs.some((exp) => {
                  const parts = exp.split(".");
                  const colName = parts[0];
                  const op = parts[1];
                  const target = parts.slice(2).join(".");
                  if (op === "eq") return String(x[colName] || "").toUpperCase() === String(target || "").toUpperCase();
                  if (op === "like" || op === "ilike") {
                    const pattern = String(target || "").replace(/%/g, "").toUpperCase();
                    return String(x[colName] || "").toUpperCase().includes(pattern);
                  }
                  return false;
                });
              });
            } else {
              filtered = filtered.filter((x) => {
                if (f.col === "id") return String(x[f.col]) === String(f.val);
                return x[f.col] === f.val;
              });
            }
          }
          if (orderCols.length) {
            filtered.sort((a, b) => {
              for (const o of orderCols) {
                const asc = o.opts.ascending !== false;
                const va = a[o.col], vb = b[o.col];
                if (va < vb) return asc ? -1 : 1;
                if (va > vb) return asc ? 1 : -1;
              }
              return 0;
            });
          }
          lastCount = filtered.length;
          if (limitVal) {
            filtered = filtered.slice(0, limitVal);
          }
          if (rangeFrom !== null) {
            filtered = filtered.slice(rangeFrom, Number.isFinite(rangeTo) ? rangeTo + 1 : void 0);
          }
          if (tableName === "site_settings") {
            const keyFilter = filters.find((f) => f.col === "key");
            if (keyFilter) {
              const val = keyFilter.val;
              const match2 = list.find((x) => x.key === val);
              filtered = match2 ? [match2] : [];
            }
          }
          if (singleMode || maybeSingleMode) {
            return filtered[0] || null;
          }
          return filtered;
        }
        const idFilter = filters.find((f) => f.col === "id");
        const idVal = idFilter ? idFilter.val : null;
        const codeFilter = filters.find((f) => f.col === "code");
        const codeVal = codeFilter ? codeFilter.val : null;
        let apiAction = "";
        let apiPayload = {};
        if (queryType === "update") {
          if (tableName === "edit_requests") {
            if (payload.status === "approved") {
              apiAction = "approve_request";
              apiPayload = { request_id: idVal };
            } else if (payload.status === "rejected") {
              apiAction = "reject_request";
              apiPayload = { request_id: idVal, admin_note: payload.admin_note };
            }
          } else if (tableName === "questions") {
            if (payload.is_active === false || payload.is_active === 0) {
              apiAction = "delete_question";
              apiPayload = { question_id: idVal };
            } else if (payload.is_active === true || payload.is_active === 1) {
              apiAction = "restore_question";
              apiPayload = { question_id: idVal };
            } else {
              apiAction = "save_question_direct";
              const oldQ = (localCache && localCache.questions || []).find((x) => String(x.id) === String(idVal)) || {};
              apiPayload = { question_id: idVal, new_data: payload, old_data: oldQ };
            }
          } else if (tableName === "profiles") {
            if (payload.blocked !== void 0) {
              apiAction = "toggle_user_block";
              apiPayload = { target_user_id: idVal, blocked: payload.blocked };
            } else if (payload.role !== void 0) {
              apiAction = "set_user_role";
              apiPayload = { target_user_id: idVal, role: payload.role };
            } else if (payload.approved === true || payload.approved === 1) {
              apiAction = "approve_user_registration";
              apiPayload = { target_user_id: idVal };
            } else if (payload.approved === false || payload.approved === 0) {
              apiAction = "reject_user_registration";
              apiPayload = { target_user_id: idVal };
            }
          } else if (tableName === "subjects") {
            if (payload.is_active === false || payload.is_active === 0) {
              apiAction = "delete_subject";
              apiPayload = { subject_id: idVal };
            } else if (payload.is_active === true || payload.is_active === 1) {
              apiAction = "restore_subject";
              apiPayload = { subject_id: idVal, code: payload.code };
            } else {
              apiAction = "edit_subject";
              const subjectId = idVal || codeVal && (localCache?.subjects || []).find((s) => String(s.code) === String(codeVal))?.id;
              apiPayload = {
                id: subjectId,
                name: payload.name,
                description: payload.description,
                cover: payload.cover,
                sort_order: payload.sort_order
              };
            }
          } else if (tableName === "subject_requests") {
            if (payload.status === "approved") {
              apiAction = "approve_subject_request";
              apiPayload = { request_id: idVal };
            } else if (payload.status === "rejected") {
              apiAction = "reject_subject_request";
              apiPayload = { request_id: idVal, admin_note: payload.admin_note };
            }
          }
        } else if (queryType === "insert") {
          if (tableName === "subjects") {
            apiAction = "add_subject";
            apiPayload = payload;
          } else if (tableName === "questions") {
            apiAction = "add_question";
            apiPayload = { question_data: payload };
          } else if (tableName === "subject_requests") {
            apiAction = "add_subject_request";
            apiPayload = payload;
          } else if (tableName === "deleted_questions") {
            return payload;
          } else if (tableName === "admin_logs") {
            return payload;
          }
        } else if (queryType === "delete") {
          if (tableName === "profiles") {
            apiAction = "reject_user_registration";
            apiPayload = { target_user_id: idVal };
          } else if (tableName === "questions") {
            apiAction = "permanent_delete_question";
            apiPayload = { question_id: idVal };
          }
        } else if (queryType === "upsert" && tableName === "site_settings") {
          apiAction = "set_registration_mode";
          apiPayload = { mode: payload.value };
        }
        if (!apiAction) {
          return { ok: true };
        }
        const res = await fetch("/api/admin-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: getUserId(),
            action: apiAction,
            payload: apiPayload
          })
        });
        const r = await res.json();
        if (r.error) throw new Error(r.error);
        localCache = null;
        return r;
      }
      return chain;
    };
    return {
      from: builder,
      auth: supaClient.auth,
      clearCache: () => {
        localCache = null;
        cachePromise = null;
      }
    };
  }
  async function init() {
    if (!window.supabase) return alert("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c Supabase");
    const baseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    if (window.APP_CONFIG?.USE_TURSO_API) {
      client = createTursoClientMock(baseClient);
    } else {
      client = baseClient;
    }
    bind();
    const s = await client.auth.getSession();
    user = s.data.session?.user;
    if (!user) return show("login");
    await loadProfile();
    if (!profile) return;
    if (!isEditor()) {
      __lhSetDenyMessage("Kh\xF4ng c\xF3 quy\u1EC1n", "T\xE0i kho\u1EA3n n\xE0y kh\xF4ng ph\u1EA3i admin/editor.");
      return show("deny");
    }
    show("app");
    await loadAll();
    try {
      var savedPage = sessionStorage.getItem("admin_current_page");
      var savedName = sessionStorage.getItem("admin_current_page_name");
      if (savedPage && savedPage !== "overview") {
        var navBtn = document.querySelector('.nav[data-page="' + savedPage + '"]');
        if (navBtn) {
          setPage(savedPage, savedName || navBtn.textContent.trim());
          if (savedPage === "subjectsAdmin" && typeof window.loadSubjectsAdmin === "function") window.loadSubjectsAdmin();
          if (savedPage === "approvals" && typeof loadRegistrationMode === "function") loadRegistrationMode();
          if (savedPage === "trash" && typeof window.loadTrash === "function") window.loadTrash();
          if (savedPage === "subjectRequests" && typeof window.loadSubjectRequests === "function")
            window.loadSubjectRequests();
          if (savedPage === "discordSettings" && typeof window.renderDiscordSettings === "function")
            window.renderDiscordSettings();
        }
      }
    } catch (e) {
      lhWarn("adminCore", e);
    }
  }
  function bind() {
    $("googleBtn").onclick = () => client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.href.split("#")[0] }
    }).catch((e) => {
      console.warn("OAuth error:", e);
      alert("\u0110\u0103ng nh\u1EADp th\u1EA5t b\u1EA1i: " + (e.message || e));
    });
    $("logoutBtn").onclick = logout;
    $("denyLogout").onclick = logout;
    $("openStudy").onclick = () => open("index.html", "_blank");
    $("refreshBtn").onclick = () => window.loadAll?.();
    $("exportBtn").onclick = exportAll;
    $("search").oninput = function() {
      render();
      if (typeof renderApprovals === "function" && document.getElementById("approvals")?.classList.contains("active"))
        renderApprovals();
    };
    $("closeModal").onclick = closeModal;
    $("modal").addEventListener("mousedown", (e) => {
      if (e.target === $("modal")) closeModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
    document.querySelectorAll(".nav").forEach((b) => {
      b.onclick = () => setPage(b.dataset.page, b.textContent.trim());
    });
    document.querySelectorAll(".filter").forEach((b) => {
      b.onclick = () => {
        activeStatus = b.dataset.status;
        document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("active", x === b));
        render();
      };
    });
  }
  async function logout() {
    sessionStorage.removeItem("is_logged_in");
    await client.auth.signOut();
    show("login");
  }
  function show(x) {
    $("loginBox").classList.toggle("hidden", x !== "login");
    $("denyBox").classList.toggle("hidden", x !== "deny");
    $("appBox").classList.toggle("hidden", x !== "app");
  }
  function __lhSetDenyMessage(title, message) {
    const box = document.getElementById("denyBox");
    if (!box) return;
    const h = box.querySelector("h2");
    const p = box.querySelector("p");
    if (h) h.textContent = title;
    if (p) p.textContent = message;
  }
  window.__lhShowAccessError = function(message) {
    __lhSetDenyMessage("Kh\xF4ng th\u1EC3 ki\u1EC3m tra quy\u1EC1n", message || "Kh\xF4ng th\u1EC3 ki\u1EC3m tra quy\u1EC1n, vui l\xF2ng th\u1EED l\u1EA1i.");
    show("deny");
  };
  window.handleAccessRevoked = function(reason, code) {
    if (window.__LH_ADMIN_REVOKING) return;
    window.__LH_ADMIN_REVOKING = true;
    console.warn("[Admin] Thu h\u1ED3i quy\u1EC1n:", reason, "| code:", code);
    try {
      if (typeof cache === "object" && cache) {
        Object.keys(cache).forEach((k) => {
          if (Array.isArray(cache[k])) cache[k] = [];
        });
      }
    } catch (e) {
      lhWarn("adminCore", e);
    }
    try {
      window.__adminDashRenderedText = "";
    } catch (e) {
      lhWarn("adminCore", e);
    }
    try {
      if (typeof window.clearAdminImageCaches === "function") window.clearAdminImageCaches();
    } catch (e) {
      lhWarn("adminCore", e);
    }
    if (code === "BLOCKED") {
      __lhSetDenyMessage("T\xE0i kho\u1EA3n b\u1ECB kh\xF3a", "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB qu\u1EA3n tr\u1ECB vi\xEAn kh\xF3a. B\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u0103ng xu\u1EA5t.");
    } else if (code === "UNAUTHORIZED") {
      __lhSetDenyMessage("Phi\xEAn \u0111\u0103ng nh\u1EADp \u0111\xE3 h\u1EBFt h\u1EA1n", "Vui l\xF2ng \u0111\u0103ng nh\u1EADp l\u1EA1i.");
    } else if (code === "PENDING_APPROVAL") {
      __lhSetDenyMessage("Ch\u1EDD ph\xEA duy\u1EC7t", "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n ch\u01B0a \u0111\u01B0\u1EE3c ph\xEA duy\u1EC7t ho\u1EB7c v\u1EEBa b\u1ECB thu h\u1ED3i quy\u1EC1n.");
    } else {
      __lhSetDenyMessage("Kh\xF4ng c\xF3 quy\u1EC1n", reason || "B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp trang qu\u1EA3n tr\u1ECB.");
    }
    show("deny");
    if (code === "BLOCKED" || code === "UNAUTHORIZED") {
      try {
        sessionStorage.removeItem("is_logged_in");
      } catch (e) {
        lhWarn("adminCore", e);
      }
      try {
        client?.auth?.signOut?.();
      } catch (e) {
        lhWarn("adminCore", e);
      }
    }
    setTimeout(() => {
      window.__LH_ADMIN_REVOKING = false;
    }, 3e3);
  };
  function cleanPageName(n) {
    return String(n || "").replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s*\d+\s*$/, "").replace(/\s+/g, " ").trim();
  }
  function setPage(id, n) {
    n = cleanPageName(n);
    document.querySelectorAll(".nav").forEach((x) => x.classList.toggle("active", x.dataset.page === id));
    document.querySelectorAll(".page").forEach((x) => x.classList.toggle("active", x.id === id));
    $("crumb").textContent = n;
    $("title").textContent = n;
    try {
      sessionStorage.setItem("admin_current_page", id);
      sessionStorage.setItem("admin_current_page_name", n);
    } catch (e) {
      lhWarn("adminCore", e);
    }
    render();
  }
  async function loadProfile() {
    try {
      const md = user.user_metadata || {};
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: md.full_name || md.name || "",
          avatar_url: md.avatar_url || md.picture || ""
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.handleAccessRevoked(out.error, out.code || (res.status === 401 ? "UNAUTHORIZED" : "PENDING_APPROVAL"));
        } else {
          window.__lhShowAccessError("Kh\xF4ng th\u1EC3 ki\u1EC3m tra quy\u1EC1n, vui l\xF2ng th\u1EED l\u1EA1i.");
        }
        profile = null;
        return;
      }
      profile = out.data || { id: user.id, email: user.email, role: "user" };
    } catch (e) {
      console.warn("[admin loadProfile]", e);
      window.__lhShowAccessError("Kh\xF4ng th\u1EC3 ki\u1EC3m tra quy\u1EC1n, vui l\xF2ng th\u1EED l\u1EA1i.");
      profile = null;
      return;
    }
    $("adminChip").textContent = `${profile.email || user.email} \xB7 ${profile.role}`;
    document.body.classList.toggle("role-admin", isAdmin());
    if (profile) {
      const isAlreadyNotified = sessionStorage.getItem("is_logged_in");
      if (!isAlreadyNotified) {
        sessionStorage.setItem("is_logged_in", "true");
        sendLoginToDiscord(profile.email || user.email, profile.role || "user").catch(
          (e) => console.warn("sendLoginToDiscord failed:", e)
        );
      }
    }
  }
  async function logAction(a, t, id, d) {
    if (!isAdmin() || !user) return;
    sendActionToDiscord(a, t, id, d).catch((e) => console.warn("logAction (Discord) failed:", e));
  }
  async function adminAction(action, payload) {
    if (!user) {
      alert("Ch\u01B0a \u0111\u0103ng nh\u1EADp.");
      return false;
    }
    try {
      const res = await fetch("/api/admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ user_id: user.id, action, payload: payload || {} })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) {
        alert("Thao t\xE1c th\u1EA5t b\u1EA1i: " + (out.error || res.status));
        return false;
      }
      return out;
    } catch (e) {
      alert("L\u1ED7i m\u1EA1ng: " + (e.message || e));
      return false;
    }
  }
  window.adminAction = adminAction;
  function key() {
    return ($("search").value || "").trim().toLowerCase();
  }
  function match(t) {
    return !key() || String(t || "").toLowerCase().includes(key());
  }
  function badge(s) {
    return `<span class="badge ${esc(s)}">${esc(s || "unknown")}</span>`;
  }
  function questionLabel(r) {
    return r.question_num || r.question_id || r.num || r.id || "?";
  }
  function subjectLabel(row) {
    const code = row?.subject_code || row?.old_data?.subject_code || row?.new_data?.subject_code || "";
    if (!code) return "Ch\u01B0a r\xF5 m\xF4n";
    const subject = (cache.subjects || []).find((s) => String(s.code || "").toUpperCase() === String(code).toUpperCase());
    return subject?.name ? `${code} \u2014 ${subject.name}` : String(code);
  }
  function getQuestionByReq(r) {
    return cache.questions.find((q) => q.id === r.question_id || q.num === r.question_num);
  }
  function hasAdminImageValue(v) {
    if (!v) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") {
      const s = v.trim();
      return !!s && s !== "[]" && s !== "{}" && s.toLowerCase() !== "kh\xF4ng c\xF3";
    }
    if (typeof v === "object") return Object.keys(v).length > 0;
    return false;
  }
  function shouldShowAdminDiffField(field, oldData, newData) {
    if (field === "answer_text") return false;
    if (field === "images") {
      const changed = safe(oldData?.[field]) !== safe(newData?.[field]);
      return changed && (hasAdminImageValue(oldData?.[field]) || hasAdminImageValue(newData?.[field]));
    }
    return true;
  }
  function changedFieldKeys(oldData, newData) {
    return ["question", "answer", "options", "images"].filter((k) => {
      if (!shouldShowAdminDiffField(k, oldData, newData)) return false;
      return safe(oldData?.[k]) !== safe(newData?.[k]);
    });
  }
  function changedFields(r) {
    const oldData = r.old_data || getQuestionByReq(r) || {};
    const newData = r.new_data || {};
    return changedFieldKeys(oldData, newData);
  }
  function render() {
    renderStats();
    renderRequests();
    renderUsers();
    renderHistory();
    renderLogs();
  }
  function renderStats() {
    const pending = cache.requests.filter((x) => x.status === "pending");
    $("statUsers").textContent = cache.profiles.length;
    $("statEditors").textContent = cache.profiles.filter((x) => x.role === "editor").length;
    $("statPending").textContent = pending.length;
    $("statBlocked").textContent = cache.profiles.filter(isBlocked).length;
    const pendingApproval = cache.profiles.filter((p) => p.approved === false).length;
    const elPA = $("statPendingApproval");
    if (elPA) elPA.textContent = pendingApproval;
    $("recentRequests").innerHTML = pending.slice(0, 5).map(reqHTML).join("") || "<p class=muted>Kh\xF4ng c\xF3.</p>";
    $("recentLogs").innerHTML = isAdmin() ? cache.logs.slice(0, 7).map(logHTML).join("") || "<p class=muted>Ch\u01B0a c\xF3.</p>" : "<p class=muted>Ch\u1EC9 admin xem \u0111\u01B0\u1EE3c logs.</p>";
  }
  function reqHTML(r) {
    const fields = changedFields(r);
    const userText = r.user_email || r.email || r.user_id || "Kh\xF4ng r\xF5 user";
    const subject = subjectLabel(r);
    return `<div class="item reqItem ${esc(r.status || "")}">
    <div class="head">
      <div>
        <b>${esc(subject)} \xB7 C\xE2u ${esc(questionLabel(r))}</b>
        <p class="muted">${esc(date(r.created_at))} \xB7 ${esc(userText)}</p>
      </div>
      ${badge(r.status)}
    </div>
    <div class="changeChips">${fields.map((f) => `<span>${esc(labelField(f))}</span>`).join("") || "<span>Ch\u01B0a r\xF5 thay \u0111\u1ED5i</span>"}</div>
    <div class="actions">
      <button class="act" onclick="viewReq(${r.id})">So s\xE1nh</button>
      ${r.status === "pending" ? `<button class="act ok" onclick="approve(${r.id})">Duy\u1EC7t</button><button class="act bad" onclick="rejectReq(${r.id})">T\u1EEB ch\u1ED1i</button>` : ""}
    </div>
  </div>`;
  }
  function labelField(f) {
    return { question: "C\xE2u h\u1ECFi", answer: "\u0110\xE1p \xE1n", answer_text: "Gi\u1EA3i th\xEDch", options: "L\u1EF1a ch\u1ECDn", images: "\u1EA2nh" }[f] || f;
  }
  function updateRequestBadge() {
    const pending = (cache.requests || []).filter((r) => r.status === "pending").length;
    const el = document.getElementById("requestBadge");
    if (!el) return;
    el.textContent = pending;
    el.classList.toggle("hidden", pending === 0);
  }
  window.updateRequestBadge = updateRequestBadge;
  function renderRequests() {
    const all = cache.requests || [];
    const cnt = { pending: 0, approved: 0, rejected: 0 };
    all.forEach((r) => {
      if (cnt[r.status] !== void 0) cnt[r.status]++;
    });
    updateRequestBadge();
    const setCount = (id, v) => {
      const el = $(id);
      if (el) el.textContent = v;
    };
    setCount("countAll", all.length);
    setCount("countPending", cnt.pending);
    setCount("countApproved", cnt.approved);
    setCount("countRejected", cnt.rejected);
    const arr = all.filter((r) => (activeStatus === "all" || r.status === activeStatus) && match(safe(r)));
    $("requestList").innerHTML = arr.map(reqHTML).join("") || "<p class=muted>Kh\xF4ng c\xF3.</p>";
  }
  function logHTML(l) {
    return `<div class=item><div class=head><b>${esc(l.action)}</b><span class=muted>${esc(date(l.created_at))}</span></div><p class=muted>${esc(l.admin_email || "")} \xB7 ${esc(l.target_type || "")} ${esc(l.target_id || "")}</p></div>`;
  }
  function renderLogs() {
    $("logList").innerHTML = isAdmin() ? cache.logs.filter((l) => match(safe(l))).map(logHTML).join("") || "<p class=muted>Ch\u01B0a c\xF3.</p>" : "<p class=muted>Editor kh\xF4ng c\xF3 quy\u1EC1n xem admin logs.</p>";
  }
  function openModal(t, b) {
    $("modalTitle").textContent = t;
    $("modalBody").innerHTML = b;
    $("modal").classList.remove("hidden");
  }
  function closeModal() {
    $("modal").classList.add("hidden");
  }
  window.lhCloseModal = closeModal;
  function formatValue(v) {
    if (Array.isArray(v)) return v.length ? `${v.length} \u1EA3nh` : "Kh\xF4ng c\xF3";
    if (typeof v === "object" && v)
      return Object.entries(v).map(([k, val]) => `${k}. ${val}`).join("\n");
    return String(v ?? "");
  }
  function viewUserEdits(uid) {
    const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
    const email = p?.email || p?.id || uid;
    const req = (cache.requests || []).filter((r) => String(r.user_id) === String(uid)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const his = (cache.history || []).filter((h) => String(h.changed_by) === String(uid)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    function hisCard(h) {
      const subject = (typeof realSubjectCode === "function" ? realSubjectCode(h) : h.subject_code) || "";
      const no = (typeof realQuestionNum === "function" ? realQuestionNum(h) : h.question_num || h.question_id) || "?";
      const titleText = (typeof historyTitle === "function" ? historyTitle(h) : "") || "";
      const keys = typeof changedFieldKeys === "function" ? changedFieldKeys(h.previous_data || {}, h.new_data || {}) : [];
      const chipsHtml = keys.length ? keys.map((k) => `<span class="changeChip">${esc(labelField(k))}</span>`).join("") : '<span class="changeChip dimChip">Ch\u01B0a r\xF5 thay \u0111\u1ED5i</span>';
      const hid = esc(String(h.id || h.question_id || ""));
      return `<div class="uhItem"><div class="uhItemRow"><div class="uhItemLeft">` + (subject ? `<span class="uhSubjectTag">${esc(subject)}</span>` : "") + `<b class="uhQNum">C\xE2u ${esc(String(no))}</b>` + (titleText ? `<div class="uhQText">${esc(titleText)}</div>` : "") + `<div class="uhChips changeChips">${chipsHtml}</div></div><div class="uhItemRight"><span class="muted uhTime">${esc(date(h.created_at))}</span><button class="act" onclick="viewHistoryFixed('${hid}')">Tr\u01B0\u1EDBc/sau</button></div></div></div>`;
    }
    const reqHtml = req.length ? req.map(reqHTML).join("") : '<p class="muted" style="padding:6px 2px 12px;font-size:.82rem">Ch\u01B0a g\u1EEDi y\xEAu c\u1EA7u s\u1EEDa c\xE2u n\xE0o.</p>';
    const hisHtml = his.length ? his.map(hisCard).join("") : '<p class="muted" style="padding:6px 2px 12px;font-size:.82rem">Ch\u01B0a c\xF3 l\u1ECBch s\u1EED ch\u1EC9nh s\u1EEDa tr\u1EF1c ti\u1EBFp.</p>';
    const reqBadge = req.length ? ` <span class="uhBadge">${req.length}</span>` : "";
    const hisBadge = his.length ? ` <span class="uhBadge">${his.length}</span>` : "";
    openModal(
      `L\u1ECBch s\u1EED s\u1EEDa c\xE2u \xB7 ${esc(email)}`,
      `<div class="uhWrap">
      <div class="uhSection"><div class="uhSectionLabel">Y\xEAu c\u1EA7u s\u1EEDa${reqBadge}</div>${reqHtml}</div>
      <div class="uhSection"><div class="uhSectionLabel">Ch\u1EC9nh s\u1EEDa tr\u1EF1c ti\u1EBFp${hisBadge}</div>${hisHtml}</div>
    </div>`
    );
  }
  async function rejectReq(id) {
    const r = cache.requests.find((x) => x.id === id);
    if (!r || r.status !== "pending") return;
    if (!user) return alert("Ch\u01B0a \u0111\u0103ng nh\u1EADp.");
    const note = prompt("L\xFD do t\u1EEB ch\u1ED1i:");
    if (note === null) return;
    setBusy(true, "\u0110ang t\u1EEB ch\u1ED1i...");
    try {
      const res = await fetch("/api/admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          user_id: user.id,
          action: "reject_request",
          payload: { request_id: id, admin_note: note || "" }
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.error) return alert(out.error || "Kh\xF4ng t\u1EEB ch\u1ED1i \u0111\u01B0\u1EE3c");
      await loadAll();
    } finally {
      setBusy(false);
    }
  }
  async function toggleBlock(id, b) {
    if (!isAdmin()) return alert("Ch\u1EC9 admin \u0111\u01B0\u1EE3c block.");
    if (user && id === user.id && b) return alert("Kh\xF4ng n\xEAn t\u1EF1 kh\xF3a t\xE0i kho\u1EA3n \u0111ang d\xF9ng.");
    if (!confirm(`${b ? "Block" : "Unblock"} user n\xE0y?`)) return;
    if (!await adminAction("toggle_user_block", { target_user_id: id, blocked: b })) return;
    await logAction(b ? "block_user" : "unblock_user", "profiles", id, {});
    cache.profiles = (cache.profiles || []).map((p) => String(p.id) === String(id) ? { ...p, blocked: b } : p);
    render();
    await loadAll();
  }
  async function setRole(id, role) {
    if (!isAdmin()) return alert("Ch\u1EC9 admin \u0111\u01B0\u1EE3c c\u1EA5p/g\u1EE1 quy\u1EC1n.");
    if (user && id === user.id && role !== "admin") return alert("Kh\xF4ng n\xEAn t\u1EF1 g\u1EE1 quy\u1EC1n admin c\u1EE7a t\xE0i kho\u1EA3n \u0111ang d\xF9ng.");
    if (!confirm(`\u0110\u1ED5i vai tr\xF2 th\xE0nh ${role}?`)) return;
    if (!await adminAction("set_user_role", { target_user_id: id, role })) return;
    await logAction("change_role", "profiles", id, { role });
    cache.profiles = (cache.profiles || []).map((p) => String(p.id) === String(id) ? { ...p, role } : p);
    render();
    await loadAll();
  }
  function exportAll() {
    const subjects = Array.from(
      new Set((cache.questions || []).map((q) => q.subject_code || "HOD102").filter(Boolean))
    ).sort();
    const subjectOptions = ["all", ...subjects].map((code) => `<option value="${esc(code)}">${code === "all" ? "T\u1EA5t c\u1EA3 m\xF4n" : esc(code)}</option>`).join("");
    openModal(
      "Xu\u1EA5t d\u1EEF li\u1EC7u (Turso)",
      `
    <div style="padding:10px 0;display:grid;gap:14px;">
      <p style="color:rgba(245,240,232,.72);margin:0 0 4px;font-size:0.9rem;line-height:1.4;">
        D\u1EEF li\u1EC7u xu\u1EA5t l\u1EA5y tr\u1EF1c ti\u1EBFp t\u1EEB Turso (database hi\u1EC7n t\u1EA1i). Ph\u1EA7n c\xE2u h\u1ECFi c\xF3 th\u1EC3 t\u1EA3i h\u1EBFt 1 l\u1EA7n ho\u1EB7c ch\u1ECDn \u0111\xFAng m\xF4n.
      </p>

      <div style="border:1px solid rgba(200,169,110,.22);border-radius:16px;padding:14px;background:rgba(255,255,255,.025);display:grid;gap:10px;">
        <b style="color:var(--gold2);">C\xE2u h\u1ECFi</b>
        <select id="exportQuestionSubject" style="width:100%;background:rgba(255,255,255,.045);border:1px solid var(--bd);border-radius:12px;color:var(--fog);padding:10px 12px;">
          ${subjectOptions}
        </select>
        <button class="act ok" id="exportQuestionsJsonBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          \u{1F4C4} T\u1EA3i c\xE2u h\u1ECFi JSON (import l\u1EA1i \u0111\u01B0\u1EE3c)
        </button>
        <button class="act" id="exportQuestionsCsvBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          \u{1F4CA} T\u1EA3i c\xE2u h\u1ECFi CSV (m\u1EDF Excel)
        </button>
      </div>

      <div style="border:1px solid rgba(200,169,110,.22);border-radius:16px;padding:14px;background:rgba(255,255,255,.025);display:grid;gap:10px;">
        <b style="color:var(--gold2);">H\u1ED3 s\u01A1 ng\u01B0\u1EDDi d\xF9ng</b>
        <button class="act" id="exportProfilesJsonBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          \u{1F464} T\u1EA3i profiles JSON
        </button>
        <button class="act" id="exportProfilesCsvBtn" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          \u{1F4CA} T\u1EA3i profiles CSV
        </button>
      </div>

      <div style="border:1px solid rgba(200,169,110,.14);border-radius:16px;padding:14px;background:rgba(255,255,255,.015);display:grid;gap:10px;">
        <b style="color:var(--mist);">Sao l\u01B0u \u0111\u1EA7y \u0111\u1EE7</b>
        <button class="act" id="exportBtnFull" style="width:100%;padding:12px;border-radius:12px;font-weight:900;">
          \u{1F4BE} T\u1EA3i full_backup JSON (c\xE2u h\u1ECFi + m\xF4n + user + l\u1ECBch s\u1EED)
        </button>
      </div>
    </div>
  `
    );
    $("exportQuestionsJsonBtn").onclick = () => downloadExportFile("questions_json", $("exportQuestionSubject")?.value || "all");
    $("exportQuestionsCsvBtn").onclick = () => downloadExportFile("questions_csv", $("exportQuestionSubject")?.value || "all");
    $("exportProfilesJsonBtn").onclick = () => downloadExportFile("profiles_json");
    $("exportProfilesCsvBtn").onclick = () => downloadExportFile("profiles_csv");
    $("exportBtnFull").onclick = () => downloadExportFile("full");
  }
  function downloadBlobFile(content, filename, type = "application/json") {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function safeFilePart(s) {
    return String(s || "all").replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "all";
  }
  async function fetchQuestionsForExport(subjectCode) {
    const p = new URLSearchParams({ ts: String(Date.now()) });
    if (subjectCode && subjectCode !== "all") p.set("subject_code", subjectCode);
    const res = await fetch("/api/questions?" + p.toString(), { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error(j.error || "HTTP " + res.status);
    const rows = Array.isArray(j.data) ? j.data : [];
    rows.sort(
      (a, b) => String(a.subject_code || "").localeCompare(String(b.subject_code || "")) || (Number(a.num) || 0) - (Number(b.num) || 0)
    );
    return rows;
  }
  async function fetchProfilesForExport() {
    if (Array.isArray(cache.profiles) && cache.profiles.length) return cache.profiles;
    const res = await fetch("/api/admin-dashboard", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error(j.error || "HTTP " + res.status);
    return j.profiles || [];
  }
  function questionsToCsv(rows) {
    const esc2 = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
    const header = [
      "subject_code",
      "num",
      "question",
      "A",
      "B",
      "C",
      "D",
      "E",
      "answer",
      "answer_text",
      "has_image",
      "error_risk"
    ];
    const lines = [header.join(",")];
    (rows || []).forEach((q) => {
      const o = q.options || {};
      lines.push(
        [
          q.subject_code,
          q.num,
          q.question,
          o.A,
          o.B,
          o.C,
          o.D,
          o.E,
          q.answer,
          q.answer_text,
          q.has_image ? 1 : 0,
          q.error_risk || "low"
        ].map(esc2).join(",")
      );
    });
    return "\uFEFF" + lines.join("\r\n");
  }
  function toCsv(rows) {
    const cols = [
      "id",
      "email",
      "full_name",
      "role",
      "approved",
      "blocked",
      "avatar_url",
      "last_login",
      "last_activity",
      "created_at"
    ];
    const escCsv = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    return cols.join(",") + "\n" + rows.map((r) => cols.map((c) => escCsv(r[c])).join(",")).join("\n");
  }
  async function downloadExportFile(type, subjectCode = "all") {
    try {
      setBusy(true, "\u0110ang xu\u1EA5t...");
      if (type === "questions_json") {
        const rows = await fetchQuestionsForExport(subjectCode);
        downloadBlobFile(
          JSON.stringify(rows, null, 2),
          `questions_${safeFilePart(subjectCode)}.json`,
          "application/json;charset=utf-8"
        );
        try {
          await logAction("export_questions_json", "questions", subjectCode, { count: rows.length });
        } catch (e) {
          lhWarn("ADMIN_LOGIN_NOTIFY_NOT_F5", e);
        }
        toast("\u0110\xE3 t\u1EA3i c\xE2u h\u1ECFi JSON");
      } else if (type === "questions_csv") {
        const rows = await fetchQuestionsForExport(subjectCode);
        downloadBlobFile(questionsToCsv(rows), `questions_${safeFilePart(subjectCode)}.csv`, "text/csv;charset=utf-8");
        try {
          await logAction("export_questions_csv", "questions", subjectCode, { count: rows.length });
        } catch (e) {
          lhWarn("ADMIN_LOGIN_NOTIFY_NOT_F5", e);
        }
        toast("\u0110\xE3 t\u1EA3i c\xE2u h\u1ECFi CSV");
      } else if (type === "profiles_json") {
        const rows = await fetchProfilesForExport();
        downloadBlobFile(JSON.stringify(rows, null, 2), "profiles_export.json", "application/json;charset=utf-8");
        try {
          await logAction("export_profiles_json", "profiles", "all", { count: rows.length });
        } catch (e) {
          lhWarn("ADMIN_LOGIN_NOTIFY_NOT_F5", e);
        }
        toast("\u0110\xE3 t\u1EA3i profiles JSON");
      } else if (type === "profiles_csv") {
        const rows = await fetchProfilesForExport();
        downloadBlobFile(toCsv(rows), "profiles_export.csv", "text/csv;charset=utf-8");
        try {
          await logAction("export_profiles_csv", "profiles", "all", { count: rows.length });
        } catch (e) {
          lhWarn("ADMIN_LOGIN_NOTIFY_NOT_F5", e);
        }
        toast("\u0110\xE3 t\u1EA3i profiles CSV");
      } else {
        const full = {
          exported_at: (/* @__PURE__ */ new Date()).toISOString(),
          source: "turso",
          subjects: cache.subjects || [],
          profiles: await fetchProfilesForExport(),
          questions: await fetchQuestionsForExport("all"),
          requests: cache.requests || [],
          history: cache.history || [],
          logs: cache.logs || []
        };
        downloadBlobFile(JSON.stringify(full, null, 2), "learninghub_full_backup.json", "application/json;charset=utf-8");
        try {
          await logAction("export_full_backup", "backup", "json", {
            questions: full.questions.length,
            profiles: full.profiles.length
          });
        } catch (e) {
          lhWarn("ADMIN_LOGIN_NOTIFY_NOT_F5", e);
        }
        toast("\u0110\xE3 t\u1EA3i full backup");
      }
      closeModal();
    } catch (e) {
      alert("Xu\u1EA5t d\u1EEF li\u1EC7u th\u1EA5t b\u1EA1i: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }
  Object.assign(window, { rejectReq, toggleBlock, setRole, viewUserEdits });
  (function() {
    if (window.__F5_SUPABASE_MICRO_CACHE_20260629) return;
    window.__F5_SUPABASE_MICRO_CACHE_20260629 = true;
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    const MEM = /* @__PURE__ */ new Map();
    const PENDING = /* @__PURE__ */ new Map();
    const SS_PREFIX = "admin_f5_micro_cache:";
    const MAX_BODY = 160 * 1024;
    function isGet(init2) {
      return String(init2 && init2.method ? init2.method : "GET").toUpperCase() === "GET";
    }
    function isSupabaseRest(url) {
      return /\/rest\/v1\//.test(url.pathname);
    }
    function isSafePath(path) {
      return /\/(profiles|site_settings|subjects|subject_requests|edit_requests|question_history|admin_logs|questions)\b/.test(
        path
      );
    }
    function ttlFor(url) {
      const p = url.pathname;
      const q = url.search || "";
      if (/\/profiles\b/.test(p) && /id=eq\./.test(q)) return 10 * 60 * 1e3;
      if (/\/site_settings\b/.test(p)) return 10 * 60 * 1e3;
      if (/\/subjects\b/.test(p)) return 0;
      if (/\/subject_requests\b/.test(p)) return 45 * 1e3;
      if (/\/edit_requests\b/.test(p)) return 30 * 1e3;
      if (/\/question_history\b/.test(p)) return 60 * 1e3;
      if (/\/admin_logs\b/.test(p)) return 30 * 1e3;
      if (/\/questions\b/.test(p) && !/images/i.test(q)) return 0;
      return 0;
    }
    function keyOf(url, init2) {
      const auth = init2 && init2.headers && (init2.headers.Authorization || init2.headers.authorization) || "";
      return url.origin + url.pathname + url.search + "|" + String(auth).slice(-18);
    }
    function headersObj(headers) {
      const out = {};
      try {
        headers.forEach((v, k) => out[k] = v);
      } catch (e) {
        lhWarn("F5_SUPABASE_MICRO_CACHE_20260629", e);
      }
      return out;
    }
    function makeResponse(entry) {
      return new Response(entry.body, {
        status: entry.status || 200,
        statusText: entry.statusText || "OK",
        headers: entry.headers || {}
      });
    }
    function readSession(key2) {
      try {
        const raw = sessionStorage.getItem(SS_PREFIX + key2);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (!entry || !entry.exp || Date.now() > entry.exp) return null;
        return entry;
      } catch (e) {
        return null;
      }
    }
    function writeSession(key2, entry) {
      try {
        sessionStorage.setItem(SS_PREFIX + key2, JSON.stringify(entry));
      } catch (e) {
        lhWarn("F5_SUPABASE_MICRO_CACHE_20260629", e);
      }
    }
    async function storeResponse(key2, ttl, res) {
      try {
        const clone = res.clone();
        const text = await clone.text();
        if (text.length > MAX_BODY) return;
        const entry = {
          body: text,
          status: res.status,
          statusText: res.statusText,
          headers: headersObj(res.headers),
          exp: Date.now() + ttl
        };
        MEM.set(key2, entry);
        writeSession(key2, entry);
      } catch (e) {
        lhWarn("F5_SUPABASE_MICRO_CACHE_20260629", e);
      }
    }
  })();
  document.addEventListener("DOMContentLoaded", init);
  (function() {
    function emailByUserId(id) {
      if (!id) return "";
      const p = (cache.profiles || []).find((x) => String(x.id) === String(id));
      return p?.email || "";
    }
    function findQuestionById(id) {
      return (cache.questions || []).find((q) => String(q.id) === String(id)) || null;
    }
    function realQuestionNum2(row) {
      const q = findQuestionById(row?.question_id);
      return row?.question_num || row?.new_data?.num || row?.previous_data?.num || row?.old_data?.num || row?.num || q?.num || row?.question_id || "?";
    }
    function realSubjectCode2(row) {
      const q = findQuestionById(row?.question_id);
      return row?.subject_code || row?.new_data?.subject_code || row?.previous_data?.subject_code || row?.old_data?.subject_code || q?.subject_code || "";
    }
    function historyTitle2(row) {
      const q = findQuestionById(row?.question_id);
      return row?.new_data?.question || row?.previous_data?.question || row?.old_data?.question || q?.question || "";
    }
    function changedKeys(oldData, newData) {
      return changedFieldKeys(oldData || {}, newData || {});
    }
    function chips(keys) {
      return `<div class="changeChips adminChangeChips">${keys.map((k) => `<span>${esc(labelField(k))}</span>`).join("") || "<span>Ch\u01B0a r\xF5 thay \u0111\u1ED5i</span>"}</div>`;
    }
    function editorEmail(row) {
      return row?.changed_by_email || row?.user_email || row?.admin_email || emailByUserId(row?.changed_by) || emailByUserId(row?.user_id) || emailByUserId(row?.approved_by) || "Kh\xF4ng r\xF5 email";
    }
    window.renderHistory = renderHistory = function() {
      const arr = (cache.history || []).filter(
        (h) => match(`${safe(h)} ${realQuestionNum2(h)} ${historyTitle2(h)} ${realSubjectCode2(h)} ${editorEmail(h)}`)
      );
      $("historyList").innerHTML = arr.map((h) => {
        const no = realQuestionNum2(h);
        const subject = realSubjectCode2(h);
        const title = historyTitle2(h);
        const keys = changedKeys(h.previous_data || {}, h.new_data || {});
        return `<div class="item historyItem">
        <div class="head historyHead">
          <div>
            <b>${subject ? esc(subject) + " \xB7 " : ""}C\xE2u ${esc(no)}</b>
            ${title ? `<p class="muted historyQuestionText">${esc(title)}</p>` : ""}
          </div>
          <span class="muted historyTime">${esc(date(h.created_at))}</span>
        </div>
        ${chips(keys)}
        <p class="muted historyUser">Ng\u01B0\u1EDDi s\u1EEDa: ${esc(editorEmail(h))}</p>
        <div class="actions"><button class="act" onclick="viewHistoryFixed('${esc(h.id || h.question_id || "")}')">Tr\u01B0\u1EDBc/sau</button></div>
      </div>`;
      }).join("") || "<p class=muted>Ch\u01B0a c\xF3 l\u1ECBch s\u1EED ch\u1EC9nh s\u1EEDa.</p>";
    };
    window.viewHistoryFixed = function(id) {
      const h = (cache.history || []).find((x) => String(x.id || "") === String(id || ""));
      if (!h) return alert("Kh\xF4ng t\xECm th\u1EA5y l\u1ECBch s\u1EED ch\u1EC9nh s\u1EEDa. H\xE3y t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
      const subject = realSubjectCode2(h);
      const number = realQuestionNum2(h);
      const before = h.previous_data || {};
      const after = h.new_data || {};
      openModal(`${subject ? subject + " \xB7 " : ""}L\u1ECBch s\u1EED c\xE2u ${number}`, compareHTML(before, after));
    };
  })();
  (function() {
    let approvalFilter = "pending";
    function pendingUsers() {
      return (cache.profiles || []).filter((p) => p.approved === false);
    }
    function approvedUsers() {
      return (cache.profiles || []).filter((p) => p.approved !== false);
    }
    function updateApprovalBadge() {
      const count = pendingUsers().length;
      const badge2 = document.getElementById("approvalBadge");
      if (badge2) {
        badge2.textContent = count;
        badge2.classList.toggle("hidden", count === 0);
      }
      const statPending = document.getElementById("statPending");
      if (statPending) {
        const reqPending = (cache.requests || []).filter((x) => x.status === "pending").length;
        statPending.textContent = reqPending;
      }
      updateRequestBadge();
    }
    function renderApprovalCounts() {
      const pend = pendingUsers().length;
      const appr = approvedUsers().length;
      const all = (cache.profiles || []).length;
      const ep = document.getElementById("afPending");
      const ea = document.getElementById("afApproved");
      const eall = document.getElementById("afAll");
      if (ep) ep.textContent = pend;
      if (ea) ea.textContent = appr;
      if (eall) eall.textContent = all;
    }
    function callRenderApprovals() {
      window.renderApprovals?.();
    }
    window.filterApprovals = function(f) {
      approvalFilter = f;
      document.querySelectorAll(".approvalFilter").forEach((b) => {
        b.classList.toggle("active", b.dataset.af === f);
      });
      callRenderApprovals();
    };
    window.approveUser = async function(uid) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      const p = (cache.profiles || []).find((x) => x.id === uid);
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y user.");
      if (!confirm("Ph\xEA duy\u1EC7t t\xE0i kho\u1EA3n: " + (p.email || uid) + "?")) return;
      setBusy(true, "\u0110ang ph\xEA duy\u1EC7t...");
      try {
        if (!await adminAction("approve_user_registration", { target_user_id: uid })) return;
        await logAction("approve_user", "profiles", uid, { email: p.email });
        p.approved = true;
        callRenderApprovals();
        toast("\u0110\xE3 ph\xEA duy\u1EC7t " + (p.email || uid));
      } finally {
        setBusy(false);
      }
    };
    window.rejectUser = async function(uid) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      const p = (cache.profiles || []).find((x) => x.id === uid);
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y user.");
      if (!confirm("T\u1EEB ch\u1ED1i v\xE0 X\xD3A t\xE0i kho\u1EA3n: " + (p.email || uid) + "?\n\nUser s\u1EBD ph\u1EA3i \u0111\u0103ng k\xFD l\u1EA1i.")) return;
      setBusy(true, "\u0110ang x\u1EED l\xFD...");
      try {
        if (!await adminAction("reject_user_registration", { target_user_id: uid })) return;
        await logAction("reject_user", "profiles", uid, { email: p.email });
        cache.profiles = cache.profiles.filter((x) => x.id !== uid);
        callRenderApprovals();
        toast("\u0110\xE3 t\u1EEB ch\u1ED1i " + (p.email || uid));
      } finally {
        setBusy(false);
      }
    };
    const _origRenderStats = renderStats;
    renderStats = function() {
      _origRenderStats();
      updateApprovalBadge();
      renderApprovalCounts();
      const statPA = document.getElementById("statPendingApproval");
      if (statPA) statPA.textContent = pendingUsers().length;
    };
    document.querySelectorAll(".nav").forEach((b) => {
      if (b.dataset.page === "approvals") {
        b.addEventListener("click", () => {
          setTimeout(callRenderApprovals, 50);
          window.loadRegistrationMode?.();
        });
      }
    });
    const _origSetPage = setPage;
    setPage = function(id, n) {
      _origSetPage(id, n);
      if (id === "approvals") {
        callRenderApprovals();
        window.loadRegistrationMode?.();
      }
    };
    setTimeout(() => window.loadRegistrationMode?.(), 500);
  })();
  (function() {
    const $2 = (id) => document.getElementById(id);
    window.deleteSubjectAdmin = async function(code) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi \u0111\u01B0\u1EE3c x\xF3a m\xF4n.");
      setBusy(true, "\u0110ang ki\u1EC3m tra th\xF4ng tin m\xF4n...");
      let subjectData = null;
      let questionsCount = 0;
      try {
        subjectData = (cache.subjects || []).find((s) => String(s.code || "").toUpperCase() === String(code).toUpperCase());
        if (!subjectData) throw new Error("Kh\xF4ng t\xECm th\u1EA5y m\xF4n " + code);
        questionsCount = (cache.questions || []).filter(
          (q) => String(q.subject_code || "").toUpperCase() === String(code).toUpperCase()
        ).length;
      } catch (err2) {
        setBusy(false);
        return alert("L\u1ED7i t\u1EA3i th\xF4ng tin m\xF4n h\u1ECDc: " + err2.message);
      }
      setBusy(false);
      const name = subjectData.name || "";
      openModal(
        "X\xE1c nh\u1EADn x\xF3a m\xF4n h\u1ECDc",
        `
      <div style="padding:10px 0;">
        <div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:10px;padding:16px;margin-bottom:20px;color:#e74c3c;">
          <h3 style="margin-top:0;margin-bottom:8px;font-size:0.96rem;font-weight:bold;">\u26A0\uFE0F C\u1EA3nh b\xE1o h\xE0nh \u0111\u1ED9ng nguy hi\u1EC3m!</h3>
          <p style="margin:0;font-size:0.86rem;line-height:1.45;color:rgba(245,240,232,.85);">
            B\u1EA1n \u0111ang y\xEAu c\u1EA7u x\xF3a m\xF4n h\u1ECDc <b>${esc(name)} (${esc(code)})</b>.
          </p>
        </div>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.88rem;color:rgba(245,240,232,.85);">
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">M\xE3 m\xF4n:</td><td style="padding:8px 0;text-align:right;">${esc(code)}</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">T\xEAn m\xF4n:</td><td style="padding:8px 0;text-align:right;">${esc(name)}</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">S\u1ED1 l\u01B0\u1EE3ng c\xE2u h\u1ECFi:</td><td style="padding:8px 0;text-align:right;color:#e74c3c;font-weight:bold;">${questionsCount} c\xE2u h\u1ECFi s\u1EBD b\u1ECB x\xF3a</td></tr>
          <tr style="border-bottom:1px solid rgba(245,240,232,.1);"><td style="padding:8px 0;font-weight:bold;color:var(--gold2);">N\u01A1i l\u01B0u tr\u1EEF sau x\xF3a:</td><td style="padding:8px 0;text-align:right;color:#2ecc71;">Th\xF9ng r\xE1c (c\xF3 th\u1EC3 kh\xF4i ph\u1EE5c)</td></tr>
        </table>
        
        <div class="field" style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:8px;font-size:0.84rem;color:rgba(245,240,232,.72);">\u0110\u1EC3 x\xE1c nh\u1EADn, vui l\xF2ng nh\u1EADp m\xE3 m\xF4n h\u1ECDc <b>${esc(code)}</b> v\xE0o \xF4 b\xEAn d\u01B0\u1EDBi:</label>
          <input type="text" id="confirmDeleteSubjectCode" placeholder="Nh\u1EADp ${esc(code)}" style="width:100%;padding:10px 14px;background:rgba(0,0,0,.22);border:1px solid rgba(200,169,110,.25);border-radius:8px;color:#fff;font-weight:bold;text-align:center;">
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button class="act" onclick="lhCloseModal()" style="width:100%;text-align:center;padding:10px;font-size:0.88rem;font-weight:bold;border-radius:8px;">H\u1EE7y b\u1ECF</button>
          <button class="act bad" id="btnConfirmDeleteSubject" disabled style="width:100%;text-align:center;padding:10px;font-size:0.88rem;font-weight:bold;border-radius:8px;opacity:0.5;cursor:not-allowed;">X\xE1c nh\u1EADn x\xF3a</button>
        </div>
      </div>
    `
      );
      const input = document.getElementById("confirmDeleteSubjectCode");
      const btn = document.getElementById("btnConfirmDeleteSubject");
      if (input && btn) {
        input.oninput = function() {
          const match2 = input.value.trim().toUpperCase() === code.toUpperCase();
          btn.disabled = !match2;
          btn.style.opacity = match2 ? "1" : "0.5";
          btn.style.cursor = match2 ? "pointer" : "not-allowed";
        };
        btn.onclick = async function() {
          closeModal();
          setBusy(true, "\u0110ang ti\u1EBFn h\xE0nh x\xF3a m\xF4n h\u1ECDc...");
          try {
            const actionRes = await fetch("/api/admin-action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user?.id,
                action: "delete_subject",
                payload: { subject_id: subjectData.id }
              })
            });
            const actionJson = await actionRes.json().catch(() => ({}));
            if (!actionRes.ok || actionJson.error) {
              throw new Error(actionJson.error || "Kh\xF4ng x\xF3a \u0111\u01B0\u1EE3c m\xF4n h\u1ECDc.");
            }
            const questionsData = Array.from(cache.questions || []).filter(
              (q) => String(q.subject_code || "").toUpperCase() === String(code || "").toUpperCase()
            );
            cache.questions = (cache.questions || []).filter(
              (q) => String(q.subject_code || "").toUpperCase() !== String(code || "").toUpperCase()
            );
            await loadAll();
            if (typeof window.loadSubjectsAdmin === "function") await window.loadSubjectsAdmin();
            toast("\u0110\xE3 chuy\u1EC3n m\xF4n " + code + " v\xE0o Th\xF9ng r\xE1c");
          } catch (e) {
            console.warn("Delete subject error:", e);
            alert("L\u1ED7i khi x\xF3a m\xF4n: " + (e.message || e));
          } finally {
            setBusy(false);
          }
        };
      }
    };
    function findSubjectRequest(id) {
      return (cache.subject_requests || []).find((x) => String(x.id) === String(id));
    }
    window.approveSubjectRequest = async function(id) {
      if (!isEditor()) return alert("Ch\u1EC9 Admin/Editor m\u1EDBi duy\u1EC7t \u0111\u01B0\u1EE3c.");
      const r = findSubjectRequest(id);
      if (!r) return alert("Kh\xF4ng t\xECm th\u1EA5y y\xEAu c\u1EA7u.");
      if (!confirm('Duy\u1EC7t y\xEAu c\u1EA7u th\xEAm m\xF4n "' + r.code + '" t\u1EEB ' + r.user_email + "?")) return;
      setBusy(true, "\u0110ang duy\u1EC7t...");
      try {
        if (!await adminAction("approve_subject_request", { request_id: id })) return;
        await logAction("approve_subject_request", "subject_requests", id, {
          code: r.code,
          name: r.name,
          questions: (r.questions_data || []).length
        });
        await loadAll();
        await loadSubjectRequests();
        toast("\u0110\xE3 duy\u1EC7t m\xF4n " + r.code);
      } catch (e) {
        console.warn("Approve subject request error:", e);
        alert("L\u1ED7i: " + (e.message || e));
      } finally {
        setBusy(false);
        hideProgress();
      }
    };
    window.rejectSubjectRequest = async function(id) {
      if (!isEditor()) return alert("Ch\u1EC9 Admin/Editor m\u1EDBi t\u1EEB ch\u1ED1i \u0111\u01B0\u1EE3c.");
      const r = findSubjectRequest(id);
      if (!r) return alert("Kh\xF4ng t\xECm th\u1EA5y y\xEAu c\u1EA7u.");
      const note = prompt("L\xFD do t\u1EEB ch\u1ED1i (c\xF3 th\u1EC3 b\u1ECF tr\u1ED1ng):");
      if (note === null) return;
      setBusy(true, "\u0110ang t\u1EEB ch\u1ED1i...");
      try {
        if (!await adminAction("reject_subject_request", { request_id: id, admin_note: note || "" })) return;
        await logAction("reject_subject_request", "subject_requests", id, {
          code: r.code,
          reason: note
        });
        await loadSubjectRequests();
        toast("\u0110\xE3 t\u1EEB ch\u1ED1i y\xEAu c\u1EA7u " + r.code);
      } finally {
        setBusy(false);
      }
    };
    const origSetPage = setPage;
    setPage = function(id, n) {
      origSetPage(id, n);
      if (id === "subjectRequests") loadSubjectRequests();
    };
  })();
  (function() {
    const $2 = (id) => document.getElementById(id);
    const esc2 = (s) => String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
    );
    function date2(d) {
      if (!d) return "Ch\u01B0a c\xF3";
      try {
        return new Date(d).toLocaleString("vi-VN");
      } catch (e) {
        return d;
      }
    }
    function injectAdminStyles() {
      if ($2("adminFixUiStyle")) return;
      const style = document.createElement("style");
      style.id = "adminFixUiStyle";
      style.textContent = `
      /* \xD4 th\xF4ng b\xE1o k\u1EBFt qu\u1EA3 t\xECm ki\u1EBFm nh\u1ECF g\u1ECDn, tinh t\u1EBF h\u01A1n */
      .questionResultNote.smartSearchNote, 
      .questionResultNote.compactSearchNote,
      .questionResultNote {
        font-size: 0.85rem !important;
        padding: 8px 14px !important;
        margin: 10px 0 15px 0 !important;
        border-radius: 8px !important;
        background: rgba(232, 212, 168, 0.06) !important;
        border: 1px solid rgba(232, 212, 168, 0.2) !important;
        color: #e8d4a8 !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Th\xF4ng b\xE1o Toast g\xF3c m\xE0n h\xECnh g\u1ECDn g\xE0ng */
      .toast {
        font-size: 0.85rem !important;
        padding: 8px 16px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(232, 212, 168, 0.2) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35) !important;
      }

      /* T\xE1ch bi\u1EC7t r\xF5 r\xE0ng c\u1EA5u tr\xFAc Th\xF9ng r\xE1c ch\u1ED1ng \u0111\xE8 ch\u1ED3ng */
      .trashBlockContainer {
        display: flex !important;
        flex-direction: column !important;
        gap: 25px !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .trashGroup {
        background: rgba(255, 255, 255, 0.01) !important;
        border: 1px solid rgba(255, 255, 255, 0.04) !important;
        border-radius: 12px !important;
        padding: 16px !important;
      }
      .trashSectionHeading {
        margin: 0 0 14px 0 !important;
        color: #e8d4a8 !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        padding-bottom: 8px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      .trashSectionHeading span {
        font-size: 0.8rem !important;
        opacity: 0.6 !important;
        font-weight: 400 !important;
        text-transform: none !important;
      }
      .trashGridWrapper {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }
      .item.trashItem {
        position: relative !important;
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        padding: 14px !important;
      }
    `;
      document.head.appendChild(style);
    }
    injectAdminStyles();
  })();
  (function() {
    let subjectEditCache = [];
    const $id = (id) => document.getElementById(id);
    function currentSearchText() {
      return String($id("search")?.value || "").trim().toLowerCase();
    }
    function subjectMatches(s) {
      const q = currentSearchText();
      if (!q) return true;
      return `${s.code || ""} ${s.name || ""} ${s.description || ""}`.toLowerCase().includes(q);
    }
    function ensureSubjectAdminPage() {
      if (!$id("subjectAdminNav")) {
        const side = document.querySelector(".side");
        const foot = document.querySelector(".foot");
        if (side) {
          const btn = document.createElement("button");
          btn.id = "subjectAdminNav";
          btn.className = "nav";
          btn.type = "button";
          btn.dataset.page = "subjectsAdmin";
          btn.textContent = "M\xF4n h\u1ECDc";
          btn.onclick = () => {
            setPage("subjectsAdmin", "Qu\u1EA3n l\xFD m\xF4n h\u1ECDc");
            loadSubjectsAdmin();
          };
          side.insertBefore(btn, foot || null);
        }
      }
      if (!$id("subjectsAdmin")) {
        const ws = document.querySelector(".workspace");
        if (!ws) return;
        const page = document.createElement("section");
        page.id = "subjectsAdmin";
        page.className = "page";
        page.innerHTML = `
        <div class="panel panelFill subjectAdminPanel">
          <div id="subjectAdminList" class="subjectAdminList pageScroll"></div>
        </div>`;
        ws.appendChild(page);
      }
    }
    window.loadSubjectsAdmin = async function() {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      ensureSubjectAdminPage();
      const list = $id("subjectAdminList");
      if (list) list.innerHTML = '<p class="muted">\u0110ang t\u1EA3i m\xF4n h\u1ECDc...</p>';
      setBusy(true, "\u0110ang t\u1EA3i m\xF4n...");
      try {
        const { data, error } = await client.from("subjects").select("*").order("sort_order", { ascending: true }).order("code", { ascending: true });
        if (error) {
          if (list) list.innerHTML = '<p class="muted">Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c danh s\xE1ch m\xF4n.</p>';
          return alert("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c danh s\xE1ch m\xF4n: " + error.message);
        }
        subjectEditCache = data || [];
        renderSubjectAdminList();
      } finally {
        setBusy(false);
      }
    };
    window.renderSubjectAdminList = function() {
      ensureSubjectAdminPage();
      const list = $id("subjectAdminList");
      if (!list) return;
      const arr = subjectEditCache.filter(subjectMatches);
      if (!arr.length) {
        list.innerHTML = '<p class="muted">Kh\xF4ng c\xF3 m\xF4n h\u1ECDc ph\xF9 h\u1EE3p.</p>';
        return;
      }
      list.innerHTML = arr.map(
        (s) => `
      <div class="subjectAdminItem">
        <div class="subjectAdminCode">${esc(s.code || "")}</div>
        <div class="subjectAdminInfo">
          <b>${esc(s.name || s.code || "Ch\u01B0a c\xF3 t\xEAn m\xF4n")}</b>
          <p>${esc(s.description || "M\xF4n h\u1ECDc ch\u01B0a c\xF3 m\xF4 t\u1EA3.")}</p>
        </div>
        <div class="subjectAdminActions">
          <button class="act warn" type="button" onclick="openEditSubjectAdmin('${esc(String(s.code || "")).replace(/'/g, "&#39;")}')">S\u1EEDa</button>
          ${isAdmin() ? `<button class="act bad" type="button" onclick="deleteSubjectAdmin('${esc(String(s.code || "")).replace(/'/g, "&#39;")}')">X\xF3a</button>` : ""}
        </div>
      </div>`
      ).join("");
    };
    window.openEditSubjectAdmin = async function(code) {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      let s = subjectEditCache.find((x) => String(x.code) === String(code));
      if (!s) {
        const res = await client.from("subjects").select("*").eq("code", code).maybeSingle();
        if (res.error || !res.data) return alert("Kh\xF4ng t\xECm th\u1EA5y m\xF4n h\u1ECDc.");
        s = res.data;
      }
      openModal(
        "S\u1EEDa m\xF4n h\u1ECDc",
        `
      <div class="editSubjectForm">
        <div class="editSubjectNotice">
          N\u1EBFu \u0111\u1ED5i <b>m\xE3 m\xF4n</b>, h\u1EC7 th\u1ED1ng c\u0169ng s\u1EBD chuy\u1EC3n to\xE0n b\u1ED9 c\xE2u h\u1ECFi c\u1EE7a m\xF4n c\u0169 sang m\xE3 m\xF4n m\u1EDBi.
        </div>
        <div class="formGrid2">
          <div class="field">
            <label>M\xE3 m\xF4n</label>
            <input id="editSubjectOldCode" type="hidden" value="${esc(s.code || "")}">
            <input id="editSubjectCode" value="${esc(s.code || "")}" maxlength="20" placeholder="VD: MLN111">
          </div>
          <div class="field">
            <label>T\xEAn m\xF4n h\u1ECDc</label>
            <input id="editSubjectName" value="${esc(s.name || "")}" maxlength="120" placeholder="VD: Tri\u1EBFt h\u1ECDc M\xE1c - L\xEAnin">
          </div>
        </div>
        <div class="field">
          <label>N\u1ED9i dung / m\xF4 t\u1EA3 m\xF4n</label>
          <!-- B\u1EA3n CH\u1EBET: openEditSubjectAdmin c\u1EE7a block n\xE0y b\u1ECB block
               COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630 (~5017) g\xE1n \u0111\xE8. Gi\u1EEF maxlength kh\u1EDBp
               \u0111\u1EC3 hai b\u1EA3n kh\xF4ng l\u1EC7ch n\u1EBFu c\xF3 ng\xE0y b\u1EA3n n\xE0y s\u1ED1ng l\u1EA1i. Xem SUBJECT_DESC_LIMIT_20260728. -->
          <textarea id="editSubjectDesc" rows="3" maxlength="160" placeholder="M\xF4 t\u1EA3 ng\u1EAFn hi\u1EC3n th\u1ECB \u1EDF th\u1EBB m\xF4n (t\u1ED1i \u0111a 160 k\xFD t\u1EF1)...">${esc(s.description || "")}</textarea>
        </div>
        <div class="editSubjectMeta">
          <span>Tr\u1EA1ng th\xE1i: ${s.is_active === false ? "\u0110ang \u1EA9n" : "\u0110ang hi\u1EC7n"}</span>
          <span>Th\u1EE9 t\u1EF1: ${esc(s.sort_order ?? "")}</span>
        </div>
        <div class="actions editSubjectActions">
          <button class="act ok" type="button" onclick="saveSubjectAdmin()">L\u01B0u thay \u0111\u1ED5i</button>
          <button class="act" type="button" onclick="lhCloseModal()">\u0110\xF3ng</button>
        </div>
      </div>`
      );
      setTimeout(() => {
        const input = $id("editSubjectCode");
        if (input) {
          input.oninput = function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
          };
          input.focus();
        }
      }, 0);
    };
    window.saveSubjectAdmin = async function() {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const oldCode = ($id("editSubjectOldCode")?.value || "").trim().toUpperCase();
      const newCode = ($id("editSubjectCode")?.value || "").trim().toUpperCase();
      const name = ($id("editSubjectName")?.value || "").trim();
      const description = ($id("editSubjectDesc")?.value || "").trim();
      if (!oldCode) return alert("Thi\u1EBFu m\xE3 m\xF4n c\u0169.");
      if (!newCode) return alert("M\xE3 m\xF4n kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      if (!/^[A-Z0-9_]{2,20}$/.test(newCode)) return alert("M\xE3 m\xF4n ch\u1EC9 g\u1ED3m ch\u1EEF, s\u1ED1, g\u1EA1ch d\u01B0\u1EDBi v\xE0 d\xE0i 2-20 k\xFD t\u1EF1.");
      if (!name) return alert("T\xEAn m\xF4n h\u1ECDc kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      const subject = subjectEditCache.find((x) => String(x.code) === String(oldCode)) || {};
      setBusy(true, "\u0110ang l\u01B0u m\xF4n...");
      try {
        if (newCode === oldCode) {
          if (!subject.id) return alert("Kh\xF4ng t\xECm th\u1EA5y ID m\xF4n h\u1ECDc. B\u1EA5m T\u1EA3i l\u1EA1i r\u1ED3i th\u1EED l\u1EA1i.");
          if (!await adminAction("edit_subject", {
            id: subject.id,
            name,
            description: description || "",
            cover: subject.cover || "",
            sort_order: subject.sort_order || 0
          }))
            return;
          subject.name = name;
          subject.description = description || "";
        } else {
          if (!await adminAction("rename_subject_code", {
            old_code: oldCode,
            new_code: newCode,
            name,
            description: description || ""
          }))
            return;
        }
        await logAction("edit_subject", "subjects", oldCode, {
          old_code: oldCode,
          new_code: newCode,
          name,
          description
        });
        closeModal();
        await loadSubjectsAdmin();
        await loadAll();
        toast("\u0110\xE3 l\u01B0u m\xF4n h\u1ECDc " + newCode);
      } catch (e) {
        console.warn("saveSubjectAdmin error:", e);
        alert("L\u1ED7i khi l\u01B0u m\xF4n: " + (e.message || e));
      } finally {
        setBusy(false);
      }
    };
    function patchSearchRender() {
      const input = $id("search");
      if (input && !input.__subjectAdminSearchPatched) {
        input.__subjectAdminSearchPatched = true;
        input.addEventListener("input", () => {
          if ($id("subjectsAdmin")?.classList.contains("active")) renderSubjectAdminList();
        });
      }
    }
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        ensureSubjectAdminPage();
        patchSearchRender();
      }, 600);
      setInterval(() => {
        ensureSubjectAdminPage();
        patchSearchRender();
      }, 2e3);
    });
  })();
  (function() {
    const STORE_KEY = "admin_sidebar_tree_collapsed_v4";
    const GROUPS = [
      { title: "Duy\u1EC7t", icon: "\u2713", keys: ["approvals", "requests", "subjectRequests"] },
      { title: "N\u1ED9i dung", icon: "\u25A1", keys: ["subjectsAdmin", "trash"] },
      { title: "H\u1EC7 th\u1ED1ng", icon: "\u2699", keys: ["users", "history", "logs", "discordSettings"] }
    ];
    const SHORT = {
      overview: "TQ",
      approvals: "PD",
      requests: "YS",
      subjectRequests: "YM",
      subjectsAdmin: "MH",
      trash: "TR",
      users: "ND",
      history: "LS",
      logs: "LG",
      discordSettings: "DC"
    };
    const LABEL = {
      overview: "T\u1ED5ng quan",
      approvals: "Ph\xEA duy\u1EC7t",
      requests: "Y\xEAu c\u1EA7u s\u1EEDa",
      subjectRequests: "Y\xEAu c\u1EA7u th\xEAm m\xF4n",
      subjectsAdmin: "M\xF4n h\u1ECDc",
      trash: "Th\xF9ng r\xE1c",
      users: "Ng\u01B0\u1EDDi d\xF9ng",
      history: "L\u1ECBch s\u1EED",
      logs: "Admin logs",
      discordSettings: "Th\xF4ng b\xE1o Discord"
    };
    const ICON = {
      overview: "\u2302",
      approvals: "\u2713",
      requests: "\u270E",
      subjectRequests: "\uFF0B",
      subjectsAdmin: "\u25A1",
      trash: "\xD7",
      users: "\u25CB",
      history: "\u25F7",
      logs: "\u25A4",
      discordSettings: "\u{1F514}",
      default: "\u2022"
    };
    function collapsedMap() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
      } catch (e) {
        return {};
      }
    }
    function saveCollapsed(map) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(map || {}));
      } catch (e) {
        lhWarn("FINAL_ADMIN_SUBJECT_EDIT_20260625", e);
      }
    }
    function cleanNavText(btn) {
      return String(btn?.textContent || "").replace(/\d+/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    }
    function navKey(btn) {
      const page = String(btn?.dataset?.page || "").toLowerCase();
      const text = cleanNavText(btn);
      if (page === "overview" || text.includes("t\u1ED5ng quan")) return "overview";
      if (page === "approvals" || text.includes("ph\xEA duy\u1EC7t")) return "approvals";
      if (page === "requests" || text.includes("y\xEAu c\u1EA7u s\u1EEDa")) return "requests";
      if (page.includes("subjectrequest") || text.includes("yc th\xEAm m\xF4n") || text.includes("y\xEAu c\u1EA7u th\xEAm m\xF4n"))
        return "subjectRequests";
      if (page === "subjectsadmin" || text === "m\xF4n h\u1ECDc" || text.includes("qu\u1EA3n l\xFD m\xF4n")) return "subjectsAdmin";
      if (page.includes("trash") || page.includes("deleted") || text.includes("th\xF9ng r\xE1c")) return "trash";
      if (page === "users" || text.includes("ng\u01B0\u1EDDi d\xF9ng")) return "users";
      if (page === "history" || text.includes("l\u1ECBch s\u1EED")) return "history";
      if (page === "logs" || text.includes("admin logs")) return "logs";
      if (page === "discordsettings" || text.includes("discord")) return "discordSettings";
      return page || text;
    }
    function applyNav(btn, key2, standalone = false) {
      if (!btn) return;
      const badge2 = btn.querySelector(".navBadge")?.outerHTML || "";
      const label = LABEL[key2] || cleanNavText(btn) || key2;
      btn.dataset.short = SHORT[key2] || label.slice(0, 2).toUpperCase();
      btn.dataset.navKey = key2;
      btn.classList.toggle("overviewStandalone", !!standalone);
      btn.innerHTML = '<span class="navGlyph" aria-hidden="true">' + (ICON[key2] || ICON.default) + '</span><span class="navText">' + label + "</span>" + badge2;
    }
    function titleButton(group) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "adminSideGroupTitle";
      btn.innerHTML = '<span class="treeTitleLeft"><span class="navGlyph" aria-hidden="true">' + group.icon + '</span><span class="groupName">' + group.title + '</span></span><span class="treeArrow" aria-hidden="true">\u25BE</span>';
      return btn;
    }
    function setGroupCollapsed(group, collapsed) {
      group.classList.toggle("is-collapsed", !!collapsed);
      const title = group.querySelector(":scope > .adminSideGroupTitle");
      if (title) title.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
    function restoreNavs(side, foot) {
      Array.from(side.querySelectorAll(".adminSideOverview, .adminSideGroup")).forEach((box) => {
        Array.from(box.querySelectorAll(".nav")).forEach((nav) => side.insertBefore(nav, foot || null));
        box.remove();
      });
    }
    function organizeAdminSidebarTree() {
      const side = document.querySelector(".side");
      if (!side) return;
      const foot = side.querySelector(".foot");
      restoreNavs(side, foot);
      const navs = Array.from(side.querySelectorAll(".nav"));
      if (!navs.length) return;
      const used = /* @__PURE__ */ new Set();
      const state = collapsedMap();
      side.classList.add("adminTreeReady");
      const overview = navs.find((n) => !used.has(n) && navKey(n) === "overview");
      if (overview) {
        used.add(overview);
        applyNav(overview, "overview", true);
        const box = document.createElement("div");
        box.className = "adminSideOverview";
        box.appendChild(overview);
        side.insertBefore(box, foot || null);
      }
      GROUPS.forEach((group) => {
        const wrap = document.createElement("div");
        wrap.className = "adminSideGroup";
        wrap.dataset.group = group.title;
        const title = titleButton(group);
        const body = document.createElement("div");
        body.className = "adminSideGroupBody";
        wrap.appendChild(title);
        wrap.appendChild(body);
        group.keys.forEach((key2) => {
          const btn = navs.find((n) => !used.has(n) && navKey(n) === key2);
          if (btn) {
            used.add(btn);
            applyNav(btn, key2, false);
            body.appendChild(btn);
          }
        });
        if (body.querySelector(".nav")) {
          side.insertBefore(wrap, foot || null);
          const hasActive = !!body.querySelector(".nav.active");
          setGroupCollapsed(wrap, hasActive ? false : !!state[group.title]);
          title.onclick = () => {
            const next = !wrap.classList.contains("is-collapsed");
            state[group.title] = next;
            saveCollapsed(state);
            setGroupCollapsed(wrap, next);
          };
        }
      });
      const extra = navs.filter((n) => !used.has(n));
      if (extra.length) {
        const group = { title: "Kh\xE1c", icon: "\u2022" };
        const wrap = document.createElement("div");
        wrap.className = "adminSideGroup";
        wrap.dataset.group = group.title;
        const title = titleButton(group);
        const body = document.createElement("div");
        body.className = "adminSideGroupBody";
        wrap.appendChild(title);
        wrap.appendChild(body);
        extra.forEach((btn) => {
          const key2 = navKey(btn);
          applyNav(btn, key2, false);
          body.appendChild(btn);
        });
        side.insertBefore(wrap, foot || null);
        setGroupCollapsed(wrap, !!state[group.title]);
        title.onclick = () => {
          const next = !wrap.classList.contains("is-collapsed");
          state[group.title] = next;
          saveCollapsed(state);
          setGroupCollapsed(wrap, next);
        };
      }
    }
    window.organizeAdminSidebar = organizeAdminSidebarTree;
    window.organizeAdminSidebarTree = organizeAdminSidebarTree;
    document.addEventListener("DOMContentLoaded", () => {
      organizeAdminSidebarTree();
      setTimeout(organizeAdminSidebarTree, 250);
      setTimeout(organizeAdminSidebarTree, 1200);
    });
  })();
  (function() {
    let deletedQuestionsCache = [];
    let deletedSubjectsCache = [];
    function idText(id) {
      return String(id ?? "");
    }
    function arg(id) {
      return "'" + idText(id).replace(/'/g, "\\'") + "'";
    }
    function shortText(s, n = 110) {
      s = String(s || "").trim();
      return s.length > n ? s.slice(0, n) + "..." : s;
    }
    function trashSearch() {
      return String(document.getElementById("search")?.value || "").trim().toLowerCase();
    }
    function matchTrashText(text) {
      const k = trashSearch();
      return !k || String(text || "").toLowerCase().includes(k);
    }
    async function deleteRowById(table, id) {
      const sid = idText(id);
      let res = await client.from(table).delete().eq("id", sid).select("id");
      if (res.error) return res;
      if ((res.data || []).length) return res;
      if (/^\d+$/.test(sid)) {
        res = await client.from(table).delete().eq("id", Number(sid)).select("id");
        if (res.error) return res;
      }
      return res;
    }
    function renderTrashHTML(questions, subjects) {
      const subjectCards = subjects.map((t) => {
        const backup = t.original_data || {};
        const sub = backup.subject || {};
        const qCount = (backup.questions || []).length;
        return `<div class="item trashItem compactTrashItem trashSubjectItem" data-trash-kind="subject" data-trash-id="${esc(idText(t.id))}">
        <div class="trashMain">
          <div class="trashTitleLine">
            <b>M\xD4N: ${esc(sub.code || "?")} - ${esc(sub.name || "")}</b>
            <span class="badge deleted">\u0110\xE3 x\xF3a m\xF4n</span>
          </div>
          <div class="trashMeta">${qCount} c\xE2u h\u1ECFi \xB7 ${esc(t.deleted_by_email || "?")} \xB7 ${esc(date(t.deleted_at))}</div>
        </div>
        <div class="actions trashActions">
          <button class="act ok" onclick="restoreSubject(${arg(t.id)})">Kh\xF4i ph\u1EE5c</button>
          <button class="act bad" onclick="permanentDeleteSubject(${arg(t.id)})">X\xF3a v\u0129nh vi\u1EC5n</button>
        </div>
      </div>`;
      }).join("");
      const questionCards = questions.map((t) => {
        const q = t.original_data || {};
        return `<div class="item trashItem compactTrashItem trashQuestionItem" data-trash-kind="question" data-trash-id="${esc(idText(t.id))}">
        <div class="trashMain">
          <div class="trashTitleLine">
            <b>${esc(q.subject_code || "")} - C\xE2u ${esc(String(q.num || q.id || "?"))}</b>
            <span class="badge deleted">\u0110\xE3 x\xF3a c\xE2u</span>
          </div>
          <div class="trashQuestionText">${esc(shortText(q.question, 125))}</div>
          <div class="trashMeta">\u0110\xE1p \xE1n: ${esc(q.answer || "")} \xB7 ${esc(t.deleted_by_email || "")} \xB7 ${esc(date(t.deleted_at))}</div>
        </div>
        <div class="actions trashActions">
          <button class="act ok" onclick="restoreQuestion(${arg(t.id)})">Kh\xF4i ph\u1EE5c</button>
          <button class="act bad" onclick="permanentDelete(${arg(t.id)})">X\xF3a v\u0129nh vi\u1EC5n</button>
          <button class="act" onclick="viewTrashDetail(${arg(t.id)})">Xem</button>
        </div>
      </div>`;
      }).join("");
      return `<div class="trashCompactWrap">
      ${subjects.length ? `<section class="trashGroup compactTrashGroup"><h4 class="trashSectionHeading">M\xF4n h\u1ECDc \u0111\xE3 x\xF3a <span>(${subjects.length})</span></h4>${subjectCards}</section>` : ""}
      ${questions.length ? `<section class="trashGroup compactTrashGroup"><h4 class="trashSectionHeading">C\xE2u h\u1ECFi \u0111\xE3 x\xF3a <span>(${questions.length})</span></h4>${questionCards}</section>` : ""}
    </div>`;
    }
    window.loadTrash = async function() {
      if (!isAdmin()) return;
      const el = document.getElementById("trashList");
      const cnt = document.getElementById("trashCount");
      if (el) el.innerHTML = '<p class="muted">\u0110ang t\u1EA3i th\xF9ng r\xE1c...</p>';
      try {
        if (!cache.deleted_questions || !cache.deleted_subjects) {
          await loadAll();
        }
        deletedQuestionsCache = cache.deleted_questions || [];
        deletedSubjectsCache = cache.deleted_subjects || [];
        let questions = deletedQuestionsCache;
        let subjects = deletedSubjectsCache;
        const k = trashSearch();
        if (k) {
          questions = questions.filter((t) => {
            const q = t.original_data || {};
            return matchTrashText(
              `${q.subject_code || ""} ${q.question || ""} ${q.answer || ""} ${q.answer_text || ""} ${q.num || ""} ${t.deleted_by_email || ""}`
            );
          });
          subjects = subjects.filter((t) => {
            const s = (t.original_data || {}).subject || {};
            return matchTrashText(`${s.code || ""} ${s.name || ""} ${s.description || ""} ${t.deleted_by_email || ""}`);
          });
        }
        if (cnt) cnt.textContent = questions.length + subjects.length + " m\u1EE5c";
        if (!el) return;
        if (!questions.length && !subjects.length) {
          el.innerHTML = '<p class="muted">Th\xF9ng r\xE1c hi\u1EC7n \u0111ang tr\u1ED1ng.</p>';
          return;
        }
        el.innerHTML = renderTrashHTML(questions, subjects);
      } catch (e) {
        if (el) el.innerHTML = '<p class="muted">L\u1ED7i t\u1EA3i th\xF9ng r\xE1c: ' + esc(e.message || e) + "</p>";
      }
    };
    window.restoreQuestion = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi kh\xF4i ph\u1EE5c \u0111\u01B0\u1EE3c.");
      const t = deletedQuestionsCache.find((x) => idText(x.id) === idText(id));
      if (!t) return alert("Kh\xF4ng t\xECm th\u1EA5y m\u1EE5c c\u1EA7n kh\xF4i ph\u1EE5c. B\u1EA5m T\u1EA3i l\u1EA1i r\u1ED3i th\u1EED l\u1EA1i.");
      if (!confirm("Kh\xF4i ph\u1EE5c c\xE2u h\u1ECFi n\xE0y?")) return;
      setBusy(true, "\u0110ang kh\xF4i ph\u1EE5c...");
      try {
        const q = t.original_data || {};
        if (!await adminAction("restore_question", { question_id: q.id || id })) return;
        await logAction("restore_question", "questions", q.id, { subject_code: q.subject_code, num: q.num });
        await loadAll();
        await loadTrash();
        toast("\u0110\xE3 kh\xF4i ph\u1EE5c");
      } finally {
        setBusy(false);
      }
    };
    window.permanentDelete = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      const t = deletedQuestionsCache.find((x) => idText(x.id) === idText(id));
      const q = t?.original_data || {};
      if (!confirm("X\xF3a V\u0128NH VI\u1EC4N c\xE2u " + String(q.num || q.id || "?") + "?\n\nKh\xF4ng th\u1EC3 kh\xF4i ph\u1EE5c sau thao t\xE1c n\xE0y!"))
        return;
      setBusy(true, "\u0110ang x\xF3a v\u0129nh vi\u1EC5n...");
      try {
        if (!await adminAction("permanent_delete_question", { question_id: id })) return;
        await logAction("permanent_delete", "deleted_questions", id, { subject_code: q.subject_code, num: q.num });
        await loadAll();
        await loadTrash();
        toast("\u0110\xE3 x\xF3a v\u0129nh vi\u1EC5n");
      } finally {
        setBusy(false);
      }
    };
    window.restoreSubject = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi kh\xF4i ph\u1EE5c \u0111\u01B0\u1EE3c.");
      const t = deletedSubjectsCache.find((x) => idText(x.id) === idText(id));
      if (!t) return alert("Kh\xF4ng t\xECm th\u1EA5y m\u1EE5c c\u1EA7n kh\xF4i ph\u1EE5c. B\u1EA5m T\u1EA3i l\u1EA1i r\u1ED3i th\u1EED l\u1EA1i.");
      if (!confirm("Kh\xF4i ph\u1EE5c m\xF4n h\u1ECDc n\xE0y?")) return;
      setBusy(true, "\u0110ang kh\xF4i ph\u1EE5c...");
      try {
        const backup = t.original_data || {};
        if (!await adminAction("restore_subject", { subject_id: id, code: backup.subject?.code })) return;
        await logAction("restore_subject", "subjects", backup.subject?.code, { questions: backup.questions?.length });
        await loadAll();
        await loadTrash();
        toast("\u0110\xE3 kh\xF4i ph\u1EE5c m\xF4n " + (backup.subject?.code || ""));
      } finally {
        setBusy(false);
        hideProgress();
      }
    };
    window.permanentDeleteSubject = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      const t = deletedSubjectsCache.find((x) => idText(x.id) === idText(id));
      const backup = t?.original_data || {};
      const sub = backup.subject || {};
      if (!confirm("X\xF3a V\u0128NH VI\u1EC4N m\xF4n " + (sub.code || "?") + "?\n\nKh\xF4ng th\u1EC3 kh\xF4i ph\u1EE5c sau thao t\xE1c n\xE0y!")) return;
      setBusy(true, "\u0110ang x\xF3a v\u0129nh vi\u1EC5n...");
      try {
        const r = await deleteRowById("deleted_subjects", id);
        if (r.error) return alert("L\u1ED7i x\xF3a v\u0129nh vi\u1EC5n: " + r.error.message);
        if (!(r.data || []).length)
          return alert(
            "Kh\xF4ng t\xECm th\u1EA5y d\xF2ng \u0111\u1EC3 x\xF3a. B\u1EA5m T\u1EA3i l\u1EA1i, n\u1EBFu v\u1EABn c\xF2n th\xEC ki\u1EC3m tra quy\u1EC1n x\xF3a b\u1EA3ng deleted_subjects."
          );
        await logAction("permanent_delete_subject", "deleted_subjects", id, { code: sub.code });
        await loadTrash();
        toast("\u0110\xE3 x\xF3a v\u0129nh vi\u1EC5n");
      } finally {
        setBusy(false);
      }
    };
    window.viewTrashDetail = function(id) {
      const t = deletedQuestionsCache.find((x) => idText(x.id) === idText(id));
      if (!t) return alert("Kh\xF4ng t\xECm th\u1EA5y.");
      const q = t.original_data || {};
      openModal(
        "Chi ti\u1EBFt c\xE2u \u0111\xE3 x\xF3a",
        `
      <p><b>M\xF4n:</b> ${esc(q.subject_code || "")}</p>
      <p><b>C\xE2u ${esc(String(q.num || ""))}:</b> ${esc(q.question || "")}</p>
      <p><b>\u0110\xE1p \xE1n:</b> ${esc(q.answer || "")}</p>
      <p><b>X\xF3a l\xFAc:</b> ${esc(date(t.deleted_at))}</p>
      <p><b>X\xF3a b\u1EDFi:</b> ${esc(t.deleted_by_email || "")}</p>
      <div class="actions" style="margin-top:12px">
        <button class="act ok" onclick="restoreQuestion(${arg(t.id)});lhCloseModal();">Kh\xF4i ph\u1EE5c</button>
        <button class="act bad" onclick="permanentDelete(${arg(t.id)});lhCloseModal();">X\xF3a v\u0129nh vi\u1EC5n</button>
      </div>
    `
      );
    };
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll(".nav").forEach((b) => {
        if (b.dataset.page === "trash") b.addEventListener("click", () => setTimeout(loadTrash, 50));
      });
      const input = document.getElementById("search");
      if (input && !input.__trashSearchPatched) {
        input.__trashSearchPatched = true;
        input.addEventListener("input", () => {
          if (document.getElementById("trash")?.classList.contains("active")) loadTrash();
        });
      }
    });
  })();
  async function sendActionToDiscord(actionName, targetType, targetId, details) {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "action",
          user_id: user?.id,
          email: user?.email || profile?.email,
          action_name: actionName,
          target_type: targetType,
          target_id: targetId
        }),
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(8e3) : void 0
      });
    } catch (error) {
      console.warn("L\u1ED7i g\u1EEDi Discord Client:", error);
    }
  }
  async function sendLoginToDiscord(email, role) {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "login", user_id: user?.id, email, role, source: "admin" }),
        signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(8e3) : void 0
      });
    } catch (error) {
      console.warn("L\u1ED7i g\u1EEDi th\xF4ng b\xE1o login:", error);
    }
  }
  (function() {
    function avatarUrl(p) {
      return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || "";
    }
    function avatarLetter(p) {
      return String(p?.email || p?.id || "?").trim().slice(0, 1).toUpperCase() || "?";
    }
    window.closeUserActionMenuFinal = function() {
      document.getElementById("lhActionBackdrop")?.remove();
      document.getElementById("lhActionMenuFloat")?.remove();
      document.querySelectorAll(".lhDotsBtn.isOpen").forEach((b) => b.classList.remove("isOpen"));
    };
    window.openUserActionMenuFinal = function(ev, uid) {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      const btn = ev?.currentTarget || ev?.target;
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng.");
      const wasOpen = btn?.classList?.contains("isOpen");
      closeUserActionMenuFinal();
      if (wasOpen) return;
      btn?.classList?.add("isOpen");
      const backdrop = document.createElement("div");
      backdrop.id = "lhActionBackdrop";
      backdrop.onclick = closeUserActionMenuFinal;
      document.body.appendChild(backdrop);
      const menu = document.createElement("div");
      menu.id = "lhActionMenuFloat";
      menu.innerHTML = isAdmin() ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED</button>
         <button class="act ${isBlocked(p) ? "ok" : "bad"}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? "Unblock" : "Block"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "editor" ? "user" : "editor"}');closeUserActionMenuFinal();">${p.role === "editor" ? "G\u1EE1 editor" : "Cho editor"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "admin" ? "user" : "admin"}');closeUserActionMenuFinal();">${p.role === "admin" ? "G\u1EE1 admin" : "Cho admin"}</button>` : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED</button>`;
      document.body.appendChild(menu);
      const r = btn.getBoundingClientRect();
      const mw = menu.offsetWidth || 190;
      const mh = menu.offsetHeight || 190;
      let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
      let top = r.bottom + 8;
      if (top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
      menu.style.left = left + "px";
      menu.style.top = top + "px";
    };
    window.openUserAvatarFinal = window.openUserAvatarFinal || function(uid) {
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng.");
      const src = avatarUrl(p), name = p.email || p.id || "Ng\u01B0\u1EDDi d\xF9ng";
      if (src)
        openModal(
          "Avatar - " + name,
          `<div class="lhAvatarPreview"><img src="${esc(src)}" alt="Avatar" referrerpolicy="no-referrer"><p class="muted">${esc(name)}</p></div>`
        );
      else
        openModal(
          "Avatar - " + name,
          `<div class="lhAvatarPreview lhAvatarPreviewEmpty"><div>${esc(avatarLetter(p))}</div><p class="muted">T\xE0i kho\u1EA3n n\xE0y ch\u01B0a c\xF3 avatar trong database.</p><p class="muted">${esc(name)}</p></div>`
        );
    };
    document.addEventListener(
      "click",
      (e) => {
        if (e.target.closest("#lhActionMenuFloat") || e.target.closest(".lhDotsBtn")) return;
        closeUserActionMenuFinal();
      },
      true
    );
    window.addEventListener("resize", closeUserActionMenuFinal);
    window.addEventListener("scroll", closeUserActionMenuFinal, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeUserActionMenuFinal();
    });
  })();
  (function() {
    window.openUserActionMenuFinal = function(ev, uid) {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      const btn = ev?.currentTarget || ev?.target;
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng.");
      const wasOpen = btn?.classList?.contains("isOpen");
      if (typeof closeUserActionMenuFinal === "function") closeUserActionMenuFinal();
      if (wasOpen) return;
      btn?.classList?.add("isOpen");
      const backdrop = document.createElement("div");
      backdrop.id = "lhActionBackdrop";
      backdrop.onclick = () => typeof closeUserActionMenuFinal === "function" && closeUserActionMenuFinal();
      document.body.appendChild(backdrop);
      const role = String(p.role || "user").toLowerCase();
      const revokeBtn = role !== "admin" ? `<button class="act bad revokeAccessBtn" onclick="revokeApproval('${p.id}');closeUserActionMenuFinal();">Thu h\u1ED3i quy\u1EC1n</button>` : "";
      const menu = document.createElement("div");
      menu.id = "lhActionMenuFloat";
      menu.innerHTML = isAdmin() ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED</button>
         <button class="act ${isBlocked(p) ? "ok" : "bad"}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? "Unblock" : "Block"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "editor" ? "user" : "editor"}');closeUserActionMenuFinal();">${p.role === "editor" ? "G\u1EE1 editor" : "Cho editor"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "admin" ? "user" : "admin"}');closeUserActionMenuFinal();">${p.role === "admin" ? "G\u1EE1 admin" : "Cho admin"}</button>
         ${revokeBtn}` : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED</button>`;
      document.body.appendChild(menu);
      const r = btn.getBoundingClientRect();
      const mw = menu.offsetWidth || 210;
      const mh = menu.offsetHeight || 240;
      let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
      let top = r.bottom + 8;
      if (top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
      menu.style.left = left + "px";
      menu.style.top = top + "px";
    };
  })();
  (function() {
    window.revokeApproval = async function(uid) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y user.");
      if (String(p.role || "").toLowerCase() === "admin") return alert("Kh\xF4ng th\u1EC3 thu h\u1ED3i quy\u1EC1n truy c\u1EADp c\u1EE7a admin.");
      if (!confirm(
        "Thu h\u1ED3i quy\u1EC1n truy c\u1EADp c\u1EE7a: " + (p.email || uid) + "?\n\nUser s\u1EBD chuy\u1EC3n v\u1EC1 tab Ph\xEA duy\u1EC7t \u0111\u1EC3 admin duy\u1EC7t l\u1EA1i."
      ))
        return;
      setBusy(true, "\u0110ang thu h\u1ED3i...");
      try {
        if (!await adminAction("revoke_user_approval", { target_user_id: uid })) return;
        await logAction("revoke_approval", "profiles", uid, { email: p.email });
        p.approved = false;
        renderUsers();
        if (typeof renderApprovals === "function") renderApprovals();
        toast("\u0110\xE3 chuy\u1EC3n user sang tab Ph\xEA duy\u1EC7t");
      } finally {
        setBusy(false);
      }
    };
    setTimeout(() => {
      try {
        window.renderUsers?.();
        window.renderApprovals?.();
      } catch (e) {
        lhWarn("REVOKE_MOVES_USER_TO_APPROVAL_AND_APPROVED_USERS_UI_20260625", e);
      }
    }, 300);
  })();
  (function() {
    function avUrl(p) {
      return p?.avatar_url || p?.avatar || p?.picture || p?.photo_url || p?.image_url || "";
    }
    function avLetter(p) {
      return String(p?.email || p?.id || "?").trim().slice(0, 1).toUpperCase() || "?";
    }
    function avatarButton(p, cls = "") {
      const src = avUrl(p);
      const klass = `lhUserAvatar ${cls}`.trim();
      if (src) {
        return `<button class="${klass}" type="button" title="Ph\xF3ng to avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><img src="${esc(src)}" alt="Avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('isBroken');this.remove();"></button>`;
      }
      return `<button class="${klass} avatarNoImage" type="button" title="Ch\u01B0a c\xF3 avatar" onclick="openUserAvatarFinal('${esc(p.id)}')"><span>${esc(avLetter(p))}</span></button>`;
    }
    function roleBadgeFinal(role) {
      const r = role || "user";
      return `<span class="badge lhRoleBadge lhRole-${esc(r)}">${esc(r)}</span>`;
    }
    function actTime(p) {
      return p?.last_activity || p?.last_login || p?.updated_at || p?.created_at || "";
    }
    function actMs(p) {
      const n = new Date(actTime(p)).getTime();
      return Number.isFinite(n) ? n : 0;
    }
    function actText(p) {
      const t = actTime(p);
      if (!t) return "Ch\u01B0a c\xF3";
      const diff = Date.now() - new Date(t).getTime();
      if (!Number.isFinite(diff)) return date(t);
      if (diff < 2 * 60 * 1e3) return "\u0110ang ho\u1EA1t \u0111\u1ED9ng";
      if (diff < 60 * 60 * 1e3) return Math.max(1, Math.floor(diff / 6e4)) + " ph\xFAt tr\u01B0\u1EDBc";
      return date(t);
    }
    function pendingUsers() {
      return (cache.profiles || []).filter((p) => p.approved === false);
    }
    window.renderUsers = renderUsers = function() {
      if (typeof closeUserActionMenuFinal === "function") closeUserActionMenuFinal();
      const allProfiles = cache.profiles || [];
      const approvedProfiles = allProfiles.filter((p) => p.approved !== false);
      const onlineCount = approvedProfiles.filter((p) => actText(p) === "\u0110ang ho\u1EA1t \u0111\u1ED9ng").length;
      const staffCount = approvedProfiles.filter((p) => p.role === "admin" || p.role === "editor").length;
      const pendingCount = allProfiles.filter((p) => p.approved === false).length;
      const elTotal = $("userStatTotal");
      if (elTotal) elTotal.textContent = approvedProfiles.length;
      const elOnline = $("userStatOnline");
      if (elOnline) elOnline.textContent = onlineCount;
      const elStaff = $("userStatStaff");
      if (elStaff) elStaff.textContent = staffCount;
      const elPending = $("userStatPending");
      if (elPending) elPending.textContent = pendingCount;
      const arr = approvedProfiles.filter(
        (p) => match(
          `${p.email || ""} ${p.role || ""} ${p.id || ""} ${p.current_subject || ""} ${p.device_info || ""} ${p.last_activity || ""}`
        )
      ).sort((a, b) => actMs(b) - actMs(a));
      const headHTML = typeof getUserTableHeadHTML === "function" ? getUserTableHeadHTML() : `<div class="userRow muted tableHead lhUserRowSaaS approvedUsersHead">
          <div class="thCol">NG\u01AF\u1EDCI D\xD9NG</div>
          <div class="thCol thMeta"><span class="thSub">M\xD4N \u0110ANG H\u1ECCC</span><span class="thDev">THI\u1EBET B\u1ECA</span></div>
          <div class="thCol">TR\u1EA0NG TH\xC1I & HO\u1EA0T \u0110\u1ED8NG</div>
          <div class="thCol thActions">THAO T\xC1C</div>
        </div>`;
      const bulkReloadBar = `<div class="userAdminBulkBar" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;padding:8px 14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
      <span style="font-size:0.86rem;color:var(--mist);">V\u1EEBa c\u1EADp nh\u1EADt web? Nh\u1EAFc m\u1ECDi ng\u01B0\u1EDDi t\u1EA3i l\u1EA1i trang:</span>
      <button type="button" class="act ok" style="white-space:nowrap;" onclick="notifyReloadAllUsers()">\u{1F514} Nh\u1EAFc t\u1EA5t c\u1EA3 t\u1EA3i l\u1EA1i</button>
    </div>`;
      const helpers = { actText, actTime, date, isBlocked, badge, roleBadgeFinal, avatarButton, esc };
      const rowFn = typeof renderUserRowSaaS === "function" ? renderUserRowSaaS : null;
      $("userList").innerHTML = bulkReloadBar + headHTML + (arr.map((p) => {
        if (rowFn) return rowFn(p, helpers);
        const activeText = actText(p);
        const activeClass = activeText === "\u0110ang ho\u1EA1t \u0111\u1ED9ng" ? "activityNow" : "";
        const subjectTag = p.current_subject ? `<span class="saasSubjectChip">${esc(p.current_subject)}</span>` : `<span class="saasMutedChip">Ch\u01B0a ch\u1ECDn m\xF4n</span>`;
        const deviceTag = p.device_info ? `<button class="saasDeviceChip saasDeviceBtn" type="button" title="Xem l\u1ECBch s\u1EED thi\u1EBFt b\u1ECB" onclick="showUserDeviceHistoryModal('${esc(p.id)}')">${esc(p.device_info)}</button>` : `<span class="saasMutedChip">Ch\u01B0a r\xF5</span>`;
        const statusBadge = isBlocked(p) ? badge("blocked") : `<span class="badge approved userApprovedBadge"><span class="badgeDot"></span>\u0110\xE3 duy\u1EC7t</span>`;
        return `<div class="userRow activitySortedRow lhUserRowSaaS approvedUserRow ${activeClass}">
        <div class="saasUserCol">
          <div class="lhAvatarCell">${avatarButton(p)}</div>
          <div class="saasUserInfo">
            <div class="saasMailRow">
              <span class="mail">${esc(p.email || p.id)}</span>
            </div>
            <div class="saasSubRow">
              ${roleBadgeFinal(p.role)}
              <span class="uid">${esc(p.id)}</span>
            </div>
          </div>
        </div>
        <div class="saasMetaCol">
          <div class="saasSubjectCell">${subjectTag}</div>
          <div class="saasDeviceCell">${deviceTag}</div>
        </div>
        <div class="saasStatusCol">
          <div class="saasStatusRow">${statusBadge}</div>
          <div class="saasActivityRow"><b class="lastActivity ${activeClass}">${esc(activeText)}</b> <span class="uidTime">${esc(date(actTime(p)))}</span></div>
        </div>
        <div class="actions lhActionsCell">
          <button class="lhDotsBtn" type="button" title="Thao t\xE1c" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>
      </div>`;
      }).join("") || '<p class="muted">Kh\xF4ng c\xF3 ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 duy\u1EC7t.</p>');
    };
    window.renderApprovals = renderApprovals = function() {
      document.querySelectorAll(".approvalFilter").forEach((btn) => {
        if (btn.dataset.af === "approved" || btn.dataset.af === "all") btn.classList.add("hidden");
        if (btn.dataset.af === "pending") btn.classList.add("active");
      });
      const pend = pendingUsers().length;
      const ep = document.getElementById("afPending");
      if (ep) ep.textContent = pend;
      const badgeEl = document.getElementById("approvalBadge");
      if (badgeEl) {
        badgeEl.textContent = pend;
        badgeEl.classList.toggle("hidden", pend === 0);
      }
      const statPendingApproval = document.getElementById("statPendingApproval");
      if (statPendingApproval) statPendingApproval.textContent = pend;
      const el = document.getElementById("approvalList");
      if (!el) return;
      let arr = pendingUsers();
      const k = (document.getElementById("search")?.value || "").trim().toLowerCase();
      if (k) arr = arr.filter((p) => `${p.email || ""} ${p.id || ""} ${p.role || ""}`.toLowerCase().includes(k));
      if (!arr.length) {
        el.innerHTML = '<p class="muted">Kh\xF4ng c\xF3 t\xE0i kho\u1EA3n n\xE0o \u0111ang ch\u1EDD duy\u1EC7t.</p>';
        return;
      }
      el.innerHTML = arr.map(
        (p) => `<div class="approvalCard isPending approvalCardFixed">
      <div class="approvalAvatarCell">${avatarButton(p, "approvalAvatar")}</div>
      <div class="approvalCardInfo">
        <div class="mail">${esc(p.email || p.id)}</div>
        <div class="meta">${roleBadgeFinal(p.role)} <span class="badge rejected">Ch\u1EDD duy\u1EC7t</span> \xB7 \u0110\u0103ng k\xFD: ${esc(date(p.created_at))} \xB7 Login: ${esc(date(p.last_login || p.created_at))}</div>
        <div class="uid">${esc(p.id)}</div>
      </div>
      <div class="approvalCardActions">${isAdmin() ? `<button class="act ok" onclick="approveUser('${esc(p.id)}')">Ph\xEA duy\u1EC7t</button><button class="act bad" onclick="rejectUser('${esc(p.id)}')">T\u1EEB ch\u1ED1i & x\xF3a</button>` : '<span class="muted">Ch\u1EC9 admin</span>'}</div>
    </div>`
      ).join("");
    };
    setTimeout(() => {
      try {
        renderUsers();
        renderApprovals();
      } catch (e) {
        lhWarn("FINAL_APPROVAL_UI_AND_REMOVE_USER_NOTE_20260625", e);
      }
    }, 250);
  })();
  (function() {
    window.__ADMIN_UI_CLEAN_FINAL__ = "20260627";
    function closeLegacyUi() {
      document.querySelectorAll(".userActionMenu").forEach(function(el) {
        el.remove();
      });
      document.querySelectorAll(".avatarCell,.compactUserActions").forEach(function(el) {
        el.remove();
      });
      var menus = Array.from(document.querySelectorAll("#userActionMenuFinal,.lhUserActionMenuFinal"));
      menus.slice(0, Math.max(0, menus.length - 1)).forEach(function(el) {
        el.remove();
      });
      document.querySelectorAll(".modal").forEach(function(m) {
        if (m.id !== "modal" && !m.classList.contains("keepModal")) m.classList.add("hidden");
      });
    }
    function ensureFinalRender() {
      try {
        if (document.getElementById("users")?.classList.contains("active") && typeof renderUsers === "function")
          renderUsers();
        if (document.getElementById("approvals")?.classList.contains("active") && typeof renderApprovals === "function")
          renderApprovals();
      } catch (e) {
        console.warn("[admin cleanup render]", e);
      }
    }
    function run() {
      closeLegacyUi();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
    setTimeout(function() {
      run();
      ensureFinalRender();
    }, 300);
    setTimeout(run, 1200);
  })();
  (function() {
    let subjectReqCache = [];
    let subjectReqFilter = "pending";
    window.loadSubjectRequests = async function() {
      if (!isEditor()) return;
      const el = $("subjectRequestList");
      if (el) el.innerHTML = '<p class="muted">\u0110ang t\u1EA3i y\xEAu c\u1EA7u th\xEAm m\xF4n...</p>';
      try {
        const r0 = await window.__fetchAdminDashboardJSON();
        const dash = r0.dash || {};
        if (!r0.ok || dash.error) throw new Error(dash.error || "HTTP " + r0.status);
        subjectReqCache = (dash.subject_requests || []).map((s) => ({
          ...s,
          questions_data: (typeof s.questions_data === "string" ? (() => {
            try {
              return JSON.parse(s.questions_data);
            } catch (e) {
              return [];
            }
          })() : s.questions_data) || []
        }));
        cache.subject_requests = subjectReqCache;
      } catch (e) {
        if (el) el.innerHTML = `<p class="muted">Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c subject_requests: ${esc(e.message || e)}</p>`;
        return;
      }
      renderSubjectRequestsFixed(subjectReqFilter);
      const badge2 = $("subjectRequestBadge");
      const pending = subjectReqCache.filter((x) => x.status === "pending").length;
      if (badge2) {
        badge2.textContent = pending;
        badge2.classList.toggle("hidden", !pending);
      }
    };
    window.filterSubjectRequests = function(status) {
      subjectReqFilter = status || "pending";
      document.querySelectorAll(".subjectReqFilter").forEach((b) => b.classList.toggle("active", b.dataset.srf === subjectReqFilter));
      renderSubjectRequestsFixed(subjectReqFilter);
    };
    function renderSubjectRequestsFixed(filter = "pending") {
      const el = $("subjectRequestList");
      if (!el) return;
      const list = filter === "all" ? subjectReqCache : subjectReqCache.filter((r) => (r.status || "pending") === filter);
      const pending = subjectReqCache.filter((r) => (r.status || "pending") === "pending").length;
      const approved = subjectReqCache.filter((r) => r.status === "approved").length;
      const rejected = subjectReqCache.filter((r) => r.status === "rejected").length;
      if ($("srfPending")) $("srfPending").textContent = pending;
      if ($("srfApproved")) $("srfApproved").textContent = approved;
      if ($("srfRejected")) $("srfRejected").textContent = rejected;
      if ($("srfAll")) $("srfAll").textContent = subjectReqCache.length;
      if ($("srfPendingTab")) $("srfPendingTab").textContent = pending;
      if ($("srfApprovedTab")) $("srfApprovedTab").textContent = approved;
      if ($("srfRejectedTab")) $("srfRejectedTab").textContent = rejected;
      if (!list.length) {
        const emptyMap = {
          pending: { icon: "\u23F3", title: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u n\xE0o \u0111ang ch\u1EDD", hint: "Khi sinh vi\xEAn g\u1EEDi y\xEAu c\u1EA7u th\xEAm m\xF4n m\u1EDBi, ch\xFAng s\u1EBD xu\u1EA5t hi\u1EC7n t\u1EA1i \u0111\xE2y." },
          approved: { icon: "\u2705", title: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u n\xE0o \u0111\u01B0\u1EE3c duy\u1EC7t", hint: "C\xE1c y\xEAu c\u1EA7u \u0111\xE3 ph\xEA duy\u1EC7t s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\xE2y." },
          rejected: { icon: "\u274C", title: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u n\xE0o b\u1ECB t\u1EEB ch\u1ED1i", hint: "C\xE1c y\xEAu c\u1EA7u \u0111\xE3 t\u1EEB ch\u1ED1i s\u1EBD hi\u1EC3n th\u1ECB \u1EDF \u0111\xE2y." },
          all: { icon: "\u{1F4EC}", title: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u th\xEAm m\xF4n n\xE0o", hint: "Khi c\xF3 y\xEAu c\u1EA7u t\u1EEB sinh vi\xEAn, b\u1EA1n s\u1EBD th\u1EA5y ch\xFAng \u1EDF \u0111\xE2y." }
        };
        const em = emptyMap[filter] || emptyMap.all;
        el.innerHTML = `<div class="sreqEmptyState">
        <div class="sreqEmptyIcon">${em.icon}</div>
        <div class="sreqEmptyTitle">${em.title}</div>
        <div class="sreqEmptyHint">${em.hint}</div>
      </div>`;
        return;
      }
      el.innerHTML = list.map((r) => {
        const qs = Array.isArray(r.questions_data) ? r.questions_data : [];
        const status = r.status || "pending";
        const statusText = status === "approved" ? "\u0110\xE3 duy\u1EC7t" : status === "rejected" ? "T\u1EEB ch\u1ED1i" : "Ch\u1EDD duy\u1EC7t";
        const statusAccent = status === "approved" ? "#34d399" : status === "rejected" ? "#f87171" : "#e2b86b";
        const dateStr = r.created_at ? new Date(r.created_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "M\u1EDBi g\u1EEDi";
        return `<div class="item subjectRequestItem" data-srid="${r.id}" style="border-left: 3px solid ${statusAccent}33;">
        <div class="sreqTopRow">
          <div class="sreqTitleGroup">
            <span class="sreqCodeBadge">${esc(r.code || "?")}</span>
            <span class="sreqName">${esc(r.name || "Ch\u01B0a c\xF3 t\xEAn")}</span>
            <span class="badge ${esc(status)}">${statusText}</span>
          </div>
        </div>
        <div class="sreqMetaGrid">
          <div class="sreqMetaTag"><span>\u{1F464}</span> <span>${esc(r.user_email || r.user_id || "\u1EA8n danh")}</span></div>
          <div class="sreqMetaTag"><span>\u{1F552}</span> <span>${dateStr}</span></div>
          ${qs.length ? `<div class="sreqMetaTag isQuestionCount"><span>\u{1F4E6}</span> <span>${qs.length} c\xE2u h\u1ECFi k\xE8m</span></div>` : '<div class="sreqMetaTag"><span>\u{1F4ED}</span> <span style="opacity:.55">Kh\xF4ng c\xF3 c\xE2u h\u1ECFi</span></div>'}
        </div>
        ${r.description ? `<div class="sreqDescBox"><b>M\xF4 t\u1EA3:</b> ${esc(r.description)}</div>` : ""}
        ${r.admin_note ? `<div class="sreqNoteBox"><b>\u{1F4AC} Ghi ch\xFA Admin:</b> ${esc(r.admin_note)}</div>` : ""}
        <div class="actions sreqActions">
          ${qs.length ? `<button class="act" onclick="previewSubjectRequestQuestionsFixed(${r.id})">\u{1F441} Xem ${qs.length} c\xE2u h\u1ECFi</button>` : ""}
          ${status === "pending" ? `<button class="act ok" onclick="approveSubjectRequest(${r.id})">\u2713 Ph\xEA duy\u1EC7t</button><button class="act bad" onclick="rejectSubjectRequest(${r.id})">\u2715 T\u1EEB ch\u1ED1i</button>` : ""}
        </div>
      </div>`;
      }).join("");
    }
    window.previewSubjectRequestQuestionsFixed = function(id) {
      const r = subjectReqCache.find((x) => String(x.id) === String(id));
      if (!r) return;
      const qs = Array.isArray(r.questions_data) ? r.questions_data : [];
      const html = qs.slice(0, 50).map(
        (q, i) => `<div class="item"><b>C\xE2u ${esc(q.num || i + 1)}</b>: ${esc(String(q.question || "").slice(0, 220))}<br><span class="muted">\u0110\xE1p \xE1n: ${esc(q.answer || "?")}</span></div>`
      ).join("") || '<p class="muted">Kh\xF4ng c\xF3 c\xE2u h\u1ECFi \u0111\xEDnh k\xE8m.</p>';
      openModal(
        `C\xE2u h\u1ECFi c\u1EE7a y\xEAu c\u1EA7u ${esc(r.code || "")}`,
        html + (qs.length > 50 ? `<p class="muted">C\xF2n ${qs.length - 50} c\xE2u n\u1EEFa...</p>` : "")
      );
    };
    const oldSetPageFixed = setPage;
    setPage = function(id, n) {
      oldSetPageFixed(id, n);
      if (id === "subjectRequests") setTimeout(() => window.loadSubjectRequests?.(), 50);
      if (id === "requests") renderRequests();
    };
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        if (!cache.subject_requests) window.loadSubjectRequests?.();
      }, 1200);
    });
  })();
  (function() {
    const E = (x) => String(x ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
    function getImgUrl(im) {
      if (!im) return "";
      if (typeof im === "string") return im.trim();
      if (typeof im !== "object") return "";
      return String(
        im.src || im.url || im.secure_url || im.publicUrl || im.public_url || im.file_url || im.image_url || im.dataUrl || im.data_url || im.path || ""
      ).trim();
    }
    function imgs(v) {
      if (!v) return [];
      let raw = v;
      if (typeof raw === "string") {
        const t = raw.trim();
        if (!t || t === "[]" || t === "{}" || t.toLowerCase() === "kh\xF4ng c\xF3") return [];
        if (t.startsWith("[") && t.endsWith("]") || t.startsWith("{") && t.endsWith("}")) {
          try {
            raw = JSON.parse(t);
          } catch (e) {
            raw = t;
          }
        }
      }
      if (!Array.isArray(raw)) raw = [raw];
      return raw.map(getImgUrl).filter(Boolean);
    }
    function imageBox(v) {
      const a = imgs(v);
      if (!a.length) return '<div class="adminReqNoImage">Kh\xF4ng c\xF3 \u1EA3nh</div>';
      return '<div class="adminReqImageGrid">' + a.map(
        (src, i) => `<figure class="adminReqImageFig"><img src="${E(src)}" loading="lazy" onclick="openAdminReqImageForce('${encodeURIComponent(src)}')" onerror="this.closest('.adminReqImageFig')?.classList.add('imgBroken')"><figcaption>\u1EA2nh ${i + 1}</figcaption></figure>`
      ).join("") + "</div>";
    }
    window.openAdminReqImageForce = function(x) {
      const src = decodeURIComponent(x || "");
      openModal("Xem \u1EA3nh", `<div class="adminReqImageZoom"><img src="${E(src)}"></div>`);
    };
    function textBox(v, title) {
      const val = typeof formatValue === "function" ? formatValue(v) : String(v ?? "");
      return `<pre><b>${title}</b>
${E(val)}</pre>`;
    }
    window.compareHTML = compareHTML = function(oldData, newData) {
      oldData = oldData || {};
      newData = newData || {};
      const fields = ["question", "options", "answer"];
      const hasImage = imgs(oldData.images).length || imgs(newData.images).length || Object.prototype.hasOwnProperty.call(oldData, "images") || Object.prototype.hasOwnProperty.call(newData, "images");
      if (hasImage) fields.push("images");
      return '<div class="diffList compactDiffList adminReqDiffList">' + fields.map((f) => {
        const label = typeof labelField === "function" ? labelField(f) : f;
        const before = oldData[f], after = newData[f];
        const changed = JSON.stringify(f === "images" ? imgs(before) : before) !== JSON.stringify(f === "images" ? imgs(after) : after);
        return `<section class="diffBlock ${changed ? "changed" : ""} compactDiffBlock ${f === "images" ? "imageDiffBlock" : ""}"><h3>${E(label)}<span>${changed ? "\u0110\xE3 \u0111\u1ED5i" : "Kh\xF4ng \u0111\u1ED5i"}</span></h3><div class="compare compactCompare ${f === "images" ? "imageCompare" : ""}"><div class="adminReqCompareCol"><b class="adminReqColTitle">Tr\u01B0\u1EDBc</b>${f === "images" ? imageBox(before) : textBox(before, "Tr\u01B0\u1EDBc")}</div><div class="adminReqCompareCol"><b class="adminReqColTitle">Sau</b>${f === "images" ? imageBox(after) : textBox(after, "Sau")}</div></div></section>`;
      }).join("") + "</div>";
    };
    window.viewReq = viewReq = async function(id) {
      const r = (cache.requests || []).find((x) => String(x.id) === String(id));
      if (!r) return alert("Kh\xF4ng t\xECm th\u1EA5y y\xEAu c\u1EA7u s\u1EEDa.");
      let q = (cache.questions || []).find((x) => String(x.id) === String(r.question_id)) || (cache.questions || []).find((x) => String(x.num) === String(r.question_num));
      const oldData = Object.assign({}, q || {}, r.old_data || {});
      if (q && !Object.prototype.hasOwnProperty.call(oldData, "images")) oldData.images = q.images || [];
      const newData = Object.assign({}, r.new_data || {});
      if (!Object.prototype.hasOwnProperty.call(newData, "images") && r.new_data && Object.keys(r.new_data).length)
        newData.images = [];
      const subject = typeof subjectLabel === "function" ? subjectLabel(r) : r.subject_code || oldData.subject_code || newData.subject_code || "Ch\u01B0a r\xF5 m\xF4n";
      openModal(
        `${subject} \xB7 Y\xEAu c\u1EA7u s\u1EEDa c\xE2u ${typeof questionLabel === "function" ? questionLabel(r) : r.question_num || r.id}`,
        compareHTML(oldData, newData)
      );
    };
  })();
  (function() {
    if (window.__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628) return;
    window.__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628 = true;
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    const HISTORY_LIGHT_COLS = "id,question_id,question_num,subject_code,created_at,changed_by,changed_by_email,user_email,admin_email,approved_by,request_id";
    const cache2 = /* @__PURE__ */ new Map();
    const pending = /* @__PURE__ */ new Map();
    function isSupabaseRest(url) {
      return /\/rest\/v1\//.test(url.pathname);
    }
    function methodOf(init2) {
      return String(init2 && init2.method ? init2.method : "GET").toUpperCase();
    }
    function ttlFor(url, method) {
      if (!isSupabaseRest(url)) return 0;
      if (method !== "GET" && method !== "HEAD") return 0;
      if (url.pathname.includes("/rest/v1/site_settings")) return 3e4;
      if (url.pathname.includes("/rest/v1/subject_requests")) return 5e3;
      if (url.pathname.includes("/rest/v1/profiles") && url.searchParams.has("id")) return 1e4;
      return 0;
    }
    function slimAdminUrl(url, method) {
      if (!isSupabaseRest(url)) return url;
      if (method !== "GET" && method !== "HEAD") return url;
      if (url.pathname.includes("/rest/v1/question_history") && url.searchParams.get("select") === "*") {
        url.searchParams.set("select", HISTORY_LIGHT_COLS);
        if (!url.searchParams.has("limit")) url.searchParams.set("limit", "300");
      }
      return url;
    }
    function key2(method, url) {
      return method + " " + url.toString();
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
    window.viewHistory = async function(id) {
      const h = (window.cache?.history || cache2?.history || []).find((x) => String(x.id || "") === String(id || ""));
      if (!h) return alert("Kh\xF4ng t\xECm th\u1EA5y l\u1ECBch s\u1EED.");
      if (typeof openModal === "function" && typeof compareHTML === "function") {
        openModal("L\u1ECBch s\u1EED", compareHTML(h.previous_data || {}, h.new_data || {}));
      }
    };
  })();
  (function() {
    function reqIdArg(v) {
      return JSON.stringify(String(v ?? ""));
    }
    async function findSubjectRequestForDelete(id) {
      return (cache.subject_requests || []).find((x) => String(x.id) === String(id)) || null;
    }
    const oldLoadSubjectRequestsDeleteBad = window.loadSubjectRequests;
    if (typeof oldLoadSubjectRequestsDeleteBad === "function") {
      window.loadSubjectRequests = async function() {
        const out = await oldLoadSubjectRequestsDeleteBad.apply(this, arguments);
        setTimeout(() => {
          document.querySelectorAll("#subjectRequestList .subjectRequestItem").forEach((card) => {
            const actions = card.querySelector(".actions");
            if (!actions || actions.querySelector(".deleteBadSubjectReqBtn")) return;
            const approveBtn = actions.querySelector('button[onclick*="approveSubjectRequest"]');
            const onclick = approveBtn?.getAttribute("onclick") || "";
            const m = onclick.match(/approveSubjectRequest\(([^)]+)\)/);
            if (!m) return;
            const raw = String(m[1] || "").replace(/^['"]|['"]$/g, "");
            const btn = document.createElement("button");
            btn.className = "act bad deleteBadSubjectReqBtn";
            btn.type = "button";
            btn.textContent = "X\xF3a y\xEAu c\u1EA7u l\u1ED7i";
            btn.onclick = () => window.deleteBadSubjectRequest(raw);
            actions.appendChild(btn);
          });
        }, 50);
        return out;
      };
    }
    window.deleteBadSubjectRequest = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin m\u1EDBi \u0111\u01B0\u1EE3c x\xF3a y\xEAu c\u1EA7u l\u1ED7i.");
      const r = await findSubjectRequestForDelete(id);
      if (!r) return alert("Kh\xF4ng t\xECm th\u1EA5y y\xEAu c\u1EA7u trong database. B\u1EA5m T\u1EA3i l\u1EA1i r\u1ED3i th\u1EED l\u1EA1i.");
      const label = (r.code || "?") + " - " + (r.name || "");
      if (!confirm(
        "X\xF3a y\xEAu c\u1EA7u th\xEAm m\xF4n b\u1ECB l\u1ED7i n\xE0y?\n\n" + label + "\n\nN\u1EBFu database kh\xF4ng cho x\xF3a h\u1EB3n, h\u1EC7 th\u1ED1ng s\u1EBD \u1EA9n y\xEAu c\u1EA7u n\xE0y kh\u1ECFi danh s\xE1ch ch\u1EDD duy\u1EC7t."
      ))
        return;
      setBusy(true, "\u0110ang x\xF3a y\xEAu c\u1EA7u l\u1ED7i...");
      try {
        if (!await adminAction("reject_subject_request", { request_id: id, admin_note: "\u0110\xE3 \u1EA9n y\xEAu c\u1EA7u l\u1ED7i" })) return;
        await logAction("delete_bad_subject_request", "subject_requests", id, { code: r.code, name: r.name });
        await window.loadSubjectRequests?.();
        toast("\u0110\xE3 x\xF3a/\u1EA9n y\xEAu c\u1EA7u l\u1ED7i");
      } finally {
        setBusy(false);
      }
    };
    const oldFilterSubjectRequestsDeleteBad = window.filterSubjectRequests;
    if (typeof oldFilterSubjectRequestsDeleteBad === "function") {
      window.filterSubjectRequests = function() {
        const out = oldFilterSubjectRequestsDeleteBad.apply(this, arguments);
        setTimeout(() => window.loadSubjectRequests?.(), 30);
        return out;
      };
    }
  })();
  (function() {
    if (window.__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629) return;
    window.__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629 = true;
    function setManualChip() {
      try {
        const chip = document.getElementById("adminAutoCheckChip");
        if (!chip) return;
        chip.classList.remove("is-live", "is-checking", "is-error", "is-idle");
        chip.classList.add("is-manual");
        const text = chip.querySelector(".autoText");
        if (text) text.textContent = "Th\u1EE7 c\xF4ng";
        const dot = chip.querySelector(".autoDot");
        if (dot) dot.style.background = "var(--gold2)";
      } catch (e) {
        lhWarn("COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629", e);
      }
    }
    function removeAdminRealtimeChannels() {
      try {
        if (!client || typeof client.getChannels !== "function") return;
        client.getChannels().forEach(function(ch) {
          const topic = String(ch?.topic || ch?.subTopic || "");
          if (topic.includes("learning-hub-admin-realtime") || topic.includes("admin-lite-final")) {
            try {
              client.removeChannel(ch);
            } catch (e) {
              lhWarn("COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629", e);
            }
          }
        });
      } catch (e) {
        lhWarn("COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629", e);
      }
    }
    window.startAdminRealtime = function() {
      removeAdminRealtimeChannels();
      setManualChip();
      return null;
    };
    window.startAdminRealtimeFinal = function() {
      removeAdminRealtimeChannels();
      setManualChip();
      return null;
    };
    window.stopAdminRealtime = function() {
      removeAdminRealtimeChannels();
      setManualChip();
      return null;
    };
    window.stopAdminRealtimeFinal = function() {
      removeAdminRealtimeChannels();
      setManualChip();
      return null;
    };
    document.addEventListener("DOMContentLoaded", function() {
      setManualChip();
      setTimeout(function() {
        removeAdminRealtimeChannels();
        setManualChip();
      }, 500);
      setTimeout(function() {
        removeAdminRealtimeChannels();
        setManualChip();
      }, 1500);
    });
    setTimeout(function() {
      removeAdminRealtimeChannels();
      setManualChip();
    }, 300);
  })();
  (function() {
    if (window.__MOBILE_APPROVAL_LITE_ADMIN_20260629) return;
    window.__MOBILE_APPROVAL_LITE_ADMIN_20260629 = true;
    var mq = window.matchMedia ? window.matchMedia("(max-width: 680px)") : null;
    function isMobile() {
      return mq ? mq.matches : window.innerWidth <= 680;
    }
    function applyMobileClass() {
      document.body.classList.toggle("adminMobileLite", isMobile());
    }
    function openApprovalsOnMobile(force) {
      if (!isMobile()) return;
      var appBox = document.getElementById("appBox");
      if (appBox && appBox.classList.contains("hidden")) return;
      var target = document.querySelector('.nav[data-page="approvals"]');
      if (!target) return;
      if (!force && sessionStorage.getItem("admin_mobile_lite_opened") === "1") return;
      try {
        sessionStorage.setItem("admin_mobile_lite_opened", "1");
      } catch (e) {
        lhWarn("MOBILE_APPROVAL_LITE_ADMIN_20260629", e);
      }
      if (typeof setPage === "function") setPage("approvals", "Ph\xEA duy\u1EC7t");
      else target.click();
      setTimeout(function() {
        if (typeof renderApprovals === "function") renderApprovals();
        if (typeof loadRegistrationMode === "function") loadRegistrationMode();
      }, 80);
    }
    function install() {
      applyMobileClass();
      openApprovalsOnMobile(false);
      setTimeout(function() {
        openApprovalsOnMobile(false);
      }, 500);
      setTimeout(function() {
        openApprovalsOnMobile(false);
      }, 1500);
    }
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function() {
        applyMobileClass();
        openApprovalsOnMobile(true);
      });
    } else {
      window.addEventListener("resize", function() {
        applyMobileClass();
        openApprovalsOnMobile(false);
      });
    }
    document.addEventListener("DOMContentLoaded", install);
    setTimeout(install, 300);
    setTimeout(install, 1200);
  })();
  (function() {
    if (window.__ADMIN_PROFILE_PATCH_DEDUPE_20260629) return;
    window.__ADMIN_PROFILE_PATCH_DEDUPE_20260629 = true;
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (!nativeFetch) return;
    const lastMap = /* @__PURE__ */ new Map();
    const GAP = 5 * 60 * 1e3;
    function methodOf(init2) {
      return String(init2 && init2.method ? init2.method : "GET").toUpperCase();
    }
    function shouldSkip(url, init2) {
      const method = methodOf(init2);
      if (method !== "PATCH" && method !== "PUT") return false;
      if (!/\/rest\/v1\/profiles/.test(url.pathname)) return false;
      const body = String(init2 && init2.body ? init2.body : "");
      if (!/last_activity|avatar_url|email/.test(body)) return false;
      if (/last_login|role|approved|blocked|is_blocked|status/.test(body)) return false;
      const key2 = url.origin + url.pathname + url.search + "|" + body.replace(/"last_activity"\s*:\s*"[^"]+"/g, '"last_activity":"TIME"');
      const now = Date.now();
      const last = lastMap.get(key2) || 0;
      if (now - last < GAP) return true;
      lastMap.set(key2, now);
      return false;
    }
  })();
  (function() {
    if (window.__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630) return;
    window.__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630 = true;
    let dragSubjectCache = [];
    let dragFromIndex = -1;
    let openBase = "";
    function injectCompactSubjectStyle() {
      if (document.getElementById("compactDragSubjectStyle")) return;
      const style = document.createElement("style");
      style.id = "compactDragSubjectStyle";
      style.textContent = `
      #subjectsAdmin .subjectAdminPanel{padding:16px!important;}
      #subjectsAdmin .subjectAdminList{gap:7px!important;padding-right:6px!important;}
      #subjectsAdmin .subjectAdminItem{
        min-height:58px!important;
        padding:9px 12px!important;
        border-radius:14px!important;
        display:grid!important;
        grid-template-columns:34px 88px minmax(0,1fr) auto!important;
        gap:10px!important;
        align-items:center!important;
        cursor:grab!important;
        transition:transform .14s ease,border-color .14s ease,background .14s ease,opacity .14s ease!important;
      }
      #subjectsAdmin .subjectAdminItem:active{cursor:grabbing!important;}
      #subjectsAdmin .subjectAdminItem.dragging{opacity:.45!important;transform:scale(.985)!important;border-color:rgba(232,212,168,.55)!important;}
      #subjectsAdmin .subjectDragHandle{
        width:30px!important;height:30px!important;border-radius:10px!important;
        display:grid!important;place-items:center!important;
        border:1px solid rgba(200,169,110,.22)!important;
        background:rgba(255,255,255,.035)!important;color:rgba(232,212,168,.82)!important;
        font-weight:950!important;font-size:1rem!important;user-select:none!important;
      }
      #subjectsAdmin .subjectAdminCode{
        min-width:78px!important;max-width:88px!important;height:30px!important;
        padding:0 9px!important;font-size:.78rem!important;
      }
      #subjectsAdmin .subjectAdminInfo b{font-size:.92rem!important;line-height:1.15!important;}
      #subjectsAdmin .subjectAdminInfo p{
        margin-top:3px!important;font-size:.80rem!important;line-height:1.25!important;
        -webkit-line-clamp:1!important;
      }
      #subjectsAdmin .subjectQuestionCount{
        margin-top:5px!important;
        display:inline-flex!important;
        width:max-content!important;
        align-items:center!important;
        gap:4px!important;
        border:1px solid rgba(114,197,140,.25)!important;
        border-radius:999px!important;
        padding:4px 9px!important;
        background:rgba(114,197,140,.08)!important;
        color:rgba(245,240,232,.78)!important;
        font-size:.78rem!important;
        font-weight:800!important;
      }
      #subjectsAdmin .subjectQuestionCount b{color:var(--ok)!important;font-size:.82rem!important;}
      #subjectsAdmin .subjectAdminActions{gap:6px!important;flex-wrap:nowrap!important;}
      #subjectsAdmin .subjectAdminActions .act{min-height:31px!important;padding:6px 10px!important;font-size:.82rem!important;}
      #subjectsAdmin .subjectOrderHint{font-size:.82rem!important;color:rgba(245,240,232,.62)!important;margin:0 0 8px!important;}
      @media (max-width:760px){
        #subjectsAdmin .subjectAdminItem{grid-template-columns:32px minmax(0,1fr) auto!important;gap:8px!important;}
        #subjectsAdmin .subjectAdminCode{display:none!important;}
        #subjectsAdmin .subjectAdminActions{grid-column:2 / -1!important;justify-content:flex-start!important;}
      }
    `;
      document.head.appendChild(style);
    }
    function escJs(s) {
      return String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }
    function subjectKey(s) {
      return String(s.id ?? s.code ?? "");
    }
    function isActiveSubjectRow(s) {
      return !(s?.is_active === false || s?.is_active === 0 || s?.is_active === "0");
    }
    function isActiveQuestionRow(q) {
      return !(q?.is_active === false || q?.is_active === 0 || q?.is_active === "0");
    }
    function getSubjectQuestionCount(s) {
      const code = String(s?.code || "");
      return Number(s?.__question_count || s?.question_count || s?.questions_count || (code ? 0 : 0)) || 0;
    }
    function baseOf(code) {
      return String(code || "").split(/[_\-\s]/)[0].toUpperCase();
    }
    function groupsOf(arr) {
      const byBase = /* @__PURE__ */ new Map();
      const order = [];
      (arr || []).forEach((s) => {
        const b = baseOf(s.code);
        if (!byBase.has(b)) {
          byBase.set(b, []);
          order.push(b);
        }
        byBase.get(b).push(s);
      });
      return order.map((b) => ({ base: b, items: byBase.get(b) }));
    }
    function commitGroupOrder(groups) {
      dragSubjectCache = groups.flatMap((g) => g.items);
      dragSubjectCache.forEach((s, i) => {
        s.sort_order = i + 1;
      });
    }
    function searchText() {
      return String(document.getElementById("search")?.value || "").trim().toLowerCase();
    }
    function countQuestions(items) {
      return items.reduce((n, s) => n + getSubjectQuestionCount(s), 0);
    }
    function filteredSubjects() {
      const q = searchText();
      const arr = dragSubjectCache.filter(isActiveSubjectRow).slice().sort(
        (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.code || "").localeCompare(String(b.code || ""))
      );
      if (!q) return arr;
      return arr.filter(
        (s) => `${s.code || ""} ${s.name || ""} ${s.description || ""} ${getSubjectQuestionCount(s)} c\xE2u`.toLowerCase().includes(q)
      );
    }
    async function saveSubjectOrder() {
      if (!isAdmin()) return toast("Ch\u1EC9 admin \u0111\u01B0\u1EE3c \u0111\u1ED5i th\u1EE9 t\u1EF1 m\xF4n.");
      try {
        dragSubjectCache.forEach((s, i) => {
          s.sort_order = i + 1;
        });
        const payloadSubjects = dragSubjectCache.filter((s) => s && s.id).map((s, i) => ({ id: s.id, sort_order: i + 1 }));
        if (payloadSubjects.length) {
          const res = await fetch("/api/admin-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              user_id: user?.id,
              action: "reorder_subjects",
              payload: { subjects: payloadSubjects }
            })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) throw new Error(data.error || "HTTP " + res.status);
        }
        toast("\u0110\xE3 l\u01B0u th\u1EE9 t\u1EF1 m\xF4n");
      } catch (e) {
        alert("Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c th\u1EE9 t\u1EF1 m\xF4n: " + (e.message || e));
      }
    }
    function subjectRowHTML(s, idx, draggable) {
      return `
      <div class="subjectAdminItem" draggable="${draggable ? "true" : "false"}" data-subject-key="${esc(subjectKey(s))}" data-visible-index="${idx}">
        <div class="subjectDragHandle" title="${draggable ? "K\xE9o \u0111\u1EC3 \u0111\u1ED5i v\u1ECB tr\xED" : "X\xF3a \xF4 t\xECm ki\u1EBFm \u0111\u1EC3 k\xE9o \u0111\u1ED5i v\u1ECB tr\xED"}">\u2630</div>
        <div class="subjectAdminCode">${esc(s.code || "")}</div>
        <div class="subjectAdminInfo">
          <b>${idx + 1}. ${esc(s.name || s.code || "Ch\u01B0a c\xF3 t\xEAn m\xF4n")}</b>
          <p>${esc(s.description || "M\xF4n h\u1ECDc ch\u01B0a c\xF3 m\xF4 t\u1EA3.")}</p>
          <div class="subjectQuestionCount">T\u1ED5ng s\u1ED1 c\xE2u: <b>${getSubjectQuestionCount(s)}</b> c\xE2u</div>
        </div>
        <div class="subjectAdminActions">
          <button class="act warn" type="button" onclick="openEditSubjectAdmin('${escJs(s.code)}')">S\u1EEDa</button>
          ${isAdmin() ? `<button class="act bad" type="button" onclick="deleteSubjectAdmin('${escJs(s.code)}')">X\xF3a</button>` : ""}
        </div>
      </div>`;
    }
    function folderRowHTML(g, idx, draggable) {
      const codes = g.items.map((s) => String(s.code || "")).join(" \xB7 ");
      return `
      <div class="subjectAdminFolder" draggable="${draggable ? "true" : "false"}" data-folder-base="${esc(g.base)}" data-visible-index="${idx}">
        <div class="subjectDragHandle" title="${draggable ? "K\xE9o \u0111\u1EC3 \u0111\u1ED5i v\u1ECB tr\xED" : "X\xF3a \xF4 t\xECm ki\u1EBFm \u0111\u1EC3 k\xE9o \u0111\u1ED5i v\u1ECB tr\xED"}">\u2630</div>
        <div class="subjectAdminCode subjectFolderCode">${esc(g.base)}</div>
        <div class="subjectAdminInfo">
          <b>${idx + 1}. Th\u01B0 m\u1EE5c ${esc(g.base)}</b>
          <p>${esc(codes)}</p>
          <div class="subjectFolderChips">
            <span class="subjectFolderChip">${g.items.length} m\xF4n</span>
            <span class="subjectQuestionCount">T\u1ED5ng s\u1ED1 c\xE2u: <b>${countQuestions(g.items)}</b> c\xE2u</span>
          </div>
        </div>
        <div class="subjectAdminActions">
          <button class="act ok subjectFolderOpenBtn" type="button" onclick="openSubjectFolderAdmin('${escJs(g.base)}')">M\u1EDF \u25B8</button>
        </div>
      </div>`;
    }
    function overviewHTML(groups, flatCount, mode) {
      const folders = groups.filter((g) => g.items.length > 1).length;
      const total = countQuestions(groups.flatMap((g) => g.items));
      const where = mode === "search" ? "K\u1EBFt qu\u1EA3 t\xECm ki\u1EBFm" : mode === "folder" ? `Th\u01B0 m\u1EE5c <b>${esc(openBase)}</b>` : `<b>${folders}</b> th\u01B0 m\u1EE5c \xB7 <b>${groups.length - folders}</b> m\xF4n l\u1EBB`;
      const hint = mode === "search" ? "X\xF3a \xF4 t\xECm ki\u1EBFm \u0111\u1EC3 quay l\u1EA1i d\u1EA1ng th\u01B0 m\u1EE5c." : "K\xE9o d\u1EA5u \u2630 \u0111\u1EC3 \u0111\u1ED5i v\u1ECB tr\xED.";
      return `<p class="subjectOrderHint">${where} \u2014 <b>${flatCount}</b> m\xF4n \xB7 <b>${total}</b> c\xE2u. ${hint}</p>`;
    }
    function folderBackHTML(g) {
      return `<div class="subjectAdminBackBar">
      <button class="act subjectAdminBack" type="button" onclick="openSubjectFolderAdmin('')">\u2190 T\u1EA5t c\u1EA3 m\xF4n</button>
      <span class="subjectAdminCode subjectFolderCode">${esc(g.base)}</span>
      <span class="subjectAdminBackMeta">${g.items.length} m\xF4n \xB7 ${countQuestions(g.items)} c\xE2u</span>
    </div>`;
    }
    window.openSubjectFolderAdmin = function(base) {
      openBase = String(base || "");
      renderSubjectAdminList();
      const list = document.getElementById("subjectAdminList");
      if (list) list.scrollTop = 0;
    };
    window.renderSubjectAdminList = function() {
      injectCompactSubjectStyle();
      const list = document.getElementById("subjectAdminList");
      if (!list) return;
      const q = searchText();
      const arr = filteredSubjects();
      const groups = groupsOf(arr);
      const openGroup = q ? null : groups.find((g) => g.base === openBase && g.items.length > 1) || null;
      if (!q && !openGroup) openBase = "";
      if (!arr.length) {
        openBase = "";
        list.innerHTML = '<p class="muted">Kh\xF4ng c\xF3 m\xF4n h\u1ECDc ph\xF9 h\u1EE3p.</p>';
        return;
      }
      list.classList.toggle("inFolder", !!openGroup);
      if (q) {
        list.innerHTML = overviewHTML(groups, arr.length, "search") + arr.map((s, i) => subjectRowHTML(s, i, false)).join("");
      } else if (openGroup) {
        list.innerHTML = overviewHTML([openGroup], openGroup.items.length, "folder") + folderBackHTML(openGroup) + openGroup.items.map((s, i) => subjectRowHTML(s, i, true)).join("");
      } else {
        list.innerHTML = overviewHTML(groups, arr.length, "root") + groups.map((g, i) => g.items.length < 2 ? subjectRowHTML(g.items[0], i, true) : folderRowHTML(g, i, true)).join("");
      }
      bindSubjectDragEvents(!!openGroup);
    };
    function bindSubjectDragEvents(inFolder) {
      const list = document.getElementById("subjectAdminList");
      if (!list) return;
      const rows = [...list.querySelectorAll('[draggable="true"]')];
      if (!rows.length) return;
      const keyOf = (el) => el.dataset.folderBase ? "F:" + el.dataset.folderBase : "S:" + el.dataset.subjectKey;
      const indexOf = (key2) => {
        const groups = groupsOf(dragSubjectCache);
        if (inFolder) {
          const g = groups.find((x) => x.base === openBase);
          return g ? g.items.findIndex((s) => "S:" + subjectKey(s) === key2) : -1;
        }
        return groups.findIndex((g) => (g.items.length < 2 ? "S:" + subjectKey(g.items[0]) : "F:" + g.base) === key2);
      };
      let fromKey = "";
      rows.forEach((item) => {
        item.addEventListener("dragstart", (e) => {
          fromKey = keyOf(item);
          dragFromIndex = indexOf(fromKey);
          item.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });
        item.addEventListener("dragend", () => {
          item.classList.remove("dragging");
          dragFromIndex = -1;
          fromKey = "";
        });
        item.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        });
        item.addEventListener("drop", (e) => {
          e.preventDefault();
          const toIndex = indexOf(keyOf(item));
          if (dragFromIndex < 0 || toIndex < 0 || dragFromIndex === toIndex) return;
          const groups = groupsOf(dragSubjectCache);
          if (inFolder) {
            const g = groups.find((x) => x.base === openBase);
            if (!g) return;
            const [moved] = g.items.splice(dragFromIndex, 1);
            g.items.splice(toIndex, 0, moved);
          } else {
            const [moved] = groups.splice(dragFromIndex, 1);
            groups.splice(toIndex, 0, moved);
          }
          commitGroupOrder(groups);
          renderSubjectAdminList();
          saveSubjectOrder();
        });
      });
    }
    const oldLoadSubjectsAdmin = window.loadSubjectsAdmin;
    window.loadSubjectsAdmin = async function() {
      injectCompactSubjectStyle();
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const list = document.getElementById("subjectAdminList");
      if (list) list.innerHTML = '<p class="muted">\u0110ang t\u1EA3i m\xF4n h\u1ECDc...</p>';
      setBusy(true, "\u0110ang t\u1EA3i m\xF4n...");
      try {
        if (!cache.subjects || !cache.subjects.length || !cache.questions) await loadAll();
        const counts = {};
        (cache.questions || []).forEach((q) => {
          const c = String(q.subject_code || "").toUpperCase();
          counts[c] = (counts[c] || 0) + 1;
        });
        dragSubjectCache = (cache.subjects || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.code).localeCompare(String(b.code))).filter(isActiveSubjectRow).map((s) => ({ ...s, __question_count: counts[String(s.code || "").toUpperCase()] || 0 }));
        renderSubjectAdminList();
      } finally {
        setBusy(false);
      }
    };
    document.addEventListener("DOMContentLoaded", () => {
      injectCompactSubjectStyle();
      setTimeout(() => {
        if (document.getElementById("subjectsAdmin")?.classList.contains("active")) window.loadSubjectsAdmin?.();
      }, 600);
    });
  })();
  (function() {
    if (window.__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630) return;
    window.__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630 = true;
    const oldOpenEditSubjectAdmin = window.openEditSubjectAdmin;
    const oldSaveSubjectAdmin = window.saveSubjectAdmin;
    let currentSubjectForNewBadge = null;
    function parseCoverMeta(cover) {
      if (!cover) return {};
      if (typeof cover === "object") return { ...cover };
      try {
        return JSON.parse(String(cover)) || {};
      } catch (e) {
        return { url: String(cover) };
      }
    }
    function makeCoverWithNewBadge(cover, enabled) {
      const meta = parseCoverMeta(cover);
      meta.new_badge = !!enabled;
      return JSON.stringify(meta);
    }
    function hasNewBadge(subject) {
      const m = parseCoverMeta(subject?.cover || "");
      return m.new_badge === true || m.is_new === true || m.new === true;
    }
    window.openEditSubjectAdmin = async function(code) {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      if (!cache.subjects || !cache.subjects.length) await loadAll();
      const s = (cache.subjects || []).find((x) => String(x.code || "").toUpperCase() === String(code).toUpperCase());
      if (!s) {
        if (typeof oldOpenEditSubjectAdmin === "function") return oldOpenEditSubjectAdmin.apply(this, arguments);
        return alert("Kh\xF4ng t\xECm th\u1EA5y m\xF4n h\u1ECDc.");
      }
      currentSubjectForNewBadge = s;
      openModal(
        "S\u1EEDa m\xF4n h\u1ECDc",
        `
      <div class="editSubjectForm">
        <div class="editSubjectNotice">
          N\u1EBFu \u0111\u1ED5i <b>m\xE3 m\xF4n</b>, h\u1EC7 th\u1ED1ng c\u0169ng s\u1EBD chuy\u1EC3n to\xE0n b\u1ED9 c\xE2u h\u1ECFi c\u1EE7a m\xF4n c\u0169 sang m\xE3 m\xF4n m\u1EDBi.
        </div>
        <div class="formGrid2">
          <div class="field">
            <label>M\xE3 m\xF4n</label>
            <input id="editSubjectOldCode" type="hidden" value="${esc(s.code || "")}">
            <input id="editSubjectCode" value="${esc(s.code || "")}" maxlength="20" placeholder="VD: MLN111">
          </div>
          <div class="field">
            <label>T\xEAn m\xF4n h\u1ECDc</label>
            <input id="editSubjectName" value="${esc(s.name || "")}" maxlength="120" placeholder="VD: Tri\u1EBFt h\u1ECDc M\xE1c - L\xEAnin">
          </div>
        </div>
        <div class="field">
          <label>N\u1ED9i dung / m\xF4 t\u1EA3 m\xF4n <span class="descCounter" id="editSubjectDescCount">0/160</span></label>
          <textarea id="editSubjectDesc" rows="3" maxlength="160" placeholder="M\xF4 t\u1EA3 ng\u1EAFn hi\u1EC3n th\u1ECB \u1EDF th\u1EBB m\xF4n (t\u1ED1i \u0111a 160 k\xFD t\u1EF1)...">${esc(s.description || "")}</textarea>
        </div>
        <label class="newBadgeToggleBox" style="display:flex;align-items:center;gap:10px;border:1px solid rgba(200,169,110,.22);border-radius:14px;padding:11px 13px;background:rgba(255,255,255,.035);cursor:pointer;">
          <input id="editSubjectNewBadge" type="checkbox" ${hasNewBadge(s) ? "checked" : ""} style="width:18px;height:18px;">
          <span><b style="color:var(--gold2);">Hi\u1EC7n ch\u1EEF NEW l\u1EA5p l\xE1nh</b><br><span class="muted">B\u1EADt/t\u1EAFt nh\xE3n NEW \u1EDF g\xF3c ph\u1EA3i th\u1EBB m\xF4n trong m\xE0n h\xECnh ch\u1ECDn m\xF4n.</span></span>
        </label>
        <div class="editSubjectMeta">
          <span>Tr\u1EA1ng th\xE1i: ${s.is_active === false ? "\u0110ang \u1EA9n" : "\u0110ang hi\u1EC7n"}</span>
          <span>Th\u1EE9 t\u1EF1: ${esc(s.sort_order ?? "")}</span>
        </div>
        <div class="actions editSubjectActions">
          <button class="act ok" type="button" onclick="saveSubjectAdmin()">L\u01B0u thay \u0111\u1ED5i</button>
          <button class="act" type="button" onclick="lhCloseModal()">\u0110\xF3ng</button>
        </div>
      </div>`
      );
      setTimeout(() => {
        const input = document.getElementById("editSubjectCode");
        if (input) {
          input.oninput = function() {
            this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
          };
          input.focus();
        }
        const desc = document.getElementById("editSubjectDesc");
        const count = document.getElementById("editSubjectDescCount");
        if (desc && count) {
          const sync = () => {
            const n = desc.value.length;
            count.textContent = n + "/160";
            count.classList.toggle("nearLimit", n >= 140 && n <= 160);
            count.classList.toggle("overLimit", n > 160);
          };
          desc.oninput = sync;
          sync();
        }
      }, 0);
    };
    window.saveSubjectAdmin = async function() {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const oldCode = (document.getElementById("editSubjectOldCode")?.value || "").trim().toUpperCase();
      const newCode = (document.getElementById("editSubjectCode")?.value || "").trim().toUpperCase();
      if (newCode !== oldCode && typeof oldSaveSubjectAdmin === "function")
        return oldSaveSubjectAdmin.apply(this, arguments);
      const subject = currentSubjectForNewBadge || {};
      const name = (document.getElementById("editSubjectName")?.value || "").trim();
      const description = (document.getElementById("editSubjectDesc")?.value || "").trim();
      const newBadge = !!document.getElementById("editSubjectNewBadge")?.checked;
      if (!subject.id) return alert("Kh\xF4ng t\xECm th\u1EA5y ID m\xF4n h\u1ECDc. B\u1EA5m T\u1EA3i l\u1EA1i r\u1ED3i th\u1EED l\u1EA1i.");
      if (!name) return alert("T\xEAn m\xF4n h\u1ECDc kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      setBusy(true, "\u0110ang l\u01B0u m\xF4n...");
      try {
        const r = await client.from("subjects").update({
          name,
          description: description || "",
          cover: makeCoverWithNewBadge(subject.cover || "", newBadge),
          sort_order: subject.sort_order || 0
        }).eq("id", subject.id);
        if (r.error) return alert("Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c m\xF4n: " + r.error.message);
        if (client.clearCache) client.clearCache();
        closeModal();
        await window.loadSubjectsAdmin?.();
        toast("\u0110\xE3 l\u01B0u m\xF4n h\u1ECDc");
      } finally {
        setBusy(false);
      }
    };
  })();
  (function() {
    if (window.__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630) return;
    window.__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630 = true;
    let cardSubjectCache = [];
    const oldRenderSubjectAdminList = window.renderSubjectAdminList;
    const oldOpenEditSubjectAdmin = window.openEditSubjectAdmin;
    function parseCoverMeta(cover) {
      if (!cover) return {};
      if (typeof cover === "object") return { ...cover };
      try {
        return JSON.parse(String(cover)) || {};
      } catch (e) {
        return { url: String(cover) };
      }
    }
    function hasNewBadge(subject) {
      const m = parseCoverMeta(subject?.cover || "");
      return m.new_badge === true || m.is_new === true || m.new === true;
    }
    function makeCover(cover, enabled) {
      const meta = parseCoverMeta(cover);
      meta.new_badge = !!enabled;
      return JSON.stringify(meta);
    }
    function escAttr(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function escJs(s) {
      return String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }
    async function fetchSubjectsForCards() {
      try {
        if (!cache.subjects || !cache.subjects.length) await loadAll();
        cardSubjectCache = (cache.subjects || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.code).localeCompare(String(b.code)));
      } catch (e) {
        console.warn("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c tr\u1EA1ng th\xE1i NEW:", e);
      }
    }
    function codeFromCard(card) {
      const codeText = card.querySelector(".subjectAdminCode")?.textContent?.trim();
      if (codeText) return codeText;
      const editBtn = card.querySelector('[onclick*="openEditSubjectAdmin"]');
      const m = (editBtn?.getAttribute("onclick") || "").match(/openEditSubjectAdmin\('([^']+)'\)/);
      return m ? m[1] : "";
    }
    function enhanceSubjectCards() {
      const list = document.getElementById("subjectAdminList");
      if (!list) return;
      list.querySelectorAll(".subjectAdminItem").forEach((card) => {
        const code = codeFromCard(card);
        if (!code || card.querySelector(".subjectNewToggle")) return;
        const subject = cardSubjectCache.find((s) => String(s.code) === String(code)) || {};
        const on = hasNewBadge(subject);
        const actions = card.querySelector(".subjectAdminActions");
        if (!actions) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "act subjectNewToggle" + (on ? " isOn" : "");
        btn.textContent = "NEW";
        btn.title = on ? "\u0110ang b\u1EADt NEW - b\u1EA5m \u0111\u1EC3 t\u1EAFt" : "\u0110ang t\u1EAFt NEW - b\u1EA5m \u0111\u1EC3 b\u1EADt";
        btn.setAttribute("onclick", "toggleSubjectNewBadgeFromCard('" + escJs(code) + "')");
        actions.insertBefore(btn, actions.firstChild);
      });
      enhanceFolderRows();
    }
    function baseOf(code) {
      return String(code || "").split(/[_\-\s]/)[0].toUpperCase();
    }
    function folderBadgeList() {
      return Array.isArray(cache.folder_new_badges) ? cache.folder_new_badges : [];
    }
    function hasFolderNewBadge(base) {
      const b = String(base || "").toUpperCase();
      return folderBadgeList().some((x) => String(x || "").toUpperCase() === b);
    }
    function enhanceFolderRows() {
      const list = document.getElementById("subjectAdminList");
      if (!list) return;
      list.querySelectorAll(".subjectAdminFolder").forEach((row) => {
        const base = row.dataset.folderBase || "";
        if (!base || row.querySelector(".subjectNewToggle")) return;
        const actions = row.querySelector(".subjectAdminActions");
        if (!actions) return;
        const on = hasFolderNewBadge(base);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "act subjectNewToggle" + (on ? " isOn" : "");
        btn.textContent = "NEW";
        btn.title = on ? "\u0110ang b\u1EADt NEW cho th\u1EBB th\u01B0 m\u1EE5c " + base + " - b\u1EA5m \u0111\u1EC3 t\u1EAFt (kh\xF4ng \u0111\u1EE5ng m\xF4n con)" : "\u0110ang t\u1EAFt NEW cho th\u1EBB th\u01B0 m\u1EE5c " + base + " - b\u1EA5m \u0111\u1EC3 b\u1EADt (kh\xF4ng \u0111\u1EE5ng m\xF4n con)";
        btn.setAttribute("onclick", "toggleSubjectFolderNewBadge('" + escJs(base) + "')");
        actions.insertBefore(btn, actions.firstChild);
      });
    }
    let lastCardSubjectFetchAt = 0;
    let cardSubjectFetchPromise = null;
    async function refreshCardNewButtons(force) {
      const now = Date.now();
      if (force || !cardSubjectCache.length || now - lastCardSubjectFetchAt > 6e4) {
        if (!cardSubjectFetchPromise) {
          cardSubjectFetchPromise = fetchSubjectsForCards().finally(() => {
            cardSubjectFetchPromise = null;
          });
        }
        await cardSubjectFetchPromise;
        lastCardSubjectFetchAt = Date.now();
      }
      enhanceSubjectCards();
    }
    if (typeof oldRenderSubjectAdminList === "function") {
      window.renderSubjectAdminList = function() {
        const r = oldRenderSubjectAdminList.apply(this, arguments);
        setTimeout(refreshCardNewButtons, 0);
        return r;
      };
    }
    window.openEditSubjectAdmin = async function() {
      const r = oldOpenEditSubjectAdmin.apply(this, arguments);
      setTimeout(() => {
        const box = document.querySelector(".newBadgeToggleBox");
        if (box) box.remove();
      }, 30);
      return r;
    };
    window.toggleSubjectNewBadgeFromCard = async function(code) {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const btn = Array.from(document.querySelectorAll(".subjectNewToggle")).find(
        (b) => (b.getAttribute("onclick") || "").includes("'" + code + "'")
      );
      if (btn) btn.classList.add("isBusy");
      try {
        let subject = cardSubjectCache.find((s) => String(s.code) === String(code)) || (cache.subjects || []).find((s) => String(s.code) === String(code));
        if (!subject) return alert("Kh\xF4ng t\xECm th\u1EA5y m\xF4n h\u1ECDc.");
        const next = !hasNewBadge(subject);
        if (!await adminAction("set_subject_new_badge", { id: subject.id, enabled: next })) return;
        subject.cover = makeCover(subject.cover || "", next);
        cardSubjectCache = cardSubjectCache.map(
          (s) => String(s.code) === String(code) ? { ...s, cover: subject.cover } : s
        );
        toast(next ? "\u0110\xE3 b\u1EADt NEW" : "\u0110\xE3 t\u1EAFt NEW");
        await window.loadSubjectsAdmin?.();
      } finally {
        if (btn) btn.classList.remove("isBusy");
      }
    };
    window.toggleSubjectFolderNewBadge = async function(base) {
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const b = String(base || "").toUpperCase();
      if (!b) return;
      const next = !hasFolderNewBadge(b);
      setBusy(true, next ? "\u0110ang b\u1EADt NEW cho th\u01B0 m\u1EE5c..." : "\u0110ang t\u1EAFt NEW cho th\u01B0 m\u1EE5c...");
      try {
        const out = await adminAction("set_subject_folder_new_badge", { base: b, enabled: next });
        if (!out) return;
        cache.folder_new_badges = Array.isArray(out.folder_new_badges) ? out.folder_new_badges : next ? [...folderBadgeList(), b] : folderBadgeList().filter((x) => String(x || "").toUpperCase() !== b);
        toast((next ? "\u0110\xE3 b\u1EADt NEW cho th\u01B0 m\u1EE5c " : "\u0110\xE3 t\u1EAFt NEW cho th\u01B0 m\u1EE5c ") + b);
        await window.loadSubjectsAdmin?.();
      } finally {
        setBusy(false);
      }
    };
    const previousSaveSubjectAdmin = window.saveSubjectAdmin;
    window.saveSubjectAdmin = async function() {
      const oldCode = (document.getElementById("editSubjectOldCode")?.value || "").trim().toUpperCase();
      const newCode = (document.getElementById("editSubjectCode")?.value || "").trim().toUpperCase();
      if (newCode && oldCode && newCode !== oldCode && typeof previousSaveSubjectAdmin === "function") {
        return previousSaveSubjectAdmin.apply(this, arguments);
      }
      if (!isEditor()) return alert("Admin ho\u1EB7c Editor m\u1EDBi \u0111\u01B0\u1EE3c s\u1EEDa m\xF4n h\u1ECDc.");
      const code = oldCode || newCode;
      const name = (document.getElementById("editSubjectName")?.value || "").trim();
      const description = (document.getElementById("editSubjectDesc")?.value || "").trim();
      if (!code) return alert("Thi\u1EBFu m\xE3 m\xF4n.");
      if (!name) return alert("T\xEAn m\xF4n h\u1ECDc kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng.");
      setBusy(true, "\u0110ang l\u01B0u m\xF4n...");
      try {
        let subject = cardSubjectCache.find((s) => String(s.code) === String(code)) || (cache.subjects || []).find((s) => String(s.code) === String(code));
        if (!subject) return alert("Kh\xF4ng t\xECm th\u1EA5y m\xF4n h\u1ECDc.");
        if (!await adminAction("edit_subject", {
          id: subject.id,
          name,
          description: description || "",
          cover: subject.cover || "",
          sort_order: subject.sort_order || 0
        }))
          return;
        closeModal();
        await window.loadSubjectsAdmin?.();
        toast("\u0110\xE3 l\u01B0u m\xF4n h\u1ECDc");
      } finally {
        setBusy(false);
      }
    };
    document.addEventListener(
      "DOMContentLoaded",
      () => setTimeout(() => {
        if (document.getElementById("subjectsAdmin")?.classList.contains("active")) refreshCardNewButtons();
      }, 900)
    );
  })();
  (function() {
    if (window.__COPILOT_ADMIN_RELOAD_FIX_20260630) return;
    window.__COPILOT_ADMIN_RELOAD_FIX_20260630 = true;
    function clearAdminClientCache() {
      try {
        if (client && typeof client.clearCache === "function") client.clearCache();
      } catch (e) {
        lhWarn("COPILOT_ADMIN_RELOAD_FIX_20260630", e);
      }
      try {
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith("admin_f5_micro_cache:") || k.startsWith("lh_f5_cache:")) sessionStorage.removeItem(k);
        });
      } catch (e) {
        lhWarn("COPILOT_ADMIN_RELOAD_FIX_20260630", e);
      }
    }
    function showLoadingNumbers() {
      ["statUsers", "statEditors", "statPending", "statPendingApproval", "statBlocked"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "...";
      });
      const rr = document.getElementById("recentRequests");
      if (rr) rr.innerHTML = '<p class="muted">\u0110ang t\u1EA3i d\u1EEF li\u1EC7u...</p>';
      const rl = document.getElementById("recentLogs");
      if (rl) rl.innerHTML = '<p class="muted">\u0110ang t\u1EA3i d\u1EEF li\u1EC7u...</p>';
    }
    window.loadAll = loadAll = async function(force) {
      clearErr();
      clearAdminClientCache();
      showLoadingNumbers();
      setBusy(true, "\u0110ang t\u1EA3i...");
      try {
        const pj = (v, d) => {
          if (v == null) return d;
          if (typeof v !== "string") return v;
          try {
            return JSON.parse(v);
          } catch (e) {
            return d;
          }
        };
        const r0 = await window.__fetchAdminDashboardJSON(force);
        const dash = r0.dash || {};
        if (!r0.ok || dash.error) throw new Error(dash.error || "HTTP " + r0.status);
        cache.profiles = (dash.profiles || []).map((p) => ({
          ...p,
          approved: p.approved === 1 || p.approved === true || p.approved === "1",
          blocked: p.blocked === 1 || p.blocked === true || p.blocked === "1"
        }));
        cache.questions = (dash.questions || []).map((q) => ({
          ...q,
          options: pj(q.options, {}),
          images: pj(q.images, [])
        }));
        cache.requests = (dash.requests || []).map((r) => ({
          ...r,
          old_data: pj(r.old_data, {}),
          new_data: pj(r.new_data, {})
        }));
        cache.history = (dash.history || []).map((h) => ({
          ...h,
          previous_data: pj(h.previous_data, {}),
          new_data: pj(h.new_data, {})
        }));
        cache.logs = isAdmin() ? (dash.logs || []).map((l) => ({ ...l, details: pj(l.details, {}) })) : [];
        cache.subjects = dash.subjects || [];
        cache.folder_new_badges = Array.isArray(dash.folder_new_badges) ? dash.folder_new_badges : [];
        cache.subject_requests = (dash.subject_requests || []).map((s) => ({
          ...s,
          questions_data: pj(s.questions_data, [])
        }));
        cache.deleted_questions = (dash.deleted_questions || []).map((d) => ({
          ...d,
          original_data: pj(d.original_data, {})
        }));
        cache.deleted_subjects = (dash.deleted_subjects || []).map((d) => ({
          ...d,
          original_data: pj(d.original_data, {})
        }));
        window.__lhReadAdminTierFromDashboard?.(dash);
        render();
        window.__adminDashRenderedText = r0.text || "";
        window.dispatchEvent(new CustomEvent("lh:admin-dashboard-loaded"));
        if (typeof loadSubjectRequests === "function") await loadSubjectRequests();
        if (typeof loadRegistrationMode === "function") await loadRegistrationMode();
        toast("\u0110\xE3 t\u1EA3i m\u1EDBi");
      } catch (e) {
        console.error("[loadAll fixed]", e);
        err("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u: " + (e.message || e));
      } finally {
        setBusy(false);
      }
    };
    function bindReloadButton() {
      const btn = document.getElementById("refreshBtn");
      if (!btn || btn.__reloadFixBound) return;
      btn.__reloadFixBound = true;
      btn.onclick = async function() {
        clearAdminClientCache();
        await window.loadAll(true);
        const page = sessionStorage.getItem("admin_current_page") || "overview";
        if (page === "subjectsAdmin" && typeof window.loadSubjectsAdmin === "function") await window.loadSubjectsAdmin();
        if (page === "trash" && typeof window.loadTrash === "function") await window.loadTrash();
        if (page === "subjectRequests" && typeof window.loadSubjectRequests === "function")
          await window.loadSubjectRequests();
        if (page === "approvals" && typeof window.renderApprovals === "function") window.renderApprovals();
        if (page === "discordSettings" && typeof window.renderDiscordSettings === "function")
          window.renderDiscordSettings();
      };
    }
    document.addEventListener("DOMContentLoaded", () => {
      bindReloadButton();
      setTimeout(() => {
        bindReloadButton();
        const isApp = !document.getElementById("appBox") || !document.getElementById("appBox").classList.contains("hidden");
        const looksEmpty = Number(document.getElementById("statUsers")?.textContent || 0) === 0 && (!cache.profiles || !cache.profiles.length);
        const alreadyLoading = window.__adminDashboardLoadedOnce || typeof window.__adminDashboardBusy === "function" && window.__adminDashboardBusy();
        if (isApp && looksEmpty && !alreadyLoading) window.loadAll(true);
      }, 900);
    });
  })();
  (function() {
    if (window.__COPILOT_HIDE_USERS_FROM_EDITOR_20260630) return;
    window.__COPILOT_HIDE_USERS_FROM_EDITOR_20260630 = true;
    function hideUsersForEditor() {
      try {
        const allow = typeof isAdmin === "function" && isAdmin();
        document.querySelectorAll('.nav[data-page="users"], .nav[data-page="approvals"]').forEach((el) => {
          el.classList.toggle("hidden", !allow);
          el.style.display = allow ? "" : "none";
        });
        if (!allow && document.getElementById("users")?.classList.contains("active")) {
          setPage("overview", "T\u1ED5ng quan");
        }
        if (!allow && document.getElementById("approvals")?.classList.contains("active")) {
          setPage("overview", "T\u1ED5ng quan");
        }
      } catch (e) {
        lhWarn("COPILOT_HIDE_USERS_FROM_EDITOR_20260630", e);
      }
    }
    const oldSetPageHideUsers = window.setPage || setPage;
    setPage = window.setPage = function(id, n) {
      if ((id === "users" || id === "approvals") && !(typeof isAdmin === "function" && isAdmin())) {
        alert("Editor kh\xF4ng \u0111\u01B0\u1EE3c xem Ng\u01B0\u1EDDi d\xF9ng.");
        id = "overview";
        n = "T\u1ED5ng quan";
      }
      const res = oldSetPageHideUsers.apply(this, arguments.length ? [id, n] : arguments);
      setTimeout(hideUsersForEditor, 0);
      return res;
    };
    const oldRenderUsersHideEditor = window.renderUsers;
    renderUsers = window.renderUsers = function() {
      if (!(typeof isAdmin === "function" && isAdmin())) {
        const el = document.getElementById("userList");
        if (el) el.innerHTML = "Editor kh\xF4ng \u0111\u01B0\u1EE3c xem danh s\xE1ch ng\u01B0\u1EDDi d\xF9ng.";
        return;
      }
      return oldRenderUsersHideEditor.apply(this, arguments);
    };
    document.addEventListener("DOMContentLoaded", () => setTimeout(hideUsersForEditor, 300));
    setTimeout(hideUsersForEditor, 800);
  })();
  (function() {
    if (window.__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630) return;
    window.__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630 = true;
    function injectPolishedSubjectAdminLayout() {
      if (document.getElementById("copilotPolishSubjectAdminLayout20260630")) return;
      const style = document.createElement("style");
      style.id = "copilotPolishSubjectAdminLayout20260630";
      style.textContent = `
      #subjectsAdmin.page.active{
        display:flex!important;
        flex-direction:column!important;
        height:100%!important;
        min-height:0!important;
      }
      #subjectsAdmin .subjectAdminPanel{
        height:100%!important;
        min-height:0!important;
        display:flex!important;
        flex-direction:column!important;
        padding:20px!important;
        border-radius:24px!important;
        background:
          radial-gradient(circle at 78% 12%, rgba(200,169,110,.09), transparent 30%),
          linear-gradient(145deg,rgba(245,240,232,.065),rgba(255,255,255,.018))!important;
      }
      #subjectsAdmin .subjectAdminList{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow:auto!important;
        display:grid!important;
        gap:12px!important;
        padding:2px 10px 4px 0!important;
        align-content:start!important;
      }
      #subjectsAdmin .subjectOrderHint{
        position:sticky!important;
        top:0!important;
        z-index:5!important;
        margin:0 0 4px!important;
        padding:11px 14px!important;
        border:1px solid rgba(200,169,110,.16)!important;
        border-radius:16px!important;
        background:linear-gradient(180deg,rgba(24,17,13,.98),rgba(17,12,10,.92))!important;
        color:rgba(245,240,232,.72)!important;
        font-size:.88rem!important;
        font-weight:750!important;
        box-shadow:0 10px 24px rgba(0,0,0,.20)!important;
      }
      #subjectsAdmin .subjectOrderHint b{
        color:var(--gold2)!important;
      }
      #subjectsAdmin .subjectAdminItem{
        min-height:98px!important;
        padding:16px 18px!important;
        border-radius:22px!important;
        display:grid!important;
        grid-template-columns:42px 112px minmax(0,1fr) auto!important;
        gap:16px!important;
        align-items:center!important;
        background:
          radial-gradient(circle at 92% 50%,rgba(232,212,168,.08),transparent 30%),
          linear-gradient(145deg,rgba(245,240,232,.072),rgba(255,255,255,.022))!important;
        border:1px solid rgba(200,169,110,.22)!important;
        box-shadow:0 14px 36px rgba(0,0,0,.24)!important;
        transform:none!important;
      }
      #subjectsAdmin .subjectAdminItem:hover{
        border-color:rgba(232,212,168,.38)!important;
        background:
          radial-gradient(circle at 92% 50%,rgba(232,212,168,.12),transparent 32%),
          linear-gradient(145deg,rgba(245,240,232,.092),rgba(255,255,255,.03))!important;
        box-shadow:0 18px 42px rgba(0,0,0,.28),0 0 26px rgba(232,212,168,.08)!important;
      }
      #subjectsAdmin .subjectDragHandle{
        width:38px!important;
        height:38px!important;
        border-radius:13px!important;
        font-size:1.15rem!important;
        background:rgba(255,255,255,.045)!important;
        border-color:rgba(232,212,168,.20)!important;
      }
      #subjectsAdmin .subjectAdminCode{
        min-width:104px!important;
        max-width:112px!important;
        height:36px!important;
        padding:0 12px!important;
        border-radius:999px!important;
        font-size:.86rem!important;
        letter-spacing:.03em!important;
        background:rgba(200,169,110,.115)!important;
        border-color:rgba(232,212,168,.25)!important;
        color:var(--gold2)!important;
      }
      #subjectsAdmin .subjectAdminInfo{
        min-width:0!important;
        display:flex!important;
        flex-direction:column!important;
        gap:5px!important;
        align-self:center!important;
      }
      #subjectsAdmin .subjectAdminInfo b{
        display:block!important;
        font-size:1.03rem!important;
        line-height:1.22!important;
        color:#fff!important;
        font-weight:900!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      #subjectsAdmin .subjectAdminInfo p{
        display:block!important;
        margin:0!important;
        color:rgba(245,240,232,.62)!important;
        font-size:.88rem!important;
        line-height:1.35!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        -webkit-line-clamp:unset!important;
        -webkit-box-orient:unset!important;
      }
      #subjectsAdmin .subjectQuestionCount{
        margin:4px 0 0!important;
        position:static!important;
        display:inline-flex!important;
        align-self:flex-start!important;
        width:max-content!important;
        max-width:100%!important;
        align-items:center!important;
        gap:6px!important;
        min-height:30px!important;
        padding:5px 12px!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,rgba(114,197,140,.16),rgba(114,197,140,.07))!important;
        border:1px solid rgba(114,197,140,.30)!important;
        color:rgba(245,240,232,.82)!important;
        font-size:.84rem!important;
        font-weight:900!important;
        box-shadow:none!important;
      }
      #subjectsAdmin .subjectQuestionCount b{
        color:var(--ok)!important;
        font-size:.92rem!important;
        font-weight:950!important;
      }
      #subjectsAdmin .subjectAdminActions{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-end!important;
        gap:9px!important;
        flex-wrap:nowrap!important;
        min-width:250px!important;
      }
      #subjectsAdmin .subjectAdminActions .act{
        min-height:38px!important;
        padding:0 16px!important;
        border-radius:999px!important;
        font-size:.88rem!important;
        font-weight:950!important;
      }
      #subjectsAdmin .subjectNewToggle{
        min-width:86px!important;
        border-color:rgba(232,212,168,.26)!important;
      }
      #subjectsAdmin .subjectNewToggle.isOn{
        background:linear-gradient(135deg,#ffe7a8,#e8c46e)!important;
        color:#111!important;
        border-color:transparent!important;
        box-shadow:0 12px 26px rgba(232,212,168,.16)!important;
      }
      @media (max-width:980px){
        #subjectsAdmin .subjectAdminItem{
          grid-template-columns:40px 100px minmax(0,1fr)!important;
          gap:12px!important;
        }
        #subjectsAdmin .subjectAdminActions{
          grid-column:3!important;
          justify-content:flex-start!important;
          min-width:0!important;
          margin-top:8px!important;
        }
      }
      @media (max-width:680px){
        #subjectsAdmin .subjectAdminPanel{padding:14px!important;}
        #subjectsAdmin .subjectAdminItem{
          grid-template-columns:38px minmax(0,1fr)!important;
          min-height:0!important;
          padding:14px!important;
        }
        #subjectsAdmin .subjectAdminCode{
          grid-column:2!important;
          grid-row:1!important;
          justify-self:start!important;
          min-width:92px!important;
        }
        #subjectsAdmin .subjectAdminInfo{grid-column:1 / -1!important;margin-top:4px!important;}
        #subjectsAdmin .subjectAdminActions{
          grid-column:1 / -1!important;
          width:100%!important;
          min-width:0!important;
          display:grid!important;
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
        #subjectsAdmin .subjectAdminActions .act{padding:0 10px!important;}
      }
    `;
      document.head.appendChild(style);
    }
    document.addEventListener("DOMContentLoaded", () => setTimeout(injectPolishedSubjectAdminLayout, 0));
    setTimeout(injectPolishedSubjectAdminLayout, 0);
    setTimeout(injectPolishedSubjectAdminLayout, 800);
  })();
  (function() {
    if (window.__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630) return;
    window.__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630 = true;
    function injectFinalSubjectAdminPolish() {
      let style = document.getElementById("subjectAdminNoOverlapFinalStyle");
      if (!style) {
        style = document.createElement("style");
        style.id = "subjectAdminNoOverlapFinalStyle";
        document.head.appendChild(style);
      }
      style.textContent = `
      body #subjectsAdmin .subjectAdminPanel{padding:18px!important;border-radius:24px!important;}
      body #subjectsAdmin .subjectAdminList{gap:10px!important;padding-right:12px!important;overflow:auto!important;}
      body #subjectsAdmin .subjectAdminItem{
        display:grid!important;grid-template-columns:40px 112px minmax(0,1fr) auto!important;gap:12px!important;
        align-items:center!important;min-height:88px!important;height:auto!important;padding:12px 15px!important;
        border-radius:18px!important;overflow:visible!important;transform:none!important;
      }
      body #subjectsAdmin .subjectDragHandle,
      body #subjectsAdmin .subjectAdminItem > :first-child:not(.subjectAdminCode):not(.subjectAdminInfo):not(.subjectAdminActions){
        width:34px!important;height:34px!important;min-width:34px!important;border-radius:12px!important;display:grid!important;place-items:center!important;align-self:center!important;
      }
      body #subjectsAdmin .subjectAdminCode{min-width:104px!important;max-width:112px!important;height:38px!important;padding:0 12px!important;font-size:.84rem!important;align-self:center!important;}
      body #subjectsAdmin .subjectAdminInfo{display:grid!important;grid-template-columns:1fr!important;gap:4px!important;min-width:0!important;overflow:visible!important;align-content:center!important;}
      body #subjectsAdmin .subjectAdminInfo b{display:block!important;margin:0!important;font-size:1.02rem!important;line-height:1.22!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      body #subjectsAdmin .subjectAdminInfo p{display:block!important;margin:0!important;font-size:.88rem!important;line-height:1.32!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;-webkit-line-clamp:unset!important;-webkit-box-orient:unset!important;}
      body #subjectsAdmin .subjectQuestionCount,
      body #subjectsAdmin .subjectAdminInfo .subjectQuestionCount{
        position:static!important;display:inline-flex!important;width:max-content!important;max-width:100%!important;height:auto!important;min-height:28px!important;
        margin:2px 0 0!important;padding:5px 11px!important;align-items:center!important;gap:6px!important;border-radius:999px!important;
        background:rgba(114,197,140,.10)!important;border:1px solid rgba(114,197,140,.30)!important;color:rgba(245,240,232,.78)!important;
        font-size:.80rem!important;font-weight:850!important;line-height:1!important;transform:none!important;inset:auto!important;box-shadow:none!important;
      }
      body #subjectsAdmin .subjectQuestionCount b{color:#82e6a3!important;font-size:.86rem!important;line-height:1!important;}
      body #subjectsAdmin .subjectAdminActions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:nowrap!important;min-width:254px!important;max-width:none!important;overflow:visible!important;}
      body #subjectsAdmin .subjectAdminActions .act,
      body #subjectsAdmin .subjectAdminActions button{min-height:38px!important;height:38px!important;padding:0 14px!important;border-radius:999px!important;font-size:.86rem!important;line-height:1!important;white-space:nowrap!important;}
      body #subjectsAdmin .subjectNewToggle{min-width:96px!important;height:38px!important;}
      body #subjectsAdmin .subjectOrderHint{margin:0 0 10px!important;padding:10px 14px!important;border-radius:16px!important;background:rgba(0,0,0,.18)!important;border:1px solid rgba(200,169,110,.12)!important;}
      /* SUBJECT_FOLDER_DRILLDOWN_20260728 \u2014 h\xE0ng th\u01B0 m\u1EE5c + thanh l\xF9i ra.
         \u0110\u1EB7t trong block n\xE0y v\xEC n\xF3 l\xE0 style \u0111\u01B0\u1EE3c nh\u1ED3i CU\u1ED0I <head> (keepStyleLast), n\xEAn ch\u1EAFc ch\u1EAFn
         kh\xF4ng b\u1ECB hai block style m\xF4n h\u1ECDc \u1EDF tr\xEAn ghi \u0111\xE8. H\xE0ng th\u01B0 m\u1EE5c l\u1EB7p \u0111\xFAng l\u01B0\u1EDBi c\u1EE7a
         .subjectAdminItem \u0111\u1EC3 hai lo\u1EA1i h\xE0ng th\u1EB3ng c\u1ED9t v\u1EDBi nhau. */
      body #subjectsAdmin .subjectAdminFolder{
        display:grid!important;grid-template-columns:40px 112px minmax(0,1fr) auto!important;gap:12px!important;
        align-items:center!important;min-height:76px!important;height:auto!important;padding:11px 15px!important;
        border-radius:18px!important;overflow:visible!important;cursor:grab!important;
        border:1px dashed rgba(200,169,110,.34)!important;
        background:linear-gradient(150deg,rgba(200,169,110,.085),rgba(255,255,255,.02))!important;
        transition:border-color .14s ease,background .14s ease,opacity .14s ease!important;
      }
      body #subjectsAdmin .subjectAdminFolder:hover{border-color:rgba(232,212,168,.55)!important;background:linear-gradient(150deg,rgba(200,169,110,.13),rgba(255,255,255,.03))!important;}
      body #subjectsAdmin .subjectAdminFolder.dragging{opacity:.45!important;}
      body #subjectsAdmin .subjectFolderCode{background:rgba(200,169,110,.18)!important;border-color:rgba(232,212,168,.34)!important;}
      body #subjectsAdmin .subjectFolderCode::before{content:"\u25A3";margin-right:6px;opacity:.85;}
      body #subjectsAdmin .subjectFolderChips{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:wrap!important;margin-top:3px!important;}
      body #subjectsAdmin .subjectFolderChip{display:inline-flex!important;align-items:center!important;min-height:28px!important;padding:5px 11px!important;border-radius:999px!important;background:rgba(232,212,168,.12)!important;border:1px solid rgba(232,212,168,.28)!important;color:var(--gold2)!important;font-size:.80rem!important;font-weight:900!important;line-height:1!important;}
      body #subjectsAdmin .subjectFolderOpenBtn{min-width:96px!important;}
      body #subjectsAdmin .subjectAdminBackBar{display:flex!important;align-items:center!important;gap:12px!important;flex-wrap:wrap!important;margin:0 0 10px!important;padding:9px 13px!important;border:1px solid rgba(200,169,110,.18)!important;border-radius:16px!important;background:rgba(0,0,0,.22)!important;}
      body #subjectsAdmin .subjectAdminBack{min-height:34px!important;height:34px!important;padding:0 14px!important;border-radius:999px!important;font-size:.84rem!important;font-weight:900!important;}
      body #subjectsAdmin .subjectAdminBackBar .subjectAdminCode{min-width:0!important;max-width:none!important;width:max-content!important;}
      body #subjectsAdmin .subjectAdminBackMeta{margin-left:auto!important;color:rgba(245,240,232,.60)!important;font-size:.84rem!important;font-weight:800!important;white-space:nowrap!important;}
      @media (max-width:1100px){
        body #subjectsAdmin .subjectAdminFolder{grid-template-columns:38px 104px minmax(0,1fr)!important;}
        body #subjectsAdmin .subjectAdminFolder .subjectAdminActions{grid-column:2 / -1!important;justify-content:flex-start!important;min-width:0!important;}
      }
      @media (max-width:760px){
        body #subjectsAdmin .subjectAdminFolder{grid-template-columns:38px minmax(0,1fr)!important;padding:12px!important;}
        body #subjectsAdmin .subjectAdminFolder .subjectAdminCode{grid-column:2!important;}
        body #subjectsAdmin .subjectAdminFolder .subjectAdminInfo,
        body #subjectsAdmin .subjectAdminFolder .subjectAdminActions{grid-column:1 / -1!important;}
      }
      @media (max-width:1100px){
        body #subjectsAdmin .subjectAdminItem{grid-template-columns:38px 104px minmax(0,1fr)!important;min-height:112px!important;}
        body #subjectsAdmin .subjectAdminActions{grid-column:2 / -1!important;justify-content:flex-start!important;min-width:0!important;flex-wrap:wrap!important;}
      }
      @media (max-width:760px){
        body #subjectsAdmin .subjectAdminItem{grid-template-columns:38px minmax(0,1fr)!important;min-height:0!important;padding:13px!important;}
        body #subjectsAdmin .subjectAdminCode{grid-column:2!important;min-width:0!important;max-width:max-content!important;height:34px!important;}
        body #subjectsAdmin .subjectAdminInfo,body #subjectsAdmin .subjectAdminActions{grid-column:1 / -1!important;}
        body #subjectsAdmin .subjectAdminActions{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;width:100%!important;}
        body #subjectsAdmin .subjectAdminActions .act,body #subjectsAdmin .subjectAdminActions button{width:100%!important;min-width:0!important;}
      }
    `;
    }
    function keepStyleLast() {
      injectFinalSubjectAdminPolish();
      const style = document.getElementById("subjectAdminNoOverlapFinalStyle");
      if (style && style.parentNode) document.head.appendChild(style);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", keepStyleLast);
    else keepStyleLast();
    setTimeout(keepStyleLast, 300);
    setTimeout(keepStyleLast, 1200);
  })();
  (function() {
    if (window.__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630) return;
    window.__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630 = true;
    async function adminApi(action, payload) {
      const res = await fetch("/api/admin-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || "",
          action,
          payload: payload || {}
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "M\xE1y ch\u1EE7 l\u1ED7i " + res.status);
      return data;
    }
    const oldPermanentDeleteSubject = window.permanentDeleteSubject;
    window.permanentDeleteSubject = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      if (!confirm("X\xF3a V\u0128NH VI\u1EC4N m\xF4n n\xE0y?\n\nKh\xF4ng th\u1EC3 kh\xF4i ph\u1EE5c sau thao t\xE1c n\xE0y!")) return;
      setBusy(true, "\u0110ang x\xF3a v\u0129nh vi\u1EC5n...");
      try {
        if (window.APP_CONFIG?.USE_TURSO_API) {
          await adminApi("permanent_delete_subject", { subject_id: id });
          if (typeof loadAll === "function") await loadAll();
          if (typeof loadTrash === "function") await loadTrash();
          toast("\u0110\xE3 x\xF3a v\u0129nh vi\u1EC5n m\xF4n");
          return;
        }
        if (typeof oldPermanentDeleteSubject === "function")
          return await oldPermanentDeleteSubject.apply(this, arguments);
      } catch (e) {
        alert("L\u1ED7i x\xF3a m\xF4n: " + (e?.message || e));
      } finally {
        setBusy(false);
      }
    };
    const oldPermanentDeleteQuestion = window.permanentDelete;
    window.permanentDelete = async function(id) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      if (window.APP_CONFIG?.USE_TURSO_API) {
        if (!confirm("X\xF3a V\u0128NH VI\u1EC4N c\xE2u h\u1ECFi n\xE0y?\n\nKh\xF4ng th\u1EC3 kh\xF4i ph\u1EE5c sau thao t\xE1c n\xE0y!")) return;
        setBusy(true, "\u0110ang x\xF3a v\u0129nh vi\u1EC5n...");
        try {
          await adminApi("permanent_delete_question", { question_id: id });
          if (typeof loadTrash === "function") await loadTrash();
          toast("\u0110\xE3 x\xF3a v\u0129nh vi\u1EC5n c\xE2u h\u1ECFi");
        } catch (e) {
          alert("L\u1ED7i x\xF3a c\xE2u h\u1ECFi: " + (e?.message || e));
        } finally {
          setBusy(false);
        }
        return;
      }
      if (typeof oldPermanentDeleteQuestion === "function") return oldPermanentDeleteQuestion.apply(this, arguments);
    };
  })();
  (function() {
    if (window.__COPILOT_EDITOR_ACCESS_HIDE_20260630) return;
    window.__COPILOT_EDITOR_ACCESS_HIDE_20260630 = true;
    const ADMIN_ONLY_PAGES = /* @__PURE__ */ new Set([
      "approvals",
      // Phê duyệt tài khoản
      "users",
      // Người dùng / phân quyền
      "logs",
      // Admin logs
      "trash",
      // Thùng rác
      "trashBin",
      "deletedQuestions",
      "discordSettings"
      // Thông báo Discord (xem được: admin; đổi được: chỉ admin hệ thống)
    ]);
    const EDITOR_ALLOWED_PAGES = /* @__PURE__ */ new Set([
      "overview",
      "requests",
      // Yêu cầu sửa
      "subjectRequests",
      // Yêu cầu thêm môn
      "subjectsAdmin",
      // Môn học
      "history"
      // Lịch sử sửa câu
    ]);
    function roleName() {
      return String(profile?.role || "").toLowerCase();
    }
    function canOpenPage(pageId) {
      pageId = String(pageId || "overview");
      if (pageId === "discordSettings") {
        return typeof window.isSystemAdmin === "function" && window.isSystemAdmin();
      }
      if (isAdmin()) return true;
      if (roleName() === "editor" && !isBlocked(profile)) {
        return EDITOR_ALLOWED_PAGES.has(pageId) && !ADMIN_ONLY_PAGES.has(pageId);
      }
      return pageId === "overview";
    }
    function isDeniedNav(el) {
      const page = el?.dataset?.page || "";
      if (!page) return false;
      return !canOpenPage(page);
    }
    function hideDeniedMenus() {
      if (!profile || !profile.role) return;
      const isEditorOnly = roleName() === "editor" && !isAdmin();
      document.body.classList.toggle("role-editor-limited", isEditorOnly);
      document.querySelectorAll(".nav[data-page]").forEach((btn) => {
        const deny = isDeniedNav(btn);
        btn.classList.toggle("accessHidden", deny);
        btn.setAttribute("aria-hidden", deny ? "true" : "false");
        if (deny) btn.tabIndex = -1;
        else btn.removeAttribute("tabindex");
      });
      document.querySelectorAll(
        '[data-page="approvals"], [data-page="users"], [data-page="logs"], [data-page="trash"], #exportBtn'
      ).forEach((el) => {
        const deny = !isAdmin();
        el.classList.toggle("accessHidden", deny);
        el.setAttribute("aria-hidden", deny ? "true" : "false");
      });
      document.querySelectorAll(".page").forEach((p) => {
        if (!p.id) return;
        const deny = !canOpenPage(p.id);
        p.classList.toggle("accessHiddenPage", deny);
        if (deny) p.classList.remove("active");
      });
      const current = sessionStorage.getItem("admin_current_page") || document.querySelector(".page.active")?.id || "overview";
      if (!canOpenPage(current)) {
        try {
          sessionStorage.setItem("admin_current_page", "overview");
          sessionStorage.setItem("admin_current_page_name", "T\u1ED5ng quan");
        } catch (e) {
          lhWarn("COPILOT_EDITOR_ACCESS_HIDE_20260630", e);
        }
        if (typeof setPage === "function") setPage("overview", "T\u1ED5ng quan");
      }
    }
    window.hideDeniedMenus = hideDeniedMenus;
    document.addEventListener(
      "click",
      function(e) {
        const nav = e.target.closest?.(".nav[data-page]");
        if (!nav) return;
        const page = nav.dataset.page || "";
        if (!canOpenPage(page)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toast("T\xE0i kho\u1EA3n editor kh\xF4ng c\xF3 quy\u1EC1n v\xE0o m\u1EE5c n\xE0y");
          hideDeniedMenus();
          return false;
        }
      },
      true
    );
    const oldSetPage = typeof setPage === "function" ? setPage : null;
    if (oldSetPage && !oldSetPage.__editorAccessGuarded) {
      const guardedSetPage = function(id, name) {
        if (!canOpenPage(id)) {
          id = "overview";
          name = "T\u1ED5ng quan";
        }
        const r = oldSetPage.call(this, id, name);
        setTimeout(hideDeniedMenus, 0);
        return r;
      };
      guardedSetPage.__editorAccessGuarded = true;
      setPage = guardedSetPage;
      window.setPage = guardedSetPage;
    }
    const oldLoadProfile = typeof loadProfile === "function" ? loadProfile : null;
    if (oldLoadProfile && !oldLoadProfile.__editorAccessPatched) {
      const patchedLoadProfile = async function() {
        const r = await oldLoadProfile.apply(this, arguments);
        hideDeniedMenus();
        setTimeout(hideDeniedMenus, 200);
        return r;
      };
      patchedLoadProfile.__editorAccessPatched = true;
      loadProfile = patchedLoadProfile;
      window.loadProfile = patchedLoadProfile;
    }
    const oldLoadAll = typeof loadAll === "function" ? loadAll : null;
    if (oldLoadAll && !oldLoadAll.__editorAccessPatched) {
      const patchedLoadAll = async function() {
        const r = await oldLoadAll.apply(this, arguments);
        hideDeniedMenus();
        setTimeout(hideDeniedMenus, 200);
        return r;
      };
      patchedLoadAll.__editorAccessPatched = true;
      loadAll = patchedLoadAll;
      window.loadAll = patchedLoadAll;
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hideDeniedMenus);
    else hideDeniedMenus();
    setTimeout(hideDeniedMenus, 300);
    setTimeout(hideDeniedMenus, 1200);
    setInterval(hideDeniedMenus, 2500);
  })();
  (function() {
    if (window.__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630) return;
    window.__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 = true;
    const PAGE_KEY = "admin_current_page";
    const PAGE_NAME_KEY = "admin_current_page_name";
    function saveAdminPage(id, name) {
      if (!id) return;
      try {
        sessionStorage.setItem(PAGE_KEY, id);
        localStorage.setItem(PAGE_KEY, id);
        if (name) {
          sessionStorage.setItem(PAGE_NAME_KEY, name);
          localStorage.setItem(PAGE_NAME_KEY, name);
        }
      } catch (e) {
        lhWarn("COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630", e);
      }
    }
    function getSavedAdminPage() {
      try {
        return {
          id: sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || "overview",
          name: sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || ""
        };
      } catch (e) {
        return { id: "overview", name: "" };
      }
    }
    const oldSetPageKeepTab = typeof setPage === "function" ? setPage : null;
    if (oldSetPageKeepTab && !oldSetPageKeepTab.__keepTabAfterReset) {
      const patchedSetPage = function(id, name) {
        const nav = document.querySelector('.nav[data-page="' + id + '"]');
        const title = name || nav?.textContent?.trim() || id || "T\u1ED5ng quan";
        const out = oldSetPageKeepTab.call(this, id, title);
        saveAdminPage(id, title);
        return out;
      };
      patchedSetPage.__keepTabAfterReset = true;
      setPage = window.setPage = patchedSetPage;
    }
    document.addEventListener(
      "click",
      function(e) {
        const nav = e.target.closest?.(".nav[data-page]");
        if (nav) saveAdminPage(nav.dataset.page, nav.textContent.trim());
      },
      true
    );
    function restoreSavedAdminPage() {
      if (!user || !profile || !profile.role) return;
      const saved = getSavedAdminPage();
      if (!saved.id || saved.id === "overview") return;
      const nav = document.querySelector('.nav[data-page="' + saved.id + '"]');
      const page = document.getElementById(saved.id);
      if (!nav || !page || typeof setPage !== "function") return;
      setPage(saved.id, saved.name || nav.textContent.trim());
      if (saved.id === "approvals" && typeof window.loadRegistrationMode === "function")
        setTimeout(window.loadRegistrationMode, 50);
      if (saved.id === "subjectsAdmin" && typeof window.loadSubjectsAdmin === "function")
        setTimeout(window.loadSubjectsAdmin, 50);
      if (saved.id === "trash" && typeof window.loadTrash === "function") setTimeout(window.loadTrash, 50);
      if (saved.id === "subjectRequests" && typeof window.loadSubjectRequests === "function")
        setTimeout(window.loadSubjectRequests, 50);
    }
    [600, 1200, 2200, 3500].forEach((ms) => setTimeout(restoreSavedAdminPage, ms));
  })();
  (function() {
    if (window.__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630) return;
    window.__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 = true;
    const PAGE_KEY = "admin_current_page";
    const PAGE_NAME_KEY = "admin_current_page_name";
    const MODE_KEY = "admin_registration_mode_last_v1";
    function normalizeMode(v) {
      if (v && typeof v === "object" && "value" in v) v = v.value;
      if (typeof v !== "string") v = String(v || "approval");
      if (/^\s*["[{]/.test(v)) {
        try {
          const parsed = JSON.parse(v);
          if (typeof parsed === "string") v = parsed;
        } catch (e) {
          lhWarn("COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630", e);
        }
      }
      v = String(v || "approval").replace(/^"+|"+$/g, "").trim();
      return ["open", "approval", "closed"].includes(v) ? v : "approval";
    }
    function clearSoftCache(kind) {
      try {
        if (typeof client?.clearCache === "function") client.clearCache();
        if (typeof window.clearLearningHubSupabaseCache === "function")
          window.clearLearningHubSupabaseCache(kind || "site_settings");
        Object.keys(sessionStorage).forEach(function(k) {
          const s = String(k);
          if (s.includes("site_settings") || s.includes("registration_mode") || s.startsWith("admin_f5_micro_cache:") || s.startsWith("lh_f5_cache:")) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (e) {
        lhWarn("COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630", e);
      }
    }
    function paintRegistrationMode(mode) {
      mode = normalizeMode(mode);
      const status = document.getElementById("registrationGateStatus");
      const openBtn = document.getElementById("regGateOpen");
      const approvalBtn = document.getElementById("regGateApproval");
      const closedBtn = document.getElementById("regGateClosed");
      if (status) {
        if (mode === "open")
          status.innerHTML = '<span style="color:#66bb6a;font-weight:900">M\u1EDE</span> \u2014 Ai \u0111\u0103ng k\xFD c\u0169ng v\xE0o \u0111\u01B0\u1EE3c ngay, kh\xF4ng c\u1EA7n duy\u1EC7t';
        else if (mode === "closed")
          status.innerHTML = '<span style="color:#ef5350;font-weight:900">\u0110\xD3NG</span> \u2014 Kh\xF4ng ai \u0111\u0103ng k\xFD m\u1EDBi \u0111\u01B0\u1EE3c';
        else
          status.innerHTML = '<span style="color:#ffc107;font-weight:900">C\u1EA6N DUY\u1EC6T</span> \u2014 User m\u1EDBi ph\u1EA3i ch\u1EDD admin ph\xEA duy\u1EC7t';
      }
      if (openBtn) openBtn.classList.toggle("active", mode === "open");
      if (approvalBtn) approvalBtn.classList.toggle("active", mode === "approval");
      if (closedBtn) closedBtn.classList.toggle("active", mode === "closed");
    }
    async function fetchSiteSettings() {
      const headers = new Headers({ Accept: "application/json" });
      let accessToken = "";
      try {
        const raw = typeof window.lhToken === "function" ? window.lhToken() : "";
        if (typeof raw === "string" && raw.trim() && !/[\r\n]/.test(raw)) accessToken = raw.trim();
      } catch (e) {
        lhWarn("COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630", e);
      }
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      const response = await fetch("/api/settings", {
        method: "GET",
        headers,
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      return data;
    }
    window.loadRegistrationMode = async function() {
      try {
        const data = await fetchSiteSettings();
        const mode = normalizeMode(data.registration_mode || localStorage.getItem(MODE_KEY) || "approval");
        localStorage.setItem(MODE_KEY, mode);
        paintRegistrationMode(mode);
        return mode;
      } catch (e) {
        console.warn("[loadRegistrationMode] /api/settings l\u1ED7i:", e?.message || e);
        const mode = normalizeMode(localStorage.getItem(MODE_KEY) || "approval");
        paintRegistrationMode(mode);
        return mode;
      }
    };
    window.setRegistrationMode = async function(mode) {
      if (!isAdmin()) return alert("Ch\u1EC9 admin.");
      mode = normalizeMode(mode);
      const label = { open: "M\u1EDE \u2014 ai c\u0169ng v\xE0o \u0111\u01B0\u1EE3c", approval: "C\u1EA6N DUY\u1EC6T \u2014 user m\u1EDBi ph\u1EA3i ch\u1EDD", closed: "\u0110\xD3NG \u2014 ch\u1EB7n \u0111\u0103ng k\xFD m\u1EDBi" }[mode] || mode;
      if (!confirm("Chuy\u1EC3n c\u1ED5ng \u0111\u0103ng k\xFD sang: " + label + "?")) return;
      setBusy(true, "\u0110ang c\u1EADp nh\u1EADt...");
      try {
        clearSoftCache("site_settings");
        if (!await adminAction("set_registration_mode", { mode })) return;
        localStorage.setItem(MODE_KEY, mode);
        clearSoftCache("site_settings");
        paintRegistrationMode(mode);
        try {
          await logAction("set_registration_mode", "site_settings", "registration_mode", { mode });
        } catch (e) {
          lhWarn("COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630", e);
        }
        toast("\u0110\xE3 chuy\u1EC3n c\u1ED5ng \u0111\u0103ng k\xFD: " + mode);
      } finally {
        setBusy(false);
      }
    };
    const oldSetPage = typeof setPage === "function" ? setPage : null;
    if (oldSetPage && !oldSetPage.__copilotPageRestoreFix) {
      const fixedSetPage = function(id, name) {
        oldSetPage.apply(this, arguments);
        try {
          if (id) {
            sessionStorage.setItem(PAGE_KEY, id);
            sessionStorage.setItem(
              PAGE_NAME_KEY,
              name || document.querySelector('.nav[data-page="' + id + '"]')?.textContent?.trim() || id
            );
            localStorage.setItem(PAGE_KEY, id);
            localStorage.setItem(
              PAGE_NAME_KEY,
              name || document.querySelector('.nav[data-page="' + id + '"]')?.textContent?.trim() || id
            );
          }
        } catch (e) {
          lhWarn("COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630", e);
        }
      };
      fixedSetPage.__copilotPageRestoreFix = true;
      window.setPage = setPage = fixedSetPage;
    }
    function restoreSavedPage(beforeId, beforeName) {
      const id = beforeId || sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || "";
      if (!id || id === "overview") return;
      const btn = document.querySelector('.nav[data-page="' + id + '"]');
      const page = document.getElementById(id);
      if (!btn || !page) return;
      const name = beforeName || sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || btn.textContent.trim();
      if (typeof setPage === "function") setPage(id, name);
      if (id === "subjectsAdmin" && typeof window.loadSubjectsAdmin === "function") window.loadSubjectsAdmin();
      if (id === "approvals" && typeof window.loadRegistrationMode === "function") window.loadRegistrationMode();
      if (id === "trash" && typeof window.loadTrash === "function") window.loadTrash();
      if (id === "subjectRequests" && typeof window.loadSubjectRequests === "function") window.loadSubjectRequests();
    }
    const oldLoadAll = typeof loadAll === "function" ? loadAll : null;
    if (oldLoadAll && !oldLoadAll.__copilotPageRestoreFix) {
      const fixedLoadAll = async function() {
        const keepId = sessionStorage.getItem(PAGE_KEY) || localStorage.getItem(PAGE_KEY) || "";
        const keepName = sessionStorage.getItem(PAGE_NAME_KEY) || localStorage.getItem(PAGE_NAME_KEY) || "";
        const out = await oldLoadAll.apply(this, arguments);
        setTimeout(function() {
          restoreSavedPage(keepId, keepName);
        }, 80);
        return out;
      };
      fixedLoadAll.__copilotPageRestoreFix = true;
      window.loadAll = loadAll = fixedLoadAll;
    }
    document.addEventListener("DOMContentLoaded", function() {
      setTimeout(function() {
        restoreSavedPage();
      }, 700);
      setTimeout(function() {
        restoreSavedPage();
      }, 1600);
      setTimeout(function() {
        if (typeof window.loadRegistrationMode === "function") window.loadRegistrationMode();
      }, 900);
    });
  })();
  (function() {
    if (window.__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630) return;
    window.__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630 = true;
    window.approve = async function(id) {
      const r = (cache.requests || []).find((x) => Number(x.id) === Number(id));
      if (!r || r.status !== "pending") return;
      if (!user) return alert("Ch\u01B0a \u0111\u0103ng nh\u1EADp.");
      if (!confirm("Duy\u1EC7t thay \u0111\u1ED5i cho c\xE2u " + questionLabel(r) + "?")) return;
      setBusy(true, "\u0110ang duy\u1EC7t...");
      try {
        const res = await fetch("/api/admin-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ user_id: user.id, action: "approve_request", payload: { request_id: id } })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.error) return alert(out.error || "Kh\xF4ng duy\u1EC7t \u0111\u01B0\u1EE3c");
        toast("\u0110\xE3 duy\u1EC7t");
        await loadAll();
      } finally {
        setBusy(false);
      }
    };
  })();
  (function() {
    if (window.__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630) return;
    window.__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630 = true;
    (function() {
      if (window.__LH_UNIFIED_FETCH_INSTALLED) return;
      window.__LH_UNIFIED_FETCH_INSTALLED = true;
      var nativeFetch = window.fetch.bind(window);
      function lhToken() {
        try {
          if (window.HODSupabase && typeof window.HODSupabase.getAccessToken === "function") {
            var t1 = window.HODSupabase.getAccessToken();
            if (t1 && typeof t1 === "string" && t1.trim().length > 0 && !/[\r\n]/.test(t1)) return t1.trim();
          }
          if (window.HODSupabase && typeof window.HODSupabase.getSession === "function") {
            var s = window.HODSupabase.getSession();
            if (s && s.access_token && typeof s.access_token === "string" && !/[\r\n]/.test(s.access_token)) {
              return s.access_token.trim();
            }
          }
          var url = window.APP_CONFIG?.SUPABASE_URL || "";
          var m = /https:\/\/([a-z0-9]+)\.supabase\./i.exec(url);
          var ref = m ? m[1] : "";
          if (ref) {
            var key2 = "sb-" + ref + "-auth-token";
            var raw = localStorage.getItem(key2);
            if (raw) {
              var v = JSON.parse(raw);
              var tok = v && (v.access_token || v.currentSession && v.currentSession.access_token || Array.isArray(v) && v[0]);
              if (tok && typeof tok === "string" && tok.trim().length > 0 && !/[\r\n]/.test(tok)) return tok.trim();
            }
          }
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.slice(0, 3) === "sb-" && k.slice(-11) === "-auth-token") {
              var raw = localStorage.getItem(k);
              if (!raw) continue;
              var v = JSON.parse(raw);
              var tok = v && (v.access_token || v.currentSession && v.currentSession.access_token || Array.isArray(v) && v[0]);
              if (tok && typeof tok === "string" && tok.trim().length > 0 && !/[\r\n]/.test(tok)) return tok.trim();
            }
          }
        } catch (e) {
          lhWarn("LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726", e);
        }
        return "";
      }
      window.lhToken = lhToken;
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
        var urlStr = "";
        var method = "GET";
        try {
          if (typeof input === "string") {
            urlStr = input;
          } else if (input && typeof input === "object" && input.url) {
            urlStr = input.url;
            method = input.method || "GET";
          }
          if (init2 && init2.method) method = init2.method;
        } catch (e) {
          lhWarn("LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726", e);
        }
        var isApi = lhIsApi(urlStr);
        if (isApi) {
          var tok = lhToken();
          if (tok) {
            try {
              if (input instanceof Request) {
                if (!input.headers.has("Authorization")) {
                  var h = new Headers(input.headers);
                  h.set("Authorization", "Bearer " + tok);
                  input = new Request(input, { headers: h });
                }
              } else {
                init2 = init2 ? Object.assign({}, init2) : {};
                var hh = new Headers(init2.headers || {});
                if (!hh.has("Authorization")) hh.set("Authorization", "Bearer " + tok);
                init2.headers = hh;
              }
            } catch (e) {
              console.warn("[LH Unified Fetch] Header injection warning:", e);
            }
          }
        }
        var promise = nativeFetch(input, init2);
        if (isApi && String(method).toUpperCase() === "POST" && urlStr.indexOf("/api/admin-action") !== -1) {
          promise.then(
            function() {
              if (typeof window.__invalidateAdminDashboardCache === "function") {
                window.__invalidateAdminDashboardCache();
              }
            },
            function() {
            }
          );
        }
        if (isApi && urlStr.indexOf("/api/version.json") === -1) {
          promise.then(function(res) {
            if (res.status !== 401 && res.status !== 403) return;
            res.clone().json().then(function(json) {
              var code = json && json.code;
              if (code === "BLOCKED" || code === "PENDING_APPROVAL" || code === "UNAUTHORIZED") {
                window.handleAccessRevoked(json.error, code);
              } else if (code === "INSUFFICIENT_ROLE" || code === "PROTECTED_ROOT_ADMIN") {
                if (typeof toast === "function") toast(json.error || "B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n th\u1EF1c hi\u1EC7n thao t\xE1c n\xE0y");
                else console.warn("[Admin]", json.error);
              }
            }).catch(function() {
            });
          }).catch(function() {
          });
        }
        return promise;
      };
    })();
    function clearAdminImageCaches() {
      try {
        Object.keys(sessionStorage).forEach(function(k) {
          if (k.startsWith("admin_f5_micro_cache:") || k.startsWith("lh_f5_cache:")) sessionStorage.removeItem(k);
        });
      } catch (e) {
        lhWarn("adminCore", e);
      }
    }
    window.clearAdminImageCaches = clearAdminImageCaches;
    function mergeQuestionKeepImages(oldRow, newRow) {
      const merged = Object.assign({}, oldRow || {}, newRow || {});
      if ((!newRow || !Object.prototype.hasOwnProperty.call(newRow, "images")) && oldRow && Object.prototype.hasOwnProperty.call(oldRow, "images")) {
        merged.images = oldRow.images;
      }
      return merged;
    }
    window.__mergeQuestionKeepImages = mergeQuestionKeepImages;
    function patchLoadAll() {
      if (typeof window.loadAll !== "function" || window.loadAll.__imageCacheFinalPatched) return;
      const oldLoadAll = window.loadAll;
      window.loadAll = async function() {
        clearAdminImageCaches();
        return oldLoadAll.apply(this, arguments);
      };
      window.loadAll.__imageCacheFinalPatched = true;
      try {
        loadAll = window.loadAll;
      } catch (e) {
        lhWarn("adminCore", e);
      }
    }
    function patchRealtime() {
      if (typeof window.startAdminRealtime !== "function" || window.startAdminRealtime.__imageRealtimeFinalPatched)
        return;
      const oldStart = window.startAdminRealtime;
      window.startAdminRealtime = function() {
        clearAdminImageCaches();
        const out = oldStart.apply(this, arguments);
        try {
          if (!client || typeof client.getChannels !== "function") return out;
          client.getChannels().forEach(function(ch) {
            if (ch.__imageKeepPatched) return;
            ch.__imageKeepPatched = true;
          });
        } catch (e) {
          lhWarn("adminCore", e);
        }
        return out;
      };
      window.startAdminRealtime.__imageRealtimeFinalPatched = true;
      try {
        startAdminRealtime = window.startAdminRealtime;
      } catch (e) {
        lhWarn("adminCore", e);
      }
    }
    function patchRefreshButton() {
      const btn = document.getElementById("refreshBtn");
      if (!btn || btn.__imageCacheClearBound) return;
      btn.__imageCacheClearBound = true;
      btn.addEventListener("click", clearAdminImageCaches, true);
    }
    clearAdminImageCaches();
    patchLoadAll();
    patchRealtime();
    patchRefreshButton();
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", function() {
        clearAdminImageCaches();
        patchLoadAll();
        patchRealtime();
        patchRefreshButton();
      });
    else
      setTimeout(function() {
        clearAdminImageCaches();
        patchLoadAll();
        patchRealtime();
        patchRefreshButton();
      }, 0);
    setTimeout(function() {
      patchLoadAll();
      patchRealtime();
      patchRefreshButton();
    }, 500);
  })();
  (function() {
    if (window.__FIX_ADMIN_AUTO_REFRESH_20260701) return;
    window.__FIX_ADMIN_AUTO_REFRESH_20260701 = true;
    const INTERVAL_MS = 15 * 60 * 1e3;
    async function silentRefresh() {
      try {
        if (document.hidden) return;
        if (document.body.classList.contains("is-busy")) return;
        const modal = document.getElementById("modal");
        if (modal && !modal.classList.contains("hidden")) return;
        if (typeof user === "undefined" || !user) return;
        if (typeof profile === "undefined" || !profile) return;
        const appBox = document.getElementById("appBox");
        if (!appBox || appBox.classList.contains("hidden")) return;
        const pj = (v, d) => {
          if (v == null) return d;
          if (typeof v !== "string") return v;
          try {
            return JSON.parse(v);
          } catch (e) {
            return d;
          }
        };
        const r0 = await window.__fetchAdminDashboardJSON();
        const dash = r0.dash || {};
        if (!r0.ok || dash.error) return;
        if (r0.text && r0.text === window.__adminDashRenderedText) return;
        window.__adminDashRenderedText = r0.text || "";
        cache.profiles = (dash.profiles || []).map((p) => ({
          ...p,
          approved: p.approved === 1 || p.approved === true || p.approved === "1",
          blocked: p.blocked === 1 || p.blocked === true || p.blocked === "1"
        }));
        cache.questions = (dash.questions || []).map((q) => ({
          ...q,
          options: pj(q.options, {}),
          images: pj(q.images, [])
        }));
        cache.requests = (dash.requests || []).map((r) => ({
          ...r,
          old_data: pj(r.old_data, {}),
          new_data: pj(r.new_data, {})
        }));
        cache.history = (dash.history || []).map((h) => ({
          ...h,
          previous_data: pj(h.previous_data, {}),
          new_data: pj(h.new_data, {})
        }));
        cache.logs = typeof isAdmin === "function" && isAdmin() ? (dash.logs || []).map((l) => ({ ...l, details: pj(l.details, {}) })) : [];
        cache.subjects = dash.subjects || [];
        cache.folder_new_badges = Array.isArray(dash.folder_new_badges) ? dash.folder_new_badges : [];
        cache.subject_requests = (dash.subject_requests || []).map((s) => ({
          ...s,
          questions_data: pj(s.questions_data, [])
        }));
        cache.deleted_questions = (dash.deleted_questions || []).map((d) => ({
          ...d,
          original_data: pj(d.original_data, {})
        }));
        cache.deleted_subjects = (dash.deleted_subjects || []).map((d) => ({
          ...d,
          original_data: pj(d.original_data, {})
        }));
        window.__lhReadAdminTierFromDashboard?.(dash);
        if (typeof render === "function") render();
        if (typeof renderApprovals === "function") renderApprovals();
      } catch (e) {
        console.warn("[silentRefresh]", e);
      }
    }
    setInterval(silentRefresh, INTERVAL_MS);
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) silentRefresh();
    });
  })();
  (function() {
    if (new URLSearchParams(location.search).get("tab") !== "requests") return;
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => window.setPage?.("requests", "Y\xEAu c\u1EA7u s\u1EEDa"), 250);
    });
  })();
  (function() {
    window.closeUserActionMenuFinal = function() {
      document.getElementById("lhActionBackdrop")?.remove();
      document.getElementById("lhActionMenuFloat")?.remove();
      document.querySelectorAll(".lhDotsBtn.isOpen").forEach((b) => b.classList.remove("isOpen"));
    };
    window.showUserDeviceHistoryModal = function(uid) {
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng.");
      const email = p.email || p.id;
      let historyList = [];
      try {
        if (typeof p.device_history === "string" && p.device_history) {
          historyList = JSON.parse(p.device_history);
        } else if (Array.isArray(p.device_history)) {
          historyList = p.device_history;
        }
      } catch (e) {
        historyList = [];
      }
      if (!Array.isArray(historyList) || !historyList.length) {
        historyList = p.device_info ? [{ device: p.device_info, time: p.last_activity || p.last_login || p.created_at || "" }] : [];
      }
      const rowsHTML = historyList.length ? historyList.map((item, idx) => {
        let devRaw = String(item.device || "Ch\u01B0a r\xF5").trim();
        let icon = "\u{1F4BB}";
        const lw = devRaw.toLowerCase();
        if (lw.includes("iphone") || lw.includes("ios") || lw.includes("android") || lw.includes("mobile"))
          icon = "\u{1F4F1}";
        else if (lw.includes("mac") || lw.includes("apple") || lw.includes("safari")) icon = "\u{1F5A5}\uFE0F";
        const cleanDev = devRaw.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, "").trim() || devRaw;
        const tagHTML = idx === 0 ? `<span class="badge approved" style="font-size:.7rem;padding:2px 8px;">\u0110ang s\u1EED d\u1EE5ng</span>` : `<span class="badge" style="font-size:.7rem;opacity:.75;padding:2px 8px;">Tr\u01B0\u1EDBc \u0111\xF3</span>`;
        const timeStr = item.time ? date(item.time) : "Kh\xF4ng r\xF5";
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin:8px 0;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <span style="font-size:1.3rem">${icon}</span>
          <div style="min-width:0">
            <b style="color:#f8fafc;font-size:.92rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(cleanDev)}</b>
            <span style="color:#64748b;font-size:.75rem;font-family:monospace;display:block;margin-top:2px">ID: ${esc(p.id)}</span>
          </div>
        </div>
        <div style="text-align:right;flex:0 0 auto;margin-left:12px">
          ${tagHTML}
          <div style="color:#94a3b8;font-size:.78rem;margin-top:4px">${esc(timeStr)}</div>
        </div>
      </div>`;
      }).join("") : '<p class="muted" style="padding:24px;text-align:center">Ch\u01B0a c\xF3 l\u1ECBch s\u1EED thi\u1EBFt b\u1ECB cho t\xE0i kho\u1EA3n n\xE0y.</p>';
      openModal(
        "\u{1F4F1} L\u1ECBch s\u1EED thi\u1EBFt b\u1ECB \u0111\u0103ng nh\u1EADp",
        `<div style="padding:4px 0">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.1)">
        <div style="width:46px;height:46px;min-width:46px;border-radius:50%;background:rgba(226,184,107,.15);border:1px solid rgba(226,184,107,.3);display:grid;place-items:center;font-weight:900;color:#f3e3b3;font-size:1.15rem">${esc((email[0] || "U").toUpperCase())}</div>
        <div style="min-width:0">
          <b style="font-size:1.05rem;color:#f8fafc;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(email)}</b>
          <span style="font-size:.78rem;color:#94a3b8">Danh s\xE1ch thi\u1EBFt b\u1ECB ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 \u0111\u0103ng nh\u1EADp</span>
        </div>
      </div>
      <div style="max-height:380px;overflow-y:auto;padding-right:4px">${rowsHTML}</div>
    </div>`
      );
    };
    window.openUserActionMenuFinal = function(ev, uid) {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      const btn = ev?.currentTarget || ev?.target;
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      if (!p) return alert("Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng.");
      const wasOpen = btn?.classList?.contains("isOpen");
      closeUserActionMenuFinal();
      if (wasOpen) return;
      btn?.classList?.add("isOpen");
      const backdrop = document.createElement("div");
      backdrop.id = "lhActionBackdrop";
      backdrop.onclick = closeUserActionMenuFinal;
      document.body.appendChild(backdrop);
      const role = String(p.role || "user").toLowerCase();
      const revokeBtn = role !== "admin" ? `<button class="act bad" onclick="revokeApproval('${p.id}');closeUserActionMenuFinal();">Thu h\u1ED3i quy\u1EC1n</button>` : "";
      const menu = document.createElement("div");
      menu.id = "lhActionMenuFloat";
      menu.innerHTML = isAdmin() ? `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED s\u1EEDa c\xE2u</button>
         <button class="act" onclick="notifyReloadUser('${p.id}');closeUserActionMenuFinal();">\u{1F514} Nh\u1EAFc t\u1EA3i l\u1EA1i trang</button>
         <button class="act ${isBlocked(p) ? "ok" : "bad"}" onclick="toggleBlock('${p.id}',${!isBlocked(p)});closeUserActionMenuFinal();">${isBlocked(p) ? "Unblock" : "Block"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "editor" ? "user" : "editor"}');closeUserActionMenuFinal();">${p.role === "editor" ? "G\u1EE1 editor" : "Cho editor"}</button>
         <button class="act warn" onclick="setRole('${p.id}','${p.role === "admin" ? "user" : "admin"}');closeUserActionMenuFinal();">${p.role === "admin" ? "G\u1EE1 admin" : "Cho admin"}</button>
         ${revokeBtn}` : `<button class="act" onclick="viewUserEdits('${p.id}');closeUserActionMenuFinal();">L\u1ECBch s\u1EED s\u1EEDa c\xE2u</button>`;
      document.body.appendChild(menu);
      const r = btn.getBoundingClientRect();
      const mw = menu.offsetWidth || 210;
      const mh = menu.offsetHeight || 250;
      let left = Math.min(window.innerWidth - mw - 14, Math.max(14, r.right - mw));
      let top = r.bottom + 8;
      if (top + mh > window.innerHeight - 14) top = Math.max(14, r.top - mh - 8);
      menu.style.left = left + "px";
      menu.style.top = top + "px";
    };
    window.notifyReloadUser = async function(uid) {
      const p = (cache.profiles || []).find((x) => String(x.id) === String(uid));
      const name = p ? p.email || p.full_name || uid : uid;
      if (!confirm(`Nh\u1EAFc ng\u01B0\u1EDDi d\xF9ng n\xE0y t\u1EA3i l\u1EA1i trang?
${name}

H\u1ECD KH\xD4NG b\u1ECB \u0111\u0103ng xu\u1EA5t.`)) return;
      if (await adminAction("notify_reload_user", { target_user_id: uid })) {
        toast(`\u0110\xE3 g\u1EEDi nh\u1EAFc t\u1EA3i l\u1EA1i t\u1EDBi ${name}`);
      }
    };
    window.notifyReloadAllUsers = async function() {
      if (!confirm(
        'Nh\u1EAFc T\u1EA4T C\u1EA2 ng\u01B0\u1EDDi d\xF9ng t\u1EA3i l\u1EA1i trang?\n\nM\u1ECDi ng\u01B0\u1EDDi (tr\u1EEB b\u1EA1n) s\u1EBD th\u1EA5y banner "H\u1EC7 th\u1ED1ng v\u1EEBa c\u1EADp nh\u1EADt \u2014 T\u1EA3i l\u1EA1i".\nKH\xD4NG ai b\u1ECB \u0111\u0103ng xu\u1EA5t.'
      ))
        return;
      if (await adminAction("notify_reload_all", {})) {
        toast("\u0110\xE3 g\u1EEDi nh\u1EAFc t\u1EA3i l\u1EA1i t\u1EDBi t\u1EA5t c\u1EA3 ng\u01B0\u1EDDi d\xF9ng");
      }
    };
    if (typeof sendLoginToDiscord !== "function") {
      window.sendLoginToDiscord = async function(email, role) {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "login", user_id: window.user?.id, email, role, source: "admin" }),
            signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(8e3) : void 0
          });
        } catch (e) {
          console.warn("sendLoginToDiscord error:", e);
        }
      };
    }
    document.addEventListener(
      "click",
      (e) => {
        if (e.target.closest("#lhActionMenuFloat") || e.target.closest(".lhDotsBtn")) return;
        closeUserActionMenuFinal();
      },
      true
    );
    window.addEventListener("resize", closeUserActionMenuFinal);
    window.addEventListener("scroll", closeUserActionMenuFinal, true);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeUserActionMenuFinal();
    });
  })();
  (function() {
    if (window.__ADMIN_TWO_TIERS_20260729) return;
    window.__ADMIN_TWO_TIERS_20260729 = true;
    const $id = (id) => document.getElementById(id);
    const TIER = { isSystem: false, kinds: [], settings: {} };
    window.__lhAdminTier = TIER;
    window.isSystemAdmin = () => !!TIER.isSystem;
    function readDashboard(dash) {
      if (!dash) return;
      TIER.isSystem = !!dash.is_system_admin;
      if (Array.isArray(dash.discord_notification_kinds)) TIER.kinds = dash.discord_notification_kinds;
      if (dash.discord_notifications && typeof dash.discord_notifications === "object") {
        TIER.settings = { ...dash.discord_notifications };
      }
    }
    function tierLabel() {
      if (!profile) return "";
      if (TIER.isSystem) return "admin h\u1EC7 th\u1ED1ng";
      return String(profile.role || "");
    }
    function renderAdminTierChip() {
      const chip = $id("adminChip");
      if (!chip || !profile) return;
      chip.textContent = `${profile.email || user?.email || ""} \xB7 ${tierLabel()}`;
      chip.classList.toggle("isSystemAdmin", TIER.isSystem);
      document.body.classList.toggle("role-system-admin", TIER.isSystem);
    }
    function ensureDiscordPage() {
      if (!window.isSystemAdmin || !window.isSystemAdmin()) {
        const navBtn = $id("discordSettingsNav");
        if (navBtn) navBtn.classList.add("accessHidden");
        return;
      }
      if (!$id("discordSettingsNav")) {
        const side = document.querySelector(".side");
        const foot = document.querySelector(".foot");
        if (side) {
          const btn = document.createElement("button");
          btn.id = "discordSettingsNav";
          btn.className = "nav";
          btn.type = "button";
          btn.dataset.page = "discordSettings";
          btn.textContent = "Th\xF4ng b\xE1o Discord";
          btn.onclick = () => {
            if (!window.isSystemAdmin || !window.isSystemAdmin()) {
              if (typeof setPage === "function") setPage("overview", "T\u1ED5ng quan");
              return;
            }
            setPage("discordSettings", "Th\xF4ng b\xE1o Discord");
            renderDiscordSettings();
          };
          side.insertBefore(btn, foot || null);
          if (typeof window.organizeAdminSidebarTree === "function") window.organizeAdminSidebarTree();
        }
      } else {
        $id("discordSettingsNav").classList.remove("accessHidden");
      }
      if (!$id("discordSettings")) {
        const ws = document.querySelector(".workspace");
        if (!ws) return;
        const page = document.createElement("section");
        page.id = "discordSettings";
        page.className = "page";
        page.innerHTML = `
        <div class="panel panelFill">
          <h3>Th\xF4ng b\xE1o Discord</h3>
          <div class="hint" id="discordHint">B\u1EADt/t\u1EAFt t\u1EEBng lo\u1EA1i tin g\u1EEDi l\xEAn Discord. Ch\u1EC9 <b>admin h\u1EC7 th\u1ED1ng</b> \u0111\u01B0\u1EE3c \u0111\u1ED5i.</div>
          <div id="discordTierNote" class="discordTierNote hidden"></div>
          <div id="discordToggleList" class="discordToggleList pageScroll"></div>
        </div>`;
        ws.appendChild(page);
      }
    }
    function toggleRowHTML(kind) {
      const on = TIER.settings[kind.key] !== false;
      const locked = !TIER.isSystem;
      return `<div class="discordToggleRow ${on ? "isOn" : "isOff"}">
      <div class="discordToggleInfo">
        <b>${esc(kind.label || kind.key)}</b>
        <p class="muted">${esc(kind.description || "")}</p>
      </div>
      <div class="discordToggleState">
        <span class="discordStateText">${on ? "\u0110ang b\u1EADt" : "\u0110ang t\u1EAFt"}</span>
        <button class="act ${on ? "bad" : "ok"}" type="button"
          ${locked ? 'disabled title="Ch\u1EC9 admin h\u1EC7 th\u1ED1ng m\u1EDBi \u0111\u1ED5i \u0111\u01B0\u1EE3c"' : ""}
          onclick="setDiscordNotification('${esc(kind.key)}',${on ? "false" : "true"})">${on ? "T\u1EAFt" : "B\u1EADt"}</button>
      </div>
    </div>`;
    }
    function renderDiscordSettings() {
      if (!window.isSystemAdmin || !window.isSystemAdmin()) {
        if (typeof setPage === "function") setPage("overview", "T\u1ED5ng quan");
        return;
      }
      ensureDiscordPage();
      const box = $id("discordToggleList");
      if (!box) return;
      if (!isAdmin()) {
        box.innerHTML = '<p class="muted">Ch\u1EC9 admin h\u1EC7 th\u1ED1ng m\u1EDBi xem \u0111\u01B0\u1EE3c m\u1EE5c n\xE0y.</p>';
        return;
      }
      const note = $id("discordTierNote");
      if (note) {
        note.classList.add("hidden");
      }
      const kinds = TIER.kinds.length ? TIER.kinds : Object.keys(TIER.settings).map((k) => ({ key: k, label: k, description: "" }));
      box.innerHTML = kinds.length ? kinds.map(toggleRowHTML).join("") : '<p class="muted">Ch\u01B0a t\u1EA3i \u0111\u01B0\u1EE3c danh s\xE1ch lo\u1EA1i th\xF4ng b\xE1o. B\u1EA5m "T\u1EA3i l\u1EA1i" \u1EDF thanh tr\xEAn.</p>';
    }
    window.setDiscordNotification = async function(key2, enabled) {
      if (!TIER.isSystem) return alert("Ch\u1EC9 admin h\u1EC7 th\u1ED1ng m\u1EDBi \u0111\u01B0\u1EE3c \u0111\u1ED5i c\u1EA5u h\xECnh th\xF4ng b\xE1o Discord.");
      const next = { ...TIER.settings, [key2]: !!enabled };
      setBusy(true, "\u0110ang l\u01B0u...");
      try {
        const out = await adminAction("set_discord_notifications", { notifications: next });
        if (!out) return;
        TIER.settings = out.notifications && typeof out.notifications === "object" ? out.notifications : next;
        renderDiscordSettings();
        toast(enabled ? "\u0110\xE3 b\u1EADt th\xF4ng b\xE1o" : "\u0110\xE3 t\u1EAFt th\xF4ng b\xE1o");
      } finally {
        setBusy(false);
      }
    };
    window.renderDiscordSettings = renderDiscordSettings;
    window.__lhReadAdminTierFromDashboard = function(dash) {
      readDashboard(dash);
      renderAdminTierChip();
      if (TIER.isSystem) ensureDiscordPage();
      if (typeof window.hideDeniedMenus === "function") window.hideDeniedMenus();
      if (TIER.isSystem && $id("discordSettings")?.classList.contains("active")) renderDiscordSettings();
    };
    function ensureWhenAdmin() {
      if (typeof isAdmin === "function" && isAdmin()) {
        if (window.isSystemAdmin && window.isSystemAdmin()) {
          ensureDiscordPage();
        }
        renderAdminTierChip();
        if (typeof window.hideDeniedMenus === "function") window.hideDeniedMenus();
      }
    }
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(ensureWhenAdmin, 400);
      setTimeout(ensureWhenAdmin, 1500);
    });
    window.addEventListener("lh:admin-dashboard-loaded", ensureWhenAdmin);
    const DEFAULT_AI_PROMPT = `B\u1EA1n l\xE0 tr\u1EE3 l\xFD chuy\u1EC3n \u0111\u1ED5i ng\xE2n h\xE0ng c\xE2u h\u1ECFi tr\u1EAFc nghi\u1EC7m sang JSON trong file Markdown.

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
    window.adjustAdminAiPromptHeight = function() {
      const input = document.getElementById("adminAiPromptInput");
      if (!input) return;
      input.style.height = "auto";
      input.style.height = Math.max(260, input.scrollHeight + 12) + "px";
    };
    window.loadAddSubjectAiPrompt = async function() {
      const input = document.getElementById("adminAiPromptInput");
      const modalInput = document.getElementById("adminModalPromptInput");
      if (!input && !modalInput) return;
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const val = json && json.add_subject_ai_prompt ? json.add_subject_ai_prompt : DEFAULT_AI_PROMPT;
        if (input) input.value = val;
        if (modalInput) modalInput.value = val;
      } catch (e) {
        console.warn("[loadAddSubjectAiPrompt]", e);
        if (input && !input.value) input.value = DEFAULT_AI_PROMPT;
        if (modalInput && !modalInput.value) modalInput.value = DEFAULT_AI_PROMPT;
      } finally {
        setTimeout(window.adjustAdminAiPromptHeight, 50);
      }
    };
    window.saveAdminAiPrompt = async function() {
      const input = document.getElementById("adminAiPromptInput");
      const modalInput = document.getElementById("adminModalPromptInput");
      const promptText = (modalInput && modalInput.value.trim() || input && input.value.trim() || "").trim();
      if (!promptText) return alert("Prompt kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 r\u1ED7ng.");
      if (typeof setBusy === "function") setBusy(true, "\u0110ang l\u01B0u Prompt AI...");
      try {
        const out = await adminAction("set_add_subject_ai_prompt", { prompt: promptText });
        if (out && out.ok) {
          if (input) input.value = promptText;
          if (modalInput) modalInput.value = promptText;
          if (typeof toast === "function") toast("\u0110\xE3 l\u01B0u Prompt AI th\xE0nh c\xF4ng!");
          else alert("\u0110\xE3 l\u01B0u Prompt AI th\xE0nh c\xF4ng!");
          setTimeout(() => window.closeAdminPromptModal?.(), 600);
        } else {
          alert(out?.error || "Kh\xF4ng th\u1EC3 l\u01B0u Prompt AI.");
        }
      } catch (e) {
        alert("L\u1ED7i l\u01B0u Prompt AI: " + (e.message || e));
      } finally {
        if (typeof setBusy === "function") setBusy(false);
      }
    };
    window.resetAdminAiPrompt = function() {
      const input = document.getElementById("adminAiPromptInput");
      const modalInput = document.getElementById("adminModalPromptInput");
      if (input) {
        input.value = DEFAULT_AI_PROMPT;
        window.adjustAdminAiPromptHeight();
      }
      if (modalInput) modalInput.value = DEFAULT_AI_PROMPT;
    };
    window.copyAdminAiPrompt = function() {
      const input = document.getElementById("adminModalPromptInput") || document.getElementById("adminAiPromptInput");
      if (!input || !input.value.trim()) return alert("Kh\xF4ng c\xF3 n\u1ED9i dung prompt \u0111\u1EC3 sao ch\xE9p.");
      const text = input.value.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (typeof toast === "function") toast("\u0110\xE3 sao ch\xE9p Prompt AI!");
          else alert("\u0110\xE3 sao ch\xE9p Prompt AI!");
        }).catch(() => fallbackCopy(input));
      } else {
        fallbackCopy(input);
      }
    };
    window.openAdminPromptModal = function() {
      const modal = document.getElementById("adminPromptModal");
      const inlineInput = document.getElementById("adminAiPromptInput");
      const modalInput = document.getElementById("adminModalPromptInput");
      if (!modal) return;
      if (inlineInput && modalInput) {
        modalInput.value = inlineInput.value;
      } else if (modalInput && !modalInput.value.trim()) {
        modalInput.value = DEFAULT_AI_PROMPT;
        if (typeof window.loadAddSubjectAiPrompt === "function") window.loadAddSubjectAiPrompt();
      }
      modal.classList.remove("hidden");
    };
    window.closeAdminPromptModal = function() {
      const modal = document.getElementById("adminPromptModal");
      if (modal) modal.classList.add("hidden");
    };
    window.syncAdminModalPromptToInline = function() {
      const inlineInput = document.getElementById("adminAiPromptInput");
      const modalInput = document.getElementById("adminModalPromptInput");
      if (inlineInput && modalInput) {
        inlineInput.value = modalInput.value;
        window.adjustAdminAiPromptHeight();
      }
    };
    function fallbackCopy(input) {
      input.select();
      document.execCommand("copy");
      if (typeof toast === "function") toast("\u0110\xE3 sao ch\xE9p Prompt AI!");
      else alert("\u0110\xE3 sao ch\xE9p Prompt AI!");
    }
    window.togglePromptConfigPanel = function() {
      const body = document.getElementById("promptConfigBody");
      const btn = document.getElementById("promptToggleBtn");
      if (!body) return;
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "block" : "none";
      if (btn) btn.textContent = isHidden ? "\u25B2 Thu g\u1ECDn" : "\u25BC \u1EA8n/Hi\u1EC7n Prompt";
      if (isHidden) setTimeout(window.adjustAdminAiPromptHeight, 40);
    };
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        if (document.getElementById("adminAiPromptInput")) {
          window.loadAddSubjectAiPrompt();
        }
      }, 600);
    });
  })();

  // src/admin/main.js
  var mocking = installMock();
  if (!mocking) clearMockLeftovers();
  if (!mocking) initVersionChecker();
  window.renderUserRowSaaS = renderUserRowSaaS2;
  window.getUserTableHeadHTML = getUserTableHeadHTML2;
  window.uploadImageToCloudinaryHelper = uploadImageToCloudinary;
  window.calculateQuestionErrorRiskHelper = calculateQuestionErrorRisk;
})();
