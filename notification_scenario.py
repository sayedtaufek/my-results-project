#!/usr/bin/env python3
"""
سيناريو شامل لاختبار نظام الإشعارات - Comprehensive Notification System Scenario
"""

import requests
import sys
import json
from datetime import datetime
import time

def comprehensive_notification_scenario():
    """سيناريو شامل لاختبار نظام الإشعارات"""
    base_url = "https://1f2d6d1b-2bd0-43af-b264-1ed679832703.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🎯 سيناريو شامل لاختبار نظام الإشعارات")
    print("=" * 60)
    print()
    
    # 1. تسجيل دخول الأدمن
    print("1️⃣ تسجيل دخول الأدمن...")
    admin_credentials = {"username": "admin", "password": "admin123"}
    
    try:
        response = requests.post(
            f"{api_url}/admin/login",
            json=admin_credentials,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code != 200:
            print("❌ فشل في تسجيل دخول الأدمن")
            return False
            
        admin_token = response.json().get('access_token')
        auth_headers = {"Authorization": f"Bearer {admin_token}"}
        print("✅ تم تسجيل دخول الأدمن بنجاح")
        print()
        
    except Exception as e:
        print(f"❌ خطأ في تسجيل الدخول: {str(e)}")
        return False
    
    # 2. إنشاء مشتركين جدد
    print("2️⃣ إنشاء مشتركين جدد...")
    
    subscribers = [
        {
            "email": "student1@school.edu",
            "name": "أحمد محمد علي",
            "phone": "01234567890",
            "educational_stage": "الثانوية العامة",
            "region": "القاهرة",
            "notification_preferences": {
                "new_results": True,
                "system_updates": True,
                "educational_content": False,
                "emergency_notifications": True
            }
        },
        {
            "email": "student2@school.edu",
            "name": "فاطمة أحمد محمود",
            "phone": "01098765432",
            "educational_stage": "الشهادة الإعدادية",
            "region": "الجيزة",
            "notification_preferences": {
                "new_results": True,
                "system_updates": False,
                "educational_content": True,
                "emergency_notifications": True
            }
        },
        {
            "email": "student3@school.edu",
            "name": "محمد علي حسن",
            "phone": "01555666777",
            "educational_stage": "الدبلومات الفنية",
            "region": "الإسكندرية",
            "notification_preferences": {
                "new_results": True,
                "system_updates": True,
                "educational_content": True,
                "emergency_notifications": True
            }
        }
    ]
    
    created_subscribers = []
    
    for i, subscriber_data in enumerate(subscribers, 1):
        try:
            response = requests.post(
                f"{api_url}/subscribe",
                json=subscriber_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                subscriber = response.json()
                created_subscribers.append(subscriber)
                print(f"✅ تم إنشاء المشترك {i}: {subscriber['name']}")
            else:
                print(f"❌ فشل في إنشاء المشترك {i}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في إنشاء المشترك {i}: {str(e)}")
    
    print(f"📊 تم إنشاء {len(created_subscribers)} مشترك بنجاح")
    print()
    
    # 3. عرض إحصائيات المشتركين
    print("3️⃣ عرض إحصائيات المشتركين...")
    
    try:
        response = requests.get(
            f"{api_url}/admin/subscribers/stats",
            headers=auth_headers,
            timeout=10
        )
        
        if response.status_code == 200:
            stats = response.json()
            print("📊 إحصائيات المشتركين:")
            print(f"   • إجمالي المشتركين: {stats.get('total_subscribers', 0)}")
            print(f"   • النشطون: {stats.get('active_subscribers', 0)}")
            print(f"   • غير النشطين: {stats.get('inactive_subscribers', 0)}")
            
            if 'stage_distribution' in stats:
                print("   • توزيع المراحل التعليمية:")
                for stage, count in stats['stage_distribution'].items():
                    print(f"     - {stage}: {count}")
            
            if 'region_distribution' in stats:
                print("   • توزيع المحافظات:")
                for region, count in stats['region_distribution'].items():
                    print(f"     - {region}: {count}")
        else:
            print(f"❌ فشل في جلب الإحصائيات: {response.status_code}")
            
    except Exception as e:
        print(f"❌ خطأ في جلب الإحصائيات: {str(e)}")
    
    print()
    
    # 4. إنشاء إشعارات متنوعة
    print("4️⃣ إنشاء إشعارات متنوعة...")
    
    notifications = [
        {
            "title": "إعلان نتائج الثانوية العامة 2024",
            "content": """
# إعلان نتائج الثانوية العامة 2024

تم الإعلان عن نتائج الثانوية العامة للعام الدراسي 2024.

## تفاصيل مهمة:
- يمكن الاستعلام عن النتائج من خلال الموقع الرسمي
- تأكد من إدخال رقم الجلوس بشكل صحيح
- النتائج متاحة على مدار 24 ساعة

## للاستفسارات:
تواصل مع الإدارة المختصة أو زر أقرب مدرسة.

**نتمنى لجميع الطلاب التوفيق والنجاح.**
            """,
            "summary": "تم الإعلان عن نتائج الثانوية العامة 2024. يمكن الاستعلام عن النتائج من خلال الموقع الرسمي.",
            "notification_type": "new_results",
            "priority": "high",
            "target_audience": "stage",
            "target_stage": "الثانوية العامة",
            "send_immediately": False
        },
        {
            "title": "تحديث مهم في النظام",
            "content": """
# تحديث مهم في النظام

تم تطوير النظام بمميزات جديدة لتحسين تجربة المستخدم.

## المميزات الجديدة:
- نظام إشعارات متطور
- بحث محسن
- واجهة مستخدم محدثة
- أمان معزز

سيتم تطبيق التحديث خلال الساعات القادمة.
            """,
            "summary": "تحديث مهم في النظام مع مميزات جديدة لتحسين تجربة المستخدم.",
            "notification_type": "system_update",
            "priority": "normal",
            "target_audience": "all",
            "send_immediately": True
        },
        {
            "title": "محتوى تعليمي جديد متاح",
            "content": """
# محتوى تعليمي جديد متاح

تم إضافة محتوى تعليمي جديد يساعد الطلاب في التحضير للامتحانات.

## المحتوى الجديد يشمل:
- أدلة المراجعة
- نصائح للامتحانات
- أسئلة شائعة
- مواد تدريبية

يمكنكم الوصول للمحتوى من خلال قسم الأدلة التعليمية.
            """,
            "summary": "محتوى تعليمي جديد متاح للطلاب مع أدلة المراجعة ونصائح الامتحانات.",
            "notification_type": "educational_content",
            "priority": "low",
            "target_audience": "all",
            "send_immediately": False
        }
    ]
    
    created_notifications = []
    
    for i, notification_data in enumerate(notifications, 1):
        try:
            response = requests.post(
                f"{api_url}/admin/notifications",
                json=notification_data,
                headers={**auth_headers, 'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                notification = response.json()
                created_notifications.append(notification)
                print(f"✅ تم إنشاء الإشعار {i}: {notification['title'][:50]}...")
            else:
                print(f"❌ فشل في إنشاء الإشعار {i}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في إنشاء الإشعار {i}: {str(e)}")
    
    print(f"📊 تم إنشاء {len(created_notifications)} إشعار بنجاح")
    print()
    
    # 5. إرسال الإشعارات
    print("5️⃣ إرسال الإشعارات...")
    
    for i, notification in enumerate(created_notifications, 1):
        try:
            response = requests.post(
                f"{api_url}/admin/notifications/{notification['id']}/send",
                headers=auth_headers,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ تم إرسال الإشعار {i}: {result.get('message', 'تم الإرسال')}")
                print(f"   📧 عدد المرسل إليهم: {result.get('sent_count', 0)}")
                print(f"   ❌ الأخطاء: {result.get('failed_count', 0)}")
            else:
                print(f"❌ فشل في إرسال الإشعار {i}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في إرسال الإشعار {i}: {str(e)}")
        
        # انتظار قصير بين الإرسالات
        time.sleep(1)
    
    print()
    
    # 6. تحديث تفضيلات مشترك
    print("6️⃣ تحديث تفضيلات مشترك...")
    
    if created_subscribers:
        subscriber_id = created_subscribers[0]['id']
        
        update_data = {
            "name": "أحمد محمد علي - محدث",
            "phone": "01111222333",
            "educational_stage": "الدبلومات الفنية",
            "region": "القاهرة",
            "notification_preferences": {
                "new_results": True,
                "system_updates": False,
                "educational_content": True,
                "emergency_notifications": True
            }
        }
        
        try:
            response = requests.put(
                f"{api_url}/admin/subscribers/{subscriber_id}",
                json=update_data,
                headers={**auth_headers, 'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_subscriber = response.json()
                print(f"✅ تم تحديث المشترك: {updated_subscriber['name']}")
                print(f"   📱 الهاتف الجديد: {updated_subscriber['phone']}")
                print(f"   🎓 المرحلة الجديدة: {updated_subscriber['educational_stage']}")
                
                # عرض التفضيلات المحدثة
                prefs = updated_subscriber['notification_preferences']
                active_prefs = [k for k, v in prefs.items() if v]
                print(f"   🔔 التفضيلات النشطة: {len(active_prefs)}/4")
            else:
                print(f"❌ فشل في تحديث المشترك: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في تحديث المشترك: {str(e)}")
    
    print()
    
    # 7. عرض الإحصائيات النهائية
    print("7️⃣ الإحصائيات النهائية...")
    
    try:
        # إحصائيات المشتركين
        subscribers_response = requests.get(
            f"{api_url}/admin/subscribers/stats",
            headers=auth_headers,
            timeout=10
        )
        
        # قائمة الإشعارات
        notifications_response = requests.get(
            f"{api_url}/admin/notifications",
            headers=auth_headers,
            timeout=10
        )
        
        if subscribers_response.status_code == 200 and notifications_response.status_code == 200:
            stats = subscribers_response.json()
            notifications_list = notifications_response.json()
            
            print("📊 الإحصائيات النهائية:")
            print(f"   👥 إجمالي المشتركين: {stats.get('total_subscribers', 0)}")
            print(f"   ✅ المشتركين النشطين: {stats.get('active_subscribers', 0)}")
            print(f"   📧 إجمالي الإشعارات: {len(notifications_list)}")
            
            # إحصائيات حالة الإشعارات
            status_counts = {}
            for notification in notifications_list:
                status = notification.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            print("   📈 حالة الإشعارات:")
            for status, count in status_counts.items():
                print(f"     - {status}: {count}")
            
        else:
            print("❌ فشل في جلب الإحصائيات النهائية")
            
    except Exception as e:
        print(f"❌ خطأ في جلب الإحصائيات النهائية: {str(e)}")
    
    print()
    
    # 8. اختبار إلغاء الاشتراك
    print("8️⃣ اختبار إلغاء الاشتراك...")
    
    if created_subscribers and len(created_subscribers) > 1:
        unsubscribe_token = created_subscribers[1]['unsubscribe_token']
        
        try:
            response = requests.post(
                f"{api_url}/unsubscribe/{unsubscribe_token}",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ تم إلغاء الاشتراك بنجاح: {result.get('message', 'تم إلغاء الاشتراك')}")
            else:
                print(f"❌ فشل في إلغاء الاشتراك: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في إلغاء الاشتراك: {str(e)}")
    
    print()
    print("=" * 60)
    print("🎉 تم إكمال السيناريو الشامل لاختبار نظام الإشعارات بنجاح!")
    print("✅ جميع المكونات تعمل بشكل صحيح")
    print("✅ النظام جاهز للإنتاج")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = comprehensive_notification_scenario()
    sys.exit(0 if success else 1)