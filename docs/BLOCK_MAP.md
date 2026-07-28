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

10627 dòng · 72 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

| Hàm | Số block gán | Thứ tự block (cuối cùng thắng) |
| --- | --- | --- |
| `renderCard` | 4 | COPILOT_CLOUDINARY_IMAGE_FIX_20260627 → FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 → ACTIVE_SUBJECT_COUNT_SYNC_20260629 → **COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629** |
| `renderStudy` | 2 | FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614 → **FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614** |

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FIX_OAUTH_SESSION_FINAL_20260628` | 135–139 | 5 | — |
| `CONFIG_LOADED_FROM_config.js` | 141–151 | 11 | `APP_CONFIG` |
| `PATCH_MOBILE_PERF_PAUSE_INTERVALS_20260702` | 153–172 | 20 | `setInterval` |
| `PATCH_TAB_ISOLATED_SUBJECT_SESSION_20260701` | 174–212 | 39 | — |
| `LOCAL_DEV_BYPASS:_skip_login_when_opened_from_file://` | 241–269 | 29 | `__LOCAL_DEV_MODE` |
| `merged_app_logic` | 270–390 | 121 | `showProgress`, `hideProgress` |
| `FIX_LIBRARY_STALE_AFTER_SUBJECT_CHANGE_20260727` | 391–417 | 27 | `renderAllSafe` |
| `APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627` | 1333–2123 | 791 | `getLhApiSignal`, `__LH_REVOKING_ACCESS`, `__LH_ACCESS_OK`, `handleAccessRevoked`, `__lhRealtimeConnected` …+5 |
| `HOD_Login_+_Admin_UI_(added)` | 2124–2164 | 41 | — |
| `Admin_visibility_hard_fix` | 2165–2201 | 37 | — |
| `ACCOUNT_AVATAR_CLEAN_FINAL` | 2202–2395 | 194 | — |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 2396–2399 | 4 | — |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 2401–3049 | 649 | `__switchSubjectGateTab`, `__ADD_SUBJECT_AI_PROMPT`, `__switchStep`, `_dropZoneInit` |
| `QUIZLET_IMPORT_AUTODETECT_20260701` | 3050–3145 | 96 | `__LHConvertQuizlet` |
| `PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY` | 3370–3505 | 136 | `loadCurrentSubjectOnly`, `rebuild` |
| `PATCH_REMOVE_RANDOM_FEATURE_FINAL` | 3506–3538 | 33 | `shuffle` |
| `PATCH_SUPABASE_SINGLE_SOURCE_ONLY` | 3539–3553 | 15 | `HOD_DATA` |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 3554–3728 | 175 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 3729–3850 | 122 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 3851–4221 | 371 | `__lhSuppressFlip`, `slideChange` |
| `FINAL_USER_LAST_ACTIVITY_TRACKING_20260613` | 4222–4287 | 66 | `__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613` |
| `Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì` | 4288–4315 | 28 | — |
| `FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613` | 4316–4384 | 69 | `fixCounter`, `fixBrand` |
| `FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613` | 4385–4423 | 39 | — |
| `FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614` | 4424–4558 | 135 | `openStudyReport` |
| `FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614` | 4559–4681 | 123 | — |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 4682–5123 | 442 | `renderStudy` |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 5124–5574 | 451 | `openAddQuestionModal`, `openPrettyAddModal` |
| `FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625` | 5587–5692 | 106 | `__openUserAIPromptModal`, `__closeUserAIPromptModal`, `__copyUserAIPrompt` |
| `FIX_DELETE_IMPORT_FILE_20260625` | 5693–5751 | 59 | `__clearUserImportFile`, `__previewSelections` |
| `PROMPT_STEP_UX_UI_POLISH_20260625` | 5752–5816 | 65 | `__switchStep` |
| `PROMPT_STEP_INSIDE_PANEL_FIX_20260625` | 5817–5836 | 20 | — |
| `REMOVE_PROMPT_GUIDE_ROWS_20260625` | 5837–5850 | 14 | — |
| `FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625` | 5851–5895 | 45 | `__openUserAIPromptModal` |
| `IMPORT_PREVIEW_INLINE_EDIT_20260625` | 5896–6324 | 429 | `__previewImportData`, `__previewQualityFilter`, `__setQualityFilter`, `__toggleQualityImage`, `__setQualityRisk` …+1 |
| `FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625` | 6325–6458 | 134 | `__editImportPreviewQuestion`, `__inlineAddPreviewOption`, `__cancelInlineKeepEdit`, `__saveInlineKeepEdit` |
| `INLINE_DELETE_OPTION_20260625` | 6459–6505 | 47 | `__deleteInlinePreviewOption`, `__editImportPreviewQuestion`, `__inlineAddPreviewOption` |
| `IMPORT_PREVIEW_COMPACT_UX_PATCH_20260626` | 6506–7594 | 1089 | `__previewImportData`, `__openImportPreviewModal`, `__editImportPreviewQuestion`, `__APP_UI_CLEAN_FINAL__` |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 7595–7600 | 6 | — |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 7602–7605 | 4 | — |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 7607–7612 | 6 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 7627–7630 | 4 | — |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 7632–7789 | 158 | `loadCurrentSubjectOnly`, `renderCard` |
| `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` | 7790–8233 | 444 | `__LHCleanImages`, `__LHUploadCloudinary`, `imgsHTML`, `renderEditImages`, `loadCurrentSubjectOnly` …+2 |
| `FINAL_UI_DEDUP_CLEANER_20260628` | 8235–8327 | 93 | — |
| `REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628` | 8329–8351 | 23 | — |
| `FINAL_RESET_KEEP_CURRENT_TAB_20260628` | 8375–8438 | 64 | `resetKeepCurrentTab`, `reset`, `triggerReset` |
| `FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628` | 8440–8494 | 55 | `__LH_PRELOADED_IMAGES`, `next`, `prev` |
| `PERSIST_LAST_TAB_AND_EXAM_20260628` | 8496–8538 | 43 | — |
| `SUPABASE_CACHE_CLEAR_HELPER_20260628` | 8540–8555 | 16 | `clearLearningHubQuestionCache` |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 8576–8579 | 4 | — |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 8596–8599 | 4 | — |
| `COPILOT_CLEAN_RUNTIME_GUARD_20260628_(đã_rút_gọn)` | 8601–8639 | 39 | `__COPILOT_CLEAN_RUNTIME_GUARD_20260628` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 8641–8644 | 4 | — |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 8657–8660 | 4 | — |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 8662–8665 | 4 | — |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 8667–8775 | 109 | `__ACTIVE_SUBJECT_COUNT_SYNC_20260629`, `syncActiveSubjectCount`, `loadCurrentSubjectOnly`, `loadBySubject`, `__renderCardActiveCountPatched` …+1 |
| `REMOVE_EYE_HIDE_OPTIONS_20260629` | 8781–8803 | 23 | — |
| `EXAM_UI_STYLE_MERGED_20260702` | 8805–8955 | 151 | — |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 8957–8960 | 4 | — |
| `COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629` | 8962–9016 | 55 | `__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629`, `__LHNormalizeQuestionAttrs`, `__LHNormalizeAll` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 9018–9021 | 4 | — |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 9023–9026 | 4 | — |
| `IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 9028–9146 | 119 | — |
| `TURSO_ONLY_DATA_SOURCE_20260630` | 9148–9152 | 5 | `APP_CONFIG` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 9154–9157 | 4 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 9159–9253 | 95 | `__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 9255–9258 | 4 | — |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 9260–9544 | 285 | `__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, `__previewImportData`, `__LH_LAST_PREVIEW_IMPORT_DATA`, `__submitSubjectRequest` |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 9546–10034 | 489 | `__LH_UNIFIED_FETCH_INSTALLED`, `__lhOriginalFetch`, `__lhRefreshAccessToken`, `__lhAccessToken`, `clearLearningHubSupabaseCache` …+5 |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 10036–10348 | 313 | `__isBookmarked`, `__countBookmarks`, `__getBookmarkBtnHTML`, `updateBookmarkBtn`, `updateCardTools` |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 10350–10626 | 277 | — |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `hod102_ci` | FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `hod102_hide_options` | REMOVE_EYE_HIDE_OPTIONS_20260629 |
| `hod102_random_active` | PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, PATCH_REMOVE_RANDOM_FEATURE_FINAL, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_add_subject_code_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_desc_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_file_data_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625, FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_add_subject_file_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_file_previewed_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_file_size_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI), FIX_DELETE_IMPORT_FILE_20260625 |
| `learninghub_add_subject_name_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_add_subject_step_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_progress_` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, COPILOT_CLOUDINARY_IMAGE_FIX_20260627, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628, FINAL_RESET_KEEP_CURRENT_TAB_20260628 |
| `learninghub_questions_cache_v1_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_questions_cache_v2_` | SUPABASE_CACHE_CLEAR_HELPER_20260628 |
| `learninghub_subject_code_merged_v1` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, FINAL_RESET_KEEP_CURRENT_TAB_20260628, SUPABASE_CACHE_CLEAR_HELPER_20260628, BOOKMARK_QUESTIONS_FEATURE_20260726 |
| `learninghub_subject_gate_tab_v1` | ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI) |
| `learninghub_subjects_cache_v1` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_subjects_dirty_v3` | FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `learninghub_swipe_hint_seen_v1` | MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại) |
| `lh_starred_v1_backup_all` | BOOKMARK_QUESTIONS_FEATURE_20260726 |
| `sb-` | LH_UNIFIED_FETCH_AND_ACCESS_20260726 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629, FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701 |
| `/api/admin-dashboard` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/edit-requests` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/my-edit-requests` | FINAL_REPORT_BUTTON_OPEN_TAB_20260613, HEADER_EDIT_REQUEST_BELL_20260726 |
| `/api/notify` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 |
| `/api/profile` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, FINAL_USER_LAST_ACTIVITY_TRACKING_20260613, Polling_60s:_nhận_cờ_"nhắc_tải_lại"_kể_cả_khi_người_dùng_không_thao_tác_gì |
| `/api/questions` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, COPILOT_CLOUDINARY_IMAGE_FIX_20260627, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 |
| `/api/version` | LH_UNIFIED_FETCH_AND_ACCESS_20260726 |

