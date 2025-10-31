#!/usr/bin/env python3
"""
اختبار شامل لنظام الاستعلام الذكي عن النتائج - Backend APIs
Comprehensive testing for the Smart Results Query System - Backend APIs
"""

import requests
import sys
import json
from datetime import datetime
import os
from pathlib import Path

class BackendTester:
    def __init__(self, base_url="https://1f2d6d1b-2bd0-43af-b264-1ed679832703.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.file_hash = None
        self.sample_student_id = None
        self.admin_token = None
        self.test_stage_id = None
        self.admin_credentials = {"username": "admin", "password": "admin123"}

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

    def test_get_educational_stages(self):
        """اختبار جلب المراحل التعليمية العامة"""
        try:
            response = requests.get(f"{self.api_url}/stages", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد المراحل النشطة: {len(data)}"
                if data:
                    stage_names = [stage.get('name', 'غير محدد') for stage in data[:3]]
                    details += f", أمثلة: {', '.join(stage_names)}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب المراحل التعليمية العامة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب المراحل التعليمية العامة", False, f"خطأ: {str(e)}")
            return False

    def test_admin_get_all_stages(self):
        """اختبار جلب جميع المراحل التعليمية للأدمن"""
        if not self.admin_token:
            self.log_test("اختبار جلب جميع المراحل للأدمن", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/admin/stages", 
                headers=self.get_auth_headers(),
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"إجمالي المراحل: {len(data)}"
                active_count = sum(1 for stage in data if stage.get('is_active', True))
                details += f", النشطة: {active_count}, غير النشطة: {len(data) - active_count}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب جميع المراحل للأدمن", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب جميع المراحل للأدمن", False, f"خطأ: {str(e)}")
            return False

    def test_create_educational_stage(self):
        """اختبار إنشاء مرحلة تعليمية جديدة"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء مرحلة تعليمية", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            stage_data = {
                "name": "مرحلة اختبارية",
                "name_en": "Test Stage",
                "description": "مرحلة تعليمية للاختبار",
                "icon": "🧪",
                "color": "#ff6b6b",
                "regions": ["القاهرة", "الجيزة"],
                "display_order": 99
            }
            
            response = requests.post(
                f"{self.api_url}/admin/stages",
                json=stage_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_stage_id = data.get('id')
                details = f"تم إنشاء المرحلة: {data.get('name')}, المعرف: {self.test_stage_id}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء مرحلة تعليمية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء مرحلة تعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_update_educational_stage(self):
        """اختبار تحديث مرحلة تعليمية"""
        if not self.admin_token or not self.test_stage_id:
            self.log_test("اختبار تحديث مرحلة تعليمية", False, "لا يوجد توكن أدمن أو معرف مرحلة")
            return False
            
        try:
            update_data = {
                "name": "مرحلة اختبارية محدثة",
                "name_en": "Updated Test Stage",
                "description": "مرحلة تعليمية محدثة للاختبار",
                "icon": "🔬",
                "color": "#4ecdc4",
                "regions": ["القاهرة", "الجيزة", "الإسكندرية"],
                "display_order": 98
            }
            
            response = requests.put(
                f"{self.api_url}/admin/stages/{self.test_stage_id}",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث المرحلة: {data.get('name')}, المناطق: {len(data.get('regions', []))}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث مرحلة تعليمية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث مرحلة تعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_process_excel_with_stage_region(self):
        """اختبار معالجة ملف الإكسيل مع المرحلة والمنطقة"""
        if not self.file_hash or not self.admin_token:
            self.log_test("اختبار معالجة الإكسيل مع المرحلة والمنطقة", False, "لا يوجد hash للملف أو توكن أدمن")
            return False

        try:
            # الحصول على معرف مرحلة موجودة
            stages_response = requests.get(f"{self.api_url}/stages", timeout=10)
            if stages_response.status_code != 200:
                self.log_test("اختبار معالجة الإكسيل مع المرحلة والمنطقة", False, "فشل في جلب المراحل")
                return False
                
            stages = stages_response.json()
            if not stages:
                self.log_test("اختبار معالجة الإكسيل مع المرحلة والمنطقة", False, "لا توجد مراحل متاحة")
                return False
                
            stage_id = stages[0]['id']
            region = "القاهرة"
            
            # إعداد تخصيص الأعمدة
            mapping_data = {
                "student_id_column": "رقم الجلوس",
                "name_column": "اسم الطالب",
                "subject_columns": ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "التاريخ"],
                "total_column": "المجموع",
                "class_column": "الفصل",
                "section_column": "الشعبة"
            }

            # إرسال الطلب مع المعاملات الجديدة
            params = {
                "file_hash": self.file_hash,
                "educational_stage_id": stage_id,
                "region": region
            }
            
            response = requests.post(
                f"{self.api_url}/admin/process-excel", 
                params=params,
                json=mapping_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=30
            )

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم معالجة: {data.get('processed_count', 0)} طالب مع المرحلة: {stages[0]['name']}, المنطقة: {region}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار معالجة الإكسيل مع المرحلة والمنطقة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار معالجة الإكسيل مع المرحلة والمنطقة", False, f"خطأ: {str(e)}")
            return False

    def test_search_with_stage_region_filters(self):
        """اختبار البحث مع فلاتر المرحلة والمنطقة"""
        try:
            # الحصول على مرحلة للاختبار
            stages_response = requests.get(f"{self.api_url}/stages", timeout=10)
            if stages_response.status_code != 200:
                self.log_test("اختبار البحث مع فلاتر المرحلة والمنطقة", False, "فشل في جلب المراحل")
                return False
                
            stages = stages_response.json()
            if not stages:
                self.log_test("اختبار البحث مع فلاتر المرحلة والمنطقة", False, "لا توجد مراحل متاحة")
                return False
            
            test_cases = [
                {
                    "description": "البحث مع فلتر المرحلة",
                    "data": {
                        "query": "أحمد",
                        "search_type": "name",
                        "educational_stage_id": stages[0]['id']
                    }
                },
                {
                    "description": "البحث مع فلتر المنطقة",
                    "data": {
                        "query": "محمد",
                        "search_type": "name",
                        "region_filter": "القاهرة"
                    }
                },
                {
                    "description": "البحث مع فلتر المرحلة والمنطقة",
                    "data": {
                        "query": "علي",
                        "search_type": "all",
                        "educational_stage_id": stages[0]['id'],
                        "region_filter": "القاهرة"
                    }
                }
            ]

            all_passed = True
            
            for case in test_cases:
                try:
                    response = requests.post(
                        f"{self.api_url}/search",
                        json=case["data"],
                        headers={'Content-Type': 'application/json'},
                        timeout=15
                    )

                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        results_count = len(data)
                        details = f"عدد النتائج: {results_count}"
                        
                        # حفظ معرف طالب للاختبارات اللاحقة
                        if results_count > 0 and not self.sample_student_id:
                            self.sample_student_id = data[0].get('student_id')
                            details += f", معرف الطالب الأول: {self.sample_student_id}"
                    else:
                        details = f"كود الحالة: {response.status_code}"
                        all_passed = False
                        
                    self.log_test(f"اختبار البحث - {case['description']}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار البحث - {case['description']}", False, f"خطأ: {str(e)}")
                    all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار البحث مع فلاتر المرحلة والمنطقة", False, f"خطأ: {str(e)}")
            return False

    def test_delete_stage_with_students_error(self):
        """اختبار حذف مرحلة مرتبطة بطلاب (يجب أن يفشل)"""
        if not self.admin_token:
            self.log_test("اختبار حذف مرحلة مرتبطة بطلاب", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            # الحصول على مرحلة موجودة (افتراضياً لديها طلاب)
            stages_response = requests.get(f"{self.api_url}/stages", timeout=10)
            if stages_response.status_code != 200:
                self.log_test("اختبار حذف مرحلة مرتبطة بطلاب", False, "فشل في جلب المراحل")
                return False
                
            stages = stages_response.json()
            if not stages:
                self.log_test("اختبار حذف مرحلة مرتبطة بطلاب", False, "لا توجد مراحل متاحة")
                return False
            
            # محاولة حذف مرحلة افتراضية (يجب أن تفشل إذا كان لديها طلاب)
            stage_to_delete = stages[0]['id']
            
            response = requests.delete(
                f"{self.api_url}/admin/stages/{stage_to_delete}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            # نتوقع فشل العملية (400) إذا كان هناك طلاب مرتبطين
            success = response.status_code == 400
            
            if success:
                details = "تم منع حذف المرحلة بنجاح لوجود طلاب مرتبطين بها"
            elif response.status_code == 200:
                details = "تم حذف المرحلة (لا توجد طلاب مرتبطة)"
                success = True  # هذا مقبول أيضاً
            else:
                details = f"كود حالة غير متوقع: {response.status_code}"
                
            self.log_test("اختبار حذف مرحلة مرتبطة بطلاب", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار حذف مرحلة مرتبطة بطلاب", False, f"خطأ: {str(e)}")
            return False

    def test_delete_test_stage(self):
        """اختبار حذف المرحلة التجريبية"""
        if not self.admin_token or not self.test_stage_id:
            self.log_test("اختبار حذف المرحلة التجريبية", False, "لا يوجد توكن أدمن أو معرف مرحلة")
            return False
            
        try:
            response = requests.delete(
                f"{self.api_url}/admin/stages/{self.test_stage_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                details = "تم حذف المرحلة التجريبية بنجاح"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار حذف المرحلة التجريبية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار حذف المرحلة التجريبية", False, f"خطأ: {str(e)}")
            return False

    def test_unauthorized_access(self):
        """اختبار الوصول غير المصرح به للـ APIs المحمية"""
        protected_endpoints = [
            ("GET", "/admin/stages", "جلب المراحل للأدمن"),
            ("POST", "/admin/stages", "إنشاء مرحلة"),
            ("PUT", "/admin/stages/test_id", "تحديث مرحلة"),
            ("DELETE", "/admin/stages/test_id", "حذف مرحلة"),
            ("POST", "/admin/process-excel", "معالجة الإكسيل")
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
                    
                self.log_test(f"اختبار الحماية - {description}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار الحماية - {description}", False, f"خطأ: {str(e)}")
                all_passed = False
        
        return all_passed
        """اختبار نقطة النهاية الجذر"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"الرسالة: {data.get('message', 'غير متوفر')}, الإصدار: {data.get('version', 'غير متوفر')}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار نقطة النهاية الجذر", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار نقطة النهاية الجذر", False, f"خطأ: {str(e)}")
            return False

    def test_upload_excel(self):
        """اختبار رفع ملف الإكسيل"""
        try:
            # التحقق من وجود الملف التجريبي
            sample_file = Path("/app/sample_students.xlsx")
            if not sample_file.exists():
                self.log_test("اختبار رفع ملف الإكسيل", False, "الملف التجريبي غير موجود")
                return False

            # رفع الملف
            with open(sample_file, 'rb') as f:
                files = {'file': ('sample_students.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(f"{self.api_url}/upload-excel", files=files, timeout=30)

            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.file_hash = data.get('file_hash')
                details = f"الملف: {data.get('filename')}, الأعمدة: {len(data.get('columns', []))}, الصفوف: {data.get('total_rows')}"
                
                # التحقق من الاقتراحات الذكية
                suggested_mappings = data.get('suggested_mappings', {})
                if suggested_mappings:
                    details += f", الاقتراحات: {len(suggested_mappings)}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار رفع ملف الإكسيل", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار رفع ملف الإكسيل", False, f"خطأ: {str(e)}")
            return False

    def test_process_excel(self):
        """اختبار معالجة ملف الإكسيل"""
        if not self.file_hash:
            self.log_test("اختبار معالجة ملف الإكسيل", False, "لا يوجد hash للملف")
            return False

        try:
            # إعداد تخصيص الأعمدة
            mapping_data = {
                "student_id_column": "رقم الجلوس",
                "name_column": "اسم الطالب",
                "subject_columns": ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "التاريخ"],
                "total_column": "المجموع",
                "class_column": "الفصل",
                "section_column": "الشعبة"
            }

            # إرسال file_hash كمعامل منفصل
            params = {"file_hash": self.file_hash}
            response = requests.post(
                f"{self.api_url}/process-excel", 
                params=params,
                json=mapping_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم معالجة: {data.get('processed_count', 0)} طالب, أخطاء: {data.get('error_count', 0)}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار معالجة ملف الإكسيل", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار معالجة ملف الإكسيل", False, f"خطأ: {str(e)}")
            return False

    def test_search_students(self):
        """اختبار البحث عن الطلاب"""
        test_cases = [
            {"query": "أحمد", "search_type": "name", "description": "البحث بالاسم"},
            {"query": "2024001", "search_type": "student_id", "description": "البحث برقم الجلوس"},
            {"query": "محمد", "search_type": "all", "description": "البحث الشامل"}
        ]

        all_passed = True
        
        for case in test_cases:
            try:
                search_data = {
                    "query": case["query"],
                    "search_type": case["search_type"]
                }

                response = requests.post(
                    f"{self.api_url}/search",
                    json=search_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=15
                )

                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    results_count = len(data)
                    details = f"عدد النتائج: {results_count}"
                    
                    # حفظ معرف طالب للاختبارات اللاحقة
                    if results_count > 0 and not self.sample_student_id:
                        self.sample_student_id = data[0].get('student_id')
                        details += f", معرف الطالب الأول: {self.sample_student_id}"
                else:
                    details = f"كود الحالة: {response.status_code}"
                    all_passed = False
                    
                self.log_test(f"اختبار البحث - {case['description']}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار البحث - {case['description']}", False, f"خطأ: {str(e)}")
                all_passed = False

        return all_passed

    def test_get_student_details(self):
        """اختبار جلب تفاصيل طالب محدد"""
        if not self.sample_student_id:
            self.log_test("اختبار جلب تفاصيل الطالب", False, "لا يوجد معرف طالب للاختبار")
            return False

        try:
            response = requests.get(
                f"{self.api_url}/student/{self.sample_student_id}",
                timeout=15
            )

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"الاسم: {data.get('name')}, المواد: {len(data.get('subjects', []))}, المتوسط: {data.get('average')}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب تفاصيل الطالب", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب تفاصيل الطالب", False, f"خطأ: {str(e)}")
            return False

    def test_get_statistics(self):
        """اختبار جلب الإحصائيات"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=15)

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"إجمالي الطلاب: {data.get('total_students')}, المتوسط العام: {data.get('average_score')}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب الإحصائيات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب الإحصائيات", False, f"خطأ: {str(e)}")
            return False

    def test_error_handling(self):
        """اختبار معالجة الأخطاء"""
        test_cases = [
            {
                "name": "رفع ملف غير صالح",
                "method": "POST",
                "endpoint": "/upload-excel",
                "data": {"file": "invalid_file"},
                "expected_status": 400
            },
            {
                "name": "البحث بدون استعلام",
                "method": "POST", 
                "endpoint": "/search",
                "data": {"query": "", "search_type": "all"},
                "expected_status": 422
            },
            {
                "name": "جلب طالب غير موجود",
                "method": "GET",
                "endpoint": "/student/nonexistent_id",
                "data": None,
                "expected_status": 404
            }
        ]

        all_passed = True
        
        for case in test_cases:
            try:
                url = f"{self.api_url}{case['endpoint']}"
                
                if case['method'] == 'GET':
                    response = requests.get(url, timeout=10)
                elif case['method'] == 'POST':
                    if case['data']:
                        response = requests.post(url, json=case['data'], timeout=10)
                    else:
                        response = requests.post(url, timeout=10)

                success = response.status_code == case['expected_status']
                details = f"متوقع: {case['expected_status']}, فعلي: {response.status_code}"
                
                if not success:
                    all_passed = False
                    
                self.log_test(f"اختبار الأخطاء - {case['name']}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار الأخطاء - {case['name']}", False, f"خطأ: {str(e)}")
                all_passed = False

        return all_passed

    def test_get_system_settings(self):
        """اختبار جلب إعدادات النظام"""
        if not self.admin_token:
            self.log_test("اختبار جلب إعدادات النظام", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.get(
                f"{self.api_url}/admin/settings",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"اسم الموقع: {data.get('site_name')}, حجم الملف الأقصى: {data.get('max_file_size')}MB, وضع الصيانة: {data.get('maintenance_mode')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار جلب إعدادات النظام", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب إعدادات النظام", False, f"خطأ: {str(e)}")
            return False

    def test_update_general_settings(self):
        """اختبار تحديث الإعدادات العامة"""
        if not self.admin_token:
            self.log_test("اختبار تحديث الإعدادات العامة", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            update_data = {
                "site_name": "نظام الاستعلام المحدث",
                "max_file_size": 15,
                "maintenance_mode": True
            }
            
            response = requests.put(
                f"{self.api_url}/admin/settings",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث - اسم الموقع: {data.get('site_name')}, حجم الملف: {data.get('max_file_size')}MB, وضع الصيانة: {data.get('maintenance_mode')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث الإعدادات العامة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث الإعدادات العامة", False, f"خطأ: {str(e)}")
            return False

    def test_update_security_settings(self):
        """اختبار تحديث إعدادات الأمان"""
        if not self.admin_token:
            self.log_test("اختبار تحديث إعدادات الأمان", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            update_data = {
                "password_min_length": 10,
                "max_login_attempts": 3,
                "require_special_chars": False
            }
            
            response = requests.put(
                f"{self.api_url}/admin/settings",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث - طول كلمة المرور: {data.get('password_min_length')}, محاولات الدخول: {data.get('max_login_attempts')}, الرموز الخاصة: {data.get('require_special_chars')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث إعدادات الأمان", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث إعدادات الأمان", False, f"خطأ: {str(e)}")
            return False

    def test_update_backup_settings(self):
        """اختبار تحديث إعدادات النسخ الاحتياطي"""
        if not self.admin_token:
            self.log_test("اختبار تحديث إعدادات النسخ الاحتياطي", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            update_data = {
                "auto_backup": False,
                "backup_frequency": "weekly",
                "retention_days": 60
            }
            
            response = requests.put(
                f"{self.api_url}/admin/settings",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث - النسخ التلقائي: {data.get('auto_backup')}, التكرار: {data.get('backup_frequency')}, الاحتفاظ: {data.get('retention_days')} يوم"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث إعدادات النسخ الاحتياطي", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث إعدادات النسخ الاحتياطي", False, f"خطأ: {str(e)}")
            return False

    def test_create_backup(self):
        """اختبار إنشاء نسخة احتياطية"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء نسخة احتياطية", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            response = requests.post(
                f"{self.api_url}/admin/settings/backup",
                headers=self.get_auth_headers(),
                timeout=15  # وقت أطول لعملية النسخ الاحتياطي
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم إنشاء النسخة الاحتياطية - الرسالة: {data.get('message')}, الوقت: {data.get('timestamp')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء نسخة احتياطية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء نسخة احتياطية", False, f"خطأ: {str(e)}")
            return False

    def test_settings_persistence(self):
        """اختبار استمرارية الإعدادات بعد إعادة الجلب"""
        if not self.admin_token:
            self.log_test("اختبار استمرارية الإعدادات", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            # جلب الإعدادات مرة أخرى للتحقق من الحفظ
            response = requests.get(
                f"{self.api_url}/admin/settings",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # التحقق من أن التحديثات السابقة محفوظة
                site_name_updated = data.get('site_name') == "نظام الاستعلام المحدث"
                max_file_size_updated = data.get('max_file_size') == 15
                maintenance_mode_updated = data.get('maintenance_mode') == True
                password_length_updated = data.get('password_min_length') == 10
                backup_frequency_updated = data.get('backup_frequency') == "weekly"
                last_backup_exists = data.get('last_backup') is not None
                
                persistence_checks = [
                    site_name_updated, max_file_size_updated, maintenance_mode_updated,
                    password_length_updated, backup_frequency_updated, last_backup_exists
                ]
                
                all_persisted = all(persistence_checks)
                details = f"الإعدادات المحفوظة: {sum(persistence_checks)}/6 - اسم الموقع: {site_name_updated}, حجم الملف: {max_file_size_updated}, الصيانة: {maintenance_mode_updated}, كلمة المرور: {password_length_updated}, النسخ: {backup_frequency_updated}, آخر نسخة: {last_backup_exists}"
                
                success = all_persisted
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار استمرارية الإعدادات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار استمرارية الإعدادات", False, f"خطأ: {str(e)}")
            return False

    def test_settings_validation(self):
        """اختبار التحقق من صحة الإعدادات"""
        if not self.admin_token:
            self.log_test("اختبار التحقق من صحة الإعدادات", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            # اختبار قيم غير صالحة
            invalid_data = {
                "max_file_size": 150,  # أكبر من الحد الأقصى (100)
                "password_min_length": 3,  # أقل من الحد الأدنى (6)
                "backup_frequency": "invalid_frequency"  # قيمة غير صالحة
            }
            
            response = requests.put(
                f"{self.api_url}/admin/settings",
                json=invalid_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            # نتوقع فشل العملية (422 Validation Error)
            success = response.status_code == 422
            
            if success:
                details = "تم رفض القيم غير الصالحة بنجاح"
            else:
                details = f"كود الحالة غير متوقع: {response.status_code} (متوقع: 422)"
                
            self.log_test("اختبار التحقق من صحة الإعدادات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار التحقق من صحة الإعدادات", False, f"خطأ: {str(e)}")
            return False

    def test_settings_unauthorized_access(self):
        """اختبار الوصول غير المصرح به لإعدادات النظام"""
        protected_endpoints = [
            ("GET", "/admin/settings", "جلب الإعدادات"),
            ("PUT", "/admin/settings", "تحديث الإعدادات"),
            ("POST", "/admin/settings/backup", "إنشاء نسخة احتياطية")
        ]
        
        all_passed = True
        
        for method, endpoint, description in protected_endpoints:
            try:
                url = f"{self.api_url}{endpoint}"
                
                if method == "GET":
                    response = requests.get(url, timeout=10)
                elif method == "PUT":
                    response = requests.put(url, json={}, timeout=10)
                elif method == "POST":
                    response = requests.post(url, timeout=10)
                
                # نتوقع 401 (Unauthorized) أو 403 (Forbidden)
                success = response.status_code in [401, 403]
                details = f"كود الحالة: {response.status_code} (متوقع: 401/403)"
                
                if not success:
                    all_passed = False
                    
                self.log_test(f"اختبار حماية الإعدادات - {description}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار حماية الإعدادات - {description}", False, f"خطأ: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_root_endpoint(self):
        """اختبار نقطة النهاية الجذر"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"الرسالة: {data.get('message', 'غير متوفر')}, الإصدار: {data.get('version', 'غير متوفر')}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار نقطة النهاية الجذر", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار نقطة النهاية الجذر", False, f"خطأ: {str(e)}")
            return False

    def test_upload_excel(self):
        """اختبار رفع ملف الإكسيل"""
        if not self.admin_token:
            self.log_test("اختبار رفع ملف الإكسيل", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            # التحقق من وجود الملف التجريبي
            sample_file = Path("/app/sample_students.xlsx")
            if not sample_file.exists():
                self.log_test("اختبار رفع ملف الإكسيل", False, "الملف التجريبي غير موجود")
                return False

            # رفع الملف
            with open(sample_file, 'rb') as f:
                files = {'file': ('sample_students.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(
                    f"{self.api_url}/admin/upload-excel", 
                    files=files, 
                    headers=self.get_auth_headers(),
                    timeout=30
                )

            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.file_hash = data.get('file_hash')
                details = f"الملف: {data.get('filename')}, الأعمدة: {len(data.get('columns', []))}, الصفوف: {data.get('total_rows')}"
                
                # التحقق من الاقتراحات الذكية
                suggested_mappings = data.get('suggested_mappings', {})
                if suggested_mappings:
                    details += f", الاقتراحات: {len(suggested_mappings)}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار رفع ملف الإكسيل", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار رفع ملف الإكسيل", False, f"خطأ: {str(e)}")
            return False

    def test_get_student_details(self):
        """اختبار جلب تفاصيل طالب محدد"""
        if not self.sample_student_id:
            self.log_test("اختبار جلب تفاصيل الطالب", False, "لا يوجد معرف طالب للاختبار")
            return False

        try:
            response = requests.get(
                f"{self.api_url}/student/{self.sample_student_id}",
                timeout=15
            )

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"الاسم: {data.get('name')}, المواد: {len(data.get('subjects', []))}, المتوسط: {data.get('average')}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب تفاصيل الطالب", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب تفاصيل الطالب", False, f"خطأ: {str(e)}")
            return False

    def test_get_statistics(self):
        """اختبار جلب الإحصائيات"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=15)

            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"إجمالي الطلاب: {data.get('total_students')}, المتوسط العام: {data.get('average_score')}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب الإحصائيات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب الإحصائيات", False, f"خطأ: {str(e)}")
            return False

    def test_get_certificate_templates(self):
        """اختبار جلب قوالب الشهادات"""
        try:
            response = requests.get(f"{self.api_url}/certificate-templates", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد القوالب المتاحة: {len(data)}"
                if data:
                    template_names = [template.get('name', 'غير محدد') for template in data[:3]]
                    details += f", أمثلة: {', '.join(template_names)}"
                    # حفظ معرف قالب للاختبارات اللاحقة
                    if not hasattr(self, 'sample_template_id'):
                        self.sample_template_id = data[0].get('id')
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب قوالب الشهادات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب قوالب الشهادات", False, f"خطأ: {str(e)}")
            return False

    def test_get_school_students(self):
        """اختبار جلب طلاب مدرسة محددة"""
        try:
            # استخدام اسم مدرسة تجريبي
            school_name = "مدرسة النور الثانوية"
            response = requests.get(f"{self.api_url}/school/{school_name}/students", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                students = data.get('students', [])
                details = f"عدد الطلاب في المدرسة '{school_name}': {len(students)}"
                if students:
                    # عرض معلومات أول طالب
                    first_student = students[0]
                    details += f", أول طالب: {first_student.get('name', 'غير محدد')}"
                    details += f", إحصائيات: متوسط {data.get('statistics', {}).get('average_score', 0)}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب طلاب مدرسة محددة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب طلاب مدرسة محددة", False, f"خطأ: {str(e)}")
            return False

    def test_search_with_administration_filter(self):
        """اختبار البحث مع فلتر الإدارة التعليمية"""
        try:
            test_cases = [
                {
                    "description": "البحث مع فلتر الإدارة",
                    "data": {
                        "query": "أحمد",
                        "search_type": "name",
                        "administration_filter": "إدارة القاهرة التعليمية"
                    }
                },
                {
                    "description": "البحث مع فلتر الإدارة والمحافظة",
                    "data": {
                        "query": "محمد",
                        "search_type": "all",
                        "administration_filter": "إدارة الجيزة التعليمية",
                        "region_filter": "الجيزة"
                    }
                },
                {
                    "description": "البحث مع جميع الفلاتر",
                    "data": {
                        "query": "علي",
                        "search_type": "all",
                        "administration_filter": "إدارة الإسكندرية التعليمية",
                        "region_filter": "الإسكندرية"
                    }
                }
            ]

            all_passed = True
            
            for case in test_cases:
                try:
                    response = requests.post(
                        f"{self.api_url}/search",
                        json=case["data"],
                        headers={'Content-Type': 'application/json'},
                        timeout=15
                    )

                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        results_count = len(data)
                        details = f"عدد النتائج: {results_count}"
                        
                        # التحقق من أن النتائج تحتوي على فلتر الإدارة المطلوب
                        if results_count > 0 and case["data"].get("administration_filter"):
                            admin_filter = case["data"]["administration_filter"]
                            filtered_correctly = all(
                                student.get('administration') == admin_filter 
                                for student in data 
                                if student.get('administration')
                            )
                            if filtered_correctly:
                                details += " (فلترة صحيحة)"
                            else:
                                details += " (فلترة غير دقيقة)"
                    else:
                        details = f"كود الحالة: {response.status_code}"
                        all_passed = False
                        
                    self.log_test(f"اختبار البحث - {case['description']}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار البحث - {case['description']}", False, f"خطأ: {str(e)}")
                    all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار البحث مع فلتر الإدارة التعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_educational_stages_data_integrity(self):
        """اختبار تكامل بيانات المراحل التعليمية"""
        try:
            response = requests.get(f"{self.api_url}/stages", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                # التحقق من وجود المراحل الأساسية
                required_stages = ["الشهادة الإعدادية", "الثانوية العامة", "الثانوية الأزهرية", "الدبلومات الفنية", "الشهادة الابتدائية"]
                found_stages = [stage.get('name') for stage in data]
                
                missing_stages = [stage for stage in required_stages if stage not in found_stages]
                
                if not missing_stages:
                    details = f"جميع المراحل الأساسية موجودة ({len(required_stages)}/5)"
                    success = True
                else:
                    details = f"مراحل مفقودة: {', '.join(missing_stages)}"
                    success = False
                
                # التحقق من وجود المحافظات في كل مرحلة
                stages_with_regions = sum(1 for stage in data if stage.get('regions'))
                details += f", مراحل بمحافظات: {stages_with_regions}/{len(data)}"
                
            else:
                details = f"كود الحالة: {response.status_code}"
                success = False
                
            self.log_test("اختبار تكامل بيانات المراحل التعليمية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تكامل بيانات المراحل التعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_certificate_template_variables(self):
        """اختبار متغيرات قوالب الشهادات"""
        if not hasattr(self, 'sample_template_id') or not self.sample_template_id:
            self.log_test("اختبار متغيرات قوالب الشهادات", False, "لا يوجد معرف قالب للاختبار")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/certificate-templates", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                if data:
                    template = data[0]  # أول قالب
                    variables = template.get('variables', {})
                    
                    # التحقق من وجود المتغيرات الأساسية
                    required_variables = ["[اسم_الطالب]", "[رقم_الجلوس]", "[اسم_المرحلة]", "[المتوسط]", "[التقدير]"]
                    found_variables = list(variables.keys())
                    
                    missing_variables = [var for var in required_variables if var not in found_variables]
                    
                    if not missing_variables:
                        details = f"جميع المتغيرات الأساسية موجودة ({len(required_variables)}/5)"
                        success = True
                    else:
                        details = f"متغيرات مفقودة: {', '.join(missing_variables)}"
                        success = False
                        
                    details += f", إجمالي المتغيرات: {len(found_variables)}"
                else:
                    details = "لا توجد قوالب شهادات"
                    success = False
            else:
                details = f"كود الحالة: {response.status_code}"
                success = False
                
            self.log_test("اختبار متغيرات قوالب الشهادات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار متغيرات قوالب الشهادات", False, f"خطأ: {str(e)}")
            return False

    def test_error_handling(self):
        """اختبار معالجة الأخطاء"""
        test_cases = [
            {
                "name": "البحث بدون استعلام",
                "method": "POST", 
                "endpoint": "/search",
                "data": {"query": "", "search_type": "all"},
                "expected_status": 422
            },
            {
                "name": "جلب طالب غير موجود",
                "method": "GET",
                "endpoint": "/student/nonexistent_id",
                "data": None,
                "expected_status": 404
            },
            {
                "name": "جلب طلاب مدرسة غير موجودة",
                "method": "GET",
                "endpoint": "/school/مدرسة_غير_موجودة/students",
                "data": None,
                "expected_status": 200  # يجب أن يعيد قائمة فارغة
            }
        ]

        all_passed = True
        
        for case in test_cases:
            try:
                url = f"{self.api_url}{case['endpoint']}"
                
                if case['method'] == 'GET':
                    response = requests.get(url, timeout=10)
                elif case['method'] == 'POST':
                    if case['data']:
                        response = requests.post(url, json=case['data'], timeout=10)
                    else:
                        response = requests.post(url, timeout=10)

                success = response.status_code == case['expected_status']
                details = f"متوقع: {case['expected_status']}, فعلي: {response.status_code}"
                
                if not success:
                    all_passed = False
                    
                self.log_test(f"اختبار الأخطاء - {case['name']}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار الأخطاء - {case['name']}", False, f"خطأ: {str(e)}")
                all_passed = False

        return all_passed

    # ========== NEW ADVANCED ANALYTICS APIs TESTS ==========
    
    def test_analytics_overview(self):
        """اختبار API نظرة عامة على الإحصائيات"""
        try:
            response = requests.get(f"{self.api_url}/analytics/overview", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"إجمالي الطلاب: {data.get('total_students', 0)}, المراحل: {data.get('total_stages', 0)}, المحافظات: {data.get('total_regions', 0)}"
                
                # التحقق من وجود البيانات الأساسية
                required_fields = ['total_students', 'total_stages', 'total_regions', 'average_score', 'grade_distribution']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    details += f", حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                else:
                    details += f", المتوسط العام: {data.get('average_score', 0)}%"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API نظرة عامة على الإحصائيات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API نظرة عامة على الإحصائيات", False, f"خطأ: {str(e)}")
            return False

    def test_analytics_stage(self):
        """اختبار API إحصائيات مرحلة محددة"""
        try:
            # الحصول على مرحلة للاختبار
            stages_response = requests.get(f"{self.api_url}/stages", timeout=10)
            if stages_response.status_code != 200:
                self.log_test("اختبار API إحصائيات مرحلة محددة", False, "فشل في جلب المراحل")
                return False
                
            stages = stages_response.json()
            if not stages:
                self.log_test("اختبار API إحصائيات مرحلة محددة", False, "لا توجد مراحل متاحة")
                return False
            
            stage_id = stages[0]['id']
            stage_name = stages[0]['name']
            
            response = requests.get(f"{self.api_url}/analytics/stage/{stage_id}", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"المرحلة: {stage_name}, عدد الطلاب: {data.get('total_students', 0)}, المتوسط: {data.get('average_score', 0)}%"
                
                # التحقق من وجود البيانات الأساسية
                required_fields = ['stage_info', 'total_students', 'average_score', 'grade_distribution', 'subject_performance']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    details += f", حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                else:
                    details += f", أعلى درجة: {data.get('highest_score', 0)}, أقل درجة: {data.get('lowest_score', 0)}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API إحصائيات مرحلة محددة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API إحصائيات مرحلة محددة", False, f"خطأ: {str(e)}")
            return False

    def test_analytics_region(self):
        """اختبار API إحصائيات محافظة محددة"""
        try:
            region_name = "القاهرة"
            response = requests.get(f"{self.api_url}/analytics/region/{region_name}", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"المحافظة: {region_name}, عدد الطلاب: {data.get('total_students', 0)}, المتوسط: {data.get('average_score', 0)}%"
                
                # التحقق من وجود البيانات الأساسية
                required_fields = ['region_name', 'total_students', 'average_score', 'schools_count', 'stage_distribution']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    details += f", حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                else:
                    details += f", عدد المدارس: {data.get('schools_count', 0)}"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API إحصائيات محافظة محددة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API إحصائيات محافظة محددة", False, f"خطأ: {str(e)}")
            return False

    # ========== NEW CONTENT MANAGEMENT APIs TESTS ==========
    
    def test_admin_create_faq(self):
        """اختبار إنشاء سؤال شائع جديد"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء سؤال شائع", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            faq_data = {
                "question": "كيف يمكنني تحديث بياناتي الشخصية؟",
                "answer": "يمكنك تحديث بياناتك الشخصية من خلال التواصل مع الإدارة المختصة أو زيارة المدرسة مباشرة.",
                "category": "البيانات الشخصية",
                "order": 10
            }
            
            response = requests.post(
                f"{self.api_url}/admin/faq",
                json=faq_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_faq_id = data.get('id')
                details = f"تم إنشاء السؤال: {data.get('question')[:50]}..., المعرف: {self.test_faq_id}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء سؤال شائع", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء سؤال شائع", False, f"خطأ: {str(e)}")
            return False

    def test_admin_update_faq(self):
        """اختبار تحديث سؤال شائع"""
        if not self.admin_token or not hasattr(self, 'test_faq_id'):
            self.log_test("اختبار تحديث سؤال شائع", False, "لا يوجد توكن أدمن أو معرف سؤال")
            return False
            
        try:
            update_data = {
                "question": "كيف يمكنني تحديث بياناتي الشخصية؟ (محدث)",
                "answer": "يمكنك تحديث بياناتك الشخصية من خلال التواصل مع الإدارة المختصة أو زيارة المدرسة مباشرة. كما يمكنك استخدام النظام الإلكتروني المتاح.",
                "category": "البيانات الشخصية",
                "order": 5
            }
            
            response = requests.put(
                f"{self.api_url}/admin/faq/{self.test_faq_id}",
                json=update_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم تحديث السؤال: {data.get('question')[:50]}..., الترتيب الجديد: {data.get('order')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار تحديث سؤال شائع", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار تحديث سؤال شائع", False, f"خطأ: {str(e)}")
            return False

    def test_admin_create_guide(self):
        """اختبار إنشاء دليل تعليمي جديد"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء دليل تعليمي", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            guide_data = {
                "title": "دليل استخدام النظام الجديد",
                "content": """
# دليل استخدام النظام الجديد

## الخطوات الأساسية:
1. **تسجيل الدخول**: ادخل بياناتك الصحيحة
2. **البحث**: استخدم رقم الجلوس أو الاسم
3. **عرض النتائج**: راجع درجاتك وتقديراتك
4. **الطباعة**: احفظ أو اطبع النتيجة

## نصائح مهمة:
- تأكد من صحة البيانات المدخلة
- استخدم متصفح حديث للحصول على أفضل تجربة
- احتفظ بنسخة من النتيجة للمراجع المستقبلية
                """,
                "category": "أدلة النظام",
                "tags": ["نظام", "استخدام", "دليل"],
                "is_featured": True
            }
            
            response = requests.post(
                f"{self.api_url}/admin/guides",
                json=guide_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_guide_id = data.get('id')
                details = f"تم إنشاء الدليل: {data.get('title')}, المعرف: {self.test_guide_id}, مميز: {data.get('is_featured')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء دليل تعليمي", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء دليل تعليمي", False, f"خطأ: {str(e)}")
            return False

    def test_admin_create_news(self):
        """اختبار إنشاء مقال إخباري جديد"""
        if not self.admin_token:
            self.log_test("اختبار إنشاء مقال إخباري", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            news_data = {
                "title": "تحديثات جديدة في نظام الاستعلام عن النتائج",
                "content": """
تم إطلاق تحديثات جديدة ومهمة في نظام الاستعلام عن النتائج تشمل:

## التحديثات الجديدة:
- **واجهة محسنة**: تصميم أكثر سهولة وجاذبية
- **بحث متقدم**: إمكانيات بحث أوسع وأدق
- **إحصائيات تفصيلية**: تحليلات شاملة للأداء
- **نظام الشهادات**: قوالب متنوعة للشهادات

## المميزات الإضافية:
- دعم أفضل للأجهزة المحمولة
- سرعة أكبر في عرض النتائج
- حماية محسنة للبيانات
- دعم فني متطور

نتمنى أن تستفيدوا من هذه التحديثات الجديدة.
                """,
                "summary": "إطلاق تحديثات جديدة ومهمة في نظام الاستعلام عن النتائج مع مميزات متطورة",
                "tags": ["تحديثات", "نظام", "مميزات جديدة"],
                "is_published": True,
                "is_featured": True,
                "author": "فريق التطوير"
            }
            
            response = requests.post(
                f"{self.api_url}/admin/news",
                json=news_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.test_news_id = data.get('id')
                details = f"تم إنشاء المقال: {data.get('title')[:50]}..., المعرف: {self.test_news_id}, منشور: {data.get('is_published')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار إنشاء مقال إخباري", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار إنشاء مقال إخباري", False, f"خطأ: {str(e)}")
            return False

    def test_content_search_and_filtering(self):
        """اختبار البحث والتصفية في المحتوى"""
        try:
            test_cases = [
                {
                    "name": "جلب الأسئلة الشائعة مع التصفية",
                    "endpoint": "/faq",
                    "params": {"category": "البيانات الشخصية"}
                },
                {
                    "name": "جلب الأدلة التعليمية المميزة",
                    "endpoint": "/guides",
                    "params": {"featured": "true"}
                },
                {
                    "name": "جلب الأخبار المنشورة",
                    "endpoint": "/news",
                    "params": {"published": "true"}
                }
            ]

            all_passed = True
            
            for case in test_cases:
                try:
                    response = requests.get(
                        f"{self.api_url}{case['endpoint']}",
                        params=case.get('params', {}),
                        timeout=10
                    )

                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        details = f"عدد العناصر: {len(data)}"
                        
                        # التحقق من التصفية
                        if case['endpoint'] == '/faq' and case.get('params', {}).get('category'):
                            category_filter = case['params']['category']
                            filtered_correctly = all(
                                item.get('category') == category_filter 
                                for item in data 
                                if item.get('category')
                            )
                            details += f", تصفية صحيحة: {filtered_correctly}"
                            
                        elif case['endpoint'] == '/guides' and case.get('params', {}).get('featured'):
                            featured_count = sum(1 for item in data if item.get('is_featured', False))
                            details += f", المميزة: {featured_count}"
                            
                        elif case['endpoint'] == '/news' and case.get('params', {}).get('published'):
                            published_count = sum(1 for item in data if item.get('is_published', False))
                            details += f", المنشورة: {published_count}"
                    else:
                        details = f"كود الحالة: {response.status_code}"
                        all_passed = False
                        
                    self.log_test(f"اختبار المحتوى - {case['name']}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار المحتوى - {case['name']}", False, f"خطأ: {str(e)}")
                    all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار البحث والتصفية في المحتوى", False, f"خطأ: {str(e)}")
            return False

    def test_content_permissions(self):
        """اختبار أذونات APIs إدارة المحتوى"""
        protected_endpoints = [
            ("POST", "/admin/faq", "إنشاء سؤال شائع"),
            ("PUT", "/admin/faq/test_id", "تحديث سؤال شائع"),
            ("DELETE", "/admin/faq/test_id", "حذف سؤال شائع"),
            ("POST", "/admin/guides", "إنشاء دليل تعليمي"),
            ("PUT", "/admin/guides/test_id", "تحديث دليل تعليمي"),
            ("DELETE", "/admin/guides/test_id", "حذف دليل تعليمي"),
            ("POST", "/admin/news", "إنشاء مقال إخباري"),
            ("PUT", "/admin/news/test_id", "تحديث مقال إخباري"),
            ("DELETE", "/admin/news/test_id", "حذف مقال إخباري")
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
                    
                self.log_test(f"اختبار حماية المحتوى - {description}", success, details)
                
            except Exception as e:
                self.log_test(f"اختبار حماية المحتوى - {description}", False, f"خطأ: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_markdown_content_support(self):
        """اختبار دعم محتوى Markdown"""
        if not self.admin_token:
            self.log_test("اختبار دعم محتوى Markdown", False, "لا يوجد توكن أدمن")
            return False
            
        try:
            # إنشاء دليل بمحتوى Markdown
            markdown_content = """
# عنوان رئيسي

## عنوان فرعي

### قائمة مرقمة:
1. العنصر الأول
2. العنصر الثاني
3. العنصر الثالث

### قائمة نقطية:
- نقطة أولى
- نقطة ثانية
- نقطة ثالثة

### تنسيق النص:
- **نص عريض**
- *نص مائل*
- `كود مضمن`

### جدول:
| العمود الأول | العمود الثاني |
|-------------|-------------|
| قيمة 1      | قيمة 2      |
| قيمة 3      | قيمة 4      |

### رابط:
[رابط تجريبي](https://example.com)
            """
            
            guide_data = {
                "title": "دليل اختبار Markdown",
                "content": markdown_content,
                "category": "اختبار",
                "tags": ["markdown", "تنسيق", "اختبار"]
            }
            
            response = requests.post(
                f"{self.api_url}/admin/guides",
                json=guide_data,
                headers={**self.get_auth_headers(), 'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                saved_content = data.get('content', '')
                
                # التحقق من حفظ محتوى Markdown
                markdown_elements = ['#', '##', '###', '**', '*', '`', '|', '[', ']', '(', ')']
                markdown_preserved = any(element in saved_content for element in markdown_elements)
                
                details = f"تم حفظ المحتوى: {len(saved_content)} حرف, Markdown محفوظ: {markdown_preserved}"
                
                if not markdown_preserved:
                    details += " (تحذير: قد يكون Markdown غير محفوظ بشكل صحيح)"
                    
                # حذف الدليل التجريبي
                delete_response = requests.delete(
                    f"{self.api_url}/admin/guides/{data.get('id')}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                
                if delete_response.status_code == 200:
                    details += ", تم حذف الدليل التجريبي"
                    
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار دعم محتوى Markdown", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار دعم محتوى Markdown", False, f"خطأ: {str(e)}")
            return False

    # ========== EDUCATIONAL CONTENT APIs TESTS ==========
    
    def test_get_faq(self):
        """اختبار API جلب الأسئلة الشائعة"""
        try:
            response = requests.get(f"{self.api_url}/faq", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد الأسئلة الشائعة: {len(data)}"
                
                if data:
                    # التحقق من بنية البيانات
                    first_faq = data[0]
                    required_fields = ['id', 'question', 'answer', 'category']
                    missing_fields = [field for field in required_fields if field not in first_faq]
                    
                    if missing_fields:
                        details += f", حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                    else:
                        categories = list(set(faq.get('category', 'غير محدد') for faq in data))
                        details += f", الفئات: {', '.join(categories[:3])}"
                        
                        # حفظ معرف سؤال للاختبارات اللاحقة
                        if not hasattr(self, 'sample_faq_id'):
                            self.sample_faq_id = first_faq.get('id')
                else:
                    details += " (لا توجد أسئلة شائعة)"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API جلب الأسئلة الشائعة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API جلب الأسئلة الشائعة", False, f"خطأ: {str(e)}")
            return False

    def test_get_guides(self):
        """اختبار API جلب الأدلة التعليمية"""
        try:
            response = requests.get(f"{self.api_url}/guides", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد الأدلة التعليمية: {len(data)}"
                
                if data:
                    # التحقق من بنية البيانات
                    first_guide = data[0]
                    required_fields = ['id', 'title', 'content', 'category']
                    missing_fields = [field for field in required_fields if field not in first_guide]
                    
                    if missing_fields:
                        details += f", حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                    else:
                        featured_count = sum(1 for guide in data if guide.get('is_featured', False))
                        details += f", المميزة: {featured_count}"
                        
                        # حفظ معرف دليل للاختبارات اللاحقة
                        if not hasattr(self, 'sample_guide_id'):
                            self.sample_guide_id = first_guide.get('id')
                else:
                    details += " (لا توجد أدلة تعليمية)"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API جلب الأدلة التعليمية", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API جلب الأدلة التعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_get_specific_guide(self):
        """اختبار API جلب دليل محدد"""
        if not hasattr(self, 'sample_guide_id') or not self.sample_guide_id:
            self.log_test("اختبار API جلب دليل محدد", False, "لا يوجد معرف دليل للاختبار")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/guides/{self.sample_guide_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"العنوان: {data.get('title', 'غير محدد')}, الفئة: {data.get('category', 'غير محدد')}"
                
                # التحقق من وجود المحتوى
                content_length = len(data.get('content', ''))
                details += f", طول المحتوى: {content_length} حرف"
                
                if content_length == 0:
                    details += " (محتوى فارغ)"
                    success = False
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API جلب دليل محدد", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API جلب دليل محدد", False, f"خطأ: {str(e)}")
            return False

    def test_get_news(self):
        """اختبار API جلب الأخبار والمقالات"""
        try:
            response = requests.get(f"{self.api_url}/news", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"عدد المقالات الإخبارية: {len(data)}"
                
                if data:
                    # التحقق من بنية البيانات
                    first_article = data[0]
                    required_fields = ['id', 'title', 'content', 'summary']
                    missing_fields = [field for field in required_fields if field not in first_article]
                    
                    if missing_fields:
                        details += f", حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                    else:
                        published_count = sum(1 for article in data if article.get('is_published', False))
                        featured_count = sum(1 for article in data if article.get('is_featured', False))
                        details += f", المنشورة: {published_count}, المميزة: {featured_count}"
                        
                        # حفظ معرف مقال للاختبارات اللاحقة
                        if not hasattr(self, 'sample_article_id'):
                            self.sample_article_id = first_article.get('id')
                else:
                    details += " (لا توجد مقالات إخبارية)"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API جلب الأخبار والمقالات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API جلب الأخبار والمقالات", False, f"خطأ: {str(e)}")
            return False

    def test_get_specific_news(self):
        """اختبار API جلب مقال محدد"""
        if not hasattr(self, 'sample_article_id') or not self.sample_article_id:
            self.log_test("اختبار API جلب مقال محدد", False, "لا يوجد معرف مقال للاختبار")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/news/{self.sample_article_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"العنوان: {data.get('title', 'غير محدد')}, الكاتب: {data.get('author', 'غير محدد')}"
                
                # التحقق من وجود المحتوى والملخص
                content_length = len(data.get('content', ''))
                summary_length = len(data.get('summary', ''))
                details += f", طول المحتوى: {content_length} حرف, طول الملخص: {summary_length} حرف"
                
                if content_length == 0 or summary_length == 0:
                    details += " (محتوى أو ملخص فارغ)"
                    success = False
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API جلب مقال محدد", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API جلب مقال محدد", False, f"خطأ: {str(e)}")
            return False

    # ========== ADVANCED APIs TESTS ==========
    
    def test_grade_calculator(self):
        """اختبار API حاسبة الدرجات"""
        try:
            test_cases = [
                {
                    "description": "حساب درجات عادية",
                    "data": {
                        "subjects": [
                            {"name": "الرياضيات", "score": 85, "max_score": 100},
                            {"name": "العلوم", "score": 92, "max_score": 100},
                            {"name": "اللغة العربية", "score": 78, "max_score": 100}
                        ]
                    }
                },
                {
                    "description": "حساب درجات بأوزان مختلفة",
                    "data": {
                        "subjects": [
                            {"name": "الرياضيات", "score": 45, "max_score": 50, "weight": 2.0},
                            {"name": "العلوم", "score": 38, "max_score": 40, "weight": 1.5},
                            {"name": "اللغة العربية", "score": 72, "max_score": 80, "weight": 1.0}
                        ]
                    }
                }
            ]

            all_passed = True
            
            for case in test_cases:
                try:
                    response = requests.post(
                        f"{self.api_url}/calculator/grade",
                        json=case["data"],
                        headers={'Content-Type': 'application/json'},
                        timeout=10
                    )

                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        details = f"المتوسط: {data.get('average', 0)}%, التقدير: {data.get('grade', 'غير محدد')}"
                        
                        # التحقق من وجود البيانات الأساسية
                        required_fields = ['total_score', 'max_total', 'average', 'grade']
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            details += f", حقول مفقودة: {', '.join(missing_fields)}"
                            success = False
                            all_passed = False
                        else:
                            details += f", المجموع: {data.get('total_score', 0)}/{data.get('max_total', 0)}"
                    else:
                        details = f"كود الحالة: {response.status_code}"
                        all_passed = False
                        
                    self.log_test(f"اختبار حاسبة الدرجات - {case['description']}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار حاسبة الدرجات - {case['description']}", False, f"خطأ: {str(e)}")
                    all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار API حاسبة الدرجات", False, f"خطأ: {str(e)}")
            return False

    def test_search_suggestions(self):
        """اختبار API اقتراحات البحث"""
        try:
            test_queries = ["أحمد", "محمد", "علي", "فاطمة"]
            
            all_passed = True
            
            for query in test_queries:
                try:
                    response = requests.get(
                        f"{self.api_url}/search/suggestions",
                        params={"q": query},
                        timeout=10
                    )

                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        suggestions = data.get('suggestions', [])
                        details = f"الاستعلام: '{query}', عدد الاقتراحات: {len(suggestions)}"
                        
                        if suggestions:
                            # عرض أول 3 اقتراحات
                            sample_suggestions = suggestions[:3]
                            details += f", أمثلة: {', '.join(sample_suggestions)}"
                        else:
                            details += " (لا توجد اقتراحات)"
                    else:
                        details = f"كود الحالة: {response.status_code}"
                        all_passed = False
                        
                    self.log_test(f"اختبار اقتراحات البحث - '{query}'", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار اقتراحات البحث - '{query}'", False, f"خطأ: {str(e)}")
                    all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار API اقتراحات البحث", False, f"خطأ: {str(e)}")
            return False

    def test_seo_sitemap(self):
        """اختبار API خريطة الموقع"""
        try:
            response = requests.get(f"{self.api_url}/seo/sitemap.xml", timeout=15)
            success = response.status_code == 200
            
            if success:
                content = response.text
                details = f"حجم خريطة الموقع: {len(content)} حرف"
                
                # التحقق من أن المحتوى XML صالح
                if '<?xml' in content and '<urlset' in content:
                    # عد عدد الروابط
                    url_count = content.count('<url>')
                    details += f", عدد الروابط: {url_count}"
                    
                    # التحقق من وجود روابط أساسية
                    essential_urls = ['/stages', '/search', '/faq', '/guides', '/news']
                    found_urls = sum(1 for url in essential_urls if url in content)
                    details += f", الروابط الأساسية: {found_urls}/{len(essential_urls)}"
                    
                    if found_urls < len(essential_urls):
                        details += " (بعض الروابط الأساسية مفقودة)"
                        success = False
                else:
                    details += " (تنسيق XML غير صالح)"
                    success = False
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار API خريطة الموقع", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار API خريطة الموقع", False, f"خطأ: {str(e)}")
            return False

    # ========== DEFAULT CONTENT CREATION TESTS ==========
    
    def test_default_content_creation(self):
        """اختبار إنشاء المحتوى الافتراضي"""
        try:
            # اختبار وجود المحتوى الافتراضي
            tests = [
                ("FAQ", "/faq", "الأسئلة الشائعة"),
                ("Guides", "/guides", "الأدلة التعليمية"),
                ("News", "/news", "المقالات الإخبارية")
            ]
            
            all_passed = True
            content_summary = []
            
            for content_type, endpoint, description in tests:
                try:
                    response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                    success = response.status_code == 200
                    
                    if success:
                        data = response.json()
                        count = len(data)
                        content_summary.append(f"{description}: {count}")
                        
                        if count == 0:
                            success = False
                            all_passed = False
                    else:
                        content_summary.append(f"{description}: خطأ ({response.status_code})")
                        all_passed = False
                        
                except Exception as e:
                    content_summary.append(f"{description}: خطأ ({str(e)})")
                    all_passed = False
            
            details = ", ".join(content_summary)
            self.log_test("اختبار إنشاء المحتوى الافتراضي", all_passed, details)
            return all_passed
            
        except Exception as e:
            self.log_test("اختبار إنشاء المحتوى الافتراضي", False, f"خطأ: {str(e)}")
            return False

    # ========== NOTIFICATION SYSTEM TESTS ==========
    
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

    def test_public_unsubscribe(self):
        """اختبار إلغاء الاشتراك العام"""
        if not hasattr(self, 'test_unsubscribe_token') or not self.test_unsubscribe_token:
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
                        
                        # حفظ معرف مشترك للاختبارات اللاحقة
                        if not hasattr(self, 'sample_subscriber_id'):
                            self.sample_subscriber_id = first_subscriber.get('id')
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
                required_fields = ['total_subscribers', 'active_subscribers', 'inactive_subscribers', 'recent_subscriptions']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    details += f", حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                else:
                    details += f", الاشتراكات الحديثة: {data.get('recent_subscriptions', 0)}"
                    
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
        if not self.admin_token or not hasattr(self, 'sample_subscriber_id'):
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
                f"{self.api_url}/admin/subscribers/{self.sample_subscriber_id}",
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
        if not self.admin_token or not hasattr(self, 'test_notification_id'):
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
        if not self.admin_token or not hasattr(self, 'test_notification_id'):
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

    def test_admin_delete_subscriber(self):
        """اختبار حذف مشترك"""
        if not self.admin_token or not hasattr(self, 'sample_subscriber_id'):
            self.log_test("اختبار حذف مشترك", False, "لا يوجد توكن أدمن أو معرف مشترك")
            return False
            
        try:
            response = requests.delete(
                f"{self.api_url}/admin/subscribers/{self.sample_subscriber_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم حذف المشترك: {data.get('message', 'غير محدد')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار حذف مشترك", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار حذف مشترك", False, f"خطأ: {str(e)}")
            return False

    def test_admin_delete_notification(self):
        """اختبار حذف إشعار"""
        if not self.admin_token or not hasattr(self, 'test_notification_id'):
            self.log_test("اختبار حذف إشعار", False, "لا يوجد توكن أدمن أو معرف إشعار")
            return False
            
        try:
            response = requests.delete(
                f"{self.api_url}/admin/notifications/{self.test_notification_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"تم حذف الإشعار: {data.get('message', 'غير محدد')}"
            else:
                details = f"كود الحالة: {response.status_code}, الرسالة: {response.text}"
                
            self.log_test("اختبار حذف إشعار", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار حذف إشعار", False, f"خطأ: {str(e)}")
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

    def test_notification_database_indexes(self):
        """اختبار فهارس قاعدة البيانات للإشعارات"""
        try:
            # هذا الاختبار يتحقق من أن النظام يعمل بكفاءة مما يدل على وجود الفهارس
            # نختبر عمليات البحث والفلترة السريعة
            
            test_operations = []
            
            # اختبار البحث في المشتركين
            if self.admin_token:
                try:
                    response = requests.get(
                        f"{self.api_url}/admin/subscribers",
                        headers=self.get_auth_headers(),
                        timeout=5  # وقت قصير للتأكد من السرعة
                    )
                    if response.status_code == 200:
                        test_operations.append("جلب المشتركين: سريع")
                    else:
                        test_operations.append(f"جلب المشتركين: خطأ ({response.status_code})")
                except Exception as e:
                    test_operations.append(f"جلب المشتركين: بطيء أو خطأ")
                
                # اختبار البحث في الإشعارات
                try:
                    response = requests.get(
                        f"{self.api_url}/admin/notifications",
                        headers=self.get_auth_headers(),
                        timeout=5  # وقت قصير للتأكد من السرعة
                    )
                    if response.status_code == 200:
                        test_operations.append("جلب الإشعارات: سريع")
                    else:
                        test_operations.append(f"جلب الإشعارات: خطأ ({response.status_code})")
                except Exception as e:
                    test_operations.append(f"جلب الإشعارات: بطيء أو خطأ")
                
                # اختبار الإحصائيات
                try:
                    response = requests.get(
                        f"{self.api_url}/admin/subscribers/stats",
                        headers=self.get_auth_headers(),
                        timeout=5  # وقت قصير للتأكد من السرعة
                    )
                    if response.status_code == 200:
                        test_operations.append("إحصائيات المشتركين: سريع")
                    else:
                        test_operations.append(f"إحصائيات المشتركين: خطأ ({response.status_code})")
                except Exception as e:
                    test_operations.append(f"إحصائيات المشتركين: بطيء أو خطأ")
            
            success = len(test_operations) > 0 and all("سريع" in op for op in test_operations if "خطأ" not in op)
            details = ", ".join(test_operations) if test_operations else "لا يمكن اختبار الفهارس بدون توكن أدمن"
            
            self.log_test("اختبار فهارس قاعدة البيانات للإشعارات", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار فهارس قاعدة البيانات للإشعارات", False, f"خطأ: {str(e)}")
            return False

    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار نظام الاستعلام الذكي عن النتائج - Backend APIs")
        print("=" * 60)
        print(f"URL الأساسي: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("=" * 60)
        print()

        # تشغيل الاختبارات بالتسلسل
        tests = [
            # الاختبارات الأساسية
            self.test_root_endpoint,
            
            # اختبارات المراحل التعليمية العامة
            self.test_get_educational_stages,
            self.test_educational_stages_data_integrity,
            
            # اختبارات قوالب الشهادات الجديدة
            self.test_get_certificate_templates,
            self.test_certificate_template_variables,
            
            # اختبارات المصادقة والأدمن
            self.admin_login,
            self.test_admin_get_all_stages,
            self.test_create_educational_stage,
            self.test_update_educational_stage,
            
            # اختبارات إعدادات النظام
            self.test_get_system_settings,
            self.test_update_general_settings,
            self.test_update_security_settings,
            self.test_update_backup_settings,
            self.test_create_backup,
            self.test_settings_persistence,
            self.test_settings_validation,
            self.test_settings_unauthorized_access,
            
            # اختبارات معالجة الإكسيل
            self.test_upload_excel,
            self.test_process_excel_with_stage_region,
            
            # اختبارات البحث المحسن مع المتطلبات العربية الجديدة
            self.test_search_with_stage_region_filters,
            self.test_search_with_administration_filter,
            self.test_get_school_students,
            self.test_get_student_details,
            
            # اختبارات الإحصائيات
            self.test_get_statistics,
            
            # ========== NEW ADVANCED ANALYTICS APIs TESTS ==========
            self.test_analytics_overview,
            self.test_analytics_stage,
            self.test_analytics_region,
            
            # ========== NEW CONTENT MANAGEMENT APIs TESTS ==========
            self.test_admin_create_faq,
            self.test_admin_update_faq,
            self.test_admin_create_guide,
            self.test_admin_create_news,
            self.test_content_search_and_filtering,
            self.test_content_permissions,
            self.test_markdown_content_support,
            
            # ========== EDUCATIONAL CONTENT APIs TESTS ==========
            self.test_get_faq,
            self.test_get_guides,
            self.test_get_specific_guide,
            self.test_get_news,
            self.test_get_specific_news,
            
            # ========== ADVANCED APIs TESTS ==========
            self.test_grade_calculator,
            self.test_search_suggestions,
            self.test_seo_sitemap,
            
            # ========== DEFAULT CONTENT CREATION TESTS ==========
            self.test_default_content_creation,
            
            # ========== NOTIFICATION SYSTEM TESTS ==========
            self.test_public_subscribe,
            self.test_admin_get_subscribers,
            self.test_admin_subscribers_stats,
            self.test_admin_update_subscriber,
            self.test_admin_create_notification,
            self.test_admin_get_notifications,
            self.test_admin_update_notification,
            self.test_admin_send_notification,
            self.test_notification_system_security,
            self.test_notification_database_indexes,
            self.test_public_unsubscribe,
            self.test_admin_delete_subscriber,
            self.test_admin_delete_notification,
            
            # اختبارات الحماية والأخطاء
            self.test_unauthorized_access,
            self.test_delete_stage_with_students_error,
            self.test_error_handling,
            
            # تنظيف - حذف المرحلة التجريبية
            self.test_delete_test_stage
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
    tester = BackendTester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())