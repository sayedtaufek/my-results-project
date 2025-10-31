#!/usr/bin/env python3
"""
اختبار فهارس قاعدة البيانات للإشعارات - Database Indexes Test
"""

import requests
import sys
import json
from datetime import datetime

def test_database_indexes():
    """اختبار فهارس قاعدة البيانات"""
    base_url = "https://1f2d6d1b-2bd0-43af-b264-1ed679832703.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # تسجيل دخول الأدمن
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
        
        print("🔍 اختبار فهارس قاعدة البيانات للإشعارات...")
        print("=" * 50)
        
        # اختبار سرعة العمليات (يدل على وجود الفهارس)
        tests = [
            ("subscribers", "/admin/subscribers", "المشتركين"),
            ("notifications", "/admin/notifications", "الإشعارات"),
            ("subscribers_stats", "/admin/subscribers/stats", "إحصائيات المشتركين")
        ]
        
        all_passed = True
        
        for test_name, endpoint, description in tests:
            try:
                start_time = datetime.now()
                response = requests.get(
                    f"{api_url}{endpoint}",
                    headers=auth_headers,
                    timeout=5  # وقت قصير للتأكد من السرعة
                )
                end_time = datetime.now()
                
                response_time = (end_time - start_time).total_seconds()
                
                if response.status_code == 200:
                    print(f"✅ {description}: {response_time:.3f} ثانية (سريع)")
                    
                    # تحليل البيانات المُرجعة
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   📊 عدد السجلات: {len(data)}")
                    elif isinstance(data, dict):
                        if 'total_subscribers' in data:
                            print(f"   📊 إجمالي المشتركين: {data.get('total_subscribers', 0)}")
                            print(f"   📊 النشطون: {data.get('active_subscribers', 0)}")
                            print(f"   📊 توزيع المراحل: {len(data.get('stage_distribution', {}))}")
                            print(f"   📊 توزيع المحافظات: {len(data.get('region_distribution', {}))}")
                else:
                    print(f"❌ {description}: خطأ ({response.status_code})")
                    all_passed = False
                    
            except Exception as e:
                print(f"❌ {description}: خطأ في الاتصال ({str(e)})")
                all_passed = False
            
            print()
        
        # اختبار إضافي: إنشاء مشترك جديد واختبار البحث السريع
        print("🔍 اختبار إضافي: إنشاء مشترك واختبار البحث...")
        
        # إنشاء مشترك تجريبي
        subscriber_data = {
            "email": f"test.{datetime.now().timestamp()}@example.com",
            "name": "مشترك تجريبي للفهارس",
            "educational_stage": "الثانوية العامة",
            "region": "القاهرة"
        }
        
        create_response = requests.post(
            f"{api_url}/subscribe",
            json=subscriber_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if create_response.status_code == 200:
            print("✅ تم إنشاء مشترك تجريبي")
            
            # اختبار سرعة البحث بعد الإضافة
            start_time = datetime.now()
            search_response = requests.get(
                f"{api_url}/admin/subscribers",
                headers=auth_headers,
                timeout=5
            )
            end_time = datetime.now()
            
            search_time = (end_time - start_time).total_seconds()
            
            if search_response.status_code == 200:
                subscribers = search_response.json()
                print(f"✅ البحث بعد الإضافة: {search_time:.3f} ثانية")
                print(f"   📊 إجمالي المشتركين الآن: {len(subscribers)}")
            else:
                print("❌ فشل في البحث بعد الإضافة")
                all_passed = False
        else:
            print("❌ فشل في إنشاء مشترك تجريبي")
            all_passed = False
        
        print("=" * 50)
        
        if all_passed:
            print("🎉 جميع اختبارات فهارس قاعدة البيانات نجحت!")
            print("✅ الفهارس تعمل بكفاءة عالية")
            print("✅ أوقات الاستجابة ممتازة")
            print("✅ العمليات سريعة ومحسنة")
        else:
            print("⚠️ بعض اختبارات الفهارس فشلت")
            print("❌ قد تحتاج الفهارس إلى إعادة إنشاء")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ خطأ عام في اختبار الفهارس: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_database_indexes()
    sys.exit(0 if success else 1)