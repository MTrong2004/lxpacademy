/**
 * Student Search & Add Question Module
 */
import { LHState } from './state.js';
import { esc, sortAns } from './format.js';
import { lhWarn } from '../core/log.js';

// `filterQuestions` đã XÓA 20260731: không chỗ nào gọi. Tìm kiếm thật của tab Thư viện là
// `smartBetter` trong installSmartSearch ngay dưới (có bỏ stopword + chấm điểm liên quan),
// hàm này chỉ là bản lọc chuỗi thô lọt lại từ lần tách file.

export function installSmartSearch() {
  // ===== FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614 =====
  // Search khôn hơn: bỏ từ rác như what/the/are, ưu tiên đúng cụm, ẩn câu không liên quan, chỉ highlight từ quan trọng.
  (function () {
    const $ = id => document.getElementById(id);
    const STOPWORDS = new Set([
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'if',
      'then',
      'else',
      'when',
      'where',
      'why',
      'how',
      'what',
      'which',
      'who',
      'whom',
      'whose',
      'is',
      'am',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'do',
      'does',
      'did',
      'done',
      'have',
      'has',
      'had',
      'having',
      'can',
      'could',
      'should',
      'would',
      'will',
      'shall',
      'may',
      'might',
      'must',
      'in',
      'on',
      'at',
      'by',
      'for',
      'from',
      'to',
      'of',
      'with',
      'without',
      'into',
      'onto',
      'over',
      'under',
      'between',
      'among',
      'about',
      'as',
      'than',
      'that',
      'this',
      'these',
      'those',
      'it',
      'its',
      'their',
      'there',
      'here',
      'two',
      'three',
      'four',
      'five',
      'one',
      'option',
      'options',
      'choose',
      'check',
      'select',
      'following',
      'main',
      'la',
      'là',
      'cua',
      'của',
      'va',
      'và',
      'cac',
      'các',
      'nhung',
      'những',
      'mot',
      'một',
      'cho',
      'voi',
      'với',
      'trong',
      'ngoai',
      'ngoài',
      'duoc',
      'được',
      'khong',
      'không',
      'nao',
      'nào',
      'gi',
      'gì',
      'hay',
      'hoac',
      'hoặc',
      'dap',
      'an',
      'dapan',
      'dapán',
      'cau',
      'câu',
    ]);

    function normText(s) {
      return String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9#:\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function splitTokens(s) {
      return normText(s).split(/\s+/).filter(Boolean);
    }
    function meaningfulTokens(q) {
      const raw = splitTokens(q);
      return raw.filter(t => {
        if (!t) return false;
        if (STOPWORDS.has(t)) return false;
        if (t.length < 3 && !/^\d+$/.test(t)) return false;
        if (/^(answer|ans|multi|multiple|chon|nhieu|lua|dap|an|dapan)$/.test(t)) return false;
        if (t.includes(':')) return false;
        return true;
      });
    }
    function parseQuery(q) {
      const raw = String(q ?? '').trim();
      const n = normText(raw);
      const p = { raw, norm: n, num: null, answer: null, multi: false, tokens: [], numericOnly: false, phrase: '' };
      p.numericOnly = /^\d+$/.test(n);
      let m = n.match(/(?:^|\s)#\s*(\d+)(?:\s|$)/) || n.match(/(?:^|\s)cau\s*(\d+)(?:\s|$)/);
      if (m) p.num = Number(m[1]);
      if (p.numericOnly) p.num = Number(n);
      m = n.match(/(?:answer|ans|dap\s*an|dapan)\s*:\s*([a-e]+)/i);
      if (m) p.answer = m[1].toUpperCase().split('').sort().join('');
      p.multi = /(^|\s)(multi|multiple|chon nhieu|nhieu dap an|nhieu lua chon)(\s|$)/.test(n);
      p.tokens = meaningfulTokens(raw).filter(t => {
        if (/^#?\d+$/.test(t) && p.num !== null) return false;
        if (/^[a-e]+$/.test(t) && p.answer) return false;
        return true;
      });
      p.phrase = p.tokens.join(' ');
      return p;
    }
    function optionText(c) {
      return Object.values(c?.options || {}).join(' ');
    }
    function correctAnswerText(c) {
      const ans = String(c?.answer || '').toUpperCase();
      const opts = c?.options || {};
      return ans
        .split('')
        .map(k => opts[k] || '')
        .join(' ');
    }
    function hasWholeNumber(text, num) {
      return new RegExp('(^|\\D)' + String(num).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=\\D|$)').test(
        String(text ?? ''),
      );
    }
    function editDistanceOne(a, b) {
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      let i = 0,
        j = 0,
        ed = 0;
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
      const words = textNorm.split(/\s+/).filter(w => Math.abs(w.length - token.length) <= 1);
      return words.some(w => editDistanceOne(token, w));
    }
    function countMatches(tokens, textNorm) {
      let n = 0;
      for (const t of tokens) if (tokenInText(t, textNorm)) n++;
      return n;
    }
    function scoreQuestion(c, p) {
      if (!p.raw) return { ok: true, score: 0, auto: false };
      const ansSorted = sortAns(String(c.answer || '').toUpperCase());
      if (p.answer && ansSorted !== p.answer) return { ok: false, score: -1, auto: false };
      if (p.multi && String(c.answer || '').length <= 1) return { ok: false, score: -1, auto: false };

      const qNorm = normText(c.question || '');
      const optNorm = normText(optionText(c));
      const corNorm = normText(correctAnswerText(c));
      const ansLineNorm = normText([c.answer, c.answer_text, correctAnswerText(c)].join(' '));
      const allNorm = normText([c.num, c.question, c.answer, c.answer_text, optionText(c)].join(' '));
      let score = 0,
        auto = false;

      if (p.num !== null) {
        const exact = Number(c.num) === p.num;
        const answerHasNum = hasWholeNumber([c.answer_text, correctAnswerText(c)].join(' '), p.num);
        if (p.numericOnly) {
          if (!exact && !answerHasNum) return { ok: false, score: -1, auto: false };
          score += exact ? 2000 : 850;
          auto = answerHasNum;
        } else {
          if (!exact) return { ok: false, score: -1, auto: false };
          score += 2000;
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

        // Nếu query có nhiều từ quan trọng, bắt buộc khớp phần lớn từ.
        const required = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.72);
        if (allHit < required) return { ok: false, score: -1, auto: false };

        // Ưu tiên đúng cụm liên tiếp.
        if (p.phrase && qNorm.includes(p.phrase)) score += 1200;
        if (p.phrase && optNorm.includes(p.phrase)) score += 850;
        if (p.phrase && corNorm.includes(p.phrase)) {
          score += 1000;
          auto = true;
        }

        score += qHit * 180 + optHit * 95 + corHit * 160;
        if (corHit > 0 || (p.phrase && ansLineNorm.includes(p.phrase))) auto = true;

        // Phạt nặng mấy câu chỉ trúng từ quá chung rải rác.
        if (tokens.length >= 3 && qHit === 0 && optHit < required) return { ok: false, score: -1, auto: false };
        if (tokens.length >= 4 && allHit < tokens.length) score -= (tokens.length - allHit) * 220;
      } else if (!p.num && !p.answer && !p.multi) {
        return { ok: false, score: -1, auto: false };
      }

      return { ok: true, score, auto };
    }
    function smartBetter(q) {
      const p = parseQuery(q);
      if (!p.raw) return LHState.RAW;
      return LHState.RAW.map(c => ({ c, m: scoreQuestion(c, p) }))
        .filter(x => x.m.ok)
        .sort((a, b) => b.m.score - a.m.score || Number(a.c.num) - Number(b.c.num))
        .map(x => Object.assign({}, x.c, { __autoOpenAnswer: x.m.auto }));
    }
    function markText(text, query, cls = 'tokenMark') {
      const parser = typeof parseQuery === 'function' ? parseQuery : parseQ;
      const p = parser(query);
      const source = String(text ?? '');

      function escLocal(s) {
        return esc(s);
      }

      function normWithMap(s) {
        let norm = '',
          map = [],
          lastSpace = true;
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
            norm += ' ';
            map.push(i);
            lastSpace = true;
          }
        }
        norm = norm.trimEnd();
        while (norm.startsWith(' ')) {
          norm = norm.slice(1);
          map.shift();
        }
        return { norm, map };
      }

      // Nếu người dùng tìm bằng cả cụm câu hỏi thì tô liền cả cụm, không tách từng từ.
      if (cls === 'phraseMark' && p.norm && p.norm.length >= 6 && !p.numericOnly && !p.answer && !p.multi) {
        const nm = normWithMap(source);
        const hit = nm.norm.indexOf(p.norm);
        if (hit >= 0) {
          const start = nm.map[hit] ?? 0;
          const end = (nm.map[hit + p.norm.length - 1] ?? source.length - 1) + 1;
          return (
            escLocal(source.slice(0, start)) +
            `<mark class="searchMark phraseMark">${escLocal(source.slice(start, end))}</mark>` +
            escLocal(source.slice(end))
          );
        }
      }

      const tokens = p.numericOnly ? [String(p.num)] : (p.tokens || []).slice(0, 10);
      if (!tokens.length) return escLocal(source);
      const parts = source.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) || [source];
      return parts
        .map(part => {
          const np = normText(part);
          if (np && tokens.some(t => np === t || np.includes(t) || t.includes(np))) {
            return `<mark class="searchMark ${cls}">${escLocal(part)}</mark>`;
          }
          return escLocal(part);
        })
        .join('');
    }
    function optionStudy(c, q) {
      return Object.entries(c.options || {})
        .map(([k, v]) => {
          const right = String(c.answer || '').includes(k);
          return `<div class="sopt ${right ? 'ans correct' : ''}"><div class="skey">${right ? '✓' : esc(k)}</div><div>${esc(k + '. ')}${markText(v, q)}</div></div>`;
        })
        .join('');
    }
    function renderStudyBetter() {
      const input = $('search');
      const q = input ? input.value || '' : '';
      if (input) input.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
      const arr = smartBetter(q);
      const max = arr.length;
      const html = arr
        .slice(0, max)
        .map(c => {
          const auto = !!c.__autoOpenAnswer;
          return `<div class="sitem compactStudyCard ${auto ? 'autoOpenAnswer open' : ''}" data-num="${esc(c.num)}" tabindex="0">
        <div class="compactCardLine">
          <div class="compactCardMeta"><span class="snum compactSubject">CÂU ${esc(c.num)}</span></div>
          <div class="sq compactQuestionText">${markText(c.question, q, 'phraseMark')}</div>
          <div class="compactCardRight">${auto ? '<span class="answerMatchChip">Khớp đáp án</span>' : ''}<button type="button" class="studyReportBtn" data-report-num="${esc(c.num)}" title="Báo cáo câu ${esc(c.num)}">!</button><span class="expandHint"></span></div>
        </div>
        <div class="compactCardDetails"><div class="qimgs">${imgsHTML(c)}</div><div class="sopts">${optionStudy(c, q)}</div></div>
      </div>`;
        })
        .join('');
      $('studyList').innerHTML =
        html +
        (arr.length > max
          ? `<div class="more">Đang hiển thị ${max} / ${arr.length} kết quả.</div>`
          : arr.length
            ? ''
            : '<div class="more">Không tìm thấy kết quả.</div>');
    }
    function bindBetterSearch() {
      const s = $('search');
      if (s) {
        s.oninput = renderStudyBetter;
        s.placeholder = 'Tìm câu / đáp án: adopted laws, #26, answer:BC, multi...';
      }
      const list = $('studyList');
      if (list && !list.__betterSearchBound) {
        list.__betterSearchBound = true;
        list.addEventListener(
          'click',
          function (e) {
            const rb = e.target.closest('[data-report-num]');
            if (rb) {
              e.preventDefault();
              e.stopImmediatePropagation();
              window.openStudyReport?.(rb.dataset.reportNum, e);
              return;
            }
            const it = e.target.closest('.sitem');
            if (!it) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            it.classList.toggle('open');
            it.classList.remove('autoOpenAnswer');
          },
          true,
        );
      }
    }

    smart = smartBetter;
    // Hai dòng `renderStudy = renderStudyBetter` / `window.renderStudy = …` ĐÃ XÓA (20260727):
    // STEP1 (renderUnified, nay ở ./library.js) ghi đè renderStudy nên chúng không vẽ thư viện,
    // và phải xóa để hàm chuyển tiếp `renderStudy` (~dòng 613) không bị gán trần đè lên —
    // từ file khác thì library.js chỉ gán được `window.renderStudy`.
    // `smart = smartBetter` ngay trên vẫn SỐNG; `renderStudyBetter()` vẫn được gọi trực tiếp
    // ở DOMContentLoaded dưới đây, y như trước.
    document.addEventListener('DOMContentLoaded', function () {
      bindBetterSearch();
      setTimeout(bindBetterSearch, 100);
      setTimeout(bindBetterSearch, 600);
      try {
        renderStudyBetter();
      } catch (e) {
        lhWarn('FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614', e);
      }
    });
  })();
}

export function installAddQuestionDisplay() {
  // ===== COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====
  // Đã gộp các bản vá nút + / form thêm câu để tránh chồng lấn. Giữ giao diện đang hiển thị: form đẹp, nút + chỉ ở tab Thư viện và ẩn khi modal mở.
  (function () {
    const SUBJECT_STORE = 'learninghub_subject_code_merged_v1';
    const $ = id => document.getElementById(id);
    const subjectCode = () => localStorage.getItem(SUBJECT_STORE) || '';
    const client = () => window.HODSupabase?.__client || null;
    const user = () => window.HODSupabase?.getUser?.() || null;
    const profile = () => window.HODSupabase?.getProfile?.() || null;
    const esc = s =>
      String(s ?? '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    const ADD_IMG_DRAFT_KEY = 'learninghub_add_question_images_draft_v1';
    function saveAddImagesDraft() {
      try {
        localStorage.setItem(ADD_IMG_DRAFT_KEY, JSON.stringify(addImages));
      } catch (e) {
        lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
      }
    }
    function loadAddImagesDraft() {
      try {
        return JSON.parse(localStorage.getItem(ADD_IMG_DRAFT_KEY) || '[]') || [];
      } catch (e) {
        return [];
      }
    }
    function clearAddImagesDraft() {
      try {
        localStorage.removeItem(ADD_IMG_DRAFT_KEY);
      } catch (e) {
        lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
      }
    }
    let addImages = loadAddImagesDraft();
    let addUploading = 0;

    function canManage() {
      const p = profile();
      const role = String(p?.role || '').toLowerCase();
      return (
        !!user() && (role === 'admin' || role === 'editor') && !(p?.blocked || p?.is_blocked || p?.status === 'blocked')
      );
    }
    function isAllTab() {
      return (
        $('study')?.classList.contains('active') || document.querySelector('.tab.active')?.dataset?.tab === 'study'
      );
    }
    function nextNum() {
      const nums = (LHState.RAW || []).map(q => Number(q.num)).filter(Number.isFinite);
      return nums.length ? Math.max(...nums) + 1 : 1;
    }
    function notifyOk(msg) {
      if (typeof notify === 'function') notify(msg);
      else alert(msg);
    }

    function ensurePlus() {
      let btn = $('addQuestionFab');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'addQuestionFab';
        btn.type = 'button';
        btn.title = 'Thêm câu hỏi';
        btn.textContent = '+';
        document.body.appendChild(btn);
      }
      btn.classList.add('prettyAddFab');
      btn.innerHTML = '<span>+</span>'; // khóa 1 icon, không tạo bóng/ghost
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openPrettyAddModal();
      };
      return btn;
    }

    function modalOpen() {
      const m = $('addQuestionModal');
      return !!m && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none';
    }

    function updatePlus() {
      const btn = ensurePlus();
      const open = modalOpen();
      const show = canManage() && isAllTab() && !open;
      document.body.classList.toggle('add-question-visible', show);
      document.body.classList.toggle('add-question-modal-open', open);
      btn.classList.toggle('hidden', !show);
      btn.setAttribute('aria-hidden', show ? 'false' : 'true');
      btn.style.setProperty('display', show ? 'flex' : 'none', 'important');
      btn.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
      btn.style.setProperty('opacity', show ? '1' : '0', 'important');
      btn.style.setProperty('pointer-events', show ? 'auto' : 'none', 'important');
      if (!canManage() || !isAllTab()) $('addQuestionModal')?.classList.add('hidden');
    }

    function cleanupLimitText() {
      const list = $('studyList');
      if (!list) return;
      list.querySelectorAll('.more').forEach(x => {
        if (/Đang hiển thị\s+\d+\s*\//i.test(x.textContent || '')) x.remove();
      });
    }

    function getImageFilesFromPaste(e) {
      const items = [...(e.clipboardData?.items || [])];
      return items
        .filter(item => item.kind === 'file' && String(item.type || '').startsWith('image/'))
        .map(item => item.getAsFile())
        .filter(Boolean);
    }

    async function uploadPrettyImageFiles(files, sourceLabel) {
      files = [...(files || [])].filter(file => file && String(file.type || '').startsWith('image/'));
      const st = $('addUploadStatus');
      const input = $('addImgUpload');
      const saveBtn = $('saveAddQuestion');
      if (!files.length) return;
      if (!window.__LHUploadCloudinary) {
        alert('Chưa sẵn sàng upload Cloudinary. Tải lại trang rồi thử lại.');
        return;
      }
      addUploading++;
      if (input) input.disabled = true;
      if (saveBtn) saveBtn.disabled = true;
      if (st) {
        st.style.display = 'block';
        st.textContent = 'Đang upload ' + files.length + ' ảnh lên Cloudinary...';
      }
      notifyOk(sourceLabel === 'paste' ? 'Đang upload ảnh vừa dán...' : 'Đang upload ảnh lên Cloudinary...');
      try {
        let done = 0;
        for (const file of files) {
          const uploaded = await window.__LHUploadCloudinary(file);
          if (uploaded) addImages.push(uploaded);
          done++;
          if (st) st.textContent = 'Đang upload ảnh ' + done + '/' + files.length + '...';
        }
        if (window.__LHCleanImages) addImages = window.__LHCleanImages(addImages);
        saveAddImagesDraft();
        renderPrettyImages();
        if (st) {
          st.textContent = 'Đã upload xong. URL nằm dưới ảnh.';
          setTimeout(() => {
            if (addUploading === 0) st.style.display = 'none';
          }, 2200);
        }
        notifyOk('Đã upload ảnh thành URL');
      } catch (err) {
        if (st) st.textContent = 'Upload lỗi: ' + (err.message || err);
        alert(err.message || err);
      } finally {
        addUploading = Math.max(0, addUploading - 1);
        if (addUploading === 0) {
          if (input) {
            input.disabled = false;
            input.value = '';
          }
          if (saveBtn) saveBtn.disabled = false;
        }
      }
    }

    function ensurePrettyModal() {
      let modal = $('addQuestionModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'addQuestionModal';
        modal.className = 'modal hidden addQuestionModal';
        document.body.appendChild(modal);
      }
      if (modal.dataset.prettyVersion === '20260614') return modal;
      modal.dataset.prettyVersion = '20260614';
      modal.className = 'modal hidden addQuestionModal';
      modal.innerHTML = `
      <div class="box editPreviewBox quizEditLayoutV2">
        <button type="button" class="modalX" id="addQuestionClose">×</button>
        <div class="v7Head editPreviewHead">
          <div>
            <span class="v7Label">THÊM MỚI</span>
            <h2>Thêm câu hỏi mới</h2>
            <p class="v7Hint">Nhập nội dung câu hỏi, các đáp án và upload ảnh nếu có.</p>
          </div>
        </div>
        <article class="v7Card editPreviewCard" style="margin:0!important; border:0!important; background:transparent!important; padding:0!important;">
          <div class="editPreviewTwoColumns">
            <div class="editPreviewLeftCol">
              <div class="v7Field">
                <label>Câu hỏi</label>
                <textarea id="addQuestionText" placeholder="Nhập nội dung câu hỏi..." style="min-height: 120px;"></textarea>
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Đáp án đúng</label>
                <input id="addQuestionAnswer" placeholder="Ví dụ: A hoặc BC">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Số câu</label>
                <input id="addQuestionNum" type="number" min="1" placeholder="Tự lấy số tiếp theo nếu để trống">
              </div>
              <div class="v7Field" style="margin-top: 10px;">
                <label>Hình ảnh</label>
                <input id="addImgUpload" type="file" accept="image/*" multiple>
                <div class="pasteImageHint addPasteImageHint">Có thể chụp/copy ảnh rồi bấm Ctrl + V trong khung này để tự upload URL.</div>
                <div id="addUploadStatus" style="display:none;margin-top:7px;color:var(--gold2);font-weight:900;font-size:.86rem;">Đang upload ảnh...</div>
                <div id="addImgs" class="editImgs addImgs" style="margin-top: 8px;">Chưa có hình.</div>
              </div>
            </div>
            <div class="editPreviewRightCol">
              <div class="v7Field" style="margin: 0!important;">
                <label>Các đáp án</label>
                <div id="editPreviewOptions" class="v7Options">
                  <div class="v7OptRow">
                    <div class="v7Key">A</div>
                    <input id="addOptA" placeholder="Nhập đáp án A">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptA').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">B</div>
                    <input id="addOptB" placeholder="Nhập đáp án B">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptB').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">C</div>
                    <input id="addOptC" placeholder="Nhập đáp án C">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptC').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">D</div>
                    <input id="addOptD" placeholder="Nhập đáp án D">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptD').value=''">×</button>
                  </div>
                  <div class="v7OptRow" style="margin-top: 8px;">
                    <div class="v7Key">E</div>
                    <input id="addOptE" placeholder="Có thể bỏ trống (E)">
                    <button class="v7DelOpt" type="button" onclick="document.getElementById('addOptE').value=''">×</button>
                  </div>
                </div>
              </div>
              <div class="v7Bottom" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
                <button type="button" class="btn" id="cancelAddQuestion">Đóng</button>
                <button type="button" class="primary" id="saveAddQuestion">Lưu câu hỏi</button>
              </div>
            </div>
          </div>
        </article>
      </div>`;

      $('addQuestionClose').onclick = closePrettyAddModal;
      $('cancelAddQuestion').onclick = closePrettyAddModal;
      $('saveAddQuestion').onclick = savePrettyQuestion;
      $('addImgUpload').onchange = e => uploadPrettyImageFiles(e.target.files, 'file');
      modal.addEventListener('paste', e => {
        const files = getImageFilesFromPaste(e);
        if (!files.length) return;
        e.preventDefault();
        uploadPrettyImageFiles(files, 'paste');
      });
      modal.addEventListener('dragover', e => {
        const hasFile = [...(e.dataTransfer?.items || [])].some(item => item.kind === 'file');
        if (!hasFile) return;
        e.preventDefault();
        modal.classList.add('dragImageOver');
      });
      modal.addEventListener('dragleave', () => modal.classList.remove('dragImageOver'));
      modal.addEventListener('drop', e => {
        const files = [...(e.dataTransfer?.files || [])].filter(file => String(file.type || '').startsWith('image/'));
        if (!files.length) return;
        e.preventDefault();
        modal.classList.remove('dragImageOver');
        uploadPrettyImageFiles(files, 'drop');
      });
      $('addImgs').onclick = e => {
        const b = e.target.closest('[data-add-rm]');
        if (!b) return;
        addImages.splice(Number(b.dataset.addRm), 1);
        saveAddImagesDraft();
        renderPrettyImages();
      };
      modal.addEventListener('mousedown', e => {
        if (e.target === modal) closePrettyAddModal();
      });
      return modal;
    }

    function renderPrettyImages() {
      const box = $('addImgs');
      if (!box) return;
      box.innerHTML = addImages.length
        ? addImages
            .map(
              (im, i) => `
      <div class="editImg addPreviewImg">
        <button type="button" class="rm" data-add-rm="${i}">×</button>
        <img src="${esc(im.src)}" alt="" loading="lazy" decoding="async">
        <input class="imgUrlBox" value="${esc(im.src)}" readonly onclick="this.select()" title="Bấm để chọn URL ảnh" style="margin-top:6px;width:100%;max-width:260px;border:1px solid rgba(200,169,110,.24);border-radius:10px;background:rgba(0,0,0,.22);color:var(--gold2);padding:7px;font-size:.72rem;">
      </div>`,
            )
            .join('')
        : 'Chưa có hình.';
    }

    function openPrettyAddModal() {
      if (!canManage()) return;
      if (!isAllTab()) return;
      const modal = ensurePrettyModal();
      addImages = loadAddImagesDraft();
      $('addQuestionNum').value = nextNum();
      $('addQuestionText').value = '';
      ['A', 'B', 'C', 'D', 'E'].forEach(k => {
        const el = $('addOpt' + k);
        if (el) el.value = '';
      });
      $('addQuestionAnswer').value = '';
      renderPrettyImages();
      modal.classList.remove('hidden');
      updatePlus();
      setTimeout(() => $('addQuestionText')?.focus(), 80);
    }
    function closePrettyAddModal() {
      $('addQuestionModal')?.classList.add('hidden');
      setTimeout(updatePlus, 30);
    }

    function answerTextLine(answer, options) {
      return String(answer || '')
        .toUpperCase()
        .split('')
        .filter(Boolean)
        .map(k => k + '. ' + (options[k] || ''))
        .join('; ');
    }
    async function savePrettyQuestion() {
      if (!canManage()) return alert('Tài khoản này không có quyền thêm câu hỏi.');
      if (addUploading > 0) return alert('Ảnh đang upload, chờ xong rồi lưu nha.');
      const c = client();
      if (!c) return alert('Chưa kết nối Supabase.');
      const subject = subjectCode();
      if (!subject) return alert('Bạn cần chọn môn trước.');

      const num = Number(($('addQuestionNum')?.value || '').trim()) || nextNum();
      const question = ($('addQuestionText')?.value || '').trim();
      const answer = ($('addQuestionAnswer')?.value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-E]/g, '');
      const options = {};
      ['A', 'B', 'C', 'D', 'E'].forEach(k => {
        const v = ($('addOpt' + k)?.value || '').trim();
        if (v) options[k] = v;
      });

      if (!question) return alert('Nhập câu hỏi trước.');
      if (Object.keys(options).length < 2) return alert('Nhập ít nhất 2 đáp án.');
      if (!answer) return alert('Nhập đáp án đúng, ví dụ A hoặc BC.');
      for (const k of answer) {
        if (!options[k]) return alert('Đáp án đúng ' + k + ' chưa có nội dung.');
      }

      // Ghi câu hỏi mới vào Turso qua /api/admin-action (nguồn dữ liệu chính khi F5).
      // Trước đây insert thẳng Supabase nên ảnh/câu hỏi không có khi reload (app đọc từ Turso).
      const imgs =
        typeof window.__LHCleanImages === 'function' ? window.__LHCleanImages(addImages || []) : addImages || [];
      const payload = {
        subject_code: subject,
        num,
        question,
        options,
        answer,
        answer_text: answerTextLine(answer, options),
        images: imgs,
        has_image: imgs.length > 0,
        updated_at: new Date().toISOString(),
      };
      const btn = $('saveAddQuestion');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Đang lưu...';
      }
      try {
        const u = user();
        const res = await fetch('/api/admin-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ user_id: u?.id, action: 'add_question', payload: { question_data: payload } }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.error) throw new Error(out.error || 'Không lưu được vào Turso (HTTP ' + res.status + ')');
        clearAddImagesDraft();
        addImages = [];
        closePrettyAddModal();
        notifyOk('Đã thêm câu hỏi');
        if (typeof window.clearLearningHubQuestionCache === 'function') window.clearLearningHubQuestionCache();
        if (typeof window.loadCurrentSubjectOnly === 'function') await window.loadCurrentSubjectOnly(true);
        else if (window.HODSupabase?.loadQuestionsFromSupabase) await window.HODSupabase.loadQuestionsFromSupabase();
        try {
          const idx = (LHState.RAW || []).findIndex(q => Number(q.num) === num);
          if (idx >= 0) {
            LHState.pool = [...LHState.RAW];
            LHState.ci = idx;
            LHState.flipped = false;
            (typeof renderCard === 'function' ? renderCard : window.renderCard)?.();
            (typeof renderStudy === 'function' ? renderStudy : window.renderStudy)?.();
          }
        } catch (e) {
          lhWarn('COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629', e);
        }
      } catch (err) {
        alert('Thêm câu hỏi thất bại: ' + (err?.message || err));
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Lưu câu hỏi';
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
        obs.observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
        modal.addEventListener('click', () => setTimeout(updatePlus, 30), true);
        modal.addEventListener('mousedown', () => setTimeout(updatePlus, 30), true);
      }
      document.querySelectorAll('.tab').forEach(t => {
        if (t.__prettyAddTabBound) return;
        t.__prettyAddTabBound = true;
        t.addEventListener('click', () =>
          setTimeout(() => {
            cleanupLimitText();
            updatePlus();
          }, 80),
        );
      });
    }
    window.openAddQuestionModal = openPrettyAddModal;
    window.openPrettyAddModal = openPrettyAddModal;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1000);
    setInterval(updatePlus, 250);
  })();
  // ===== END COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 =====
}
