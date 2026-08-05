/**
 * DOC_EXTRACT_DIRECT_20260805 — đọc PDF "chuẩn" / file Word rồi tách thành câu hỏi,
 * KHÔNG qua AI. Đây là ruột của hướng đi bên trái ở bước 2 tab "Thêm môn mới".
 *
 * Chia làm hai tầng, cố ý:
 *   1. `parseQuestionsFromPages()` + các hàm dưới nó là HÀM THUẦN (không chạm DOM, không fetch),
 *      nhận vào mảng text theo TỪNG TRANG. Test bằng node như `importQuality.js`:
 *        node -e "import('./src/student/docExtract.js').then(m => console.log(m.parseQuestionsFromPages([...])))"
 *   2. `extractFromFile()` mới là tầng I/O: nạp pdf.js (lazy, từ CDN) hoặc giải nén .docx bằng JSZip.
 *
 * Vì sao nhận text theo TRANG chứ không phải một chuỗi: header/footer của PDF lặp lại y nguyên ở
 * mọi trang ("1 / 40", "Thẻ ghi nhớ: … | Quizlet", URL, đồng hồ "11:03 7/7/26"). Có ranh giới trang
 * thì phát hiện dòng lặp là việc đếm đơn giản; nối hết thành một chuỗi rồi là mất dấu.
 *
 * Ba layout thật đã đo (thư mục `input/`), parser phải chịu được cả ba:
 *   A. Quizlet export có số câu — dòng "12." đứng riêng · "A. …" · dòng đáp án trơ "C" hoặc "A D"
 *   B. Quizlet flashcard  — KHÔNG có số câu · nhãn có thể viết thường "a. …" · dòng đáp án có thể
 *      là "c. Integrity right (giải thích)" tức nhãn LẶP LẠI kèm nội dung
 *   C. DOCX             — mỗi đoạn một dòng · "A . " có khoảng trắng lạ · một số câu KHÔNG có đáp án
 */

/** Nhãn lựa chọn hợp lệ. Quá F thì gần như chắc chắn là chữ đầu câu bị đọc nhầm thành nhãn. */
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Ngưỡng "PDF không chuẩn": dưới mức này coi như bản scan, phải đi hướng AI. */
export const SCAN_CHARS_PER_PAGE = 80;

/** Rác của trang: số trang, URL, đồng hồ, và phần chrome của Quizlet. */
const JUNK_PATTERNS = [
  /^\d+\s*\/\s*\d+$/, // "1 / 40", "2/103"
  /^(https?:\/\/|www\.)\S+$/i,
  /^\d{1,2}:\d{2}\s+\d{1,2}\/\d{1,2}\/\d{2,4}$/, // "11:03 7/7/26"
  /^\d(?:[.,]\d)?\s*\(\d+\s*(?:đánh giá|reviews?|ratings?)\)$/i, // "5.0 (285 đánh giá)"
  /^(?:Thuật ngữ trong học phần này|Terms in this set)\s*\(\d+\)$/i,
  /^(?:Lưu|Thêm vào lịch|Save|Add to folder|Study|Học)$/i,
  /trực tuyến tại\s+https?:/i, // chữ "Học" trong PDF này bị mã hoá lỗi, đừng neo vào nó
  /^Thẻ ghi nhớ:\s/i,
];

function isJunkLine(line) {
  const s = line.trim();
  if (!s) return true;
  return JUNK_PATTERNS.some(re => re.test(s));
}

/**
 * Dọn một dòng thô. Bỏ ký tự ĐIỀU KHIỂN vì PDF nhúng font lỗi trả về những chuỗi kiểu
 * "Ho\u0003c trực tuyến tại" (đo trên `AET102.pdf`) — để nguyên thì mọi phép so khớp đều lệch,
 * kể cả luật bỏ rác. Gom cả khoảng trắng vì pdf.js trả text theo từng mảnh nhỏ.
 */
function normLine(s) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dòng lặp lại ở nhiều trang = header/footer, bỏ.
 * Ngưỡng 40% số trang: tiêu đề môn in ở mọi trang thì chắc chắn vượt, còn một câu hỏi trùng nội
 * dung với câu khác (chuyện có thật, `analyzeImport` gọi là `duplicate`) thì không thể vượt.
 *
 * BẪY ĐÃ SẬP MỘT LẦN: dòng ĐÁP ÁN của layout A/B là một chữ cái trơ ("C"), và nó lặp ở gần như
 * MỌI trang nên bị luật này tính là footer. Hậu quả đo được: AET102 mất đáp án 150/152 câu, và
 * IPR102 (không có số câu) tụt từ 548 xuống 68 câu — mất dòng đáp án là mất luôn dấu hiệu "hết
 * câu này", nên đề câu sau bị nối vào lựa chọn cuối của câu trước. Vì vậy dòng trông như đáp án
 * hoặc như lựa chọn thì KHÔNG BAO GIỜ bị coi là footer.
 */
function repeatedLines(pages) {
  const empty = { keys: new Set(), raw: new Set() };
  if (pages.length < 3) return empty;
  const count = new Map();
  const sample = new Map();
  pages.forEach(p => {
    const seen = new Set(
      String(p || '')
        .split(/\r?\n/)
        .map(normLine)
        .filter(Boolean),
    );
    seen.forEach(l => {
      const k = footerKey(l);
      count.set(k, (count.get(k) || 0) + 1);
      if (!sample.has(k)) sample.set(k, l);
    });
  });
  const limit = Math.max(3, Math.ceil(pages.length * 0.4));
  const out = { keys: new Set(), raw: new Set() };
  count.forEach((n, k) => {
    if (n < limit) return;
    const l = sample.get(k) || '';
    // Chỉ bỏ dòng NGẮN: một đoạn dài lặp lại là lỗi tài liệu, không phải footer, bỏ đi là mất câu.
    if (l.length > 200) return;
    if (matchAnswerLine(l) || matchOption(l) || matchNumOnly(l) !== null) return;
    out.keys.add(k);
    out.raw.add(l);
  });
  return out;
}

/**
 * Khoá so trùng của một dòng footer: CHE mọi chữ số.
 * pdf.js gộp cả cụm footer thành MỘT dòng — "11:03 7/7/26 Thẻ ghi nhớ: … | Quizlet https://… 1/103"
 * — nên số trang đổi mỗi trang và không dòng nào lặp lại y nguyên. Đo được trên PDF Quizlet 103
 * trang: cụm footer đó lọt vào nội dung câu hỏi và `analyzeImport` chấm **103 câu trùng nhau**.
 * Che chữ số thì 103 biến thể gộp về một khoá, đếm ra 103 lần, bị bỏ đúng như footer thật.
 */
function footerKey(line) {
  return line.replace(/\d+/g, '#');
}

/**
 * Cắt cụm giao diện Quizlet dính ở ĐẦU dòng đầu tài liệu.
 * pdf.js gộp cả khối đầu trang 1 thành một dòng — "IPR102 - CHUẨN NHUNG HOÀNG 5.0 (285 đánh giá)
 * Thuật ngữ trong học phần này (548) IPR102 - NHUNG HOÀNG Lưu Thêm vào lịch If a mark or get-up…"
 * — nên `JUNK_PATTERNS` (khớp cả dòng) không bắt được, và toàn bộ cụm đó dính vào đề câu 1.
 * "Thêm vào lịch" / "Add to folder" là nút CUỐI của cụm nên cắt tới đó là sạch.
 */
function stripChrome(line) {
  return line.replace(/^.{0,300}?(?:Thêm vào lịch|Add to folder)\s*/i, '');
}

/**
 * Tên tài liệu suy ra TỪ FOOTER lặp lại, để bỏ chỗ nó đứng một mình ở đầu trang 1.
 * Footer "Thẻ ghi nhớ: IPR102 - CHUẨN NHUNG HOÀNG | Quizlet" lặp ở mọi trang nên bị luật
 * `repeatedLines` bắt, nhưng dòng tiêu đề "IPR102 - CHUẨN NHUNG HOÀNG" ở đầu trang 1 chỉ xuất
 * hiện MỘT lần nên thoát, rồi dính vào đề câu 1.
 */
function titlesFromFooters(repeated) {
  const out = new Set();
  repeated.forEach(l => {
    l.split('|').forEach(part => {
      // Neo `^` không dùng được: pdf.js gộp cả footer thành một dòng nên "Thẻ ghi nhớ:" nằm SAU
      // đồng hồ ("11:03 7/7/26 Thẻ ghi nhớ: IPR102 …"). Cắt mọi thứ tới nhãn đó.
      const s = part
        .trim()
        .replace(/^.*?(?:Thẻ ghi nhớ|Flashcards?|Học phần|Study set)\s*:\s*/i, '')
        .trim();
      if (s.length >= 4 && s.length <= 100) out.add(s);
    });
  });
  return out;
}

/**
 * Gộp các trang thành một mảng dòng đã dọn: bỏ rác, bỏ header/footer, nối chỗ gạch nối cuối dòng.
 * PDF cột hẹp hay cắt từ giữa ("peo-\nple have"), nối lại mới so khớp được nội dung.
 */
function splitQuizletInlineLines(line) {
  let s = String(line || '').trim();
  if (!s) return [];
  // Quizlet đôi khi nén "... T 89) câu kế ... F" vào một dòng. Tách ngay sau đáp án
  // Đúng/Sai khi phía sau là số câu mới; không tách chữ T/F nằm trong câu văn bình thường.
  s = s.replace(/\s+(TRUE|FALSE|T|F|ĐÚNG|SAI)\s+(?=\d{1,4}\s*[.)]\s+)/gi, '\n$1\n');
  // Đáp án và số câu đôi lúc dính sát: "F89) ...".
  s = s.replace(/\b(TRUE|FALSE|T|F)(?=\d{1,4}\s*[.)]\s+)/gi, '$1\n');
  return s.split(/\n+/).map(x => x.trim()).filter(Boolean);
}

export function cleanLines(pages) {
  const rep = repeatedLines(pages);
  const titles = titlesFromFooters(rep.raw);
  const raw = [];
  pages.forEach(p => {
    String(p || '')
      .split(/\r?\n/)
      .forEach(l => {
        const t = stripChrome(normLine(l));
        if (!t || rep.keys.has(footerKey(t)) || titles.has(t) || isJunkLine(t)) return;
        splitQuizletInlineLines(t).forEach(part => raw.push(part));
      });
  });

  const out = [];
  for (const line of raw) {
    const prev = out[out.length - 1];
    // "peo-" + "ple have" -> "people have". Chỉ nối khi chữ sau viết thường, để không phá
    // "Delivery-up" hay các gạch nối thật ở cuối dòng trước tên riêng.
    if (prev && /[a-zà-ỹ]-$/.test(prev) && /^[a-zà-ỹ]/.test(line)) {
      out[out.length - 1] = prev.slice(0, -1) + line;
      continue;
    }
    out.push(line);
  }
  return out;
}

/** "12." / "12)" đứng riêng một dòng — số câu của layout A. */
function matchNumOnly(line) {
  const m = line.match(/^(\d{1,4})\s*[.)]\s*$/);
  return m ? Number(m[1]) : null;
}

/** "12. nội dung" — số câu dính liền nội dung. */
function matchNumInline(line) {
  const m = line.match(/^(\d{1,4})\s*[.)]\s+(?:(?:đáp án|answer)\s*[:.\-]?\s*)?(?:([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f])*)\s*[:：]\s*)?(\S.*)$/i);
  if (!m) return null;
  return {
    num: Number(m[1]),
    answer: (m[2] || '').toUpperCase().replace(/[^A-F]/g, ''),
    text: m[3],
  };
}

/** "A. nội dung" / "a) nội dung" / "A . nội dung" (DOCX có khoảng trắng lạ). */
function matchOption(line) {
  const m = line.match(/^([A-Fa-f])\s*[.)]\s*(\S.*)$/);
  if (!m) return null;
  const label = m[1].toUpperCase();
  let text = m[2].trim();
  let inlineAnswer = '';

  // Quizlet PDF đôi khi dính đáp án vào cuối lựa chọn cuối:
  // "D. nội dung: B" hoặc "E. nội dung: ADE".
  const tail = text.match(/^(.*?)(?:\s*[:：]\s*)([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f])*)\s*\.?$/);
  if (tail && tail[1].trim()) {
    text = tail[1].trim();
    inlineAnswer = tail[2].toUpperCase().replace(/[^A-F]/g, '');
  }
  return { label, text, inlineAnswer };
}

/**
 * Dòng đáp án trơ: "C", "A D", "a, c", "AD", "Đáp án: B".
 * KHÔNG nhận dòng dài — "A number of…" mà nhận thành đáp án là mất cả câu.
 */
function matchAnswerLine(line) {
  const m = line.match(/^(?:(?:đáp án|dap an|answer|đ\.?a)\s*[:.\-]?\s*)?([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f])*)\s*\.?(?:\s*\([^\n]*)?$/i);
  if (!m) return null;
  const letters = m[1].toUpperCase().replace(/[^A-F]/g, '');
  return letters || null;
}

/** Đáp án thẻ Đúng/Sai của bản in Quizlet: T/F, TRUE/FALSE. */
function matchTruthAnswerLine(line) {
  const t = String(line || '').trim().replace(/[.。]$/, '').toUpperCase();
  if (t === 'T' || t === 'TRUE' || t === 'ĐÚNG' || t === 'DUNG') return 'T';
  if (t === 'F' || t === 'FALSE' || t === 'SAI') return 'F';
  return null;
}

function packTruthQuestion(num, questionParts, answerLetter) {
  const question = stripLeadingNumLabel(joinText(questionParts));
  if (!question) return null;
  return {
    question,
    options: { T: 'Đúng', F: 'Sai' },
    answer: [answerLetter],
    images: [],
    has_image: false,
    error_risk: 'low',
    error_risk_reason: null,
    ...(num !== null && num !== undefined ? { num } : {}),
  };
}

function joinText(parts) {
  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:?!])/g, '$1')
    .trim();
}

/** Bỏ nhãn số câu còn dính đầu nội dung ("Câu 12. …") — `analyzeImport` trừ điểm chỗ này. */
function stripLeadingNumLabel(text) {
  return String(text || '')
    .replace(/^(?:câu|cau|question|q)\s*\d+\s*[.:)\-]\s*/i, '')
    .trim();
}

/**
 * Đóng gói một khối đã đọc xong thành câu hỏi theo đúng hình dạng file import
 * (khớp `normalizeImportedQuestions` + `analyzeImport`). `answer` để mảng nhãn như prompt yêu cầu.
 *
 * `error_risk` do CHÍNH parser tự đánh, không đoán bừa:
 *   · high   — không tìm được dòng đáp án, hoặc đáp án trỏ nhãn không có trong lựa chọn
 *   · medium — nhãn lựa chọn bị nhảy hoặc cấu trúc lựa chọn không liên tục
 *   · low    — còn lại
 */
function packQuestion(num, questionParts, options, answerLetters) {
  const question = stripLeadingNumLabel(joinText(questionParts));
  const labels = LABELS.filter(k => options[k] !== undefined);
  const answer = (answerLetters || '').split('').filter(k => labels.includes(k));
  const dropped = (answerLetters || '').split('').filter(k => !labels.includes(k));

  let risk = 'low';
  let reason = '';
  if (!answerLetters) {
    risk = 'high';
    reason = 'Không tìm được dòng đáp án trong tài liệu.';
  } else if (dropped.length) {
    risk = 'high';
    reason = 'Đáp án "' + dropped.join('') + '" không có trong danh sách lựa chọn.';
  } else if (labels.some((k, i) => k !== LABELS[i])) {
    risk = 'medium';
    reason = 'Nhãn lựa chọn bị nhảy — có thể rơi mất một lựa chọn.';
  }
  // Hai, ba hoặc nhiều đáp án vẫn hợp lệ khi chúng xuất hiện rõ trên dòng đáp án của tài liệu.
  // Không hạ độ tin cậy chỉ vì đề không ghi "chọn nhiều"; nhiều bộ câu hỏi dùng đáp án AB/AD
  // nhưng lược bỏ câu hướng dẫn. Số lượng lựa chọn 2-6 cũng hợp lệ nếu nhãn liên tục từ A.

  // Đánh dấu câu bắt buộc phải nhìn hình. Chưa trích file ảnh ở luồng đọc trực tiếp,
  // nhưng cờ này giúp giao diện/cổng chất lượng không coi câu có hình là câu chữ bình thường.
  const hasImage = /(?:\bthis\s+(?:picture|image|photo|figure|diagram|chart|map)\b|\b(?:picture|image|photo|figure|diagram|chart|map)\s+(?:shown|provided|depicted|displayed)\b|\b(?:shown|provided|depicted|displayed)\s+(?:below|above)\b|\bimage\s+below\b|\bhình\s+(?:dưới|trên|sau|bên)\b|\b(?:xem|quan\s+sát)\s+hình\b)/i.test(question);

  // Chỉ đánh dấu để bổ sung ảnh sau. Thiếu file ảnh không làm câu bị xếp rủi ro cao;
  // mức rủi ro vẫn dựa vào nội dung, lựa chọn và đáp án đã trích xuất.
  if (hasImage && !reason) {
    reason = 'Câu hỏi có hình ảnh; có thể bổ sung ảnh sau.';
  }

  const out = {
    question,
    options: labels.reduce((acc, k) => {
      acc[k] = options[k];
      return acc;
    }, {}),
    answer,
    images: [],
    has_image: hasImage,
    error_risk: risk,
    error_risk_reason: reason || null,
  };
  if (num !== null && num !== undefined) out.num = num;
  // Giữ vết nhãn bị loại để cổng chấm điểm phân biệt "đáp án trỏ sai" (chặn cứng) với "quên đáp án".
  if (dropped.length) out.answer_unknown = dropped.join('');
  return out;
}

/**
 * Máy trạng thái tách câu hỏi từ mảng dòng đã dọn.
 *
 * Trạng thái: 'q' đang đọc đề · 'opt' đang đọc lựa chọn · 'after' vừa gặp dòng đáp án.
 * Câu mới bắt đầu khi: gặp số câu · gặp nhãn A sau khi đã có đủ lựa chọn · gặp dòng thường khi
 * đang ở 'opt'/'after'. Một khối chỉ được nhận nếu có ≥2 lựa chọn — nhờ vậy phần chrome đầu tài
 * liệu (tiêu đề Quizlet, "5.0 (285 đánh giá)") tự rụng thay vì dính vào đề câu 1.
 */
export function parseQuestionsFromPages(pages) {
  const lines = cleanLines(Array.isArray(pages) ? pages : [pages]);
  const out = [];

  /**
   * Dòng "có cấu trúc" kế tiếp kể từ `from`, bỏ qua các dòng văn xuôi ở giữa.
   * Đây là thứ duy nhất phân biệt được hai ca trông y như nhau khi đang đọc lựa chọn:
   *   · "…for which it" / "has been used"      -> dòng cấu trúc kế tiếp là "c. …" (nhãn TIẾP)
   *   · "…đại công nghiệp)" / "Chọn phương án"  -> dòng cấu trúc kế tiếp là "A. …" (nhãn LẶP)
   * Ca thứ hai là câu MỚI của tài liệu không có dòng đáp án (DOCX). Không có phép thử này thì đề
   * câu sau bị nối vào lựa chọn D của câu trước rồi mất trắng: đo được 24 câu mất, 125 khối thiếu
   * lựa chọn trên `MLN122 NhungHoang.docx`.
   */
  function nextStructural(from) {
    for (let j = from; j < lines.length && j < from + 40; j++) {
      if (matchNumOnly(lines[j]) !== null) return { kind: 'num' };
      const o = matchOption(lines[j]);
      if (o) return { kind: 'option', label: o.label };
      if (matchAnswerLine(lines[j])) return { kind: 'answer' };
    }
    return { kind: 'none' };
  }

  let num = null;
  let qParts = [];
  let options = {};
  let answer = '';
  let state = 'q';
  let answerNoteOpen = false;

  const optCount = () => Object.keys(options).length;

  function flush() {
    if (optCount() >= 2 && joinText(qParts)) out.push(packQuestion(num, qParts, options, answer));
    num = null;
    qParts = [];
    options = {};
    answer = '';
    state = 'q';
  }

  /**
   * Số câu có hợp lý không. Chặn "1915. …" (một năm ở đầu câu) bị đọc thành số câu — đo trên
   * `AET102.pdf` qua pdf.js: đúng một câu như thế đủ làm `checkNumbering` báo lệch cả file.
   * Nới 5 để tài liệu bỏ sót một hai số vẫn đi tiếp bình thường.
   */
  const plausibleNum = n => n >= 1 && n <= out.length + 5;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bỏ các dòng giải thích tiếp nối sau đáp án dạng "B (1. ..." cho đến dấu đóng ngoặc.
    if (answerNoteOpen) {
      if (/\)/.test(line)) answerNoteOpen = false;
      continue;
    }

    // Số câu đôi khi dính sau phần cuối câu trước. Cũng nhận đáp án của câu mới:
    // "... 208. B: What...", "D None: A 153. The first...".
    const embeddedNum = line.match(/^(.+?)\s+(\d{1,3})[.)]\s+(?:([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f])*)\s*[:：]\s*)?(\S.*)$/);
    if (embeddedNum) {
      const n = Number(embeddedNum[2]);
      if (plausibleNum(n) && n >= out.length) {
        const prefix = embeddedNum[1].trim();
        const prefixAnswer = matchAnswerLine(prefix);
        if (prefixAnswer) {
          for (const ch of prefixAnswer) if (!answer.includes(ch)) answer += ch;
        } else if (state === 'opt') {
          const last = LABELS.filter(k => options[k] !== undefined).pop();
          if (last) options[last] = joinText([options[last], prefix]);
        } else if (state === 'q') {
          qParts.push(prefix);
        }
        flush();
        num = n;
        answer = (embeddedNum[3] || '').toUpperCase().replace(/[^A-F]/g, '');
        qParts.push(embeddedNum[4]);
        state = 'q';
        continue;
      }
    }

    const numOnly = matchNumOnly(line);
    if (numOnly !== null && plausibleNum(numOnly)) {
      flush();
      num = numOnly;
      continue;
    }

    // "12. đề bài" cùng một dòng. PyMuPDF tách "12." thành dòng riêng nhưng pdf.js GỘP nó với đề
    // bài (số câu và đề nằm cùng toạ độ Y), nên phải nhận cả ở trạng thái 'q' — chỉ khi khối hiện
    // tại còn trắng, để không cắt câu ở giữa một đoạn đề nhiều dòng.
    const numInline = matchNumInline(line);
    if (numInline && plausibleNum(numInline.num)) {
      // Số câu đầu dòng luôn là mốc cấu trúc. PDF có thể làm phần cuối câu trước và số câu mới
      // rơi vào cùng trạng thái, vì vậy vẫn phải chốt câu trước thay vì nối số câu vào nội dung.
      if (num !== null || qParts.length || optCount()) flush();
      num = numInline.num;
      answer = numInline.answer || '';
      qParts.push(numInline.text);
      state = 'q';
      continue;
    }

    const opt = matchOption(line);
    if (opt) {
      // Nhãn LẶP LẠI khi đã đọc xong lựa chọn = dòng đáp án kiểu "c. Integrity right (…)",
      // không phải lựa chọn mới. Nhãn A lặp lại thì là câu MỚI.
      if (options[opt.label] !== undefined) {
        if (opt.label === 'A' && optCount() >= 2) {
          flush();
          options[opt.label] = opt.text;
          state = 'opt';
          continue;
        }
        if (!answer) answer = opt.label;
        state = 'after';
        continue;
      }
      options[opt.label] = opt.text;
      if (opt.inlineAnswer) {
        for (const ch of opt.inlineAnswer) if (!answer.includes(ch)) answer += ch;
      }
      state = opt.inlineAnswer ? 'after' : 'opt';
      continue;
    }

    // Lựa chọn cuối có thể xuống nhiều dòng, còn đáp án dính ở cuối dòng tiếp theo:
    // "construction, good value for money: A". Tách đáp án trước khi nối phần văn bản.
    if (state === 'opt') {
      const tailAnswer = line.match(/^(.*?)(?:\s*[:：]\s*)([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f])*)\s*\.?$/);
      if (tailAnswer && tailAnswer[1].trim()) {
        const last = LABELS.filter(k => options[k] !== undefined).pop();
        if (last) options[last] = joinText([options[last], tailAnswer[1].trim()]);
        const found = tailAnswer[2].toUpperCase().replace(/[^A-F]/g, '');
        for (const ch of found) if (!answer.includes(ch)) answer += ch;
        state = 'after';
        continue;
      }
    }

    // Dòng đáp án có thể nằm BẤT KỲ ĐÂU trong khối, không chỉ sau lựa chọn cuối. Đo trên
    // AET102.pdf: "21." → "C" → đề bài → A,B,C,D · "12." → đề → "A. …" → "B" → "B. …" · "36." →
    // đề → "B" → A,B,C,D. Chữ đáp án được vẽ ở một cột riêng nên thứ tự text của PDF trộn nó vào
    // giữa. Bản đầu chỉ nhận khi `state==='opt' && optCount()>=2` nên mất đáp án 18/152 câu và
    // chữ đó còn bị nối vào lựa chọn phía trên.
    // Bản in Quizlet lưu thẻ Đúng/Sai thành: nội dung câu ở một hoặc nhiều dòng, sau đó
    // là một dòng T/F riêng. Trước đây flush() chỉ nhận câu có ít nhất 2 lựa chọn nên toàn bộ
    // nhóm này bị bỏ, tạo chênh lệch lớn so với số "thuật ngữ" hiển thị trên Quizlet.
    const truthAnswer = matchTruthAnswerLine(line);
    if (truthAnswer && optCount() === 0 && qParts.length) {
      const item = packTruthQuestion(num, qParts, truthAnswer);
      if (item) out.push(item);
      num = null;
      qParts = [];
      options = {};
      answer = '';
      state = 'after';
      continue;
    }

    const ans = matchAnswerLine(line);
    if (ans) {
      if (/\(/.test(line) && !/\)/.test(line)) answerNoteOpen = true;
      // Có tài liệu in đáp án nhiều lựa chọn thành nhiều nhãn/vùng riêng. Gộp và khử trùng.
      for (const ch of ans) if (!answer.includes(ch)) answer += ch;
      // Không kết thúc khối nếu phía trước vẫn còn nhãn lựa chọn chưa đọc. Điều này ngăn đáp án
      // ở cột phải chen giữa B và C làm cắt đôi một câu nhiều lựa chọn.
      const nxt = nextStructural(i + 1);
      const hasMoreOptions = nxt.kind === 'option' && options[nxt.label] === undefined;
      if (state === 'opt' && optCount() >= 2 && !hasMoreOptions) state = 'after';
      continue;
    }

    // Dòng thường.
    if (state === 'q') {
      qParts.push(line);
      continue;
    }
    if (state === 'opt') {
      // Câu MỚI nếu bộ lựa chọn sắp khởi động lại (nhãn kế tiếp đã có trong `options`) — tài liệu
      // không có dòng đáp án thì đây là dấu hiệu duy nhất. Ngược lại là dòng nối tiếp lựa chọn
      // đang dở (PDF/Word ngắt dòng giữa câu).
      const nxt = nextStructural(i + 1);
      // Layout Quizlet không số câu có thể đặt đáp án ở cột phải NGAY HÀNG ĐỀ, tức đáp án
      // xuất hiện trước A/B/C/D. Khi đã có đáp án + đủ lựa chọn, một dòng văn xuôi mà phía sau
      // sắp gặp đáp án mới chính là đề câu kế tiếp, không phải phần nối của lựa chọn cuối.
      const startsAfterKnownAnswer = num === null && answer && nxt.kind === 'answer' && optCount() >= 2;
      if (startsAfterKnownAnswer || (nxt.kind === 'option' && options[nxt.label] !== undefined && optCount() >= 2)) {
        flush();
        qParts.push(line);
        continue;
      }
      const last = LABELS.filter(k => options[k] !== undefined).pop();
      if (last) options[last] = joinText([options[last], line]);
      continue;
    }
    // state 'after': câu trước đã xong -> đây là đề của câu tiếp theo.
    flush();
    qParts.push(line);
  }
  flush();

  // Lượt cứu hộ theo khối văn bản gốc. Hữu ích khi lựa chọn D bị ngắt qua trang:
  // bộ phân tích chính có thể chốt lựa chọn sớm, nhưng đáp án "...: B" vẫn còn trong khối câu.
  const source = String((pages || []).join('\n')).replace(/\u00a0/g, ' ');
  for (const item of out) {
    if ((Array.isArray(item.answer) ? item.answer.length : String(item.answer || '').length) || !item.num) continue;
    const startRe = new RegExp('(?:^|\n)' + item.num + '\\s*[.)]\\s*', 'm');
    const sm = startRe.exec(source);
    if (!sm) continue;
    const rest = source.slice(sm.index + sm[0].length);
    const nextRe = new RegExp('(?:^|\n)' + (item.num + 1) + '\\s*[.)]\\s*', 'm');
    const nm = nextRe.exec(rest);
    const block = nm ? rest.slice(0, nm.index) : rest.slice(0, 5000);
    const hits = [...block.matchAll(/[:：]\s*([A-F](?:\s*[,/;+]?\s*[A-F])*)\s*(?=\n|$)/gi)];
    if (hits.length) {
      item.answer = [...new Set(hits[hits.length - 1][1].toUpperCase().replace(/[^A-F]/g, ''))];
      item.answer_unknown = false;
      item.error_risk = item.answer.every(k => item.options?.[k] !== undefined) ? 'low' : 'high';
      item.error_risk_reason = item.error_risk === 'low' ? null : 'Đáp án không khớp lựa chọn.';
    }
  }


  return out;
}

