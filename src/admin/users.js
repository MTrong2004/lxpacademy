/**
 * Admin User Management (SaaS 4-Column Layout)
 */

/*
  DEVICE_ID_AND_SUBJECT_PER_DEVICE_20260731
  Bản ghi thiết bị: { id, device, code, time } — xem api/controllers/profile.js.
  Dòng cũ chỉ có { device, time }; ai chưa đăng nhập lại từ 20260731 thì `id` và
  `code` rỗng, giao diện hiện "Thiết bị cũ" / "Chưa rõ môn" thay vì bịa số liệu.
  Hàm này là chỗ DUY NHẤT đọc device_history: cả hàng danh sách lẫn hai modal
  trong adminCore đều gọi nó (bridge `window.parseDeviceHistory` ở main.js).
*/
export function parseDeviceHistory(p) {
  if (!p) return [];
  let list = [];
  try {
    if (typeof p.device_history === 'string' && p.device_history) list = JSON.parse(p.device_history);
    else if (Array.isArray(p.device_history)) list = p.device_history;
  } catch (e) {
    list = [];
  }
  if (!Array.isArray(list)) list = [];
  list = list.filter(x => x && typeof x === 'object');
  if (!list.length && p.device_info) {
    list = [
      {
        device: p.device_info,
        code: p.current_subject || '',
        time: p.last_activity || p.last_login || p.created_at || '',
      },
    ];
  }
  return list.map(x => ({
    id: String(x.id || ''),
    device: String(x.device || 'Chưa rõ'),
    code: String(x.code || ''),
    time: String(x.time || ''),
  }));
}

export function renderUserRowSaaS(p, helpers) {
  const { actText, actTime, date, isBlocked, badge, roleBadgeFinal, avatarButton, esc } = helpers;
  const activeText = actText(p);
  const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';

  /*
    Cột này từng chỉ in `current_subject` — mà đó là MÔN CỦA LẦN GHI CUỐI CÙNG,
    không phải "đang học". Điện thoại mở môn khác (hoặc chỉ F5) là ghi đè máy
    tính. Nay chip cho biết còn N thiết bị đang ở môn khác và bấm vào xem được,
    giống hệt chip thiết bị bên cạnh.
  */
  const devices = parseDeviceHistory(p);
  const otherSubjectCount = devices.filter(d => d.code && d.code !== (p.current_subject || '')).length;
  const subjectTag = p.current_subject
    ? `<button class="saasSubjectChip saasSubjectBtn" type="button" title="Xem môn đang học theo từng thiết bị" onclick="showUserSubjectByDeviceModal('${esc(p.id)}')">${esc(p.current_subject)}${otherSubjectCount ? `<span class="saasChipMore">+${otherSubjectCount}</span>` : ''}</button>`
    : `<span class="saasMutedChip">Chưa chọn môn</span>`;

  const deviceTag = p.device_info
    ? `<button class="saasDeviceChip saasDeviceBtn" type="button" title="Xem lịch sử thiết bị" onclick="showUserDeviceHistoryModal('${esc(p.id)}')">${esc(p.device_info)}${devices.length > 1 ? `<span class="saasChipMore">+${devices.length - 1}</span>` : ''}</button>`
    : `<span class="saasMutedChip">Chưa rõ</span>`;

  const statusBadge = isBlocked(p)
    ? badge('blocked')
    : `<span class="badge approved userApprovedBadge"><span class="badgeDot"></span>Đã duyệt</span>`;

  return `<div class="userRow activitySortedRow lhUserRowSaaS approvedUserRow ${activeClass}">
    <div class="saasUserCol">
      <div class="lhAvatarCell">${avatarButton(p)}</div>
      <div class="saasUserInfo">
        <div class="saasMailRow">
          <span class="mail" title="${esc(p.email || p.id)}">${esc(p.email || p.id)}</span>
        </div>
        <div class="saasSubRow">
          ${roleBadgeFinal(p.role)}
          <span class="uid" title="${esc(p.id)}">${esc(p.id)}</span>
        </div>
      </div>
    </div>
    <div class="saasMetaCol">
      <div class="saasSubjectCell">${subjectTag}</div>
      <div class="saasDeviceCell">${deviceTag}</div>
    </div>
    <div class="saasStatusCol">
      <div class="saasStatusRow">${statusBadge}</div>
      <div class="saasActivityRow"><b class="lastActivity ${activeClass}">${esc(activeText)}</b> <span class="uidTime">${esc(date(actTime(p)))}</span></div>
    </div>
    <div class="actions lhActionsCell">
      <button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'${esc(p.id)}')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>
  </div>`;
}

export function getUserTableHeadHTML() {
  return `<div class="userRow muted tableHead lhUserRowSaaS approvedUsersHead">
    <div class="thCol">NGƯỜI DÙNG</div>
    <div class="thCol thMeta">
      <span class="thSub">MÔN ĐANG HỌC</span>
      <span class="thDev">THIẾT BỊ</span>
    </div>
    <div class="thCol">TRẠNG THÁI &amp; HOẠT ĐỘNG</div>
    <div class="thCol thActions">THAO TÁC</div>
  </div>`;
}
