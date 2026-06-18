const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const loners = document.querySelectorAll('[data-admin-editable]:not([data-admin-item] [data-admin-editable])');
console.log("Found loners: ", loners.length);
loners.forEach(el => {
  console.log(el.tagName, el.getAttribute('data-admin-editable'));
});
