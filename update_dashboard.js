const fs = require('fs');
let content = fs.readFileSync('public/dashboard.html', 'utf8');

const oldFunc = /function copyLink\(\) \{[\s\S]*?document\.body\.removeChild\(textArea\);\s*\}/;
const newFunc = `function copyLink() {
  const input = document.getElementById('trackingLink');
  const text = input.value;
  if (!text) return alert('Pa gen lyen pou kopye');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Lyen kopye ak siksè!');
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed"; 
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    alert('✅ Lyen kopye!');
  } catch (err) {
    alert('❌ Erè. Kopye l manyèlman: ' + text);
  }
  document.body.removeChild(textArea);
}`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync('public/dashboard.html', content);
console.log('✅ dashboard.html updated!');
