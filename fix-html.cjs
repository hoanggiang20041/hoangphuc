const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if(!file.includes('node_modules') && !file.includes('.git') && !file.includes('admin')) {
        results = results.concat(walk(file));
      }
    } else {
      if(file.endsWith('.html') && !file.includes('admin/index.html')) results.push(file);
    }
  });
  return results;
}
const files = walk('.');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // Match `data-admin-editable="..."` that contains "Favicon"
  c = c.replace(/data-admin-editable="[^"]*Favicon[^"]*"/gi, '');
  
  // Add `data-admin-section` to `.event-section` if it is missing
  if (f.includes('host-livestream.html') || f.includes('voice.html') || f.includes('dan-chuong-trinh.html')) {
    c = c.replace(/class="event-section"(?![^>]*data-admin-section)/g, 'class="event-section" data-admin-section');
  }
  
  fs.writeFileSync(f, c);
  console.log('Fixed ' + f);
});