---

## exam.js (tab Kiểm tra, tách khỏi appCore)

1531 dòng · 1 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 38–1530 | 1493 | `__examOnlyRender`, `renderQuiz`, `__examResetForSubjectChange` |

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

730 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 30–150 | 121 | `APP_CONFIG`, `__LHUploadCloudinary`, `__LHTestCloudinaryConfig` |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 152–469 | 318 | `__LHGetPendingImageUpload`, `__LHUploadPendingDataUrls` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 471–662 | 192 | `__COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 664–708 | 45 | `renderEditImages` |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 710–729 | 20 | `__COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630`, `imgsHTML` |

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

625 dòng · 2 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 22–44 | 23 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 46–624 | 579 | `renderUnified`, `renderStudy`, `__renderStudyUnified` |

### Khóa localStorage

_(không có)_

### Endpoint API

_(không có)_

---

## subjectGate.js (cổng chọn môn + số câu, tách khỏi appCore)

1221 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 44–769 | 726 | `__hubPatchSubmitMerged`, `__hubPatchSignoutMerged`, `__LHCheckedOnce`, `__LHTriggerSubjectCheck`, `getSubjectsCache` …+2 |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 771–815 | 45 | `__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 817–1000 | 184 | `__SUBJECT_COUNTS_ONCE_CACHE_20260629`, `clearLearningHubSupabaseCache`, `refreshSubjectCountsOnce` |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 1002–1119 | 118 | `__clearAddSubjectDraft` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 1121–1220 | 100 | `__TURSO_SUBJECT_COUNTS_FALLBACK_20260630`, `renderSubjects` |

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
| `/api/subjects` | LEARNING_HUB_MERGED_SUBJECT_PATCH_START, SUBJECT_COUNTS_ONCE_CACHE_20260629 |

