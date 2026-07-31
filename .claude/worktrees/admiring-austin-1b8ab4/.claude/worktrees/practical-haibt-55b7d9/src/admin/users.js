/**
 * Admin User Management (SaaS 4-Column Layout)
 */

export function renderUserRowSaaS(p, helpers) {
  const { actText, actTime, date, isBlocked, badge, roleBadgeFinal, avatarButton, esc } = helpers;
  const activeText = actText(p);
  const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';

  const subjectTag = p.current_subject
    ? `<span class="saasSubjectChip">${esc(p.current_subject)}</span>`
    : `<span class="saasMutedChip">Chưa chọn môn</span>`;

  const deviceTag = p.device_info
    ? `<button class="saasDeviceChip saasDeviceBtn" type="button" title="Xem lịch sử thiết bị" onclick="showUserDeviceHistoryModal('${esc(p.id)}')">${esc(p.device_info)}</button>`
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
