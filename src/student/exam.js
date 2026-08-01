/**
 * Tính năng KIỂM TRA (tab "Kiểm tra") — bước 2 của docs/SPLIT_PLAN.md, tách ngày 20260727.
 *
 * Nguyên văn block FINAL_EXAM_ONLY_QUIZ_UI_20260627 (appCore.js cũ dòng 8123–9479).
 * Chỉ đổi những chỗ BUỘC phải đổi vì sang file khác:
 *
 * - `sortAns` / `finalAnswerText` / `fmt` -> import từ ./format.js.
 * - `imgsHTML` / `openEditor` -> gọi qua `window.*`: hai hàm này bị nhiều lớp ghi đè
 *   trong appCore (imgsHTML 3 lớp, openEditor 12), phải lấy bản ĐANG CHẠY lúc gọi chứ
 *   không phải bản lúc import. Mọi lớp ghi đè đều gán cả binding module lẫn window nên
 *   `window.X` chính là bản mà block này vốn gọi.
 * - `showProgress` / `hideProgress` -> `window.*` (appCore phơi ra ngay sau chỗ khai báo).
 * - `sample()` chuyển hẳn vào đây: sau khi tách thì appCore không còn chỗ nào gọi.
 * - `renderQuiz = …` (gán vào binding module của appCore, module ES không cho làm từ
 *   file khác) -> `window.renderQuiz = …`. appCore giữ lại một `renderQuiz` mỏng
 *   chuyển tiếp sang `window.renderQuiz` (appCore ~dòng 540) để ~15 chỗ gọi cũ trong
 *   appCore vẫn chạy đúng bản này.
 *
 * Vì sao là `installExam()` chứ không phải IIFE chạy lúc import: `import` bị đưa lên đầu
 * file, để IIFE thì block chạy TRƯỚC toàn bộ thân appCore — khác thứ tự cũ (nó vốn chạy
 * ở dòng 8123, tức sau 8000 dòng đầu). appCore gọi `installExam()` đúng chỗ cũ nên thứ
 * tự chạy không đổi một chút nào.
 */
import { LHState } from './state.js';
import { lhWarn } from '../core/log.js';
import { sortAns, finalAnswerText, fmt } from './format.js';

/** Trộn mảng rồi lấy n phần tử đầu (n = 0 -> lấy hết). Chỉ bài kiểm tra dùng. */
function sample(a, n) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return n ? a.slice(0, n) : a;
}

/** Trộn ngẫu nhiên các lựa chọn (A, B, C, D...) trong một câu hỏi và cập nhật lại đáp án đúng tương ứng. */
function shuffleQuestionOptions(q) {
  if (!q || !q.options || typeof q.options !== 'object') return q;
  const keys = Object.keys(q.options);
  if (keys.length < 2) return q;

  const entries = keys.map(k => ({ origKey: k, text: q.options[k] }));

  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  const newOptions = {};
  const oldToNewMap = {};
  entries.forEach((item, idx) => {
    const newKey = keys[idx] || String.fromCharCode(65 + idx);
    newOptions[newKey] = item.text;
    oldToNewMap[item.origKey] = newKey;
  });

  let newAnswer = q.answer || '';
  if (typeof newAnswer === 'string' && newAnswer.trim()) {
    newAnswer = newAnswer
      .split('')
      .map(k => oldToNewMap[k] || k)
      .sort()
      .join('');
  }

  return {
    ...q,
    options: newOptions,
    answer: newAnswer,
  };
}

// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 =====
export function installExam() {
  let examOnlyIndex = 0;
  let examOnlyReview = false;
  let examSelectedCodes = [];
  // `timerInt` / `examStart` từng khai báo local ở đây và che khuất biến cùng tên của
  // appCore; bước 1 (state.js) đã đổi hết chỗ dùng sang LHState.timerInt/examStart nên
  // hai biến local thành vô nghĩa — bỏ luôn để không ai gán lại vào bản chết.
  let examBaseMs = 0;
  let examElapsed = '00:00';
  let examLayoutMode = localStorage.getItem('hod102_exam_layout_mode') || 'standard';
  let kizspyFontSize = parseInt(localStorage.getItem('hod102_kizspy_font_size') || '10', 10);
  let kizspySplitPct = parseFloat(localStorage.getItem('hod102_kizspy_split_pct') || '42');
  let kizspyCheckedMap = {};
  // RANGE (20260728): "chỉ làm từ câu X đến câu Y" — chỉ dùng được khi KHÔNG gộp thêm môn,
  // vì gộp nhiều môn thì `num` trùng nhau giữa các môn nên khoảng câu mất nghĩa.
  let examRangeOn = false;
  let examRangeFrom = '';
  let examRangeTo = '';

  const EXAM_STORE = 'learninghub_exam_state_v1';
  const $ = id => document.getElementById(id);
  const E = s =>
    String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Ba hàm dưới trước đây có nhánh dự phòng `typeof X === 'function' ? X(...) : <tự làm>`
  // vì X là hàm module của appCore, block không chắc nó tồn tại. Nay import tĩnh từ
  // ./format.js nên nhánh đó là mã chết -> gọi thẳng.
  const S = s => sortAns(s || '');
  const FMT = ms => fmt(ms);
  // imgsHTML thì KHÁC: nó bị 3 lớp ghi đè trong appCore (bản đang chạy do block
  // FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD gán), nên phải đọc window.imgsHTML lúc GỌI
  // để lấy bản sống, không import.
  const IMG = c => {
    try {
      return typeof window.imgsHTML === 'function' ? window.imgsHTML(c) : '';
    } catch (e) {
      return '';
    }
  };
  const EXPLAIN = c => {
    try {
      return finalAnswerText(c);
    } catch (e) {
      return String(c?.answer || '')
        .split('')
        .map(k => k + '. ' + ((c?.options || {})[k] || ''))
        .join('; ');
    }
  };
  const done = () => Object.keys(LHState.qSel || {}).filter(k => LHState.qSel[k]).length;
  const examSubject = () => {
    try {
      return localStorage.getItem('learninghub_subject_code_merged_v1') || '';
    } catch (e) {
      return '';
    }
  };
  const displayCode = code => String(code || '');
  const baseCode = code =>
    String(code || '')
      .split(/[_\-\s]/)[0]
      .toUpperCase();

  /** Số câu nhỏ nhất / lớn nhất của môn đang học (dùng reduce, tránh spread mảng nghìn phần tử). */
  function numBounds(pool) {
    let min = Infinity;
    let max = -Infinity;
    (pool || []).forEach(q => {
      const n = +q.num;
      if (!Number.isFinite(n)) return;
      if (n < min) min = n;
      if (n > max) max = n;
    });
    return max >= min ? { min, max } : { min: 0, max: 0 };
  }
  /** Lọc pool theo khoảng câu đang đặt. Ô trống = không giới hạn đầu đó. */
  function applyRange(pool) {
    if (!examRangeOn) return pool || [];
    const f = parseInt(examRangeFrom, 10);
    const t = parseInt(examRangeTo, 10);
    const a = Number.isFinite(f) ? f : -Infinity;
    const b = Number.isFinite(t) ? t : Infinity;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return (pool || []).filter(q => {
      const n = +q.num;
      return Number.isFinite(n) && n >= lo && n <= hi;
    });
  }
  /** Có môn nào ngoài môn đang học được tích để gộp đề? */
  function hasExtraSelected() {
    const active = examSubject();
    return examSelectedCodes.some(c => c && c !== active);
  }

  function timeMsFromText(t) {
    const m = String(t || '').match(/^(\d+):(\d+)$/);
    return m ? (+m[1] * 60 + +m[2]) * 1000 : 0;
  }
  function setTimerText() {
    const el = $('examTimer');
    if (el) el.textContent = examElapsed;
  }
  function startTimer(resumeMs = 0) {
    clearInterval(LHState.timerInt);
    examBaseMs = Math.max(0, resumeMs || 0);
    LHState.examStart = Date.now();
    examElapsed = FMT(examBaseMs);
    setTimerText();
    LHState.timerInt = setInterval(() => {
      examElapsed = FMT(examBaseMs + Date.now() - LHState.examStart);
      setTimerText();
    }, 1000);
  }
  function stopTimer() {
    clearInterval(LHState.timerInt);
    LHState.timerInt = null;
  }
  function resetTimer() {
    stopTimer();
    examBaseMs = 0;
    LHState.examStart = 0;
    examElapsed = '00:00';
    setTimerText();
  }
  function nowTimerMs() {
    return LHState.examSubmitted || !LHState.timerInt
      ? timeMsFromText(examElapsed)
      : examBaseMs + Date.now() - LHState.examStart;
  }

  function saveExam() {
    try {
      if (!LHState.qSet || !LHState.qSet.length) return;
      localStorage.setItem(
        EXAM_STORE,
        JSON.stringify({
          subject: examSubject(),
          nums: (LHState.qSet || []).map(c => c.num),
          ids: (LHState.qSet || []).map(c => c.id || ''),
          qSet: LHState.qSet || [],
          qSel: LHState.qSel || {},
          submitted: !!LHState.examSubmitted,
          index: examOnlyIndex || 0,
          review: !!examOnlyReview,
          qCnt: LHState.qCnt || 0,
          timerMs: nowTimerMs(),
          timer: examElapsed,
          layoutMode: examLayoutMode,
          // Lưu luôn map "đã check đáp án" của giao diện thi: nếu không lưu thì F5 giữa bài
          // là mất hết dấu đã check, còn nếu chỉ giữ trong RAM thì "Làm lại bộ này" lại
          // ăn nguyên map cũ -> câu cũ hiện đáp án ngay khi mở (lỗi người dùng báo).
          checked: kizspyCheckedMap || {},
        }),
      );
    } catch (e) {
      lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', e);
    }
  }
  function clearExam() {
    try {
      localStorage.removeItem(EXAM_STORE);
    } catch (e) {
      lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', e);
    }
  }
  function restoreExam() {
    try {
      const st = JSON.parse(localStorage.getItem(EXAM_STORE) || 'null');
      if (!st || !Array.isArray(st.nums) || !st.nums.length || !Array.isArray(LHState.RAW) || !LHState.RAW.length)
        return false;
      const curSub = examSubject() || '';
      const stSub = st.subject || '';
      if (!stSub || !curSub || stSub !== curSub) return false;
      const restored =
        Array.isArray(st.qSet) && st.qSet.length
          ? st.qSet
          : st.nums
              .map((n, i) =>
                LHState.RAW.find(c => String(c.id || '') === String(st.ids?.[i] || '') || Number(c.num) === Number(n)),
              )
              .filter(Boolean);
      if (!restored.length) return false;
      LHState.qSet = restored;
      LHState.qSel = st.qSel || {};
      LHState.examSubmitted = !!st.submitted;
      examOnlyIndex = Math.max(0, Math.min(+st.index || 0, LHState.qSet.length - 1));
      examOnlyReview = !!st.review;
      LHState.qCnt = st.qCnt || 0;
      kizspyCheckedMap = st.checked && typeof st.checked === 'object' ? st.checked : {};
      if (st.layoutMode) examLayoutMode = st.layoutMode;
      LHState.quizMode = 'exam';
      examElapsed = st.timer || FMT(+st.timerMs || 0);
      if (!LHState.examSubmitted && !LHState.timerInt) startTimer(+st.timerMs || timeMsFromText(examElapsed));
      return true;
    } catch (e) {
      return false;
    }
  }

  function markTab() {
    document.querySelectorAll('.tab').forEach(t => {
      if (t.dataset?.tab === 'quiz') t.textContent = 'Kiểm tra';
    });
  }
  function removeOldQuizUI() {
    document
      .querySelectorAll('#quiz .modeRow,#quiz .cntGrid:not(.examOnlyCountGrid),#practiceMode,#examMode')
      .forEach(x => x.remove());
  }

  let examSubjectsData = [];
  let examSubjectsFetchedAt = 0;
  async function ensureExamSubjects() {
    if (ensureExamSubjects.__busy) return;
    if (!window.HODSupabase?.getUser?.()) return;
    const prof = window.HODSupabase?.getProfile?.();
    if (prof && (prof.approved === false || prof.approved === 0 || prof.approved === '0')) return;
    if (examSubjectsData.length && Date.now() - examSubjectsFetchedAt < 60000) return;
    ensureExamSubjects.__busy = true;
    try {
      const res = await fetch('/api/subjects?ts=' + Date.now(), { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json.data) ? json.data : [];
      if (res.ok && rows.length) {
        examSubjectsData = rows.filter(s => s && s.is_active !== false);
        examSubjectsFetchedAt = Date.now();
        if (document.querySelector('#quiz .setup .examOnlyStart')) setup();
      }
    } catch (e) {
      console.warn('[exam subjects]', e);
    } finally {
      ensureExamSubjects.__busy = false;
    }
  }
  function cachedSubjects() {
    let subjects = typeof window.getSubjectsCache === 'function' ? window.getSubjectsCache() || [] : [];
    if (!subjects.length) subjects = examSubjectsData;
    if (!subjects.length || Date.now() - examSubjectsFetchedAt > 60000) ensureExamSubjects();
    return subjects;
  }

  function setup() {
    const box = document.querySelector('#quiz .setup');
    if (!box) return;
    const activeSubject = examSubject();
    const subjects = cachedSubjects();
    const totalCount = (LHState.RAW || []).length;
    if (activeSubject && (!examSelectedCodes.length || !examSelectedCodes.includes(activeSubject)))
      examSelectedCodes = [activeSubject];
    const activeBase = baseCode(activeSubject);
    const activeSub =
      subjects.find(s => s.code === activeSubject) ||
      (activeSubject ? { code: activeSubject, name: displayCode(activeSubject), question_count: totalCount } : null);
    const matchingSubjects = subjects.filter(s => s.code !== activeSubject && baseCode(s.code) === activeBase);

    const activeCard = activeSub
      ? `
      <div class="examActiveSubjectCard">
        <div class="examActiveSubjectTop"><span class="examActiveSubjectCode">${E(displayCode(activeSub.code))}</span><span class="examActiveSubjectName">${E(activeSub.name || displayCode(activeSub.code))}</span></div>
        <div class="examActiveSubjectDesc">${E(activeSub.description || 'Môn học chưa có mô tả.')}</div>
        <div class="examActiveSubjectMeta">${E(activeSub.question_count || totalCount || 0)} câu</div>
      </div>`
      : '';

    const extraChips = matchingSubjects
      .map(s => {
        const checked = examSelectedCodes.includes(s.code);
        return `<label class="examSubjectChip ${checked ? 'checked' : ''}" data-exam-subj="${E(s.code)}">
        <input type="checkbox" value="${E(s.code)}" ${checked ? 'checked' : ''}>
        <span class="examSubjectChipTop"><span class="examSubjectChipCode">${E(displayCode(s.code))}</span><span class="examSubjectChipName">${E(s.name || '')}</span></span>
        <span class="examSubjectChipDesc">${E(s.description || 'Môn học chưa có mô tả.')}</span>
        <span class="examSubjectChipDivider"></span>
        <span class="examSubjectChipBottom"><span class="examSubjectChipCount">${E(s.question_count || 0)} câu</span><span class="examSubjectChipChoose">${checked ? 'Đã chọn' : 'Chọn'}</span></span>
      </label>`;
      })
      .join('');

    // RANGE (20260728): hàng "làm từ câu … đến câu …". Chỉ dựng khi môn đang học có câu;
    // khóa lại (disabled) khi đang gộp thêm môn — xem chú thích ở khai báo examRangeOn.
    const bounds = numBounds(LHState.RAW || []);
    const extraOn = hasExtraSelected();
    const rangeRow = bounds.max
      ? `
        <div class="examRangeRow${extraOn ? ' examRangeDisabled' : ''}" id="examRangeRow">
          <label class="examRangeToggle"><input type="checkbox" id="examRangeOn" ${examRangeOn && !extraOn ? 'checked' : ''} ${extraOn ? 'disabled' : ''}><span>Giới hạn khoảng câu</span></label>
          <div class="examRangeFields">
            <span class="examRangeLbl">Từ câu</span>
            <input type="number" class="examRangeInput" id="examRangeFrom" min="${bounds.min}" max="${bounds.max}" placeholder="${bounds.min}" value="${E(examRangeFrom)}" ${extraOn ? 'disabled' : ''}>
            <span class="examRangeLbl">đến</span>
            <input type="number" class="examRangeInput" id="examRangeTo" min="${bounds.min}" max="${bounds.max}" placeholder="${bounds.max}" value="${E(examRangeTo)}" ${extraOn ? 'disabled' : ''}>
            <span class="examRangeNote" id="examRangeNote"></span>
          </div>
        </div>`
      : '';

    box.innerHTML = `
      <div class="examOnlyStart">
        <div class="examOnlyLabel">Môn đang học</div>
        ${activeCard || '<span style="color:var(--mist)">Chưa chọn môn học</span>'}
        ${extraChips ? `<div class="examOnlyLabel">Gộp thêm môn <span style="font-weight:400;color:var(--mist);font-size:.85rem">(chọn thêm môn cùng mã để gộp đề)</span></div><div class="examSubjectChips" id="examSubjectChipsExtra">${extraChips}</div>` : ''}
        <div class="examOnlyLabel">Số câu kiểm tra <span style="font-weight:400;color:var(--mist);font-size:.85rem">(Thư viện hiện có: <span id="examTotalCountVal">${totalCount}</span> câu)</span></div>
        <div class="examOnlyCountGrid">
          <button class="cnt" data-exam-cnt="10">10</button>
          <button class="cnt" data-exam-cnt="20">20</button>
          <button class="cnt" data-exam-cnt="30">30</button>
          <button class="cnt" data-exam-cnt="50">50</button>
          <button class="cnt" data-exam-cnt="100">100</button>
          <button class="cnt" data-exam-cnt="0">Tất cả</button>
        </div>
        <div class="examCustomCntRow"><label class="examCustomCntLabel">Tùy chỉnh:</label><input type="number" id="examCustomCnt" class="examCustomCntInput" min="1" placeholder="Nhập số câu..."><button type="button" class="cnt examCustomCntApply" id="examCustomCntApply">Áp dụng</button></div>
        ${rangeRow}
        <button id="start" class="start" type="button">Bắt đầu kiểm tra</button>
      </div>`;

    const updateMergedCount = () => {
      const el = $('examTotalCountVal');
      if (!el) return;
      if (hasExtraSelected()) {
        el.textContent =
          subjects
            .filter(s => examSelectedCodes.includes(s.code))
            .reduce((acc, s) => acc + (+s.question_count || 0), 0) || totalCount;
      } else {
        el.textContent = examRangeOn ? applyRange(LHState.RAW || []).length : totalCount;
      }
    };
    // RANGE (20260728): bật/tắt hàng khoảng câu theo việc có gộp thêm môn hay không, và
    // ghi lại số câu còn trong khoảng để người dùng biết mình đang giới hạn bao nhiêu câu.
    const syncRangeRow = () => {
      const row = $('examRangeRow');
      if (!row) return;
      const extra = hasExtraSelected();
      row.classList.toggle('examRangeDisabled', extra);
      row.querySelectorAll('input').forEach(i => {
        i.disabled = extra;
      });
      const cb = $('examRangeOn');
      // Gộp môn thì TẮT hẳn cờ (không chỉ bỏ tích ô), nếu không thì bỏ gộp ra sẽ còn cảnh
      // ô không tích mà start() vẫn cắt theo khoảng câu.
      if (extra) examRangeOn = false;
      if (cb) cb.checked = examRangeOn;
      const note = $('examRangeNote');
      if (note) {
        if (extra) note.textContent = 'Bỏ chọn môn gộp mới dùng được khoảng câu';
        else if (examRangeOn) note.textContent = `Còn ${applyRange(LHState.RAW || []).length} câu trong khoảng`;
        else note.textContent = `Môn này có câu ${bounds.min}–${bounds.max}`;
      }
      updateMergedCount();
    };
    box.querySelectorAll('.examSubjectChip input[type="checkbox"]').forEach(cb => {
      cb.onchange = () => {
        const code = cb.value;
        const label = cb.closest('.examSubjectChip');
        if (cb.checked) {
          if (!examSelectedCodes.includes(code)) examSelectedCodes.push(code);
          label?.classList.add('checked');
        } else {
          examSelectedCodes = examSelectedCodes.filter(c => c !== code);
          label?.classList.remove('checked');
        }
        const choose = label?.querySelector('.examSubjectChipChoose');
        if (choose) choose.textContent = cb.checked ? 'Đã chọn' : 'Chọn';
        syncRangeRow();
      };
    });
    const rangeCb = $('examRangeOn');
    const rangeFromEl = $('examRangeFrom');
    const rangeToEl = $('examRangeTo');
    if (rangeCb) {
      rangeCb.onchange = () => {
        examRangeOn = rangeCb.checked;
        syncRangeRow();
      };
    }
    [rangeFromEl, rangeToEl].forEach(el => {
      if (!el) return;
      el.oninput = () => {
        if (el === rangeFromEl) examRangeFrom = el.value;
        else examRangeTo = el.value;
        // Gõ số vào là hiểu ngay là muốn giới hạn — tự tích hộ, đỡ một cú bấm.
        if (el.value && rangeCb && !rangeCb.checked && !rangeCb.disabled) {
          rangeCb.checked = true;
          examRangeOn = true;
        }
        syncRangeRow();
      };
    });
    syncRangeRow();
    updateMergedCount();
    box.querySelectorAll('[data-exam-cnt]').forEach(b => {
      const cnt = +b.dataset.examCnt;
      b.classList.toggle('sel', cnt === LHState.qCnt);
      b.onclick = () => {
        LHState.qCnt = cnt;
        box.querySelectorAll('[data-exam-cnt]').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        const input = $('examCustomCnt');
        if (input) input.value = '';
      };
    });
    const applyBtn = $('examCustomCntApply');
    const customInput = $('examCustomCnt');
    if (applyBtn && customInput) {
      const applyCustom = () => {
        const v = parseInt(customInput.value, 10);
        if (v > 0) {
          LHState.qCnt = v;
          box.querySelectorAll('[data-exam-cnt]').forEach(x => x.classList.remove('sel'));
        }
      };
      applyBtn.onclick = applyCustom;
      customInput.onkeydown = e => {
        if (e.key === 'Enter') applyCustom();
      };
    }
    const startBtn = $('start');
    if (startBtn) {
      startBtn.onclick = () => {
        showLayoutPickerModal(() => {
          start();
        });
      };
    }
  }

  function showLayoutPickerModal(onConfirm) {
    let modal = document.getElementById('examLayoutPickerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'examLayoutPickerModal';
      document.body.appendChild(modal);
    }
    modal.className = 'examLayoutPickerOverlay';
    modal.innerHTML = `
      <div class="examLayoutPickerBox">
        <h3 class="examLayoutPickerTitle">🎯 Chọn Giao Diện Làm Bài</h3>
        <p class="examLayoutPickerSub">Vui lòng chọn kiểu giao diện hiển thị bạn mong muốn:</p>
        
        <div class="examLayoutPickerGrid">
          <div class="examLayoutPickerCard ${examLayoutMode === 'kizspy' ? 'active' : ''}" data-pick-layout="kizspy">
            <span class="examLayoutPickerBadge">GIAO DIỆN THI</span>
            <div class="examLayoutPickerIcon">💻</div>
            <div class="examLayoutPickerName">Giao diện thi</div>
            <div class="examLayoutPickerDesc">Mô phỏng EOS Client FPT vạch đỏ, tích chọn cột trái & tùy chỉnh zoom cỡ chữ.</div>
          </div>

          <div class="examLayoutPickerCard ${examLayoutMode === 'standard' ? 'active' : ''}" data-pick-layout="standard">
            <div class="examLayoutPickerIcon">🗂</div>
            <div class="examLayoutPickerName">Giao diện chuẩn</div>
            <div class="examLayoutPickerDesc">Giao diện dạng thẻ đầy đủ tính năng truyền thống.</div>
          </div>
        </div>

        <div class="examLayoutPickerActions">
          <button type="button" class="examLayoutPickerConfirmBtn" id="examLayoutPickerStart">Bắt đầu làm bài ▶</button>
        </div>
      </div>
    `;

    modal.querySelectorAll('[data-pick-layout]').forEach(card => {
      card.onclick = () => {
        examLayoutMode = card.dataset.pickLayout;
        try {
          localStorage.setItem('hod102_exam_layout_mode', examLayoutMode);
        } catch (e) {
          lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', e);
        }
        modal.querySelectorAll('[data-pick-layout]').forEach(x => x.classList.remove('active'));
        card.classList.add('active');
      };
    });

    const confirmBtn = modal.querySelector('#examLayoutPickerStart');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        modal.remove();
        if (typeof onConfirm === 'function') onConfirm();
      };
    }
  }

  function showQuickCheckResultPopup(userChoice, correctChoice, q) {
    let popup = document.getElementById('kizspyQuickCheckPopup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'kizspyQuickCheckPopup';
      document.body.appendChild(popup);
    }
    popup.className = 'kizspyCheckOverlay';

    const opts = q.options || {};
    const formatOptText = keysStr => {
      if (!keysStr) return '';
      return keysStr
        .split('')
        .map(k => (opts[k] ? `${k}. ${opts[k]}` : k))
        .join('; ');
    };

    const userText = formatOptText(userChoice);
    const correctText = formatOptText(correctChoice);

    if (!userChoice) {
      popup.innerHTML = `
        <div class="kizspyCheckBox warning">
          <div class="kizspyCheckHeader">
            <span class="kizspyCheckTitle">⚠️ CHƯA CHỌN ĐÁP ÁN</span>
            <button type="button" class="kizspyCheckClose" id="kizspyCheckCloseBtn">×</button>
          </div>
          <div class="kizspyCheckContent">
            Bạn chưa tích chọn đáp án nào cho <b>Câu ${examOnlyIndex + 1}</b>. Hãy chọn 1 đáp án ở cột trái rồi bấm Kiểm tra lại nhé!
          </div>
          <div class="kizspyCheckFooter">
            <button type="button" class="kizspyCheckOkBtn" id="kizspyCheckOkBtn">Đã hiểu</button>
          </div>
        </div>
      `;
    } else {
      const isCorrect = S(userChoice) === S(correctChoice);
      const explainText = q.explain || EXPLAIN(q) || '';

      popup.innerHTML = `
        <div class="kizspyCheckBox ${isCorrect ? 'correct' : 'incorrect'}">
          <div class="kizspyCheckHeader">
            <span class="kizspyCheckTitle">${isCorrect ? '✅ CHÍNH XÁC!' : '❌ CHƯA CHÍNH XÁC'}</span>
            <button type="button" class="kizspyCheckClose" id="kizspyCheckCloseBtn">×</button>
          </div>
          <div class="kizspyCheckBodyGrid">
            <div class="kizspyCheckRow ${isCorrect ? 'ok' : 'bad'}">
              <div class="kizspyCheckRowTop">
                <span class="kizspyCheckLabel">Lựa chọn của bạn:</span>
                <span class="kizspyCheckBadge ${isCorrect ? 'ok' : 'bad'}">${E(userChoice)}</span>
              </div>
              <div class="kizspyCheckVal">${E(userText)}</div>
            </div>
            ${
              !isCorrect
                ? `
              <div class="kizspyCheckRow ok">
                <div class="kizspyCheckRowTop">
                  <span class="kizspyCheckLabel">Đáp án đúng:</span>
                  <span class="kizspyCheckBadge ok">${E(correctChoice)}</span>
                </div>
                <div class="kizspyCheckVal">${E(correctText)}</div>
            <div class="kizspyCheckExplainText">${E(explainText)}</div>
              </div>
            `
                : ''
            }
          </div>
          <div class="kizspyCheckFooter">
            <button type="button" class="kizspyCheckOkBtn" id="kizspyCheckOkBtn">Đóng</button>
          </div>
        </div>
      `;
    }

    const close = () => popup.remove();
    const closeBtn = popup.querySelector('#kizspyCheckCloseBtn');
    const okBtn = popup.querySelector('#kizspyCheckOkBtn');
    if (closeBtn) closeBtn.onclick = close;
    if (okBtn) okBtn.onclick = close;
    popup.onclick = e => {
      if (e.target === popup) close();
    };
  }

  async function loadQuestionsForCodes(codes) {
    if (!codes.length) return [];
    const out = [];
    for (const code of codes) {
      try {
        const res = await fetch('/api/questions?subject_code=' + encodeURIComponent(code) + '&ts=' + Date.now(), {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.data)) out.push(...json.data);
      } catch (e) {
        console.warn('[loadQuestionsForCodes]', code, e);
      }
    }
    return out.map(r => ({
      id: r.id,
      subject_code: r.subject_code,
      num: r.num,
      question: r.question,
      options: r.options || {},
      answer: r.answer,
      answer_text: r.answer_text,
      /*
        GIỮ NGUYÊN hành vi cũ, đừng "sửa lại": trước khi tách, dòng này viết
        `typeof cleanImages === 'function' ? cleanImages(r.images || []) : r.images || []`
        nhưng `cleanImages` KHÔNG hề tồn tại ở phạm vi module appCore — nó chỉ là hàm
        local trong hai block ảnh (kiểm bằng `npm run find cleanImages`: cả hai chỗ khai
        báo đều nằm trong IIFE). Nên nhánh `typeof` luôn sai và câu hỏi tải thêm từ môn
        khác CHƯA BAO GIỜ được lọc ảnh. Muốn lọc thì phơi cleanImages ra window rồi đổi
        ở đây — nhưng đó là đổi hành vi, làm ở commit riêng (xem docs/SPLIT_PLAN.md).
      */
      images: r.images || [],
      has_image: !!(r.has_image || (r.images || []).length),
      error_risk: r.error_risk || 'low',
      error_risk_reason: r.error_risk_reason || '',
      __imagesChecked: true,
      __imagesLoaded: true,
    }));
  }

  async function start() {
    LHState.quizMode = 'exam';
    LHState.examSubmitted = false;
    examOnlyReview = false;
    examOnlyIndex = 0;
    kizspyCheckedMap = {};
    const activeSubject = examSubject();
    const extraCodes = examSelectedCodes.filter(c => c && c !== activeSubject);
    let mergedPool = [...(LHState.RAW || [])];
    if (extraCodes.length) {
      if (typeof window.showProgress === 'function')
        window.showProgress('Đang tải câu hỏi từ các môn đã chọn...', 0, 100);
      const extraQuestions = await loadQuestionsForCodes(extraCodes);
      if (typeof window.hideProgress === 'function') window.hideProgress();
      const seen = new Set(mergedPool.map(q => q.id || q.subject_code + ':' + q.num));
      extraQuestions.forEach(q => {
        const key = q.id || q.subject_code + ':' + q.num;
        if (!seen.has(key)) {
          mergedPool.push(q);
          seen.add(key);
        }
      });
    } else if (examRangeOn) {
      // RANGE (20260728): chỉ áp dụng khi KHÔNG gộp môn — gộp thì `num` trùng giữa các môn.
      const limited = applyRange(mergedPool);
      if (!limited.length) {
        const b = numBounds(mergedPool);
        alert(`Khoảng câu đang đặt không có câu nào.\n\nMôn này có câu ${b.min} đến ${b.max}.`);
        return;
      }
      mergedPool = limited;
    }
    if (!mergedPool.length) {
      alert('Chưa có câu hỏi để kiểm tra.');
      return;
    }
    LHState.qSet = sample(mergedPool, LHState.qCnt || 0).map(shuffleQuestionOptions);
    LHState.qDone = {};
    LHState.qSel = {};
    clearExam();
    startTimer(0);
    saveExam();
    draw();
  }

  function scoreExam() {
    let ok = 0;
    (LHState.qSet || []).forEach((c, i) => {
      if (S(LHState.qSel[i]) === S(c.answer)) ok++;
    });
    const total = (LHState.qSet || []).length;
    const pct = total ? Math.round((ok / total) * 100) : 0;
    return { ok, bad: total - ok, total, pct };
  }

  function draw() {
    window.__examOnlyRender = draw;
    const body = $('quizBody');
    if (!body) return;

    const isQuizActive =
      $('quiz')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'quiz';
    if (!isQuizActive) {
      document.body.classList.remove('kizspy-active');
      const p = document.getElementById('kizspyExamPortal');
      if (p) p.remove();
      return;
    }
    if (!LHState.qSet || !LHState.qSet.length) restoreExam();
    const box = document.querySelector('#quiz .setup');
    const idxEl = document.getElementById('idx');
    const totalEl = document.getElementById('total');
    const totalCountVal =
      LHState.qSet && LHState.qSet.length
        ? LHState.qSet.length
        : typeof LHState.RAW !== 'undefined' && LHState.RAW.length
          ? LHState.RAW.length
          : 0;
    if (idxEl) idxEl.textContent = String((examOnlyIndex || 0) + 1);
    if (totalEl) totalEl.textContent = String(totalCountVal);

    if (!LHState.qSet || !LHState.qSet.length) {
      document.body.classList.remove('kizspy-active');
      const p = document.getElementById('kizspyExamPortal');
      if (p) p.remove();
      setup();
      if (box) box.classList.remove('hidden');
      body.innerHTML = '';
      return;
    }
    if (box) box.classList.add('hidden');
    if (LHState.examSubmitted && !examOnlyReview) {
      document.body.classList.remove('kizspy-active');
      const portal = document.getElementById('kizspyExamPortal');
      if (portal) portal.remove();
      result();
      return;
    }

    const c = LHState.qSet[examOnlyIndex];
    const total = LHState.qSet.length;
    const p = Math.round(((examOnlyIndex + 1) / total) * 100);
    const ch = LHState.qSel[examOnlyIndex] || '';
    const correctAns = c.answer || '';

    if (examLayoutMode === 'kizspy') {
      document.body.classList.add('kizspy-active');
      let portal = document.getElementById('kizspyExamPortal');
      if (!portal) {
        portal = document.createElement('div');
        portal.id = 'kizspyExamPortal';
        document.body.appendChild(portal);
      }
      portal.style.display = 'flex';

      const questionCountLabel = `Question: ${examOnlyIndex + 1}`;
      const ansLen = (c.answer || '').length;
      const isMulti = ansLen > 1;
      const choiceInstruction = isMulti ? `(Choose ${ansLen} answers)` : '(Choose 1 answer)';

      const isCheckedThisQ = examOnlyReview || !!kizspyCheckedMap[examOnlyIndex];
      const isUserChoseAny = !!ch;
      const isUserCorrect = isUserChoseAny && S(ch) === S(correctAns);

      const isAllChecked =
        (LHState.qSet || []).length > 0 && (LHState.qSet || []).every((_, idx) => kizspyCheckedMap[idx]);

      // Selection boxes for Left Pane
      const selectBoxesHTML = Object.keys(c.options || {})
        .map(k => {
          const isChecked = String(ch).includes(k);
          const inputType = isMulti ? 'checkbox' : 'radio';
          let boxClass = isChecked ? 'sel' : '';
          if (isCheckedThisQ) {
            if (correctAns.includes(k)) boxClass += ' check-correct-ok';
            else if (isChecked && !correctAns.includes(k)) boxClass += ' check-user-bad';
          }
          return `
          <label class="kizspySelectBoxItem ${boxClass}" data-exam-opt="${E(k)}">
            <input type="${inputType}" class="kizspyRadioCheck" name="kizspyOpt_${examOnlyIndex}" ${isChecked ? 'checked' : ''} ${examOnlyReview ? 'disabled' : ''}>
            <span class="kizspySelectBoxLetter">${E(k)}</span>
          </label>
        `;
        })
        .join('');

      // Display options text for Right Pane
      let optsHTML = Object.entries(c.options || {})
        .map(([k, v]) => {
          const isChecked = String(ch).includes(k);
          const isUserChose = ch.includes(k);
          const isCorrect = correctAns.includes(k);
          let stateClass = isChecked ? 'sel' : '';
          let badgeTag = '';
          if (isCheckedThisQ) {
            if (isCorrect) {
              stateClass = 'check-correct-ok';
              badgeTag = '<span class="kizspyCheckBadgeTag ok">✓ Đáp án đúng</span>';
            } else if (isUserChose && !isCorrect) {
              stateClass = 'check-user-bad';
              badgeTag = '<span class="kizspyCheckBadgeTag bad">✕ Lựa chọn của bạn</span>';
            }
          }
          return `
          <div class="kizspyOption ${stateClass}" ${!examOnlyReview ? `data-exam-opt="${E(k)}"` : ''}>
            <span class="kizspyOptionPrefix">${E(k)}.</span>
            <span class="kizspyOptionText">${E(v)}</span>
            ${badgeTag}
          </div>
        `;
        })
        .join('');

      portal.innerHTML = `
        <div class="kizspyHeaderNav">
          <div class="kizspyNavLeft">
            <span class="kizspyBrandBadge">💻 EOS Client</span>
            <span class="kizspyTimerBadge">⏱ <b id="examTimer">${timeText()}</b></span>
            <span class="kizspyCountBadge">Đã làm: <b>${done()}/${total}</b></span>
          </div>

          <div class="kizspyNavCenter">
            <button type="button" id="kizspyOpenMapBtn" class="kizspyBtn kizspyBtnMap" title="Xem bản đồ tất cả các câu hỏi trong bài thi">
              🗺 Bản đồ câu (${done()}/${total})
            </button>
            <button type="button" id="kizspyFontDec" class="kizspyBtn" title="Giảm cỡ chữ (Zoom out)">A-</button>
            <button type="button" id="kizspyFontReset" class="kizspyBtn" title="Reset cỡ chữ về mặc định 10px">↺ 10px</button>
            <button type="button" id="kizspyFontInc" class="kizspyBtn" title="Tăng cỡ chữ (Zoom in)">A+</button>
            <button type="button" id="kizspyQuickCheck" class="kizspyBtn kizspyBtnCheck ${isCheckedThisQ ? 'active' : ''}" title="Kiểm tra đáp án câu hiện tại">
              ✔ Check đáp án
            </button>
            <button type="button" id="examToggleLayout" class="kizspyBtn kizspyBtnLayout" title="Chuyển về giao diện chuẩn">
              ⇄ Giao diện chuẩn
            </button>
          </div>

          <div class="kizspyNavRight">
            ${
              !examOnlyReview
                ? `
              <button type="button" id="examSubmit" class="kizspyBtn kizspyBtnSubmit">Nộp bài</button>
            `
                : `
              <button type="button" id="examOnlyExitToResult" class="kizspyBtn kizspyBtnSubmit">Xem kết quả</button>
            `
            }
            <button type="button" id="examOnlyExit" class="kizspyBtn kizspyBtnExit">✕ Thoát</button>
          </div>
        </div>

        <div class="kizspyMainSplit">
          <div class="kizspyLeftPane" style="flex:0 0 ${kizspySplitPct}%; width:${kizspySplitPct}%;">
            <div class="kizspyHeaderLine">${questionCountLabel}</div>
            <div class="kizspySubLine">${choiceInstruction}</div>
            <div class="kizspySelectBoxContainer">
              <div class="kizspySelectBoxList">${selectBoxesHTML}</div>
            </div>

            <!-- Prev / Next Navigation Buttons on Left Pane -->
            <div class="kizspyLeftNavBtns">
              <button type="button" id="examPrev" class="kizspyNavBtn" ${examOnlyIndex <= 0 ? 'disabled' : ''}>← Prev</button>
              <button type="button" id="examNext" class="kizspyNavBtn" ${examOnlyIndex >= total - 1 ? 'disabled' : ''}>Next →</button>
            </div>
          </div>

          <div class="kizspyDividerLine" title="Kéo qua trái/phải để chỉnh độ rộng 2 cột"></div>

          <div class="kizspyRightPane" style="font-size:${kizspyFontSize}px !important;">
            <div class="kizspyQText" style="font-size:${kizspyFontSize}px !important;">${E(c.question)}</div>
            ${c.images && c.images.length ? `<div class="kizspyQImgs">${IMG(c)}</div>` : ''}
            <div class="kizspyOptionsList">${optsHTML}</div>
          </div>
        </div>

        <!-- EOS Question Map Modal Overlay -->
        <div id="kizspyMapModal" class="kizspyMapOverlay hidden">
          <div class="kizspyMapBox">
            <div class="kizspyMapHeader">
              <div class="kizspyMapTitle">
                <b>🗺 Bản đồ câu hỏi bài thi EOS</b>
                <span>(Đã làm: ${done()} / ${total} câu)</span>
              </div>
              <button type="button" class="kizspyMapClose" id="kizspyCloseMapBtn" title="Đóng bản đồ câu hỏi">✕</button>
            </div>
            
            <div class="kizspyMapGrid">
              ${(LHState.qSet || [])
                .map((qItem, idx) => {
                  const userSel = LHState.qSel[idx] || '';
                  const isUserDone = !!userSel;
                  const isChecked = examOnlyReview || !!kizspyCheckedMap[idx];
                  const isCurrent = idx === examOnlyIndex;
                  const correctAnsStr = qItem.answer || '';
                  const isCorrect = isUserDone && S(userSel) === S(correctAnsStr);

                  let itemClass = '';
                  if (isCurrent) itemClass += ' current';
                  if (isChecked && isUserDone) {
                    itemClass += isCorrect ? ' ok' : ' bad';
                  } else if (isUserDone) {
                    itemClass += ' done';
                  }

                  const subLabel = userSel ? E(userSel) : isChecked && isUserDone ? (isCorrect ? '✓' : '✕') : '';

                  return `
                  <div class="kizspyMapItem ${itemClass}" data-exam-jump="${idx}">
                    <span>${idx + 1}</span>
                    ${subLabel ? `<span class="kizspyMapItemSub">${subLabel}</span>` : ''}
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      `;

      // Clear main body to prevent duplicates behind portal
      body.innerHTML = `<div style="padding:20px;text-align:center;color:#94a3b8;">(Đang ở chế độ Kizspy EOS Portal)</div>`;

      setTimeout(() => {
        const openMapBtn = portal.querySelector('#kizspyOpenMapBtn');
        const mapModal = portal.querySelector('#kizspyMapModal');
        const closeMapBtn = portal.querySelector('#kizspyCloseMapBtn');

        if (openMapBtn && mapModal) {
          openMapBtn.onclick = () => mapModal.classList.remove('hidden');
        }
        if (closeMapBtn && mapModal) {
          closeMapBtn.onclick = () => mapModal.classList.add('hidden');
        }
        if (mapModal) {
          mapModal.onclick = e => {
            if (e.target === mapModal) mapModal.classList.add('hidden');
          };
          mapModal.querySelectorAll('[data-exam-jump]').forEach(item => {
            item.onclick = e => {
              e.preventDefault();
              e.stopPropagation();
              const idx = parseInt(item.getAttribute('data-exam-jump'), 10);
              if (!isNaN(idx)) {
                examOnlyIndex = idx;
                mapModal.classList.add('hidden');
                saveExam();
                draw();
              }
            };
          });
        }
        const divider = portal.querySelector('.kizspyDividerLine');
        const container = portal.querySelector('.kizspyMainSplit');
        const leftPane = portal.querySelector('.kizspyLeftPane');
        if (divider && container && leftPane) {
          let isDragging = false;
          const startDrag = e => {
            if (e) e.preventDefault();
            isDragging = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          };
          const doDrag = e => {
            if (!isDragging) return;
            if (window.innerWidth <= 768) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const rect = container.getBoundingClientRect();
            const pct = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
            kizspySplitPct = Math.round(pct * 10) / 10;
            try {
              localStorage.setItem('hod102_kizspy_split_pct', String(kizspySplitPct));
            } catch (ex) {
              lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
            }
            leftPane.style.setProperty('flex', `0 0 ${kizspySplitPct}%`, 'important');
            leftPane.style.setProperty('width', `${kizspySplitPct}%`, 'important');
          };
          const stopDrag = () => {
            if (isDragging) {
              isDragging = false;
              document.body.style.cursor = '';
              document.body.style.userSelect = '';
            }
          };
          divider.addEventListener('mousedown', startDrag);
          window.addEventListener('mousemove', doDrag);
          window.addEventListener('mouseup', stopDrag);
          divider.addEventListener('touchstart', startDrag, { passive: false });
          window.addEventListener('touchmove', doDrag, { passive: false });
          window.addEventListener('touchend', stopDrag);
        }

        const fontDecBtn = portal.querySelector('#kizspyFontDec');
        if (fontDecBtn) {
          fontDecBtn.onclick = () => {
            if (kizspyFontSize > 9) {
              kizspyFontSize--;
              try {
                localStorage.setItem('hod102_kizspy_font_size', String(kizspyFontSize));
              } catch (ex) {
                lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
              }
              saveExam();
              draw();
            }
          };
        }

        const fontResetBtn = portal.querySelector('#kizspyFontReset');
        if (fontResetBtn) {
          fontResetBtn.onclick = () => {
            kizspyFontSize = 10;
            try {
              localStorage.setItem('hod102_kizspy_font_size', '10');
            } catch (ex) {
              lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
            }
            saveExam();
            draw();
          };
        }

        const fontIncBtn = portal.querySelector('#kizspyFontInc');
        if (fontIncBtn) {
          fontIncBtn.onclick = () => {
            if (kizspyFontSize < 24) {
              kizspyFontSize++;
              try {
                localStorage.setItem('hod102_kizspy_font_size', String(kizspyFontSize));
              } catch (ex) {
                lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
              }
              saveExam();
              draw();
            }
          };
        }

        const checkBtn = portal.querySelector('#kizspyQuickCheck');
        if (checkBtn) {
          checkBtn.onclick = () => {
            kizspyCheckedMap[examOnlyIndex] = !kizspyCheckedMap[examOnlyIndex];
            saveExam();
            draw();
          };
        }

        // Option click handlers inside Portal (both Left Pane boxes & Right Pane text)
        portal.querySelectorAll('[data-exam-opt]').forEach(el => {
          el.onclick = e => {
            if (examOnlyReview) return;
            const selText = window.getSelection() ? window.getSelection().toString().trim() : '';
            if (selText.length > 0) return;
            const k = el.getAttribute('data-exam-opt');
            if (!k) return;
            const isMulti = (c.answer || '').length > 1;
            if (isMulti) {
              let cur = (LHState.qSel[examOnlyIndex] || '').split('').filter(Boolean);
              if (cur.includes(k)) cur = cur.filter(x => x !== k);
              else cur.push(k);
              cur.sort();
              LHState.qSel[examOnlyIndex] = cur.join('');
            } else {
              LHState.qSel[examOnlyIndex] = k;
            }
            saveExam();
            draw();
          };
        });

        // Prev / Next / Layout Toggle / Submit / Exit buttons inside Portal
        const pBtn = portal.querySelector('#examPrev');
        if (pBtn)
          pBtn.onclick = () => {
            if (examOnlyIndex > 0) {
              examOnlyIndex--;
              saveExam();
              draw();
            }
          };

        const nBtn = portal.querySelector('#examNext');
        if (nBtn)
          nBtn.onclick = () => {
            if (examOnlyIndex < total - 1) {
              examOnlyIndex++;
              saveExam();
              draw();
            }
          };

        const tBtn = portal.querySelector('#examToggleLayout');
        if (tBtn)
          tBtn.onclick = () => {
            examLayoutMode = 'standard';
            try {
              localStorage.setItem('hod102_exam_layout_mode', 'standard');
            } catch (ex) {
              lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
            }
            document.body.classList.remove('kizspy-active');
            if (portal) portal.remove();
            saveExam();
            draw();
          };

        const sBtn = portal.querySelector('#examSubmit');
        if (sBtn)
          sBtn.onclick = () => {
            submit();
          };

        const exBtn = portal.querySelector('#examOnlyExit');
        if (exBtn)
          exBtn.onclick = () => {
            if (confirm('Thoát bài kiểm tra hiện tại?')) {
              document.body.classList.remove('kizspy-active');
              if (portal) portal.remove();
              clearExam();
              LHState.qSet = [];
              LHState.qSel = {};
              LHState.qDone = {};
              kizspyCheckedMap = {};
              LHState.examSubmitted = false;
              examOnlyReview = false;
              examOnlyIndex = 0;
              resetTimer();
              draw();
            }
          };

        const exToResBtn = portal.querySelector('#examOnlyExitToResult');
        if (exToResBtn)
          exToResBtn.onclick = () => {
            examOnlyReview = false;
            document.body.classList.remove('kizspy-active');
            if (portal) portal.remove();
            saveExam();
            draw();
          };
      }, 20);
    } else {
      document.body.classList.remove('kizspy-active');
      const portal = document.getElementById('kizspyExamPortal');
      if (portal) portal.remove();
      const titleHTML = examOnlyReview
        ? `Câu ${examOnlyIndex + 1} / ${total} <span class="reviewModeHeaderTag" style="font-size:0.88rem;color:var(--gold2);background:rgba(200,169,110,0.1);padding:3px 8px;border-radius:999px;border:1px solid rgba(200,169,110,0.3);margin-left:8px;vertical-align:middle;font-weight:800;letter-spacing:0.04em;">XEM LẠI</span>`
        : `Câu ${examOnlyIndex + 1} / ${total}`;

      const subtitleHTML = examOnlyReview
        ? `Đúng: <b style="color:#72c58c;">${scoreExam().ok}</b> · Sai: <b style="color:#e9877b;">${scoreExam().bad}</b> · Thời gian: <b>${timeText()}</b>`
        : `Đã làm: ${done()} / ${total} · Thời gian: <span id="examTimer">${timeText()}</span>`;

      const footerHTML = examOnlyReview
        ? `<div class="examOnlyFooter review-mode"><div class="examOnlyNav" style="grid-column: 1 / -1 !important;"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? 'disabled' : ''}>← Câu trước</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? 'disabled' : ''}>Câu tiếp →</button></div></div>`
        : `<div class="examOnlyFooter"><div class="examOnlyNav"><button type="button" class="btn" id="examPrev" ${examOnlyIndex <= 0 ? 'disabled' : ''}>← Câu trước</button><button type="button" class="btn" id="examNext" ${examOnlyIndex >= total - 1 ? 'disabled' : ''}>Câu tiếp →</button></div><button type="button" class="submitExam" id="examSubmit">Nộp bài</button></div>`;

      const exitBtn = examOnlyReview
        ? `<button type="button" class="examOnlyExit" id="examOnlyExitToResult">Xem kết quả</button>`
        : `<button type="button" class="examOnlyExit" id="examOnlyExit">Thoát</button>`;

      const opts = Object.entries(c.options || {})
        .map(([k, v]) => {
          const isChecked = String(ch).includes(k);
          const isUserChose = ch.includes(k);
          const isCorrect = correctAns.includes(k);
          let stateClass = isChecked ? 'sel' : '';
          if (examOnlyReview) {
            if (isCorrect) stateClass = 'review-correct';
            else if (isUserChose && !isCorrect) stateClass = 'review-incorrect';
          }
          return `
          <button type="button" class="examOnlyOption ${stateClass}" ${!examOnlyReview ? `data-exam-opt="${E(k)}"` : ''}>
            <span class="qkey">${E(k)}</span>
            <span class="qtxt">${E(v)}</span>
            ${examOnlyReview ? (isCorrect ? '<span style="margin-left:auto;color:#72c58c;font-weight:bold;">✓</span>' : isUserChose ? '<span style="margin-left:auto;color:#e9877b;font-weight:bold;">×</span>' : '') : ''}
          </button>
        `;
        })
        .join('');

      const gridItems = (LHState.qSet || [])
        .map((q, idx) => {
          const isCur = idx === examOnlyIndex;
          const isDone = !!LHState.qSel[idx];
          let stateClass = '';
          if (examOnlyReview) {
            const isCorrect = S(LHState.qSel[idx]) === S(q.answer);
            stateClass = isCorrect ? 'review-grid-correct review-ok' : 'review-grid-incorrect review-bad';
          } else {
            stateClass = isDone ? 'answered' : '';
          }
          return `
          <button type="button" class="examGridItem ${stateClass} ${isCur ? 'active' : ''}" data-exam-jump="${idx}">
            ${idx + 1}
          </button>
        `;
        })
        .join('');

      body.innerHTML = `
        <div class="examOnlyGridContainer">
          <section class="examOnlyCard">
            <div class="examOnlyTopline">
              <div>
                <div class="examOnlyQuestionNo">${titleHTML}</div>
                <div class="examOnlyMeta">${subtitleHTML}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <button type="button" class="examOnlyExit" id="examToggleLayout" style="background:rgba(200,169,110,0.15);color:var(--gold2);">⇄ Đổi giao diện</button>
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
            <div class="examSidebarHead"><h4>Bản đồ câu hỏi</h4></div>
            <div class="examSidebarGrid">${gridItems}</div>
          </aside>
        </div>
      `;
    }
    setTimerText();
  }
  function timeText() {
    return examElapsed || '00:00';
  }

  function result() {
    const box = document.querySelector('#quiz .setup');
    if (box) box.classList.add('hidden');
    const body = $('quizBody');
    if (!body) return;
    const s = scoreExam();
    const label =
      s.pct >= 90 ? 'Xuất sắc' : s.pct >= 70 ? 'Khá ổn rồi' : s.pct >= 50 ? 'Cần ôn thêm' : 'Nên làm lại vài vòng';
    body.innerHTML = `<section class="examOnlyResult"><div class="examOnlyBadge">KẾT QUẢ KIỂM TRA</div><h2>${s.ok} / ${s.total} câu đúng</h2><div class="examOnlyScore">${s.pct}%</div><p>${label}</p><div class="examOnlyStats"><span>Đúng: <b>${s.ok}</b></span><span>Sai: <b>${s.bad}</b></span><span>Thời gian: <b>${timeText()}</b></span></div><div class="examOnlyActions"><button type="button" class="primary" id="examReviewBtn">Xem lại bài làm</button><button type="button" class="btn" id="examRetryBtn">Làm lại bộ này</button><button type="button" class="btn" id="examNewBtn">Tạo đề mới</button></div><div id="examReviewList" class="examOnlyReviewList hidden"></div></section>`;
    if (examOnlyReview) review();
  }

  function review() {
    const list = $('examReviewList');
    if (!list) return;
    list.classList.remove('hidden');
    list.innerHTML = (LHState.qSet || [])
      .map((c, i) => {
        const ch = LHState.qSel[i] || '';
        const correctAns = c.answer || '';
        const ok = S(ch) === S(correctAns);

        const reviewOpts = Object.entries(c.options || {})
          .map(([k, v]) => {
            const isUserChose = ch.includes(k);
            const isCorrect = correctAns.includes(k);
            let stateClass = '';
            let badgeHTML = '';
            if (isCorrect) {
              stateClass = 'review-opt-correct';
              badgeHTML = `<span class="review-opt-badge correct">✓</span>`;
            } else if (isUserChose && !isCorrect) {
              stateClass = 'review-opt-incorrect';
              badgeHTML = `<span class="review-opt-badge incorrect">×</span>`;
            } else {
              stateClass = 'review-opt-normal';
            }
            return `<div class="examReviewOpt ${stateClass}"><span class="qkey">${k}</span><span class="qtxt">${E(v)}</span>${badgeHTML}</div>`;
          })
          .join('');

        return `
        <div class="examOnlyReviewItem ${ok ? 'item-correct' : 'item-incorrect'}">
          <div class="examOnlyReviewHeader">
            <span class="reviewItemNo">CÂU ${i + 1}</span>
            <span class="reviewStatusBadge ${ok ? 'correct' : 'incorrect'}">${ok ? 'ĐÚNG' : 'SAI'}</span>
          </div>
          <div class="examOnlyReviewQ">${E(c.question)}</div>
          <div class="qimgs">${IMG(c)}</div>
          <div class="examOnlyReviewOptionsList">${reviewOpts}</div>
        </div>
      `;
      })
      .join('');
  }

  function submit() {
    if (!confirm('Bạn chắc chắn muốn nộp bài?\n\nĐã làm: ' + done() + ' / ' + (LHState.qSet || []).length + ' câu'))
      return;
    examElapsed = FMT(nowTimerMs());
    LHState.examSubmitted = true;
    examOnlyReview = false;
    document.body.classList.remove('kizspy-active');
    const portal = document.getElementById('kizspyExamPortal');
    if (portal) portal.remove();
    stopTimer();
    saveExam();
    result();
  }

  function bind() {
    markTab();
    removeOldQuizUI();
    setup();
    const label = $('quizModeLabel');
    if (label) label.textContent = 'Kiểm tra: nộp bài mới hiện đáp án';
    const body = $('quizBody');
    if (body && body.dataset.examOnlyBound !== '1') {
      body.dataset.examOnlyBound = '1';

      document.addEventListener(
        'keydown',
        e => {
          if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          if ($('quiz') && $('quiz').classList.contains('active')) {
            if (e.key === 'ArrowRight') {
              if (LHState.qSet && LHState.qSet.length) {
                examOnlyIndex = Math.min(LHState.qSet.length - 1, examOnlyIndex + 1);
                saveExam();
                draw();
              }
              return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
              if (LHState.qSet && LHState.qSet.length) {
                examOnlyIndex = Math.max(0, examOnlyIndex - 1);
                saveExam();
                draw();
              }
              if (e.key === 'Backspace') e.preventDefault();
              return;
            }

            // Keyboard shortcut for choosing options A, B, C, D, E or 1, 2, 3, 4, 5
            const keyUpper = e.key.toUpperCase();
            let keyOpt = '';
            if (['A', 'B', 'C', 'D', 'E'].includes(keyUpper)) {
              keyOpt = keyUpper;
            } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
              const mapKey = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
              keyOpt = mapKey[e.key];
            }
            if (keyOpt && !LHState.examSubmitted && LHState.qSet && LHState.qSet.length) {
              const c = LHState.qSet[examOnlyIndex];
              if (c && c.options && c.options[keyOpt]) {
                if (String(c.answer || '').length > 1) {
                  const set = new Set(
                    String(LHState.qSel[examOnlyIndex] || '')
                      .split('')
                      .filter(Boolean),
                  );
                  set.has(keyOpt) ? set.delete(keyOpt) : set.add(keyOpt);
                  LHState.qSel[examOnlyIndex] = Array.from(set).sort().join('');
                } else {
                  LHState.qSel[examOnlyIndex] = keyOpt;
                }
                saveExam();
                draw();
                return;
              }
            }

            if (e.key === 'Escape') {
              if (examOnlyReview) {
                examOnlyReview = false;
                saveExam();
                draw();
              } else {
                const exitBtn = $('examOnlyExit') || $('examOnlyExitToResult');
                if (exitBtn) exitBtn.click();
              }
              return;
            }
            if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
            }
          }
        },
        true,
      );

      body.addEventListener('click', e => {
        const opt = e.target.closest('[data-exam-opt]');
        if (opt && !LHState.examSubmitted && LHState.qSet && LHState.qSet.length) {
          const c = LHState.qSet[examOnlyIndex];
          const k = opt.dataset.examOpt;
          if (c && String(c.answer || '').length > 1) {
            const set = new Set(
              String(LHState.qSel[examOnlyIndex] || '')
                .split('')
                .filter(Boolean),
            );
            set.has(k) ? set.delete(k) : set.add(k);
            LHState.qSel[examOnlyIndex] = Array.from(set).sort().join('');
          } else LHState.qSel[examOnlyIndex] = k;
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examEditCard' || e.target.closest('#examEditCard')) {
          const c = LHState.qSet && LHState.qSet[examOnlyIndex];
          if (c && typeof window.openStudyReport === 'function') window.openStudyReport(c.num);
          else if (typeof window.openEditor === 'function') window.openEditor();
          return;
        }
        if (e.target.id === 'examToggleLayout') {
          examLayoutMode = examLayoutMode === 'kizspy' ? 'standard' : 'kizspy';
          try {
            localStorage.setItem('hod102_exam_layout_mode', examLayoutMode);
          } catch (ex) {
            lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', ex);
          }
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examPrev') {
          examOnlyIndex = Math.max(0, examOnlyIndex - 1);
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examNext') {
          examOnlyIndex = Math.min((LHState.qSet || []).length - 1, examOnlyIndex + 1);
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examSubmit') {
          submit();
          return;
        }
        if (e.target.id === 'examReviewBtn') {
          examOnlyReview = true;
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examOnlyExitToResult') {
          examOnlyReview = false;
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examRetryBtn') {
          LHState.qSel = {};
          LHState.qDone = {};
          // Phải xóa map "đã check đáp án" của giao diện thi, không thì làm lại bộ này là
          // các câu từng bấm "Check đáp án" hiện sẵn đáp án đúng ngay khi mở.
          kizspyCheckedMap = {};
          LHState.examSubmitted = false;
          examOnlyReview = false;
          examOnlyIndex = 0;
          startTimer(0);
          saveExam();
          draw();
          return;
        }
        if (e.target.id === 'examNewBtn' || e.target.id === 'examOnlyExit') {
          if (e.target.id === 'examOnlyExit' && !confirm('Thoát bài kiểm tra hiện tại?')) return;
          clearExam();
          LHState.qSet = [];
          LHState.qSel = {};
          LHState.qDone = {};
          kizspyCheckedMap = {};
          LHState.examSubmitted = false;
          examOnlyReview = false;
          examOnlyIndex = 0;
          resetTimer();
          draw();
          return;
        }
        const jump = e.target.closest('[data-exam-jump]');
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

  // Bản THẬT của renderQuiz. Trước khi tách, block gán thẳng vào binding module của
  // appCore (`renderQuiz = …`, có try/catch dự phòng ra window). Từ file khác thì không
  // gán được binding đó nữa, nên chỉ còn đường window — và appCore đổi `renderQuiz` của
  // nó thành hàm mỏng chuyển tiếp sang đây (appCore ~dòng 540).
  window.renderQuiz = function () {
    setup();
    draw();
  };

  window.__examResetForSubjectChange = function () {
    try {
      stopTimer();
    } catch (e) {
      lhWarn('FINAL_EXAM_ONLY_QUIZ_UI_20260627', e);
    }
    LHState.qSet = [];
    LHState.qSel = {};
    LHState.qDone = {};
    LHState.examSubmitted = false;
    examOnlyReview = false;
    examOnlyIndex = 0;
    examElapsed = '00:00';
    examSelectedCodes = [];
    LHState.quizMode = 'exam';
    kizspyCheckedMap = {};
    examRangeOn = false;
    examRangeFrom = '';
    examRangeTo = '';
    document.body.classList.remove('kizspy-active');
    const portal = document.getElementById('kizspyExamPortal');
    if (portal) portal.remove();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(bind, 120));
  else setTimeout(bind, 120);
  setTimeout(bind, 900);
}
// ===== FINAL_EXAM_ONLY_QUIZ_UI_20260627 END =====
