import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون صفحة الأخبار
const NewsPage = ({ onBack }) => {
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    fetchNews();
    // تحديث Meta Tags
    document.title = 'الأخبار والمقالات - نظام الاستعلام الذكي';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'آخر الأخبار والمقالات حول النتائج والتعليم والنصائح الأكاديمية');
    }
  }, []);

  const fetchNews = async () => {
    try {
      const [allArticlesRes, featuredArticlesRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/news?featured_only=true`)
      ]);
      
      setArticles(allArticlesRes.data);
      setFeaturedArticles(featuredArticlesRes.data);
    } catch (error) {
      console.error('خطأ في جلب الأخبار:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetails = async (articleId) => {
    try {
      const response = await axios.get(`${API}/news/${articleId}`);
      setSelectedArticle(response.data);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المقال:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <ArticleDetailView 
        article={selectedArticle} 
        onBack={() => setSelectedArticle(null)}
        onBackToMain={onBack}
      />
    );
  }

  const displayedArticles = showFeaturedOnly ? featuredArticles : articles;

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
              <h1 className="text-2xl font-bold text-gray-900">📰 الأخبار والمقالات</h1>
              <p className="text-sm text-gray-600">آخر الأخبار والتحديثات التعليمية</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">📡 مركز الأخبار التعليمية</h2>
          <p className="text-xl mb-8">تابع آخر التطورات والأخبار في عالم التعليم والنتائج</p>
          
          {/* Filter Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowFeaturedOnly(false)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                !showFeaturedOnly
                  ? 'bg-white text-indigo-600'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              جميع الأخبار ({articles.length})
            </button>
            <button
              onClick={() => setShowFeaturedOnly(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                showFeaturedOnly
                  ? 'bg-white text-indigo-600'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              الأخبار المميزة ({featuredArticles.length})
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {displayedArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد أخبار متاحة</h3>
            <p className="text-gray-600">تابعنا قريباً للحصول على آخر الأخبار والتحديثات</p>
          </div>
        ) : (
          <>
            {/* Featured Article (if exists and showing all articles) */}
            {!showFeaturedOnly && featuredArticles.length > 0 && (
              <section className="mb-16">
                <div className="relative">
                  <div
                    onClick={() => fetchArticleDetails(featuredArticles[0].id)}
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="p-8 lg:p-12">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold rounded-full">
                            ⭐ مقال مميز
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(featuredArticles[0].published_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                          {featuredArticles[0].title}
                        </h2>
                        
                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                          {featuredArticles[0].summary}
                        </p>
                        
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{featuredArticles[0].views_count} مشاهدة</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7H3a1 1 0 000 2h1a5 5 0 016.78 4.78C10.16 15.51 12 16.64 12 18v3a1 1 0 001 1h4a1 1 0 001-1v-3c0-1.36-1.84-2.49-3.22-4.22A5.002 5.002 0 0116 14h1a1 1 0 010 2h-1a7 7 0 00-7-7z" />
                            </svg>
                            <span>{featuredArticles[0].author}</span>
                          </div>
                        </div>
                        
                        {featuredArticles[0].tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {featuredArticles[0].tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                          اقرأ المقال كاملاً
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="p-8 lg:p-12 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <div className="text-8xl lg:text-9xl">📰</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Articles Grid */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {showFeaturedOnly ? '⭐ الأخبار المميزة' : '📰 جميع الأخبار'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedArticles.slice(showFeaturedOnly ? 0 : 1).map((article) => (
                  <article
                    key={article.id}
                    onClick={() => fetchArticleDetails(article.id)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        {article.is_featured && (
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                            ⭐ مميز
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                        {article.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{article.views_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7H3a1 1 0 000 2h1a5 5 0 016.78 4.78C10.16 15.51 12 16.64 12 18v3a1 1 0 001 1h4a1 1 0 001-1v-3c0-1.36-1.84-2.49-3.22-4.22A5.002 5.002 0 0116 14h1a1 1 0 010 2h-1a7 7 0 00-7-7z" />
                          </svg>
                          <span>{article.author}</span>
                        </div>
                      </div>
                      
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.slice(0, 3).map((tag, index) => (
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
                        <span className="text-blue-600 font-medium text-sm">اقرأ المزيد ←</span>
                        <div className="text-2xl">📖</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Newsletter Subscription */}
        <section className="mt-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 lg:p-12 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <div className="text-5xl mb-6">📧</div>
            <h3 className="text-3xl font-bold mb-4">ابق على اطلاع دائم</h3>
            <p className="text-xl mb-8 text-indigo-100">
              اشترك في نشرتنا الإخبارية لتحصل على آخر الأخبار والتحديثات مباشرة في بريدك الإلكتروني
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30"
              />
              <button className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                اشتراك
              </button>
            </div>
            
            <p className="text-sm text-indigo-200 mt-4">
              نحترم خصوصيتك ولن نرسل لك إلا المحتوى المفيد والمهم
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

// مكون عرض تفاصيل المقال
const ArticleDetailView = ({ article, onBack, onBackToMain }) => {
  useEffect(() => {
    // تحديث Meta Tags للمقال المحدد
    document.title = `${article.title} - الأخبار`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', article.summary);
    }
  }, [article]);

  // تحويل المحتوى من نص بسيط إلى HTML مع تنسيق
  const formatContent = (content) => {
    return content
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-800 mb-3 mt-6">$1</h3>')
      .replace(/^\- (.+)$/gm, '<li class="mb-2 mr-4">$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>');
  };

  const shareArticle = (platform) => {
    const url = window.location.href;
    const text = `${article.title}\n\n${article.summary}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
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
                ← العودة للأخبار
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
              {article.is_featured && (
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full mb-2">
                  ⭐ مقال مميز
                </span>
              )}
              <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{article.title}</h1>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Article Header */}
          <div className="p-8 lg:p-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                {article.is_featured && (
                  <span className="inline-block px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full">
                    ⭐ مقال مميز
                  </span>
                )}
                <span className="text-blue-100">
                  {new Date(article.published_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {article.title}
              </h1>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                {article.summary}
              </p>
            </div>
          </div>

          {/* Article Meta */}
          <div className="px-8 lg:px-12 py-6 bg-gray-50 border-b">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7H3a1 1 0 000 2h1a5 5 0 016.78 4.78C10.16 15.51 12 16.64 12 18v3a1 1 0 001 1h4a1 1 0 001-1v-3c0-1.36-1.84-2.49-3.22-4.22A5.002 5.002 0 0116 14h1a1 1 0 010 2h-1a7 7 0 00-7-7z" />
                </svg>
                <span>بواسطة: {article.author}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{article.views_count} مشاهدة</span>
              </div>
              
              {article.updated_at !== article.created_at && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>محدث في {new Date(article.updated_at).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
            </div>
            
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag, index) => (
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
          <div className="p-8 lg:p-12">
            <div 
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </div>

          {/* Share Section */}
          <div className="px-8 lg:px-12 py-6 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">شارك المقال</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => shareArticle('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    📱 واتساب
                  </button>
                  <button
                    onClick={() => shareArticle('twitter')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                  >
                    🐦 تويتر
                  </button>
                  <button
                    onClick={() => shareArticle('facebook')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📘 فيسبوك
                  </button>
                  <button
                    onClick={() => shareArticle('telegram')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    ✈️ تيليجرام
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  🖨️ طباعة
                </button>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default NewsPage;