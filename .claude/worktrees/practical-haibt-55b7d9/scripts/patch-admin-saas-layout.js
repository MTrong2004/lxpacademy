import fs from 'fs';
import path from 'path';

const filePath = path.resolve('admin.js');
let content = fs.readFileSync(filePath, 'utf8');

const saasRenderUsers = `  window.renderUsers = renderUsers = function(){
    if(typeof closeUserActionMenuFinal === 'function') closeUserActionMenuFinal();
    const arr = (cache.profiles || [])
      .filter(p => p.approved !== false)
      .filter(p => match(\`\${p.email || ''} \${p.role || ''} \${p.id || ''} \${p.current_subject || ''} \${p.device_info || ''} \${p.last_activity || ''}\`))
      .sort((a,b) => actMs(b) - actMs(a));

    $('userList').innerHTML = \`<div class="userRow muted tableHead lhUserRowSaaS approvedUsersHead">
      <b>Người dùng</b><b>Môn đang học & Thiết bị</b><b>Trạng thái & Hoạt động</b><b>Thao tác</b>
    </div>\` + (arr.map(p => {
      const activeText = actText(p);
      const activeClass = activeText === 'Đang hoạt động' ? 'activityNow' : '';
      const subjectTag = p.current_subject 
        ? \`<span class="saasSubjectChip">📘 \${esc(p.current_subject)}</span>\` 
        : \`<span class="saasMutedChip">📘 Chưa chọn môn</span>\`;
      const deviceTag = p.device_info 
        ? \`<span class="saasDeviceChip">\${esc(p.device_info)}</span>\` 
        : \`<span class="saasMutedChip">Chưa rõ thiết bị</span>\`;
      const statusBadge = isBlocked(p) 
        ? badge('blocked') 
        : \`<span class="badge approved userApprovedBadge">Đã duyệt</span>\`;

      return \`<div class="userRow activitySortedRow lhUserRowSaaS approvedUserRow \${activeClass}">
        <div class="saasUserCol">
          <div class="lhAvatarCell">\${avatarButton(p)}</div>
          <div class="saasUserInfo">
            <div class="saasMailRow">
              <span class="mail">\${esc(p.email || p.id)}</span>
              \${roleBadgeFinal(p.role)}
            </div>
            <div class="uid">\${esc(p.id)}</div>
          </div>
        </div>
        <div class="saasMetaCol">
          \${subjectTag}
          \${deviceTag}
        </div>
        <div class="saasStatusCol">
          <div class="saasStatusRow">\${statusBadge}</div>
          <div class="saasActivityRow"><b class="lastActivity \${activeClass}">\${esc(activeText)}</b> <span class="uid">\${esc(date(actTime(p)))}</span></div>
        </div>
        <div class="actions lhActionsCell">
          <button class="lhDotsBtn" type="button" title="Thao tác" onclick="openUserActionMenuFinal(event,'\${esc(p.id)}')">...</button>
        </div>
      </div>\`;
    }).join('') || '<p class="muted">Không có người dùng đã duyệt.</p>');
  };`;

// Replace renderUsers function block in admin.js
const regex = /window\.renderUsers\s*=\s*renderUsers\s*=\s*function\s*\(\)\s*\{[\s\S]*?\};(\r?\n)*\s*\/\/\s*Phê duyệt/m;

if (regex.test(content)) {
  content = content.replace(regex, saasRenderUsers + '\n\n  // Phê duyệt');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated renderUsers in admin.js to SaaS Layout!');
} else {
  console.log('Regex did not match renderUsers in admin.js');
}
