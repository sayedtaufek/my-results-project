import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// مكون إدارة الصفحة الرئيسية
const HomepageBuilder = ({ adminToken }) => {
  const [blocks, setBlocks] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [blockTemplates, setBlockTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blocks');
  const [showCreateBlock, setShowCreateBlock] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // بيانات النموذج
  const [blockForm, setBlockForm] = useState({
    block_type: 'hero',
    title: '',
    subtitle: '',
    content: {},
    settings: {},
    is_visible: true,
    section: 'main'
  });

  const [settingsForm, setSettingsForm] = useState({
    site_name: '',
    site_description: '',
    site_keywords: '',
    logo_base64: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#F59E0B',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: '',
    telegram_url: '',
    whatsapp_number: ''
  });

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blocksRes, settingsRes, templatesRes] = await Promise.all([
        axios.get(`${API}/homepage/blocks`),
        axios.get(`${API}/site-settings`),
        axios.get(`${API}/admin/blocks/templates`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);

      setBlocks(blocksRes.data.blocks || []);
      setSiteSettings(settingsRes.data);
      setSettingsForm({
        site_name: settingsRes.data.site_name || '',
        site_description: settingsRes.data.site_description || '',
        site_keywords: settingsRes.data.site_keywords || '',
        logo_base64: settingsRes.data.logo_base64 || '',
        primary_color: settingsRes.data.primary_color || '#3B82F6',
        secondary_color: settingsRes.data.secondary_color || '#1E40AF',
        accent_color: settingsRes.data.accent_color || '#F59E0B',
        contact_email: settingsRes.data.contact_email || '',
        contact_phone: settingsRes.data.contact_phone || '',
        contact_address: settingsRes.data.contact_address || '',
        facebook_url: settingsRes.data.facebook_url || '',
        twitter_url: settingsRes.data.twitter_url || '',
        instagram_url: settingsRes.data.instagram_url || '',
        youtube_url: settingsRes.data.youtube_url || '',
        telegram_url: settingsRes.data.telegram_url || '',
        whatsapp_number: settingsRes.data.whatsapp_number || ''
      });
      setBlockTemplates(templatesRes.data.templates || {});
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedBlock] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedBlock);

    setBlocks(newBlocks);

    // حفظ الترتيب الجديد
    try {
      const blockIds = newBlocks.map(block => block.id);
      await axios.put(
        `${API}/admin/homepage/blocks-order`,
        blockIds,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (error) {
      console.error('خطأ في حفظ الترتيب:', error);
      alert('خطأ في حفظ ترتيب البلوكات');
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API}/admin/blocks`,
        blockForm,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setBlocks([...blocks, response.data]);
      setShowCreateBlock(false);
      resetBlockForm();
      alert('تم إنشاء البلوك بنجاح!');
    } catch (error) {
      console.error('خطأ في إنشاء البلوك:', error);
      alert(error.response?.data?.detail || 'خطأ في إنشاء البلوك');
    }
  };

  const handleUpdateBlock = async (blockId, updates) => {
    try {
      const response = await axios.put(
        `${API}/admin/blocks/${blockId}`,
        updates,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setBlocks(blocks.map(block => 
        block.id === blockId ? response.data : block
      ));
    } catch (error) {
      console.error('خطأ في تحديث البلوك:', error);
      alert('خطأ في تحديث البلوك');
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البلوك؟')) return;

    try {
      await axios.delete(`${API}/admin/blocks/${blockId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      setBlocks(blocks.filter(block => block.id !== blockId));
      alert('تم حذف البلوك بنجاح!');
    } catch (error) {
      console.error('خطأ في حذف البلوك:', error);
      alert('خطأ في حذف البلوك');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API}/admin/site-settings`,
        settingsForm,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      setSiteSettings(response.data);
      alert('تم حفظ إعدادات الموقع بنجاح!');
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      alert('خطأ في حفظ الإعدادات');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('حجم الصورة كبير جداً. يجب أن يكون أقل من 2 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSettingsForm(prev => ({
          ...prev,
          logo_base64: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBlockForm = () => {
    setBlockForm({
      block_type: 'hero',
      title: '',
      subtitle: '',
      content: {},
      settings: {},
      is_visible: true,
      section: 'main'
    });
  };

  const toggleBlockVisibility = async (blockId, isVisible) => {
    await handleUpdateBlock(blockId, { is_visible: !isVisible });
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
          <h2 className="text-3xl font-bold text-gray-900">🎨 مطور الصفحة الرئيسية</h2>
          <p className="text-gray-600 mt-2">تخصيص كامل للصفحة الرئيسية بنظام السحب والإفلات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              previewMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {previewMode ? '👁️ معاينة' : '✏️ تحرير'}
          </button>
          <button
            onClick={() => setShowCreateBlock(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ➕ إضافة بلوك
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'blocks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🧩 البلوكات ({blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ إعدادات الموقع
          </button>
        </div>

        {/* Blocks Tab */}
        {activeTab === 'blocks' && (
          <div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">🔔 اسحب البلوكات وأفلتها لتغيير ترتيبها</p>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-4 min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {blocks.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🧩</div>
                          <p className="text-gray-500 text-lg">لا توجد بلوكات</p>
                          <button
                            onClick={() => setShowCreateBlock(true)}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            إنشاء أول بلوك
                          </button>
                        </div>
                      ) : (
                        blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white border rounded-lg p-4 transition-all ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg rotate-2' 
                                    : 'shadow-sm hover:shadow-md'
                                } ${block.is_visible ? '' : 'opacity-50'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="text-2xl cursor-grab hover:cursor-grabbing"
                                      >
                                        {blockTemplates[block.block_type]?.icon || '🧩'}
                                      </div>
                                      <div>
                                        <h3 className="font-bold text-gray-900">
                                          {block.title || blockTemplates[block.block_type]?.name || block.block_type}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                          {blockTemplates[block.block_type]?.description || 'بلوك مخصص'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {block.subtitle && (
                                      <p className="text-sm text-gray-600 mt-1">{block.subtitle}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleBlockVisibility(block.id, block.is_visible)}
                                      className={`px-3 py-1 text-xs rounded transition-colors ${
                                        block.is_visible
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {block.is_visible ? '👁️ مرئي' : '🙈 مخفي'}
                                    </button>
                                    
                                    <button
                                      onClick={() => setEditingBlock(block)}
                                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      ✏️ تعديل
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteBlock(block.id)}
                                      className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors"
                                    >
                                      🗑️ حذف
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Block Statistics */}
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex gap-4 text-xs text-gray-500">
                                    <span>📱 نوع: {block.block_type}</span>
                                    <span>📍 قسم: {block.section}</span>
                                    <span>📊 ترتيب: {index + 1}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Basic Site Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📝 معلومات الموقع الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموقع</label>
                  <input
                    type="text"
                    value={settingsForm.site_name}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, site_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="نظام الاستعلام الذكي"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={settingsForm.contact_email}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف الموقع</label>
                <textarea
                  value={settingsForm.site_description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, site_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف موجز للموقع..."
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الكلمات المفتاحية</label>
                <input
                  type="text"
                  value={settingsForm.site_keywords}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, site_keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="نتائج، امتحانات، تعليم، طلاب"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🖼️ لوجو الموقع</h3>
              <div className="flex items-center gap-4">
                {settingsForm.logo_base64 && (
                  <div className="w-20 h-20 bg-white border border-gray-300 rounded-lg p-2">
                    <img
                      src={settingsForm.logo_base64}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">يُفضل صورة مربعة بحجم أقل من 2 ميجابايت</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎨 ألوان الموقع</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللون الأساسي</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.primary_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="color"
                      value={settingsForm.primary_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللون الثانوي</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.secondary_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="color"
                      value={settingsForm.secondary_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">لون التمييز</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.accent_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="color"
                      value={settingsForm.accent_color}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📞 معلومات التواصل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={settingsForm.contact_phone}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+20 100 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">واتساب</label>
                  <input
                    type="tel"
                    value={settingsForm.whatsapp_number}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+20 100 123 4567"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <textarea
                  value={settingsForm.contact_address}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, contact_address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="العنوان الكامل..."
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📱 وسائل التواصل الاجتماعي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📘 فيسبوك</label>
                  <input
                    type="url"
                    value={settingsForm.facebook_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/page"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🐦 تويتر</label>
                  <input
                    type="url"
                    value={settingsForm.twitter_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, twitter_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📷 إنستجرام</label>
                  <input
                    type="url"
                    value={settingsForm.instagram_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, instagram_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📺 يوتيوب</label>
                  <input
                    type="url"
                    value={settingsForm.youtube_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, youtube_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/channel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">✈️ تيليجرام</label>
                  <input
                    type="url"
                    value={settingsForm.telegram_url}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, telegram_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://t.me/channel"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                💾 حفظ الإعدادات
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Create Block Modal */}
      {showCreateBlock && (
        <CreateBlockModal
          blockTemplates={blockTemplates}
          blockForm={blockForm}
          setBlockForm={setBlockForm}
          onSubmit={handleCreateBlock}
          onClose={() => {
            setShowCreateBlock(false);
            resetBlockForm();
          }}
        />
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <EditBlockModal
          block={editingBlock}
          blockTemplates={blockTemplates}
          onUpdate={(updates) => {
            handleUpdateBlock(editingBlock.id, updates);
            setEditingBlock(null);
          }}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
};

// Modal إنشاء بلوك جديد
const CreateBlockModal = ({ blockTemplates, blockForm, setBlockForm, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">➕ إنشاء بلوك جديد</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✖️
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع البلوك</label>
              <select
                value={blockForm.block_type}
                onChange={(e) => setBlockForm(prev => ({ ...prev, block_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(blockTemplates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
              {blockTemplates[blockForm.block_type] && (
                <p className="text-sm text-gray-500 mt-1">
                  {blockTemplates[blockForm.block_type].description}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
              <input
                type="text"
                value={blockForm.title}
                onChange={(e) => setBlockForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="عنوان البلوك"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الفرعي</label>
              <input
                type="text"
                value={blockForm.subtitle}
                onChange={(e) => setBlockForm(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="عنوان فرعي (اختياري)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
              <select
                value={blockForm.section}
                onChange={(e) => setBlockForm(prev => ({ ...prev, section: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="main">المحتوى الرئيسي</option>
                <option value="sidebar">الشريط الجانبي</option>
                <option value="footer">تذييل الصفحة</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_visible"
                checked={blockForm.is_visible}
                onChange={(e) => setBlockForm(prev => ({ ...prev, is_visible: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_visible" className="text-sm text-gray-700">
                مرئي في الموقع
              </label>
            </div>
            
            <div className="flex justify-end space-x-reverse space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إنشاء البلوك
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal تحرير البلوك
const EditBlockModal = ({ block, blockTemplates, onUpdate, onClose }) => {
  const [editForm, setEditForm] = useState({
    title: block.title || '',
    subtitle: block.subtitle || '',
    is_visible: block.is_visible || true,
    content: block.content || {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(editForm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              ✏️ تعديل البلوك: {blockTemplates[block.block_type]?.name || block.block_type}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✖️
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الفرعي</label>
              <input
                type="text"
                value={editForm.subtitle}
                onChange={(e) => setEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit_is_visible"
                checked={editForm.is_visible}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_visible: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="edit_is_visible" className="text-sm text-gray-700">
                مرئي في الموقع
              </label>
            </div>
            
            <div className="flex justify-end space-x-reverse space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomepageBuilder;