let editorHTML, editorCSS, editorJS;
let currentTab = 'html';

document.addEventListener('DOMContentLoaded', () => {
    initEditors();
    setupTabs();
    setupButtons();
    loadDefaultCode();
});

function initEditors() {
    const commonOptions = {
        theme: 'dracula',
        lineNumbers: true,
        autoCloseTags: true,
        lineWrapping: true,
        indentUnit: 4,
        tabSize: 4
    };

    editorHTML = CodeMirror.fromTextArea(document.getElementById('htmlEditor'), {
        ...commonOptions, mode: 'htmlmixed'
    });
    editorCSS = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
        ...commonOptions, mode: 'css'
    });
    editorJS = CodeMirror.fromTextArea(document.getElementById('jsEditor'), {
        ...commonOptions, mode: 'javascript'
    });

    editorCSS.getWrapperElement().style.display = 'none';
    editorJS.getWrapperElement().style.display = 'none';
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            editorHTML.getWrapperElement().style.display = 'none';
            editorCSS.getWrapperElement().style.display = 'none';
            editorJS.getWrapperElement().style.display = 'none';

            currentTab = tab.dataset.target;
            if (currentTab === 'html') editorHTML.getWrapperElement().style.display = 'block';
            if (currentTab === 'css') editorCSS.getWrapperElement().style.display = 'block';
            if (currentTab === 'js') editorJS.getWrapperElement().style.display = 'block';
            
            // تحديث حجم المحرر بعد الإظهار
            setTimeout(() => {
                if(currentTab === 'html') editorHTML.refresh();
                if(currentTab === 'css') editorCSS.refresh();
                if(currentTab === 'js') editorJS.refresh();
            }, 50);
        });
    });
}

function setupButtons() {
    // زر التشغيل (ينقل للمعاينة)
    document.getElementById('runBtn').addEventListener('click', () => {
        runCode();
        switchScreen('previewScreen');
    });

    // زر الرجوع للمحرر
    document.getElementById('backBtn').addEventListener('click', () => {
        switchScreen('editorScreen');
    });
    
    // زر التحديث داخل المعاينة
    document.getElementById('reloadBtn').addEventListener('click', runCode);

    // زر المسح
    document.getElementById('clearBtn').addEventListener('click', () => {
        if(confirm('هل أنت متأكد من مسح جميع الأكواد؟')) {
            editorHTML.setValue('');
            editorCSS.setValue('');
            editorJS.setValue('');
            document.getElementById('previewFrame').srcdoc = '';
            updateConsole([], []);
            showToast('تم المسح 🗑️');
        }
    });
}

// دالة التنقل بين الشاشات
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function runCode() {
    const html = editorHTML.getValue();
    const css = editorCSS.getValue();
    const js = editorJS.getValue();

    const fullDoc = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${css}</style>
        </head>
        <body>
            ${html}
            <script>
                try {
                    ${js}
                } catch(err) {
                    parent.postMessage({ type: 'js_error', msg: err.message }, '*');
                }
            <\/script>
        </body>
        </html>
    `;

    document.getElementById('previewFrame').srcdoc = fullDoc;

    const result = HTMLValidator.validate(html);
    updateConsole(result.errors, result.suggestions);
}

function updateConsole(errors, suggestions) {
    const consoleBody = document.getElementById('consoleBody');
    const badge = document.getElementById('errorBadge');
    
    consoleBody.innerHTML = '';
    badge.innerText = errors.length;

    if (errors.length === 0 && suggestions.length === 0) {
        consoleBody.innerHTML = '<div class="console-msg success">لا توجد أخطاء. الكود سليم ✅</div>';
        badge.style.background = 'var(--success)';
    } else {
        errors.forEach(err => {
            consoleBody.innerHTML += `<div class="console-msg error">🔴 ${err}</div>`;
        });
        suggestions.forEach(sug => {
            consoleBody.innerHTML += `<div class="console-msg warning">💡 ${sug}</div>`;
        });
        badge.style.background = errors.length > 0 ? 'var(--danger)' : 'var(--warning)';
    }
}

window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'js_error') {
        const consoleBody = document.getElementById('consoleBody');
        consoleBody.innerHTML += `<div class="console-msg error">🔴 خطأ JS: ${e.data.msg}</div>`;
    }
});

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function loadDefaultCode() {
    editorHTML.setValue(`<div class="card">
    <h1>أهلاً بك في WAW 🚀</h1>
    <p>اكتب الكود في المحرر، ثم اضغط "تشغيل" لرؤية النتيجة بشاشة كاملة.</p>
    <button id="myBtn">جرب الزر</button>
</div>`);

    editorCSS.setValue(`body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}
.card {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    padding: 40px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    text-align: center;
    max-width: 90%;
}
button {
    background: #6C5CE7;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 15px;
}`);

    editorJS.setValue(`document.getElementById('myBtn').addEventListener('click', () => {
    alert('رائع! التطبيق يعمل بنظام الشاشات الكاملة 🎉');
});`);
}