/**
 * Đánh số lại theo THỨ TỰ XUẤT HIỆN nếu tài liệu không có số câu (layout B, C).
 * Nếu tài liệu CÓ số câu thì giữ nguyên — `resolveImportNums()` của server tôn trọng `num` của file.
 */
export function renumberIfMissing(questions) {
  const list = Array.isArray(questions) ? questions : [];
  let mainNum = 0;
  let variantSeq = 0;
  let mainQuestion = null;

  // Nhận các nhãn thường gặp nhưng vẫn giữ quy tắc đầu ra chung: câu gốc là số nguyên,
  // biến thể là chuỗi "X.1", "X.2" và không làm tăng số của câu gốc tiếp theo.
  const isVariant = q => /^(?:\(?\s*)?(?:ki[eể]u\s+h[oỏ]i\s+(?:kh[aá]c|tương\s+tự)|c[aá]ch\s+h[oỏ]i\s+kh[aá]c|d[aạ]ng\s+h[oỏ]i\s+kh[aá]c|alternative\s+question)\s*[:\-]/i.test(
    String(q?.question || '').trim(),
  );

  list.forEach(q => {
    if (isVariant(q) && mainNum > 0) {
      variantSeq++;
      q.num = mainNum + '.' + variantSeq;
      // Bỏ nhãn giao diện khỏi nội dung, chỉ giữ đề bài thật.
      q.question = String(q.question || '')
        .trim()
        .replace(/^(?:\(?\s*)?(?:ki[eể]u\s+h[oỏ]i\s+(?:kh[aá]c|tương\s+tự)|c[aá]ch\s+h[oỏ]i\s+kh[aá]c|d[aạ]ng\s+h[oỏ]i\s+kh[aá]c|alternative\s+question)\s*[:\-]\s*/i, '')
        .replace(/\)\s*$/, '')
        .trim();

      // Biến thể không ghi đáp án thì dùng đáp án của câu gốc ngay phía trước.
      // Ví dụ câu 12 có đáp án C thì câu 12.1 cũng nhận C, miễn là biến thể có lựa chọn C.
      if ((!Array.isArray(q.answer) || !q.answer.length) && mainQuestion?.answer?.length) {
        const labels = new Set(Object.keys(q.options || {}));
        const inherited = mainQuestion.answer.filter(k => labels.has(k));
        if (inherited.length === mainQuestion.answer.length) {
          q.answer = [...inherited];
          if (labels.size < 3) {
            q.error_risk = 'medium';
            q.error_risk_reason = 'Chỉ đọc được ' + labels.size + ' lựa chọn.';
          } else {
            q.error_risk = 'low';
            q.error_risk_reason = null;
          }
          q.answer_inherited_from = mainNum;
        }
      }
      return;
    }

    mainNum++;
    variantSeq = 0;
    q.num = mainNum;
    mainQuestion = q;
  });

  return list;
}

/** Chấm chất lượng một cách bảo thủ để tự chọn cách đọc PDF tốt nhất. */
export function scoreExtractedQuestions(questions) {
  const list = Array.isArray(questions) ? questions : [];
  const seen = new Set();
  let low = 0, medium = 0, high = 0, answered = 0, duplicates = 0, malformed = 0;
  for (const q of list) {
    if (q?.error_risk === 'low') low++;
    else if (q?.error_risk === 'medium') medium++;
    else high++;
    if (Array.isArray(q?.answer) && q.answer.length) answered++;
    const key = String(q?.question || '').toLowerCase().replace(/\W+/g, ' ').trim();
    if (!key || key.length < 8 || Object.keys(q?.options || {}).length < 2) malformed++;
    if (key && seen.has(key)) duplicates++;
    if (key) seen.add(key);
  }
  // Ưu tiên câu hoàn chỉnh; phạt mạnh câu lỗi, trùng và khối rác.
  const score = low * 12 + medium * 5 + answered * 2 + list.length - high * 10 - duplicates * 8 - malformed * 8;
  return { score, total: list.length, low, medium, high, answered, duplicates, malformed };
}

function chooseBestPdfCandidate(candidates) {
  const ranked = candidates.map(c => ({ ...c, stats: scoreExtractedQuestions(c.questions) }))
    .sort((a, b) => b.stats.score - a.stats.score || b.stats.low - a.stats.low || b.stats.total - a.stats.total);
  return { best: ranked[0], ranked };
}

/** Bản mô tả kết quả đọc, để UI nói cho người dùng biết nó đã làm gì. */
function buildReport(pages, questions, kind, fileName) {
  const chars = pages.reduce((n, p) => n + String(p || '').length, 0);
  const perPage = Math.round(chars / Math.max(1, pages.length));
  return {
    kind,
    fileName,
    pageCount: pages.length,
    chars,
    charsPerPage: perPage,
    isScan: kind === 'pdf' && perPage < SCAN_CHARS_PER_PAGE,
    questions,
  };
}

// ───────────────────────── tầng I/O (chạm DOM / mạng) ─────────────────────────

const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';
let pdfjsPromise = null;

/**
 * Nạp pdf.js theo kiểu LAZY, từ CDN — cố ý không `npm i pdfjs-dist`.
 * `scripts/build.js` bundle thành MỘT file app.js (không code-splitting), nên `import()` tĩnh sẽ
 * nhồi ~1MB pdf.js vào bundle của MỌI người dùng, kể cả người không bao giờ thêm môn. Nạp động chỉ
 * tốn khi thật sự chọn một file PDF. Cùng cách `index.html` đang nạp supabase-js từ jsdelivr.
 */
async function loadPdfjs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* @vite-ignore */ PDFJS_URL).then(mod => {
      const lib = mod.default || mod;
      if (lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      window.pdfjsLib = lib;
      return lib;
    });
  }
  return pdfjsPromise;
}

/** Text của từng trang PDF, giữ ngắt dòng theo toạ độ Y để nhãn "A." không dính vào dòng trên. */
async function pdfPagesText(file, mode = 'auto') {
  const lib = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buf, isEvalSupported: false }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const width = page.getViewport({ scale: 1 }).width;

    // Bản Quizlet flashcard khổ rộng (IPR) đã lưu thứ tự item đúng theo luồng đọc:
    // đề -> lựa chọn -> đáp án. Nếu ép sắp lại theo Y, đáp án ở cột phải sẽ nhảy lên trước
    // lựa chọn và làm mất ranh giới câu. Giữ nguyên thứ tự nhúng cho kiểu trang này.
    if (mode === 'embedded' || (mode === 'auto' && width > 700)) {
      let text = '';
      let lastY = null;
      for (const it of content.items) {
        if (typeof it.str !== 'string') continue;
        const y = it.transform ? it.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) text += '\n';
        text += it.str;
        if (it.hasEOL) text += '\n';
        lastY = y;
      }
      pages.push(text);
      page.cleanup();
      continue;
    }

    const rows = [];

    // Không tin thứ tự items của PDF: nhiều file vẽ đáp án ở cột phải sau toàn bộ lựa chọn,
    // một số file lại vẽ nó trước đề. Gom theo tọa độ Y rồi mới sắp X sẽ lấy đúng thứ tự nhìn thấy.
    for (const it of content.items) {
      if (typeof it.str !== 'string' || !it.str.trim()) continue;
      const x = it.transform ? Number(it.transform[4]) : 0;
      const y = it.transform ? Number(it.transform[5]) : 0;
      let row = rows.find(r => Math.abs(r.y - y) <= 2);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ text: it.str, x, width: Number(it.width) || 0 });
    }

    rows.sort((a, b) => b.y - a.y);
    const lines = [];
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      const normal = [];
      const sideAnswers = [];

      // Tìm điểm bắt đầu cột đáp án. Với IPR, đáp án có thể kèm giải thích và bị PDF
      // chia thành nhiều mảnh; khi đã thấy nhãn đầu cột thì bỏ toàn bộ phần bên phải của hàng.
      let sideStart = null;
      for (const item of row.items) {
        const t = normLine(item.text);
        const side = t.match(/^([A-Fa-f](?:\s*[,/;+]?\s*[A-Fa-f]){0,5})(?:$|[.)]\s)/);
        // PDF dọc của Quizlet dùng vùng bên phải (từ khoảng 68% chiều rộng) để in đáp án
        // hoặc in lại cả nội dung đáp án. Vùng này không bao giờ được ghép vào đề/lựa chọn.
        if (item.x > width * 0.68) {
          sideStart = sideStart === null ? item.x : Math.min(sideStart, item.x);
          if (side) sideAnswers.push(side[1].toUpperCase().replace(/[^A-F]/g, ''));
        }
      }
      for (const item of row.items) {
        let t = normLine(item.text);
        if (!t) continue;
        if (item.x > width * 0.68 || (sideStart !== null && item.x >= sideStart - 1)) continue;
        // Một số lựa chọn bị mất dấu chấm do định dạng nguồn: "A None...", "B Snow...".
        // Chỉ sửa ở lề nội dung và khi từ sau bắt đầu bằng chữ hoa để tránh nhầm câu văn "A number...".
        if (item.x < width * 0.2 && /^[A-Fa-f]\s+[A-ZÀ-Ỹ]/.test(t)) t = t[0] + '. ' + t.slice(1).trim();
        normal.push({ ...item, text: t });
      }

      if (normal.length) {
        let line = '';
        let right = null;
        for (const item of normal) {
          const t = normLine(item.text);
          if (!t) continue;
          const gap = right === null ? 0 : item.x - right;
          // Dấu câu PDF thường là item riêng; không chèn khoảng trắng trước dấu câu.
          if (line && !/^[.,;:?!)]$/.test(t) && gap > 1) line += ' ';
          line += t;
          right = item.x + item.width;
        }
        if (line) lines.push(line);
      }
      // Đáp án phải đi sau đề cùng hàng nhưng trước các lựa chọn. Máy trạng thái đã hỗ trợ vị trí này.
      sideAnswers.forEach(a => lines.push(a));
    }

    pages.push(lines.join('\n'));
    page.cleanup();
  }
  return pages;
}

