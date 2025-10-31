import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون صفحة الأسئلة الشائعة
const FAQPage = ({ onBack }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    fetchFAQs();
    // تحديث Meta Tags
    document.title = 'الأسئلة الشائعة - نظام الاستعلام الذكي';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'إجابات على أكثر الأسئلة شيوعاً حول نظام الاستعلام عن النتائج والتقديرات والشهادات');
    }
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await axios.get(`${API}/faq`);
      setFaqs(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأسئلة الشائعة:', error);
    } finally {
      setLoading(false);
    }
  };

  // استخراج التصنيفات المتاحة
  const categories = [...new Set(faqs.map(faq => faq.category))];

  // تصفية الأسئلة حسب البحث والتصنيف
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← العودة للصفحة الرئيسية
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">❓ الأسئلة الشائعة</h1>
              <p className="text-sm text-gray-600">إجابات على الأسئلة الأكثر شيوعاً</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">💡 هل تحتاج للمساعدة؟</h2>
          <p className="text-xl mb-8">ابحث عن إجابات سريعة لأسئلتك أو تصفح الأسئلة الشائعة</p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الأسئلة الشائعة..."
                className="w-full px-6 py-4 text-gray-900 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 text-right text-lg"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              جميع الأسئلة ({faqs.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({faqs.filter(faq => faq.category === category).length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على نتائج</h3>
            <p className="text-gray-600 mb-6">جرب تغيير كلمات البحث أو اختيار تصنيف مختلف</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              إعادة تعيين البحث
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full px-6 py-6 text-right focus:outline-none focus:ring-4 focus:ring-blue-200 transition-colors duration-200 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-relaxed">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="ml-4">
                      <svg
                        className={`w-6 h-6 text-gray-400 transform transition-transform duration-200 ${
                          openAccordion === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                
                {openAccordion === index && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="pt-4">
                      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                        {faq.answer.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="mb-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">لم تجد إجابة لسؤالك؟</h3>
          <p className="text-gray-600 mb-6">
            إذا لم تجد الإجابة التي تبحث عنها، يمكنك التواصل معنا مباشرة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@results-system.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              📧 البريد الإلكتروني
            </a>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              📞 اتصل بنا
            </a>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🔥 المواضيع الأكثر شيوعاً</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'كيفية الاستعلام عن النتائج', icon: '🔍', category: 'الاستعلام' },
              { title: 'فهم نظام التقديرات', icon: '📊', category: 'التقديرات' },
              { title: 'طباعة الشهادات', icon: '🖨️', category: 'الشهادات' },
              { title: 'مشاركة النتائج', icon: '📱', category: 'المشاركة' },
              { title: 'حل مشاكل البحث', icon: '🛠️', category: 'الاستعلام' },
              { title: 'معلومات المراحل التعليمية', icon: '🎓', category: 'التقديرات' }
            ].map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(topic.category);
                  setSearchQuery(topic.title);
                }}
                className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-center"
              >
                <div className="text-3xl mb-3">{topic.icon}</div>
                <h4 className="font-bold text-gray-900 mb-2">{topic.title}</h4>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {topic.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQPage;