# BẢN ĐỒ BLOCK — sinh tự động bằng `npm run map`

> **Đừng sửa tay file này.** Chạy `npm run map` sau khi thêm/xóa/di chuyển block.
>
> Cách dùng khi sửa lỗi:
> 1. Tìm tính năng trong bảng "Danh sách block" (hoặc tra `lhErrors()` trong Console —
>    tag lỗi chính là tên block ở đây).
> 2. Xem bảng "Hàm bị ghi đè": **bản gán CUỐI CÙNG mới là bản đang chạy**, các bản trước là mã chết.
> 3. Chỉ đọc/sửa đúng vùng dòng của block đó, đừng đọc cả file.
>
> ⚠️ Bảng ghi đè tính theo thứ tự xuất hiện trong file (tức thứ tự chạy đồng bộ).
> Block nào gán trong `setTimeout` / `DOMContentLoaded` sẽ thắng MUỘN HƠN mọi block
> khác — ví dụ `renderStudy` thực tế do `LIBRARY_UX_STEP1_STABLE_RENDER` gán trong
> `setTimeout(apply, 0)`. Muốn biết chắc bản nào đang chạy, mở Console và xem thân hàm:
>
> ```js
> String(window.renderStudy).slice(0, 200)
> ```

---

## appCore.js (bundle -> app.js)

2774 dòng · 57 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FIX_OAUTH_SESSION_FINAL_20260628` | 149–153 | 5 | — |
| `CONFIG_LOADED_FROM_config.js` | 155–165 | 11 | `APP_CONFIG` |
| `PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702` | 167–186 | 20 | `setInterval` |
| `PATCH_TAB_ISOLATED_SUBJECT_SESSION_20260701` | 188–226 | 39 | — |
| `LOCAL_DEV_BYPASS:_skip_login_when_opened_from_file://` | 255–283 | 29 | `__LOCAL_DEV_MODE` |
| `merged_app_logic` | 284–455 | 172 | `showProgress`, `hideProgress` |
| `FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727` | 456–482 | 27 | `renderAllSafe` |
| `HOD102_+_Supabase_MVP_bridge_&_Avatar` | 1221–1223 | 3 | — |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 1225–1228 | 4 | — |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 1230–1233 | 4 | — |
| `PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY` | 1235–1373 | 139 | `loadCurrentSubjectOnly`, `rebuild` |
| `PATCH_REMOVE_RANDOM_FEATURE_FINAL` | 1374–1406 | 33 | `shuffle` |
| `PATCH_SUPABASE_SINGLE_SOURCE_ONLY` | 1407–1421 | 15 | `HOD_DATA` |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 1422–1444 | 23 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 1445–1448 | 4 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 1450–1453 | 4 | — |
| `FINAL_USER_LAST_ACTIVITY_TRACKING_20260613` | 1455–1520 | 66 | `__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613` |
| `Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì` | 1521–1548 | 28 | — |
| `FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613` | 1549–1617 | 69 | `fixCounter`, `fixBrand` |
| `FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613` | 1618–1656 | 39 | — |
| `FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614` | 1657–1791 | 135 | `openStudyReport` |
| `FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614` | 1792–1914 | 123 | — |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 1915–1917 | 3 | — |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 1919–1921 | 3 | — |
| `IMPORT_PREVIEW_INLINE_EDIT_20260625_(và_8_block_cùng_nhóm)` | 1923–1930 | 8 | — |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 1932–1934 | 3 | — |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 1936–1938 | 3 | — |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 1940–1942 | 3 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 1944–1946 | 3 | — |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 1948–1950 | 3 | — |
| `FINAL_UI_DEDUP_CLEANER_20260628` | 1952–2044 | 93 | — |
| `REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628` | 2046–2068 | 23 | — |
| `FINAL_RESET_KEEP_CURRENT_TAB_20260628` | 2092–2155 | 64 | `resetKeepCurrentTab`, `reset`, `triggerReset` |
| `FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628` | 2157–2211 | 55 | `__LH_PRELOADED_IMAGES`, `next`, `prev` |
| `PERSIST_LAST_TAB_AND_EXAM_20260628` | 2213–2255 | 43 | — |
| `SUPABASE_CACHE_CLEAR_HELPER_20260628` | 2257–2272 | 16 | `clearLearningHubQuestionCache` |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 2293–2296 | 4 | — |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 2313–2316 | 4 | — |
| `COPILOT_CLEAN_RUNTIME_GUARD_20260628_(đã_rút_gọn)` | 2318–2356 | 39 | `__COPILOT_CLEAN_RUNTIME_GUARD_20260628` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 2358–2361 | 4 | — |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 2374–2377 | 4 | — |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 2379–2382 | 4 | — |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 2384–2386 | 3 | — |
| `EXAM_UI_STYLE_MERGED_20260702` | 2388–2538 | 151 | — |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 2540–2543 | 4 | — |
| `COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629` | 2545–2603 | 59 | `__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629`, `__LHNormalizeQuestionAttrs`, `__LHNormalizeAll`, `renderCard` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 2605–2608 | 4 | — |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 2610–2613 | 4 | — |
| `IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 2615–2733 | 119 | — |
| `TURSO_ONLY_DATA_SOURCE_20260630` | 2735–2739 | 5 | `APP_CONFIG` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 2741–2744 | 4 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 2746–2748 | 3 | — |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 2750–2753 | 4 | — |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 2755–2759 | 5 | — |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 2761–2763 | 3 | — |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 2765–2768 | 4 | — |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 2770–2773 | 4 | — |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `hod102_ci` | FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `hod102_random_active` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, PATCH_REMOVE_RANDOM_FEATURE_FINAL, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_progress_` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_questions_cache_v1_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_questions_cache_v2_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_subject_code_merged_v1` | FINAL_RESET_KEEP_CURRENT_TAB_20260628, SUPABASE_CACHE_CLEAR_HELPER_20260628 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/profile` | FINAL_USER_LAST_ACTIVITY_TRACKING_20260613, Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì |
| `/api/questions` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY |

---

## exam.js (tab Kiểm tra, tách khỏi appCore)

1532 dòng · 1 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 38–1531 | 1494 | `__examOnlyRender`, `renderQuiz`, `__examResetForSubjectChange` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `hod102_exam_layout_mode` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |
| `hod102_kizspy_font_size` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |
| `hod102_kizspy_split_pct` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |
| `learninghub_subject_code_merged_v1` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/questions` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |
| `/api/subjects` | FINAL_EXAM_ONLY_QUIZ_UI_20260627 |

---

## editor.js (sửa/báo cáo câu hỏi, tách khỏi appCore)

464 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 31–361 | 331 | `editDraft`, `openEditor`, `saveEditor`, `goStudyFromLib` |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 363–463 | 101 | — |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_subject_code_merged_v1` | LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627 |

---

## images.js (ảnh + upload Cloudinary, tách khỏi appCore)

623 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 30–152 | 123 | `APP_CONFIG`, `__LHUploadCloudinary`, `__LHTestCloudinaryConfig` |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 154–471 | 318 | `__LHGetPendingImageUpload`, `__LHUploadPendingDataUrls` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 473–542 | 70 | `__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628`, `__LHUpdateQuestionLocal` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 544–588 | 45 | `renderEditImages` |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 590–622 | 33 | `imgsHTML` |

### Khóa localStorage

_(không có)_

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628 |

---

## library.js (tab Thư viện, tách khỏi appCore)

664 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 22–44 | 23 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 46–663 | 618 | `showLibrarySkeleton`, `renderUnified`, `renderStudy`, `__renderStudyUnified` |

### Khóa localStorage

_(không có)_

### Endpoint API

_(không có)_

---

## subjectGate.js (cổng chọn môn + số câu, tách khỏi appCore)

1256 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 45–804 | 760 | `syncSubjectTexts`, `__hubPatchSubmitMerged`, `__hubPatchSignoutMerged`, `__LHCheckedOnce`, `__LHTriggerSubjectCheck` …+4 |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 806–850 | 45 | `__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 852–1035 | 184 | `__SUBJECT_COUNTS_ONCE_CACHE_20260629`, `clearLearningHubSupabaseCache`, `refreshSubjectCountsOnce` |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 1037–1154 | 118 | `__clearAddSubjectDraft` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 1156–1255 | 100 | `__TURSO_SUBJECT_COUNTS_FALLBACK_20260630`, `renderSubjects` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_progress_` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START |
| `learninghub_subject_code_merged_v1` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START, SUBJECT_COUNTS_ONCE_CACHE_20260629 |
| `learninghub_subject_counts_cache_v3` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START |
| `learninghub_subject_gate_open_v1` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START |
| `learninghub_subject_gate_tab_v1` | CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/profile` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START |
| `/api/questions` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START, TURSO_SUBJECT_COUNTS_FALLBACK_20260630 |
| `/api/settings` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START |
| `/api/subjects` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START, SUBJECT_COUNTS_ONCE_CACHE_20260629 |

---

## bookmarks.js (Bookmark & Edit Request Bell, tách khỏi appCore)

781 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 23–335 | 313 | `__isBookmarked`, `__countBookmarks`, `__getBookmarkBtnHTML`, `updateBookmarkBtn`, `updateCardTools` |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 337–780 | 444 | `jumpToQuestionInLibrary` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_library_filter_v1` | HEADER_EDIT_REQUEST_BELL_20260726 |
| `learninghub_library_search_v1` | HEADER_EDIT_REQUEST_BELL_20260726 |
| `learninghub_subject_code_merged_v1` | BOOKMARK_QUESTIONS_FEATURE_20260726, HEADER_EDIT_REQUEST_BELL_20260726 |
| `lh_starred_v1_backup_all` | BOOKMARK_QUESTIONS_FEATURE_20260726 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/my-edit-requests` | HEADER_EDIT_REQUEST_BELL_20260726 |
| `/api/staff-edit-requests` | HEADER_EDIT_REQUEST_BELL_20260726 |

---

## subjectImport.js (Import & Thêm môn, tách khỏi appCore)

3846 dòng · 13 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 471–1150 | 680 | `__switchSubjectGateTab`, `__ADD_SUBJECT_AI_PROMPT`, `__switchStep`, `_dropZoneInit`, `__selectedImportFile` |
| `QUIZLET_IMPORT_AUTODETECT_20260701` | 1151–1246 | 96 | `__LHConvertQuizlet` |
| `FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625` | 1539–1644 | 106 | `__openUserAIPromptModal`, `__closeUserAIPromptModal`, `__copyUserAIPrompt` |
| `FIX_DELETE_IMPORT_FILE_20260625` | 1645–1708 | 64 | `__clearUserImportFile`, `__selectedImportFile`, `__previewSelections` |
| `PROMPT_STEP_UX_UI_POLISH_20260625` | 1709–1773 | 65 | `__switchStep` |
| `PROMPT_STEP_INSIDE_PANEL_FIX_20260625` | 1774–1793 | 20 | — |
| `REMOVE_PROMPT_GUIDE_ROWS_20260625` | 1794–1807 | 14 | — |
| `FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625` | 1808–1852 | 45 | `__openUserAIPromptModal` |
| `IMPORT_PREVIEW_INLINE_EDIT_20260625` | 1853–2281 | 429 | `__previewImportData`, `__previewQualityFilter`, `__setQualityFilter`, `__toggleQualityImage`, `__setQualityRisk` …+1 |
| `FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625` | 2282–2415 | 134 | `__editImportPreviewQuestion`, `__inlineAddPreviewOption`, `__cancelInlineKeepEdit`, `__saveInlineKeepEdit` |
| `INLINE_DELETE_OPTION_20260625` | 2416–2462 | 47 | `__deleteInlinePreviewOption`, `__editImportPreviewQuestion`, `__inlineAddPreviewOption` |
| `IMPORT_PREVIEW_COMPACT_UX_PATCH_20260626` | 2463–3553 | 1091 | `__previewImportData`, `__openImportPreviewModal`, `__editImportPreviewQuestion`, `__APP_UI_CLEAN_FINAL__` |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 3554–3844 | 291 | `__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, `__previewImportData`, `__LH_LAST_PREVIEW_IMPORT_DATA`, `__submitSubjectRequest` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_add_subject_code_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_desc_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_file_data_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625, FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_add_subject_file_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_file_previewed_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_file_size_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_step_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_subject_gate_tab_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_subjects_cache_v1` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_subjects_dirty_v3` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |

---

## flashcards.js (Flashcards & Mobile Nav, tách khỏi appCore)

705 dòng · 3 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 22–177 | 156 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 178–299 | 122 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 300–705 | 406 | `__lhSuppressFlip`, `slideChange` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_swipe_hint_seen_v1` | MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại) |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/my-edit-requests` | FINAL_REPORT_BUTTON_OPEN_TAB_20260613 |

---

## auth.js (Supabase Auth & Interceptor, tách khỏi appCore)

1779 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627` | 221–1014 | 794 | `getLhApiSignal`, `__LH_REVOKING_ACCESS`, `__LH_ACCESS_OK`, `handleAccessRevoked`, `__lhRealtimeConnected` …+5 |
| `HOD_Login_+_Admin_UI_(added)` | 1015–1055 | 41 | — |
| `Admin_visibility_hard_fix` | 1056–1092 | 37 | — |
| `ACCOUNT_AVATAR_CLEAN_FINAL` | 1093–1288 | 196 | — |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 1289–1777 | 489 | `__LH_UNIFIED_FETCH_INSTALLED`, `__lhOriginalFetch`, `__lhRefreshAccessToken`, `__lhAccessToken`, `clearLearningHubSupabaseCache` …+5 |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_progress_` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `learninghub_subject_code_merged_v1` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `sb-` | LH_UNIFIED_FETCH_AND_ACCESS_20260726 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/admin-dashboard` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/edit-requests` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/notify` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/profile` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/questions` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/version` | LH_UNIFIED_FETCH_AND_ACCESS_20260726 |

---

## search.js (Smart Search & Add Question Display, tách khỏi appCore)

912 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 13–457 | 445 | `renderStudy` |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 458–910 | 453 | `openAddQuestionModal`, `openPrettyAddModal` |

### Khóa localStorage

_(không có)_

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 |

---

## subjects.js (Subject Selection & Data Loading, tách khỏi appCore)

906 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 54–214 | 161 | `loadCurrentSubjectOnly`, `renderCard` |
| `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` | 215–665 | 451 | `cleanImages`, `__LHCleanImages`, `__LHUploadCloudinary`, `imgsHTML`, `renderEditImages` …+3 |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 669–777 | 109 | `__ACTIVE_SUBJECT_COUNT_SYNC_20260629`, `syncActiveSubjectCount`, `loadCurrentSubjectOnly`, `loadBySubject`, `__renderCardActiveCountPatched` …+1 |
| `REMOVE_EYE_HIDE_OPTIONS_20260629` | 783–805 | 23 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 809–904 | 96 | `__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `hod102_hide_options` | REMOVE_EYE_HIDE_OPTIONS_20260629 |
| `learninghub_progress_` | COPILOT_CLOUDINARY_IMAGE_FIX_20260627, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/questions` | COPILOT_CLOUDINARY_IMAGE_FIX_20260627, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 |

---

## adminCore.js (bundle -> admin.js)

6777 dòng · 56 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

