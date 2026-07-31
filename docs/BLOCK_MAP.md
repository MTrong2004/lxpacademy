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

5428 dòng · 57 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FIX_OAUTH_SESSION_FINAL_20260628` | 138–142 | 5 | — |
| `CONFIG_LOADED_FROM_config.js` | 144–154 | 11 | `APP_CONFIG` |
| `PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702` | 156–175 | 20 | `setInterval` |
| `PATCH_TAB_ISOLATED_SUBJECT_SESSION_20260701` | 177–215 | 39 | — |
| `LOCAL_DEV_BYPASS:_skip_login_when_opened_from_file://` | 244–272 | 29 | `__LOCAL_DEV_MODE` |
| `merged_app_logic` | 273–393 | 121 | `showProgress`, `hideProgress` |
| `FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727` | 394–420 | 27 | `renderAllSafe` |
| `HOD102_+_Supabase_MVP_bridge_&_Avatar` | 1125–1127 | 3 | — |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 1129–1132 | 4 | — |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 1134–1813 | 680 | `__switchSubjectGateTab`, `__ADD_SUBJECT_AI_PROMPT`, `__switchStep`, `_dropZoneInit`, `__selectedImportFile` |
| `QUIZLET_IMPORT_AUTODETECT_20260701` | 1814–1909 | 96 | `__LHConvertQuizlet` |
| `PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY` | 2200–2335 | 136 | `loadCurrentSubjectOnly`, `rebuild` |
| `PATCH_REMOVE_RANDOM_FEATURE_FINAL` | 2336–2368 | 33 | `shuffle` |
| `PATCH_SUPABASE_SINGLE_SOURCE_ONLY` | 2369–2383 | 15 | `HOD_DATA` |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 2384–2558 | 175 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 2559–2680 | 122 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 2681–3086 | 406 | `__lhSuppressFlip`, `slideChange` |
| `FINAL_USER_LAST_ACTIVITY_TRACKING_20260613` | 3087–3152 | 66 | `__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613` |
| `Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì` | 3153–3180 | 28 | — |
| `FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613` | 3181–3249 | 69 | `fixCounter`, `fixBrand` |
| `FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613` | 3250–3288 | 39 | — |
| `FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614` | 3289–3423 | 135 | `openStudyReport` |
| `FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614` | 3424–3546 | 123 | — |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 3547–3549 | 3 | — |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 3551–3553 | 3 | — |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 3555–3557 | 3 | — |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 3559–3561 | 3 | — |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 3563–3565 | 3 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 3567–3569 | 3 | — |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 3571–3573 | 3 | — |
| `FINAL_UI_DEDUP_CLEANER_20260628` | 3575–3667 | 93 | — |
| `REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628` | 3669–3691 | 23 | — |
| `FINAL_RESET_KEEP_CURRENT_TAB_20260628` | 3715–3778 | 64 | `resetKeepCurrentTab`, `reset`, `triggerReset` |
| `FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628` | 3780–3834 | 55 | `__LH_PRELOADED_IMAGES`, `next`, `prev` |
| `PERSIST_LAST_TAB_AND_EXAM_20260628` | 3836–3878 | 43 | — |
| `SUPABASE_CACHE_CLEAR_HELPER_20260628` | 3880–3895 | 16 | `clearLearningHubQuestionCache` |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 3916–3919 | 4 | — |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 3936–3939 | 4 | — |
| `COPILOT_CLEAN_RUNTIME_GUARD_20260628_(đã_rút_gọn)` | 3941–3979 | 39 | `__COPILOT_CLEAN_RUNTIME_GUARD_20260628` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 3981–3984 | 4 | — |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 3997–4000 | 4 | — |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 4002–4005 | 4 | — |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 4007–4009 | 3 | — |
| `EXAM_UI_STYLE_MERGED_20260702` | 4011–4161 | 151 | — |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 4163–4166 | 4 | — |
| `COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629` | 4168–4222 | 55 | `__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629`, `__LHNormalizeQuestionAttrs`, `__LHNormalizeAll` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 4224–4227 | 4 | — |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 4229–4232 | 4 | — |
| `IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 4234–4352 | 119 | — |
| `TURSO_ONLY_DATA_SOURCE_20260630` | 4354–4358 | 5 | `APP_CONFIG` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 4360–4363 | 4 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 4365–4367 | 3 | — |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 4369–4372 | 4 | — |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 4374–4664 | 291 | `__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, `__previewImportData`, `__LH_LAST_PREVIEW_IMPORT_DATA`, `__submitSubjectRequest` |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 4666–4668 | 3 | — |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 4670–4982 | 313 | `__isBookmarked`, `__countBookmarks`, `__getBookmarkBtnHTML`, `updateBookmarkBtn`, `updateCardTools` |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 4984–5427 | 444 | `jumpToQuestionInLibrary` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `hod102_ci` | FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `hod102_random_active` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, PATCH_REMOVE_RANDOM_FEATURE_FINAL, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_add_subject_code_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_desc_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_file_data_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_add_subject_file_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_file_previewed_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_file_size_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_step_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_library_filter_v1` | HEADER_EDIT_REQUEST_BELL_20260726 |
| `learninghub_library_search_v1` | HEADER_EDIT_REQUEST_BELL_20260726 |
| `learninghub_progress_` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_questions_cache_v1_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_questions_cache_v2_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_subject_code_merged_v1` | FINAL_RESET_KEEP_CURRENT_TAB_20260628, SUPABASE_CACHE_CLEAR_HELPER_20260628, BOOKMARK_QUESTIONS_FEATURE_20260726, HEADER_EDIT_REQUEST_BELL_20260726 |
| `learninghub_subject_gate_tab_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_subjects_cache_v1` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_subjects_dirty_v3` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_swipe_hint_seen_v1` | MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại) |
| `lh_starred_v1_backup_all` | BOOKMARK_QUESTIONS_FEATURE_20260726 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `/api/my-edit-requests` | FINAL_REPORT_BUTTON_OPEN_TAB_20260613, HEADER_EDIT_REQUEST_BELL_20260726 |
| `/api/profile` | FINAL_USER_LAST_ACTIVITY_TRACKING_20260613, Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì |
| `/api/questions` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY |
| `/api/staff-edit-requests` | HEADER_EDIT_REQUEST_BELL_20260726 |

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

