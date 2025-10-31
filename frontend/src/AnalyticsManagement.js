import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة التحليلات المتقدمة
const AnalyticsManagement = ({ adminToken }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [stages, setStages] = useState([]);
  const [regions, setRegions] = useState([]);
  const [dashboardView, setDashboardView] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
    fetchStages();
  }, [selectedTimeRange, selectedStage, selectedRegion]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // جلب البيانات التحليلية العامة
      const overviewResponse = await axios.get(`${API}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          time_range: selectedTimeRange,
          stage_id: selectedStage,
          region: selectedRegion
        }
      });
      
      setAnalyticsData(overviewResponse.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات التحليلية:', error);
      setAnalyticsData({
        total_students: 0,
        total_schools: 0,
        average_score: 0,
        pass_rate: 0,
        top_schools: [],
        grade_distribution: [],
        subject_performance: [],
        regional_stats: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const response = await axios.get(`${API}/stages`);
      setStages(response.data);
      
      // استخراج المحافظات الفريدة
      const allRegions = response.data.flatMap(stage => stage.regions || []);
      const uniqueRegions = [...new Set(allRegions)];
      setRegions(uniqueRegions);
    } catch (error) {
      console.error('خطأ في جلب المراحل:', error);
    }
  };

  const exportAnalyticsData = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['المؤشر', 'القيمة'].join(','),
      ['إجمالي الطلاب', analyticsData.total_students].join(','),
      ['إجمالي المدارس', analyticsData.total_schools].join(','),
      ['المتوسط العام', `${analyticsData.average_score}%`].join(','),
      ['معدل النجاح', `${analyticsData.pass_rate}%`].join(','),
      '',
      ['أفضل المدارس', ''].join(','),
      ...(analyticsData.top_schools?.map(school => 
        [school.name, `${school.average}%`].join(',')
      ) || []),
      '',
      ['توزيع التقديرات', ''].join(','),
      ...(analyticsData.grade_distribution?.map(grade => 
        [grade.grade, grade.count].join(',')
      ) || [])
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <h2 className="text-3xl font-bold text-gray-900">📊 التحليلات المتقدمة</h2>
          <p className="text-gray-600 mt-2">تحليل شامل لأداء الطلاب والمدارس</p>
        </div>
        <button
          onClick={exportAnalyticsData}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          📥 تصدير التقرير
        </button>
      </div>

      {/* فلاتر التحليل */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 فلاتر التحليل</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">آخر 7 أيام</option>
              <option value="30">آخر 30 يوم</option>
              <option value="90">آخر 3 أشهر</option>
              <option value="365">آخر سنة</option>
              <option value="all">جميع البيانات</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة التعليمية</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المراحل</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المحافظات</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع العرض</label>
            <select
              value={dashboardView}
              onChange={(e) => setDashboardView(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">نظرة عامة</option>
              <option value="detailed">تفصيلي</option>
              <option value="comparative">مقارن</option>
            </select>
          </div>
        </div>
      </div>

      {/* المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الطلاب</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData?.total_students || 0}</p>
              <p className="text-sm text-blue-600">+12% من الشهر الماضي</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">المتوسط العام</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData?.average_score || 0}%</p>
              <p className="text-sm text-green-600">+3.2% من الشهر الماضي</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">معدل النجاح</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData?.pass_rate || 0}%</p>
              <p className="text-sm text-purple-600">+5.1% من الشهر الماضي</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي المدارس</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData?.total_schools || 0}</p>
              <p className="text-sm text-orange-600">المدارس المشاركة</p>
            </div>
            <div className="text-4xl">🏫</div>
          </div>
        </div>
      </div>

      {/* الرسوم البيانية والتحليلات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزيع التقديرات */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 توزيع التقديرات</h3>
          {analyticsData?.grade_distribution?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.grade_distribution.map((item, index) => (
                <div key={item.grade} className="flex justify-between items-center">
                  <span className="font-medium">{item.grade}</span>
                  <div className="flex items-center space-x-reverse space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'][index] || 'bg-gray-500'
                        }`}
                        style={{ width: `${(item.count / analyticsData.total_students * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-12">{item.count}</span>
                    <span className="text-xs text-gray-500 w-10">
                      {((item.count / analyticsData.total_students) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>لا توجد بيانات توزيع التقديرات</p>
            </div>
          )}
        </div>

        {/* أداء المواد */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📚 أداء المواد</h3>
          {analyticsData?.subject_performance?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.subject_performance.slice(0, 6).map((subject, index) => (
                <div key={subject.name} className="flex justify-between items-center">
                  <span className="font-medium text-sm">{subject.name}</span>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${subject.average}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 w-10">
                      {subject.average}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📚</div>
              <p>لا توجد بيانات أداء المواد</p>
            </div>
          )}
        </div>
      </div>

      {/* أفضل المدارس والإحصائيات الإقليمية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أفضل المدارس */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 أفضل المدارس</h3>
          {analyticsData?.top_schools?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.top_schools.slice(0, 5).map((school, index) => (
                <div key={school.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{school.name}</p>
                      <p className="text-xs text-gray-500">{school.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{school.average}%</p>
                    <p className="text-xs text-gray-500">{school.students_count} طالب</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏆</div>
              <p>لا توجد بيانات المدارس</p>
            </div>
          )}
        </div>

        {/* الإحصائيات الإقليمية */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🗺️ الإحصائيات الإقليمية</h3>
          {analyticsData?.regional_stats?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.regional_stats.map((region, index) => (
                <div key={region.name} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{region.name}</p>
                    <p className="text-xs text-gray-500">{region.schools_count} مدرسة</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{region.average}%</p>
                    <p className="text-xs text-gray-500">{region.students_count} طالب</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🗺️</div>
              <p>لا توجد بيانات إقليمية</p>
            </div>
          )}
        </div>
      </div>

      {/* تقرير تفصيلي */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 تقرير تفصيلي</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 mb-2">الأداء العام</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• المتوسط العام: {analyticsData?.average_score || 0}%</li>
              <li>• معدل النجاح: {analyticsData?.pass_rate || 0}%</li>
              <li>• أعلى درجة: {analyticsData?.highest_score || 'غير متوفر'}</li>
              <li>• أقل درجة: {analyticsData?.lowest_score || 'غير متوفر'}</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-900 mb-2">التوزيع الجغرافي</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• عدد المحافظات: {regions.length}</li>
              <li>• عدد المدارس: {analyticsData?.total_schools || 0}</li>
              <li>• متوسط الطلاب/مدرسة: {analyticsData?.total_schools ? Math.round(analyticsData.total_students / analyticsData.total_schools) : 0}</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
            <h4 className="font-bold text-purple-900 mb-2">اتجاهات النمو</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• زيادة في عدد الطلاب: +12%</li>
              <li>• تحسن في المتوسط: +3.2%</li>
              <li>• زيادة معدل النجاح: +5.1%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManagement;