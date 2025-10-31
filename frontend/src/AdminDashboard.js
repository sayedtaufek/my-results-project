import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FAQManagement from './FAQManagement';
import GuidesManagement from './GuidesManagement';
import NewsManagement from './NewsManagement';
import AnalyticsManagement from './AnalyticsManagement';
import NotificationManagement from './NotificationManagement';
import HomepageBuilder from './HomepageBuilder';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// CSS إضافي لإصلاح مشكلة النصوص
const inputFixStyle = {
  color: '#1f2937 !important',
  backgroundColor: 'white !important',
  WebkitTextFillColor: '#1f2937 !important',
  direction: 'rtl',
  textAlign: 'right'
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

// مكون الشريط الجانبي
const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: '🏠' },
    { id: 'homepage', name: 'مطور الصفحة الرئيسية', icon: '🎨' },
    { id: 'stages', name: 'إدارة المراحل', icon: '🎓' },
    { id: 'schools', name: 'نتائج المدارس', icon: '🏫' },
    { id: 'upload', name: 'رفع البيانات', icon: '📊' },
    { id: 'certificates', name: 'قوالب الشهادات', icon: '🏆' },
    { id: 'content', name: 'إدارة المحتوى', icon: '📝' },
    { id: 'faq', name: 'الأسئلة الشائعة', icon: '❓' },
    { id: 'guides', name: 'الأدلة التعليمية', icon: '📚' },
    { id: 'news', name: 'الأخبار والمقالات', icon: '📰' },
    { id: 'notifications', name: 'إدارة الإشعارات', icon: '🔔' },
    { id: 'analytics', name: 'التحليلات المتقدمة', icon: '📊' },
    { id: 'settings', name: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 h-full">
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mr-3">لوحة الإدارة</h2>
      </div>

      <nav className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl ml-3">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <span className="text-2xl ml-3">🚪</span>
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
};

// مكون لوحة التحكم الرئيسية
const DashboardTab = ({ stats, recentStudents }) => {
  return (
    <div className="space-y-8">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي الطلاب</p>
              <p className="text-3xl font-bold">{stats?.total_students || 0}</p>
            </div>
            <div className="text-4xl opacity-80">👥</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">أعلى درجة</p>
              <p className="text-3xl font-bold">{stats?.highest_score || 0}</p>
            </div>
            <div className="text-4xl opacity-80">🏆</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">المتوسط العام</p>
              <p className="text-3xl font-bold">{stats?.average_score || 0}%</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">أقل درجة</p>
              <p className="text-3xl font-bold">{stats?.lowest_score || 0}</p>
            </div>
            <div className="text-4xl opacity-80">📉</div>
          </div>
        </div>
      </div>

      {/* الطلاب الحديثين */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">آخر الطلاب المضافين</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-4 font-semibold text-gray-700">الاسم</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">رقم الجلوس</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">المتوسط</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">التقدير</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents?.map((student, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                  <td className="py-3 px-4 text-gray-600">{student.student_id}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${
                      student.average >= 90 ? 'text-green-600' :
                      student.average >= 80 ? 'text-blue-600' :
                      student.average >= 70 ? 'text-yellow-600' :
                      student.average >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {student.average}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.grade === 'ممتاز' ? 'bg-green-100 text-green-800' :
                      student.grade === 'جيد جداً' ? 'bg-blue-100 text-blue-800' :
                      student.grade === 'جيد' ? 'bg-yellow-100 text-yellow-800' :
                      student.grade === 'مقبول' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(student.created_at).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* رسم بياني بسيط */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">توزيع التقديرات</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { grade: 'ممتاز', count: 12, color: 'bg-green-500', percentage: 30 },
            { grade: 'جيد جداً', count: 15, color: 'bg-blue-500', percentage: 38 },
            { grade: 'جيد', count: 8, color: 'bg-yellow-500', percentage: 20 },
            { grade: 'مقبول', count: 3, color: 'bg-orange-500', percentage: 8 },
            { grade: 'ضعيف', count: 2, color: 'bg-red-500', percentage: 4 }
          ].map((item) => (
            <div key={item.grade} className="text-center">
              <div className={`${item.color} rounded-xl p-4 text-white mb-3`}>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm opacity-80">{item.grade}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${item.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// مكون إدارة الطلاب
const StudentsTab = ({ adminToken }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const studentsPerPage = 10;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          skip: currentPage * studentsPerPage,
          limit: studentsPerPage
        }
      });
      
      setStudents(response.data.students);
      setTotalStudents(response.data.total);
    } catch (error) {
      console.error('خطأ في جلب الطلاب:', error);
    } finally {
      setLoading(false);
    }
  }, [adminToken, currentPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`${API}/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      fetchStudents();
      setShowDeleteModal(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error('خطأ في حذف الطالب:', error);
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!window.confirm('هل أنت متأكد من حذف جميع الطلاب؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      fetchStudents();
    } catch (error) {
      console.error('خطأ في حذف جميع الطلاب:', error);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.includes(searchQuery) || student.student_id.includes(searchQuery)
  );

  const totalPages = Math.ceil(totalStudents / studentsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h2>
          <button
            onClick={handleDeleteAllStudents}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            حذف جميع الطلاب
          </button>
        </div>

        {/* البحث */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث عن طالب..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-right"
          />
        </div>

        {/* جدول الطلاب */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الاسم</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">رقم الجلوس</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الفصل</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">المتوسط</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">التقدير</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">عدد المواد</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                      <td className="py-3 px-4 text-gray-600">{student.student_id}</td>
                      <td className="py-3 px-4 text-gray-600">{student.class_name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${
                          student.average >= 90 ? 'text-green-600' :
                          student.average >= 80 ? 'text-blue-600' :
                          student.average >= 70 ? 'text-yellow-600' :
                          student.average >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {student.average}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.grade === 'ممتاز' ? 'bg-green-100 text-green-800' :
                          student.grade === 'جيد جداً' ? 'bg-blue-100 text-blue-800' :
                          student.grade === 'جيد' ? 'bg-yellow-100 text-yellow-800' :
                          student.grade === 'مقبول' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {student.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.subjects?.length || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-reverse space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  السابق
                </button>
                
                <span className="px-4 py-2 text-gray-600">
                  صفحة {currentPage + 1} من {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal حذف الطالب */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من حذف الطالب <strong>{selectedStudent.name}</strong>؟
              <br />
              رقم الجلوس: {selectedStudent.student_id}
            </p>
            <div className="flex justify-end space-x-reverse space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteStudent(selectedStudent.student_id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون إدارة المحتوى
const ContentTab = ({ adminToken, onSuccess }) => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/admin/content`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setContent(response.data);
    } catch (error) {
      console.error('خطأ في جلب المحتوى:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API}/admin/content`, content, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حفظ المحتوى بنجاح!');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('خطأ في حفظ المحتوى:', error);
      alert('حدث خطأ في حفظ المحتوى');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  };

  const addFeature = () => {
    setContent({
      ...content,
      features: [...content.features, { title: '', description: '', icon: '⭐' }]
    });
  };

  const removeFeature = (index) => {
    const newFeatures = content.features.filter((_, i) => i !== index);
    setContent({ ...content, features: newFeatures });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">إدارة محتوى الموقع</h2>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200"
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>

        {content && (
          <div className="space-y-8">
            {/* معلومات SEO الأساسية */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔍 إعدادات محركات البحث (SEO)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الصفحة</label>
                  <input
                    type="text"
                    value={content.page_title}
                    onChange={(e) => setContent({ ...content, page_title: e.target.value })}
                    style={inputFixStyle}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="عنوان الصفحة الرئيسية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الكلمات المفتاحية</label>
                  <input
                    type="text"
                    value={content.seo_keywords}
                    onChange={(e) => setContent({ ...content, seo_keywords: e.target.value })}
                    style={inputFixStyle}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="كلمات مفتاحية مفصولة بفواصل"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف الصفحة (Meta Description)</label>
                <textarea
                  value={content.meta_description}
                  onChange={(e) => setContent({ ...content, meta_description: e.target.value })}
                  rows={3}
                  style={inputFixStyle}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="وصف مختصر عن الموقع لمحركات البحث"
                />
              </div>
            </div>

            {/* محتوى القسم الرئيسي */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 المحتوى الرئيسي</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الرئيسي</label>
                  <input
                    type="text"
                    value={content.hero_title}
                    onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="العنوان الرئيسي للصفحة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الفرعي</label>
                  <textarea
                    value={content.hero_subtitle}
                    onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="العنوان الفرعي التوضيحي"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نبذة عن النظام</label>
                  <textarea
                    value={content.about_section}
                    onChange={(e) => setContent({ ...content, about_section: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    placeholder="وصف مفصل عن النظام ومميزاته"
                  />
                </div>
              </div>
            </div>

            {/* مميزات النظام */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">⭐ مميزات النظام</h3>
                <button
                  onClick={addFeature}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                >
                  إضافة ميزة
                </button>
              </div>
              <div className="space-y-4">
                {content.features?.map((feature, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">الميزة {index + 1}</h4>
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">أيقونة</label>
                        <input
                          type="text"
                          value={feature.icon}
                          onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                          placeholder="🔍"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">العنوان</label>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                          placeholder="عنوان الميزة"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">الوصف</label>
                        <input
                          type="text"
                          value={feature.description}
                          onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                          placeholder="وصف الميزة"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📞 معلومات الاتصال</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={content.contact_info?.phone || ''}
                    onChange={(e) => setContent({
                      ...content,
                      contact_info: { ...content.contact_info, phone: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={content.contact_info?.email || ''}
                    onChange={(e) => setContent({
                      ...content,
                      contact_info: { ...content.contact_info, email: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={content.contact_info?.address || ''}
                    onChange={(e) => setContent({
                      ...content,
                      contact_info: { ...content.contact_info, address: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                    placeholder="العنوان"
                  />
                </div>
              </div>
            </div>

            {/* الروابط الاجتماعية */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🌐 الروابط الاجتماعية</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تويتر</label>
                  <input
                    type="url"
                    value={content.social_links?.twitter || ''}
                    onChange={(e) => setContent({
                      ...content,
                      social_links: { ...content.social_links, twitter: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                    placeholder="رابط تويتر"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">فيسبوك</label>
                  <input
                    type="url"
                    value={content.social_links?.facebook || ''}
                    onChange={(e) => setContent({
                      ...content,
                      social_links: { ...content.social_links, facebook: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                    placeholder="رابط فيسبوك"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إنستغرام</label>
                  <input
                    type="url"
                    value={content.social_links?.instagram || ''}
                    onChange={(e) => setContent({
                      ...content,
                      social_links: { ...content.social_links, instagram: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                    placeholder="رابط إنستغرام"
                  />
                </div>
              </div>
            </div>

            {/* نص التذييل */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📝 نص التذييل</h3>
              <textarea
                value={content.footer_text}
                onChange={(e) => setContent({ ...content, footer_text: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-right"
                placeholder="نص حقوق النشر والطبع"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون التقارير والإحصائيات
const ReportsTab = ({ adminToken }) => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [reportType, setReportType] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [classFilter, setClassFilter] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, classFilter]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // جلب الإحصائيات العامة
      const statsResponse = await axios.get(`${API}/stats`);
      setStats(statsResponse.data);

      // جلب بيانات الطلاب
      const studentsResponse = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { limit: 1000 }
      });
      setStudents(studentsResponse.data.students);

      // استخراج الفصول المتاحة
      const classes = [...new Set(studentsResponse.data.students
        .map(s => s.class_name)
        .filter(Boolean))];
      setAvailableClasses(classes);

    } catch (error) {
      console.error('خطأ في جلب بيانات التقارير:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['الاسم', 'رقم الجلوس', 'الفصل', 'المتوسط', 'التقدير', 'المجموع', 'عدد المواد'].join(','),
      ...students.map(student => [
        student.name,
        student.student_id,
        student.class_name || '',
        student.average,
        student.grade,
        student.total_score || '',
        student.subjects?.length || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGradeStats = () => {
    const gradeCount = students.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(gradeCount).map(([grade, count]) => ({
      grade,
      count,
      percentage: ((count / students.length) * 100).toFixed(1)
    }));
  };

  const getSubjectStats = () => {
    const subjectStats = {};
    
    students.forEach(student => {
      student.subjects?.forEach(subject => {
        if (!subjectStats[subject.name]) {
          subjectStats[subject.name] = {
            name: subject.name,
            totalScore: 0,
            count: 0,
            highest: subject.score,
            lowest: subject.score
          };
        }
        
        subjectStats[subject.name].totalScore += subject.score;
        subjectStats[subject.name].count += 1;
        subjectStats[subject.name].highest = Math.max(subjectStats[subject.name].highest, subject.score);
        subjectStats[subject.name].lowest = Math.min(subjectStats[subject.name].lowest, subject.score);
      });
    });

    return Object.values(subjectStats).map(subject => ({
      ...subject,
      average: (subject.totalScore / subject.count).toFixed(2)
    }));
  };

  const filteredStudents = students.filter(student => {
    if (classFilter && student.class_name !== classFilter) return false;
    return true;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📈 التقارير والإحصائيات</h2>
          <div className="flex space-x-reverse space-x-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">نظرة عامة</option>
              <option value="grades">تحليل التقديرات</option>
              <option value="subjects">تحليل المواد</option>
              <option value="classes">تحليل الفصول</option>
            </select>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              تصدير CSV
            </button>
          </div>
        </div>

        {/* فلاتر */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فلترة حسب الفصل</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الفصول</option>
                {availableClasses.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* المحتوى حسب نوع التقرير */}
        {reportType === 'overview' && (
          <div className="space-y-6">
            {/* الإحصائيات الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">إجمالي الطلاب</h3>
                <p className="text-3xl font-bold">{filteredStudents.length}</p>
                <p className="text-blue-100 text-sm">من أصل {students.length}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">معدل النجاح</h3>
                <p className="text-3xl font-bold">
                  {((filteredStudents.filter(s => s.average >= 60).length / filteredStudents.length) * 100).toFixed(1)}%
                </p>
                <p className="text-green-100 text-sm">{filteredStudents.filter(s => s.average >= 60).length} طالب</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">أعلى معدل</h3>
                <p className="text-3xl font-bold">
                  {Math.max(...filteredStudents.map(s => s.average))}%
                </p>
                <p className="text-yellow-100 text-sm">متفوق</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">المتوسط العام</h3>
                <p className="text-3xl font-bold">
                  {(filteredStudents.reduce((sum, s) => sum + s.average, 0) / filteredStudents.length).toFixed(1)}%
                </p>
                <p className="text-purple-100 text-sm">متوسط</p>
              </div>
            </div>

            {/* أفضل الطلاب */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 أفضل 10 طلاب</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-orange-200">
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">الترتيب</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">الاسم</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">رقم الجلوس</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">المعدل</th>
                      <th className="text-right py-2 px-4 font-semibold text-gray-700">التقدير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents
                      .sort((a, b) => b.average - a.average)
                      .slice(0, 10)
                      .map((student, index) => (
                        <tr key={student.student_id} className="border-b border-orange-100">
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-900' :
                              index === 2 ? 'bg-orange-300 text-orange-900' :
                              'bg-blue-100 text-blue-900'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-medium">{student.name}</td>
                          <td className="py-2 px-4">{student.student_id}</td>
                          <td className="py-2 px-4 font-bold text-green-600">{student.average}%</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              {student.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'grades' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* توزيع التقديرات */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">توزيع التقديرات</h3>
                <div className="space-y-3">
                  {getGradeStats().map((item, index) => (
                    <div key={item.grade} className="flex justify-between items-center">
                      <span className="font-medium">{item.grade}</span>
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'][index] || 'bg-gray-500'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12">{item.count}</span>
                        <span className="text-xs text-gray-500 w-10">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* إحصائيات المعدلات */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">إحصائيات المعدلات</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>أعلى معدل:</span>
                    <span className="font-bold text-green-600">
                      {Math.max(...filteredStudents.map(s => s.average))}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>أقل معدل:</span>
                    <span className="font-bold text-red-600">
                      {Math.min(...filteredStudents.map(s => s.average))}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المتوسط العام:</span>
                    <span className="font-bold text-blue-600">
                      {(filteredStudents.reduce((sum, s) => sum + s.average, 0) / filteredStudents.length).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الانحراف المعياري:</span>
                    <span className="font-bold text-purple-600">
                      {(() => {
                        const mean = filteredStudents.reduce((sum, s) => sum + s.average, 0) / filteredStudents.length;
                        const variance = filteredStudents.reduce((sum, s) => sum + Math.pow(s.average - mean, 2), 0) / filteredStudents.length;
                        return Math.sqrt(variance).toFixed(2);
                      })()}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'subjects' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">تحليل أداء المواد</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">المادة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">عدد الطلاب</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">المتوسط</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">أعلى درجة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">أقل درجة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">معدل النجاح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSubjectStats().map((subject, index) => (
                      <tr key={subject.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{subject.name}</td>
                        <td className="py-3 px-4">{subject.count}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{subject.average}%</td>
                        <td className="py-3 px-4 font-bold text-green-600">{subject.highest}</td>
                        <td className="py-3 px-4 font-bold text-red-600">{subject.lowest}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {((subject.totalScore / subject.count >= 60 ? 1 : 0) * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'classes' && availableClasses.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableClasses.map(className => {
                const classStudents = students.filter(s => s.class_name === className);
                const classAverage = classStudents.reduce((sum, s) => sum + s.average, 0) / classStudents.length;
                
                return (
                  <div key={className} className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{className}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>عدد الطلاب:</span>
                        <span className="font-bold">{classStudents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المتوسط العام:</span>
                        <span className="font-bold text-blue-600">{classAverage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>أعلى معدل:</span>
                        <span className="font-bold text-green-600">
                          {Math.max(...classStudents.map(s => s.average))}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>معدل النجاح:</span>
                        <span className="font-bold text-purple-600">
                          {((classStudents.filter(s => s.average >= 60).length / classStudents.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون إدارة المراحل التعليمية
const StagesTab = ({ adminToken }) => {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    icon: '🎓',
    color: '#3b82f6',
    regions: [],
    display_order: 0
  });
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/admin/stages`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStages(response.data);
    } catch (error) {
      console.error('خطأ في جلب المراحل:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // التحقق من صحة البيانات قبل الإرسال
      if (!formData.name.trim()) {
        alert('يرجى إدخال اسم المرحلة');
        setIsLoading(false);
        return;
      }
      
      if (!formData.name_en.trim()) {
        alert('يرجى إدخال الاسم الإنجليزي للمرحلة');
        setIsLoading(false);
        return;
      }

      console.log('إرسال بيانات المرحلة:', formData);
      console.log('وضع التحديث:', editingStage ? 'تحديث' : 'إنشاء جديد');
      
      if (editingStage) {
        // تحديث مرحلة موجودة
        console.log('معرف المرحلة للتحديث:', editingStage.id);
        const response = await axios.put(`${API}/admin/stages/${editingStage.id}`, formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('استجابة التحديث:', response.data);
        alert('تم تحديث المرحلة بنجاح!');
      } else {
        // إنشاء مرحلة جديدة
        const response = await axios.post(`${API}/admin/stages`, formData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('استجابة الإنشاء:', response.data);
        alert('تم إنشاء المرحلة بنجاح!');
      }
      
      resetForm();
      fetchStages();
    } catch (error) {
      console.error('خطأ مفصل في حفظ المرحلة:', error);
      console.error('استجابة الخطأ:', error.response);
      console.error('بيانات الخطأ:', error.response?.data);
      console.error('رسالة الخطأ:', error.message);
      
      let errorMessage = 'حدث خطأ غير متوقع في حفظ المرحلة';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status) {
        errorMessage = `خطأ في الخادم (${error.response.status}): ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert('حدث خطأ في حفظ المرحلة: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (stage) => {
    console.log('تحديد مرحلة للتحرير:', stage);
    setEditingStage(stage);
    const editData = {
      name: stage.name,
      name_en: stage.name_en,
      description: stage.description || '',
      icon: stage.icon || '🎓',
      color: stage.color || '#3b82f6',
      regions: stage.regions || [],
      display_order: stage.display_order || 0
    };
    console.log('بيانات التحرير المُحضرة:', editData);
    setFormData(editData);
    setShowForm(true);
  };

  const handleDelete = async (stageId, stageName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المرحلة "${stageName}"؟`)) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API}/admin/stages/${stageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف المرحلة بنجاح!');
      fetchStages();
    } catch (error) {
      console.error('خطأ في حذف المرحلة:', error);
      alert('خطأ في حذف المرحلة: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const addRegion = () => {
    if (newRegion.trim() && !formData.regions.includes(newRegion.trim())) {
      setFormData(prev => ({
        ...prev,
        regions: [...prev.regions, newRegion.trim()]
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (region) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      description: '',
      icon: '🎓',
      color: '#3b82f6',
      regions: [],
      display_order: 0
    });
    setEditingStage(null);
    setShowForm(false);
    setNewRegion('');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🎓 إدارة المراحل التعليمية</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {showForm ? 'إلغاء' : '+ إضافة مرحلة جديدة'}
          </button>
        </div>

        {/* نموذج إضافة/تعديل مرحلة */}
        {showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              {editingStage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المرحلة (بالعربية) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="الثانوية العامة"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المرحلة (بالإنجليزية) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="General Secondary Certificate"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الأيقونة</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    placeholder="🎓"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللون</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="وصف المرحلة التعليمية"
                />
              </div>

              {/* إدارة المحافظات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحافظات/المناطق</label>
                <div className="flex mb-3">
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="أضف محافظة جديدة"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
                  />
                  <button
                    type="button"
                    onClick={addRegion}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-l-lg"
                  >
                    إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.regions.map(region => (
                    <span
                      key={region}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {region}
                      <button
                        type="button"
                        onClick={() => removeRegion(region)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isLoading ? 'جاري الحفظ...' : (editingStage ? 'تحديث المرحلة' : 'إضافة المرحلة')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* قائمة المراحل */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map(stage => (
            <div key={stage.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stage.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-600">{stage.name_en}</p>
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                ></div>
              </div>

              {stage.description && (
                <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
              )}

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">المحافظات ({stage.regions?.length || 0})</p>
                <div className="flex flex-wrap gap-1">
                  {stage.regions?.slice(0, 3).map(region => (
                    <span key={region} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {region}
                    </span>
                  ))}
                  {stage.regions?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                      +{stage.regions.length - 3} أخرى
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span>الترتيب: {stage.display_order}</span>
                <span className={`px-2 py-1 rounded ${stage.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {stage.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(stage)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(stage.id, stage.name)}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {stages.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">لا توجد مراحل تعليمية مضافة</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              إضافة مرحلة جديدة
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون مشاركة النتائج
const ShareResultsTab = ({ adminToken }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('خطأ في جلب الطلاب:', error);
    }
  };

  const generateShareCard = async (studentId) => {
    setIsGenerating(true);
    try {
      const response = await axios.get(`${API}/student/${studentId}/share-card?theme=${selectedTheme}`);
      setShareData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('خطأ في إنشاء كارد المشاركة:', error);
      alert('خطأ في إنشاء كارد المشاركة: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToFacebook = () => {
    const text = `🎉 تهانينا للطالب/ة ${shareData.student.name}\n${shareData.student.rank_emoji} حصل/ت على ${shareData.student.average}% بتقدير ${shareData.student.grade}\nفي ${shareData.stage_name}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.share_url)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = `🎉 ${shareData.student.name} حصل على ${shareData.student.average}% ${shareData.student.rank_emoji} في ${shareData.stage_name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareData.share_url)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const text = `🎉 *تهانينا!*\n\nالطالب/ة: *${shareData.student.name}*\nرقم الجلوس: ${shareData.student.student_id}\n${shareData.student.rank_emoji} النتيجة: *${shareData.student.average}%*\nالتقدير: *${shareData.student.grade}*\nالمرحلة: ${shareData.stage_name}\n\nرابط النتيجة: ${shareData.share_url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToTelegram = () => {
    const text = `🎉 تهانينا للطالب/ة ${shareData.student.name}\n${shareData.student.rank_emoji} حصل/ت على ${shareData.student.average}% بتقدير ${shareData.student.grade}\nفي ${shareData.stage_name}\n${shareData.share_url}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareData.share_url)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareData.share_url).then(() => {
      alert('تم نسخ الرابط بنجاح!');
    }).catch(() => {
      alert('فشل في نسخ الرابط');
    });
  };

  const downloadShareCard = () => {
    // محاكاة تحميل الصورة - في التطبيق الحقيقي نحتاج canvas أو مكتبة أخرى
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // خلفية الكارد
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const theme = shareData.theme;
    gradient.addColorStop(0, theme.background.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#667eea');
    gradient.addColorStop(1, theme.background.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // النصوص
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.text_color;
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`🎉 تهانينا`, canvas.width/2, 120);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText(shareData.student.name, canvas.width/2, 200);
    
    ctx.font = '28px Arial';
    ctx.fillText(`رقم الجلوس: ${shareData.student.student_id}`, canvas.width/2, 250);
    
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = theme.accent;
    ctx.fillText(`${shareData.student.rank_emoji} ${shareData.student.average}%`, canvas.width/2, 350);
    
    ctx.font = '32px Arial';
    ctx.fillStyle = theme.text_color;
    ctx.fillText(`${shareData.student.grade}`, canvas.width/2, 400);
    
    ctx.font = '24px Arial';
    ctx.fillText(shareData.stage_name, canvas.width/2, 450);
    ctx.fillText(shareData.school_name, canvas.width/2, 480);

    // تحميل الصورة
    const link = document.createElement('a');
    link.download = `نتيجة_${shareData.student.name}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const themes = [
    { id: 'default', name: 'افتراضي', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'success', name: 'النجاح', preview: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { id: 'excellence', name: 'التفوق', preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { id: 'modern', name: 'عصري', preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 مشاركة النتائج عبر وسائل التواصل</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* قائمة الطلاب والثيمات */}
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر الثيم</label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedTheme === theme.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div 
                      className="w-full h-8 rounded mb-2"
                      style={{background: theme.preview}}
                    ></div>
                    <p className="text-sm font-medium">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredStudents.slice(0, 10).map(student => (
                <div
                  key={student.id}
                  className={`p-3 border border-gray-200 rounded-lg mb-2 cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{student.name}</h4>
                      <p className="text-xs text-gray-600">#{student.student_id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-600">{student.average}%</span>
                    </div>
                  </div>
                  {selectedStudent?.id === student.id && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateShareCard(student.student_id);
                        }}
                        disabled={isGenerating}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm"
                      >
                        {isGenerating ? 'جاري الإنشاء...' : 'إنشاء كارد المشاركة'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-gray-500">لا توجد نتائج للبحث</p>
              </div>
            )}
          </div>

          {/* معاينة كارد المشاركة */}
          <div>
            {showPreview && shareData ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">معاينة كارد المشاركة</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* تصميم كارد المشاركة */}
                <div 
                  className="p-8 text-center text-white relative overflow-hidden"
                  style={{
                    background: shareData.theme.background,
                    minHeight: '400px',
                    direction: 'rtl'
                  }}
                >
                  {/* محتوى الكارد */}
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold mb-2">تهانينا!</h1>
                    <h2 className="text-xl font-semibold mb-4" style={{color: shareData.theme.text_color}}>
                      {shareData.student.name}
                    </h2>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">{shareData.student.rank_emoji}</span>
                        <span className="text-3xl font-bold" style={{color: shareData.theme.accent}}>
                          {shareData.student.average}%
                        </span>
                      </div>
                      <p className="text-lg font-medium">{shareData.student.grade}</p>
                      <p className="text-sm opacity-90">رقم الجلوس: {shareData.student.student_id}</p>
                    </div>
                    <div className="text-sm opacity-80">
                      <p>{shareData.stage_name}</p>
                      <p>{shareData.school_name}</p>
                    </div>
                  </div>

                  {/* نماذج ديكوريةت */}
                  <div className="absolute top-4 right-4 text-6xl opacity-10">🎓</div>
                  <div className="absolute bottom-4 left-4 text-4xl opacity-10">⭐</div>
                </div>

                {/* أزرار المشاركة */}
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={shareToFacebook}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      📘 فيسبوك
                    </button>
                    <button
                      onClick={shareToTwitter}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium"
                    >
                      🐦 تويتر
                    </button>
                    <button
                      onClick={shareToWhatsApp}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      💬 واتساب
                    </button>
                    <button
                      onClick={shareToTelegram}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      ✈️ تلجرام
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={copyShareLink}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                    >
                      📋 نسخ الرابط
                    </button>
                    <button
                      onClick={downloadShareCard}
                      className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                    >
                      📥 تحميل صورة
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📱</div>
                  <p>اختر طالب وثيم وانقر على "إنشاء كارد المشاركة"</p>
                  <p className="text-sm mt-1">ستظهر معاينة الكارد هنا</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// مكون الإعدادات
const SettingsTab = ({ adminToken, currentUser }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'نظام الاستعلام الذكي عن النتائج',
      systemEmail: 'admin@system.com',
      timezone: 'Asia/Riyadh',
      language: 'ar',
      maintenanceMode: false,
      allowRegistration: false,
      maxFileSize: 10, // MB
      sessionTimeout: 1440 // minutes
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      forcePasswordChange: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      lastBackup: new Date().toISOString().split('T')[0]
    }
  });
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_superuser: false
  });
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // جلب الإعدادات الحالية من الخادم
    fetchSystemSettings();
    fetchAdmins();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const serverSettings = response.data;
      setSettings({
        general: {
          siteName: serverSettings.site_name || 'نظام الاستعلام الذكي عن النتائج',
          systemEmail: serverSettings.system_email || 'admin@system.com',
          timezone: serverSettings.timezone || 'Asia/Riyadh',
          language: serverSettings.language || 'ar',
          maintenanceMode: serverSettings.maintenance_mode || false,
          allowRegistration: serverSettings.allow_registration || false,
          maxFileSize: serverSettings.max_file_size || 10,
          sessionTimeout: serverSettings.session_timeout || 1440
        },
        security: {
          passwordMinLength: serverSettings.password_min_length || 8,
          requireSpecialChars: serverSettings.require_special_chars !== false,
          enableTwoFactor: serverSettings.enable_two_factor || false,
          maxLoginAttempts: serverSettings.max_login_attempts || 5,
          lockoutDuration: serverSettings.lockout_duration || 30,
          forcePasswordChange: serverSettings.force_password_change || false
        },
        backup: {
          autoBackup: serverSettings.auto_backup !== false,
          backupFrequency: serverSettings.backup_frequency || 'daily',
          retentionDays: serverSettings.retention_days || 30,
          lastBackup: serverSettings.last_backup ? new Date(serverSettings.last_backup).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      // الاحتفاظ بالإعدادات الافتراضية في حالة الخطأ
    }
  };

  const fetchAdmins = async () => {
    // محاكاة جلب قائمة المديرين
    setAdmins([
      {
        id: '1',
        username: 'admin',
        email: 'admin@system.com',
        is_superuser: true,
        is_active: true,
        created_at: '2024-01-01',
        last_login: '2024-01-15'
      },
      {
        id: '2',
        username: 'manager',
        email: 'manager@system.com',
        is_superuser: false,
        is_active: true,
        created_at: '2024-01-02',
        last_login: '2024-01-14'
      }
    ]);
  };

  const handleSaveSettings = async (section) => {
    setIsLoading(true);
    try {
      let updateData = {};
      
      if (section === 'general') {
        updateData = {
          site_name: settings.general.siteName,
          system_email: settings.general.systemEmail,
          timezone: settings.general.timezone,
          language: settings.general.language,
          maintenance_mode: settings.general.maintenanceMode,
          allow_registration: settings.general.allowRegistration,
          max_file_size: settings.general.maxFileSize,
          session_timeout: settings.general.sessionTimeout
        };
      } else if (section === 'security') {
        updateData = {
          password_min_length: settings.security.passwordMinLength,
          require_special_chars: settings.security.requireSpecialChars,
          enable_two_factor: settings.security.enableTwoFactor,
          max_login_attempts: settings.security.maxLoginAttempts,
          lockout_duration: settings.security.lockoutDuration,
          force_password_change: settings.security.forcePasswordChange
        };
      } else if (section === 'backup') {
        updateData = {
          auto_backup: settings.backup.autoBackup,
          backup_frequency: settings.backup.backupFrequency,
          retention_days: settings.backup.retentionDays
        };
      }
      
      const response = await axios.put(`${API}/admin/settings`, updateData, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // تحديث الإعدادات المحلية بالاستجابة من الخادم
      await fetchSystemSettings();
      
      alert(`تم حفظ إعدادات ${section === 'general' ? 'النظام العامة' : section === 'security' ? 'الأمان' : 'النسخ الاحتياطي'} بنجاح!`);
      
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('حدث خطأ في حفظ الإعدادات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }

    if (newAdmin.password.length < settings.security.passwordMinLength) {
      alert(`كلمة المرور يجب أن تكون ${settings.security.passwordMinLength} أحرف على الأقل`);
      return;
    }

    setIsLoading(true);
    try {
      // في التطبيق الحقيقي، ستنشئ مدير جديد في الخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAdminData = {
        id: Date.now().toString(),
        ...newAdmin,
        is_active: true,
        created_at: new Date().toISOString().split('T')[0],
        last_login: null
      };
      
      setAdmins([...admins, newAdminData]);
      setNewAdmin({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_superuser: false
      });
      
      alert('تم إنشاء المدير الجديد بنجاح!');
    } catch (error) {
      alert('حدث خطأ في إنشاء المدير');
    } finally {
      setIsLoading(false);
    }
  };

  const performBackup = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${API}/admin/settings/backup`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // تحديث الإعدادات لعرض وقت آخر نسخة احتياطية
      await fetchSystemSettings();
      
      alert('تم إنشاء النسخة الاحتياطية بنجاح!');
    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      alert('حدث خطأ في إنشاء النسخة الاحتياطية: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ إعدادات النظام</h2>
        
        {/* تبويبات الإعدادات */}
        <div className="flex space-x-reverse space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: 'general', name: 'عام', icon: '🔧' },
            { id: 'security', name: 'الأمان', icon: '🔒' },
            { id: 'admins', name: 'المديرين', icon: '👥' },
            { id: 'backup', name: 'النسخ الاحتياطي', icon: '💾' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeSection === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="ml-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* الإعدادات العامة */}
        {activeSection === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم النظام</label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, siteName: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني للنظام</label>
                <input
                  type="email"
                  value={settings.general.systemEmail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, systemEmail: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, timezone: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                  <option value="Asia/Dubai">دبي (GMT+4)</option>
                  <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                  <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حد رفع الملفات (MB)</label>
                <input
                  type="number"
                  value={settings.general.maxFileSize}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, maxFileSize: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">وضع الصيانة</h3>
                  <p className="text-sm text-gray-600">تعطيل الوصول للموقع مؤقتاً</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, maintenanceMode: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">السماح بالتسجيل</h3>
                  <p className="text-sm text-gray-600">السماح للمستخدمين الجدد بالتسجيل</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.general.allowRegistration}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, allowRegistration: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={() => handleSaveSettings('general')}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
            </button>
          </div>
        )}

        {/* إعدادات الأمان */}
        {activeSection === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى لطول كلمة المرور</label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى لمحاولات تسجيل الدخول</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">اشتراط الأحرف الخاصة</h3>
                  <p className="text-sm text-gray-600">يجب أن تحتوي كلمة المرور على أحرف خاصة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.requireSpecialChars}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, requireSpecialChars: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">تفعيل المصادقة الثنائية</h3>
                  <p className="text-sm text-gray-600">حماية إضافية لحسابات المديرين</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, enableTwoFactor: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={() => handleSaveSettings('security')}
              disabled={isLoading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان'}
            </button>
          </div>
        )}

        {/* إدارة المديرين */}
        {activeSection === 'admins' && (
          <div className="space-y-6">
            {/* إضافة مدير جديد */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">إضافة مدير جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <input
                  type="password"
                  placeholder="تأكيد كلمة المرور"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
              <div className="flex items-center mt-4 mb-4">
                <input
                  type="checkbox"
                  id="superuser"
                  checked={newAdmin.is_superuser}
                  onChange={(e) => setNewAdmin(prev => ({ ...prev, is_superuser: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="superuser" className="mr-2 text-sm font-medium text-gray-700">
                  مدير عام (صلاحيات كاملة)
                </label>
              </div>
              <button
                onClick={handleCreateAdmin}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء مدير جديد'}
              </button>
            </div>

            {/* قائمة المديرين */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">قائمة المديرين الحاليين</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">اسم المستخدم</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">البريد الإلكتروني</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">النوع</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الحالة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">آخر دخول</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{admin.username}</td>
                        <td className="py-3 px-4">{admin.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_superuser 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.is_superuser ? 'مدير عام' : 'مدير فرعي'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {admin.last_login || 'لم يسجل دخول'}
                        </td>
                        <td className="py-3 px-4">
                          {admin.username !== 'admin' && (
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              تعطيل
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* النسخ الاحتياطي */}
        {activeSection === 'backup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">إعدادات النسخ الاحتياطي</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>النسخ التلقائي</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.backup.autoBackup}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          backup: { ...prev.backup, autoBackup: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تكرار النسخ</label>
                    <select
                      value={settings.backup.backupFrequency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        backup: { ...prev.backup, backupFrequency: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="daily">يومي</option>
                      <option value="weekly">أسبوعي</option>
                      <option value="monthly">شهري</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">مدة الحفظ (أيام)</label>
                    <input
                      type="number"
                      value={settings.backup.retentionDays}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        backup: { ...prev.backup, retentionDays: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات النسخ الاحتياطي</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>آخر نسخة احتياطية:</span>
                    <span className="font-medium">{settings.backup.lastBackup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة النسخ التلقائي:</span>
                    <span className={`font-medium ${settings.backup.autoBackup ? 'text-green-600' : 'text-red-600'}`}>
                      {settings.backup.autoBackup ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>التكرار:</span>
                    <span className="font-medium">
                      {settings.backup.backupFrequency === 'daily' ? 'يومي' : 
                       settings.backup.backupFrequency === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-reverse space-x-4">
              <button
                onClick={performBackup}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                {isLoading ? 'جاري إنشاء النسخة...' : 'إنشاء نسخة احتياطية الآن'}
              </button>
              
              <button
                onClick={() => handleSaveSettings('backup')}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ إعدادات النسخ الاحتياطي'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون رفع البيانات
const UploadTab = ({ adminToken, onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [availableStages, setAvailableStages] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [stageTemplates, setStageTemplates] = useState([]);
  const [mappingTemplates, setMappingTemplates] = useState([]);
  const [selectedStageTemplate, setSelectedStageTemplate] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [mapping, setMapping] = useState({
    student_id_column: '',
    name_column: '',
    subject_columns: [],
    total_column: '',
    class_column: '',
    section_column: '',
    school_column: '',
    administration_column: '',
    school_code_column: ''
  });

  useEffect(() => {
    fetchStages(); // جلب المراحل التعليمية
    fetchMappingTemplates(); // جلب قوالب الربط
  }, []);

  useEffect(() => {
    if (selectedStage) {
      fetchStageTemplates(selectedStage);
    }
  }, [selectedStage]);

  const fetchStageTemplates = async (stageId) => {
    try {
      const response = await axios.get(`${API}/admin/stage-templates?stage_id=${stageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStageTemplates(response.data);
    } catch (error) {
      console.error('خطأ في جلب قوالب المراحل:', error);
    }
  };

  const fetchMappingTemplates = async () => {
    try {
      const response = await axios.get(`${API}/admin/mapping-templates`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setMappingTemplates(response.data);
    } catch (error) {
      console.error('خطأ في جلب قوالب الربط:', error);
    }
  };

  const validateData = async () => {
    if (!fileAnalysis) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        file_hash: fileAnalysis.file_hash
      });
      
      if (selectedStageTemplate) {
        params.append('stage_template_id', selectedStageTemplate);
      }
      
      const response = await axios.post(
        `${API}/admin/validate-excel-data?${params}`,
        mapping,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setValidationResult(response.data);
      setShowValidation(true);
      
    } catch (error) {
      console.error('خطأ في التحقق من البيانات:', error);
      alert('خطأ في التحقق من البيانات: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const applyMappingTemplate = async (template) => {
    try {
      setMapping(template.mapping);
      
      // تحديث عداد الاستخدام
      await axios.put(`${API}/admin/mapping-templates/${template.id}/use`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      alert(`تم تطبيق قالب "${template.name}" بنجاح!`);
      fetchMappingTemplates(); // إعادة جلب القوالب لتحديث العدادات
      
    } catch (error) {
      console.error('خطأ في تطبيق القالب:', error);
      alert('خطأ في تطبيق القالب');
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('يرجى إدخال اسم القالب');
      return;
    }
    
    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        stage_id: selectedStage || null,
        mapping: mapping,
        is_public: false
      };
      
      await axios.post(`${API}/admin/mapping-templates`, templateData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('تم حفظ القالب بنجاح!');
      setShowTemplateDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      fetchMappingTemplates();
      
    } catch (error) {
      console.error('خطأ في حفظ القالب:', error);
      alert('خطأ في حفظ القالب: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDragStart = (e, column) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMappingDrop = (e, targetType, targetIndex = null) => {
    e.preventDefault();
    
    if (!draggedColumn) return;
    
    const newMapping = { ...mapping };
    
    if (targetType === 'student_id') {
      newMapping.student_id_column = draggedColumn;
    } else if (targetType === 'name') {
      newMapping.name_column = draggedColumn;
    } else if (targetType === 'subjects') {
      if (!newMapping.subject_columns.includes(draggedColumn)) {
        newMapping.subject_columns = [...newMapping.subject_columns, draggedColumn];
      }
    } else if (targetType === 'total') {
      newMapping.total_column = draggedColumn;
    } else if (targetType === 'class') {
      newMapping.class_column = draggedColumn;
    } else if (targetType === 'section') {
      newMapping.section_column = draggedColumn;
    } else if (targetType === 'school') {
      newMapping.school_column = draggedColumn;
    } else if (targetType === 'administration') {
      newMapping.administration_column = draggedColumn;
    } else if (targetType === 'school_code') {
      newMapping.school_code_column = draggedColumn;
    }
    
    setMapping(newMapping);
    setDraggedColumn(null);
  };

  const removeSubjectColumn = (columnToRemove) => {
    setMapping(prev => ({
      ...prev,
      subject_columns: prev.subject_columns.filter(col => col !== columnToRemove)
    }));
  };

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`);
      setAvailableStages(response.data);
    } catch (error) {
      console.error('خطأ في جلب المراحل التعليمية:', error);
    }
  };

  const handleStageChange = (stageId) => {
    setSelectedStage(stageId);
    const stage = availableStages.find(s => s.id === stageId);
    if (stage) {
      setAvailableRegions(stage.regions || []);
      setSelectedRegion(''); // إعادة تعيين المحافظة عند تغيير المرحلة
    } else {
      setAvailableRegions([]);
      setSelectedRegion('');
    }
  };

  useEffect(() => {
    fetchStages(); // جلب المراحل التعليمية
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileUpload = async (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/admin/upload-excel`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${adminToken}`
        },
        timeout: 300000, // 5 دقائق للملفات الكبيرة
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      setFileAnalysis(response.data);
      
      // تعيين الاقتراحات الذكية
      const newMapping = { ...mapping };
      Object.entries(response.data.suggested_mappings).forEach(([column, type]) => {
        if (type === 'student_id' && !newMapping.student_id_column) {
          newMapping.student_id_column = column;
        } else if (type === 'name' && !newMapping.name_column) {
          newMapping.name_column = column;
        } else if (type === 'total' && !newMapping.total_column) {
          newMapping.total_column = column;
        } else if (type === 'class' && !newMapping.class_column) {
          newMapping.class_column = column;
        } else if (type === 'section' && !newMapping.section_column) {
          newMapping.section_column = column;
        } else if (type === 'subject') {
          if (!newMapping.subject_columns.includes(column)) {
            newMapping.subject_columns.push(column);
          }
        }
      });
      setMapping(newMapping);
      
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      let errorMessage = 'حدث خطأ في رفع الملف. يرجى المحاولة مرة أخرى.';
      
      if (error.response?.status === 413) {
        errorMessage = error.response.data?.detail || 'حجم الملف كبير جداً. يرجى رفع ملف أصغر.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'تنسيق الملف غير صحيح.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'انتهت مهلة الرفع. يرجى المحاولة مرة أخرى أو رفع ملف أصغر.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubjectToggle = (column) => {
    setMapping(prev => ({
      ...prev,
      subject_columns: prev.subject_columns.includes(column)
        ? prev.subject_columns.filter(c => c !== column)
        : [...prev.subject_columns, column]
    }));
  };

  const handleProcessData = async () => {
    if (!fileAnalysis || !selectedStage) {
      alert('يرجى تحديد المرحلة التعليمية');
      return;
    }

    if (!mapping.student_id_column || !mapping.name_column || mapping.subject_columns.length === 0) {
      alert('يرجى تحديد عمود رقم الجلوس والاسم ومادة واحدة على الأقل');
      return;
    }

    setIsProcessing(true);
    try {
      const params = new URLSearchParams({
        file_hash: fileAnalysis.file_hash,
        educational_stage_id: selectedStage
      });

      if (selectedRegion) {
        params.append('region', selectedRegion);
      }

      const response = await axios.post(`${API}/admin/process-excel?${params}`, mapping, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`تم معالجة الملف بنجاح! تم إضافة ${response.data.total_processed} طالب`);
      setFileAnalysis(null);
      setMapping({
        student_id_column: '',
        name_column: '',
        subject_columns: [],
        total_column: '',
        class_column: '',
        section_column: ''
      });
      setSelectedStage('');
      setSelectedRegion('');
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('خطأ في معالجة الملف:', error);
      alert('خطأ في معالجة الملف: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">رفع ملف البيانات</h2>
        
        {!fileAnalysis ? (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  اسحب ملف الإكسيل هنا أو اضغط للاختيار
                </h3>
                <p className="text-gray-600">
                  يدعم ملفات .xlsx و .xls فقط
                </p>
              </div>
              
              {isLoading && <LoadingSpinner />}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="text-2xl ml-3">✅</div>
                <div>
                  <h4 className="font-semibold text-green-800">تم تحليل الملف بنجاح!</h4>
                  <p className="text-green-700 text-sm">
                    الملف: {fileAnalysis.filename} | الأعمدة: {fileAnalysis.columns.length} | الصفوف: {fileAnalysis.total_rows}
                  </p>
                </div>
              </div>
            </div>

            {/* اختيار المرحلة التعليمية والمحافظة */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">🎓 تحديد المرحلة التعليمية والمحافظة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المرحلة التعليمية <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر المرحلة التعليمية</option>
                    {availableStages.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {stage.icon} {stage.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المحافظة/المنطقة
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedStage || availableRegions.length === 0}
                  >
                    <option value="">اختر المحافظة (اختياري)</option>
                    {availableRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedStage && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    ✓ تم تحديد المرحلة: <strong>{availableStages.find(s => s.id === selectedStage)?.name}</strong>
                    {selectedRegion && (
                      <> - المحافظة: <strong>{selectedRegion}</strong></>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* قوالب الربط المحفوظة */}
            {mappingTemplates.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-4">📋 قوالب الربط المحفوظة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mappingTemplates.slice(0, 4).map(template => (
                    <div key={template.id} className="bg-white border border-purple-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                          {template.description && (
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          )}
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          استُخدم {template.usage_count} مرة
                        </span>
                      </div>
                      <button
                        onClick={() => applyMappingTemplate(template)}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
                      >
                        تطبيق القالب
                      </button>
                    </div>
                  ))}
                </div>
                {mappingTemplates.length > 4 && (
                  <p className="text-center text-purple-600 mt-3 text-sm">
                    و {mappingTemplates.length - 4} قوالب أخرى متاحة
                  </p>
                )}
              </div>
            )}

            {/* اختيار قالب المرحلة التعليمية */}
            {stageTemplates.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-900 mb-4">⚙️ قالب المرحلة التعليمية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اختر قالب المرحلة</label>
                    <select
                      value={selectedStageTemplate}
                      onChange={(e) => setSelectedStageTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">بدون قالب</option>
                      {stageTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.subjects?.length || 0} مواد)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={validateData}
                      disabled={!fileAnalysis || isLoading}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50 w-full"
                    >
                      {isLoading ? 'جاري الفحص...' : 'فحص البيانات'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* نتائج التحقق من البيانات */}
            {showValidation && validationResult && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">🔍 نتائج فحص البيانات</h3>
                  <button
                    onClick={() => setShowValidation(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {/* نتيجة عامة */}
                <div className={`p-3 rounded-lg mb-4 ${validationResult.is_valid ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl ${validationResult.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                      {validationResult.is_valid ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className={`font-semibold ${validationResult.is_valid ? 'text-green-800' : 'text-red-800'}`}>
                        {validationResult.is_valid ? 'البيانات سليمة ومهيأة للمعالجة' : 'يوجد أخطاء تحتاج إصلاح'}
                      </p>
                      <p className="text-sm text-gray-600">
                        نقاط الجودة: {validationResult.statistics?.quality_score || 0}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{validationResult.statistics?.total_rows || 0}</p>
                    <p className="text-sm text-blue-800">إجمالي الطلاب</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{validationResult.statistics?.total_columns || 0}</p>
                    <p className="text-sm text-green-800">الأعمدة</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{validationResult.warnings?.length || 0}</p>
                    <p className="text-sm text-yellow-800">تحذيرات</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{validationResult.errors?.length || 0}</p>
                    <p className="text-sm text-red-800">أخطاء</p>
                  </div>
                </div>

                {/* الأخطاء */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">🚫 أخطاء يجب إصلاحها:</h4>
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="font-medium text-red-800">{error.message}</p>
                          {error.column && <p className="text-sm text-red-600">العمود: {error.column}</p>}
                          {error.count && <p className="text-sm text-red-600">العدد: {error.count}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* التحذيرات */}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ تحذيرات:</h4>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="font-medium text-yellow-800">{warning.message}</p>
                          {warning.column && <p className="text-sm text-yellow-600">العمود: {warning.column}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* الاقتراحات */}
                {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">💡 اقتراحات للتحسين:</h4>
                    <div className="space-y-2">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="font-medium text-blue-800">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* تخصيص الأعمدة مع Drag & Drop */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">🔗 ربط الأعمدة</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTemplateDialog(true)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    حفظ كقالب
                  </button>
                  <button
                    onClick={() => setMapping({
                      student_id_column: '',
                      name_column: '',
                      subject_columns: [],
                      total_column: '',
                      class_column: '',
                      section_column: '',
                      school_column: '',
                      administration_column: '',
                      school_code_column: ''
                    })}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* أعمدة الملف - قابلة للسحب */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">📋 أعمدة الملف (اسحب لربطها)</h4>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <div className="grid grid-cols-2 gap-2">
                      {fileAnalysis.columns.map(col => (
                        <div
                          key={col}
                          draggable
                          onDragStart={(e) => handleDragStart(e, col)}
                          className={`cursor-move p-3 bg-white border border-gray-300 rounded-lg hover:shadow-md transition-shadow ${
                            draggedColumn === col ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">⋮⋮</span>
                            <span className="text-sm font-medium text-gray-700 truncate">{col}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* مناطق الإفلات */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🎯 مناطق الربط (أفلت هنا)</h4>
                  <div className="space-y-3">
                    {/* رقم الجلوس */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleMappingDrop(e, 'student_id')}
                      className={`min-h-[60px] border-2 border-dashed rounded-lg p-3 transition-colors ${
                        mapping.student_id_column
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">رقم الجلوس *</span>
                        {mapping.student_id_column && (
                          <button
                            onClick={() => setMapping(prev => ({...prev, student_id_column: ''}))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {mapping.student_id_column ? (
                        <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          ✓ {mapping.student_id_column}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">اسحب عمود رقم الجلوس هنا</div>
                      )}
                    </div>

                    {/* اسم الطالب */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleMappingDrop(e, 'name')}
                      className={`min-h-[60px] border-2 border-dashed rounded-lg p-3 transition-colors ${
                        mapping.name_column
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">اسم الطالب *</span>
                        {mapping.name_column && (
                          <button
                            onClick={() => setMapping(prev => ({...prev, name_column: ''}))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {mapping.name_column ? (
                        <div className="mt-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          ✓ {mapping.name_column}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-500">اسحب عمود الاسم هنا</div>
                      )}
                    </div>

                    {/* المواد */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleMappingDrop(e, 'subjects')}
                      className="min-h-[100px] border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-3"
                    >
                      <span className="font-medium text-blue-800">المواد الدراسية *</span>
                      <div className="mt-2">
                        {mapping.subject_columns.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {mapping.subject_columns.map(subject => (
                              <div key={subject} className="flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                                {subject}
                                <button
                                  onClick={() => removeSubjectColumn(subject)}
                                  className="text-blue-600 hover:text-blue-800 ml-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-blue-600">اسحب أعمدة المواد هنا (يمكن سحب عدة أعمدة)</div>
                        )}
                      </div>
                    </div>

                    {/* الحقول الإضافية للمدرسة */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {/* المدرسة */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'school')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.school_column
                            ? 'border-teal-300 bg-teal-50'
                            : 'border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">المدرسة</span>
                        {mapping.school_column ? (
                          <div className="mt-1 px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                            ✓ {mapping.school_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>

                      {/* الإدارة التعليمية */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'administration')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.administration_column
                            ? 'border-cyan-300 bg-cyan-50'
                            : 'border-gray-200 bg-gray-50 hover:border-cyan-300 hover:bg-cyan-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">الإدارة</span>
                        {mapping.administration_column ? (
                          <div className="mt-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs">
                            ✓ {mapping.administration_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>

                      {/* كود المدرسة */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'school_code')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.school_code_column
                            ? 'border-pink-300 bg-pink-50'
                            : 'border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">كود المدرسة</span>
                        {mapping.school_code_column ? (
                          <div className="mt-1 px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                            ✓ {mapping.school_code_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>
                    </div>

                    {/* الحقول الاختيارية */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* المجموع */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'total')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.total_column
                            ? 'border-yellow-300 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">المجموع</span>
                        {mapping.total_column ? (
                          <div className="mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            ✓ {mapping.total_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>

                      {/* الفصل */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'class')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.class_column
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">الفصل</span>
                        {mapping.class_column ? (
                          <div className="mt-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            ✓ {mapping.class_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>

                      {/* الشعبة */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleMappingDrop(e, 'section')}
                        className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 text-sm transition-colors ${
                          mapping.section_column
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="font-medium text-gray-600">الشعبة</span>
                        {mapping.section_column ? (
                          <div className="mt-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                            ✓ {mapping.section_column}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-gray-400">اختياري</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* حوار حفظ القالب */}
            {showTemplateDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">حفظ قالب الربط</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اسم القالب *</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                        placeholder="مثال: نتائج الشهادة الإعدادية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                      <textarea
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right"
                        placeholder="وصف مختصر للقالب..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveAsTemplate}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      حفظ القالب
                    </button>
                    <button
                      onClick={() => {
                        setShowTemplateDialog(false);
                        setTemplateName('');
                        setTemplateDescription('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* معاينة البيانات */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">معاينة البيانات</h3>
              <div className="overflow-x-auto bg-gray-50 rounded-xl">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      {fileAnalysis.columns.map(col => (
                        <th key={col} className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fileAnalysis.sample_data.slice(0, 3).map((row, idx) => (
                      <tr key={idx}>
                        {fileAnalysis.columns.map(col => (
                          <td key={col} className="px-4 py-2 text-sm text-gray-900">
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-reverse space-x-4">
              <button
                onClick={() => setFileAnalysis(null)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleProcessData}
                disabled={isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {isProcessing ? 'جاري المعالجة...' : 'معالجة البيانات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// مكون نتائج المدارس والإدارات
const SchoolsTab = ({ adminToken }) => {
  const [schoolsData, setSchoolsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedAdministration, setSelectedAdministration] = useState('');
  const [availableStages, setAvailableStages] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableAdministrations, setAvailableAdministrations] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // cards, table
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolStudents, setSchoolStudents] = useState([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    fetchSchoolsData();
  }, [selectedStage, selectedRegion, selectedAdministration]);

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`);
      setAvailableStages(response.data);
    } catch (error) {
      console.error('خطأ في جلب المراحل:', error);
    }
  };

  const fetchSchoolsData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStage) params.append('educational_stage_id', selectedStage);
      if (selectedRegion) params.append('region', selectedRegion);
      if (selectedAdministration) params.append('administration', selectedAdministration);

      const response = await axios.get(`${API}/schools-summary?${params}`);
      setSchoolsData(response.data.schools);
      
      // استخراج المحافظات والإدارات المتاحة
      const regions = [...new Set(response.data.schools.map(s => s.region).filter(r => r && r !== 'غير محدد'))];
      const administrations = [...new Set(response.data.schools.map(s => s.administration).filter(a => a && a !== 'غير محدد'))];
      
      setAvailableRegions(regions);
      setAvailableAdministrations(administrations);
      
    } catch (error) {
      console.error('خطأ في جلب بيانات المدارس:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewSchoolStudents = async (school) => {
    setSelectedSchool(school);
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (selectedStage) params.append('educational_stage_id', selectedStage);
      if (selectedRegion) params.append('region', selectedRegion);

      const response = await axios.get(`${API}/school/${encodeURIComponent(school.school_name)}/students?${params}`);
      setSchoolStudents(response.data.students);
      setShowStudentsModal(true);
      
    } catch (error) {
      console.error('خطأ في جلب طلاب المدرسة:', error);
      alert('خطأ في جلب بيانات الطلاب');
    } finally {
      setIsLoading(false);
    }
  };

  const exportSchoolData = (school) => {
    const csvContent = [
      ['اسم الطالب', 'رقم الجلوس', 'المتوسط', 'التقدير', 'المجموع'],
      ...school.top_students.map(student => [
        student.name,
        student.student_id,
        student.average,
        student.grade,
        student.total_score
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `نتائج_${school.school_name}.csv`;
    link.click();
  };

  if (isLoading && schoolsData.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* فلاتر البحث */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏫 نتائج المدارس والإدارات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة التعليمية</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المراحل</option>
              {availableStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المحافظات</option>
              {availableRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الإدارة التعليمية</label>
            <select
              value={selectedAdministration}
              onChange={(e) => setSelectedAdministration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الإدارات</option>
              {availableAdministrations.map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                البطاقات
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                جدول
              </button>
            </div>
          </div>
        </div>

        {/* إحصائيات عامة */}
        {schoolsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{schoolsData.length}</p>
              <p className="text-sm text-blue-800">إجمالي المدارس</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {schoolsData.reduce((sum, school) => sum + school.statistics.total_students, 0)}
              </p>
              <p className="text-sm text-green-800">إجمالي الطلاب</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {schoolsData.length > 0 
                  ? Math.round(schoolsData.reduce((sum, school) => sum + school.statistics.average_score, 0) / schoolsData.length) 
                  : 0}%
              </p>
              <p className="text-sm text-yellow-800">متوسط النتائج</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {schoolsData.length > 0 
                  ? Math.round(schoolsData.reduce((sum, school) => sum + school.statistics.pass_rate, 0) / schoolsData.length) 
                  : 0}%
              </p>
              <p className="text-sm text-purple-800">معدل النجاح</p>
            </div>
          </div>
        )}
      </div>

      {/* عرض النتائج */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schoolsData.map((school, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{school.school_name}</h3>
                  <p className="text-sm text-gray-600">{school.administration}</p>
                  <p className="text-xs text-gray-500">{school.region}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{school.statistics.average_score}%</span>
                  <p className="text-xs text-gray-500">المتوسط العام</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800">{school.statistics.total_students}</p>
                  <p className="text-xs text-gray-600">إجمالي الطلاب</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{school.statistics.pass_rate}%</p>
                  <p className="text-xs text-gray-600">معدل النجاح</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>أعلى درجة: {school.statistics.highest_score}</span>
                  <span>أقل درجة: {school.statistics.lowest_score}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => viewSchoolStudents(school)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  >
                    عرض الطلاب
                  </button>
                  <button
                    onClick={() => exportSchoolData(school)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                  >
                    تصدير
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدرسة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإدارة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المحافظة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطلاب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المتوسط</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النجاح %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schoolsData.map((school, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {school.school_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {school.administration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {school.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {school.statistics.total_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {school.statistics.average_score}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {school.statistics.pass_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewSchoolStudents(school)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          عرض
                        </button>
                        <button
                          onClick={() => exportSchoolData(school)}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          تصدير
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال عرض طلاب المدرسة */}
      {showStudentsModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSchool.school_name}</h3>
                  <p className="text-gray-600">{selectedSchool.administration} - {selectedSchool.region}</p>
                </div>
                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolStudents.map((student, index) => (
                  <div key={student.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-600">#{student.student_id}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{student.average}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">التقدير:</span>
                      <span className="font-medium">{student.grade}</span>
                    </div>
                    {student.total_score && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">المجموع:</span>
                        <span className="font-medium">{student.total_score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {schoolsData.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مدارس</h3>
          <p className="text-gray-500">لم يتم العثور على مدارس تطابق المعايير المحددة</p>
        </div>
      )}
    </div>
  );
};

// مكون إدارة قوالب الشهادات
const CertificateTemplatesTab = ({ adminToken }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    '[اسم_الطالب]': 'أحمد محمد علي',
    '[رقم_الجلوس]': '123456',
    '[اسم_المرحلة]': 'الثانوية العامة',
    '[المتوسط]': '85',
    '[التقدير]': 'جيد جداً',
    '[اسم_المدرسة]': 'مدرسة النور الثانوية',
    '[التاريخ]': new Date().toLocaleDateString('ar-EG'),
    '[رقم_الشهادة]': 'CERT-2024-001'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    html_content: '',
    css_styles: '',
    category: 'general',
    variables: {}
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/admin/certificate-templates`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('خطأ في جلب قوالب الشهادات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      html_content: `<div class="certificate">
  <div class="header">
    <h1>شهادة تقدير</h1>
  </div>
  <div class="content">
    <p>تُمنح للطالب المتميز</p>
    <h2>[اسم_الطالب]</h2>
    <p>رقم الجلوس: [رقم_الجلوس]</p>
    <p>النسبة: [المتوسط]%</p>
    <p>التقدير: [التقدير]</p>
  </div>
  <div class="footer">
    <p>التاريخ: [التاريخ]</p>
  </div>
</div>`,
      css_styles: `.certificate {
  width: 800px;
  margin: 0 auto;
  padding: 40px;
  border: 8px double #1e40af;
  border-radius: 20px;
  font-family: 'Arial', sans-serif;
  direction: rtl;
  text-align: center;
  background: white;
}
.header h1 {
  font-size: 48px;
  color: #1e40af;
  margin-bottom: 30px;
}
.content h2 {
  font-size: 36px;
  color: #1e40af;
  margin: 20px 0;
}
.content p {
  font-size: 18px;
  margin: 10px 0;
}`,
      category: 'general',
      variables: {}
    });
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      description: template.description,
      html_content: template.html_content,
      css_styles: template.css_styles,
      category: template.category,
      variables: template.variables
    });
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم القالب');
      return;
    }

    setIsLoading(true);
    try {
      if (selectedTemplate) {
        // تحديث قالب موجود
        await axios.put(`${API}/admin/certificate-templates/${selectedTemplate.id}`, formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        alert('تم تحديث القالب بنجاح!');
      } else {
        // إنشاء قالب جديد
        await axios.post(`${API}/admin/certificate-templates`, formData, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        alert('تم إنشاء القالب بنجاح!');
      }
      
      setShowEditor(false);
      fetchTemplates();
    } catch (error) {
      console.error('خطأ في حفظ القالب:', error);
      alert('خطأ في حفظ القالب: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`هل أنت متأكد من حذف القالب "${templateName}"؟`)) return;

    setIsLoading(true);
    try {
      await axios.delete(`${API}/admin/certificate-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف القالب بنجاح!');
      fetchTemplates();
    } catch (error) {
      console.error('خطأ في حذف القالب:', error);
      alert('خطأ في حذف القالب');
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewHtml = () => {
    let html = formData.html_content;
    let css = formData.css_styles;
    
    Object.entries(previewData).forEach(([key, value]) => {
      html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      css = css.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return `
      <style>${css}</style>
      ${html}
    `;
  };

  if (isLoading && templates.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🏆 إدارة قوالب الشهادات</h2>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + إنشاء قالب جديد
          </button>
        </div>

        {/* قائمة القوالب */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {templates.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.category === 'appreciation' ? 'bg-blue-100 text-blue-800' :
                  template.category === 'excellence' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.category === 'appreciation' ? 'تقدير' :
                   template.category === 'excellence' ? 'تفوق' : 'عام'}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <p>استُخدم {template.usage_count} مرة</p>
                <p>أُنشئ بواسطة: {template.created_by}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد قوالب شهادات</h3>
            <p className="text-gray-500 mb-4">ابدأ بإنشاء قالب شهادة أول</p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              إنشاء قالب جديد
            </button>
          </div>
        )}
      </div>

      {/* محرر القوالب */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex">
            {/* نموذج التحرير */}
            <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
                </h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم القالب *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="مثال: شهادة تقدير كلاسيكية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="وصف مختصر للقالب"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">عام</option>
                    <option value="appreciation">تقدير</option>
                    <option value="excellence">تفوق</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">محتوى HTML</label>
                  <textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="<div>محتوى الشهادة...</div>"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تنسيقات CSS</label>
                  <textarea
                    value={formData.css_styles}
                    onChange={(e) => setFormData(prev => ({ ...prev, css_styles: e.target.value }))}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder=".certificate { ... }"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'جاري الحفظ...' : (selectedTemplate ? 'تحديث القالب' : 'إنشاء القالب')}
                  </button>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>

            {/* معاينة */}
            <div className="w-1/2 p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معاينة القالب</h3>
              <div className="bg-white border border-gray-300 rounded-lg p-4 overflow-auto max-h-[80vh]">
                <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// حذف المكونات القديمة واستبدالها
const CertificatesTab = ({ adminToken }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [certificateType, setCertificateType] = useState('appreciation');
  const [certificateData, setCertificateData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('خطأ في جلب الطلاب:', error);
    }
  };

  const generateCertificate = async (studentId) => {
    setIsGenerating(true);
    try {
      const response = await axios.get(`${API}/student/${studentId}/certificate?certificate_type=${certificateType}`);
      setCertificateData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('خطأ في إنشاء الشهادة:', error);
      alert('خطأ في إنشاء الشهادة: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const downloadCertificateAsPdf = () => {
    // محاكاة تحميل PDF - في التطبيق الحقيقي نحتاج مكتبة لتحويل HTML إلى PDF
    const printContent = document.getElementById('certificate-preview').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>شهادة تقدير - ${certificateData.student.name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; direction: rtl; }
            .certificate { width: 800px; margin: 0 auto; padding: 40px; }
            .print-only { display: block; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 إنشاء شهادات التقدير</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* قائمة الطلاب */}
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشهادة</label>
              <select
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="appreciation">شهادة تقدير</option>
                <option value="excellence">شهادة تفوق</option>
                <option value="honor">شهادة شرف</option>
              </select>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`p-4 border border-gray-200 rounded-lg mb-3 cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">#{student.student_id}</p>
                      {student.school_name && (
                        <p className="text-xs text-gray-500">{student.school_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{student.average}%</span>
                      <p className="text-xs text-gray-500">{student.grade}</p>
                    </div>
                  </div>
                  {selectedStudent?.id === student.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateCertificate(student.student_id);
                        }}
                        disabled={isGenerating}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        {isGenerating ? 'جاري الإنشاء...' : 'إنشاء الشهادة'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-500">لا توجد نتائج للبحث</p>
              </div>
            )}
          </div>

          {/* معاينة الشهادة */}
          <div>
            {showPreview && certificateData ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center no-print">
                  <h3 className="font-semibold text-gray-800">معاينة الشهادة</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={printCertificate}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      طباعة
                    </button>
                    <button
                      onClick={downloadCertificateAsPdf}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      تحميل PDF
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>

                {/* تصميم الشهادة */}
                <div id="certificate-preview" className="p-8" style={{backgroundColor: '#ffffff'}}>
                  <div className="text-center border-4 border-double border-gray-800 p-8 rounded-lg" style={{borderColor: certificateData.template.color}}>
                    {/* الرأس */}
                    <div className="mb-6">
                      <div className="text-4xl mb-2">🏆</div>
                      <h1 className="text-3xl font-bold mb-2" style={{color: certificateData.template.color}}>
                        {certificateData.template.title}
                      </h1>
                      <div className="h-1 w-24 mx-auto mb-4" style={{backgroundColor: certificateData.template.color}}></div>
                    </div>

                    {/* المحتوى */}
                    <div className="mb-6">
                      <p className="text-lg text-gray-700 mb-4">{certificateData.template.subtitle}</p>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{certificateData.student.name}</h2>
                      <p className="text-lg text-gray-700 mb-2">{certificateData.template.message}</p>
                      
                      <div className="my-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">رقم الجلوس:</span>
                            <span className="font-semibold ml-2">{certificateData.student.student_id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">المتوسط:</span>
                            <span className="font-semibold ml-2" style={{color: certificateData.template.color}}>
                              {certificateData.student.average}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">التقدير:</span>
                            <span className="font-semibold ml-2">{certificateData.student.grade}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">المجموع:</span>
                            <span className="font-semibold ml-2">{certificateData.student.total_score}</span>
                          </div>
                        </div>
                        
                        {certificateData.student.school_name && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">المدرسة:</span>
                                <span className="font-semibold ml-2">{certificateData.student.school_name}</span>
                              </div>
                              {certificateData.student.administration && (
                                <div>
                                  <span className="text-gray-600">الإدارة:</span>
                                  <span className="font-semibold ml-2">{certificateData.student.administration}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* التوقيع والتاريخ */}
                    <div className="flex justify-between items-end mt-8 pt-6 border-t-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="w-32 h-px bg-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">المدير</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">تاريخ الإصدار</p>
                        <p className="font-semibold">{certificateData.issue_date}</p>
                      </div>
                      <div className="text-center">
                        <div className="w-32 h-px bg-gray-400 mb-2"></div>
                        <p className="text-sm text-gray-600">الختم</p>
                      </div>
                    </div>

                    {/* رقم الشهادة */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">رقم الشهادة: {certificateData.certificate_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>اختر طالب وانقر على "إنشاء الشهادة"</p>
                  <p className="text-sm mt-1">ستظهر معاينة الشهادة هنا</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// المكون الرئيسي للأدمن
const AdminDashboard = ({ adminToken, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // جلب الإحصائيات
      const statsResponse = await axios.get(`${API}/stats`);
      setStats(statsResponse.data);

      // جلب آخر الطلاب
      const studentsResponse = await axios.get(`${API}/admin/students`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { limit: 5 }
      });
      setRecentStudents(studentsResponse.data.students);
      
    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error);
      setError('حدث خطأ في جلب البيانات');
    }
  };

  const handleUploadSuccess = () => {
    setSuccess('تم رفع ومعالجة البيانات بنجاح!');
    fetchDashboardData();
    setActiveTab('dashboard');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} recentStudents={recentStudents} />;
      case 'homepage':
        return <HomepageBuilder adminToken={adminToken} />;
      case 'stages':
        return <StagesTab adminToken={adminToken} />;
      case 'schools':
        return <SchoolsTab adminToken={adminToken} />;
      case 'upload':
        return <UploadTab adminToken={adminToken} onSuccess={handleUploadSuccess} />;
      case 'certificates':
        return <CertificateTemplatesTab adminToken={adminToken} />;
      case 'content':
        return <ContentTab adminToken={adminToken} onSuccess={() => setSuccess('تم تحديث المحتوى بنجاح!')} />;
      case 'faq':
        return <FAQManagement adminToken={adminToken} />;
      case 'guides':
        return <GuidesManagement adminToken={adminToken} />;
      case 'news':
        return <NewsManagement adminToken={adminToken} />;
      case 'notifications':
        return <NotificationManagement adminToken={adminToken} />;
      case 'analytics':
        return <AnalyticsManagement adminToken={adminToken} />;
      case 'settings':
        return <SettingsTab adminToken={adminToken} currentUser={null} />;
      default:
        return <DashboardTab stats={stats} recentStudents={recentStudents} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* تنبيهات */}
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

      <div className="flex h-screen">
        {/* الشريط الجانبي */}
        <div className="w-80 p-6">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={onLogout} 
          />
        </div>

        {/* المحتوى الرئيسي */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;