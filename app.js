/**
 * HTML Viewer Pro - Main App Logic
 */

let editors = {};
let currentLang = 'html';

// ===== CodeMirror Setup =====
function initEditors() {
  const commonOpts = {
    mode: null,
    theme: 'dracula',
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    lineWrapping: true,
    indentUnit: 2,
    tabSize: 2
  };

  editors.html = CodeMirror.fromTextArea(document.getElementById('htmlEditor'), {
    ...commonOpts,
    mode: 'htmlmixed'
  });

  editors.css = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
    ...commonOpts,
    mode: 'css'
  });

  editors.js = CodeMirror.fromTextArea(document.getElementById('jsEditor'), {
    ...commonOpts,
    mode: 'javascript'
  });

  // تحديث معلومات السطر
  Object.values(editors).forEach(ed => {
    ed.on('cursorActivity', () => {
      if (ed !== editors[currentLang]) return;
      const pos = ed.getCursor();
      document.getElementById('lineInfo').textContent =
        `سطر ${pos.line + 1}، عمود ${pos.ch + 1}`;
    });
    ed.on('change', () => {
      localStorage.setItem('htmlv_' + currentLang, ed.getValue());
    });
  });

  // استرجاع المحتوى المحفوظ
  editors.html.setValue(localStorage.getItem('htmlv_html') || defaultHTML);
  editors.css.setValue(localStorage.getItem('htmlv_css') || defaultCSS);
  editors.js.setValue(localStorage.getItem('htmlv_js') || defaultJS);
}

// ===== Build Full Document =====
function buildDocument() {
  const html = editors.html.getValue();
  const css = editors.css.getValue();
  const js = editors.js.getValue();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>
${html}
<script>
try {
  ${js}
} catch(e) {
  parent.postMessage({type:'error', message:e.message}, '*');
}
<\/script>
</body>
</html>`;
}

// ===== Run Preview =====
function runCode() {
  const doc = buildDocument();
  const frame = document.getElementById('previewFrame');
  frame.srcdoc = doc;

  // Validate
  const { errors, suggestions } = HTMLV.validate(editors.html.getValue());
  renderErrors(errors);
  renderSuggestions(suggestions);

  // Status
  const dot = document.getElementById('statusDot');
  dot.style.background = errors.length ? 'var(--danger)' : 'var(--success)';

  showToast(errors.length
    ? `⚠ ${errors.length} خطأ تم اكتشافه`
    : '✅ تم التشغيل بنجاح');
}

// ===== Render Errors =====
function renderErrors(errors) {
  const panel = document.getElementById('errorsPanel');
  const badge = document.getElementById('errorCount');

  badge.textContent = errors.length;
  badge.style.background = errors.length ? 'var(--danger)' : 'var(--success)';

  if (!errors.length) {
    panel.innerHTML = `<div class="console-item success">
      <span class="msg">✅ لا توجد أخطاء - الكود سليم</span>
    </div>`;
    return;
  }

  panel.innerHTML = errors.map(e => `
    <div class="console-item error">
      <span class="line">L${e.line}</span>
      <div class="msg">
        <div>⚠ ${e.message}</div>
        ${e.fix ? `<div style="color:var(--success);font-size:11px;margin-top:4px">💡 ${e.fix}</div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderSuggestions(list) {
  const panel = document.getElementById('suggestionsPanel');
  if (!list.length) {
    panel.innerHTML = `<div class="console-item info">
      <span class="msg">لا توجد اقتراحات حالياً</span>
    </div>`;
    return;
  }
  panel.innerHTML = list.map(s => `
    <div class="console-item warning">
      <span class="line">L${s.line}</span>
      <div class="msg">
        <div>💡 ${s.message}</div>
        ${s.fix ? `<div style="color:var(--text-secondary);font-size:11px;margin-top:4px">↳ ${s.fix}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ===== Format Code (Basic) =====
function formatCode() {
  const ed = editors[currentLang];
  let code = ed.getValue();

  if (currentLang === 'html') {
    // تنسيق HTML بسيط
    code = code.replace(/>\s*</g, '>\n<');
    let indent = 0;
    code = code.split('\n').map(line => {
      line = line.trim();
      if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
      const out = '  '.repeat(indent) + line;
      if (/^<[^/!][^>]*[^/]>$/.test(line) && !/<\/[^>]+>/.test(line) && !HTMLV.voidTags.some(t => line.startsWith(`<${t}`))) {
        indent++;
      }
      return out;
    }).join('\n');
  } else if (currentLang === 'css') {
    code = code.replace(/\s*{\s*/g, ' {\n  ')
               .replace(/;\s*/g, ';\n  ')
               .replace(/\s*}\s*/g, '\n}\n\n')
               .replace(/\n\s*\n/g, '\n');
  } else {
    code = code.replace(/;\s*/g, ';\n').replace(/{\s*/g, ' {\n  ').replace(/\s*}\s*/g, '\n}\n');
  }

  ed.setValue(code);
  showToast('✨ تم تنسيق الكود');
}

// ===== Toast =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== Tabs =====
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.values(editors).forEach(ed => ed.getWrapperElement().style.display = 'none');
      currentLang = tab.dataset.lang;
      editors[currentLang].getWrapperElement().style.display = 'block';
      editors[currentLang].refresh();
    });
  });
}

// ===== Console Tabs =====
function initConsoleTabs() {
  document.querySelectorAll('.console-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.console-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel + 'Panel').classList.add('active');
    });
  });
}

// ===== Device Switch =====
function initDeviceSwitch() {
  document.querySelectorAll('.dev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('previewWrapper').dataset.device = btn.dataset.device;
    });
  });
}

// ===== Resizer =====
function initResizer() {
  const resizer = document.getElementById('resizer');
  const editorPanel = document.querySelector('.editor-panel');
  let dragging = false;

  resizer.addEventListener('mousedown', () => dragging = true);
  document.addEventListener('mouseup', () => dragging = false);
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const totalWidth = document.querySelector('.workspace').offsetWidth;
    const newWidth = (e.clientX / totalWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      editorPanel.style.width = newWidth + '%';
    }
  });
}

// ===== Buttons =====
function initButtons() {
  document.getElementById('runBtn').onclick = runCode;
  document.getElementById('formatBtn').onclick = formatCode;
  document.getElementById('clearBtn').onclick = () => {
    if (confirm('مسح جميع الأكواد؟')) {
      editors.html.setValue('');
      editors.css.setValue('');
      editors.js.setValue('');
      document.getElementById('previewFrame').srcdoc = '';
    }
  };
  document.getElementById('themeBtn').onclick = () => {
    const cur = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = cur === 'light' ? '' : 'light';
    localStorage.setItem('htmlv_theme', cur === 'light' ? '' : 'light');
  };
  document.getElementById('saveBtn').onclick = () => {
    ['html', 'css', 'js'].forEach(l => localStorage.setItem('htmlv_' + l, editors[l].getValue()));
    showToast('💾 تم الحفظ');
  };
  document.getElementById('downloadBtn').onclick = () => {
    const doc = buildDocument();
    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'index.html';
    a.click();
    showToast('⬇ تم التحميل');
  };

  // Ctrl+Enter
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') runCode();
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      document.getElementById('saveBtn').click();
    }
  });
}

// ===== Console Log Capture =====
window.addEventListener('message', e => {
  if (e.data?.type === 'error') {
    const panel = document.getElementById('consolePanel');
    panel.innerHTML += `<div class="console-item error">
      <span class="msg">${e.data.message}</span>
    </div>`;
  }
});

// ===== Default Code =====
const defaultHTML = `<div class="card">
  <h1>مرحباً بك 👋</h1>
  <p>ابدأ بكتابة كود HTML هنا</p>
  <button id="btn">اضغطني</button>
</div>`;

const defaultCSS = `body {
  font-family: 'Cairo', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}`;

const defaultJS = `document.getElementById('btn').addEventListener('click', () => {
  alert('مرحباً! 👋');
});`;

// ===== Init =====
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.theme = localStorage.getItem('htmlv_theme') || '';
  initEditors();
  initTabs();
  initConsoleTabs();
  initDeviceSwitch();
  initResizer();
  initButtons();
  runCode();
});
