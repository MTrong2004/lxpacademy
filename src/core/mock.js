/**
 * Chế độ ?mock=1 — chạy UI mà không cần đăng nhập, không cần DB.
 *
 * Vì sao cần: mọi thứ trong app đều nằm sau cổng auth Supabase + Turso, nên muốn
 * xem một sửa đổi UI có đúng hay không thì phải đăng nhập Google thật rồi bấm tay
 * từng bước. Với refactor (tách appCore theo tính năng) thì thước đo duy nhất là
 * "app vẫn chạy đúng" — không tự kiểm được thì mỗi vòng sửa phải chờ người xác nhận.
 *
 * Cách dùng:
 *   http://localhost:3000/?mock=1                 vai user thường
 *   http://localhost:3000/?mock=1&role=admin      vai admin (mở được dashboard)
 *   http://localhost:3000/?mock=1&role=editor     vai editor
 *   http://localhost:3000/?mock=1&pending=1       tài khoản chờ duyệt (403 PENDING_APPROVAL)
 *   http://localhost:3000/?mock=1&blocked=1       tài khoản bị khóa (403 BLOCKED)
 *   http://localhost:3000/?mock=1&fail=500        API trả 500 (kiểm thông báo "thử lại")
 *   http://localhost:3000/admin.html?mock=1&role=admin
 *
 * CHỈ chạy trên localhost. Trên tên miền thật thì `?mock=1` bị bỏ qua hoàn toàn —
 * không được để dữ liệu giả xuất hiện trên web thật.
 *
 * Ba việc module này làm, đều KHÔNG cần sửa appCore.js:
 *   1. Ghim `window.__LH_ACCESS_OK` thành `true` bằng accessor. Cổng gate chỉ được
 *      đọc ở appCore ~12253 và ~14141, cả hai đều so `=== false`, còn 6 chỗ ghi
 *      biến này trở thành no-op.
 *   2. Thay `window.HODSupabase` bằng bản giả cùng API công khai (appCore tạo nó ở
 *      dòng 1094; module này phải được import SAU './appCore.js' trong main.js).
 *   3. Bọc `fetch` để trả dữ liệu có sẵn cho `/api/*`. Bọc sau appCore nên lớp của
 *      module này ở ngoài cùng — request không bao giờ ra tới mạng.
 */
import { lhWarn } from './log.js';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

export function isMockMode() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('mock') !== '1') return false;
    if (!LOCAL_HOSTS.includes(location.hostname)) {
      console.warn('[MOCK] ?mock=1 chỉ hoạt động trên localhost — bỏ qua.');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function readOptions() {
  const p = new URLSearchParams(location.search);
  const role = ['admin', 'editor', 'user'].includes(p.get('role')) ? p.get('role') : 'user';
  return {
    role,
    pending: p.get('pending') === '1',
    blocked: p.get('blocked') === '1',
    fail: p.get('fail') || '', // '500' | '401' | '403' | ''
    subject: (p.get('subject') || 'MOCK1').toUpperCase(),
  };
}

const MOCK_USER = {
  id: 'mock-user-0000-0000',
  email: 'mock@localhost',
  user_metadata: { full_name: 'Người Dùng Mock', avatar_url: '' },
};

function mockProfile(opts) {
  return {
    id: MOCK_USER.id,
    user_id: MOCK_USER.id,
    email: MOCK_USER.email,
    full_name: 'Người Dùng Mock',
    avatar_url: '',
    role: opts.role,
    current_subject: opts.subject,
    approved: !opts.pending,
    blocked: opts.blocked,
    force_logout: false,
  };
}

/**
 * Các môn "chương" cùng mã gốc MOCK1 — để test được khối "Gộp thêm môn" của tab Kiểm tra.
 * `baseCode()` trong exam.js cắt theo [_-\s] nên MOCK1_C* mới cùng gốc với MOCK1;
 * MOCK2 khác gốc nên không bao giờ hiện trong khối gộp (đúng như dữ liệu thật).
 */
const MOCK_CHAPTERS = [
  ['MOCK1_C1', 'Chương 1', 34],
  ['MOCK1_C2', 'Chương 2', 12],
  ['MOCK1_C3', 'Chương 3', 8],
  ['MOCK1_C4', 'Chương 4 tên rất dài để kiểm tra tràn chữ', 20],
];

/** Khớp đúng cột mà api/controllers/subjects.js trả về. */
function mockSubjects() {
  const make = (id, code, name, count) => ({
    id,
    code,
    name,
    description: `Môn giả lập ${code} — dữ liệu không có thật`,
    cover: '',
    sort_order: id,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    question_count: count,
    questions_count: count,
    count,
  });
  return {
    data: [
      make(1, 'MOCK1', 'Môn Mock Một', 4),
      make(2, 'MOCK2', 'Môn Mock Hai', 2),
      ...MOCK_CHAPTERS.map(([code, name, count], i) => make(3 + i, code, name, count)),
    ],
  };
}

/** Khớp đúng cột mà api/controllers/questions.js trả về (options/images đã parse). */
function mockQuestions(subjectCode) {
  const code = (subjectCode || 'MOCK1').toUpperCase();
  const base = (num, question, options, answer, extra = {}) => ({
    id: `${code}-${num}`,
    subject_code: code,
    num,
    question,
    options,
    answer,
    answer_text: options[answer] || '',
    images: [],
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    has_image: false,
    error_risk: 'low',
    error_risk_reason: '',
    ...extra,
  });

  const all = {
    MOCK1: [
      base(1, 'Thủ đô của Việt Nam là gì?', { A: 'Hà Nội', B: 'Huế', C: 'Đà Nẵng', D: 'Cần Thơ' }, 'A'),
      base(2, '2 + 2 = ?', { A: '3', B: '4', C: '5', D: '22' }, 'B'),
      base(3, 'Câu này có đánh dấu rủi ro cao — dùng để kiểm hiển thị cảnh báo.', { A: 'Đúng', B: 'Sai' }, 'A', {
        error_risk: 'high',
        error_risk_reason: 'Câu giả lập để test giao diện cảnh báo',
      }),
      base(4, 'Câu dài để kiểm xuống dòng: ' + 'nội dung lặp lại nhiều lần. '.repeat(12), { A: 'A', B: 'B' }, 'B'),
    ],
    MOCK2: [
      base(1, 'Nước sôi ở bao nhiêu độ C (áp suất thường)?', { A: '90', B: '100', C: '110', D: '120' }, 'B'),
      base(2, 'HTML là viết tắt của gì?', { A: 'HyperText Markup Language', B: 'Hot Mail' }, 'A'),
    ],
  };
  const chapter = MOCK_CHAPTERS.find(([c]) => c === code);
  if (chapter) {
    const n = chapter[2];
    return {
      data: Array.from({ length: n }, (_, i) =>
        base(
          i + 1,
          `[${code}] Câu số ${i + 1} — câu giả lập của ${chapter[1]}.`,
          { A: 'Đúng', B: 'Sai' },
          i % 2 ? 'B' : 'A',
        ),
      ),
    };
  }
  return { data: all[code] || [] };
}

/** Khớp đúng hình dạng `data` mà api/controllers/admin.js trả về cho GET /api/admin-dashboard. */
function mockAdminDashboard(opts) {
  const subjects = mockSubjects().data;
  const questions = subjects.flatMap(s => mockQuestions(s.code).data);
  return {
    profiles: [
      mockProfile({ ...opts, role: 'admin' }),
      { ...mockProfile({ ...opts, role: 'user' }), id: 'mock-user-2', email: 'user2@localhost' },
    ],
    questions,
    requests: [],
    history: [],
    logs: [],
    subjects,
    subject_requests: [],
    deleted_questions: [],
    deleted_subjects: [],
  };
}

const SUBJECT_KEY = 'learninghub_subject_code_merged_v1';
const QCACHE_PREFIX = 'learninghub_questions_cache_v2_';

/**
 * Chọn sẵn môn giả để `?mock=1` là thấy câu hỏi ngay, không phải bấm chọn môn.
 * Cũng xóa cache câu hỏi của môn MOCK* (TTL 12 giờ) để luôn render dữ liệu mới nhất
 * khi mình vừa sửa danh sách câu mẫu ở trên.
 */
function seedMockSubject(opts) {
  try {
    localStorage.setItem(SUBJECT_KEY, opts.subject);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(QCACHE_PREFIX) && k.slice(QCACHE_PREFIX.length).startsWith('MOCK')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    lhWarn('MOCK:seedSubject', e);
  }
}

/**
 * Dọn dấu vết mock khi chạy bình thường. `learninghub_subject_code_merged_v1` là
 * khóa dùng chung với chế độ thật, nên nếu để nguyên "MOCK1" thì lần sau mở app
 * không có ?mock=1 sẽ đứng ở một môn không tồn tại. Gọi ở main.js khi không mock.
 */
export function clearMockLeftovers() {
  try {
    if ((localStorage.getItem(SUBJECT_KEY) || '').startsWith('MOCK')) {
      localStorage.removeItem(SUBJECT_KEY);
      console.warn('[MOCK] Đã xóa môn MOCK* còn sót trong localStorage.');
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(QCACHE_PREFIX) && k.slice(QCACHE_PREFIX.length).startsWith('MOCK')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    lhWarn('MOCK:cleanup', e);
  }
}

/**
 * Trang admin có cổng RIÊNG, không dùng `__LH_ACCESS_OK`: adminCore gọi
 * `show('app'|'login'|'deny')` (adminCore ~736) để bật tắt #appBox / #loginBox /
 * #denyBox. `show()` là hàm module-scope, không gán ra window, nên mock tự đặt
 * lại class y như show('app') làm.
 *
 * Dùng MutationObserver chứ không hẹn giờ: luồng auth của adminCore là async, không
 * biết chắc nó gọi show('login') ở thời điểm nào — quan sát thì đúng ở mọi thời điểm,
 * còn đặt setTimeout thì lại thành một lớp đua nữa (đúng thứ repo này đang khổ vì nó).
 */
function forceAdminAppVisible() {
  const apply = () => {
    document.getElementById('loginBox')?.classList.add('hidden');
    document.getElementById('denyBox')?.classList.add('hidden');
    document.getElementById('appBox')?.classList.remove('hidden');
  };

  const start = () => {
    if (!document.getElementById('appBox')) return; // không phải trang admin
    apply();
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        const id = m.target.id;
        if (id === 'loginBox' || id === 'denyBox') {
          if (!m.target.classList.contains('hidden')) apply();
        } else if (id === 'appBox' && m.target.classList.contains('hidden')) {
          apply();
        }
      }
    });
    for (const id of ['loginBox', 'denyBox', 'appBox']) {
      const el = document.getElementById(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    }
    window.__LH_MOCK_ADMIN_OBSERVER = obs;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}

/**
 * Trang admin KHÔNG dùng `window.HODSupabase`: `init()` (adminCore ~651) tự gọi
 * `supabase.createClient(...).auth.getSession()`. Không có phiên thật thì `user` là
 * undefined -> `show('login')`, `loadProfile()` không chạy, `profile` mãi null, nên
 * `isEditor()` false và mọi màn cần quyền (Quản lý môn học, Câu hỏi, Người dùng…) chỉ
 * bật ra alert "Admin hoặc Editor mới được…". Bọc `createClient` để trả về phiên giả.
 *
 * Chỉ đụng vào `.auth`: phần `.from()/.rpc()` giữ nguyên client thật vì adminCore đã
 * bọc nó bằng `createTursoClientMock` — mọi truy vấn đi qua `/api/*`, đã có lớp fetch giả.
 */
function fakeAdminAuthSession() {
  const sdk = window.supabase;
  if (!sdk || typeof sdk.createClient !== 'function' || sdk.__lhMockAuth) return;
  if (!document.getElementById('appBox')) return; // không phải trang admin
  const realCreate = sdk.createClient.bind(sdk);
  const session = { access_token: 'mock-token', token_type: 'bearer', user: MOCK_USER };
  sdk.createClient = function () {
    const c = realCreate.apply(null, arguments);
    try {
      c.auth.getSession = async () => ({ data: { session }, error: null });
      c.auth.getUser = async () => ({ data: { user: MOCK_USER }, error: null });
      c.auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } });
    } catch (e) {
      lhWarn('MOCK:adminAuth', e);
    }
    return c;
  };
  sdk.__lhMockAuth = true;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Bảng route giả — khớp danh sách route thật trong api/index.js.
 * @param {URLSearchParams} query  query của CHÍNH request, không phải của URL trang.
 */
function mockApiResponse(pathname, query, opts) {
  // Mô phỏng đúng ba loại mã lỗi có ý nghĩa cố định (xem CLAUDE.md).
  if (opts.fail === '500') {
    return jsonResponse({ error: 'Lỗi giả lập', code: 'INTERNAL_ERROR' }, 500);
  }
  if (opts.fail === '401') {
    return jsonResponse({ error: 'Phiên đăng nhập không hợp lệ', code: 'UNAUTHORIZED' }, 401);
  }
  if (opts.blocked) {
    return jsonResponse({ error: 'Tài khoản đã bị khóa', code: 'BLOCKED' }, 403);
  }
  if (opts.pending) {
    return jsonResponse({ error: 'Tài khoản chưa được phê duyệt', code: 'PENDING_APPROVAL' }, 403);
  }

  const route = pathname.replace(/^\/api\/?/, '').split('/')[0];

  switch (route) {
    case 'subjects':
      return jsonResponse(mockSubjects());
    case 'questions': {
      // Phải lấy subject_code của REQUEST. Lấy từ location.search thì đổi môn sang
      // MOCK2 vẫn trả câu của MOCK1 — trông y như bug "đổi môn mà thư viện không đổi".
      const subject = query.get('subject_code') || opts.subject;
      return jsonResponse(mockQuestions(subject));
    }
    case 'profile':
      return jsonResponse({ data: mockProfile(opts) });
    case 'settings':
      return jsonResponse({ data: { maintenance: false, announcement: '' } });
    case 'my-edit-requests':
    case 'edit-requests':
    case 'staff-edit-requests':
      return jsonResponse({ data: [] });
    case 'admin-dashboard':
      // Đúng hình dạng của api/controllers/admin.js: các khóa nằm ở TẦNG TRÊN CÙNG,
      // không bọc trong `data`. `window.__fetchAdminDashboardJSON` đọc thẳng `JSON.parse(text)`,
      // nên bọc thêm một lớp là `cache.subjects` rỗng và mọi trang admin trắng trơn.
      return jsonResponse(mockAdminDashboard(opts));
    case 'notify':
      return jsonResponse({ ok: true });
    case 'admin-action':
      // Không ghi gì cả — chỉ báo thành công để UI đi hết luồng.
      return jsonResponse({ ok: true, data: null, mock: true });
    default:
      return jsonResponse({ error: `Route giả lập chưa hỗ trợ: ${route}`, code: 'NOT_FOUND' }, 404);
  }
}

function fakeSupabase(opts) {
  const profile = mockProfile(opts);
  const noop = () => {};
  return {
    init: async () => profile,
    isReady: () => true,
    isAdmin: () => opts.role === 'admin',
    canOpenDashboard: () => ['admin', 'editor'].includes(opts.role),
    submitEditRequest: async () => ({ ok: true, mock: true }),
    loadQuestionsFromSupabase: async () => mockQuestions(opts.subject).data,
    openAuth: noop,
    openAdmin: () => {
      if (['admin', 'editor'].includes(opts.role)) location.href = 'admin.html?mock=1&role=' + opts.role;
      else alert('[MOCK] Vai hiện tại không mở được dashboard. Thử ?mock=1&role=admin');
    },
    signOut: async () => {
      alert('[MOCK] signOut không làm gì trong chế độ mock.');
    },
    signInGoogle: async () => {
      alert('[MOCK] Đã đăng nhập sẵn dưới vai "' + opts.role + '".');
    },
    getUser: () => MOCK_USER,
    getProfile: () => profile,
    getSession: () => ({ access_token: 'mock-token' }),
    __client: null,
    __mock: true,
  };
}

/*
  Lớp fetch giả — cài NGAY khi module được import, không đợi installMock().

  Vì sao phải là side effect lúc import: appCore cũng bọc fetch (~14141) để xử lý
  401/403 (gọi handleAccessRevoked -> hiện đúng màn "Tài khoản bị khóa" / "Chờ phê
  duyệt"). Muốn mock kiểm được luồng đó thì lớp giả phải nằm BÊN TRONG lớp của
  appCore, tức phải được cài TRƯỚC nó. Thân module chạy theo thứ tự câu `import`,
  nên main.js phải `import '../core/mock.js'` ở trên `import './appCore.js'`.
  Đặt ngoài thì response giả không bao giờ đi qua interceptor và mọi mã lỗi bị bỏ qua.
*/
let networkInstalled = false;

function installMockNetwork() {
  if (networkInstalled) return;
  networkInstalled = true;
  const opts = readOptions();
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    let pathname = '';
    let query = new URLSearchParams();
    try {
      const u = new URL(typeof input === 'string' ? input : input.url, location.origin);
      pathname = u.pathname;
      query = u.searchParams;
    } catch (e) {
      lhWarn('MOCK:url', e);
    }
    if (!pathname.startsWith('/api')) return realFetch(input, init);

    const method = (init?.method || 'GET').toUpperCase();
    const label = query.get('subject_code') ? ` (${query.get('subject_code')})` : '';
    console.log(`[MOCK] ${method} ${pathname}${label} -> dữ liệu giả`);
    return mockApiResponse(pathname, query, opts);
  };
}

if (isMockMode()) installMockNetwork();

/**
 * Cài phần còn lại của chế độ mock (auth, cổng gate, chọn môn, cổng trang admin).
 * Gọi một lần, SAU khi appCore.js đã chạy — appCore gán window.HODSupabase ở dòng
 * ~1094 nên gọi trước thì bị nó ghi đè. Không làm gì nếu không ở chế độ mock.
 */
export function installMock() {
  if (!isMockMode()) return false;
  const opts = readOptions();
  seedMockSubject(opts);
  fakeAdminAuthSession(); // phải chạy TRƯỚC DOMContentLoaded vì adminCore gọi init() ở đó
  forceAdminAppVisible(); // tự bỏ qua nếu không phải admin.html

  // 1. Ghim cổng gate mở. 6 chỗ ghi `__LH_ACCESS_OK = false` trong appCore thành no-op.
  try {
    Object.defineProperty(window, '__LH_ACCESS_OK', {
      get: () => true,
      set: () => {},
      configurable: true,
    });
  } catch (e) {
    lhWarn('MOCK:gate', e);
    window.__LH_ACCESS_OK = true;
  }

  // 2. Thay lớp auth. Phải chạy sau appCore vì appCore gán window.HODSupabase ở dòng 1094.
  try {
    window.HODSupabase = fakeSupabase(opts);
  } catch (e) {
    lhWarn('MOCK:supabase', e);
  }

  window.__LH_MOCK = { ...opts, subjects: mockSubjects().data.map(s => s.code) };

  // appCore đọc mã môn trong luồng khởi động của nó, có thể trước khi module này
  // chạy. Gọi setSubject() một lần sau khi DOM sẵn sàng để nó bắn lh:subject-changed
  // và vẽ lại — một lần duy nhất, không hẹn lại nhiều lớp.
  const applySubject = () => {
    try {
      if (typeof window.setSubject === 'function') window.setSubject(opts.subject);
      else if (typeof window.setSubjectHelper === 'function') window.setSubjectHelper(opts.subject);
    } catch (e) {
      lhWarn('MOCK:setSubject', e);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(applySubject, 0));
  } else {
    setTimeout(applySubject, 0);
  }

  console.log(
    `%c[MOCK] Đang chạy dữ liệu GIẢ — không có DB, không có đăng nhập.\n` +
      `vai=${opts.role} approved=${!opts.pending} blocked=${opts.blocked}` +
      (opts.fail ? ` fail=${opts.fail}` : '') +
      `\nMôn: MOCK1 (4 câu), MOCK2 (2 câu). Tắt bằng cách bỏ ?mock=1 khỏi URL.`,
    'background:#7c2d12;color:#fff;padding:2px 6px;border-radius:3px',
  );
  return true;
}
