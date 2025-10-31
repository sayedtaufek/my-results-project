import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون حاسبة الدرجات
const CalculatorPage = ({ onBack }) => {
  const [subjects, setSubjects] = useState([
    { name: 'اللغة العربية', score: '', max_score: 100, weight: 1.0 },
    { name: 'اللغة الإنجليزية', score: '', max_score: 100, weight: 1.0 },
    { name: 'الرياضيات', score: '', max_score: 100, weight: 1.0 }
  ]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState([]);

  useEffect(() => {
    // تحديث Meta Tags
    document.title = 'حاسبة الدرجات والنسب المئوية - نظام الاستعلام الذكي';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'احسب درجاتك ونسبتك المئوية والتقدير بسهولة باستخدام حاسبة الدرجات المتقدمة');
    }

    // جلب الحسابات المحفوظة من التخزين المحلي
    const saved = localStorage.getItem('saved_calculations');
    if (saved) {
      setSavedCalculations(JSON.parse(saved));
    }
  }, []);

  const addSubject = () => {
    setSubjects([...subjects, { name: '', score: '', max_score: 100, weight: 1.0 }]);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const calculateGrades = async () => {
    // التحقق من صحة البيانات
    const validSubjects = subjects.filter(subject => 
      subject.name.trim() && 
      subject.score !== '' && 
      subject.max_score !== '' &&
      !isNaN(subject.score) &&
      !isNaN(subject.max_score) &&
      parseFloat(subject.score) >= 0 &&
      parseFloat(subject.max_score) > 0 &&
      parseFloat(subject.score) <= parseFloat(subject.max_score)
    ).map(subject => ({
      name: subject.name.trim(),
      score: parseFloat(subject.score),
      max_score: parseFloat(subject.max_score),
      weight: parseFloat(subject.weight) || 1.0
    }));

    if (validSubjects.length === 0) {
      alert('يرجى إدخال بيانات صحيحة لمادة واحدة على الأقل');
      return;
    }

    setIsCalculating(true);
    
    try {
      console.log('إرسال البيانات:', { subjects: validSubjects });
      const response = await axios.post(`${API}/calculator/grade`, { subjects: validSubjects });
      console.log('استجابة الخادم:', response.data);
      setResults(response.data);
    } catch (error) {
      console.error('خطأ مفصل في حساب الدرجات:', error);
      console.error('استجابة الخطأ:', error.response);
      console.error('بيانات الخطأ:', error.response?.data);
      
      let errorMessage = 'حدث خطأ غير متوقع أثناء حساب الدرجات';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg || e.message || e).join(', ');
        } else {
          errorMessage = 'خطأ في التحقق من صحة البيانات';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status) {
        errorMessage = `خطأ في الخادم (${error.response.status}): ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('خطأ في الحساب: ' + errorMessage);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveCalculation = () => {
    if (!results) return;

    const calculation = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ar-SA'),
      subjects: subjects.filter(s => s.name.trim() && s.score !== ''),
      results: results
    };

    const newSaved = [calculation, ...savedCalculations.slice(0, 9)]; // حفظ آخر 10 حسابات
    setSavedCalculations(newSaved);
    localStorage.setItem('saved_calculations', JSON.stringify(newSaved));
    alert('تم حفظ الحساب بنجاح!');
  };

  const loadCalculation = (calculation) => {
    setSubjects(calculation.subjects);
    setResults(calculation.results);
  };

  const deleteCalculation = (id) => {
    const newSaved = savedCalculations.filter(calc => calc.id !== id);
    setSavedCalculations(newSaved);
    localStorage.setItem('saved_calculations', JSON.stringify(newSaved));
  };

  const resetCalculator = () => {
    setSubjects([
      { name: 'اللغة العربية', score: '', max_score: 100, weight: 1.0 },
      { name: 'اللغة الإنجليزية', score: '', max_score: 100, weight: 1.0 },
      { name: 'الرياضيات', score: '', max_score: 100, weight: 1.0 }
    ]);
    setResults(null);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (grade) => {
    switch (grade) {
      case 'ممتاز': return 'bg-green-100 text-green-800 border-green-200';
      case 'جيد جداً': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'جيد': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'مقبول': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
            >
              ← العودة للصفحة الرئيسية
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">🧮 حاسبة الدرجات</h1>
              <p className="text-sm text-gray-600">احسب درجاتك ونسبتك المئوية والتقدير</p>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">🎯 احسب نتائجك بدقة</h2>
          <p className="text-xl mb-8">أداة ذكية لحساب الدرجات والنسب المئوية والتقديرات</p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold">حساب فوري</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="text-2xl mb-2">💾</div>
              <div className="font-bold">حفظ النتائج</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bold">تحليل تفصيلي</div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📝 إدخال الدرجات</h2>
                <div className="flex gap-2">
                  <button
                    onClick={addSubject}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    + إضافة مادة
                  </button>
                  <button
                    onClick={resetCalculator}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🔄 إعادة تعيين
                  </button>
                </div>
              </div>

              {/* Subjects Input */}
              <div className="space-y-4 mb-6">
                {subjects.map((subject, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">اسم المادة</label>
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubject(index, 'name', e.target.value)}
                        placeholder="مثل: الرياضيات"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة المحصلة</label>
                      <input
                        type="number"
                        value={subject.score}
                        onChange={(e) => updateSubject(index, 'score', e.target.value)}
                        placeholder="85"
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة الكلية</label>
                      <input
                        type="number"
                        value={subject.max_score}
                        onChange={(e) => updateSubject(index, 'max_score', e.target.value)}
                        placeholder="100"
                        min="1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الوزن</label>
                      <input
                        type="number"
                        value={subject.weight}
                        onChange={(e) => updateSubject(index, 'weight', e.target.value)}
                        placeholder="1.0"
                        min="0.1"
                        max="10"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => removeSubject(index)}
                        disabled={subjects.length <= 1}
                        className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateGrades}
                disabled={isCalculating}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
              >
                {isCalculating ? 'جاري الحساب...' : '🧮 احسب النتائج'}
              </button>

              {/* Results Section */}
              {results && (
                <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">📊 النتائج</h3>
                    <button
                      onClick={saveCalculation}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      💾 حفظ الحساب
                    </button>
                  </div>

                  {/* Overall Results */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.total_score}
                      </div>
                      <div className="text-sm text-gray-600">المجموع المحصل</div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {results.max_total || results.total_max_score || 0}
                      </div>
                      <div className="text-sm text-gray-600">المجموع الكلي</div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl text-center">
                      <div className={`text-2xl font-bold ${getGradeColor(results.average || results.overall_percentage || 0)}`}>
                        {results.average || results.overall_percentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">النسبة المئوية</div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${getGradeBgColor(results.grade)}`}>
                        {results.grade}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">التقدير</div>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="bg-white p-4 rounded-xl mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">نسبة النجاح</span>
                      <span className={`font-bold ${getGradeColor(results.success_rate)}`}>
                        {results.success_rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          results.success_rate >= 80 ? 'bg-green-500' :
                          results.success_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${results.success_rate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Subject Details */}
                  <div className="bg-white p-4 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-4">تفاصيل المواد</h4>
                    <div className="space-y-3">
                      {results.subjects.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{subject.name}</div>
                            {subject.weight && subject.weight !== 1.0 && (
                              <div className="text-xs text-gray-500">وزن: {subject.weight}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                              {subject.score}/{subject.max_score}
                            </span>
                            <span className={`font-bold ${getGradeColor(subject.percentage)}`}>
                              {subject.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 نصائح الاستخدام</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="text-purple-500">✓</span>
                  <p>أدخل أسماء المواد ودرجاتها الصحيحة</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500">✓</span>
                  <p>يمكنك إضافة أو حذف المواد حسب الحاجة</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-500">✓</span>
                  <p>يمكنك تعيين أوزان مختلفة للمواد حسب أهميتها</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500">✓</span>
                  <p>الوزن الافتراضي = 1.0، استخدم أوزان أعلى للمواد الأهم</p>
                </div>
              </div>
            </div>

            {/* Grade Scale */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 سلم التقديرات</h3>
              <div className="space-y-3">
                {[
                  { grade: 'ممتاز', range: '90% - 100%', color: 'bg-green-100 text-green-800' },
                  { grade: 'جيد جداً', range: '80% - 89%', color: 'bg-blue-100 text-blue-800' },
                  { grade: 'جيد', range: '70% - 79%', color: 'bg-yellow-100 text-yellow-800' },
                  { grade: 'مقبول', range: '60% - 69%', color: 'bg-orange-100 text-orange-800' },
                  { grade: 'ضعيف', range: 'أقل من 60%', color: 'bg-red-100 text-red-800' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${item.color}`}>
                      {item.grade}
                    </span>
                    <span className="text-sm text-gray-600">{item.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Calculations */}
            {savedCalculations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📚 الحسابات المحفوظة</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {savedCalculations.map((calc) => (
                    <div key={calc.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {calc.results.overall_percentage}% - {calc.results.grade}
                        </span>
                        <span className="text-xs text-gray-500">{calc.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadCalculation(calc)}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-colors"
                        >
                          تحميل
                        </button>
                        <button
                          onClick={() => deleteCalculation(calc.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalculatorPage;