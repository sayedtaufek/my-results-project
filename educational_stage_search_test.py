#!/usr/bin/env python3
"""
اختبار شامل لوظائف البحث مع فلترة المراحل التعليمية
Comprehensive testing for search functionality with educational stage filtering
"""

import requests
import sys
import json
from datetime import datetime
import os
from pathlib import Path

class EducationalStageSearchTester:
    def __init__(self, base_url="https://1f2d6d1b-2bd0-43af-b264-1ed679832703.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.available_stages = []
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
                self.available_stages = data
                details = f"عدد المراحل النشطة: {len(data)}"
                if data:
                    stage_names = [stage.get('name', 'غير محدد') for stage in data[:3]]
                    details += f", أمثلة: {', '.join(stage_names)}"
                    
                    # التحقق من وجود المراحل الأساسية المطلوبة
                    required_stages = ["الشهادة الإعدادية", "الثانوية العامة", "الثانوية الأزهرية", "الدبلومات الفنية", "الشهادة الابتدائية"]
                    found_stages = [stage.get('name') for stage in data]
                    missing_stages = [stage for stage in required_stages if stage not in found_stages]
                    
                    if not missing_stages:
                        details += " - جميع المراحل الأساسية موجودة"
                    else:
                        details += f" - مراحل مفقودة: {', '.join(missing_stages)}"
                        success = False
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار جلب المراحل التعليمية العامة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار جلب المراحل التعليمية العامة", False, f"خطأ: {str(e)}")
            return False

    def test_search_with_educational_stage_filter(self):
        """اختبار البحث مع فلتر المرحلة التعليمية"""
        if not self.available_stages:
            self.log_test("اختبار البحث مع فلتر المرحلة التعليمية", False, "لا توجد مراحل متاحة للاختبار")
            return False
            
        try:
            all_passed = True
            
            # اختبار البحث مع كل مرحلة تعليمية
            for stage in self.available_stages[:3]:  # اختبار أول 3 مراحل
                stage_id = stage.get('id')
                stage_name = stage.get('name')
                
                test_cases = [
                    {
                        "description": f"البحث بالاسم مع فلتر المرحلة: {stage_name}",
                        "data": {
                            "query": "أحمد",
                            "search_type": "name",
                            "educational_stage_id": stage_id
                        }
                    },
                    {
                        "description": f"البحث برقم الجلوس مع فلتر المرحلة: {stage_name}",
                        "data": {
                            "query": "2024001",
                            "search_type": "student_id",
                            "educational_stage_id": stage_id
                        }
                    },
                    {
                        "description": f"البحث الشامل مع فلتر المرحلة: {stage_name}",
                        "data": {
                            "query": "محمد",
                            "search_type": "all",
                            "educational_stage_id": stage_id
                        }
                    }
                ]
                
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
                            
                            # التحقق من أن جميع النتائج تنتمي للمرحلة المحددة
                            if results_count > 0:
                                correct_stage_filter = all(
                                    student.get('educational_stage_id') == stage_id 
                                    for student in data 
                                    if student.get('educational_stage_id')
                                )
                                if correct_stage_filter:
                                    details += " (فلترة صحيحة)"
                                else:
                                    details += " (فلترة غير دقيقة)"
                                    success = False
                        else:
                            details = f"كود الحالة: {response.status_code}"
                            all_passed = False
                            
                        self.log_test(case['description'], success, details)
                        
                        if not success:
                            all_passed = False
                        
                    except Exception as e:
                        self.log_test(case['description'], False, f"خطأ: {str(e)}")
                        all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار البحث مع فلتر المرحلة التعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_search_suggestions_with_stage_filter(self):
        """اختبار اقتراحات البحث مع فلتر المرحلة والمنطقة"""
        if not self.available_stages:
            self.log_test("اختبار اقتراحات البحث مع فلتر المرحلة", False, "لا توجد مراحل متاحة للاختبار")
            return False
            
        try:
            all_passed = True
            
            # اختبار اقتراحات البحث مع مراحل مختلفة
            for stage in self.available_stages[:2]:  # اختبار أول مرحلتين
                stage_id = stage.get('id')
                stage_name = stage.get('name')
                regions = stage.get('regions', [])
                
                test_cases = [
                    {
                        "description": f"اقتراحات البحث مع المرحلة: {stage_name}",
                        "params": {
                            "query": "أحمد",
                            "stage": stage_id
                        }
                    }
                ]
                
                # إضافة اختبار مع المنطقة إذا كانت متوفرة
                if regions:
                    test_cases.append({
                        "description": f"اقتراحات البحث مع المرحلة والمنطقة: {stage_name} - {regions[0]}",
                        "params": {
                            "query": "محمد",
                            "stage": stage_id,
                            "region": regions[0]
                        }
                    })
                
                for case in test_cases:
                    try:
                        response = requests.get(
                            f"{self.api_url}/search/suggestions",
                            params=case["params"],
                            timeout=10
                        )

                        success = response.status_code == 200
                        
                        if success:
                            data = response.json()
                            
                            # التحقق من أن البيانات المرجعة في تنسيق صحيح (لا تسبب خطأ React)
                            if isinstance(data, list):
                                # التحقق من أن كل عنصر في القائمة هو string أو object صالح
                                valid_format = True
                                for item in data:
                                    if not isinstance(item, (str, dict)):
                                        valid_format = False
                                        break
                                    # إذا كان object، تأكد من وجود خصائص أساسية
                                    if isinstance(item, dict) and 'name' not in item and 'student_id' not in item:
                                        valid_format = False
                                        break
                                
                                if valid_format:
                                    details = f"عدد الاقتراحات: {len(data)}, التنسيق صحيح"
                                else:
                                    details = f"عدد الاقتراحات: {len(data)}, تنسيق غير صحيح"
                                    success = False
                            else:
                                details = f"تنسيق البيانات غير صحيح: {type(data)}"
                                success = False
                        else:
                            details = f"كود الحالة: {response.status_code}"
                            
                        self.log_test(case['description'], success, details)
                        
                        if not success:
                            all_passed = False
                        
                    except Exception as e:
                        self.log_test(case['description'], False, f"خطأ: {str(e)}")
                        all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار اقتراحات البحث مع فلتر المرحلة", False, f"خطأ: {str(e)}")
            return False

    def test_enhanced_search_multiple_filters(self):
        """اختبار البحث المتقدم مع فلاتر متعددة"""
        if not self.available_stages:
            self.log_test("اختبار البحث المتقدم مع فلاتر متعددة", False, "لا توجد مراحل متاحة للاختبار")
            return False
            
        try:
            all_passed = True
            
            # اختبار البحث مع فلاتر متعددة
            for stage in self.available_stages[:2]:  # اختبار أول مرحلتين
                stage_id = stage.get('id')
                stage_name = stage.get('name')
                regions = stage.get('regions', [])
                
                if not regions:
                    continue
                    
                test_cases = [
                    {
                        "description": f"البحث مع المرحلة والمنطقة: {stage_name} - {regions[0]}",
                        "data": {
                            "query": "علي",
                            "search_type": "all",
                            "educational_stage_id": stage_id,
                            "region_filter": regions[0]
                        }
                    },
                    {
                        "description": f"البحث مع المرحلة والمنطقة والإدارة: {stage_name}",
                        "data": {
                            "query": "فاطمة",
                            "search_type": "name",
                            "educational_stage_id": stage_id,
                            "region_filter": regions[0],
                            "administration_filter": f"إدارة {regions[0]} التعليمية"
                        }
                    }
                ]
                
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
                            
                            # التحقق من صحة الفلترة
                            if results_count > 0:
                                filters_correct = True
                                
                                # فحص فلتر المرحلة
                                stage_filter_correct = all(
                                    student.get('educational_stage_id') == stage_id 
                                    for student in data 
                                    if student.get('educational_stage_id')
                                )
                                
                                # فحص فلتر المنطقة
                                region_filter_correct = all(
                                    student.get('region') == case["data"]["region_filter"]
                                    for student in data 
                                    if student.get('region')
                                )
                                
                                if stage_filter_correct and region_filter_correct:
                                    details += " (فلترة صحيحة)"
                                else:
                                    details += " (فلترة غير دقيقة)"
                                    success = False
                        else:
                            details = f"كود الحالة: {response.status_code}"
                            
                        self.log_test(case['description'], success, details)
                        
                        if not success:
                            all_passed = False
                        
                    except Exception as e:
                        self.log_test(case['description'], False, f"خطأ: {str(e)}")
                        all_passed = False

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار البحث المتقدم مع فلاتر متعددة", False, f"خطأ: {str(e)}")
            return False

    def test_educational_stages_data_structure(self):
        """اختبار هيكل بيانات المراحل التعليمية"""
        if not self.available_stages:
            self.log_test("اختبار هيكل بيانات المراحل التعليمية", False, "لا توجد مراحل متاحة للاختبار")
            return False
            
        try:
            all_passed = True
            
            required_fields = ['id', 'name', 'name_en', 'regions', 'is_active', 'display_order']
            
            for stage in self.available_stages:
                stage_name = stage.get('name', 'غير محدد')
                missing_fields = [field for field in required_fields if field not in stage]
                
                if missing_fields:
                    details = f"المرحلة: {stage_name}, حقول مفقودة: {', '.join(missing_fields)}"
                    success = False
                    all_passed = False
                else:
                    regions_count = len(stage.get('regions', []))
                    details = f"المرحلة: {stage_name}, المحافظات: {regions_count}, نشطة: {stage.get('is_active')}"
                    success = True
                    
                    # التحقق من وجود محافظات
                    if regions_count == 0:
                        details += " (تحذير: لا توجد محافظات)"
                
                self.log_test(f"اختبار هيكل بيانات المرحلة: {stage_name}", success, details)

            return all_passed
            
        except Exception as e:
            self.log_test("اختبار هيكل بيانات المراحل التعليمية", False, f"خطأ: {str(e)}")
            return False

    def test_search_api_authentication(self):
        """اختبار أن APIs البحث العامة لا تحتاج مصادقة"""
        try:
            public_endpoints = [
                ("/stages", "GET", "جلب المراحل التعليمية"),
                ("/search", "POST", "البحث عن الطلاب"),
                ("/search/suggestions", "GET", "اقتراحات البحث")
            ]
            
            all_passed = True
            
            for endpoint, method, description in public_endpoints:
                try:
                    url = f"{self.api_url}{endpoint}"
                    
                    if method == "GET":
                        response = requests.get(url, params={"query": "test"}, timeout=10)
                    elif method == "POST":
                        response = requests.post(url, json={"query": "test", "search_type": "all"}, timeout=10)
                    
                    # يجب أن تكون APIs العامة متاحة بدون مصادقة (200 أو 422 للبيانات غير الصحيحة)
                    success = response.status_code in [200, 422]
                    details = f"كود الحالة: {response.status_code} (متوقع: 200 أو 422)"
                    
                    if not success:
                        all_passed = False
                        
                    self.log_test(f"اختبار الوصول العام - {description}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار الوصول العام - {description}", False, f"خطأ: {str(e)}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("اختبار أن APIs البحث العامة لا تحتاج مصادقة", False, f"خطأ: {str(e)}")
            return False

    def test_admin_apis_authentication(self):
        """اختبار أن APIs الأدمن محمية بالمصادقة"""
        try:
            admin_endpoints = [
                ("/admin/stages", "GET", "جلب جميع المراحل للأدمن"),
                ("/admin/stages", "POST", "إنشاء مرحلة جديدة"),
                ("/admin/upload-excel", "POST", "رفع ملف إكسيل")
            ]
            
            all_passed = True
            
            for endpoint, method, description in admin_endpoints:
                try:
                    url = f"{self.api_url}{endpoint}"
                    
                    if method == "GET":
                        response = requests.get(url, timeout=10)
                    elif method == "POST":
                        response = requests.post(url, json={}, timeout=10)
                    
                    # يجب أن تكون APIs الأدمن محمية (401 أو 403)
                    success = response.status_code in [401, 403]
                    details = f"كود الحالة: {response.status_code} (متوقع: 401 أو 403)"
                    
                    if not success:
                        all_passed = False
                        
                    self.log_test(f"اختبار الحماية - {description}", success, details)
                    
                except Exception as e:
                    self.log_test(f"اختبار الحماية - {description}", False, f"خطأ: {str(e)}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("اختبار أن APIs الأدمن محمية بالمصادقة", False, f"خطأ: {str(e)}")
            return False

    def test_recent_searches_compatibility(self):
        """اختبار توافق البحث مع نظام البحثات الأخيرة"""
        try:
            # محاولة البحث وحفظ النتيجة
            search_data = {
                "query": "أحمد محمد",
                "search_type": "name"
            }
            
            if self.available_stages:
                search_data["educational_stage_id"] = self.available_stages[0]["id"]
            
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
                
                # التحقق من أن البيانات المرجعة متوافقة مع نظام البحثات الأخيرة
                if results_count > 0:
                    first_result = data[0]
                    required_fields = ['student_id', 'name']
                    missing_fields = [field for field in required_fields if field not in first_result]
                    
                    if not missing_fields:
                        details = f"عدد النتائج: {results_count}, البيانات متوافقة مع نظام البحثات الأخيرة"
                    else:
                        details = f"عدد النتائج: {results_count}, حقول مفقودة: {', '.join(missing_fields)}"
                        success = False
                else:
                    details = "لا توجد نتائج للاختبار"
            else:
                details = f"كود الحالة: {response.status_code}"
                
            self.log_test("اختبار توافق البحث مع نظام البحثات الأخيرة", success, details)
            return success
            
        except Exception as e:
            self.log_test("اختبار توافق البحث مع نظام البحثات الأخيرة", False, f"خطأ: {str(e)}")
            return False

    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار وظائف البحث مع فلترة المراحل التعليمية")
        print("=" * 80)
        
        # تسجيل دخول الأدمن
        if not self.admin_login():
            print("❌ فشل في تسجيل دخول الأدمن - سيتم تخطي الاختبارات التي تحتاج مصادقة")
        
        # اختبارات أساسية
        self.test_get_educational_stages()
        
        # اختبارات البحث مع فلترة المراحل
        self.test_search_with_educational_stage_filter()
        
        # اختبارات اقتراحات البحث
        self.test_search_suggestions_with_stage_filter()
        
        # اختبارات البحث المتقدم
        self.test_enhanced_search_multiple_filters()
        
        # اختبارات هيكل البيانات
        self.test_educational_stages_data_structure()
        
        # اختبارات المصادقة والأمان
        self.test_search_api_authentication()
        self.test_admin_apis_authentication()
        
        # اختبارات التوافق
        self.test_recent_searches_compatibility()
        
        # النتائج النهائية
        print("=" * 80)
        print(f"📊 النتائج النهائية:")
        print(f"   إجمالي الاختبارات: {self.tests_run}")
        print(f"   الاختبارات الناجحة: {self.tests_passed}")
        print(f"   الاختبارات الفاشلة: {self.tests_run - self.tests_passed}")
        print(f"   معدل النجاح: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 جميع الاختبارات نجحت!")
            return True
        else:
            print("⚠️ بعض الاختبارات فشلت - يرجى مراجعة التفاصيل أعلاه")
            return False

if __name__ == "__main__":
    tester = EducationalStageSearchTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)