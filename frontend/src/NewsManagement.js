import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvancedEditor from './AdvancedEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة الأخبار والمقالات
const NewsManagement = ({ adminToken }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    featured_image: '',
    tags: [],
    stage_ids: [],
    is_published: false,
    is_featured: false,
    author: 'الإدارة'
  });
  const [educationalStages, setEducationalStages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // all, published, draft
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchArticles();
    fetchEducationalStages();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/news`);
      setArticles(response.data);
    } catch (error) {
      console.error('خطأ في جلب المقالات:', error);
      alert('خطأ في جلب المقالات');
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationalStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`);
      setEducationalStages(response.data);
    } catch (error) {
      console.error('خطأ في جلب المراحل التعليمية:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.summary.trim()) {
      alert('يرجى إدخال العنوان والمحتوى والملخص');
      return;
    }

    try {
      const submitData = {
        ...formData,
        published_at: formData.is_published ? new Date().toISOString() : null
      };

      if (editingArticle) {
        await axios.put(`${API}/admin/news/${editingArticle.id}`, submitData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم تحديث المقال بنجاح!');
      } else {
        await axios.post(`${API}/admin/news`, submitData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم إنشاء المقال بنجاح!');
      }
      
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('خطأ في حفظ المقال:', error);
      alert('حدث خطأ في حفظ المقال');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary,
      featured_image: article.featured_image || '',
      tags: article.tags || [],
      stage_ids: article.stage_ids || [],
      is_published: article.is_published,
      is_featured: article.is_featured,
      author: article.author
    });
    setShowForm(true);
  };

  const handleDelete = async (articleId, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف المقال: "${title}"؟`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/news/${articleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف المقال بنجاح!');
      fetchArticles();
    } catch (error) {
      console.error('خطأ في حذف المقال:', error);
      alert('حدث خطأ في حذف المقال');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      featured_image: '',
      tags: [],
      stage_ids: [],
      is_published: false,
      is_featured: false,
      author: 'الإدارة'
    });
    setEditingArticle(null);
    setShowForm(false);
    setNewTag('');
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (formData.tags.includes(newTag.trim())) return;
    
    setFormData({
      ...formData,
      tags: [...formData.tags, newTag.trim()]
    });
    setNewTag('');
  };

  const removeTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({...formData, tags: newTags});
  };

  const toggleStage = (stageId) => {
    const newStageIds = formData.stage_ids.includes(stageId)
      ? formData.stage_ids.filter(id => id !== stageId)
      : [...formData.stage_ids, stageId];
    
    setFormData({...formData, stage_ids: newStageIds});
  };

  // تصفية المقالات
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === '' || 
                         (filterStatus === 'published' && article.is_published) ||
                         (filterStatus === 'draft' && !article.is_published);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📰 إدارة الأخبار والمقالات</h2>
          <p className="text-gray-600 mt-2">أنشئ وانشر الأخبار والمقالات التعليمية</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ إضافة مقال جديد
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المقالات</p>
              <p className="text-3xl font-bold text-gray-900">{articles.length}</p>
            </div>
            <div className="text-4xl">📰</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المنشورة</p>
              <p className="text-3xl font-bold text-gray-900">{articles.filter(a => a.is_published).length}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المميزة</p>
              <p className="text-3xl font-bold text-gray-900">{articles.filter(a => a.is_featured).length}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المسودات</p>
              <p className="text-3xl font-bold text-gray-900">{articles.filter(a => !a.is_published).length}</p>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث في المقالات</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في العناوين والمحتوى والكلمات المفتاحية..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تصفية حسب الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المقالات</option>
              <option value="published">المنشورة فقط</option>
              <option value="draft">المسودات فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تحرير مقال */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingArticle ? '✏️ تحرير المقال' : '➕ إضافة مقال جديد'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكاتب</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    placeholder="اسم الكاتب"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط الصورة المميزة</label>
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>
              </div>

              {/* العنوان */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="اكتب عنوان المقال هنا..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  required
                />
              </div>

              {/* الملخص */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الملخص *</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({...formData, summary: e.target.value})}
                  placeholder="اكتب ملخصاً مختصراً للمقال (120-160 حرف للسيو)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right h-24 resize-none"
                  maxLength="200"
                  required
                />
                <div className="text-sm text-gray-500 text-left mt-1">
                  {formData.summary.length}/200 حرف
                </div>
              </div>

              {/* الكلمات المفتاحية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكلمات المفتاحية</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="أضف كلمة مفتاحية..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-blue-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* المراحل التعليمية المرتبطة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المراحل التعليمية المرتبطة</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {educationalStages.map(stage => (
                    <label key={stage.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.stage_ids.includes(stage.id)}
                        onChange={() => toggleStage(stage.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-2xl">{stage.icon}</span>
                      <span className="text-sm font-medium">{stage.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* المحتوى مع محرر متقدم */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحتوى *</label>
                <AdvancedEditor
                  content={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  title={formData.title}
                  onTitleChange={(title) => setFormData({...formData, title})}
                  description={formData.summary}
                  onDescriptionChange={(summary) => setFormData({...formData, summary})}
                  tags={formData.tags}
                  onTagsChange={(tags) => setFormData({...formData, tags})}
                  showSeoAnalyzer={true}
                />
              </div>

              {/* خيارات النشر */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    ✅ نشر المقال (سيظهر للمستخدمين)
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                    ⭐ مقال مميز (سيظهر في المقدمة)
                  </label>
                </div>
              </div>

              {/* أزرار الحفظ */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                >
                  {editingArticle ? '💾 حفظ التغييرات' : '➕ إضافة المقال'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  ❌ إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* قائمة المقالات */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">قائمة المقالات ({filteredArticles.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد مقالات</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus ? 'لم يتم العثور على مقالات تطابق البحث' : 'ابدأ بإضافة أول مقال إخباري'}
              </p>
              {!searchQuery && !filterStatus && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  ➕ إضافة مقال جديد
                </button>
              )}
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {article.is_featured && (
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          ⭐ مميز
                        </span>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        article.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {article.is_published ? '✅ منشور' : '📝 مسودة'}
                      </span>
                      <span className="text-xs text-gray-500">👁️ {article.views_count} مشاهدة</span>
                      <span className="text-xs text-gray-500">✍️ {article.author}</span>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {article.title}
                    </h4>
                    
                    <p className="text-gray-600 line-clamp-2 leading-relaxed mb-3">
                      {article.summary}
                    </p>
                    
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 5 && (
                          <span className="text-xs text-gray-500">+{article.tags.length - 5} أخرى</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(article.created_at).toLocaleDateString('ar-SA')}</span>
                      {article.published_at && (
                        <span>🚀 نُشر: {new Date(article.published_at).toLocaleDateString('ar-SA')}</span>
                      )}
                      {article.updated_at !== article.created_at && (
                        <span>✏️ محدث: {new Date(article.updated_at).toLocaleDateString('ar-SA')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => handleEdit(article)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      ✏️ تحرير
                    </button>
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;