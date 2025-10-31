import React, { useState, useEffect } from 'react';

// مكون محرر النصوص المتقدم مع مؤشر السيو
const AdvancedEditor = ({ 
  content, 
  onChange, 
  title, 
  onTitleChange, 
  description, 
  onDescriptionChange,
  tags,
  onTagsChange,
  showSeoAnalyzer = true 
}) => {
  const [seoScore, setSeoScore] = useState(0);
  const [seoRecommendations, setSeoRecommendations] = useState([]);
  const [editorMode, setEditorMode] = useState('visual'); // visual, code
  const [imageUploading, setImageUploading] = useState(false);

  // تحليل السيو
  useEffect(() => {
    analyzeSEO();
  }, [title, description, content, tags]);

  const analyzeSEO = () => {
    let score = 0;
    const recommendations = [];

    // تحليل العنوان (25 نقطة)
    if (title) {
      if (title.length >= 30 && title.length <= 60) {
        score += 25;
      } else if (title.length > 0) {
        score += 15;
        recommendations.push({
          type: 'warning',
          message: `طول العنوان ${title.length} حرف. الطول المثالي 30-60 حرف`,
          action: 'تحسين العنوان'
        });
      }
    } else {
      recommendations.push({
        type: 'error',
        message: 'العنوان مطلوب للسيو',
        action: 'إضافة عنوان'
      });
    }

    // تحليل الوصف (20 نقطة)
    if (description) {
      if (description.length >= 120 && description.length <= 160) {
        score += 20;
      } else if (description.length > 0) {
        score += 10;
        recommendations.push({
          type: 'warning',
          message: `طول الوصف ${description.length} حرف. الطول المثالي 120-160 حرف`,
          action: 'تحسين الوصف'
        });
      }
    } else {
      recommendations.push({
        type: 'error',
        message: 'الوصف التعريفي مطلوب للسيو',
        action: 'إضافة وصف'
      });
    }

    // تحليل المحتوى (30 نقطة)
    if (content) {
      const wordCount = content.split(/\s+/).length;
      const headings = (content.match(/^#{1,6}\s/gm) || []).length;
      const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;

      if (wordCount >= 300) {
        score += 10;
      } else {
        recommendations.push({
          type: 'warning',
          message: `عدد الكلمات ${wordCount}. المطلوب 300 كلمة على الأقل`,
          action: 'إضافة محتوى'
        });
      }

      if (headings >= 2) {
        score += 10;
      } else {
        recommendations.push({
          type: 'info',
          message: 'أضف ترويسات (H1, H2, H3) لتحسين البنية',
          action: 'إضافة ترويسات'
        });
      }

      if (links >= 1) {
        score += 10;
      } else {
        recommendations.push({
          type: 'info',
          message: 'أضف روابط داخلية أو خارجية',
          action: 'إضافة روابط'
        });
      }
    } else {
      recommendations.push({
        type: 'error',
        message: 'المحتوى مطلوب',
        action: 'إضافة محتوى'
      });
    }

    // تحليل الكلمات المفتاحية (15 نقطة)
    if (tags && tags.length >= 3) {
      score += 15;
    } else if (tags && tags.length > 0) {
      score += 8;
      recommendations.push({
        type: 'info',
        message: `عدد الكلمات المفتاحية ${tags.length}. المطلوب 3-8 كلمات`,
        action: 'إضافة كلمات مفتاحية'
      });
    } else {
      recommendations.push({
        type: 'warning',
        message: 'أضف كلمات مفتاحية للمقال',
        action: 'إضافة كلمات مفتاحية'
      });
    }

    // تحليل إضافي (10 نقاط)
    if (content && title) {
      const titleInContent = content.toLowerCase().includes(title.toLowerCase());
      if (titleInContent) {
        score += 5;
      } else {
        recommendations.push({
          type: 'info',
          message: 'استخدم العنوان في المحتوى لزيادة الصلة',
          action: 'تحسين المحتوى'
        });
      }

      const hasImages = content.includes('![') || content.includes('<img');
      if (hasImages) {
        score += 5;
      } else {
        recommendations.push({
          type: 'info',
          message: 'أضف صور للمقال لزيادة التفاعل',
          action: 'إضافة صور'
        });
      }
    }

    setSeoScore(Math.min(100, score));
    setSeoRecommendations(recommendations);
  };

  // إدراج عناصر التنسيق
  const insertFormatting = (format) => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = content;
    let replacement = '';

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'نص عريض'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'نص مائل'}*`;
        break;
      case 'h1':
        replacement = `# ${selectedText || 'عنوان رئيسي'}`;
        break;
      case 'h2':
        replacement = `## ${selectedText || 'عنوان فرعي'}`;
        break;
      case 'h3':
        replacement = `### ${selectedText || 'عنوان فرعي صغير'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'نص الرابط'}](https://example.com)`;
        break;
      case 'image':
        replacement = `![وصف الصورة](رابط-الصورة.jpg)`;
        break;
      case 'list':
        replacement = `- ${selectedText || 'عنصر القائمة'}`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'كود'}\``;
        break;
      case 'quote':
        replacement = `> ${selectedText || 'اقتباس'}`;
        break;
    }

    newText = content.substring(0, start) + replacement + content.substring(end);
    onChange(newText);

    // إعادة تركيز المؤشر
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 10);
  };

  // رفع الصور
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setImageUploading(true);
    
    try {
      // تحويل الصورة إلى base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        const imageMarkdown = `![صورة مرفوعة](${base64})`;
        const newContent = content + '\n\n' + imageMarkdown;
        onChange(newContent);
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      alert('حدث خطأ أثناء رفع الصورة');
      setImageUploading(false);
    }
  };

  // إضافة كلمة مفتاحية
  const addTag = (tag) => {
    if (!tag.trim()) return;
    if (tags.includes(tag.trim())) return;
    
    const newTags = [...tags, tag.trim()];
    onTagsChange(newTags);
  };

  // حذف كلمة مفتاحية
  const removeTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    onTagsChange(newTags);
  };

  const getSeoScoreColor = () => {
    if (seoScore >= 80) return 'text-green-600';
    if (seoScore >= 60) return 'text-yellow-600';
    if (seoScore >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeoScoreBg = () => {
    if (seoScore >= 80) return 'bg-green-500';
    if (seoScore >= 60) return 'bg-yellow-500';
    if (seoScore >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* شريط أدوات التحرير */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => insertFormatting('bold')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm"
            title="نص عريض"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => insertFormatting('italic')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded italic text-sm"
            title="نص مائل"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => insertFormatting('h1')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
            title="عنوان رئيسي"
          >
            H1
          </button>
          <button
            onClick={() => insertFormatting('h2')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
            title="عنوان فرعي"
          >
            H2
          </button>
          <button
            onClick={() => insertFormatting('h3')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold"
            title="عنوان فرعي صغير"
          >
            H3
          </button>
          <button
            onClick={() => insertFormatting('link')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="رابط"
          >
            🔗
          </button>
          <button
            onClick={() => insertFormatting('image')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="صورة"
          >
            📷
          </button>
          <button
            onClick={() => insertFormatting('list')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="قائمة"
          >
            📝
          </button>
          <button
            onClick={() => insertFormatting('quote')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="اقتباس"
          >
            💬
          </button>
          <button
            onClick={() => insertFormatting('code')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="كود"
          >
            💻
          </button>
          
          {/* رفع الصور */}
          <label className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm cursor-pointer">
            {imageUploading ? '📤 جاري الرفع...' : '📁 رفع صورة'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={imageUploading}
            />
          </label>
        </div>

        {/* أوضاع التحرير */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-4 py-2 rounded text-sm ${editorMode === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            🎨 مرئي
          </button>
          <button
            onClick={() => setEditorMode('code')}
            className={`px-4 py-2 rounded text-sm ${editorMode === 'code' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            💻 كود
          </button>
        </div>

        {/* منطقة التحرير */}
        <textarea
          id="content-editor"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ابدأ الكتابة هنا... يمكنك استخدام Markdown للتنسيق"
          className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right resize-y"
          dir="rtl"
        />

        {/* عدد الكلمات */}
        <div className="mt-2 text-sm text-gray-500 text-left">
          الكلمات: {content ? content.split(/\s+/).length : 0} | الأحرف: {content ? content.length : 0}
        </div>
      </div>

      {/* مؤشر السيو */}
      {showSeoAnalyzer && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 مؤشر السيو</h3>
          
          {/* نتيجة السيو */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">النتيجة الإجمالية</span>
              <span className={`text-2xl font-bold ${getSeoScoreColor()}`}>{seoScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getSeoScoreBg()}`}
                style={{ width: `${seoScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>ضعيف</span>
              <span>متوسط</span>
              <span>جيد</span>
              <span>ممتاز</span>
            </div>
          </div>

          {/* التوصيات */}
          {seoRecommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">💡 توصيات التحسين</h4>
              <div className="space-y-3">
                {seoRecommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                      'bg-blue-50 border-blue-400 text-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{rec.message}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-white rounded-full ml-2">
                        {rec.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* نصائح سريعة */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">⚡ نصائح سريعة</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• استخدم عناوين واضحة ومختصرة (30-60 حرف)</li>
              <li>• اكتب وصف تعريفي جذاب (120-160 حرف)</li>
              <li>• أضف ترويسات (H1, H2, H3) لتنظيم المحتوى</li>
              <li>• استخدم كلمات مفتاحية ذات صلة (3-8 كلمات)</li>
              <li>• أضف صور وروابط لإثراء المحتوى</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedEditor;