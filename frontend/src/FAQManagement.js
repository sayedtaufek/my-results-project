import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdvancedEditor from './AdvancedEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة الأسئلة الشائعة
const FAQManagement = ({ adminToken }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'عام',
    order: 0,
    is_active: true
  });
  const [categories, setCategories] = useState(['عام', 'الاستعلام', 'التقديرات', 'الشهادات', 'المشاركة', 'الطباعة والحفظ']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await axios.get(`${API}/faq`);
      setFaqs(response.data);
    } catch (error) {
      console.error('خطأ في جلب الأسئلة الشائعة:', error);
      alert('خطأ في جلب الأسئلة الشائعة');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('يرجى إدخال السؤال والإجابة');
      return;
    }

    try {
      if (editingFaq) {
        await axios.put(`${API}/admin/faq/${editingFaq.id}`, formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم تحديث السؤال بنجاح!');
      } else {
        await axios.post(`${API}/admin/faq`, formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        alert('تم إنشاء السؤال بنجاح!');
      }
      
      resetForm();
      fetchFAQs();
    } catch (error) {
      console.error('خطأ في حفظ السؤال:', error);
      alert('حدث خطأ في حفظ السؤال');
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      is_active: faq.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (faqId, question) => {
    if (!window.confirm(`هل أنت متأكد من حذف السؤال: "${question}"؟`)) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/faq/${faqId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف السؤال بنجاح!');
      fetchFAQs();
    } catch (error) {
      console.error('خطأ في حذف السؤال:', error);
      alert('حدث خطأ في حذف السؤال');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'عام',
      order: 0,
      is_active: true
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  // تصفية الأسئلة
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
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
          <h2 className="text-3xl font-bold text-gray-900">❓ إدارة الأسئلة الشائعة</h2>
          <p className="text-gray-600 mt-2">أضف وعدل الأسئلة الشائعة للمستخدمين</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ إضافة سؤال جديد
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الأسئلة</p>
              <p className="text-3xl font-bold text-gray-900">{faqs.length}</p>
            </div>
            <div className="text-4xl">❓</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الأسئلة النشطة</p>
              <p className="text-3xl font-bold text-gray-900">{faqs.filter(f => f.is_active).length}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">التصنيفات</p>
              <p className="text-3xl font-bold text-gray-900">{[...new Set(faqs.map(f => f.category))].length}</p>
            </div>
            <div className="text-4xl">📂</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">آخر تحديث</p>
              <p className="text-sm font-bold text-gray-900">اليوم</p>
            </div>
            <div className="text-4xl">🕒</div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث في الأسئلة</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأسئلة والأجوبة..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تصفية حسب التصنيف</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* نموذج إضافة/تحرير سؤال */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFaq ? '✏️ تحرير السؤال' : '➕ إضافة سؤال جديد'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    min="0"
                  />
                </div>
              </div>

              {/* السؤال */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السؤال *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  placeholder="اكتب السؤال هنا..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  required
                />
              </div>

              {/* الإجابة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الإجابة *</label>
                <AdvancedEditor
                  content={formData.answer}
                  onChange={(content) => setFormData({...formData, answer: content})}
                  title={formData.question}
                  onTitleChange={() => {}}
                  description=""
                  onDescriptionChange={() => {}}
                  tags={[]}
                  onTagsChange={() => {}}
                  showSeoAnalyzer={false}
                />
              </div>

              {/* حالة السؤال */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  نشط (سيظهر للمستخدمين)
                </label>
              </div>

              {/* أزرار الحفظ */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium"
                >
                  {editingFaq ? '💾 حفظ التغييرات' : '➕ إضافة السؤال'}
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

      {/* قائمة الأسئلة */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">قائمة الأسئلة ({filteredFaqs.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد أسئلة</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedCategory ? 'لم يتم العثور على أسئلة تطابق البحث' : 'ابدأ بإضافة أول سؤال شائع'}
              </p>
              {!searchQuery && !selectedCategory && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  ➕ إضافة سؤال جديد
                </button>
              )}
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <div key={faq.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        faq.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {faq.is_active ? '✅ نشط' : '⏸️ معطل'}
                      </span>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {faq.category}
                      </span>
                      <span className="text-xs text-gray-500">ترتيب: {faq.order}</span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                      {faq.question}
                    </h4>
                    
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                      {faq.answer.replace(/[*#`]/g, '').substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>📅 {new Date(faq.created_at).toLocaleDateString('ar-SA')}</span>
                      {faq.updated_at !== faq.created_at && (
                        <span>✏️ محدث: {new Date(faq.updated_at).toLocaleDateString('ar-SA')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      ✏️ تحرير
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id, faq.question)}
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

export default FAQManagement;