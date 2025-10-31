#!/usr/bin/env python3
"""
اختبار نظام الإشعارات - Notification System Testing
"""

import requests
import sys
import json
from datetime import datetime

class NotificationTester:
    def __init__(self, base_url="https://1f2d6d1b-2bd0-43af-b264-1ed679832703.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.admin_credentials = {"username": "admin", "password": "admin123"}
        self.test_subscriber_id = None
        self.test_notification_id = None
        self.test_unsubscribe_token = None

    def log_test(self, name, success, details=""):
        """تسجيل نتيجة الاختبار"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - نجح")
        else:
            print(f"❌ {name} - فشل")
        
        if details:
            print(f"   التفاصيل: {details}")
        print()

    def admin_login(self):
        """تسجيل دخول الأدمن للحصول على التوكن"""
        try:
            response = requests.post(
                f"{self.api_url}/admin/login",
                json=self.admin_credentials,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.admin_token = data.get('access_token')
                details = f"تم الحصول على التوكن بنجاح، ينتهي خلال: {data.get('expires_in', 0)} ثانية"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("تسجيل دخول الأدمن", success, details)
            return success
            
        except Exception as e:
            self.log_test("تسجيل دخول الأدمن", False, f"خطأ: {str(e)}")
            return False

    def get_auth_headers(self):
        """الحصول على headers المصادقة"""
        if not self.admin_token:
            return {}
        return {"Authorization": f"Bearer {self.admin_token}"}

    def test_public_subscribe(self):
        """اختبار الاشتراك العام في الإشعارات"""
        try:
            subscriber_data = {
                "email": "ahmed.student@example.com",
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
            }
            
            response = requests.post(
                f"{self.api_url}/subscribe",
                json=subscriber_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_subscriber_id = data.get('id')
                self.test_unsubscribe_token = data.get('unsubscribe_token')
                details = f"تم إنشاء المشترك: {data.get('name')}, الإيميل: {data.get('email')}, المعرف: {self.test_subscriber_id}"
                
                # التحقق من تفضيلات الإشعارات
                preferences = data.get('notification_preferences', {})
                active_prefs = sum(1 for v in preferences.values() if v)
                details += f", التفضيلات النشطة: {active_prefs}/4"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار الاشتراك العام في الإشعارات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار الاشتراك العام في الإشعارات", False, f"خطأ: {str(e)}")
            return False

    def test_admin_get_subscribers(self):
        """اختبار جلب قائمة المشتركين للأدمن"""
        if not self.admin_token:
            self.log_test("اختبار جلب قائمة المشتركين", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/admin/subscribers",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد المشتركين: {len(data)}"
                
                if data:
                    # التحقق من بنية البيانات
                    first_subscriber = data[0]
                    required_fields = ['id', 'email', 'name', 'subscription_date', 'is_active']
                    missing_fields = [field for field in required_fields if field not in first_subscriber]
                    
                    if missing_fields:
                        details += f", حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                    else:
                        active_count = sum(1 for sub in data if sub.get('is_active', False))
                        details += f", النشطون: {active_count}, غير النشطين: {len(data) - active_count}"
                else:
                    details += " (لا يوجد مشتركون)"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب قائمة المشتركين", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب قائمة المشتركين", False, f"خطأ: {str(e)}")
            return False

    def test_admin_subscribers_stats(self):
        """اختبار إحصائيات المشتركين للأدمن"""
        if not self.admin_token:
            self.log_test("اختبار إحصائيات المشتركين", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/admin/subscribers/stats",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"إجمالي المشتركين: {data.get('total_subscribers', 0)}, النشطون: {data.get('active_subscribers', 0)}"
                
                # التحقق من وجود البيانات الأساسية
                required_fields = ['total_subscribers', 'active_subscribers', 'inactive_subscribers']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    details += f", حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                else:
                    details += f", غير النشطين: {data.get('inactive_subscribers', 0)}"
                    
                    # إحصائيات إضافية
                    if 'stage_distribution' in data:
                        stage_count = len(data['stage_distribution'])
                        details += f", توزيع المراحل: {stage_count} مرحلة"
                    
                    if 'region_distribution' in data:
                        region_count = len(data['region_distribution'])
                        details += f", توزيع المحافظات: {region_count} محافظة"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار إحصائيات المشتركين", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إحصائيات المشتركين", False, f"خطأ: {str(e)}")
            return False

    def test_admin_update_subscriber(self):
        """اختبار تحديث بيانات مشترك"""
        if not self.admin_token or not self.test_subscriber_id:
            self.log_test("اختبار تحديث بيانات مشترك", False, "لا يوجد توكن أدمن أو معرف مشترك")
            return False
            
        try:
            update_data = {
                "name": "أحمد محمد علي المحدث",
                "phone": "01098765432",
                "educational_stage": "الدبلومات الفنية",
                "region": "الجيزة",
                "notification_preferences": {
                    "new_results": True,
                    "system_updates": False,
                    "educational_content": True,
                    "emergency_notifications": True
                },
                "is_active": True
            }
            
            response = requests.put(
                f"{self.api_url}/admin/subscribers/{self.test_subscriber_id}",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث المشترك: {data.get('name')}, المرحلة الجديدة: {data.get('educational_stage')}"
                
                # التحقق من تحديث التفضيلات
                preferences = data.get('notification_preferences', {})
                active_prefs = sum(1 for v in preferences.values() if v)
                details += f", التفضيلات النشطة: {active_prefs}/4"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث بيانات مشترك", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث بيانات مشترك", False, f"خطأ: {str(e)}")
            return False

    def test_admin_create_notification(self):
        """اختبار إنشاء إشعار جديد"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء إشعار جديد", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            notification_data = {
                "title": "إعلان نتائج الثانوية العامة 2024",
                "content": """
تم الإعلان عن نتائج الثانوية العامة للعام الدراسي 2024.

## تفاصيل مهمة:
- يمكن الاستعلام عن النتائج من خلال الموقع الرسمي
- تأكد من إدخال رقم الجلوس بشكل صحيح
- النتائج متاحة على مدار 24 ساعة

## للاستفسارات:
تواصل مع الإدارة المختصة أو زر أقرب مدرسة.

نتمنى لجميع الطلاب التوفيق والنجاح.
                """,
                "summary": "تم الإعلان عن نتائج الثانوية العامة 2024. يمكن الاستعلام عن النتائج من خلال الموقع الرسمي.",
                "notification_type": "new_results",
                "priority": "high",
                "target_audience": "stage",
                "target_stage": "الثانوية العامة",
                "send_immediately": False,
                "email_template": "default"
            }
            
            response = requests.post(
                f"{self.api_url}/admin/notifications",
                json=notification_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_notification_id = data.get('id')
                details = f"تم إنشاء الإشعار: {data.get('title')[:50]}..., المعرف: {self.test_notification_id}"
                details += f", النوع: {data.get('notification_type')}, الأولوية: {data.get('priority')}"
                details += f", الحالة: {data.get('status')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء إشعار جديد", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء إشعار جديد", False, f"خطأ: {str(e)}")
            return False

    def test_admin_get_notifications(self):
        """اختبار جلب قائمة الإشعارات للأدمن"""
        if not self.admin_token:
            self.log_test("اختبار جلب قائمة الإشعارات", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/admin/notifications",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد الإشعارات: {len(data)}"
                
                if data:
                    # التحقق من بنية البيانات
                    first_notification = data[0]
                    required_fields = ['id', 'title', 'content', 'notification_type', 'status', 'created_at']
                    missing_fields = [field for field in required_fields if field not in first_notification]
                    
                    if missing_fields:
                        details += f", حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                    else:
                        # إحصائيات الحالة
                        status_counts = {}
                        for notification in data:
                            status = notification.get('status', 'unknown')
                            status_counts[status] = status_counts.get(status, 0) + 1
                        
                        status_summary = ", ".join([f"{status}: {count}" for status, count in status_counts.items()])
                        details += f", الحالات: {status_summary}"
                        
                        # إحصائيات الأولوية
                        high_priority = sum(1 for n in data if n.get('priority') == 'high')
                        details += f", عالية الأولوية: {high_priority}"
                else:
                    details += " (لا توجد إشعارات)"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب قائمة الإشعارات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب قائمة الإشعارات", False, f"خطأ: {str(e)}")
            return False

    def test_admin_update_notification(self):
        """اختبار تحديث إشعار"""
        if not self.admin_token or not self.test_notification_id:
            self.log_test("اختبار تحديث إشعار", False, "لا يوجد توكن أدمن أو معرف إشعار")
            return False
            
        try:
            update_data = {
                "title": "إعلان نتائج الثانوية العامة 2024 - محدث",
                "summary": "تم الإعلان عن نتائج الثانوية العامة 2024. يمكن الاستعلام عن النتائج من خلال الموقع الرسمي. تحديث: إضافة روابط مباشرة للاستعلام.",
                "priority": "urgent",
                "target_audience": "all",
                "send_immediately": True
            }
            
            response = requests.put(
                f"{self.api_url}/admin/notifications/{self.test_notification_id}",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث الإشعار: {data.get('title')[:50]}..., الأولوية الجديدة: {data.get('priority')}"
                details += f", الجمهور المستهدف: {data.get('target_audience')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث إشعار", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث إشعار", False, f"خطأ: {str(e)}")
            return False

    def test_admin_send_notification(self):
        """اختبار إرسال إشعار"""
        if not self.admin_token or not self.test_notification_id:
            self.log_test("اختبار إرسال إشعار", False, "لا يوجد توكن أدمن أو معرف إشعار")
            return False
            
        try:
            response = requests.post(
                f"{self.api_url}/admin/notifications/{self.test_notification_id}/send",
                headers=self.get_auth_headers(),
                timeout=15  # وقت أطول لعملية الإرسال
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم إرسال الإشعار: {data.get('message', 'غير محدد')}"
                details += f", عدد المرسل إليهم: {data.get('sent_count', 0)}"
                details += f", الأخطاء: {data.get('failed_count', 0)}"
                
                # التحقق من تحديث حالة الإشعار
                if data.get('status') == 'sent':
                    details += ", الحالة: تم الإرسال"
                elif data.get('status') == 'sending':
                    details += ", الحالة: جاري الإرسال"
                else:
                    details += f", الحالة: {data.get('status', 'غير محدد')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إرسال إشعار", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إرسال إشعار", False, f"خطأ: {str(e)}")
            return False

    def test_public_unsubscribe(self):
        """اختبار إلغاء الاشتراك العام"""
        if not self.test_unsubscribe_token:
            self.log_test("اختبار إلغاء الاشتراك العام", False, "لا يوجد توكن إلغاء اشتراك")
            return False
            
        try:
            response = requests.post(
                f"{self.api_url}/unsubscribe/{self.test_unsubscribe_token}",
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم إلغاء الاشتراك بنجاح: {data.get('message', 'غير محدد')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إلغاء الاشتراك العام", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إلغاء الاشتراك العام", False, f"خطأ: {str(e)}")
            return False

    def test_notification_system_security(self):
        """اختبار حماية نظام الإشعارات"""
        protected_endpoints = [
            ("GET", "/admin/subscribers", "جلب المشتركين"),
            ("GET", "/admin/subscribers/stats", "إحصائيات المشتركين"),
            ("PUT", "/admin/subscribers/test_id", "تحديث مشترك"),
            ("DELETE", "/admin/subscribers/test_id", "حذف مشترك"),
            ("GET", "/admin/notifications", "جلب الإشعارات"),
            ("POST", "/admin/notifications", "إنشاء إشعار"),
            ("PUT", "/admin/notifications/test_id", "تحديث إشعار"),
            ("POST", "/admin/notifications/test_id/send", "إرسال إشعار"),
            ("DELETE", "/admin/notifications/test_id", "حذف إشعار")
        ]
        
        all_passed = True
        
        for method, endpoint, description in protected_endpoints:
            try:
                url = f"{self.api_url}{endpoint}"
                
                if method == "GET":
                    response = requests.get(url, timeout=10)
                elif method == "POST":
                    response = requests.post(url, json={}, timeout=10)
                elif method == "PUT":
                    response = requests.put(url, json={}, timeout=10)
                elif method == "DELETE":
                    response = requests.delete(url, timeout=10)
                
                # نتوقع 401 (Unauthorized) أو 403 (Forbidden)
                success = response.status_code in [401, 403]
                details = f"كود الحالة: {response.status_code} (متوقع: 401/403)"
                
                if not success:
                    all_passed = False
                    
                self.log_test(f"اختبار حماية الإشعارات - {description}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار حماية الإشعارات - {description}", False, f"خطأ: {str(e)}")
                all_passed = False
        
        return all_passed

    def run_notification_tests(self):
        """تشغيل جميع اختبارات نظام الإشعارات"""
        print("🚀 بدء اختبار نظام الإشعارات - Notification System Testing")
        print("=" * 60)
        print(f"URL الأساسي: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("=" * 60)
        print()

        # تشغيل الاختبارات بالتسلسل
        tests = [
            # اختبار تسجيل الدخول
            self.admin_login,
            
            # اختبارات الاشتراك العامة
            self.test_public_subscribe,
            
            # اختبارات إدارة المشتركين
            self.test_admin_get_subscribers,
            self.test_admin_subscribers_stats,
            self.test_admin_update_subscriber,
            
            # اختبارات إدارة الإشعارات
            self.test_admin_create_notification,
            self.test_admin_get_notifications,
            self.test_admin_update_notification,
            self.test_admin_send_notification,
            
            # اختبارات الحماية
            self.test_notification_system_security,
            
            # اختبارات إلغاء الاشتراك
            self.test_public_unsubscribe,
        ]

        for test in tests:
            test()

        # النتائج النهائية
        print("=" * 60)
        print("📊 ملخص النتائج:")
        print(f"إجمالي الاختبارات: {self.tests_run}")
        print(f"نجح: {self.tests_passed}")
        print(f"فشل: {self.tests_run - self.tests_passed}")
        print(f"معدل النجاح: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print("=" * 60)

        return self.tests_passed == self.tests_run

def main():
    """الدالة الرئيسية"""
    tester = NotificationTester()
    success = tester.run_notification_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())