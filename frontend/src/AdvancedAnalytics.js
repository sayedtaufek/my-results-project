import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون التحليلات المتقدمة للأدمن
const AdvancedAnalytics = ({ adminToken }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [stageAnalytics, setStageAnalytics] = useState({});
  const [regionAnalytics, setRegionAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات التحليلية:', error);
      alert('خطأ في جلب البيانات التحليلية');
    } finally {
      setLoading(false);
    }
  };

  const fetchStageAnalytics = async (stageId) => {
    if (stageAnalytics[stageId]) return; // تجنب الطلبات المتكررة
    
    try {
      const response = await axios.get(`${API}/analytics/stage/${stageId}`);
      setStageAnalytics(prev => ({
        ...prev,
        [stageId]: response.data
      }));
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المرحلة:', error);
      alert('خطأ في جلب إحصائيات المرحلة');
    }
  };

  const fetchRegionAnalytics = async (regionName) => {
    if (regionAnalytics[regionName]) return; // تجنب الطلبات المتكررة
    
    try {
      const response = await axios.get(`${API}/analytics/region/${encodeURIComponent(regionName)}`);
      setRegionAnalytics(prev => ({
        ...prev,
        [regionName]: response.data
      }));
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المحافظة:', error);
      alert('خطأ في جلب إحصائيات المحافظة');
    }
  };

  const handleStageSelect = (stageId) => {
    setSelectedStage(stageId);
    fetchStageAnalytics(stageId);
  };

  const handleRegionSelect = (regionName) => {
    setSelectedRegion(regionName);
    fetchRegionAnalytics(regionName);
  };

  const exportData = (type) => {
    let data = {};
    let filename = '';
    
    switch (type) {
      case 'overview':
        data = analyticsData;
        filename = 'analytics_overview.json';
        break;
      case 'stages':
        data = stageAnalytics;
        filename = 'stages_analytics.json';
        break;
      case 'regions':
        data = regionAnalytics;
        filename = 'regions_analytics.json';
        break;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
          <p className="text-gray-600 mt-2">تحليلات شاملة ومتقدمة للأداء والإحصائيات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportData('overview')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 تصدير البيانات
          </button>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', name: 'نظرة عامة', icon: '📊' },
            { id: 'stages', name: 'تحليل المراحل', icon: '🎓' },
            { id: 'regions', name: 'تحليل المحافظات', icon: '🗺️' },
            { id: 'schools', name: 'أفضل المدارس', icon: '🏆' },
            { id: 'trends', name: 'الاتجاهات', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="ml-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">إجمالي الطلاب</p>
                    <p className="text-3xl font-bold">{analyticsData?.overview?.total_students?.toLocaleString('ar-SA') || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">👥</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">المراحل النشطة</p>
                    <p className="text-3xl font-bold">{analyticsData?.overview?.total_stages || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">🎓</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">المحافظات</p>
                    <p className="text-3xl font-bold">{analyticsData?.regions?.length || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">🗺️</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">أفضل المدارس</p>
                    <p className="text-3xl font-bold">{analyticsData?.top_schools?.length || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">🏆</div>
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 ملخص سريع</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-bold text-gray-900 mb-1">متوسط الأداء</h4>
                  <p className="text-sm text-gray-600">
                    {analyticsData?.stages?.length > 0 
                      ? Math.round(analyticsData.stages.reduce((sum, s) => sum + s.average_score, 0) / analyticsData.stages.length)
                      : 0}%
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🏆</div>
                  <h4 className="font-bold text-gray-900 mb-1">أعلى مرحلة</h4>
                  <p className="text-sm text-gray-600">
                    {analyticsData?.stages?.sort((a, b) => b.average_score - a.average_score)[0]?.stage_name || 'غير متاح'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-bold text-gray-900 mb-1">معدل النجاح</h4>
                  <p className="text-sm text-gray-600">
                    {analyticsData?.overview?.total_students > 0 
                      ? Math.round((analyticsData.stages?.reduce((sum, s) => sum + (s.total_students * (s.average_score >= 60 ? 1 : 0)), 0) / analyticsData.overview.total_students) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'stages' && (
          <div className="space-y-6">
            {/* Stage Selector */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎓 اختر مرحلة تعليمية للتحليل التفصيلي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData?.stages?.map((stage) => (
                  <button
                    key={stage.stage_id}
                    onClick={() => handleStageSelect(stage.stage_id)}
                    className={`p-4 border-2 rounded-lg transition-all duration-300 text-right ${
                      selectedStage === stage.stage_id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{stage.stage_icon}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">{stage.average_score}%</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{stage.stage_name}</h4>
                    <p className="text-sm text-gray-600">{stage.total_students} طالب</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Details */}
            {selectedStage && stageAnalytics[selectedStage] && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    📊 تحليل تفصيلي: {stageAnalytics[selectedStage].stage_info.name}
                  </h3>
                  <button
                    onClick={() => exportData('stages')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    📊 تصدير
                  </button>
                </div>

                {/* Stage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-xl font-bold text-gray-900">{stageAnalytics[selectedStage].statistics.total_students}</div>
                    <div className="text-sm text-gray-600">إجمالي الطلاب</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-xl font-bold text-blue-600">{stageAnalytics[selectedStage].statistics.average_score}%</div>
                    <div className="text-sm text-gray-600">المتوسط العام</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="text-xl font-bold text-green-600">{stageAnalytics[selectedStage].statistics.highest_score}%</div>
                    <div className="text-sm text-gray-600">أعلى درجة</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl mb-2">⚠️</div>
                    <div className="text-xl font-bold text-red-600">{stageAnalytics[selectedStage].statistics.lowest_score}%</div>
                    <div className="text-sm text-gray-600">أقل درجة</div>
                  </div>
                </div>

                {/* Grade Distribution */}
                {stageAnalytics[selectedStage].grade_distribution && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-4">📈 توزيع التقديرات</h4>
                    <div className="space-y-3">
                      {stageAnalytics[selectedStage].grade_distribution.map((grade, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium text-gray-700">{grade.grade}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                              style={{ width: `${grade.percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-16 text-sm text-gray-600 text-left">
                            {grade.count} ({grade.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Schools in Stage */}
                {stageAnalytics[selectedStage].top_schools && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4">🏫 أفضل المدارس في هذه المرحلة</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">المرتبة</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">المدرسة</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">المحافظة</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">عدد الطلاب</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">المتوسط</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {stageAnalytics[selectedStage].top_schools.slice(0, 10).map((school, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{school.school_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{school.region}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{school.total_students}</td>
                              <td className="px-4 py-2 text-sm font-bold text-blue-600">{school.average_score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'regions' && (
          <div className="space-y-6">
            {/* Region Selector */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🗺️ اختر محافظة للتحليل التفصيلي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData?.regions?.slice(0, 12).map((region) => (
                  <button
                    key={region.region_name}
                    onClick={() => handleRegionSelect(region.region_name)}
                    className={`p-4 border-2 rounded-lg transition-all duration-300 text-right ${
                      selectedRegion === region.region_name 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🏛️</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">{region.average_score}%</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{region.region_name}</h4>
                    <p className="text-sm text-gray-600">{region.total_students} طالب</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Region Details */}
            {selectedRegion && regionAnalytics[selectedRegion] && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    🗺️ تحليل تفصيلي: {regionAnalytics[selectedRegion].region_info.name}
                  </h3>
                  <button
                    onClick={() => exportData('regions')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    📊 تصدير
                  </button>
                </div>

                {/* Region Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-xl font-bold text-gray-900">{regionAnalytics[selectedRegion].region_info.total_students}</div>
                    <div className="text-sm text-gray-600">إجمالي الطلاب</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-xl font-bold text-green-600">{regionAnalytics[selectedRegion].statistics.average_score}%</div>
                    <div className="text-sm text-gray-600">المتوسط العام</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">🏫</div>
                    <div className="text-xl font-bold text-blue-600">{regionAnalytics[selectedRegion].top_schools?.length || 0}</div>
                    <div className="text-sm text-gray-600">عدد المدارس</div>
                  </div>
                </div>

                {/* Stages Performance in Region */}
                {regionAnalytics[selectedRegion].stages_performance && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-900 mb-4">🎓 أداء المراحل في المحافظة</h4>
                    <div className="space-y-3">
                      {regionAnalytics[selectedRegion].stages_performance.map((stage, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">{stage.stage_icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{stage.stage_name}</div>
                            <div className="text-sm text-gray-600">{stage.total_students} طالب</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{stage.average_score}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'schools' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">🏆 أفضل المدارس على مستوى الجمهورية</h3>
              <button
                onClick={() => exportData('overview')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                📊 تصدير القائمة
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المرتبة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المدرسة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المحافظة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المرحلة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">عدد الطلاب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المتوسط</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">التقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData?.top_schools?.map((school, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{school.school_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{school.region}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {analyticsData.stages.find(s => s.stage_id === school.stage_id)?.stage_name || 'غير محدد'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{school.total_students}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">{school.average_score}%</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          school.average_score >= 90 ? 'bg-green-100 text-green-800' :
                          school.average_score >= 80 ? 'bg-blue-100 text-blue-800' :
                          school.average_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {school.average_score >= 90 ? 'ممتاز' :
                           school.average_score >= 80 ? 'جيد جداً' :
                           school.average_score >= 70 ? 'جيد' : 'مقبول'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">📈 تحليل الاتجاهات والتوقعات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Trends */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-3">📊 اتجاهات الأداء</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">متوسط الأداء العام</span>
                    <span className="font-bold text-blue-600">
                      {analyticsData?.stages?.length > 0 
                        ? Math.round(analyticsData.stages.reduce((sum, s) => sum + s.average_score, 0) / analyticsData.stages.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">معدل النجاح التقديري</span>
                    <span className="font-bold text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">المدارس عالية الأداء</span>
                    <span className="font-bold text-purple-600">
                      {analyticsData?.top_schools?.filter(s => s.average_score >= 85).length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-3">💡 توصيات للتحسين</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>تركيز الدعم على المحافظات ذات الأداء المنخفض</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>تطبيق أفضل الممارسات من المدارس المتميزة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    <span>تطوير برامج دعم للطلاب في المراحل الضعيفة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>زيادة الاستثمار في التدريب والتطوير</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;