| Hàm | Số block gán | Thứ tự block (cuối cùng thắng) |
| --- | --- | --- |
| `setPage` | 7 | ACCESS_APPROVAL_ADMIN_20260624 → SUBJECT_MANAGEMENT_20260625 → …3 block nữa… → COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 → **COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630** |

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FIX_ADMIN_DASHBOARD_DEDUP_20260705` | 203–256 | 54 | `__FIX_ADMIN_DASHBOARD_DEDUP_20260705`, `__adminDashboardBusy`, `__adminDashboardLoadedOnce`, `__invalidateAdminDashboardCache`, `__fetchAdminDashboardJSON` |
| `CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5` | 888–1485 | 598 | `adminAction`, `updateRequestBadge`, `lhCloseModal` |
| `F5_SUPABASE_MICRO_CACHE_20260629` | 1486–1584 | 99 | `__F5_SUPABASE_MICRO_CACHE_20260629` |
| `FINAL_ADMIN_HISTORY_SHOW_EDITOR_EMAIL_20260613` | 1588–1684 | 97 | `renderHistory`, `viewHistoryFixed` |
| `ACCESS_APPROVAL_ADMIN_20260624` | 1685–1806 | 122 | `filterApprovals`, `approveUser`, `rejectUser` |
| `SUBJECT_MANAGEMENT_20260625` | 1807–1982 | 176 | `deleteSubjectAdmin`, `approveSubjectRequest`, `rejectSubjectRequest` |
| `HOTFIX_UX/UI_ADMIN:_NOTIFICATIONS_&_TRASH_OVERLAPPING_REPAIR` | 1983–2095 | 113 | — |
| `FINAL_ADMIN_SUBJECT_EDIT_20260625` | 2096–2543 | 448 | `loadSubjectsAdmin`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `saveSubjectAdmin`, `organizeAdminSidebar` …+1 |
| `FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625` | 2544–2787 | 244 | `loadTrash`, `restoreQuestion`, `permanentDelete`, `restoreSubject`, `permanentDeleteSubject` …+1 |
| `DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625` | 2788–2823 | 36 | — |
| `FINAL_DOTS_MENU_FIXED_NO_JITTER_20260625` | 2824–2917 | 94 | `closeUserActionMenuFinal`, `openUserActionMenuFinal`, `openUserAvatarFinal` |
| `FORCE_REVOKE_IN_USER_DOTS_20260625` | 2918–2966 | 49 | `openUserActionMenuFinal` |
| `REVOKE_MOVES_USER_TO_APPROVAL_AND_APPROVED_USERS_UI_20260625` | 2967–3008 | 42 | `revokeApproval` |
| `FINAL_APPROVAL_UI_AND_REMOVE_USER_NOTE_20260625` | 3009–3248 | 240 | `renderUsers`, `renderApprovals`, `__ADMIN_UI_CLEAN_FINAL__` |
| `FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627` | 3249–3414 | 166 | `loadSubjectRequests`, `filterSubjectRequests`, `previewSubjectRequestQuestionsFixed` |
| `FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628` | 3415–3529 | 115 | `openAdminReqImageForce`, `compareHTML`, `viewReq` |
| `COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628` | 3531–3609 | 79 | `__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628`, `viewHistory` |
| `COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3611–3681 | 71 | `loadSubjectRequests`, `deleteBadSubjectRequest`, `filterSubjectRequests` |
| `END_COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3682–3683 | 2 | — |
| `MANUAL_ADMIN_RELOAD_ONLY_20260629` | 3684–3687 | 4 | — |
| `COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629` | 3689–3770 | 82 | `__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629`, `startAdminRealtime`, `startAdminRealtimeFinal`, `stopAdminRealtime`, `stopAdminRealtimeFinal` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629` | 3772–3836 | 65 | `__MOBILE_APPROVAL_LITE_ADMIN_20260629` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629_END` | 3837–3838 | 2 | — |
| `ADMIN_PROFILE_PATCH_DEDUPE_20260629` | 3839–3872 | 34 | `__ADMIN_PROFILE_PATCH_DEDUPE_20260629` |
| `COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 3874–4250 | 377 | `__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630`, `openSubjectFolderAdmin`, `renderSubjectAdminList`, `loadSubjectsAdmin` |
| `END_COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 4251–4252 | 2 | — |
| `COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4253–4388 | 136 | `__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630`, `openEditSubjectAdmin`, `saveSubjectAdmin` |
| `END_COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4389–4390 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4391–4635 | 245 | `__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `toggleSubjectNewBadgeFromCard`, `toggleSubjectFolderNewBadge` …+1 |
| `END_COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4636–4637 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4638–4639 | 2 | — |
| `END_COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4640–4641 | 2 | — |
| `COPILOT_ADMIN_RELOAD_FIX_20260630` | 4642–4782 | 141 | `__COPILOT_ADMIN_RELOAD_FIX_20260630`, `loadAll`, `__adminDashRenderedText` |
| `END_COPILOT_ADMIN_RELOAD_FIX_20260630` | 4783–4784 | 2 | — |
| `COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4785–4833 | 49 | `__COPILOT_HIDE_USERS_FROM_EDITOR_20260630`, `setPage`, `renderUsers` |
| `END_COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4834–4835 | 2 | — |
| `COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 4836–5052 | 217 | `__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` |
| `END_COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 5053–5054 | 2 | — |
| `COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5055–5154 | 100 | `__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` |
| `END_COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5155–5156 | 2 | — |
| `COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5157–5219 | 63 | `__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630`, `permanentDeleteSubject`, `permanentDelete` |
| `END_COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5220–5221 | 2 | — |
| `COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5222–5384 | 163 | `__COPILOT_EDITOR_ACCESS_HIDE_20260630`, `hideDeniedMenus`, `setPage`, `loadProfile`, `loadAll` |
| `END_COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5385–5386 | 2 | — |
| `COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5387–5462 | 76 | `__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630`, `setPage` |
| `END_COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5463–5464 | 2 | — |
| `COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630` | 5465–5691 | 227 | `__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630`, `loadRegistrationMode`, `setRegistrationMode`, `setPage`, `loadAll` |
| `COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630` | 5693–5720 | 28 | `__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630`, `approve` |
| `COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` | 5722–5726 | 5 | `__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` |
| `LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726` | 5727–5874 | 148 | `__LH_UNIFIED_FETCH_INSTALLED`, `lhToken`, `__lhAccessToken`, `fetch` |
| `FIX_ADMIN_AUTO_REFRESH_20260701` | 5974–6070 | 97 | `__FIX_ADMIN_AUTO_REFRESH_20260701`, `__adminDashRenderedText` |
| `OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6074–6080 | 7 | — |
| `END_OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6081–6082 | 2 | — |
| `DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725` | 6083–6318 | 236 | `closeUserActionMenuFinal`, `showUserDeviceHistoryModal`, `showUserSubjectByDeviceModal`, `openUserActionMenuFinal`, `notifyReloadUser` …+2 |
| `ADMIN_TWO_TIERS_AND_DISCORD_TOGGLES_20260729` | 6320–6595 | 276 | `__ADMIN_TWO_TIERS_20260729`, `__lhAdminTier`, `isSystemAdmin`, `saveReleaseNotes`, `renderReleaseNotesSettings` …+3 |
| `ADMIN_CUSTOMIZE_ADD_SUBJECT_AI_PROMPT_20260730` | 6596–6776 | 181 | `adjustAdminAiPromptHeight`, `loadAddSubjectAiPrompt`, `saveAdminAiPrompt`, `resetAdminAiPrompt`, `copyAdminAiPrompt` …+4 |

### Khóa localStorage

_(không có)_

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5, SUBJECT_MANAGEMENT_20260625, COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630, COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630, COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630, LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
| `/api/admin-dashboard` | FIX_ADMIN_DASHBOARD_DEDUP_20260705, CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/notify` | DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625, DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725 |
| `/api/questions` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/settings` | COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630, ADMIN_CUSTOMIZE_ADD_SUBJECT_AI_PROMPT_20260730 |
| `/api/version` | LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