/**
 * Text của .docx: giải nén bằng JSZip (đã có sẵn trong bundle cho tính năng import .zip) rồi đọc
 * `word/document.xml`. Không cần thêm thư viện: chỉ cần từng `<w:p>` thành một dòng, `<w:tab/>`
 * thành khoảng trắng, và gom mọi `<w:t>` bên trong.
 */
async function docxParagraphs(file, JSZip) {
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('Không tìm thấy word/document.xml — file .docx có thể bị hỏng.');
  const xml = await entry.async('string');
  const paras = [];
  const reP = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m;
  while ((m = reP.exec(xml)) !== null) {
    const body = m[1]
      .replace(/<w:tab\b[^>]*\/>/g, ' ')
      // Word thường lưu cả đề + A/B/C/D trong MỘT paragraph nhưng ngăn bằng <w:br/>.
      // Đổi thành xuống dòng, không đổi thành dấu cách, nếu không hàng chục câu sẽ bị gộp.
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<w:cr\b[^>]*\/>/g, '\n');
    const texts = [];
    // Đọc theo đúng thứ tự cả text và ngắt dòng. Chỉ quét <w:t> sẽ làm mất <w:br/>
    // vì ngắt dòng nằm giữa hai thẻ text, dẫn tới A/B/C/D dính liền vào đề.
    const reToken = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:(?:br|cr)\b[^>]*\/>/g;
    let t;
    while ((t = reToken.exec(m[1])) !== null) texts.push(t[1] !== undefined ? t[1] : '\n');
    const line = texts
      .join('')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/ /g, ' ')
      .trim();
    // Mỗi ngắt dòng trong paragraph là một đơn vị cấu trúc riêng: đề, lựa chọn hoặc đáp án.
    // Giữ ranh giới này để parser không biến cả một cụm 20-30 câu thành một câu duy nhất.
    if (line) line.split(/\r?\n/).map(x => x.trim()).filter(Boolean).forEach(x => paras.push(x));
  }
  return paras;
}


function decodeMarkdownCell(s) {
  return String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/\\([_`*|])/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Đọc bảng Quizlet Markdown: | Term | Definition |. */
export function parseQuestionsFromMarkdown(markdown) {
  const out = [];
  for (const raw of String(markdown || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|') || !line.endsWith('|')) continue;
    const cells = line.slice(1, -1).split(/(?<!\\)\|/).map(decodeMarkdownCell);
    if (cells.length < 2 || /^term$/i.test(cells[0]) || /^-+$/.test(cells[0])) continue;
    let term = cells.slice(0, -1).join(' | ').trim();
    let key = cells[cells.length - 1].trim().toUpperCase();
    const numHit = term.match(/^(\d+)\s*[).:-]\s*/);
    const num = numHit ? Number(numHit[1]) : null;
    if (numHit) term = term.slice(numHit[0].length).trim();
    key = key === 'TRUE' ? 'T' : key === 'FALSE' ? 'F' : /^[TF]$/.test(key) ? key : key.replace(/[^A-F]/g, '');

    const allHits = [...term.matchAll(/([A-Fa-f])\s*[).]\s*/g)];
    const startAt = allHits.findIndex(h => h[1].toUpperCase() === 'A');
    const hits = [];
    if (startAt >= 0) {
      for (const h of allHits.slice(startAt)) {
        if (h[1].toUpperCase() === LABELS[hits.length]) hits.push(h);
        if (hits.length === LABELS.length) break;
      }
    }
    const options = {};
    let question = term;
    if (hits.length >= 2 && hits[0].index > 0) {
      question = term.slice(0, hits[0].index).trim();
      for (let i = 0; i < hits.length; i++) {
        const label = hits[i][1].toUpperCase();
        const start = hits[i].index + hits[i][0].length;
        const end = i + 1 < hits.length ? hits[i + 1].index : term.length;
        options[label] = term.slice(start, end).trim();
      }
    } else if (/^[TF]$/.test(key)) {
      options.T = 'Đúng'; options.F = 'Sai';
    }
    const labels = Object.keys(options);
    const answers = [...new Set(key.split('').filter(k => labels.includes(k)))];
    const unknown = key.split('').filter(k => !labels.includes(k));
    let risk = 'low', reason = null;
    if (!question || labels.length < 2 || !key || unknown.length) {
      risk = 'high'; reason = !key ? 'Thiếu đáp án.' : unknown.length ? 'Đáp án không khớp lựa chọn.' : 'Không tách được đủ lựa chọn.';
    } else if (labels.some((k, i) => k !== (key.match(/^[TF]$/) ? ['T','F'][i] : LABELS[i]))) {
      risk = 'medium'; reason = 'Nhãn lựa chọn không liên tục.';
    }
    const item = { question, options, answer: answers, images: [], has_image: false, error_risk: risk, error_risk_reason: reason };
    if (num !== null) item.num = num;
    if (unknown.length) item.answer_unknown = unknown.join('');
    out.push(item);
  }
  return renumberIfMissing(out);
}


/** Đọc JSON xuất từ Quizlet Exporter: { terms: [{ term, definition }] }. */
export function parseQuestionsFromQuizletJson(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  const terms = Array.isArray(data) ? data : data?.terms;
  if (!Array.isArray(terms)) throw new Error('JSON không có danh sách terms hợp lệ.');
  const markdown = ['| Term | Definition |', '| --- | --- |'];
  for (const item of terms) {
    const term = String(item?.term ?? item?.question ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const definition = String(item?.definition ?? item?.answer ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    markdown.push('| ' + term + ' | ' + definition + ' |');
  }
  return parseQuestionsFromMarkdown(markdown.join('\n'));
}

/** Đuôi file có đi được hướng "đọc trực tiếp" hay không. */
export function directExtractKind(fileName) {
  const n = String(fileName || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.docx')) return 'docx';
  if (n.endsWith('.md') || n.endsWith('.markdown')) return 'md';
  if (n.endsWith('.json')) return 'json';
  return null;
}

/**
 * Đọc một file PDF / DOCX thành danh sách câu hỏi.
 * @param {File} file
 * @param {{JSZip?:any}} deps JSZip truyền từ ngoài vào để module này không tự import (giữ thuần
 *        phần parser, và JSZip đã nằm trong bundle của `subjectImport.js`).
 * @returns {Promise<{kind,fileName,pageCount,chars,charsPerPage,isScan,questions}>}
 *          `isScan = true` nghĩa là PDF không có văn bản (bản chụp) — gọi phải đẩy sang hướng AI.
 */
export async function extractFromFile(file, deps = {}) {
  const kind = directExtractKind(file?.name);
  if (!kind) throw new Error('Chỉ đọc trực tiếp được file .pdf, .docx, .md và .json.');

  if (kind === 'json') {
    const text = await file.text();
    const questions = parseQuestionsFromQuizletJson(text);
    return buildReport([text], questions, kind, file.name);
  }

  if (kind === 'md') {
    const text = await file.text();
    const questions = parseQuestionsFromMarkdown(text);
    return buildReport([text], questions, kind, file.name);
  }

  if (kind === 'docx') {
    const JSZip = deps.JSZip || window.JSZip;
    if (!JSZip) throw new Error('Thiếu JSZip để đọc file .docx.');
    const paras = await docxParagraphs(file, JSZip);
    const pages = [paras.join('\n')];
    return buildReport(pages, renumberIfMissing(parseQuestionsFromPages(pages)), kind, file.name);
  }

  // Đọc PDF theo hai cách độc lập. Cách 1 giữ thứ tự chữ nhúng trong PDF; cách 2 dựng lại
  // theo vị trí trên trang. Quizlet thay đổi bố cục giữa bộ thẻ nên không thể dùng một cách cố định.
  const [embeddedPages, spatialPages] = await Promise.all([
    pdfPagesText(file, 'embedded'),
    pdfPagesText(file, 'spatial'),
  ]);
  const firstReport = buildReport(embeddedPages, [], kind, file.name);
  if (firstReport.isScan) return firstReport;
  const candidates = [
    { strategy: 'embedded-order', pages: embeddedPages, questions: renumberIfMissing(parseQuestionsFromPages(embeddedPages)) },
    { strategy: 'visual-position', pages: spatialPages, questions: renumberIfMissing(parseQuestionsFromPages(spatialPages)) },
  ];
  const { best, ranked } = chooseBestPdfCandidate(candidates);
  const report = buildReport(best.pages, best.questions, kind, file.name);
  report.extractionStrategy = best.strategy;
  report.extractionDiagnostics = ranked.map(x => ({ strategy: x.strategy, ...x.stats }));
  report.needsReview = best.questions.filter(q => q.error_risk !== 'low').map(q => q.num);
  return report;
}
