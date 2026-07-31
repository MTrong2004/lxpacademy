import fs from 'fs';
import path from 'path';

const filePath = path.resolve('admin.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `    $('userList').innerHTML = \`<div class="userRow muted tableHead lhUserRowFinal approvedUsersHead">
      <b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>\``;

const replacement = `    $('userList').innerHTML = \`<div class="userRow muted tableHead lhUserRowFinal approvedUsersHead">
      <b>Avatar</b><b>Email</b><b>Role</b><b>Môn đang học</b><b>Thiết bị</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>
    </div>\``;

if (content.includes('<b>Môn đang học</b>')) {
  console.log('Already patched!');
} else if (content.includes('approvedUsersHead')) {
  content = content.replace(
    /match\(`\$\{p\.email \|\| ''\} \$\{p\.role \|\| ''\} \$\{p\.id \|\| ''\} \$\{p\.last_activity \|\| ''\}`\)/g,
    "match(`${p.email || ''} ${p.role || ''} ${p.id || ''} ${p.current_subject || ''} ${p.device_info || ''} ${p.last_activity || ''}`)"
  );
  content = content.replace(
    `<b>Avatar</b><b>Email</b><b>Role</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>`,
    `<b>Avatar</b><b>Email</b><b>Role</b><b>Môn đang học</b><b>Thiết bị</b><b>TT</b><b>Hoạt động gần nhất</b><b>Hành động</b>`
  );
  content = content.replace(
    `<div>\${roleBadgeFinal(p.role)}</div>`,
    `<div>\${roleBadgeFinal(p.role)}</div>\n        <div>\${p.current_subject ? '<span class="badge" style="background:rgba(200,169,110,.15);color:var(--gold2);border:1px solid rgba(200,169,110,.3);font-weight:900;">' + esc(p.current_subject) + '</span>' : '<span class="muted" style="font-size:12px;">Chưa chọn</span>'}</div>\n        <div style="font-size:0.82rem;color:var(--fog);">\${p.device_info ? esc(p.device_info) : '<span class="muted" style="font-size:12px;">Chưa rõ</span>'}</div>`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched admin.js!');
} else {
  console.log('Pattern not found in admin.js');
}
