import fs from 'fs';
import path from 'path';

function toUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  let str = '';
  // Check for UTF-16 LE BOM
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    str = buf.toString('utf16le');
  } else {
    str = buf.toString('utf8');
  }
  fs.writeFileSync(filePath, str, 'utf8');
  console.log(`Converted ${filePath} to UTF-8!`);
}

toUtf8(path.resolve('src/student/appCore.js'));
toUtf8(path.resolve('src/admin/adminCore.js'));
