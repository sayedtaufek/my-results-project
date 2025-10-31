import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvancedEditor from './AdvancedEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة الأدلة التعليمية
const GuidesManagement = ({ adminToken }) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'نصائح الطلاب',
    stage_id: '',
    tags: [],
    order: 0,
    is_featured: false,
    is_active: true
  });
  const [educationalStages, setEducationalStages] = useState([]);
  const [categories, setCategories] = useState(['نصائح الطلاب', 'أولياء الأمور', 'التقديرات', 'الامتحانات', 'النتائج']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchGuides();
    fetchEducationalStages();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await axios.get(`${API}/guides`);
      setGuides(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأدلة التعليمية:', error);
      alert('خطأ في جلب الأدلة التعليمية');
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
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('يرجى إدخال العنوان والمحتوى');
      return;
    }

    try {
      const submitData = {
        ...formData,
        stage_id: formData.stage_id || null
      };

      if (editingGuide) {
        await axios.put(`${API}/admin/guides/${editingGuide.id}`, submitData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم تحديث الدليل بنجاح!');
      } else {
        await axios.post(`${API}/admin/guides`, submitData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم إنشاء الدليل بنجاح!');
      }
      
      resetForm();
      fetchGuides();
    } catch (error) {
      console.error('خطأ في حفظ الدليل:', error);
      alert('حدث خطأ في حفظ الدليل');
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      content: guide.content,
      category: guide.category,
      stage_id: guide.stage_id || '',
      tags: guide.tags || [],
      order: guide.order,
      is_featured: guide.is_featured,
      is_active: guide.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (guideId, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف الدليل: "${title}"؟`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/guides/${guideId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف الدليل بنجاح!');
      fetchGuides();
    } catch (error) {
      console.error('خطأ في حذف الدليل:', error);
      alert('حدث خطأ في حذف الدليل');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'نصائح الطلاب',
      stage_id: '',
      tags: [],
      order: 0,
      is_featured: false,
      is_active: true
    });
    setEditingGuide(null);
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

  // تصفية الأدلة
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
          <h2 className="text-3xl font-bold text-gray-900">📚 إدارة الأدلة التعليمية</h2>
          <p className="text-gray-600 mt-2">أنشئ وعدل الأدلة التعليمية للطلاب وأولياء الأمور</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ إضافة دليل جديد
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الأدلة</p>
              <p className="text-3xl font-bold text-gray-900">{guides.length}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الأدلة المميزة</p>
              <p className="text-3xl font-bold text-gray-900">{guides.filter(g => g.is_featured).length}</p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">التصنيفات</p>
              <p className="text-3xl font-bold text-gray-900">{[...new Set(guides.map(g => g.category))].length}</p>
            </div>
            <div className="text-4xl">📂</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المشاهدات</p>
              <p className="text-3xl font-bold text-gray-900">{guides.reduce((sum, g) => sum + g.views_count, 0)}</p>
            </div>
            <div className="text-4xl">👁️</div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث في الأدلة</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في العناوين والمحتوى والكلمات المفتاحية..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تصفية حسب التصنيف</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تحرير دليل */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingGuide ? '✏️ تحرير الدليل' : '➕ إضافة دليل جديد'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة التعليمية (اختياري)</label>
                  <select
                    value={formData.stage_id}
                    onChange={(e) => setFormData({...formData, stage_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">جميع المراحل</option>
                    {educationalStages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    min="0"
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
                  placeholder="اكتب عنوان الدليل هنا..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                  required
                />
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-green-600"
                      >
                        ✕
                      </button>
                    </span>
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
                  description=""
                  onDescriptionChange={() => {}}
                  tags={formData.tags}
                  onTagsChange={(tags) => setFormData({...formData, tags})}
                  showSeoAnalyzer={true}
                />
              </div>

              {/* خيارات إضافية */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">
                    ⭐ دليل مميز (سيظهر في المقدمة)
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    ✅ نشط (سيظهر للمستخدمين)
                  </label>
                </div>
              </div>

              {/* أزرار الحفظ */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                >
                  {editingGuide ? '💾 حفظ التغييرات' : '➕ إضافة الدليل'}
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

      {/* قائمة الأدلة */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">قائمة الأدلة ({filteredGuides.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredGuides.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد أدلة</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory ? 'لم يتم العثور على أدلة تطابق البحث' : 'ابدأ بإضافة أول دليل تعليمي'}
              </p>
              {!searchQuery && !selectedCategory && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  ➕ إضافة دليل جديد
                </button>
              )}
            </div>
          ) : (
            filteredGuides.map((guide) => (
              <div key={guide.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {guide.is_featured && (
                        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          ⭐ مميز
                        </span>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        guide.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {guide.is_active ? '✅ نشط' : '⏸️ معطل'}
                      </span>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {guide.category}
                      </span>
                      <span className="text-xs text-gray-500">👁️ {guide.views_count} مشاهدة</span>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {guide.title}
                    </h4>
                    
                    <p className="text-gray-600 line-clamp-2 leading-relaxed mb-3">
                      {guide.content.replace(/[*#`]/g, '').substring(0, 200)}...
                    </p>
                    
                    {guide.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {guide.tags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {guide.tags.length > 5 && (
                          <span className="text-xs text-gray-500">+{guide.tags.length - 5} أخرى</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(guide.created_at).toLocaleDateString('ar-SA')}</span>
                      {guide.updated_at !== guide.created_at && (
                        <span>✏️ محدث: {new Date(guide.updated_at).toLocaleDateString('ar-SA')}</span>
                      )}
                      <span>📊 ترتيب: {guide.order}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => handleEdit(guide)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      ✏️ تحرير
                    </button>
                    <button
                      onClick={() => handleDelete(guide.id, guide.title)}
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

export default GuidesManagement;