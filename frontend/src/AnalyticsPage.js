import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون صفحة الإحصائيات التحليلية
const AnalyticsPage = ({ onBack }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
    // تحديث Meta Tags
    document.title = 'الإحصائيات التحليلية - نظام الاستعلام الذكي';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'إحصائيات شاملة وتحليلات تفصيلية لأداء الطلاب في جميع المراحل التعليمية والمحافظات');
    }
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات التحليلية:', error);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">📊 الإحصائيات التحليلية</h1>
              <p className="text-sm text-gray-600">بيانات شاملة وتحليلات متقدمة</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-reverse space-x-8">
            {[
              { id: 'overview', name: 'نظرة عامة', icon: '📊' },
              { id: 'stages', name: 'المراحل', icon: '🎓' },
              { id: 'regions', name: 'المحافظات', icon: '🗺️' },
              { id: 'schools', name: 'أفضل المدارس', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData?.overview?.total_students?.toLocaleString('ar-SA') || 0}
                </h3>
                <p className="text-gray-600">إجمالي الطلاب</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData?.overview?.total_stages || 0}
                </h3>
                <p className="text-gray-600">المراحل التعليمية</p>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {analyticsData?.overview?.last_updated ? 
                    new Date(analyticsData.overview.last_updated).toLocaleDateString('ar-SA') : 
                    'غير محدد'
                  }
                </h3>
                <p className="text-gray-600">آخر تحديث</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 نشاط النظام</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">إحصائيات سريعة</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">المراحل النشطة</span>
                      <span className="font-bold text-blue-600">{analyticsData?.stages?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">المحافظات المتاحة</span>
                      <span className="font-bold text-green-600">{analyticsData?.regions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">أفضل المدارس</span>
                      <span className="font-bold text-purple-600">{analyticsData?.top_schools?.length || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">نصائح للاستخدام</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500">💡</span>
                      <p>استخدم علامات التبويب أعلاه لتصفح إحصائيات مفصلة</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-green-500">📊</span>
                      <p>يمكنك مقارنة أداء المحافظات والمراحل المختلفة</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-500">🏆</span>
                      <p>اطلع على أفضل المدارس والنتائج المتميزة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'stages' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🎓 إحصائيات المراحل التعليمية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData?.stages?.map((stage, index) => (
                <div key={stage.stage_id} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl" style={{ color: stage.stage_color }}>
                      {stage.stage_icon}
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        المرتبة #{index + 1}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{stage.stage_name}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي الطلاب</span>
                      <span className="font-bold text-gray-900">{stage.total_students.toLocaleString('ar-SA')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المتوسط العام</span>
                      <span className="font-bold" style={{ color: stage.stage_color }}>
                        {stage.average_score}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">أعلى درجة</span>
                      <span className="font-bold text-green-600">{stage.highest_score}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">أقل درجة</span>
                      <span className="font-bold text-red-600">{stage.lowest_score}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المحافظات المتاحة</span>
                      <span className="font-bold text-purple-600">{stage.regions_count}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stage.average_score}%`,
                          backgroundColor: stage.stage_color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'regions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🗺️ إحصائيات المحافظات</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرتبة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المحافظة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الطلاب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المتوسط العام</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الأداء</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData?.regions?.map((region, index) => (
                      <tr key={region.region_name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{region.region_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{region.total_students.toLocaleString('ar-SA')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{region.average_score}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                region.average_score >= 80 ? 'bg-green-500' :
                                region.average_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${region.average_score}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'schools' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 أفضل المدارس</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData?.top_schools?.slice(0, 12).map((school, index) => (
                <div key={`${school.school_name}-${index}`} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {index < 3 && (
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          المرتبة #{index + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                        {school.school_name}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المحافظة</span>
                      <span className="font-semibold text-gray-900">{school.region}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">عدد الطلاب</span>
                      <span className="font-bold text-blue-600">{school.total_students}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المتوسط العام</span>
                      <span className={`font-bold text-lg ${
                        school.average_score >= 90 ? 'text-green-600' :
                        school.average_score >= 80 ? 'text-blue-600' :
                        school.average_score >= 70 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {school.average_score}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">مستوى الأداء</span>
                      <span className={`text-xs font-medium ${
                        school.average_score >= 90 ? 'text-green-600' :
                        school.average_score >= 80 ? 'text-blue-600' :
                        school.average_score >= 70 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {school.average_score >= 90 ? 'ممتاز' :
                         school.average_score >= 80 ? 'جيد جداً' :
                         school.average_score >= 70 ? 'جيد' : 'مقبول'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          school.average_score >= 90 ? 'bg-green-500' :
                          school.average_score >= 80 ? 'bg-blue-500' :
                          school.average_score >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${school.average_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsPage;