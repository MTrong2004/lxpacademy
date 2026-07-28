import fs from 'fs';
import path from 'path';

const appJs = fs.readFileSync(path.resolve('app.js'), 'utf8');
const adminJs = fs.readFileSync(path.resolve('admin.js'), 'utf8');

fs.writeFileSync(path.resolve('src/student/appCore.js'), appJs, 'utf8');
fs.writeFileSync(path.resolve('src/admin/adminCore.js'), adminJs, 'utf8');

console.log('Successfully created src/student/appCore.js and src/admin/adminCore.js!');
