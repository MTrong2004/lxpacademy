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

10322 dòng · 72 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

| Hàm | Số block gán | Thứ tự block (cuối cùng thắng) |
| --- | --- | --- |
| `renderCard` | 4 | COPILOT_CLOUDINARY_IMAGE_FIX_20260627 → FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 → ACTIVE_SUBJECT_COUNT_SYNC_20260629 → **COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629** |
| `reset` | 2 | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627 → **FINAL_RESET_KEEP_CURRENT_TAB_20260628** |
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
| `APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627` | 1333–2079 | 747 | `getLhApiSignal`, `__LH_REVOKING_ACCESS`, `__LH_ACCESS_OK`, `handleAccessRevoked`, `__lhRealtimeConnected` …+5 |
| `HOD_Login_+_Admin_UI_(added)` | 2080–2120 | 41 | — |
| `Admin_visibility_hard_fix` | 2121–2157 | 37 | — |
| `ACCOUNT_AVATAR_CLEAN_FINAL` | 2158–2351 | 194 | — |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 2352–2355 | 4 | — |
| `ADD_SUBJECT_FEATURE_20260625_(UPGRADED_TAB_UX/UI)` | 2357–2862 | 506 | `__switchSubjectGateTab`, `__ADD_SUBJECT_AI_PROMPT`, `__switchStep`, `_dropZoneInit` |
| `QUIZLET_IMPORT_AUTODETECT_20260701` | 2863–2958 | 96 | `__LHConvertQuizlet` |
| `PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY` | 3183–3318 | 136 | `loadCurrentSubjectOnly`, `rebuild` |
| `PATCH_REMOVE_RANDOM_FEATURE_FINAL` | 3319–3351 | 33 | `shuffle` |
| `PATCH_SUPABASE_SINGLE_SOURCE_ONLY` | 3352–3366 | 15 | `HOD_DATA` |
| `FINAL_FLOATING_PARTICLES_CANVAS_20260613` | 3367–3541 | 175 | — |
| `FINAL_REPORT_BUTTON_OPEN_TAB_20260613` | 3542–3663 | 122 | — |
| `MOBILE_FLASHCARD_NAVIGATION_20260702_(viết_lại)` | 3664–4034 | 371 | `__lhSuppressFlip`, `slideChange` |
| `FINAL_USER_LAST_ACTIVITY_TRACKING_20260613` | 4035–4101 | 67 | `__LH_FINAL_USER_LAST_ACTIVITY_BOUND_20260613` |
| `Force-logout_polling:_check_every_30s_even_if_user_idle` | 4102–4130 | 29 | — |
| `FINAL_HEADER_SUBJECT_DYNAMIC_FIX_20260613` | 4131–4199 | 69 | `fixCounter`, `fixBrand` |
| `FINAL_MOVE_SUBJECT_BUTTON_LEFT_OF_SETTINGS_20260613` | 4200–4238 | 39 | — |
| `FINAL_APP_REPORT_BUTTON_NO_TOGGLE_20260614` | 4239–4373 | 135 | `openStudyReport` |
| `FINAL_LANDING_BG_MOVER_SLIGHT_PLUS_20260614` | 4374–4496 | 123 | — |
| `FINAL_SMART_SEARCH_STOPWORDS_RELEVANCE_20260614` | 4497–4938 | 442 | `renderStudy` |
| `COPILOT_MERGED_ADD_QUESTION_DISPLAY_VERSION_20260629` | 4939–5389 | 451 | `openAddQuestionModal`, `openPrettyAddModal` |
| `FINAL_PROMPT_MODAL_RUNTIME_FIX_20260625` | 5402–5507 | 106 | `__openUserAIPromptModal`, `__closeUserAIPromptModal`, `__copyUserAIPrompt` |
| `FIX_DELETE_IMPORT_FILE_20260625` | 5508–5566 | 59 | `__clearUserImportFile`, `__previewSelections` |
| `PROMPT_STEP_UX_UI_POLISH_20260625` | 5567–5631 | 65 | `__switchStep` |
| `PROMPT_STEP_INSIDE_PANEL_FIX_20260625` | 5632–5651 | 20 | — |
| `REMOVE_PROMPT_GUIDE_ROWS_20260625` | 5652–5665 | 14 | — |
| `FIX_PROMPT_MODAL_SCOPE_REMOVE_TIP_20260625` | 5666–5710 | 45 | `__openUserAIPromptModal` |
| `IMPORT_PREVIEW_INLINE_EDIT_20260625` | 5711–6139 | 429 | `__previewImportData`, `__previewQualityFilter`, `__setQualityFilter`, `__toggleQualityImage`, `__setQualityRisk` …+1 |
| `FINAL_INLINE_EDIT_KEEP_EXISTING_CARD_20260625` | 6140–6273 | 134 | `__editImportPreviewQuestion`, `__inlineAddPreviewOption`, `__cancelInlineKeepEdit`, `__saveInlineKeepEdit` |
| `INLINE_DELETE_OPTION_20260625` | 6274–6320 | 47 | `__deleteInlinePreviewOption`, `__editImportPreviewQuestion`, `__inlineAddPreviewOption` |
| `IMPORT_PREVIEW_COMPACT_UX_PATCH_20260626` | 6321–7409 | 1089 | `__previewImportData`, `__openImportPreviewModal`, `__editImportPreviewQuestion`, `__APP_UI_CLEAN_FINAL__` |
| `FINAL_EXAM_ONLY_QUIZ_UI_20260627` | 7410–7415 | 6 | — |
| `LIBRARY_LABEL_AND_UI_FIX_20260627` | 7417–7420 | 4 | — |
| `LIBRARY_FILTER_AND_EDIT_PREVIEW_LAYOUT_20260627` | 7422–7427 | 6 | — |
| `LIBRARY_UX_STEP1_STABLE_RENDER_20260627` | 7442–7445 | 4 | — |
| `COPILOT_CLOUDINARY_IMAGE_FIX_20260627` | 7447–7604 | 158 | `loadCurrentSubjectOnly`, `renderCard` |
| `FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628` | 7605–8048 | 444 | `__LHCleanImages`, `__LHUploadCloudinary`, `imgsHTML`, `renderEditImages`, `loadCurrentSubjectOnly` …+2 |
| `FINAL_UI_DEDUP_CLEANER_20260628` | 8050–8142 | 93 | — |
| `REMOVE_ANY_RELOAD_TEXT_BUTTON_20260628` | 8144–8166 | 23 | — |
| `FINAL_RESET_KEEP_CURRENT_TAB_20260628` | 8190–8253 | 64 | `resetKeepCurrentTab`, `reset`, `triggerReset` |
| `FINAL_IMAGE_NO_FLICKER_HARD_FIX_20260628` | 8255–8309 | 55 | `__LH_PRELOADED_IMAGES`, `next`, `prev` |
| `PERSIST_LAST_TAB_AND_EXAM_20260628` | 8311–8353 | 43 | — |
| `SUPABASE_CACHE_CLEAR_HELPER_20260628` | 8355–8370 | 16 | `clearLearningHubQuestionCache` |
| `COPILOT_FINAL_UPLOAD_DIAGNOSTIC_LOCK_20260628` | 8391–8394 | 4 | — |
| `COPILOT_ULTRA_FINAL_EDIT_UPLOAD_LOCK_20260628` | 8411–8414 | 4 | — |
| `COPILOT_CLEAN_RUNTIME_GUARD_20260628_(đã_rút_gọn)` | 8416–8454 | 39 | `__COPILOT_CLEAN_RUNTIME_GUARD_20260628` |
| `COPILOT_FIX_EDIT_IMAGE_VISIBLE_AFTER_SAVE_20260628` | 8456–8459 | 4 | — |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 8472–8475 | 4 | — |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 8477–8480 | 4 | — |
| `ACTIVE_SUBJECT_COUNT_SYNC_20260629` | 8482–8590 | 109 | `__ACTIVE_SUBJECT_COUNT_SYNC_20260629`, `syncActiveSubjectCount`, `loadCurrentSubjectOnly`, `loadBySubject`, `__renderCardActiveCountPatched` …+1 |
| `REMOVE_EYE_HIDE_OPTIONS_20260629` | 8596–8618 | 23 | — |
| `EXAM_UI_STYLE_MERGED_20260702` | 8620–8770 | 151 | — |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 8772–8775 | 4 | — |
| `COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629` | 8777–8831 | 55 | `__COPILOT_KEEP_IMPORT_QUESTION_ATTRIBUTES_20260629`, `__LHNormalizeQuestionAttrs`, `__LHNormalizeAll` |
| `EDIT_RENDER_NULL_GUARD_20260629` | 8833–8836 | 4 | — |
| `EDIT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 8838–8841 | 4 | — |
| `IMPORT_PREVIEW_CTRL_V_IMAGE_UPLOAD_20260629` | 8843–8961 | 119 | — |
| `TURSO_ONLY_DATA_SOURCE_20260630` | 8963–8967 | 5 | `APP_CONFIG` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 8969–8972 | 4 | — |
| `APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` | 8974–9068 | 95 | `__APP_STARTUP_AUTO_LOAD_QUESTIONS_SUBJECTS_20260630` |
| `COPILOT_FIX_IMAGE_RESET_LOSS_FINAL_20260630` | 9070–9073 | 4 | — |
| `FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701` | 9075–9359 | 285 | `__FIX_ADD_SUBJECT_FAST_PARALLEL_UPLOAD_20260701`, `__previewImportData`, `__LH_LAST_PREVIEW_IMPORT_DATA`, `__submitSubjectRequest` |
| `LH_UNIFIED_FETCH_AND_ACCESS_20260726` | 9361–9729 | 369 | `__LH_UNIFIED_FETCH_INSTALLED`, `__lhOriginalFetch`, `__lhAccessToken`, `clearLearningHubSupabaseCache`, `fetch` …+4 |
| `BOOKMARK_QUESTIONS_FEATURE_20260726` | 9731–10043 | 313 | `__isBookmarked`, `__countBookmarks`, `__getBookmarkBtnHTML`, `updateBookmarkBtn`, `updateCardTools` |
| `HEADER_EDIT_REQUEST_BELL_20260726` | 10045–10321 | 277 | — |

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
| `/api/profile` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, FINAL_USER_LAST_ACTIVITY_TRACKING_20260613, Force-logout_polling:_check_every_30s_even_if_user_idle |
| `/api/questions` | APP_DIRECT_DISCORD_LOGIN_NOTIFY_20260627, PATCH_NO_LOCAL_QUESTIONS_SUPABASE_ONLY, COPILOT_CLOUDINARY_IMAGE_FIX_20260627, FINAL_URL_ONLY_IMAGES_AND_CURRENT_RELOAD_20260628 |
| `/api/version` | LH_UNIFIED_FETCH_AND_ACCESS_20260726 |

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

1115 dòng · 5 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

_(không có)_

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `LEARNING_HUB_MERGED_SUBJECT_PATCH_START` | 27–664 | 638 | `__hubPatchSubmitMerged`, `__hubPatchSignoutMerged`, `__LHCheckedOnce`, `__LHTriggerSubjectCheck`, `getSubjectsCache` …+2 |
| `FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` | 666–710 | 45 | `__FIX_ARIA_HIDDEN_SUBJECT_GATE_20260629` |
| `SUBJECT_COUNTS_ONCE_CACHE_20260629` | 712–894 | 183 | `__SUBJECT_COUNTS_ONCE_CACHE_20260629`, `clearLearningHubSupabaseCache`, `refreshSubjectCountsOnce` |
| `CLEAR_ADD_SUBJECT_DRAFT_NEW_SESSION_20260629` | 896–1013 | 118 | `__clearAddSubjectDraft` |
| `TURSO_SUBJECT_COUNTS_FALLBACK_20260630` | 1015–1114 | 100 | `__TURSO_SUBJECT_COUNTS_FALLBACK_20260630`, `renderSubjects` |

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

7117 dòng · 58 block

### Hàm bị ghi đè nhiều lần (bản CUỐI = bản đang chạy)

| Hàm | Số block gán | Thứ tự block (cuối cùng thắng) |
| --- | --- | --- |
| `setPage` | 7 | ACCESS_APPROVAL_ADMIN_20260624 → SUBJECT_MANAGEMENT_20260625 → …3 block nữa… → COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630 → **COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630** |

### Danh sách block

| Block | Dòng | Số dòng | Gán ra window.* |
| --- | --- | --- | --- |
| `FIX_ADMIN_DASHBOARD_DEDUP_20260705` | 206–259 | 54 | `__FIX_ADMIN_DASHBOARD_DEDUP_20260705`, `__adminDashboardBusy`, `__adminDashboardLoadedOnce`, `__invalidateAdminDashboardCache`, `__fetchAdminDashboardJSON` |
| `CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5` | 886–1483 | 598 | `adminAction`, `updateRequestBadge` |
| `F5_SUPABASE_MICRO_CACHE_20260629` | 1484–1582 | 99 | `__F5_SUPABASE_MICRO_CACHE_20260629` |
| `FINAL_ADMIN_HISTORY_SHOW_EDITOR_EMAIL_20260613` | 1586–1682 | 97 | `renderHistory`, `viewHistoryFixed` |
| `FINAL_ADMIN_SUBJECT_TABS_ADD_DELETE_QUESTIONS_20260613` | 1683–1825 | 143 | `openAddQuestionAdmin`, `saveNewQuestionAdmin`, `deleteQuestionAdmin` |
| `ACCESS_APPROVAL_ADMIN_20260624` | 1826–1947 | 122 | `filterApprovals`, `approveUser`, `rejectUser` |
| `AI_IMPORT_QUESTIONS_20260624` | 1948–2327 | 380 | `switchImportTab`, `copyAIPrompt`, `previewAIImport`, `executeAIImport`, `openAddSubjectAI` |
| `SUBJECT_MANAGEMENT_20260625` | 2328–2536 | 209 | `deleteSubjectAdmin`, `approveSubjectRequest`, `rejectSubjectRequest` |
| `HOTFIX_UX/UI_ADMIN:_NOTIFICATIONS_&_TRASH_OVERLAPPING_REPAIR` | 2537–2650 | 114 | — |
| `FINAL_ADMIN_SUBJECT_EDIT_20260625` | 2651–3110 | 460 | `loadSubjectsAdmin`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `saveSubjectAdmin`, `organizeAdminSidebar` …+1 |
| `FINAL_TRASH_COMPACT_ROBUST_DELETE_20260625` | 3111–3354 | 244 | `loadTrash`, `restoreQuestion`, `permanentDelete`, `restoreSubject`, `permanentDeleteSubject` …+1 |
| `DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625` | 3355–3390 | 36 | — |
| `FINAL_DOTS_MENU_FIXED_NO_JITTER_20260625` | 3391–3484 | 94 | `closeUserActionMenuFinal`, `openUserActionMenuFinal`, `openUserAvatarFinal` |
| `FORCE_REVOKE_IN_USER_DOTS_20260625` | 3485–3533 | 49 | `openUserActionMenuFinal` |
| `REVOKE_MOVES_USER_TO_APPROVAL_AND_APPROVED_USERS_UI_20260625` | 3534–3575 | 42 | `revokeApproval` |
| `FINAL_APPROVAL_UI_AND_REMOVE_USER_NOTE_20260625` | 3576–3811 | 236 | `renderUsers`, `renderApprovals`, `__ADMIN_UI_CLEAN_FINAL__` |
| `COPILOT_ADMIN_CLOUDINARY_IMAGE_FIX_20260627` | 3812–3989 | 178 | `removeDirectEditImage`, `editQuestionDirect`, `saveQuestionDirect` |
| `COPILOT_ADMIN_QUESTION_PAGE_FINAL_OVERRIDE_20260627` | 3990–4130 | 141 | `__ADMIN_PAGE_STATE__`, `__adminSyncQuestionPage`, `setQuestionSubjectFilter`, `adminQuestionPage`, `renderQuestions` …+1 |
| `FINAL_FIX_REQUESTS_AND_SUBJECT_REQUESTS_20260627` | 4131–4256 | 126 | `loadSubjectRequests`, `filterSubjectRequests`, `previewSubjectRequestQuestionsFixed` |
| `FIX_ADMIN_REQUEST_IMAGES_FORCE_20260628` | 4257–4371 | 115 | `openAdminReqImageForce`, `compareHTML`, `viewReq` |
| `COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628` | 4373–4451 | 79 | `__COPILOT_ADMIN_RELOAD_DATA_GUARD_20260628`, `viewHistory` |
| `COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 4453–4523 | 71 | `loadSubjectRequests`, `deleteBadSubjectRequest`, `filterSubjectRequests` |
| `END_COPILOT_DELETE_BAD_SUBJECT_REQUEST_20260629` | 4524–4525 | 2 | — |
| `MANUAL_ADMIN_RELOAD_ONLY_20260629` | 4526–4529 | 4 | — |
| `COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629` | 4531–4612 | 82 | `__COPILOT_DISABLE_ALL_ADMIN_REALTIME_FINAL_20260629`, `startAdminRealtime`, `startAdminRealtimeFinal`, `stopAdminRealtime`, `stopAdminRealtimeFinal` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629` | 4614–4678 | 65 | `__MOBILE_APPROVAL_LITE_ADMIN_20260629` |
| `MOBILE_APPROVAL_LITE_ADMIN_20260629_END` | 4679–4680 | 2 | — |
| `ADMIN_PROFILE_PATCH_DEDUPE_20260629` | 4681–4714 | 34 | `__ADMIN_PROFILE_PATCH_DEDUPE_20260629` |
| `COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 4716–5095 | 380 | `__COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630`, `openSubjectFolderAdmin`, `renderSubjectAdminList`, `loadSubjectsAdmin` |
| `END_COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630` | 5096–5097 | 2 | — |
| `COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 5098–5233 | 136 | `__COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630`, `openEditSubjectAdmin`, `saveSubjectAdmin` |
| `END_COPILOT_ADMIN_SUBJECT_NEW_BADGE_TOGGLE_20260630` | 5234–5235 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 5236–5472 | 237 | `__COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630`, `renderSubjectAdminList`, `openEditSubjectAdmin`, `toggleSubjectNewBadgeFromCard`, `toggleSubjectFolderNewBadge` …+1 |
| `END_COPILOT_SUBJECT_NEW_BADGE_ON_CARD_20260630` | 5473–5474 | 2 | — |
| `COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 5475–5476 | 2 | — |
| `END_COPILOT_SUBJECT_NEW_BADGE_FAST_LOAD_20260630` | 5477–5478 | 2 | — |
| `COPILOT_ADMIN_RELOAD_FIX_20260630` | 5479–5613 | 135 | `__COPILOT_ADMIN_RELOAD_FIX_20260630`, `loadAll`, `__adminDashRenderedText` |
| `END_COPILOT_ADMIN_RELOAD_FIX_20260630` | 5614–5615 | 2 | — |
| `COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 5616–5664 | 49 | `__COPILOT_HIDE_USERS_FROM_EDITOR_20260630`, `setPage`, `renderUsers` |
| `END_COPILOT_HIDE_USERS_FROM_EDITOR_20260630` | 5665–5666 | 2 | — |
| `COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 5667–5914 | 248 | `__COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` |
| `END_COPILOT_POLISH_SUBJECT_ADMIN_LAYOUT_20260630` | 5915–5916 | 2 | — |
| `COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 5917–6017 | 101 | `__COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` |
| `END_COPILOT_SUBJECT_ADMIN_NO_OVERLAP_RUNTIME_20260630` | 6018–6019 | 2 | — |
| `COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 6020–6082 | 63 | `__COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630`, `permanentDeleteSubject`, `permanentDelete` |
| `END_COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630` | 6083–6084 | 2 | — |
| `COPILOT_EDITOR_ACCESS_HIDE_20260630` | 6085–6242 | 158 | `__COPILOT_EDITOR_ACCESS_HIDE_20260630`, `setPage`, `loadProfile`, `loadAll` |
| `END_COPILOT_EDITOR_ACCESS_HIDE_20260630` | 6243–6244 | 2 | — |
| `COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 6245–6320 | 76 | `__COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630`, `setPage` |
| `END_COPILOT_KEEP_ADMIN_TAB_AFTER_RESET_20260630` | 6321–6322 | 2 | — |
| `COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630` | 6323–6549 | 227 | `__COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630`, `loadRegistrationMode`, `setRegistrationMode`, `setPage`, `loadAll` |
| `COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630` | 6551–6578 | 28 | `__COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630`, `approve` |
| `COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` | 6580–6584 | 5 | `__COPILOT_ADMIN_IMAGE_CACHE_REALTIME_FINAL_20260630` |
| `LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726` | 6585–6732 | 148 | `__LH_UNIFIED_FETCH_INSTALLED`, `lhToken`, `__lhAccessToken`, `fetch` |
| `FIX_ADMIN_AUTO_REFRESH_20260701` | 6832–6925 | 94 | `__FIX_ADMIN_AUTO_REFRESH_20260701`, `__adminDashRenderedText` |
| `OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6929–6935 | 7 | — |
| `END_OPEN_ADMIN_REQUESTS_FROM_LEARNING_BELL_20260719` | 6936–6937 | 2 | — |
| `DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725` | 6938–7116 | 179 | `closeUserActionMenuFinal`, `showUserDeviceHistoryModal`, `openUserActionMenuFinal`, `forceLogoutUser`, `forceLogoutAllUsers` …+1 |

### Khóa localStorage

| Khóa | Block dùng |
| --- | --- |
| `admin_question_subject_filter_v1` | FINAL_ADMIN_SUBJECT_TABS_ADD_DELETE_QUESTIONS_20260613, SUBJECT_MANAGEMENT_20260625, COPILOT_ADMIN_QUESTION_PAGE_FINAL_OVERRIDE_20260627 |

### Endpoint API

| Endpoint | Block gọi |
| --- | --- |
| `/api/admin-action` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5, AI_IMPORT_QUESTIONS_20260624, SUBJECT_MANAGEMENT_20260625, COPILOT_ADMIN_CLOUDINARY_IMAGE_FIX_20260627, COPILOT_COMPACT_DRAG_SUBJECT_ORDER_20260630, COPILOT_FIX_TRASH_PERMANENT_DELETE_SUBJECT_API_20260630, COPILOT_ADMIN_IMAGE_PERSIST_TURSO_20260630, LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
| `/api/admin-dashboard` | FIX_ADMIN_DASHBOARD_DEDUP_20260705, CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/notify` | DISCORD_NOTIFICATIONS_CLIENT_SIDE_PATCH_20260625, DEVICE_HISTORY_AND_DOTS_MENU_FINAL_20260725 |
| `/api/questions` | CHỈ_THÔNG_BÁO_LOGIN_KHI_KHÔNG_PHẢI_LÀ_F5 |
| `/api/settings` | COPILOT_ADMIN_REG_MODE_AND_PAGE_RESTORE_FIX_20260630 |
| `/api/version` | LH_UNIFIED_SINGLE_FETCH_INTERCEPTOR_20260726 |
