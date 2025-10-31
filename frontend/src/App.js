import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import AdminDashboard from './AdminDashboard';
import AnalyticsPage from './AnalyticsPage';
import FAQPage from './FAQPage';
import GuidesPage from './GuidesPage';
import CalculatorPage from './CalculatorPage';
import NewsPage from './NewsPage';
import './App.css';
import './InputFix.css';

const BACKEND_URL = 'https://student-results-backend.modrsbook.workers.dev';
const API = `${BACKEND_URL}/api`;

// Subscription Form Component
const SubscriptionForm = ({ onSubscribe }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    educational_stage: '',
    region: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      setMessage({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني والاسم' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubscribe(formData);
      setFormData({ email: '', name: '', phone: '', educational_stage: '', region: '' });
      setMessage({ type: 'success', text: 'تم الاشتراك بنجاح! ستصلك الإشعارات قريباً.' });
      setShowForm(false);
    } catch (error) {
      console.error('Subscription error:', error);
      let errorMessage = 'خطأ في الاشتراك. حاول مرة أخرى';
      
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        <div className="flex gap-2 mb-3">
          <input
            type="email"
            placeholder="بريدك الإلكتروني للاشتراك السريع"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm"
          />
          <button 
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔔 اشتراك
          </button>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="text-xs text-blue-300 hover:text-blue-200 underline"
        >
          تخصيص الإشعارات (اختياري)
        </button>
        {message && (
          <div className={`mt-2 p-2 rounded text-xs ${
            message.type === 'success' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <input
          type="email"
          placeholder="البريد الإلكتروني*"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="px-3 py-2 rounded-lg text-gray-900 text-sm"
          required
        />
        <input
          type="text"
          placeholder="الاسم*"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="px-3 py-2 rounded-lg text-gray-900 text-sm"
          required
        />
        <input
          type="tel"
          placeholder="رقم الهاتف (اختياري)"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="px-3 py-2 rounded-lg text-gray-900 text-sm"
        />
        <select
          value={formData.educational_stage}
          onChange={(e) => setFormData(prev => ({ ...prev, educational_stage: e.target.value }))}
          className="px-3 py-2 rounded-lg text-gray-900 text-sm"
        >
          <option value="">المرحلة التعليمية (اختياري)</option>
          <option value="primary">الابتدائية</option>
          <option value="middle">الإعدادية</option>
          <option value="secondary">الثانوية</option>
        </select>
        <input
          type="text"
          placeholder="المحافظة (اختياري)"
          value={formData.region}
          onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
          className="px-3 py-2 rounded-lg text-gray-900 text-sm"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
        >
          {isSubmitting ? '⏳ جاري الاشتراك...' : '✅ اشتراك'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          ✖️
        </button>
      </div>
      
      {message && (
        <div className={`p-2 rounded text-xs ${
          message.type === 'success' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
        }`}>
          {message.text}
        </div>
      )}
    </form>
  );
};

// Notification Banner Component for main page
const NotificationSubscriptionBanner = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubscribe({ email, name: name || 'مشترك' });
      setEmail('');
      setName('');
      setMessage({ type: 'success', text: 'تم الاشتراك بنجاح! ستصلك الإشعارات قريباً.' });
      setIsExpanded(false);
    } catch (error) {
      console.error('Subscription error:', error);
      let errorMessage = 'خطأ في الاشتراك. حاول مرة أخرى';
      
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isExpanded ? (
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-blue-300 focus:outline-none"
          />
          <button
            onClick={handleQuickSubscribe}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? '⏳' : '🔔 اشتراك'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleQuickSubscribe} className="space-y-3">
          <input
            type="email"
            placeholder="البريد الإلكتروني*"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-blue-300 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="الاسم (اختياري)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 border-2 border-transparent focus:border-blue-300 focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '⏳ جاري الاشتراك...' : '✅ اشتراك'}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              ✖️
            </button>
          </div>
        </form>
      )}
      
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-blue-200 hover:text-white underline"
        >
          إعدادات متقدمة
        </button>
      )}
      
      {message && (
        <div className={`p-3 rounded-xl text-sm ${
          message.type === 'success' 
            ? 'bg-green-500 text-green-100' 
            : 'bg-red-500 text-red-100'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

// مكونات الـ SEO والـ Schema Markup
const SEOHead = ({ title, description, keywords, canonicalUrl, ogImage, schemaData }) => {
  useEffect(() => {
    // تحديث Title
    document.title = title;
    
    // تحديث Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // تحديث Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywords);
    
    // تحديث Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
    
    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: ogImage || '/default-og-image.jpg' },
      { property: 'og:site_name', content: 'نظام الاستعلام الذكي' }
    ];
    
    ogTags.forEach(tag => {
      let ogTag = document.querySelector(`meta[property="${tag.property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', tag.property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', tag.content);
    });
    
    // Twitter Cards
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage || '/default-og-image.jpg' }
    ];
    
    twitterTags.forEach(tag => {
      let twitterTag = document.querySelector(`meta[name="${tag.name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', tag.name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', tag.content);
    });
    
    // Schema Markup
    if (schemaData) {
      let schemaScript = document.querySelector('#schema-markup');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'schema-markup';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaData);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, schemaData]);
  
  return null;
};

// مكون البحث الصوتي
const VoiceSearch = ({ onResult, isListening, setIsListening }) => {
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();
      
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'ar-SA';
      
      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      
      speechRecognition.onerror = () => {
        setIsListening(false);
      };
      
      speechRecognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(speechRecognition);
    }
  }, [onResult, setIsListening]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  if (!recognition) return null;

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`p-3 rounded-full transition-all duration-300 ${
        isListening 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
      }`}
      title={isListening ? 'إيقاف التسجيل' : 'بحث صوتي'}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  );
};

// مكون الاقتراحات التلقائية
const SearchSuggestions = ({ query, selectedStage, selectedRegion, onSelect, isVisible, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          ...(selectedStage && { stage: selectedStage }),
          ...(selectedRegion && { region: selectedRegion })
        });
        
        const response = await axios.get(`${API}/search/suggestions?${params}`);
        setSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('خطأ في جلب الاقتراحات:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedStage, selectedRegion]);

  if (!isVisible || query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-50">
      {loading ? (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">جاري البحث...</p>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="py-2">
          <div className="px-4 py-2 text-xs text-gray-500 border-b">
            {suggestions.length} اقتراح متاح
          </div>
          {suggestions.map((suggestion, index) => {
            // Handle both string and object suggestions safely
            const suggestionText = typeof suggestion === 'string' ? suggestion : (suggestion?.text || String(suggestion?.value || ''));
            const suggestionType = typeof suggestion === 'object' ? suggestion?.type : null;
            const suggestionStage = typeof suggestion === 'object' ? suggestion?.stage : null;
            
            return (
              <button
                key={index}
                onClick={() => {
                  onSelect(suggestionText);
                  onClose();
                }}
                className="w-full px-4 py-3 text-right hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">{suggestionText}</span>
                  <div className="flex items-center text-xs text-gray-500">
                    {suggestionType && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full mr-2">
                        {suggestionType === 'name' ? '👤 اسم' : '🔢 رقم جلوس'}
                      </span>
                    )}
                    {suggestionStage && (
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">
                        🎓 {suggestionStage}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : query.length >= 2 ? (
        <div className="p-4 text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <p>لا توجد اقتراحات لـ "{query}"</p>
          <p className="text-xs mt-1">جرب البحث بكلمات مختلفة</p>
        </div>
      ) : null}
    </div>
  );
};

// مكونات المساعدة
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorAlert = ({ message, onClose }) => (
  <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-4 rounded-lg shadow-sm">
    <div className="flex justify-between items-start">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="mr-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

const SuccessAlert = ({ message, onClose }) => (
  <div className="bg-green-50 border-r-4 border-green-400 p-4 mb-4 rounded-lg shadow-sm">
    <div className="flex justify-between items-start">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="mr-3">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-green-400 hover:text-green-600">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

// مكون الصفحة الرئيسية العامة (محسن بالسيو والمميزات المتقدمة)
const PublicHomePage = ({ siteContent, onStageClick, onNavigate, onSubscribe, onStudentSelect }) => {
  const [educationalStages, setEducationalStages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    fetchEducationalStages();
    
    // جلب عمليات البحث الحديثة
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const fetchEducationalStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`);
      setEducationalStages(response.data);
    } catch (error) {
      console.error('خطأ في جلب المراحل التعليمية:', error);
    }
  };

  const getRegionsForStage = (stageId) => {
    const stage = educationalStages.find(s => s.id === stageId);
    return stage?.regions || [];
  };

  const performAdvancedSearch = async () => {
    if (!searchQuery.trim()) {
      alert('يرجى إدخال كلمة البحث');
      return;
    }

    setIsSearching(true);
    try {
      const searchData = {
        query: searchQuery.trim(),
        educational_stage_id: selectedStage || null,
        region_filter: selectedRegion || null,
        search_fields: ['name', 'student_id']
      };

      const response = await axios.post(`${API}/search`, searchData);
      
      // التعامل مع أشكال مختلفة من استجابة الخادم
      let results = [];
      if (Array.isArray(response.data)) {
        // إذا كانت النتائج مباشرة في response.data
        results = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // إذا كانت النتائج في response.data.results
        results = response.data.results;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        // إذا كانت النتائج في response.data.students
        results = response.data.students;
      }
      
      setSearchResults(results);
      
      // حفظ البحث في المحفوظات
      const searchRecord = {
        query: searchQuery.trim(),
        stage: selectedStage ? educationalStages.find(s => s.id === selectedStage)?.name : null,
        region: selectedRegion,
        timestamp: new Date().toISOString()
      };
      addToRecentSearches(searchRecord);

      // عرض النتائج - لا نحتاج لـ alert لأن النتائج ستظهر في الـ SearchResultsModal
      console.log(`تم العثور على ${results.length} نتيجة`);

    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ في البحث. حاول مرة أخرى');
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceResult = (transcript) => {
    setSearchQuery(transcript);
    // البحث التلقائي بعد البحث الصوتي
    setTimeout(() => {
      if (transcript.trim()) {
        performQuickSearch(transcript);
      }
    }, 500);
  };

  const handleSearchSelect = (value) => {
    setSearchQuery(value);
    performAdvancedSearch();
  };

  const addToRecentSearches = (searchRecord) => {
    const newSearches = [searchRecord, ...recentSearches.filter(s => s.query !== searchRecord.query)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem('recent_searches', JSON.stringify(newSearches));
  };

  const performQuickSearch = async (query) => {
    if (query.trim()) {
      setSearchQuery(query);
      await performAdvancedSearch();
    }
  };

  if (!siteContent) {
    return <LoadingSpinner />;
  }

  // إعداد SEO للصفحة الرئيسية
  const seoData = {
    title: siteContent.page_title,
    description: siteContent.meta_description,
    keywords: siteContent.seo_keywords,
    canonicalUrl: window.location.origin,
    schemaData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteContent.page_title,
      "description": siteContent.meta_description,
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "mainEntity": {
        "@type": "EducationalOrganization",
        "name": "نظام الاستعلام الذكي",
        "description": "نظام متطور للاستعلام عن نتائج الطلاب",
        "serviceType": "نتائج الطلاب"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <SEOHead {...seoData} />
      
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {siteContent.page_title}
                </h1>
                <p className="text-sm text-gray-600">نظام متطور لإدارة والاستعلام عن نتائج الطلاب</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-reverse space-x-8">
              <button 
                onClick={() => onNavigate('analytics')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                📊 الإحصائيات
              </button>
              <button 
                onClick={() => onNavigate('faq')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                ❓ أسئلة شائعة
              </button>
              <button 
                onClick={() => onNavigate('guides')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                📚 أدلة تعليمية
              </button>
              <button 
                onClick={() => onNavigate('calculator')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                🧮 حاسبة الدرجات
              </button>
              <button 
                onClick={() => onNavigate('news')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                📰 الأخبار
              </button>
              <a href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                ⚙️ الإدارة
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Search */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            {siteContent.hero_title}
          </h1>
          <p className="text-xl mb-8 leading-relaxed">
            {siteContent.hero_subtitle}
          </p>
          
          {/* Enhanced Search Box with Stage Selection */}
          <div className="max-w-3xl mx-auto relative mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              {/* Stage Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 text-right">
                  🎓 اختر المرحلة التعليمية (اختياري)
                </label>
                <select 
                  className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  onChange={(e) => setSelectedStage(e.target.value)}
                  value={selectedStage}
                >
                  <option value="">جميع المراحل التعليمية</option>
                  {educationalStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.icon} {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Selection (appears when stage is selected) */}
              {selectedStage && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-right">
                    🗺️ اختر المحافظة (اختياري)
                  </label>
                  <select 
                    className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    value={selectedRegion}
                  >
                    <option value="">جميع المحافظات</option>
                    {getRegionsForStage(selectedStage).map((region, index) => (
                      <option key={index} value={region}>
                        📍 {region}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Search Input */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && performAdvancedSearch()}
                  placeholder="ابحث بالاسم أو رقم الجلوس..."
                  className="flex-1 px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg"
                />
                
                <VoiceSearch 
                  onResult={handleVoiceResult}
                  isListening={isVoiceListening}
                  setIsListening={setIsVoiceListening}
                />
                
                <button
                  onClick={performAdvancedSearch}
                  disabled={!searchQuery.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔍 بحث متقدم
                </button>
              </div>

              {/* Search Tips */}
              <div className="mt-4 text-sm text-gray-600 text-right">
                💡 <strong>نصائح البحث:</strong> يمكنك البحث بالاسم الكامل أو جزء منه، أو رقم الجلوس
                {selectedStage && (
                  <span className="block mt-1">
                    🎯 البحث محدد في: <strong>{educationalStages.find(s => s.id === selectedStage)?.name}</strong>
                    {selectedRegion && <span> - <strong>{selectedRegion}</strong></span>}
                  </span>
                )}
              </div>
            </div>
            
            <SearchSuggestions
              query={searchQuery}
              selectedStage={selectedStage}
              selectedRegion={selectedRegion}
              onSelect={handleSearchSelect}
              isVisible={showSuggestions}
              onClose={() => setShowSuggestions(false)}
            />
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-8">
              <p className="text-blue-100 mb-3">🕒 عمليات البحث الحديثة:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {recentSearches
                  .filter(search => search != null && (
                    (typeof search === 'string' && search.trim()) || 
                    (typeof search === 'object' && search.query && search.query.trim())
                  ))
                  .map((search, index) => {
                    // Handle both old format (string) and new format (object)
                    const isString = typeof search === 'string';
                    const query = isString ? search : (search.query || '');
                    const stage = isString ? null : (search.stage || null);
                    
                    if (!query.trim()) return null;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSearchSelect(query)}
                        className="px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-colors"
                      >
                        {stage && <span className="text-xs opacity-75">{stage} - </span>}
                        {query}
                      </button>
                    );
                  })
                  .filter(Boolean)}
              </div>
            </div>
          )}
          
          <a href="#stages" className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
            أو تصفح المراحل التعليمية ⬇️
          </a>
        </div>
      </section>

      {/* Quick Access Buttons */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🚀 الوصول السريع</h2>
            <p className="text-xl text-gray-600">أدوات وخدمات مفيدة للطلاب وأولياء الأمور</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: 'الإحصائيات', icon: '📊', key: 'analytics', color: 'from-blue-500 to-blue-600' },
              { name: 'أسئلة شائعة', icon: '❓', key: 'faq', color: 'from-green-500 to-green-600' },
              { name: 'أدلة تعليمية', icon: '📚', key: 'guides', color: 'from-purple-500 to-purple-600' },
              { name: 'حاسبة الدرجات', icon: '🧮', key: 'calculator', color: 'from-pink-500 to-pink-600' },
              { name: 'الأخبار', icon: '📰', key: 'news', color: 'from-orange-500 to-orange-600' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`p-6 bg-gradient-to-r ${item.color} text-white rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center`}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg">{item.name}</h3>
              </button>
            ))}
          </div>
          
          {/* Search Results Modal */}
          {searchResults.length > 0 && (
            <SearchResultsModal 
              results={searchResults}
              onClose={() => setSearchResults([])}
              searchQuery={searchQuery}
              selectedStage={selectedStage}
              selectedRegion={selectedRegion}
              onStudentSelect={(student) => {
                setSearchResults([]);
                onStudentSelect(student);
              }}
            />
          )}

          {/* Newsletter Subscription CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-2xl font-bold mb-4">احصل على إشعارات فورية</h3>
              <p className="text-lg mb-6 text-blue-100">
                كن أول من يعلم بظهور النتائج الجديدة وآخر التحديثات المهمة
              </p>
              <div className="max-w-md mx-auto">
                <NotificationSubscriptionBanner onSubscribe={onSubscribe} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Stages Section */}
      <section id="stages" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">🎓 المراحل التعليمية المتاحة</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              اختر المرحلة التعليمية المناسبة للانتقال إلى صفحة الاستعلام المخصصة
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {educationalStages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => onStageClick(stage)}
                className="relative bg-white rounded-2xl shadow-xl p-8 cursor-pointer transition-all duration-300 transform hover:-translate-y-3 hover:shadow-2xl border-t-4 group"
                style={{ borderTopColor: stage.color }}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {stage.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{stage.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{stage.description}</p>
                  <div className="text-xs text-gray-500 mb-4">
                    {stage.regions?.length || 0} محافظة متاحة
                  </div>
                  <div className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium text-sm transform group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                    انقر للاستعلام
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">✨ مميزات النظام</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {siteContent.about_section}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {siteContent.features?.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300 text-center group">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breadcrumbs for SEO */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="text-sm">
            <ol className="flex items-center gap-2 text-gray-500">
              <li>
                <a href="/" className="hover:text-blue-600">الصفحة الرئيسية</a>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company Info */}
            <div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4">{siteContent.page_title}</h3>
              <p className="text-gray-300 leading-relaxed">
                نظام متطور وذكي للاستعلام عن نتائج الطلاب في جميع المراحل التعليمية
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">🔗 روابط مهمة</h3>
              <div className="space-y-3">
                <button onClick={() => onNavigate('analytics')} className="block hover:text-blue-300 transition-colors">الإحصائيات</button>
                <button onClick={() => onNavigate('faq')} className="block hover:text-blue-300 transition-colors">أسئلة شائعة</button>
                <button onClick={() => onNavigate('guides')} className="block hover:text-blue-300 transition-colors">أدلة تعليمية</button>
                <button onClick={() => onNavigate('calculator')} className="block hover:text-blue-300 transition-colors">حاسبة الدرجات</button>
                <button onClick={() => onNavigate('news')} className="block hover:text-blue-300 transition-colors">الأخبار</button>
                <a href="/admin" className="block hover:text-blue-300 transition-colors">دخول الإدارة</a>
              </div>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">📞 معلومات الاتصال</h3>
              <div className="space-y-3">
                <p className="flex items-center gap-2">
                  <span>📱</span>
                  {siteContent.contact_info?.phone}
                </p>
                <p className="flex items-center gap-2">
                  <span>📧</span>
                  {siteContent.contact_info?.email}
                </p>
                <p className="flex items-center gap-2">
                  <span>📍</span>
                  {siteContent.contact_info?.address}
                </p>
              </div>
            </div>
            
            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">🌐 تابعنا</h3>
              <div className="flex space-x-reverse space-x-4 mb-6">
                <a href={siteContent.social_links?.twitter} className="text-2xl hover:text-blue-300 transition-colors">🐦</a>
                <a href={siteContent.social_links?.facebook} className="text-2xl hover:text-blue-300 transition-colors">📘</a>
                <a href={siteContent.social_links?.instagram} className="text-2xl hover:text-blue-300 transition-colors">📷</a>
              </div>
              
              {/* Newsletter Subscription */}
              <div>
                <h4 className="font-bold mb-2">🔔 الاشتراك في الإشعارات</h4>
                <p className="text-sm text-gray-300 mb-3">احصل على التحديثات فور ظهور النتائج</p>
                <SubscriptionForm onSubscribe={onSubscribe} />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-300">{siteContent.footer_text}</p>
            <p className="text-gray-400 mt-2 text-sm">
              جميع الحقوق محفوظة © {new Date().getFullYear()} - تم التطوير بواسطة نظام ذكي متطور
            </p>
            <div className="mt-4 flex justify-center gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white">سياسة الخصوصية</a>
              <a href="/terms" className="hover:text-white">شروط الاستخدام</a>
              <a href="/sitemap.xml" className="hover:text-white">خريطة الموقع</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// صفحة الاستعلام المخصصة لمرحلة تعليمية
const StageInquiryPage = ({ stage, onBack, onStudentSelect, onSchoolClick, onAdministrationClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    // تحديث Meta Tags للصفحة
    document.title = `${stage.name} - نظام الاستعلام الذكي`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `استعلم عن نتائج ${stage.name} في جميع المحافظات`);
    }
  }, [stage]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.post(`${API}/search`, {
        query: searchQuery,
        search_type: searchType,
        educational_stage_id: stage.id,
        region_filter: selectedRegion
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ في البحث');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <span className="text-3xl">{stage.icon}</span>
                {stage.name}
              </h1>
              <p className="text-sm text-gray-600">{stage.description}</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Stage Info Section */}
      <section className="py-12 px-4" style={{ backgroundColor: stage.color + '20' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">{stage.icon}</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{stage.name}</h2>
          <p className="text-xl text-gray-700 mb-6">{stage.description}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <span className="text-sm text-gray-600">متاح في</span>
            <span className="font-bold text-gray-900">{stage.regions?.length || 0}</span>
            <span className="text-sm text-gray-600">محافظة</span>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🔍 استعلم عن نتيجتك</h2>
            <p className="text-xl text-gray-600">ادخل رقم الجلوس أو اسم الطالب للحصول على النتائج</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-xl">
            {/* فلتر المحافظة */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة (اختياري)</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-right"
              >
                <option value="">جميع المحافظات</option>
                {stage.regions?.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* حقول البحث */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="ادخل رقم الجلوس أو اسم الطالب..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-right text-lg"
                  style={{ color: '#1f2937', backgroundColor: 'white' }}
                />
              </div>
              
              <div className="md:w-48">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg"
                  style={{ color: '#1f2937', backgroundColor: 'white' }}
                >
                  <option value="all">الكل</option>
                  <option value="student_id">رقم الجلوس</option>
                  <option value="name">الاسم</option>
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none text-lg"
              >
                {isSearching ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>

            {/* نتائج البحث */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">نتائج البحث ({searchResults.length})</h3>
                <div className="grid gap-6">
                  {searchResults.map((student, index) => (
                    <div
                      key={student.student_id || index}
                      onClick={() => onStudentSelect(student)}
                      className="bg-white p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{student.name}</h4>
                          <p className="text-gray-600 mb-1">رقم الجلوس: <span className="font-semibold">{student.student_id}</span></p>
                          {student.region && (
                            <p className="text-gray-600 mb-1">المحافظة: <span className="font-semibold">{student.region}</span></p>
                          )}
                          
                          {/* المدرسة كرابط قابل للنقر */}
                          {student.school_name && (
                            <p className="text-gray-600 mb-1">
                              المدرسة: 
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSchoolClick(student.school_name, student.educational_stage_id, student.region);
                                }}
                                className="font-semibold text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors mr-2"
                              >
                                {student.school_name}
                              </button>
                            </p>
                          )}
                          
                          {/* الإدارة كرابط قابل للنقر */}
                          {student.administration && (
                            <p className="text-gray-600 mb-1">
                              الإدارة: 
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAdministrationClick(student.administration, student.educational_stage_id, student.region);
                                }}
                                className="font-semibold text-green-600 hover:text-green-800 underline hover:no-underline transition-colors mr-2"
                              >
                                {student.administration}
                              </button>
                            </p>
                          )}
                          
                          {student.class_name && (
                            <p className="text-gray-600">الفصل: <span className="font-semibold">{student.class_name}</span></p>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl">
                            <p className="text-2xl font-bold">{student.average}%</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 font-semibold">{student.grade}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults && searchResults.length === 0 && searchQuery && (
              <div className="mt-8 text-center py-8">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-xl text-gray-600">لم يتم العثور على نتائج للبحث "{searchQuery}"</p>
                <p className="text-gray-500 mt-2">في {stage.name} {selectedRegion && `- محافظة ${selectedRegion}`}</p>
                <p className="text-gray-500 mt-2">يرجى التأكد من رقم الجلوس أو الاسم والمحاولة مرة أخرى</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

// مكون عرض تفاصيل الطالب مع نسبة النجاح ومشاركة النتائج
const StudentDetails = ({ student, onBack }) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateTemplates, setCertificateTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [siteContent, setSiteContent] = useState(null);
  const [fullStudentDetails, setFullStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteContent();
    fetchCertificateTemplates();
    fetchFullStudentDetails();
    // تحديث Meta Tags للطالب المحدد
    document.title = `نتيجة الطالب ${student.name} - نظام الاستعلام الذكي`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `نتيجة الطالب ${student.name} - رقم الجلوس ${student.student_id} - المتوسط ${student.average}%`);
    }
  }, [student]);

  const fetchFullStudentDetails = async () => {
    try {
      setLoading(true);
      // محاولة جلب تفاصيل الطالب الكاملة
      const response = await axios.post(`${API}/search`, {
        query: student.student_id,
        search_type: "student_id",
        educational_stage_id: student.educational_stage_id || null,
        region_filter: student.region || null
      });
      
      let results = [];
      if (Array.isArray(response.data)) {
        results = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        results = response.data.results;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        results = response.data.students;
      }
      
      // البحث عن الطالب المطابق
      const studentDetails = results.find(s => 
        s.student_id === student.student_id || 
        (s.name === student.name && s.student_id === student.student_id)
      );
      
      if (studentDetails) {
        setFullStudentDetails(studentDetails);
      } else {
        // إذا لم نجد تفاصيل كاملة، استخدم البيانات الأساسية
        setFullStudentDetails(student);
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل الطالب:', error);
      // استخدم البيانات الأساسية في حالة الخطأ
      setFullStudentDetails(student);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const response = await axios.get(`${API}/content`);
      setSiteContent(response.data);
    } catch (error) {
      console.error('خطأ في جلب محتوى الموقع:', error);
    }
  };

  const fetchCertificateTemplates = async () => {
    try {
      const response = await axios.get(`${API}/certificate-templates`);
      setCertificateTemplates(response.data);
    } catch (error) {
      console.error('خطأ في جلب قوالب الشهادات:', error);
    }
  };

  // حساب نسبة النجاح للطالب
  const calculateSuccessPercentage = () => {
    const currentStudent = fullStudentDetails || student;
    if (!currentStudent.subjects || currentStudent.subjects.length === 0) return 0;
    
    const totalSubjects = currentStudent.subjects.length;
    const passedSubjects = currentStudent.subjects.filter(subject => {
      // اعتبار المادة ناجحة إذا كانت النسبة 50% أو أكثر
      return subject.percentage >= 50;
    }).length;
    
    return Math.round((passedSubjects / totalSubjects) * 100);
  };

  const shareResult = (platform) => {
    const url = window.location.href;
    const text = `🎓 نتيجة الطالب ${student.name}\n📊 المتوسط: ${student.average}%\n🏆 التقدير: ${student.grade}\n✅ نسبة النجاح: ${calculateSuccessPercentage()}%`;
    
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

  const generateCertificate = (template) => {
    setSelectedTemplate(template);
    setShowCertificate(true);
  };

  const renderCertificate = () => {
    if (!selectedTemplate) return null;

    let htmlContent = selectedTemplate.html_content;
    
    // استبدال المتغيرات في القالب
    const variables = {
      '[اسم_الطالب]': student.name,
      '[رقم_الجلوس]': student.student_id,
      '[اسم_المرحلة]': student.educational_stage || 'المرحلة التعليمية',
      '[المتوسط]': student.average,
      '[التقدير]': student.grade,
      '[التاريخ]': new Date().toLocaleDateString('ar-EG'),
      '[رقم_الشهادة]': `${student.student_id}-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    Object.entries(variables).forEach(([key, value]) => {
      htmlContent = htmlContent.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return (
      <div id="certificate-content">
        <style dangerouslySetInnerHTML={{ __html: selectedTemplate.css_styles }} />
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    );
  };

  const downloadCertificateAsImage = async () => {
    try {
      const certificateElement = document.getElementById('certificate-content');
      if (!certificateElement) {
        alert('خطأ في العثور على محتوى الشهادة');
        return;
      }

      // إعدادات html2canvas محسنة
      const canvas = await html2canvas(certificateElement, {
        backgroundColor: '#ffffff',
        scale: 2, // جودة عالية
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: certificateElement.scrollWidth,
        height: certificateElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // تحويل الكانفاس إلى بيانات صورة
      const imageData = canvas.toDataURL('image/png', 1.0);

      // تحميل الصورة
      const link = document.createElement('a');
      link.download = `شهادة_${student.name}_${student.student_id}.png`;
      link.href = imageData;
      link.click();

      alert('تم تحميل الشهادة كصورة بنجاح!');
      
    } catch (error) {
      console.error('خطأ في تحويل الشهادة إلى صورة:', error);
      alert('حدث خطأ في تحميل الشهادة. حاول مرة أخرى');
    }
  };

  const shareCertificateAsImage = async (platform) => {
    try {
      const certificateElement = document.getElementById('certificate-content');
      if (!certificateElement) {
        alert('خطأ في العثور على محتوى الشهادة');
        return;
      }

      const canvas = await html2canvas(certificateElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // تحويل إلى blob
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'certificate.png', { type: 'image/png' })] })) {
          try {
            await navigator.share({
              title: `شهادة تقدير - ${student.name}`,
              text: `شهادة تقدير للطالب ${student.name} - رقم الجلوس: ${student.student_id}`,
              files: [new File([blob], 'certificate.png', { type: 'image/png' })]
            });
          } catch (shareError) {
            console.log('تم إلغاء المشاركة');
          }
        } else {
          // fallback للمشاركة التقليدية
          const imageData = canvas.toDataURL('image/png');
          const shareText = `شهادة تقدير للطالب ${student.name} - رقم الجلوس: ${student.student_id}`;
          
          let shareUrl = '';
          switch (platform) {
            case 'whatsapp':
              shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
              break;
            case 'telegram':
              shareUrl = `https://t.me/share/url?url=${encodeURIComponent(imageData)}&text=${encodeURIComponent(shareText)}`;
              break;
            case 'twitter':
              shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
              break;
            case 'facebook':
              shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
              break;
            default:
              // نسخ الرابط
              navigator.clipboard.writeText(shareText);
              alert('تم نسخ النص إلى الحافظة');
              return;
          }
          
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('خطأ في مشاركة الشهادة:', error);
      alert('حدث خطأ في مشاركة الشهادة');
    }
  };

  const printCertificate = () => {
    const certificateElement = document.getElementById('certificate-content');
    if (!certificateElement) {
      alert('خطأ في العثور على محتوى الشهادة');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>شهادة تقدير - ${student.name}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; padding: 0; }
            }
            ${selectedTemplate.css_styles}
          </style>
        </head>
        <body>
          ${certificateElement.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const subjectColors = [
    'from-red-500 to-red-600', 'from-blue-500 to-blue-600', 'from-green-500 to-green-600', 
    'from-yellow-500 to-yellow-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 
    'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600'
  ];

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'ممتاز': return 'bg-green-100 text-green-800 border-green-200';
      case 'جيد جداً': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'جيد': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'مقبول': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">جاري تحميل تفاصيل الطالب...</p>
        </div>
      </div>
    );
  }

  const currentStudent = fullStudentDetails || student;
  const successPercentage = calculateSuccessPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📊 بيانات الطالب التفصيلية
          </h1>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ← العودة للبحث
            </button>
          </div>
        </div>

        {/* معلومات الطالب الأساسية مع نسبة النجاح */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-6">
                <h3 className="text-lg text-gray-600 mb-2">اسم الطالب</h3>
                <p className="text-2xl font-bold text-gray-900">{currentStudent.name}</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6">
                <h3 className="text-lg text-gray-600 mb-2">رقم الجلوس</h3>
                <p className="text-2xl font-bold text-gray-900">{currentStudent.student_id}</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6">
                <h3 className="text-lg text-gray-600 mb-2">المتوسط العام</h3>
                <p className={`text-3xl font-bold ${getScoreColor(currentStudent.average)}`}>
                  {currentStudent.average}%
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-purple-100 to-violet-100 rounded-2xl p-6">
                <h3 className="text-lg text-gray-600 mb-2">نسبة النجاح</h3>
                <p className={`text-3xl font-bold ${getScoreColor(successPercentage)}`}>
                  {successPercentage}%
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-2xl p-6">
                <h3 className="text-lg text-gray-600 mb-2">التقدير</h3>
                <span className={`px-4 py-2 rounded-full text-lg font-bold border-2 ${getGradeColor(currentStudent.grade)}`}>
                  {currentStudent.grade}
                </span>
              </div>
            </div>
            
            {student.class_name && (
              <div className="text-center md:text-right">
                <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-2xl p-6">
                  <h3 className="text-lg text-gray-600 mb-2">الفصل</h3>
                  <p className="text-2xl font-bold text-gray-900">{student.class_name}</p>
                </div>
              </div>
            )}
            
            {student.total_score && (
              <div className="text-center md:text-right">
                <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-6">
                  <h3 className="text-lg text-gray-600 mb-2">المجموع الكلي</h3>
                  <p className="text-2xl font-bold text-gray-900">{student.total_score}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* مشاركة النتائج على وسائل التواصل */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">📱 شارك نتيجتك</h2>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => shareResult('whatsapp')}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors duration-300 shadow-lg"
            >
              📱 واتساب
            </button>
            <button
              onClick={() => shareResult('twitter')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl transition-colors duration-300 shadow-lg"
            >
              🐦 تويتر
            </button>
            <button
              onClick={() => shareResult('facebook')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-300 shadow-lg"
            >
              📘 فيسبوك
            </button>
            <button
              onClick={() => shareResult('telegram')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-300 shadow-lg"
            >
              ✈️ تيليجرام
            </button>
          </div>
        </div>

        {/* درجات المواد */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📚 درجات المواد التفصيلية</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentStudent.subjects?.map((subject, index) => (
              <div key={subject.name} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${subjectColors[index % subjectColors.length]}`}></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">الدرجة</span>
                    <span className={`text-xl font-bold ${getScoreColor(subject.percentage)}`}>
                      {subject.score} / {subject.max_score}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">النسبة المئوية</span>
                    <span className={`text-xl font-bold ${getScoreColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </span>
                  </div>
                  
                  {/* شريط التقدم المحسن */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 bg-gradient-to-r ${
                          subject.percentage >= 90 ? 'from-green-400 to-green-600' :
                          subject.percentage >= 80 ? 'from-blue-400 to-blue-600' :
                          subject.percentage >= 70 ? 'from-yellow-400 to-yellow-600' :
                          subject.percentage >= 60 ? 'from-orange-400 to-orange-600' : 'from-red-400 to-red-600'
                        }`}
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(!currentStudent.subjects || currentStudent.subjects.length === 0) && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد تفاصيل مواد متاحة</h3>
                <p className="text-gray-600">تفاصيل المواد غير متوفرة حالياً. يمكنك الاطلاع على المعدل العام والتقدير أعلاه.</p>
              </div>
            )}
          </div>
          
          {/* ملخص الأداء */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📈 ملخص الأداء الأكاديمي</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold text-blue-600">{currentStudent.subjects?.length || 0}</p>
                <p className="text-gray-600 font-medium">عدد المواد</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{currentStudent.average}%</p>
                <p className="text-gray-600 font-medium">المعدل العام</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{successPercentage}%</p>
                <p className="text-gray-600 font-medium">نسبة النجاح</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">{currentStudent.grade}</p>
                <p className="text-gray-600 font-medium">التقدير النهائي</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* قوالب الشهادات */}
        {certificateTemplates.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">🏆 شهادات التقدير</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificateTemplates.map((template) => (
                <div key={template.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition-colors duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  <button
                    onClick={() => generateCertificate(template)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    إنشاء شهادة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* عرض الشهادة */}
        {showCertificate && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 no-print">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">🏆 شهادة تقدير</h3>
                  <button
                    onClick={() => setShowCertificate(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                  >
                    ✕ إغلاق
                  </button>
                </div>
                
                {/* أزرار الإجراءات */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={downloadCertificateAsImage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    📥 تحميل كصورة
                  </button>
                  
                  <button
                    onClick={printCertificate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    🖨️ طباعة
                  </button>
                  
                  <button
                    onClick={() => shareCertificateAsImage('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    📱 واتساب
                  </button>
                  
                  <button
                    onClick={() => shareCertificateAsImage('facebook')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    📘 فيسبوك
                  </button>
                  
                  <button
                    onClick={() => shareCertificateAsImage('twitter')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    🐦 تويتر
                  </button>
                  
                  <button
                    onClick={() => shareCertificateAsImage('telegram')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-300 shadow-lg"
                  >
                    ✈️ تيليجرام
                  </button>
                </div>
              </div>

              {/* محتوى الشهادة */}
              <div className="p-12" dir="rtl">
                {renderCertificate()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// صفحة نتائج المدرسة
const SchoolResultsPage = ({ students, schoolName, onBack, onStudentSelect }) => {
  const stats = {
    total: students.length,
    passed: students.filter(s => s.average >= 60).length,
    average: Math.round(students.reduce((sum, s) => sum + s.average, 0) / students.length),
    highest: Math.max(...students.map(s => s.average)),
    lowest: Math.min(...students.map(s => s.average))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* الرأس */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← العودة للبحث
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏫 {schoolName}</h1>
              <p className="text-gray-600">نتائج جميع طلاب المدرسة</p>
            </div>
            <div></div>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-blue-800">إجمالي الطلاب</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
              <p className="text-sm text-green-800">الناجحون</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{Math.round((stats.passed / stats.total) * 100)}%</p>
              <p className="text-sm text-purple-800">معدل النجاح</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">{stats.highest}%</p>
              <p className="text-sm text-yellow-800">أعلى درجة</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{stats.lowest}%</p>
              <p className="text-sm text-red-800">أقل درجة</p>
            </div>
          </div>
        </div>

        {/* قائمة الطلاب */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, index) => (
            <div
              key={student.student_id || index}
              onClick={() => onStudentSelect(student)}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{student.name}</h3>
                  <p className="text-sm text-gray-600">#{student.student_id}</p>
                  {student.class_name && (
                    <p className="text-sm text-gray-500">الفصل: {student.class_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2 rounded-xl">
                    <p className="text-xl font-bold">{student.average}%</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{student.grade}</p>
                </div>
              </div>
              
              {/* شريط التقدم */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                  style={{ width: `${student.average}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// صفحة نتائج الإدارة
const AdministrationResultsPage = ({ students, administrationName, onBack, onStudentSelect }) => {
  const stats = {
    total: students.length,
    passed: students.filter(s => s.average >= 60).length,
    average: Math.round(students.reduce((sum, s) => sum + s.average, 0) / students.length),
    schools: [...new Set(students.map(s => s.school_name).filter(Boolean))].length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* الرأس */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium"
            >
              ← العودة للبحث
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🏛️ {administrationName}</h1>
              <p className="text-gray-600">نتائج جميع طلاب الإدارة التعليمية</p>
            </div>
            <div></div>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              <p className="text-sm text-green-800">إجمالي الطلاب</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats.schools}</p>
              <p className="text-sm text-blue-800">عدد المدارس</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{stats.passed}</p>
              <p className="text-sm text-purple-800">الناجحون</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">{Math.round((stats.passed / stats.total) * 100)}%</p>
              <p className="text-sm text-yellow-800">معدل النجاح</p>
            </div>
          </div>
        </div>

        {/* قائمة الطلاب مجمعة حسب المدرسة */}
        <div className="space-y-8">
          {[...new Set(students.map(s => s.school_name).filter(Boolean))].map(schoolName => {
            const schoolStudents = students.filter(s => s.school_name === schoolName);
            return (
              <div key={schoolName} className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🏫 {schoolName} ({schoolStudents.length} طالب)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schoolStudents.map((student, index) => (
                    <div
                      key={student.student_id || index}
                      onClick={() => onStudentSelect(student)}
                      className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">#{student.student_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{student.average}%</p>
                          <p className="text-xs text-gray-500">{student.grade}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// مكون تسجيل دخول الأدمن
const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      localStorage.setItem('admin_token', response.data.access_token);
      onLogin(response.data);
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 دخول الإدارة</h1>
          <p className="text-gray-600">ادخل بيانات المدير للوصول للوحة التحكم</p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-right"
              placeholder="ادخل اسم المستخدم"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-right"
              placeholder="ادخل كلمة المرور"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            بيانات التجربة: admin / admin123
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};

// المكون الرئيسي
const App = () => {
  const [currentView, setCurrentView] = useState('public'); // public, stage-inquiry, student-details, school-results, administration-results, admin-login, admin-dashboard, analytics, faq, guides, calculator, news
  const [siteContent, setSiteContent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [schoolResults, setSchoolResults] = useState(null);
  const [administrationResults, setAdministrationResults] = useState(null);
  const [currentSchoolName, setCurrentSchoolName] = useState('');
  const [currentAdministrationName, setCurrentAdministrationName] = useState('');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // جلب محتوى الموقع
  useEffect(() => {
    fetchSiteContent();
  }, []);

  const fetchSiteContent = async () => {
    try {
      const response = await axios.get(`${API}/content`);
      setSiteContent(response.data);
      
      // تحديث title و meta description
      document.title = response.data.page_title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', response.data.meta_description);
      }
    } catch (error) {
      console.error('خطأ في جلب محتوى الموقع:', error);
    }
  };

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
    setCurrentView('stage-inquiry');
  };

  const handleNavigate = (page) => {
    setCurrentView(page);
  };

  const handleSchoolClick = async (schoolName, stageId, region) => {
    try {
      const params = new URLSearchParams();
      if (stageId) params.append('educational_stage_id', stageId);
      if (region) params.append('region', region);

      const response = await axios.get(`${API}/school/${encodeURIComponent(schoolName)}/students?${params}`);
      setSchoolResults(response.data.students);
      setCurrentSchoolName(schoolName);
      setCurrentView('school-results');
    } catch (error) {
      console.error('خطأ في جلب طلاب المدرسة:', error);
      alert('خطأ في جلب بيانات المدرسة');
    }
  };

  const handleAdministrationClick = async (administrationName, stageId, region) => {
    try {
      const params = new URLSearchParams();
      if (stageId) params.append('educational_stage_id', stageId);
      if (region) params.append('region', region);

      // استخدام API البحث المتقدم للبحث حسب الإدارة
      const response = await axios.post(`${API}/search`, {
        query: '',
        educational_stage_id: stageId,
        region_filter: region,
        administration_filter: administrationName,
        search_fields: ['name', 'student_id']
      });
      
      setAdministrationResults(response.data);
      setCurrentAdministrationName(administrationName);
      setCurrentView('administration-results');
    } catch (error) {
      console.error('خطأ في جلب طلاب الإدارة:', error);
      alert('خطأ في جلب بيانات الإدارة التعليمية');
    }
  };

  // Notification subscription handler
  const handleSubscription = async (subscriptionData) => {
    try {
      const response = await axios.post(`${API}/subscribe`, subscriptionData);
      console.log('Subscription successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setCurrentView('student-details');
  };

  const handleBackToPublic = () => {
    setSelectedStudent(null);
    setSelectedStage(null);
    setSchoolResults(null);
    setAdministrationResults(null);
    setCurrentView('public');
  };

  const handleAdminLogin = (loginData) => {
    setAdminToken(loginData.access_token);
    setCurrentView('admin-dashboard');
    setSuccess('تم تسجيل الدخول بنجاح!');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken(null);
    setCurrentView('public');
    setSuccess('تم تسجيل الخروج بنجاح!');
  };

  // التحقق من المسار الحالي للتوجيه للأدمن
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path.startsWith('/admin')) {
      if (adminToken) {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('admin-login');
      }
    }
  }, [adminToken]);

  return (
    <div className="App">
      {/* تنبيهات عامة */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <ErrorAlert message={error} onClose={() => setError('')} />
        </div>
      )}
      
      {success && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <SuccessAlert message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      {/* المحتوى الرئيسي */}
      {currentView === 'public' && (
        <PublicHomePage 
          siteContent={siteContent}
          onStageClick={handleStageClick}
          onNavigate={handleNavigate}
          onSubscribe={handleSubscription}
          onStudentSelect={handleStudentSelect}
        />
      )}

      {currentView === 'analytics' && (
        <AnalyticsPage 
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'faq' && (
        <FAQPage 
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'guides' && (
        <GuidesPage 
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'calculator' && (
        <CalculatorPage 
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'news' && (
        <NewsPage 
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'stage-inquiry' && selectedStage && (
        <StageInquiryPage 
          stage={selectedStage}
          onBack={handleBackToPublic}
          onStudentSelect={handleStudentSelect}
          onSchoolClick={handleSchoolClick}
          onAdministrationClick={handleAdministrationClick}
        />
      )}

      {currentView === 'student-details' && selectedStudent && (
        <StudentDetails 
          student={selectedStudent}
          onBack={handleBackToPublic}
        />
      )}

      {currentView === 'school-results' && schoolResults && (
        <SchoolResultsPage
          students={schoolResults}
          schoolName={currentSchoolName}
          onBack={handleBackToPublic}
          onStudentSelect={handleStudentSelect}
        />
      )}

      {currentView === 'administration-results' && administrationResults && (
        <AdministrationResultsPage
          students={administrationResults}
          administrationName={currentAdministrationName}
          onBack={handleBackToPublic}
          onStudentSelect={handleStudentSelect}
        />
      )}

      {currentView === 'admin-login' && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}

      {currentView === 'admin-dashboard' && adminToken && (
        <AdminDashboard 
          adminToken={adminToken}
          onLogout={handleAdminLogout}
        />
      )}
    </div>
  );
};

// مكون عرض نتائج البحث
const SearchResultsModal = ({ results, onClose, searchQuery, selectedStage, selectedRegion, onStudentSelect }) => {
  const handleStudentClick = (student) => {
    // إغلاق modal وفتح صفحة تفاصيل الطالب
    onClose();
    onStudentSelect(student);
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'ممتاز': return 'text-green-600 bg-green-100';
      case 'جيد جداً': return 'text-blue-600 bg-blue-100';
      case 'جيد': return 'text-yellow-600 bg-yellow-100';
      case 'مقبول': return 'text-orange-600 bg-orange-100';
      case 'ضعيف': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🔍 نتائج البحث</h2>
              <p className="text-blue-100 mt-1">
                {results.length} نتيجة للبحث عن "{searchQuery}"
                {selectedStage && <span> في مرحلة معينة</span>}
                {selectedRegion && <span> - {selectedRegion}</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((student, index) => (
                <div
                  key={student.id || student.student_id || index}
                  onClick={() => handleStudentClick(student)}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-white">👤</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{student.name}</h3>
                    <p className="text-gray-600">رقم الجلوس: {student.student_id}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المدرسة:</span>
                      <span className="font-medium text-gray-900">{student.school_name || student.school || 'غير محدد'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المرحلة:</span>
                      <span className="font-medium text-gray-900">{student.educational_stage || student.stage || 'غير محدد'}</span>
                    </div>

                    {student.region && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">المحافظة:</span>
                        <span className="font-medium text-gray-900">{student.region}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">المتوسط العام:</span>
                        <span className="text-2xl font-bold text-blue-600">{student.average}%</span>
                      </div>
                      
                      <div className="flex justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${getGradeColor(student.grade)}`}>
                          {student.grade}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudentClick(student);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                    >
                      عرض التفاصيل الكاملة
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {results.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-600 mb-4">جرب البحث بكلمات مختلفة أو تأكد من صحة البيانات</p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>💡 انقر على أي نتيجة لعرض التفاصيل الكاملة</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون تفاصيل الطالب
const StudentDetailsModal = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">📋 تفاصيل الطالب</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Student Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">🎓</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h3>
            <p className="text-gray-600 text-lg">رقم الجلوس: {student.student_id}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">{student.average}%</div>
              <p className="text-gray-600">المتوسط العام</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600 mb-2">{student.grade}</div>
              <p className="text-gray-600">التقدير</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 mb-2">{student.subjects?.length || 0}</div>
              <p className="text-gray-600">عدد المواد</p>
            </div>
          </div>

          {/* Subjects */}
          {student.subjects && student.subjects.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-gray-900 mb-4">📚 درجات المواد</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.subjects.map((subject, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-bold text-gray-900">{subject.name}</h5>
                      <span className="text-lg font-bold text-blue-600">
                        {subject.score}/{subject.max_score}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{subject.percentage}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* School Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">🏫 معلومات إضافية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">المدرسة:</span>
                <span className="font-medium text-gray-900 mr-2">{student.school}</span>
              </div>
              <div>
                <span className="text-gray-600">المرحلة التعليمية:</span>
                <span className="font-medium text-gray-900 mr-2">{student.educational_stage}</span>
              </div>
              {student.region && (
                <div>
                  <span className="text-gray-600">المحافظة:</span>
                  <span className="font-medium text-gray-900 mr-2">{student.region}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              إغلاق التفاصيل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;