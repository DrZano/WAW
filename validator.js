/* فاحص الأخطاء الذكي */
const HTMLValidator = {
    validate: function(htmlCode) {
        let errors = [];
        let suggestions = [];
        let stack = [];
        
        // العلامات التي لا تحتاج إغلاق
        const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

        // البحث عن جميع الوسوم
        const regex = /<(\/?)([a-zA-Z0-9]+)[^>]*?(\/?)>/g;
        let match;

        while ((match = regex.exec(htmlCode)) !== null) {
            const isClosing = match[1] === '/';
            const tagName = match[2].toLowerCase();
            const isSelfClosing = match[3] === '/';
            const lineNumber = htmlCode.substring(0, match.index).split('\n').length;

            if (voidTags.includes(tagName) || isSelfClosing) continue;

            if (isClosing) {
                if (stack.length === 0) {
                    errors.push(`السطر ${lineNumber}: تم إغلاق الوسم <${tagName}> بدون فتحه مسبقاً.`);
                } else {
                    const lastOpen = stack.pop();
                    if (lastOpen.name !== tagName) {
                        errors.push(`السطر ${lineNumber}: خطأ في ترتيب الإغلاق. توقعت </${lastOpen.name}> لكن وجدت </${tagName}>.`);
                    }
                }
            } else {
                stack.push({ name: tagName, line: lineNumber });
            }
        }

        // الوسوم المتبقية بدون إغلاق
        stack.forEach(item => {
            errors.push(`السطر ${item.line}: الوسم <${item.name}> لم يتم إغلاقه.`);
        });

        // اقتراحات إضافية
        if (!htmlCode.toLowerCase().includes('<!doctype html>')) {
            suggestions.push(`يفضل إضافة <!DOCTYPE html> في بداية الكود.`);
        }

        return { errors, suggestions };
    }
};