---

## adminCore.js (bundle -> admin.js)

6380 dòng · 55 block

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
| `FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627` | 3248–3372 | 125 | `loadSubjectRequests`, `filterSubjectRequests`, `previewSubjectRequestQuestionsFixed` |
| `FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628` | 3373–3487 | 115 | `openAdminReqImageForce`, `compareHTML`, `viewReq` |
| `COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628` | 3489–3567 | 79 | `__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628`, `viewHistory` |
| `COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3569–3639 | 71 | `loadSubjectRequests`, `deleteBadSubjectRequest`, `filterSubjectRequests` |
| `END_COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 3640–3641 | 2 | — |
| `MANUAL_ADMIN_RELOAD_ONLY_20260629` | 3642–3645 | 4 | — |
| `COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629` | 3647–3728 | 82 | `__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629`, `startAdminRealtime`, `startAdminRealtimeFinal`, `stopAdminRealtime`, `stopAdminRealtimeFinal` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629` | 3730–3794 | 65 | `__MOBILE_APPROVAL_LITE_ADMIN_20260629` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629_END` | 3795–3796 | 2 | — |
| `ADMIN_PROFILE_PATCH_DEDUPE_20260629` | 3797–3830 | 34 | `__ADMIN_PROFILE_PATCH_DEDUPE_20260629` |
| `COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 3832–4208 | 377 | `__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630`, `openSubjectFolderAdmin`, `renderSubjectAdminList`, `loadSubjectsAdmin` |
| `END_COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 4209–4210 | 2 | — |
| `COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4211–4346 | 136 | `__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630`, `openEditSubjectAdmin`, `saveSubjectAdmin` |
| `END_COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 4347–4348 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4349–4593 | 245 | `__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `toggleSubjectNewBadgeFromCard`, `toggleSubjectFolderNewBadge` …+1 |
| `END_COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 4594–4595 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4596–4597 | 2 | — |
| `END_COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 4598–4599 | 2 | — |
| `COPILOT_ADMIN_RELOAD_FIX_20260630` | 4600–4740 | 141 | `__COPILOT_ADMIN_RELOAD_FIX_20260630`, `loadAll`, `__adminDashRenderedText` |
| `END_COPILOT_ADMIN_RELOAD_FIX_20260630` | 4741–4742 | 2 | — |
| `COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4743–4791 | 49 | `__COPILOT_HIDE_USERS_FROM_EDITOR_20260630`, `setPage`, `renderUsers` |
| `END_COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 4792–4793 | 2 | — |
| `COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 4794–5010 | 217 | `__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` |
| `END_COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 5011–5012 | 2 | — |
| `COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5013–5112 | 100 | `__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` |
| `END_COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5113–5114 | 2 | — |
| `COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5115–5177 | 63 | `__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630`, `permanentDeleteSubject`, `permanentDelete` |
| `END_COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 5178–5179 | 2 | — |
| `COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5180–5337 | 158 | `__COPILOT_EDITOR_ACCESS_HIDE_20260630`, `setPage`, `loadProfile`, `loadAll` |
| `END_COPILOT_EDITOR_ACCESS_HIDE_20260630` | 5338–5339 | 2 | — |
| `COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5340–5415 | 76 | `__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630`, `setPage` |
| `END_COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 5416–5417 | 2 | — |
| `COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630` | 5418–5644 | 227 | `__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630`, `loadRegistrationMode`, `setRegistrationMode`, `setPage`, `loadAll` |
| `COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630` | 5646–5673 | 28 | `__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630`, `approve` |
| `COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` | 5675–5679 | 5 | `__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` |
| `LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726` | 5680–5827 | 148 | `__LH_UNIFIED_FETCH_INSTALLED`, `lhToken`, `__lhAccessToken`, `fetch` |
| `FIX_ADMIN_AUTO_REFRESH_20260701` | 5927–6023 | 97 | `__FIX_ADMIN_AUTO_REFRESH_20260701`, `__adminDashRenderedText` |
| `OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6027–6033 | 7 | — |
| `END_OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6034–6035 | 2 | — |
| `DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725` | 6036–6216 | 181 | `closeUserActionMenuFinal`, `showUserDeviceHistoryModal`, `openUserActionMenuFinal`, `notifyReloadUser`, `notifyReloadAllUsers` …+1 |
| `ADMIN_TWO_TIERS_AND_DISCORD_TOGGLES_20260729` | 6218–6379 | 162 | `__ADMIN_TWO_TIERS_20260729`, `__lhAdminTier`, `isSystemAdmin`, `setDiscordNotification`, `renderDiscordSettings` …+1 |

### Khóa localStorage

_(không có)_

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5, SUBJECT_MANAGEMENT_20260625, COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630, COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630, COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630, LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
| `/api/admin-dashboard` | FIX_ADMIN_DASHBOARD_DEDUP_20260705, CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/notify` | DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625, DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725 |
| `/api/questions` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/settings` | COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 |
| `/api/version` | LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
