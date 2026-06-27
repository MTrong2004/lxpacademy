# Quy Trình Chuyển Dự Án Learning Hub Sang React - Bản Đầy Đủ

Tài liệu này dùng để gửi cho chatbot khác hoặc developer khác hiểu rõ cách chuyển dự án Learning Hub hiện tại sang React + Vite + Supabase.

Mục tiêu của tài liệu:

```text
- Không bỏ sót chức năng cũ
- Không sửa trực tiếp bản cũ
- Làm bản React mới song song
- Giữ giao diện gần giống bản cũ trước
- Dọn rác CSS/JS sau
- Tối ưu token khi làm với nhiều chatbot
```

---

## 1. Bối cảnh dự án hiện tại

Dự án hiện tại là web học tập, flashcard, quiz và admin dùng HTML, CSS và JavaScript thuần.

Các file chính:

```text
index.html
app.js
app.css
admin.html
admin.js
admin.css
landing.css
background.webp
database.sql
schema.sql
seed_questions.sql
```

Dự án hiện tại có nhiều patch/hotfix chồng lên nhau. Khi chuyển sang React, không nên bê nguyên các patch này sang. Chỉ nên dùng để hiểu logic và viết lại sạch hơn.

---

## 2. Mục tiêu chuyển sang React

```text
- Code dễ quản lý hơn
- Giao diện chia thành component rõ ràng
- Bỏ dần patch/hotfix cũ
- Giảm tình trạng UI cũ bị đè UI mới
- Dễ mở rộng môn học, quiz, báo cáo, admin
- Dễ bảo trì mobile/responsive
```

Công nghệ đề xuất:

```text
React + Vite + Supabase
```

Không cần dùng Next.js ở giai đoạn đầu.

---

## 3. Nguyên tắc chuyển đổi

```text
1. Không chuyển toàn bộ trong một lần.
2. Không sửa trực tiếp bản cũ.
3. Tạo bản React mới song song trong thư mục learninghub-react.
4. Giai đoạn đầu ưu tiên React Legacy UI để giao diện giống bản cũ.
5. Sau khi chạy ổn mới dọn CSS/JS.
6. Admin chuyển sau cùng.
```

---

## 4. Chọn hướng chuyển đổi

### Hướng A: React Clean UI

Viết lại giao diện sạch hơn.

Ưu điểm:

```text
- Code sạch
- Dễ bảo trì
- Ít rác
```

Nhược điểm:

```text
- Giao diện ban đầu không giống 100% bản cũ
- Cần chỉnh CSS lại nhiều
```

### Hướng B: React Legacy UI

Giữ class/id/layout gần giống bản cũ, chỉ chuyển logic sang React.

Ưu điểm:

```text
- Giao diện giống bản cũ nhất
- Ít thay đổi trải nghiệm người dùng
```

Nhược điểm:

```text
- Có thể mang theo một phần CSS rác
- Cần dọn sau
```

### Khuyến nghị

```text
Giai đoạn A: React Legacy UI để giống bản cũ
Giai đoạn B: React Clean UI để dọn rác
Giai đoạn C: Admin React
```

---

## 5. Cách giữ giao diện giống bản cũ

Muốn giống giao diện cũ nhất có thể:

```text
- Giữ id cũ
- Giữ className cũ
- Giữ layout DOM gần giống cũ
- Copy CSS legacy trước
- Chỉ chuyển logic sang React trước
- Không thay giao diện lớn khi chưa so ảnh
```

Ví dụ HTML cũ:

```html
<div id="fc" class="pane active">
  <div class="top">
    <div class="brand"></div>
  </div>
  <div class="card">
    <div class="front"></div>
    <div class="back"></div>
  </div>
</div>
```

React nên giữ gần giống:

```jsx
<div id="fc" className="pane active">
  <div className="top">
    <div className="brand"></div>
  </div>
  <div className="card">
    <div className="front"></div>
    <div className="back"></div>
  </div>
</div>
```

---

## 6. Tạo dự án React mới

Chạy:

```bash
npm create vite@latest learninghub-react -- --template react
cd learninghub-react
npm install
npm install @supabase/supabase-js
npm run dev
```

Copy ảnh nền:

```text
background.webp
```

vào:

```text
learninghub-react/public/background.webp
```

---

## 7. Cấu trúc thư mục đề xuất

```text
learninghub-react/
  public/
    background.webp

  src/
    components/
      Header.jsx
      LoginGate.jsx
      PendingApproval.jsx
      SubjectPicker.jsx
      AddSubject.jsx
      Flashcard.jsx
      Quiz.jsx
      StudyList.jsx
      AccountMenu.jsx
      ReportModal.jsx
      SettingsModal.jsx
      EditReportModal.jsx
      AddQuestionModal.jsx
      ImageLightbox.jsx
      Toast.jsx

    admin/
      AdminApp.jsx
      AdminLogin.jsx
      AdminLayout.jsx
      DashboardPage.jsx
      UsersPage.jsx
      QuestionsPage.jsx
      ReportsPage.jsx
      SubjectsPage.jsx
      SubjectRequestsPage.jsx
      TrashPage.jsx
      LogsPage.jsx

    lib/
      supabase.js
      auth.js
      profiles.js
      subjects.js
      questions.js
      reports.js
      activity.js
      search.js

    styles/
      legacy-app.css
      legacy-admin.css
      app.css
      admin.css

    App.jsx
    main.jsx
```

---

## 8. File Supabase trong React

Tạo file:

```text
src/lib/supabase.js
```

Nội dung:

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bdbkpqnhavyoalgkvqtw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_h-AYsKKK57i0uJpBxJeCHA_csNkgjyB'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

Lưu ý:

```text
Không đưa service_role key vào frontend.
Chỉ dùng anon/public key.
```

---

## 9. Bảng Supabase cần giữ

```text
profiles
subjects
questions
edit_requests
question_history
admin_logs
site_settings
deleted_questions
subject_requests
```

Ý nghĩa chính:

```text
profiles: user, role, approved, blocked, last_login, last_activity
subjects: danh sách môn học
questions: câu hỏi theo subject_code
edit_requests: báo cáo/chỉnh sửa chờ duyệt
question_history: lịch sử sửa câu hỏi
admin_logs: log admin
site_settings: cấu hình đăng ký open/closed/approval
subject_requests: yêu cầu thêm môn
```

---

## 10. Luồng app React

```text
Mở web
↓
Kiểm tra session Supabase
↓
Nếu chưa đăng nhập: hiện LoginGate
↓
Nếu đã đăng nhập: load profile
↓
Nếu profile.approved === false: hiện PendingApproval
↓
Nếu blocked: báo bị khóa và signOut
↓
Nếu hợp lệ: load subjects
↓
Người dùng chọn môn
↓
Load questions theo subject_code
↓
Hiện Flashcard / Quiz / StudyList
```

---

## 11. State chính trong App.jsx

```js
const [user, setUser] = useState(null)
const [profile, setProfile] = useState(null)
const [subjects, setSubjects] = useState([])
const [selectedSubject, setSelectedSubject] = useState(null)
const [questions, setQuestions] = useState([])
const [currentIndex, setCurrentIndex] = useState(0)
const [activeTab, setActiveTab] = useState('flashcard')
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [toast, setToast] = useState('')
```

---

## 12. Danh sách chức năng KHÔNG được bỏ sót

Đây là danh sách bổ sung sau khi quét lại `app.js` và `app.css`.

### 12.1. Đăng nhập và tài khoản

```text
- Đăng nhập Google bằng Supabase
- Đăng xuất
- Lấy session hiện tại
- Lắng nghe auth state change
- Tự tạo profile mới nếu chưa có
- Registration mode: open / closed / approval trong site_settings
- Chặn tài khoản blocked / is_blocked / status = blocked
- Trạng thái pending approval
- Nút kiểm tra lại khi đang chờ duyệt
- Nút đăng xuất khi đang chờ duyệt
- Hiện avatar Google hoặc chữ cái đầu email
- Menu tài khoản
- Nút mở admin dashboard nếu là admin
- Ẩn admin với user thường
- Cập nhật last_login
- Cập nhật last_activity khi user hoạt động
- Gửi thông báo login sang Discord webhook nếu vẫn muốn giữ
```

### 12.2. Môn học

```text
- Load danh sách môn từ subjects
- Chỉ lấy môn is_active = true
- Đếm số câu từng môn
- Tìm kiếm môn học
- Chọn môn
- Lưu môn đã chọn vào localStorage
- Lưu tiến độ riêng theo từng subject_code
- Đổi môn từ header/account menu
- Header đổi tiêu đề theo môn đang chọn
- Nếu chưa chọn môn thì mở bảng chọn môn
- Nếu môn chưa có câu thì hiển thị trạng thái rỗng
- Fallback subjects nếu không tải được danh sách môn
```

### 12.3. Thêm môn mới từ phía user

```text
- Tab Danh sách môn học / Thêm môn mới trong bảng chọn môn
- Form thêm môn gồm mã môn, tên môn, mô tả
- Prompt AI tạo câu hỏi
- Nút copy prompt
- Modal xem prompt
- Link mở Gemini / ChatGPT / Claude
- Import file .md / .txt / .json
- Kéo thả file import
- Parse JSON trong markdown code block
- Xem trước câu hỏi import
- Kiểm tra thiếu question/options/answer
- Lọc/chọn câu hỏi trước khi lưu nếu có preview
- Nếu admin/editor: tạo môn và import câu hỏi trực tiếp
- Nếu user thường: gửi yêu cầu thêm môn cho admin duyệt qua subject_requests
```

### 12.4. Flashcard

```text
- Hiển thị câu hỏi, ảnh, lựa chọn, đáp án
- Ảnh trong câu hỏi
- Lật thẻ mặt trước/mặt sau
- Hướng lật ngang / lên / xuống
- Chế độ lật 1 lần / 2 lần nếu còn dùng
- Next / Prev
- Lưu currentIndex vào localStorage
- Thanh tiến độ
- Ẩn/hiện lựa chọn
- Nút báo cáo/sửa câu hỏi
- Nút công cụ trên card
- Điều chỉnh cỡ chữ card
- Vào câu theo số câu trong Settings
- Mobile nav bằng nút trái/phải
- Vuốt trái/phải trên mobile để đổi câu
- Ẩn random/shuffle nếu bản mới không dùng nữa
```

### 12.5. Keyboard shortcuts

```text
- Space: lật thẻ
- ArrowRight: câu tiếp theo
- ArrowLeft: câu trước
- ArrowUp: lật hướng lên
- ArrowDown: lật hướng xuống
- R: reset
- H: ẩn/hiện lựa chọn
- E: mở sửa/báo cáo
- 1/2/3: chuyển tab nếu vẫn giữ phím tắt
```

### 12.6. Settings

```text
- Modal cài đặt
- Đóng modal bằng nút X hoặc click nền
- Chỉnh cỡ chữ flashcard
- Reset cỡ chữ
- Đổi chế độ lật
- Ẩn/hiện lựa chọn
- Vào câu theo số
- Mở form sửa/báo cáo từ settings
- Hướng dẫn sử dụng nếu vẫn giữ guide panel
```

### 12.7. Quiz / Luyện tập

```text
- Practice mode
- Exam mode
- Chọn số câu: 10 / 20 / 30 / 40 / 100 / tất cả
- Random/sample câu hỏi cho quiz
- Chọn đáp án một hoặc nhiều đáp án
- Kiểm tra từng câu trong practice
- Nộp bài trong exam
- Timer exam
- Tính điểm
- Overlay kết quả
- Retry quiz
- Hiển thị câu đúng/sai
- Hiển thị đáp án đúng
- Hỗ trợ câu có ảnh trong quiz
```

### 12.8. Study / Tab Tất cả

```text
- Hiển thị toàn bộ câu hỏi của môn
- Không giới hạn 120/160/180 kết quả
- Search thông minh
- Tìm theo số câu: 3 hoặc #3
- Tìm theo answer:B hoặc answer:BC
- Tìm câu nhiều đáp án bằng multi
- Bỏ dấu tiếng Việt khi tìm
- Bỏ stopwords tiếng Anh/tiếng Việt
- Fuzzy search nhẹ
- Ưu tiên đúng cụm
- Highlight từ khóa
- Tự mở thẻ nếu keyword khớp đáp án đúng
- Compact card: mặc định gọn, bấm mở để xem đáp án
- Nút báo cáo cạnh nút Mở
- Báo cáo đúng câu từ StudyList
- Hiển thị ảnh trong StudyList
- Đánh dấu đáp án đúng
```

### 12.9. Báo cáo / Sửa câu hỏi

```text
- Mở modal sửa/báo cáo từ flashcard
- Mở modal báo cáo từ StudyList
- User thường gửi edit_requests chờ admin duyệt
- Admin/editor sửa trực tiếp câu hỏi
- Lưu question_history khi sửa trực tiếp hoặc duyệt báo cáo
- Sửa question/options/answer
- Upload ảnh vào câu hỏi trong modal sửa
- Xóa ảnh trong modal sửa
- Local edit fallback nếu chưa dùng Supabase
- Export local edits
- Import local edits
- Clear local edits
- Restore câu hỏi local

Bổ sung bắt buộc cho phần báo cáo:
- Modal báo cáo phải có ô chọn lý do báo cáo
- Lý do gợi ý: Sai đáp án / Câu hỏi sai hoặc thiếu dữ kiện / Thiếu hoặc lỗi hình ảnh / Lỗi chính tả / Khác
- Có ô ghi chú thêm cho user nhập chi tiết
- Khi gửi báo cáo phải lưu reason vào edit_requests
- Khi gửi báo cáo phải lưu subject_code của môn hiện tại vào edit_requests
- Nếu câu hỏi chưa có id nhưng có subject_code + num thì phải tìm lại id trong Supabase trước khi gửi
- Chống gửi trùng: nếu user đã có report pending cho cùng question_id thì không cho gửi thêm
- User thường chỉ được gửi báo cáo chờ duyệt
- Admin/editor sửa trực tiếp câu hỏi trong app học, không cần tạo request chờ duyệt
- Khi admin/editor sửa trực tiếp: update questions, lưu question_history, ghi admin_logs
- Khi gửi báo cáo thành công: đóng modal và hiện toast thông báo
- Khi gửi thất bại: báo lỗi rõ ràng cho user
```

Gợi ý cột nên có trong `edit_requests`:
```text
id
question_id
question_num
subject_code
user_id
user_email
old_data
new_data
reason
status
admin_note
reviewed_by
reviewed_at
created_at
```

Nếu database cũ chưa có `subject_code` hoặc `reason`, nên bổ sung:
```sql
alter table edit_requests add column if not exists subject_code text;
alter table edit_requests add column if not exists reason text;
```

### 12.10. Báo cáo đã gửi của user

```text
- Nút Báo cáo đã gửi trong menu tài khoản
- Modal danh sách báo cáo đã gửi
- Trạng thái: pending / approved / rejected
- Hiển thị admin_note nếu có
- Nút tải lại danh sách báo cáo

Bổ sung nên có:
- Hiển thị subject_code / tên môn của từng báo cáo
- Hiển thị số câu question_num
- Hiển thị lý do báo cáo reason
- Hiển thị thời gian gửi created_at
- Bộ lọc trạng thái: Tất cả / Đang chờ / Đã duyệt / Từ chối
- Ô tìm kiếm theo số câu hoặc mã môn
- Nút xem nội dung trước / sau: old_data và new_data
- Empty state: Bạn chưa gửi báo cáo nào
- Error state: Không tải được báo cáo
- Nên giới hạn 50-80 báo cáo gần nhất để modal nhẹ
- Nếu có báo cáo vừa được duyệt/từ chối thì có thể hiện badge hoặc toast nhắc user
```

### 12.11. Admin/editor thao tác trong app học

```text
- Admin/editor thấy nút + ở tab Tất cả
- Nút + chỉ hiện ở tab Study/Tất cả nếu vẫn giữ logic này
- Thêm câu hỏi trực tiếp vào Supabase
- Form thêm câu hỏi gọn
- Thêm đáp án A-E
- Thêm ảnh cho câu hỏi mới nếu vẫn giữ tính năng upload ảnh
- Lưu question_history khi thêm câu
- Nút xóa câu hỏi cạnh nút Mở/Thu gọn nếu vẫn giữ
```

### 12.12. Hình ảnh và lightbox

```text
- Hiển thị hình trong flashcard
- Hiển thị hình trong quiz
- Hiển thị hình trong StudyList
- Upload ảnh khi sửa/thêm câu hỏi
- Preview ảnh
- Xóa ảnh
- Lightbox xem ảnh lớn nếu vẫn giữ v7ImageLightbox
```

### 12.13. Landing/Login UI

```text
- background.webp
- Nền login có chuyển động nhẹ nếu muốn giữ
- Particle canvas trên landing nếu muốn giữ
- Hiệu ứng hover nút Google
- Mobile login layout
- Reduced motion nếu người dùng bật giảm chuyển động
```

### 12.14. UI/UX phụ

```text
- Toast thông báo
- Modal X auto close
- Click ngoài modal để đóng
- Custom scrollbar
- Tắt tap highlight trên mobile
- Focus-visible cơ bản
- Hover/active button effects
- Không hiện ghost UI/login cũ/floating auth cũ
- Supabase single source only: không dùng dữ liệu local cũ làm nguồn chính
- Local dev bypass file:// nếu vẫn muốn test offline
```



### 12.15. Admin dashboard / quản trị không được bỏ sót

Phần này bổ sung sau khi quét lại `admin.js` và `admin.css`.

```text
- Đăng nhập Google riêng cho admin.html
- Chặn user không phải admin/editor bằng màn deny
- Phân quyền admin/editor/user
- Admin mới được cấp/gỡ quyền, block/unblock, xóa vĩnh viễn
- Editor được vào admin nhưng bị giới hạn quyền
- Ghi nhớ page admin đang mở bằng sessionStorage
- Nút mở trang học index.html từ admin
- Tải lại toàn bộ dữ liệu bằng nút Tải lại
- Trạng thái busy/loading khi admin thao tác
- Toast thông báo thành công
- Error box hiển thị lỗi Supabase
- Modal đóng bằng nút X, phím Escape, hoặc click nền
```

### 12.16. Admin overview / thống kê

```text
- Thống kê tổng user
- Thống kê số editor
- Thống kê request đang chờ
- Thống kê user bị block
- Thống kê user chờ duyệt
- Danh sách request gần đây
- Danh sách admin logs gần đây
- Editor không được xem admin logs nếu không có quyền
```

### 12.17. Admin quản lý user

```text
- Danh sách user
- Tìm kiếm user theo email, id, role, last_activity
- Sắp xếp user theo hoạt động gần nhất
- Hiển thị trạng thái đang hoạt động / phút trước / thời gian cụ thể
- Tự refresh hoạt động user định kỳ
- Xem lịch sử sửa của từng user
- Block / unblock user
- Cấp / gỡ editor
- Cấp / gỡ admin
- Chặn tự khóa tài khoản đang dùng
- Chặn tự gỡ quyền admin của tài khoản đang dùng
- Menu 3 chấm thao tác user
- Avatar user trong danh sách
- Thu hồi duyệt user và đưa user về danh sách chờ duyệt nếu còn giữ logic này
```

### 12.18. Admin duyệt tài khoản mới

```text
- Trang/tabs approvals
- Chỉ hiện user đang chờ duyệt nếu đang ở filter pending
- Duyệt tài khoản mới
- Từ chối tài khoản mới
- Thu hồi duyệt tài khoản đã duyệt
- User bị thu hồi duyệt quay lại danh sách chờ duyệt
- Bộ lọc trạng thái trong danh sách duyệt
- Avatar/email/role trong card duyệt
- Nút reload approvals
```

### 12.19. Admin requests / báo cáo sửa câu hỏi

```text
- Danh sách edit_requests
- Lọc request theo all / pending / approved / rejected
- Tìm kiếm request
- Hiển thị câu số mấy, người gửi, thời gian gửi
- Hiển thị các field thay đổi: câu hỏi, đáp án, lựa chọn, ảnh
- So sánh trước/sau bằng modal diff
- Ẩn answer_text khỏi diff nếu không cần
- Ẩn images diff nếu không có ảnh thật
- Duyệt request
- Từ chối request kèm admin_note
- Khi duyệt: cập nhật questions
- Khi duyệt: cập nhật edit_requests status
- Khi duyệt: ghi question_history
- Khi duyệt/từ chối: ghi admin_logs
- Gửi Discord notification cho action nếu vẫn giữ webhook

Bổ sung bắt buộc:
- Hiển thị subject_code để admin biết báo cáo thuộc môn nào
- Hiển thị reason để admin biết lý do user báo cáo
- Tìm kiếm theo subject_code, question_num, user_email, reason
- Lọc nhanh theo môn học nếu có nhiều môn
- Khi duyệt request phải ghi subject_code và question_num vào question_history nếu bảng có cột này
- Khi từ chối phải bắt nhập admin_note hoặc cho phép bỏ trống nhưng vẫn lưu trạng thái rõ ràng
- Khi duyệt/từ chối phải ghi admin_logs gồm request_id, question_id, question_num, subject_code, admin_email
- Nếu update questions thành công nhưng update edit_requests/question_history/admin_logs lỗi thì phải báo rõ phần nào lỗi
- Phải reload lại câu hỏi sau khi duyệt để user thấy dữ liệu mới
```

### 12.20. Admin lịch sử chỉnh sửa

```text
- Trang History
- Hiển thị số câu đúng thay vì chỉ question_id
- Hiển thị mã môn subject_code nếu có
- Hiển thị Gmail người sửa thay vì UUID nếu tìm được profile
- Hiển thị nội dung câu hỏi trong lịch sử
- Hiển thị field đã thay đổi dạng chips
- Modal trước/sau để xem previous_data và new_data
- Tìm kiếm trong lịch sử
```

### 12.21. Admin quản lý câu hỏi

```text
- Tải toàn bộ câu hỏi, không bị giới hạn 100/300 câu
- Load phân trang/range để lấy nhiều hơn 1000 dòng nếu cần
- Tab lọc câu hỏi theo môn subject_code
- Lưu subject filter vào localStorage
- Đếm số câu theo từng môn
- Tìm kiếm câu hỏi thông minh
- Tìm kiếm bỏ dấu tiếng Việt
- Tìm kiếm bỏ dấu câu/khoảng trắng
- Tìm số chính xác: nhập 3 thì ưu tiên Câu 3
- Highlight từ khóa/cụm từ tìm kiếm
- Giao diện card câu hỏi dạng compact, bấm mở/thu gọn
- Tự mở chi tiết khi search khớp đáp án nếu còn giữ logic này
- Hiển thị đáp án đúng
- Hiển thị options A-E
- Hiển thị ảnh câu hỏi bên phải card
- Hỗ trợ nhiều dạng ảnh: string, JSON string, src, url, publicUrl, path, base64, dataUrl
- Mở ảnh lớn bằng modal preview
- Link mở ảnh tab mới
- Xem chi tiết câu hỏi bằng modal
```

### 12.22. Admin thêm/sửa/xóa câu hỏi

```text
- Thêm câu hỏi trong admin
- Chọn môn khi thêm câu hỏi
- Tự đề xuất số câu tiếp theo theo môn
- Nhập câu hỏi
- Nhập đáp án A-E
- Nhập đáp án đúng
- Nhập giải thích nếu có
- Lưu câu hỏi mới vào questions
- Ghi admin_logs khi thêm câu
- Sửa trực tiếp câu hỏi
- Form sửa trực tiếp có layout giống app học
- Nút Lưu/Đóng luôn dễ thấy, không cần kéo cuối form
- Sửa question/options/answer
- Tự tạo answer_text từ đáp án đúng nếu cần
- Upload nhiều ảnh khi sửa trực tiếp
- Xóa ảnh trong form sửa trực tiếp
- Lưu question_history khi sửa trực tiếp
- Ẩn/hiện câu hỏi bằng is_active
- Xóa câu hỏi: backup vào deleted_questions trước khi xóa
- Nếu backup thất bại vẫn cần báo rõ trạng thái
```

### 12.23. Admin thùng rác

```text
- Trang Trash
- Load deleted_questions
- Giao diện thùng rác compact
- Xem dữ liệu câu đã xóa
- Khôi phục câu hỏi từ deleted_questions về questions
- Xóa vĩnh viễn khỏi deleted_questions
- Hiển thị người xóa / thời gian xóa nếu có
- Chặn editor xóa vĩnh viễn nếu quyền hiện tại không cho phép
```

### 12.24. Admin quản lý môn học

```text
- Trang SubjectsPage / subjectsAdmin
- Load danh sách subjects
- Thêm môn học
- Sửa mã môn / tên môn / mô tả / trạng thái / sort_order nếu có
- Ẩn/hiện môn học bằng is_active
- Xóa môn hoặc chuyển môn vào thùng rác nếu logic cũ có dùng
- Kiểm tra trùng mã môn
- Sau khi sửa môn cần reload subject list và question tabs
```

### 12.25. Admin duyệt yêu cầu thêm môn

```text
- Trang SubjectRequestsPage
- Load subject_requests
- Xem thông tin môn user đề xuất
- Xem danh sách câu hỏi user import
- Duyệt yêu cầu thêm môn
- Khi duyệt: tạo subject mới
- Khi duyệt: import questions đi kèm nếu có
- Từ chối yêu cầu thêm môn kèm ghi chú
- Cập nhật status trong subject_requests
- Ghi admin_logs khi duyệt/từ chối
```

### 12.26. Admin cấu hình đăng ký

```text
- Load site_settings.registration_mode
- Các chế độ: open / approval / closed
- Lưu registration_mode
- Ảnh hưởng tới việc user mới được auto approve hay phải chờ duyệt
```

### 12.27. Admin import / AI preview câu hỏi

```text
- Import câu hỏi từ file nếu còn giữ trong admin
- Preview câu hỏi trước khi lưu
- Lọc chất lượng câu hỏi theo error_risk nếu có
- Hiển thị câu cần hình ảnh has_image nếu có
- Chỉnh sửa câu ngay trong preview nếu có
- Xóa câu khỏi preview
- Thêm option trong preview nếu có
- Chọn/bỏ chọn câu trước khi import
- Import nhiều câu vào đúng subject_code
```

### 12.28. Admin realtime / auto update

```text
- Realtime updates cho admin nếu còn giữ Supabase channel
- Không dùng interval 10 giây cũ nếu đã thay bằng realtime
- Chip/trạng thái realtime đặt gần ô search
- Khi có thay đổi: refresh users, requests, questions hoặc approvals phù hợp
```

### 12.29. Admin export / backup / logs / Discord

```text
- Export toàn bộ cache admin ra file hod102_admin_backup.json
- Ghi admin_logs cho các action quan trọng
- Gửi Discord notification khi admin/editor đăng nhập nếu vẫn giữ
- Gửi Discord notification khi approve/reject/block/change_role/add/delete/edit nếu vẫn giữ webhook
- Không gửi trùng login notification khi chỉ F5 trang
```


---

## 12.30. Checklist riêng cho phần báo cáo

```text
User thường:
- Mở báo cáo từ flashcard được
- Mở báo cáo từ StudyList đúng câu được
- Nhập lý do báo cáo được
- Gửi báo cáo có subject_code đúng môn hiện tại
- Không gửi trùng report pending cùng một câu
- Xem lại báo cáo đã gửi được
- Lọc báo cáo theo trạng thái được
- Tìm báo cáo theo số câu hoặc mã môn được
- Thấy admin_note khi bị từ chối hoặc đã xử lý

Admin/editor trong app học:
- Mở form sửa câu hỏi được
- Sửa trực tiếp câu hỏi, không tạo request pending
- Sau khi sửa có update questions
- Sau khi sửa có ghi question_history
- Sau khi sửa có ghi admin_logs
- Sau khi sửa reload lại dữ liệu môn hiện tại

Admin dashboard:
- Xem danh sách edit_requests đủ subject_code, question_num, user_email, reason
- Lọc theo trạng thái được
- Tìm theo môn/câu/user/lý do được
- Diff trước/sau dễ đọc
- Duyệt báo cáo cập nhật questions đúng
- Duyệt báo cáo cập nhật status = approved
- Từ chối báo cáo cập nhật status = rejected và admin_note
- Duyệt/từ chối đều ghi admin_logs
- Duyệt báo cáo có ghi question_history
```

---

## 13. Thứ tự chuyển từng phần

### Giai đoạn 1: Nền tảng app học

```text
1. Tạo dự án React
2. Cài Supabase
3. Tạo supabase.js
4. Tạo useAuth hoặc auth service
5. LoginGate
6. PendingApproval
7. Header
8. SubjectPicker
9. Load questions theo subject_code
10. Flashcard cơ bản
```

### Giai đoạn 2: Flashcard đầy đủ

```text
1. Next / Prev
2. Flip
3. Ẩn/hiện lựa chọn
4. Điều chỉnh cỡ chữ
5. SettingsModal
6. Keyboard shortcuts
7. Mobile swipe/nav
8. Hình ảnh flashcard
```

### Giai đoạn 3: Quiz

```text
1. Practice mode
2. Exam mode
3. Timer
4. Chọn số câu
5. Chọn một/nhiều đáp án
6. Tính điểm
7. Overlay kết quả
```

### Giai đoạn 4: Study / Search / Report

```text
1. StudyList compact
2. Smart search
3. Highlight
4. Auto open answer match
5. Report button từng câu
6. EditReportModal
7. User reports modal
```

### Giai đoạn 5: Thêm môn / import câu hỏi

```text
1. AddSubject tab
2. AI prompt modal/copy
3. Import md/txt/json
4. Preview câu hỏi
5. Admin/editor import trực tiếp
6. User thường gửi subject_requests
```

### Giai đoạn 6: Admin

```text
1. Admin layout
2. UsersPage
3. QuestionsPage
4. ReportsPage
5. SubjectsPage
6. SubjectRequestsPage
7. TrashPage
8. LogsPage
```

---

## 14. Những phần không nên copy nguyên sang React

```text
FINAL_PATCH
HOTFIX
setInterval dọn UI liên tục
inject CSS động không cần thiết
remove ghost UI
patch renderStudy nhiều lần
patch renderUsers nhiều lần
patch renderQuestions nhiều lần
CSS !important chồng nhiều lớp
```

Chỉ dùng các đoạn đó để hiểu chức năng cũ.

---

## 15. Quy trình tối ưu token khi làm với chatbot khác

Không gửi toàn bộ `app.js`, `app.css`, `admin.js`, `admin.css` mỗi lần.

Cách gửi đúng:

```text
Lần 1: gửi file hướng dẫn này + schema.sql + ảnh login/flashcard
Lần 2: gửi đoạn liên quan SubjectPicker
Lần 3: gửi đoạn liên quan Flashcard
Lần 4: gửi đoạn liên quan Quiz
Lần 5: gửi đoạn liên quan Study/Search/Report
Lần 6: gửi admin files khi bắt đầu làm Admin
```

---

## 16. Checklist sau mỗi giai đoạn

```text
npm run dev chạy được
không lỗi console
login Google hoạt động
profile load đúng
user chưa duyệt bị chặn
blocked user bị chặn
môn học load đúng
câu hỏi load đúng subject_code
không trộn câu hỏi môn khác
flashcard next/prev/flip hoạt động
quiz chấm điểm đúng
study search đúng
report gửi được
mobile không vỡ layout
không xuất hiện ghost UI
```

---

## 17. Checklist trước khi thay bản cũ

```text
Đã test desktop
Đã test mobile
Đã test login
Đã test logout
Đã test pending approval
Đã test blocked user
Đã test admin/editor/user thường
Đã test chọn môn
Đã test flashcard
Đã test settings
Đã test keyboard shortcuts
Đã test quiz practice/exam
Đã test StudyList/search
Đã test gửi báo cáo
Đã test xem báo cáo đã gửi
Đã test admin duyệt báo cáo
Đã test thêm/sửa/xóa/ẩn câu hỏi
Đã test thêm môn/import câu hỏi
Đã test ảnh/lightbox/upload ảnh
Đã backup bản cũ
Đã build React thành công
```

Build:

```bash
npm run build
```

Kết quả nằm trong:

```text
dist/
```

---

## 18. Prompt mẫu gửi chatbot khác

```text
Tôi muốn chuyển dự án Learning Hub từ HTML/CSS/JS thuần sang React + Vite + Supabase.

Yêu cầu:
- Không sửa trực tiếp bản cũ.
- Tạo bản React mới song song trong thư mục learninghub-react.
- Giai đoạn đầu ưu tiên React Legacy UI: giữ className/id/layout giống bản cũ để giao diện gần giống 100%.
- Không copy nguyên patch/hotfix cũ vào React.
- Chỉ viết lại logic bằng React state/hook.
- Không được bỏ sót các chức năng trong mục "Danh sách chức năng KHÔNG được bỏ sót".
- Làm từng component theo thứ tự: LoginGate, PendingApproval, SubjectPicker, Header, Flashcard trước.
- Sau đó mới làm Quiz, StudyList, ReportModal, AccountMenu, AddSubject.
- Admin làm sau cùng.
- Dùng Supabase hiện tại với bảng profiles, subjects, questions, edit_requests, question_history, subject_requests, site_settings.
- Không dùng service_role key trong frontend.

Hãy bắt đầu bằng cách tạo cấu trúc dự án React, file supabase.js, App.jsx, LoginGate.jsx, PendingApproval.jsx, SubjectPicker.jsx, Header.jsx, Flashcard.jsx và CSS legacy tối thiểu.
```

---

## 19. Kết luận

File cũ trước đó chưa liệt kê hết chức năng nhỏ. Bản này đã bổ sung các nhóm dễ bị bỏ sót:

```text
- Settings chi tiết
- Keyboard shortcuts
- Upload/xóa ảnh
- Local edit import/export
- Add subject/import AI prompt
- Smart search nâng cao
- Study report button
- Add question trực tiếp
- Mobile swipe/nav
- Last activity tracking
- Login Discord webhook
- Landing effects
- Image lightbox
- User report status modal
- Report reason/subject_code/duplicate guard/admin_logs
- Admin đầy đủ: users, approvals, requests, history, questions, subjects, subject requests, trash, settings, realtime, export/logs
```

Chiến lược vẫn giữ nguyên:

```text
React Legacy UI trước
React Clean UI sau
Admin React cuối cùng
```