449 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 31–346 | 316 | `editDraft`, `openEditor`, `saveEditor`, `goStudyFromLib` |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 348–448 | 101 | — |

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

731 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 30–151 | 122 | `APP_CONFIG`, `__LHUploadCloudinary`, `__LHTestCloudinaryConfig` |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 153–470 | 318 | `__LHGetPendingImageUpload`, `__LHUploadPendingDataUrls` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 472–663 | 192 | `__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 665–709 | 45 | `renderEditImages` |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 711–730 | 20 | `__COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630`, `imgsHTML` |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `learninghub_subject_code_merged_v1` | COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628, COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628 |

---

## library.js (tab Thư viện, tách khỏi appCore)

666 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 22–44 | 23 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 46–665 | 620 | `showLibrarySkeleton`, `renderUnified`, `renderStudy`, `__renderStudyUnified` |

### Khóa localStorage

_(không có)_

### Endpoint API

_(không có)_

---

## subjectGate.js (cổng chọn môn + số câu, tách khỏi appCore)

1248 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 44–796 | 753 | `__hubPatchSubmitMerged`, `__hubPatchSignoutMerged`, `__LHCheckedOnce`, `__LHTriggerSubjectCheck`, `__ADD_SUBJECT_AI_PROMPT` …+3 |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 798–842 | 45 | `__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 844–1027 | 184 | `__SUBJECT_COUNTS_ONCE_CACHE_20260629`, `clearLearningHubSupabaseCache`, `refreshSubjectCountsOnce` |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 1029–1146 | 118 | `__clearAddSubjectDraft` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 1148–1247 | 100 | `__TURSO_SUBJECT_COUNTS_FALLBACK_20260630`, `renderSubjects` |

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

727 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 9–317 | 309 | `__isBookmarked`, `__countBookmarks`, `__getBookmarkBtnHTML`, `updateBookmarkBtn`, `updateCardTools` |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 318–727 | 410 | `jumpToQuestionInLibrary` |

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

3853 dòng · 13 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 472–1151 | 680 | `__switchSubjectGateTab`, `__ADD_SUBJECT_AI_PROMPT`, `__switchStep`, `_dropZoneInit`, `__selectedImportFile` |
| `QUIZLET_IMPORT_AUTODETECT_20260701` | 1152–1247 | 96 | `__LHConvertQuizlet` |
| `FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625` | 1542–1647 | 106 | `__openUserAIPromptModal`, `__closeUserAIPromptModal`, `__copyUserAIPrompt` |
| `FIX_DELETE_IMPORT_FILE_20260625` | 1648–1711 | 64 | `__clearUserImportFile`, `__selectedImportFile`, `__previewSelections` |
| `PROMPT_STEP_UX_UI_POLISH_20260625` | 1712–1776 | 65 | `__switchStep` |
| `PROMPT_STEP_INSIDE_PANEL_FIX_20260625` | 1777–1796 | 20 | — |
| `REMOVE_PROMPT_GUIDE_ROWS_20260625` | 1797–1810 | 14 | — |
| `FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625` | 1811–1855 | 45 | `__openUserAIPromptModal` |
| `IMPORT_PREVIEW_INLINE_EDIT_20260625` | 1856–2284 | 429 | `__previewImportData`, `__previewQualityFilter`, `__setQualityFilter`, `__toggleQualityImage`, `__setQualityRisk` …+1 |
| `FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625` | 2285–2418 | 134 | `__editImportPreviewQuestion`, `__inlineAddPreviewOption`, `__cancelInlineKeepEdit`, `__saveInlineKeepEdit` |
| `INLINE_DELETE_OPTION_20260625` | 2419–2465 | 47 | `__deleteInlinePreviewOption`, `__editImportPreviewQuestion`, `__inlineAddPreviewOption` |
| `IMPORT_PREVIEW_COMPACT_UX_PATCH_20260626` | 2466–3558 | 1093 | `__previewImportData`, `__openImportPreviewModal`, `__editImportPreviewQuestion`, `__APP_UI_CLEAN_FINAL__` |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 3559–3849 | 291 | `__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, `__previewImportData`, `__LH_LAST_PREVIEW_IMPORT_DATA`, `__submitSubjectRequest` |

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

753 dòng · 3 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 40–218 | 179 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 219–344 | 126 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 345–753 | 409 | `__lhSuppressFlip`, `slideChange` |

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
| `APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627` | 220–1010 | 791 | `getLhApiSignal`, `__LH_REVOKING_ACCESS`, `__LH_ACCESS_OK`, `handleAccessRevoked`, `__lhRealtimeConnected` …+5 |
| `HOD_Login_+_Admin_UI_(added)` | 1011–1051 | 41 | — |
| `Admin_visibility_hard_fix` | 1052–1088 | 37 | — |
| `ACCOUNT_AVATAR_CLEAN_FINAL` | 1089–1286 | 198 | — |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 1287–1775 | 489 | `__LH_UNIFIED_FETCH_INSTALLED`, `__lhOriginalFetch`, `__lhRefreshAccessToken`, `__lhAccessToken`, `clearLearningHubSupabaseCache` …+5 |

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

918 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 19–465 | 447 | `renderStudy` |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 466–916 | 451 | `openAddQuestionModal`, `openPrettyAddModal` |

### Khóa localStorage

_(không có)_

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629 |

---

## subjects.js (Subject Selection & Data Loading, tách khỏi appCore)

898 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 50–207 | 158 | `loadCurrentSubjectOnly`, `renderCard` |
| `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` | 208–652 | 445 | `__LHCleanImages`, `__LHUploadCloudinary`, `imgsHTML`, `renderEditImages`, `loadCurrentSubjectOnly` …+2 |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 658–766 | 109 | `__ACTIVE_SUBJECT_COUNT_SYNC_20260629`, `syncActiveSubjectCount`, `loadCurrentSubjectOnly`, `loadBySubject`, `__renderCardActiveCountPatched` …+1 |
| `REMOVE_EYE_HIDE_OPTIONS_20260629` | 772–794 | 23 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 800–894 | 95 | `__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` |

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

6721 dòng · 56 block

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
| `FINAL_APPROVAL_UI_AND_REMOVE_USER_NOTE_20260625` | 3009–3247 | 239 | `renderUsers`, `renderApprovals`, `__ADMIN_UI_CLEAN_FINAL__` |
| `FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627` | 3248–3413 | 166 | `loadSubjectRequests`, `filterSubjectRequests`, `previewSubjectRequestQuestionsFixed` |
| `FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628` | 3414–3528 | 115 | `openAdminReqImageForce`, `compareHTML`, `viewReq` |
| `COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628` | 3530–3608 | 79 | `__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628`, `viewHistory` |
| `COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3610–3680 | 71 | `loadSubjectRequests`, `deleteBadSubjectRequest`, `filterSubjectRequests` |
| `END_COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3681–3682 | 2 | — |
| `MANUAL_ADMIN_RELOAD_ONLY_20260629` | 3683–3686 | 4 | — |
| `COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629` | 3688–3769 | 82 | `__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629`, `startAdminRealtime`, `startAdminRealtimeFinal`, `stopAdminRealtime`, `stopAdminRealtimeFinal` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629` | 3771–3835 | 65 | `__MOBILE_APPROVAL_LITE_ADMIN_20260629` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629_END` | 3836–3837 | 2 | — |
| `ADMIN_PROFILE_PATCH_DEDUPE_20260629` | 3838–3871 | 34 | `__ADMIN_PROFILE_PATCH_DEDUPE_20260629` |
| `COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 3873–4249 | 377 | `__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630`, `openSubjectFolderAdmin`, `renderSubjectAdminList`, `loadSubjectsAdmin` |
| `END_COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 4250–4251 | 2 | — |
| `COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4252–4387 | 136 | `__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630`, `openEditSubjectAdmin`, `saveSubjectAdmin` |
| `END_COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4388–4389 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4390–4634 | 245 | `__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `toggleSubjectNewBadgeFromCard`, `toggleSubjectFolderNewBadge` …+1 |
| `END_COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4635–4636 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4637–4638 | 2 | — |
| `END_COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4639–4640 | 2 | — |
| `COPILOT_ADMIN_RELOAD_FIX_20260630` | 4641–4781 | 141 | `__COPILOT_ADMIN_RELOAD_FIX_20260630`, `loadAll`, `__adminDashRenderedText` |
| `END_COPILOT_ADMIN_RELOAD_FIX_20260630` | 4782–4783 | 2 | — |
| `COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4784–4832 | 49 | `__COPILOT_HIDE_USERS_FROM_EDITOR_20260630`, `setPage`, `renderUsers` |
| `END_COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4833–4834 | 2 | — |
| `COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 4835–5051 | 217 | `__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` |
| `END_COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 5052–5053 | 2 | — |
| `COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5054–5153 | 100 | `__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` |
| `END_COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5154–5155 | 2 | — |
| `COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5156–5218 | 63 | `__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630`, `permanentDeleteSubject`, `permanentDelete` |
| `END_COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5219–5220 | 2 | — |
| `COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5221–5383 | 163 | `__COPILOT_EDITOR_ACCESS_HIDE_20260630`, `hideDeniedMenus`, `setPage`, `loadProfile`, `loadAll` |
| `END_COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5384–5385 | 2 | — |
| `COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5386–5461 | 76 | `__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630`, `setPage` |
| `END_COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5462–5463 | 2 | — |
| `COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630` | 5464–5690 | 227 | `__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630`, `loadRegistrationMode`, `setRegistrationMode`, `setPage`, `loadAll` |
| `COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630` | 5692–5719 | 28 | `__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630`, `approve` |
| `COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` | 5721–5725 | 5 | `__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` |
| `LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726` | 5726–5873 | 148 | `__LH_UNIFIED_FETCH_INSTALLED`, `lhToken`, `__lhAccessToken`, `fetch` |
| `FIX_ADMIN_AUTO_REFRESH_20260701` | 5973–6069 | 97 | `__FIX_ADMIN_AUTO_REFRESH_20260701`, `__adminDashRenderedText` |
| `OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6073–6079 | 7 | — |
| `END_OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6080–6081 | 2 | — |
| `DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725` | 6082–6262 | 181 | `closeUserActionMenuFinal`, `showUserDeviceHistoryModal`, `openUserActionMenuFinal`, `notifyReloadUser`, `notifyReloadAllUsers` …+1 |
| `ADMIN_TWO_TIERS_AND_DISCORD_TOGGLES_20260729` | 6264–6539 | 276 | `__ADMIN_TWO_TIERS_20260729`, `__lhAdminTier`, `isSystemAdmin`, `saveReleaseNotes`, `renderReleaseNotesSettings` …+3 |
| `ADMIN_CUSTOMIZE_ADD_SUBJECT_AI_PROMPT_20260730` | 6540–6720 | 181 | `adjustAdminAiPromptHeight`, `loadAddSubjectAiPrompt`, `saveAdminAiPrompt`, `resetAdminAiPrompt`, `copyAdminAiPrompt` …+4 |

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
