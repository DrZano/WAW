/* منطق التطبيق الأساسي */
let editorHTML, editorCSS, editorJS;
let currentTab = 'html';

document.addEventListener('DOMContentLoaded', () => {
    initEditors();
    setupTabs();
    setupButtons();
    
    // تشغيل الكود الافتراضي
    loadDefaultCode();
    runCode();
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
        ...commonOptions,
        mode: 'htmlmixed'
    });

    editorCSS = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
        ...commonOptions,
        mode: 'css'
    });

    editorJS = CodeMirror.fromTextArea(document.getElementById('jsEditor'), {
        ...commonOptions,
        mode: 'javascript'
    });

    // إخفاء CSS و JS في البداية
    editorCSS.getWrapperElement().style.display = 'none';
    editorJS.getWrapperElement().style.display = 'none';
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // إزالة التفعيل من الكل
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // إخفاء الكل
            editorHTML.getWrapperElement().style.display = 'none';
            editorCSS.getWrapperElement().style.display = 'none';
            editorJS.getWrapperElement().style.display = 'none';

            // إظهار المطلوب
            currentTab = tab.dataset.target;
            if (currentTab === 'html') editorHTML.getWrapperElement().style.display = 'block';
            if (currentTab === 'css') editorCSS.getWrapperElement().style.display = 'block';
            if (currentTab === 'js') editorJS.getWrapperElement().style.display = 'block';
        });
    });
}

function setupButtons() {
    document.getElementById('runBtn').addEventListener('click', runCode);
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        if(confirm('هل أنت متأكد من مسح جميع الأكواد؟')) {
            editorHTML.setValue('');
            editorCSS.setValue('');
            editorJS.setValue('');
            document.getElementById('previewFrame').srcdoc = '';
            showToast('تم المسح 🗑️');
        }
    });
}

function runCode() {
    const html = editorHTML.getValue();
    const css = editorCSS.getValue();
    const js = editorJS.getValue();

    // دمج الأكواد
    const fullDoc = `
        <!DOCTYPE html>
        <html>
        <head>
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

    // تحديث المعاينة
    document.getElementById('previewFrame').srcdoc = fullDoc;

    // فحص الأخطاء
    const result = HTMLValidator.validate(html);
    updateConsole(result.errors, result.suggestions);

    showToast('تم التشغيل ▶️');
}

function updateConsole(errors, suggestions) {
    const consoleBody = document.getElementById('consoleBody');
    const badge = document.getElementById('errorBadge');
    const statusDot = document.getElementById('statusDot');
    
    consoleBody.innerHTML = '';
    badge.innerText = errors.length;

    if (errors.length === 0 && suggestions.length === 0) {
        consoleBody.innerHTML = '<div class="console-msg success">لا توجد أخطاء. الكود سليم ✅</div>';
        statusDot.className = 'status-dot ok';
        badge.style.background = 'var(--success)';
    } else {
        errors.forEach(err => {
            consoleBody.innerHTML += `<div class="console-msg error">🔴 ${err}</div>`;
        });
        suggestions.forEach(sug => {
            consoleBody.innerHTML += `<div class="console-msg warning">💡 ${sug}</div>`;
        });
        
        statusDot.className = errors.length > 0 ? 'status-dot error' : 'status-dot ok';
        badge.style.background = errors.length > 0 ? 'var(--danger)' : 'var(--warning)';
    }
}

// استقبال أخطاء JavaScript من داخل الـ iframe
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'js_error') {
        const consoleBody = document.getElementById('consoleBody');
        consoleBody.innerHTML += `<div class="console-msg error">🔴 خطأ JS: ${e.data.msg}</div>`;
        document.getElementById('statusDot').className = 'status-dot error';
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
    <h1>مرحباً بك في WAW 👋</h1>
    <p>ابدأ بكتابة الكود هنا</p>
    <button id="myBtn">اضغطني</button>
</div>`);

    editorCSS.setValue(`body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background: #f0f2f5;
}
.card {
    background: white;
    padding: 40px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    text-align: center;
}
button {
    background: #6C5CE7;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}`);

    editorJS.setValue(`document.getElementById('myBtn').addEventListener('click', () => {
    alert('مرحباً! التطبيق يعمل بشكل رائع 🚀');
});`);
}
