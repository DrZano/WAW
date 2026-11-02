/**
 * HTML Validator - فاحص الأخطاء الذكي
 */

const HTMLV = {
  // العناصر التي لا تحتاج إغلاق
  voidTags: ['area','base','br','col','embed','hr','img','input',
             'link','meta','param','source','track','wbr'],

  // العناصر التي يجب إغلاقها
  selfClosingRecommended: ['div','p','span','h1','h2','h3','h4','h5','h6',
                           'section','article','header','footer','nav','main','ul','ol','li'],

  /**
   * تحليل HTML واكتشاف الأخطاء
   */
  validate(html) {
    const errors = [];
    const suggestions = [];
    const stack = [];
    const lines = html.split('\n');

    // 1. فحص أنماط CSS/JS داخل HTML
    this.checkInlineStyles(html, errors, suggestions);
    this.checkInlineScripts(html, errors, suggestions);

    // 2. فحص الوسوم المفتوحة/المغلقة
    const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();
      const lineNum = html.substring(0, match.index).split('\n').length;

      if (this.voidTags.includes(tagName)) continue;

      if (isClosing) {
        if (stack.length === 0) {
          errors.push({
            line: lineNum,
            message: `وسم إغلاق </${tagName}> بدون فتح مقابل`,
            fix: `احذف </${tagName}> أو أضف <${tagName}> قبله`
          });
        } else {
          const top = stack[stack.length - 1];
          if (top.name === tagName) {
            stack.pop();
          } else {
            errors.push({
              line: lineNum,
              message: `وسم </${tagName}> غير متطابق. المتوقع </${top.name}> (فتح في سطر ${top.line})`,
              fix: `أغلق <${top.name}> أولاً أو أعد ترتيب الوسوم`
            });
          }
        }
      } else {
        const selfClosing = match[3].trim().endsWith('/');
        if (!selfClosing) {
          stack.push({ name: tagName, line: lineNum });
        }
      }
    }

    // 3. وسوم لم تُغلق
    stack.forEach(t => {
      errors.push({
        line: t.line,
        message: `الوسم <${t.name}> لم يُغلق`,
        fix: `أضف </${t.name}> في نهاية العنصر`
      });
    });

    // 4. فحص علامات الترقيم
    if ((html.match(/"/g) || []).length % 2 !== 0) {
      errors.push({
        line: 1,
        message: 'عدد علامات الاقتباس " فردي',
        fix: 'تأكد من إغلاق جميع علامات الاقتباس'
      });
    }

    // 5. فحص DOCTYPE
    if (!html.trim().toLowerCase().startsWith('<!doctype')) {
      suggestions.push({
        line: 1,
        message: 'لا يوجد <!DOCTYPE html> في البداية',
        fix: 'أضف <!DOCTYPE html> في أعلى الملف'
      });
    }

    // 6. فحص HTML/head/body
    if (html.includes('<html') && !html.includes('<body')) {
      suggestions.push({
        line: 1,
        message: 'يوجد <html> بدون <body>',
        fix: 'أضف <body>...</body> داخل <html>'
      });
    }

    // 7. فحص الصور بدون alt
    const imgRegex = /<img\s+([^>]*?)>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      if (!/alt\s*=/.test(match[1])) {
        const lineNum = html.substring(0, match.index).split('\n').length;
        suggestions.push({
          line: lineNum,
          message: '<img> بدون خاصية alt (مهم لإمكانية الوصول)',
          fix: 'أضف alt="وصف الصورة"'
        });
      }
    }

    return { errors, suggestions };
  },

  checkInlineStyles(html, errors, suggestions) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = styleRegex.exec(html)) !== null) {
      const css = m[1];
      const openBraces = (css.match(/{/g) || []).length;
      const closeBraces = (css.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({
          line: 1,
          message: `داخل <style>: عدد {} غير متطابق (${openBraces} فتح، ${closeBraces} إغلاق)`,
          fix: 'أغلق جميع الأقواس المعقوفة'
        });
      }
    }
  },

  checkInlineScripts(html, errors, suggestions) {
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = scriptRegex.exec(html)) !== null) {
      const js = m[1];
      if (!js.trim()) continue;
      try {
        new Function(js); // فحص بناء الجملة دون تنفيذ
      } catch (e) {
        errors.push({
          line: 1,
          message: `خطأ JavaScript: ${e.message}`,
          fix: 'راجع بناء الجملة في الكود'
        });
      }
    }
  }
};

window.HTMLV = HTMLV;
