import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة الإشعارات
const NotificationManagement = ({ adminToken }) => {
  const [notifications, setNotifications] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersStats, setSubscribersStats] = useState({});
  const [activeTab, setActiveTab] = useState('subscribers');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    notification_type: 'custom',
    priority: 'normal',
    target_audience: 'all',
    target_stage: '',
    target_region: '',
    send_immediately: true,
    scheduled_send_time: '',
    email_template: 'default'
  });

  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
      fetchSubscribersStats();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, adminToken]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/subscribers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSubscribers(response.data);
    } catch (error) {
      console.error('خطأ في جلب المشتركين:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribersStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/subscribers/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSubscribersStats(response.data);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المشتركين:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotification) {
        // تحديث إشعار موجود
        await axios.put(
          `${API}/admin/notifications/${editingNotification.id}`,
          formData,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        alert('تم تحديث الإشعار بنجاح!');
      } else {
        // إنشاء إشعار جديد
        await axios.post(
          `${API}/admin/notifications`,
          formData,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        alert('تم إنشاء الإشعار بنجاح!');
      }
      
      setShowCreateForm(false);
      setEditingNotification(null);
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error('خطأ في حفظ الإشعار:', error);
      alert(error.response?.data?.detail || 'خطأ في حفظ الإشعار');
    }
  };

  const handleSendNotification = async (notificationId) => {
    if (!window.confirm('هل أنت متأكد من إرسال هذا الإشعار؟')) return;
    
    try {
      await axios.post(
        `${API}/admin/notifications/${notificationId}/send`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      alert('بدأ إرسال الإشعار للمشتركين!');
      fetchNotifications();
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      alert(error.response?.data?.detail || 'خطأ في إرسال الإشعار');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    
    try {
      await axios.delete(`${API}/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف الإشعار بنجاح!');
      fetchNotifications();
    } catch (error) {
      console.error('خطأ في حذف الإشعار:', error);
      alert(error.response?.data?.detail || 'خطأ في حذف الإشعار');
    }
  };

  const handleDeleteSubscriber = async (subscriberId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;
    
    try {
      await axios.delete(`${API}/admin/subscribers/${subscriberId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      alert('تم حذف المشترك بنجاح!');
      fetchSubscribers();
      fetchSubscribersStats();
    } catch (error) {
      console.error('خطأ في حذف المشترك:', error);
      alert('خطأ في حذف المشترك');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      notification_type: 'custom',
      priority: 'normal',
      target_audience: 'all',
      target_stage: '',
      target_region: '',
      send_immediately: true,
      scheduled_send_time: '',
      email_template: 'default'
    });
  };

  const editNotification = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      content: notification.content,
      summary: notification.summary,
      notification_type: notification.notification_type,
      priority: notification.priority,
      target_audience: notification.target_audience,
      target_stage: notification.target_stage || '',
      target_region: notification.target_region || '',
      send_immediately: notification.send_immediately,
      scheduled_send_time: notification.scheduled_send_time || '',
      email_template: notification.email_template
    });
    setShowCreateForm(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'sending': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
          <h2 className="text-3xl font-bold text-gray-900">🔔 إدارة الإشعارات</h2>
          <p className="text-gray-600 mt-2">إدارة المشتركين وإرسال الإشعارات</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingNotification(null);
            resetForm();
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          ➕ إنشاء إشعار جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'subscribers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 المشتركين ({subscribersStats.total_subscribers || 0})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📬 الإشعارات ({notifications.length})
          </button>
        </div>

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">إجمالي المشتركين</p>
                    <p className="text-3xl font-bold">{subscribersStats.total_subscribers || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">👥</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">مشتركين نشطين</p>
                    <p className="text-3xl font-bold">{subscribersStats.active_subscribers || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">✅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">مشتركين مفعلين</p>
                    <p className="text-3xl font-bold">{subscribersStats.verified_subscribers || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">🛡️</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">غير نشطين</p>
                    <p className="text-3xl font-bold">{subscribersStats.inactive_subscribers || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">😴</div>
                </div>
              </div>
            </div>

            {/* Subscribers List */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشترك</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المرحلة والمحافظة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الاشتراك</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subscriber.name}</div>
                            <div className="text-sm text-gray-500">{subscriber.email}</div>
                            {subscriber.phone && (
                              <div className="text-xs text-gray-400">{subscriber.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {subscriber.educational_stage && (
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mb-1">
                                {subscriber.educational_stage}
                              </div>
                            )}
                            {subscriber.region && (
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {subscriber.region}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscriber.subscription_date).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-reverse space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              subscriber.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subscriber.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                            {subscriber.is_verified && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                مفعل
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            {/* Notifications List */}
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    إنشاء أول إشعار
                  </button>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{notification.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'urgent' ? '🚨 عاجل' : 
                             notification.priority === 'high' ? '🔥 مهم' : 
                             notification.priority === 'normal' ? '📋 عادي' : '📝 منخفض'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(notification.status)}`}>
                            {notification.status === 'sent' ? '✅ تم الإرسال' :
                             notification.status === 'sending' ? '⏳ جاري الإرسال' :
                             notification.status === 'scheduled' ? '⏰ مجدول' :
                             notification.status === 'draft' ? '📝 مسودة' : '❌ فشل'}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {notification.target_audience === 'all' ? '👥 الجميع' :
                             notification.target_audience === 'stage' ? '🎓 مرحلة محددة' :
                             notification.target_audience === 'region' ? '🗺️ محافظة محددة' : '👤 مخصص'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-reverse space-x-2">
                        {notification.status === 'draft' && (
                          <>
                            <button
                              onClick={() => editNotification(notification)}
                              className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-sm"
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              onClick={() => handleSendNotification(notification.id)}
                              className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors text-sm"
                            >
                              📤 إرسال
                            </button>
                          </>
                        )}
                        {(notification.status === 'draft' || notification.status === 'failed') && (
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            🗑️ حذف
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {notification.status === 'sent' && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-700">✅ تم الإرسال إلى {notification.sent_count} مشترك</span>
                          <span className="text-gray-500">{new Date(notification.sent_at).toLocaleString('ar-SA')}</span>
                        </div>
                        {notification.failed_count > 0 && (
                          <div className="text-red-600 text-sm mt-1">
                            ❌ فشل في إرسال {notification.failed_count} إشعار
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Notification Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingNotification ? '✏️ تعديل الإشعار' : '➕ إنشاء إشعار جديد'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✖️
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="عنوان الإشعار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الملخص</label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ملخص قصير للإشعار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="محتوى الإشعار"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإشعار</label>
                    <select
                      value={formData.notification_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, notification_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="new_results">نتائج جديدة</option>
                      <option value="system_update">تحديث النظام</option>
                      <option value="educational_content">محتوى تعليمي</option>
                      <option value="emergency">إشعار طوارئ</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">منخفض</option>
                      <option value="normal">عادي</option>
                      <option value="high">مهم</option>
                      <option value="urgent">عاجل</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الجمهور المستهدف</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع المشتركين</option>
                    <option value="stage">مرحلة تعليمية محددة</option>
                    <option value="region">محافظة محددة</option>
                    <option value="custom">مشتركين مخصصين</option>
                  </select>
                </div>
                
                {formData.target_audience === 'stage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة التعليمية</label>
                    <input
                      type="text"
                      value={formData.target_stage}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_stage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثل: الثانوية العامة"
                    />
                  </div>
                )}
                
                {formData.target_audience === 'region' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                    <input
                      type="text"
                      value={formData.target_region}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_region: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثل: القاهرة"
                    />
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="send_immediately"
                    checked={formData.send_immediately}
                    onChange={(e) => setFormData(prev => ({ ...prev, send_immediately: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="send_immediately" className="text-sm text-gray-700">
                    إرسال فوري
                  </label>
                </div>
                
                <div className="flex justify-end space-x-reverse space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingNotification(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingNotification ? 'تحديث الإشعار' : 'إنشاء الإشعار'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;