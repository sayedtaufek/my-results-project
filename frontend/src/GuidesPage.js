import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون صفحة الأدلة التعليمية
const GuidesPage = ({ onBack }) => {
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGuides();
    // تحديث Meta Tags
    document.title = 'الأدلة التعليمية - نظام الاستعلام الذكي';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'أدلة شاملة ونصائح تعليمية للطلاب وأولياء الأمور حول النظام التعليمي والتقديرات');
    }
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await axios.get(`${API}/guides`);
      setGuides(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأدلة التعليمية:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuideDetails = async (guideId) => {
    try {
      const response = await axios.get(`${API}/guides/${guideId}`);
      setSelectedGuide(response.data);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الدليل:', error);
    }
  };

  // استخراج التصنيفات المتاحة
  const categories = [...new Set(guides.map(guide => guide.category))];

  // تصفية الأدلة حسب البحث والتصنيف
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // فصل الأدلة المميزة
  const featuredGuides = filteredGuides.filter(guide => guide.is_featured);
  const regularGuides = filteredGuides.filter(guide => !guide.is_featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedGuide) {
    return (
      <GuideDetailView 
        guide={selectedGuide} 
        onBack={() => setSelectedGuide(null)}
        onBackToMain={onBack}
      />
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
              <h1 className="text-2xl font-bold text-gray-900">📚 الأدلة التعليمية</h1>
              <p className="text-sm text-gray-600">نصائح وإرشادات شاملة للطلاب وأولياء الأمور</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">📖 مكتبة المعرفة التعليمية</h2>
          <p className="text-xl mb-8">أدلة شاملة ونصائح عملية لرحلة تعليمية ناجحة</p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الأدلة والنصائح..."
                className="w-full px-6 py-4 text-gray-900 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 text-right text-lg"
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
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              جميع الأدلة ({guides.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category} ({guides.filter(guide => guide.category === category).length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Guides */}
        {featuredGuides.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">⭐ الأدلة المميزة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => fetchGuideDetails(guide.id)}
                  className="bg-white rounded-2xl shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-yellow-400"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      مميز
                    </span>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {guide.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {guide.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{guide.views_count} مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>{new Date(guide.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                  
                  {guide.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {guide.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">اقرأ المزيد ←</span>
                    <div className="text-2xl">📖</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regular Guides */}
        {regularGuides.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📋 جميع الأدلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularGuides.map((guide) => (
                <div
                  key={guide.id}
                  onClick={() => fetchGuideDetails(guide.id)}
                  className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {guide.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                    {guide.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{guide.views_count} مشاهدة</span>
                    </div>
                  </div>
                  
                  {guide.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {guide.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-medium">اقرأ المزيد ←</span>
                    <div className="text-xl">📄</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على أدلة</h3>
            <p className="text-gray-600 mb-6">جرب تغيير كلمات البحث أو اختيار تصنيف مختلف</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              إعادة تعيين البحث
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

// مكون عرض تفاصيل الدليل
const GuideDetailView = ({ guide, onBack, onBackToMain }) => {
  useEffect(() => {
    // تحديث Meta Tags للدليل المحدد
    document.title = `${guide.title} - الأدلة التعليمية`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', guide.content.substring(0, 150) + '...');
    }
  }, [guide]);

  // تحويل المحتوى من Markdown إلى HTML بسيط
  const formatContent = (content) => {
    return content
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-800 mb-3 mt-6">$1</h3>')
      .replace(/^\- (.+)$/gm, '<li class="mb-2">$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                ← العودة للأدلة
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={onBackToMain}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                الصفحة الرئيسية
              </button>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-2">
                {guide.category}
              </span>
              <h1 className="text-xl font-bold text-gray-900">{guide.title}</h1>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          {/* Article Header */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {guide.title}
            </h1>
            
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{guide.views_count} مشاهدة</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>{new Date(guide.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
              {guide.updated_at !== guide.created_at && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>محدث في {new Date(guide.updated_at).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
            </div>
            
            {guide.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {guide.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(guide.content) }}
          />

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  مشاركة
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  طباعة
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                هل وجدت هذا الدليل مفيداً؟
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default GuidesPage;