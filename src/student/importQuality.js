/**
 * IMPORT_QUALITY_GATE_20260805 — chấm "độ sai lệch dữ liệu" của file import câu hỏi.
 *
 * Cổng này chia luồng "Thêm môn" thành HAI HƯỚNG ĐI:
 *   · sai lệch THẤP   -> chấp nhận file, cho lưu môn ngay (khỏi cần prompt AI)
 *   · sai lệch CAO    -> chặn, đẩy người dùng sang hướng prompt (nhờ AI chuyển lại)
 *   · ở giữa          -> cho lưu nhưng phải tự tick xác nhận đã xem danh sách câu nghi lỗi
 *
 * `analyzeImport()` và `parseImportNum()` KHÔNG chạm DOM nên test được bằng node
 * (giống `api/lib/folderBadges.js`):
 *   node -e "import('./src/student/importQuality.js').then(m => console.log(m.analyzeImport([...])))"
 *
 * Chuẩn đối chiếu là prompt chuyển đổi câu hỏi (`src/student/importPrompt.js`): num câu gốc là số
 * nguyên liên tục từ 1, biến thể "Kiểu hỏi khác" là string "X.1"/"X.2" đứng NGAY SAU câu gốc,
 * answer là array nhãn, error_risk ∈ low|medium|high, has_image=false thì images phải rỗng.
 */

// Ngưỡng phần trăm sai lệch. Không phải số chọn bừa: 1 câu error_risk="high" hoặc mất ảnh
// tính 1 điểm, nên 5% ≈ "1 câu hỏng trên 20 câu" — mức mà sửa tay tại chỗ vẫn nhanh hơn
// chạy lại prompt. Quá 15% (≈ 3 câu hỏng / 20) thì chạy lại prompt rẻ hơn sửa tay.
export const QUALITY_THRESHOLDS = { low: 5, medium: 15 };

// Điểm trừ theo mức nặng. FATAL không tính điểm — có một câu fatal là chặn thẳng.
const W = { major: 1, mid: 0.5, minor: 0.25 };

const ISSUE_META = {
  // ── chặn cứng ────────────────────────────────────────────────────────────
  no_question: { sev: 'fatal', label: 'Thiếu nội dung câu hỏi', hint: 'Trường "question" rỗng.' },
  few_options: { sev: 'fatal', label: 'Dưới 2 lựa chọn', hint: 'Câu trắc nghiệm phải có ít nhất 2 lựa chọn.' },
  empty_option: { sev: 'fatal', label: 'Lựa chọn rỗng', hint: 'Có nhãn lựa chọn nhưng không có nội dung.' },
  answer_unknown: {
    sev: 'fatal',
    label: 'Đáp án trỏ tới nhãn không tồn tại',
    hint: 'Ví dụ answer là "D" nhưng câu chỉ có A, B, C.',
  },
  // ── nặng (1 điểm) ────────────────────────────────────────────────────────
  risk_high: { sev: 'major', label: 'AI tự đánh error_risk = high', hint: 'Chính AI báo câu này dễ sai.' },
  image_missing: {
    sev: 'major',
    label: 'Cần ảnh nhưng không có ảnh',
    hint: 'has_image = true mà "images" rỗng — câu này thiếu dữ liệu để trả lời.',
  },
  image_broken: {
    sev: 'major',
    label: 'Ảnh tham chiếu không tồn tại',
    hint: 'Đường dẫn trong "images" là đường dẫn tương đối (images/…) nhưng không có ảnh kèm theo — hãy nén JSON + thư mục ảnh thành .zip rồi tải lên.',
  },
  options_gap: {
    sev: 'major',
    label: 'Nhãn lựa chọn bị nhảy',
    hint: 'Ví dụ có A, B, D mà thiếu C — dấu hiệu trích xuất bị rơi mất một lựa chọn.',
  },
  // ── vừa (0,5 điểm) ───────────────────────────────────────────────────────
  no_answer: { sev: 'mid', label: 'Không có đáp án', hint: '"answer" rỗng — người học sẽ không biết đáp án đúng.' },
  num_problem: { sev: 'mid', label: 'Số câu sai quy tắc', hint: 'Xem khối "Đánh số câu" bên dưới.' },
  num_in_question: {
    sev: 'mid',
    label: 'Nhãn số câu lọt vào nội dung',
    hint: 'Nội dung còn dính "Câu 12." / "Question 12." ở đầu.',
  },
  duplicate: { sev: 'mid', label: 'Trùng nội dung với câu khác', hint: 'Hai câu có phần đề bài giống nhau.' },
  // ── nhẹ (0,25 điểm) ──────────────────────────────────────────────────────
  risk_medium: { sev: 'minor', label: 'AI đánh error_risk = medium', hint: 'AI báo có yếu tố chưa chắc chắn.' },
  multi_answer: { sev: 'minor', label: 'Nhiều đáp án đúng', hint: 'Cần xem lại tài liệu gốc có đúng là nhiều đáp án.' },
  label_beyond_d: { sev: 'minor', label: 'Lựa chọn ngoài A–D', hint: 'Câu có E, F… hoặc nhãn Đúng/Sai được đổi tên.' },
  maybe_truncated: {
    sev: 'minor',
    label: 'Nghi bị rút gọn bằng "..."',
    hint: 'Nội dung kết thúc bằng "..." — có thể AI cắt bớt.',
  },
};

const SEV_WEIGHT = { fatal: 0, major: W.major, mid: W.mid, minor: W.minor };

/** Nhãn hiển thị của một mức nặng. */
export function severityLabel(sev) {
  return { fatal: 'Chặn', major: 'Nặng', mid: 'Vừa', minor: 'Nhẹ' }[sev] || sev;
}

/**
 * Đọc `num` theo đúng quy tắc của prompt.
 * - `1`, `"1"`, `" 12 "` -> câu gốc  { kind:'main', value:12 }
 * - `"1.1"`, `1.2`       -> biến thể { kind:'variant', value:'1.1', parent:1, seq:1 }
 * - thiếu / rác          -> { kind:'invalid', value:null }
 *
 * Trả về `value` là NUMBER cho câu gốc và STRING cho biến thể — giữ nguyên hình dạng
 * của file để "1.1" không bị làm tròn thành 1 rồi trùng với câu gốc.
 */
export function parseImportNum(raw) {
  if (raw === null || raw === undefined) return { kind: 'invalid', value: null, parent: null, seq: null };
  const s = String(raw).trim();
  if (!s) return { kind: 'invalid', value: null, parent: null, seq: null };

  let m = s.match(/^(\d+)$/);
  if (m) return { kind: 'main', value: Number(m[1]), parent: Number(m[1]), seq: 0 };

  m = s.match(/^(\d+)[.\-](\d+)$/);
  if (m) {
    const parent = Number(m[1]);
    const seq = Number(m[2]);
    if (seq < 1) return { kind: 'invalid', value: null, parent: null, seq: null };
    return { kind: 'variant', value: parent + '.' + seq, parent, seq };
  }
  return { kind: 'invalid', value: null, parent: null, seq: null };
}

/**
 * Chuẩn hoá `answer` về chuỗi nhãn liền nhau ("B", "AC") — đúng dạng phần còn lại của app
 * đang đọc (`String(q.answer).toUpperCase().replace(/[^A-Z]/g,'')`).
 * Nhận cả array `["A","C"]` của prompt, cả string "A, C" / "A/C" / "AC" của bản cũ.
 * Bỏ nhãn không có trong `options`, giữ thứ tự xuất hiện, khử trùng.
 */
export function normalizeAnswer(raw, options) {
  const src = Array.isArray(raw) ? raw.join('') : String(raw ?? '');
  const letters = src.toUpperCase().replace(/[^A-Z]/g, '');
  const seen = new Set();
  const out = [];
  const unknown = [];
  for (const ch of letters) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    if (!options || Object.prototype.hasOwnProperty.call(options, ch)) out.push(ch);
    else unknown.push(ch);
  }
  return { answer: out.join(''), labels: out, unknown };
}

/** "A. nội dung A · C. nội dung C" cho cột đáp án. */
export function buildAnswerText(labels, options) {
  return (labels || [])
    .filter(l => options && options[l])
    .map(l => l + '. ' + options[l])
    .join(' · ');
}

/**
 * Một tham chiếu ảnh có dùng được không.
 * URL thật (http/data/blob) thì dùng được ngay. Đường dẫn tương đối kiểu "images/question_003_01.png"
 * chỉ dùng được khi file .zip có kèm đúng ảnh đó — tải riêng file .json là ảnh chắc chắn 404.
 */
function usableImageRef(p, zipPaths) {
  if (!p) return false;
  if (/^(https?:|data:|blob:)/i.test(p)) return true;
  if (!zipPaths) return false;
  const base = p.split('/').pop();
  return zipPaths.has(p) || zipPaths.has(p.replace(/^\/+/, '')) || zipPaths.has(base);
}

/**
 * Dấu CHỖ TRỐNG cần điền, không phải dấu bị cắt: "........", "___", "……".
 * IMPORT_BLANK_NOT_TRUNCATED_20260805: câu điền khuyết ("must be ........") rất phổ biến trong
 * đề trắc nghiệm; luật cũ chỉ xét "kết thúc bằng ..." nên chấm nhầm 46/548 câu của một file thật.
 */
const BLANK_MARK = /\.{4,}|_{3,}|…{2,}/;

/** Nghi bị AI cắt bớt: kết thúc bằng ĐÚNG "..." / "…" và không có dấu chỗ trống nào. */
function looksTruncated(t) {
  const s = String(t || '').trim();
  if (s.length <= 40) return false;
  if (!/(\.\.\.|…)\s*$/.test(s)) return false;
  return !BLANK_MARK.test(s);
}

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** `num` để trống (không phải rác) — file Quizlet / DOCX xuất ra thường không có trường này. */
function isBlankNum(raw) {
  return raw === null || raw === undefined || String(raw).trim() === '';
}

/**
 * Kiểm tra khối đánh số câu cho CẢ danh sách.
 * Quy tắc (theo prompt): câu gốc là số nguyên liên tục 1,2,3…; biến thể "X.1" phải có câu gốc X
 * và phải đứng ngay sau câu gốc đó (hoặc sau biến thể khác của cùng câu gốc).
 *
 * IMPORT_NUM_BLANK_OK_20260805: **để TRỐNG `num` KHÔNG phải lỗi.** Trước đây câu không có `num`
 * bị tính là "số câu không đọc được", nên mọi file xuất từ Quizlet / DOCX (không hề có trường
 * `num`) bị trừ 0,5 điểm cho TỪNG câu → sàn sai lệch 50% → tier 'high' → nút Lưu bị chặn với
 * 100% file thật. Trong khi cả hai chốt lưu đều tự đánh số được: `cleanQuestions` lấy `i + 1` và
 * `api/lib/questionNums.js: resolveImportNums()` lấy số nguyên trống nhỏ nhất. Chỉ `num` RÁC
 * ("abc", "1.0") mới là lỗi thật. Câu để trống vẫn chiếm một slot số nguyên nên `expected` phải
 * nhích lên, nếu không thì file kiểu `1, (trống), 3` bị báo sai "đang chờ câu 2".
 *
 * Trả về { mainCount, variantCount, blankCount, ok, problems:[{index,num,msg}] }
 */
export function checkNumbering(questions) {
  const problems = [];
  const mains = [];
  const seen = new Set();
  let variantCount = 0;
  let blankCount = 0;
  let lastMain = null;

  questions.forEach((q, i) => {
    const info = parseImportNum(q?.num);
    const shown = isBlankNum(q?.num) ? '(trống)' : String(q.num);

    if (isBlankNum(q?.num)) {
      blankCount++;
      lastMain = null;
      return;
    }

    if (info.kind === 'invalid') {
      problems.push({ index: i, num: shown, msg: 'Số câu không đọc được — phải là số nguyên hoặc dạng "X.1".' });
      return;
    }

    const key = String(info.value);
    if (seen.has(key)) {
      problems.push({ index: i, num: shown, msg: 'Số câu bị trùng với một câu phía trên.' });
      return;
    }
    seen.add(key);

    if (info.kind === 'main') {
      // Mốc tính theo SỐ CÂU GỐC ĐÃ ĐI QUA, không phải theo num vừa đọc: một câu bị đánh 99 mà lấy
      // mốc = 100 thì mọi câu phía sau đều bị báo sai theo ("đang chờ câu 100"), người dùng thấy
      // 10 lỗi trong khi chỉ có 1 chỗ sai thật.
      //
      // Mốc là một KHOẢNG chứ không phải một số, vì câu để trống num có thể là hai chuyện khác
      // nhau: (a) cả file không có num — hệ thống tự đánh, mọi câu trống chiếm một slot; (b) một
      // mảnh vụn do parser tách sai lẫn vào file CÓ num — mảnh đó không chiếm slot nào. Chấp nhận
      // cả hai đầu khoảng để không phải đoán: `AET102c.pdf` có đúng 1 mảnh vụn ở giữa, lấy mốc
      // cứng = mains + blank + 1 thì **144 câu sau đó đều bị báo sai theo**, lấy mốc cứng =
      // mains + 1 thì file `1, (trống), 3` bị báo oan.
      const lo = mains.length + 1;
      const hi = mains.length + blankCount + 1;
      mains.push(info.value);
      if (info.value < lo || info.value > hi) {
        problems.push({
          index: i,
          num: shown,
          msg: 'Số câu gốc không liên tục — đang chờ câu ' + lo + '.',
        });
      }
      lastMain = info.value;
    } else {
      variantCount++;
      if (lastMain !== info.parent) {
        problems.push({
          index: i,
          num: shown,
          msg: 'Biến thể "' + info.value + '" không nằm ngay sau câu gốc ' + info.parent + '.',
        });
      }
    }
  });

  return { mainCount: mains.length, variantCount, blankCount, ok: problems.length === 0, problems };
}

/**
 * Chấm điểm cả file.
 *
 * @param {Array} questions danh sách câu hỏi đã parse (dạng của app: options là object,
 *        images là array string hoặc object {src,url})
 * @param {{zipImagePaths?:Set<string>}} [opts] khi import .zip: tập đường dẫn ảnh có thật
 *        trong file, để bắt trường hợp JSON trỏ tới ảnh không tồn tại.
 * @returns report — xem khối JSDoc dưới.
 */
export function analyzeImport(questions, opts = {}) {
  const list = Array.isArray(questions) ? questions : [];
  const total = list.length;

  /** @type {Array<{index:number,num:string,codes:string[]}>} */
  const rows = [];
  const counts = {};
  let points = 0;
  let fatalCount = 0;

  if (!total) {
    return {
      total: 0,
      points: 0,
      deviationPct: 100,
      tier: 'high',
      fatalCount: 1,
      counts: { no_question: 1 },
      groups: [{ code: 'no_question', ...ISSUE_META.no_question, count: 1, nums: [] }],
      rows: [],
      numbering: { mainCount: 0, variantCount: 0, blankCount: 0, ok: false, problems: [] },
      verdict: {
        cls: 'bad',
        icon: '✕',
        title: 'File không có câu hỏi nào',
        sub: 'Kiểm tra lại file: JSON phải là một mảng câu hỏi [...] hoặc { "questions": [...] }.',
      },
    };
  }

  const numbering = checkNumbering(list);
  const numProblemIdx = new Set(numbering.problems.map(p => p.index));

  // Bắt trùng đề bài: chỉ so 120 ký tự đầu để câu dài mà khác phần đuôi vẫn tính là khác nhau.
  const textSeen = new Map();
  list.forEach((q, i) => {
    const key = normText(q?.question).slice(0, 120);
    if (!key) return;
    if (!textSeen.has(key)) textSeen.set(key, []);
    textSeen.get(key).push(i);
  });
  const dupIdx = new Set();
  textSeen.forEach(idxs => {
    if (idxs.length > 1) idxs.forEach(i => dupIdx.add(i));
  });

  const zipPaths = opts.zipImagePaths || null;

  list.forEach((q, i) => {
    const codes = [];
    const question = String(q?.question || '').trim();
    const options = q?.options && typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : {};
    const labels = Object.keys(options).map(k => String(k).trim().toUpperCase());
    const images = Array.isArray(q?.images) ? q.images : [];
    const risk = String(q?.error_risk || '').toLowerCase();

    if (!question) codes.push('no_question');
    if (labels.length < 2) codes.push('few_options');
    if (labels.some(k => !String(options[k] ?? '').trim())) codes.push('empty_option');

    // `answer_unknown` phải đọc được cả sau khi chuẩn hoá: normalizeAnswer LOẠI nhãn không có
    // trong options, nên nếu chỉ chấm trên dữ liệu đã chuẩn hoá thì câu 'answer: ["E"]' với options
    // A–D trông y như câu "quên đáp án" (0,5 điểm) thay vì lỗi chặn cứng. Hai bộ chuẩn hoá
    // (nhánh .zip và nhánh .json) đều ghi lại phần bị loại vào `answer_unknown`.
    const ans = normalizeAnswer(q?.answer, options);
    const droppedLabels = String(q?.answer_unknown || '');
    if (ans.unknown.length || droppedLabels) codes.push('answer_unknown');
    else if (!ans.labels.length) codes.push('no_answer');
    else if (ans.labels.length > 1) codes.push('multi_answer');

    // Nhãn phải là A, B, C… liên tục. Thiếu ở giữa = rơi mất một lựa chọn khi trích xuất.
    const sorted = [...labels].sort();
    const gap = sorted.some((k, idx) => k !== String.fromCharCode(65 + idx));
    if (labels.length >= 2 && gap) codes.push('options_gap');
    if (labels.some(k => k > 'D')) codes.push('label_beyond_d');

    const wantImage = !!q?.has_image;
    if (wantImage && !images.length) codes.push('image_missing');
    if (images.length) {
      const broken = images.some(im => {
        // Ảnh đã giải nén từ .zip thì có sẵn blob/zipPath — coi như dùng được.
        if (im && typeof im === 'object') {
          if (im.blob || im.zipPath) return false;
          return !usableImageRef(String(im.src || im.url || '').trim(), zipPaths);
        }
        return !usableImageRef(typeof im === 'string' ? im.trim() : '', zipPaths);
      });
      if (broken) codes.push('image_broken');
    }

    if (risk === 'high') codes.push('risk_high');
    else if (risk === 'medium') codes.push('risk_medium');

    if (/^\s*(câu|cau|question|q)\s*\d+\s*[.:)\-]/i.test(question)) codes.push('num_in_question');
    if (numProblemIdx.has(i)) codes.push('num_problem');
    if (dupIdx.has(i)) codes.push('duplicate');

    const tail = [question, ...labels.map(k => String(options[k] ?? ''))];
    if (tail.some(looksTruncated)) codes.push('maybe_truncated');

    if (!codes.length) return;

    let hasFatal = false;
    codes.forEach(c => {
      const meta = ISSUE_META[c];
      if (!meta) return;
      counts[c] = (counts[c] || 0) + 1;
      if (meta.sev === 'fatal') hasFatal = true;
      else points += SEV_WEIGHT[meta.sev];
    });
    if (hasFatal) fatalCount++;

    rows.push({
      index: i,
      num: q?.num === null || q?.num === undefined || q?.num === '' ? '#' + (i + 1) : String(q.num),
      codes,
      severity: hasFatal ? 'fatal' : codes.some(c => ISSUE_META[c]?.sev === 'major') ? 'major' : 'minor',
    });
  });

  const deviationPct = Math.round((points / total) * 1000) / 10;
  const tier = fatalCount
    ? 'high'
    : deviationPct <= QUALITY_THRESHOLDS.low
      ? 'low'
      : deviationPct <= QUALITY_THRESHOLDS.medium
        ? 'medium'
        : 'high';

  const groups = Object.keys(counts)
    .map(code => ({
      code,
      ...ISSUE_META[code],
      count: counts[code],
      nums: rows
        .filter(r => r.codes.includes(code))
        .slice(0, 40)
        .map(r => r.num),
    }))
    .sort((a, b) => {
      const order = { fatal: 0, major: 1, mid: 2, minor: 3 };
      return order[a.sev] - order[b.sev] || b.count - a.count;
    });

  // Câu nặng nhất lên đầu để người dùng sửa từ trên xuống.
  const sevOrder = { fatal: 0, major: 1, minor: 2 };
  rows.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.index - b.index);

  return {
    total,
    points: Math.round(points * 100) / 100,
    deviationPct,
    tier,
    fatalCount,
    counts,
    groups,
    rows,
    numbering,
    verdict: verdictOf(tier, deviationPct, fatalCount),
  };
}

function verdictOf(tier, pct, fatalCount) {
  if (tier === 'low') {
    return {
      cls: 'ok',
      icon: '✓',
      title: 'Sai lệch rất thấp — chấp nhận file này',
      sub: 'Dữ liệu đủ sạch để lưu thẳng. Không cần chạy lại prompt.',
    };
  }
  if (tier === 'medium') {
    return {
      cls: 'warn',
      icon: '!',
      title: 'Sai lệch ' + pct + '% — cần bạn xem lại trước khi lưu',
      sub: 'Vẫn lưu được, nhưng hãy xem danh sách câu nghi lỗi rồi tự xác nhận.',
    };
  }
  return {
    cls: 'bad',
    icon: '✕',
    title: fatalCount
      ? 'Có ' + fatalCount + ' câu thiếu dữ liệu bắt buộc — không lưu được'
      : 'Sai lệch ' + pct + '% — quá cao để chấp nhận',
    sub: 'Hãy đi theo hướng prompt: nhờ AI chuyển lại tài liệu gốc rồi tải file mới lên.',
  };
}
